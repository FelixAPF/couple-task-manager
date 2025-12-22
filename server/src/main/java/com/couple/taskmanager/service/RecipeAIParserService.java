package com.couple.taskmanager.service;

import com.couple.taskmanager.model.dto.RecipeDto;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class RecipeAIParserService {

    @Value("${gemini.api.key}")
    private String apiKey;

    @Value("${gemini.api.url}")
    private String apiUrl;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper()
            .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

    // STRICT SCHEMA: Defines exactly what Java expects to prevent parsing errors
    private static final String STRICT_JSON_SCHEMA = """
            {
                "name": "Recipe Title",
                "description": "Summary", //Put a description of the recipe and Put instructions here line by line, anything that looks like preparation guide
                "prepTime": 0,  // MUST be an Integer (minutes only, no text)
                "cookTime": 0,  // MUST be an Integer (minutes only, no text)
                "servings": 0,  // MUST be an Integer
                "category": "AUTRE", // Enum: PATES, SANDWICH, BURGER, VIANDE, SANTE, SALADE, POULET, BOEUF, WRAP, SOUPE, FRUITS_DE_MER, ENTREE, POISSON, TREMPETTE, AUTRE
                "basePortionRatio": 0, // Estimate how many people this will fill
                "ingredients": [
                    { 
                        "name": "Ingredient name", //Must start with capital letter
                        "quantity": 1.5, // MUST be a number (Double). If range (1-2), pick average.
                        "unit": "cup/ml/g" // Put textual units here
                    }
                ]
            }
            """;

    // --- 1. FILE UPLOAD ---
    public RecipeDto parseRecipe(MultipartFile file) throws IOException {
        String base64Image = Base64.getEncoder().encodeToString(file.getBytes());
        String mimeType = file.getContentType() != null ? file.getContentType() : "application/octet-stream";

        String promptText;
        if (mimeType.startsWith("video")) {
            promptText = "WATCH this video. Extract the recipe. Translate to French. Output STRICT JSON. Extract the preparation guide and add it in the description. Make sure to estimate how many people this recipe will feed ";
        } else {
            promptText = "Analyze this image. Extract recipe data. Translate to French. Output STRICT JSON.. Extract the preparation guide in the description";
        }

        return callGemini(promptText, mimeType, base64Image, null);
    }

    // --- 2. URL PARSING ---
    public RecipeDto parseRecipeFromUrl(String urlString) {
        try {
            // STEP A: Fetch HTML (Ricardo, Marmiton, etc.)
            String pageText = fetchPageText(urlString);

            if (pageText != null && !pageText.isEmpty()) {
                String prompt = """
                    I have scraped text from a recipe link (%s).
                    1. Analyze the TEXT below.
                    2. Extract the recipe data.
                    3. Translate to French.
                    4. Map it EXACTLY to the provided JSON structure.
                    5. Make sure that ingredients start with capital letters.
                    6. Make sure to estimate how many people this meal will fill under the basePortionRatio
                    
                    PAGE TEXT:
                    %s
                    """.formatted(urlString, pageText.substring(0, Math.min(pageText.length(), 25000)));

                return callGemini(prompt, null, null, null);
            }

            // STEP B: Search Tool Fallback (TikTok/Video)
            String prompt = """
                I have a URL: %s
                1. Use Google Search to find the specific recipe details.
                2. Extract data.
                3. Translate to French.
                4. Map it EXACTLY to the provided JSON structure.
                5. Make sure that ingredients start with capital letters.

                """.formatted(urlString);

            return callGemini(prompt, null, null, "google_search");

        } catch (Exception e) {
            if (e.getMessage().contains("429")) {
                throw new RuntimeException("AI quota exceeded. Please try again later.");
            }
            throw new RuntimeException("Smart Import Failed: " + e.getMessage());
        }
    }

    // --- HELPER: Call Gemini ---
    private RecipeDto callGemini(String prompt, String mimeType, String base64Data, String toolName) {
        try {
            Map<String, Object> requestBody = new HashMap<>();
            Map<String, Object> content = new HashMap<>();

            // Append the STRICT SCHEMA to every prompt
            String finalPrompt = prompt + "\n\nIMPORTANT: Return ONLY raw JSON matching this structure:\n" + STRICT_JSON_SCHEMA;

            Map<String, Object> textPart = Map.of("text", finalPrompt);

            if (base64Data != null) {
                Map<String, Object> filePart = Map.of("inline_data", Map.of("mime_type", mimeType, "data", base64Data));
                content.put("parts", List.of(textPart, filePart));
            } else {
                content.put("parts", List.of(textPart));
            }

            requestBody.put("contents", List.of(content));

            if (toolName != null) {
                requestBody.put("tools", List.of(Map.of(toolName, new HashMap<>())));
            } else {
                requestBody.put("generationConfig", Map.of("response_mime_type", "application/json"));
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            String urlWithKey = apiUrl + "?key=" + apiKey;
            ResponseEntity<String> response = restTemplate.postForEntity(urlWithKey, entity, String.class);

            return cleanAndParseJson(response.getBody());
        } catch (Exception e) {
            if (e instanceof org.springframework.web.client.HttpClientErrorException) {
                System.err.println("Gemini Error: " + ((org.springframework.web.client.HttpClientErrorException) e).getResponseBodyAsString());
            }
            throw new RuntimeException("AI Request Error: " + e.getMessage());
        }
    }

    // --- HELPER: Fetch HTML ---
    private String fetchPageText(String url) {
        try {
            Document doc = Jsoup.connect(url)
                    .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0")
                    .timeout(5000)
                    .get();
            return doc.body().text();
        } catch (Exception e) {
            return null;
        }
    }

    // --- HELPER: Parse JSON ---
    private RecipeDto cleanAndParseJson(String jsonResponse) {
        try {
            Map root = objectMapper.readValue(jsonResponse, Map.class);
            List candidates = (List) root.get("candidates");
            if (candidates == null || candidates.isEmpty()) throw new RuntimeException("No candidates");

            Map firstCandidate = (Map) candidates.get(0);
            Map content = (Map) firstCandidate.get("content");
            List parts = (List) content.get("parts");

            String rawText = "";
            for(Object p : parts) {
                Map part = (Map) p;
                if(part.containsKey("text")) {
                    rawText = (String) part.get("text");
                    break;
                }
            }

            // Cleanup
            String cleanJson = rawText.replace("```json", "").replace("```", "").trim();
            if(cleanJson.contains("{") && cleanJson.contains("}")) {
                cleanJson = cleanJson.substring(cleanJson.indexOf("{"), cleanJson.lastIndexOf("}") + 1);
            }

            return objectMapper.readValue(cleanJson, RecipeDto.class);
        } catch (Exception e) {
            System.err.println("Parse Error. Raw: " + jsonResponse);
            // Throwing a clearer error message
            throw new RuntimeException("Failed to map AI response to Recipe object. Check data types.");
        }
    }
}