package com.couple.taskmanager.service;

import com.couple.taskmanager.model.dto.RecipeDto;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
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

    // NEW: image generation endpoint (Gemini 3 Pro Image / "Nano Banana Pro")
    // Must point to a model ID that supports image output, e.g.:
    // https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent
    @Value("${gemini.imagen.url}")
    private String imagenUrl;

    @Value("${app.base-url}")
    private String baseUrl;

    @Autowired
    private IFileService fileService;

    private final RestTemplate restTemplate = new RestTemplate();

    private final ObjectMapper objectMapper = new ObjectMapper()
            .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false)
            .configure(com.fasterxml.jackson.core.JsonParser.Feature.ALLOW_COMMENTS, true)
            .configure(com.fasterxml.jackson.core.JsonParser.Feature.ALLOW_UNQUOTED_CONTROL_CHARS, true);

    private static final String IMPORT_JSON_SCHEMA = """
            {
                "name": "Recipe Title",
                "description": "Summary and preparation instructions",
                "category": "AUTRE",
                "basePortionRatio": 2,
                "imageUrl": "extracted_image_url_from_source_or_null",
                "ingredients": [
                    { 
                        "name": "Ingredient name",
                        "quantity": 1.5,
                        "unit": "cup/ml/g"
                    }
                ]
            }
            """;

    // NOTE: imageUrl is no longer used as a generation instruction for Gemini —
    // bulk images are now generated directly from the recipe name after parsing.
    // Left as null here since Gemini image gen happens in a separate call.
    private static final String GENERATE_JSON_ARRAY_SCHEMA = """
            [
                {
                    "name": "Recipe Title",
                    "description": "Summary and preparation instructions",
                    "category": "AUTRE",
                    "basePortionRatio": 2,
                    "imageUrl": null,
                    "ingredients": [
                        { 
                            "name": "Ingredient name",
                            "quantity": 1.5,
                            "unit": "cup/ml/g"
                        }
                    ]
                }
            ]
            """;

    public RecipeDto parseRecipe(MultipartFile file) throws IOException {
        String base64Image = Base64.getEncoder().encodeToString(file.getBytes());
        String mimeType = file.getContentType() != null ? file.getContentType() : "application/octet-stream";

        String promptText;
        if (mimeType.startsWith("video")) {
            promptText = "WATCH this video. Extract the recipe. Translate to French. Output STRICT JSON. Extract the preparation guide and add it in the description. Make sure to estimate how many people this recipe will feed. Try to extract a valid imageUrl if visible, otherwise set to null.";
        } else {
            promptText = "Analyze this image. Extract recipe data. Translate to French. Output STRICT JSON. Extract the preparation guide in the description. Try to extract a valid imageUrl if visible, otherwise set to null.";
        }

        return processSingleRecipeImage(callGeminiSingle(promptText, mimeType, base64Image, null));
    }

    public RecipeDto parseRecipeFromUrl(String urlString) {
        try {
            String pageText = fetchPageTextWithImages(urlString);

            if (pageText != null && !pageText.isEmpty()) {
                String prompt = """
                    I have scraped text and image URLs from a recipe link (%s).
                    1. Analyze the TEXT below.
                    2. Extract the recipe data including the BEST image URL found in the list.
                    3. Translate to French.
                    4. Map it EXACTLY to the provided JSON structure.
                    5. Make sure that ingredients start with capital letters.
                    6. Make sure to estimate how many people this meal will fill under the basePortionRatio.
                    
                    PAGE CONTENT:
                    %s
                    """.formatted(urlString, pageText.substring(0, Math.min(pageText.length(), 25000)));

                return processSingleRecipeImage(callGeminiSingle(prompt, null, null, null));
            }

            String prompt = """
                I have a URL: %s
                1. Use Google Search to find the specific recipe details.
                2. Extract data including the best image URL.
                3. Translate to French.
                4. Map it EXACTLY to the provided JSON structure.
                5. Make sure that ingredients start with capital letters.
                """.formatted(urlString);

            return processSingleRecipeImage(callGeminiSingle(prompt, null, null, "google_search"));

        } catch (Exception e) {
            if (e.getMessage() != null && e.getMessage().contains("429")) {
                throw new RuntimeException("AI quota exceeded. Please try again later.");
            }
            throw new RuntimeException("Smart Import Failed: " + e.getMessage());
        }
    }

    public List<RecipeDto> generateBulkRecipes(int count, List<String> cuisines) {
        return generateBulkRecipes(count, cuisines, null);
    }

    /**
     * @param excludeNames optional list of recipe names already in the user's collection,
     *                     passed so the model avoids repeating them. Pull this from your
     *                     recipe repository (e.g. distinct names for the current user) before
     *                     calling this method for real duplicate avoidance across sessions.
     */
    public List<RecipeDto> generateBulkRecipes(int count, List<String> cuisines, List<String> excludeNames) {
        String randomSeed = java.util.UUID.randomUUID().toString();

        String cuisineRule = "Include a mix of home-cooking-friendly cuisines (e.g., Italian, Mexican, Thai, Greek, American comfort food). ";

        if (cuisines != null && !cuisines.isEmpty()) {
            List<String> validCuisines = cuisines.stream()
                    .filter(c -> c != null && !c.trim().isEmpty())
                    .toList();

            if (!validCuisines.isEmpty()) {
                String joinedCuisines = String.join(" and/or ", validCuisines);
                cuisineRule = "\n\n=== MANDATORY CUISINE RESTRICTION ===\n" +
                        "You are STRICTLY FORBIDDEN from generating any dishes outside of these specific cuisines: " + joinedCuisines + ".\n" +
                        "Every single recipe MUST be " + joinedCuisines + ".\n" +
                        "DO NOT include any unlisted cuisines. If you deviate from " + joinedCuisines + ", the output is completely invalid.\n" +
                        "=====================================\n\n";
            }
        }

        String excludeRule = "";
        if (excludeNames != null && !excludeNames.isEmpty()) {
            excludeRule = "\n\nDo NOT repeat or closely resemble any of these recipes already in the collection:\n"
                    + String.join(", ", excludeNames) + "\n";
        }

        String prompt = "Act as a home cook planning realistic, everyday meals for a family — the kind of food " +
                "people actually cook on a Tuesday night, not restaurant tasting-menu dishes. " +
                "Generate " + count + " distinct, practical recipe ideas using common, easy-to-find grocery-store ingredients. " +
                "\n\nSTRICTLY AVOID: fine-dining or molecular-gastronomy techniques (foams, gels, spherification, sous-vide, " +
                "deconstructed dishes), rare or expensive ingredients (squid ink, truffle, caviar, saffron, exotic game meats), " +
                "and elaborate multi-day preparations. " +
                "\n\nEach recipe should be something a home cook could realistically shop for and make on a weeknight " +
                "(under ~45 minutes active time) or a slightly more involved weekend meal — but always with normal, " +
                "recognizable ingredients (chicken, ground beef, pasta, rice, vegetables, canned goods, etc.). " +
                cuisineRule +
                excludeRule +
                "Vary the recipes across different proteins, cooking methods (baked, pan-fried, slow-cooked, grilled, one-pot), " +
                "and meal types (quick weeknight, comforting, light/healthy, kid-friendly, meal-prep friendly) so they don't " +
                "feel repetitive. " +
                "Translate all recipe text to French EXCEPT the 'category' key which must remain exactly ONE OF THESE UPPERCASE WORDS: PATES, SANDWICH, BURGER, VIANDE, SANTE, SALADE, POULET, BOEUF, WRAP, SOUPE, FRUITS_DE_MER, ENTREE, POISSON, TREMPETTE, AUTRE. " +
                "Make sure that ingredients start with capital letters. " +
                "Make sure to estimate how many people this meal will fill under the basePortionRatio. " +
                "Set imageUrl to null — images will be generated separately. " +
                "Random seed to ensure variety across calls: " + randomSeed;

        List<RecipeDto> recipes = callGeminiList(prompt);
        generateAndAttachImages(recipes);
        return recipes;
    }

    private RecipeDto processSingleRecipeImage(RecipeDto recipe) {
        if (recipe != null && recipe.getImageUrl() != null && recipe.getImageUrl().startsWith("http")) {
            // Recipe came with a source image URL (from a scraped page) — keep downloading those as-is.
            String localFileName = fileService.storeFromUrl(recipe.getImageUrl());
            if (localFileName != null) {
                recipe.setImageUrl(baseUrl + "/files/" + localFileName);
            } else {
                recipe.setImageUrl(null);
            }
        } else if (recipe != null && recipe.getName() != null) {
            // No source image (e.g. imported from a video/photo with no visible image, or generated) —
            // generate one with Gemini instead of leaving it blank.
            String localImageUrl = generateRecipeImage(recipe.getName());
            recipe.setImageUrl(localImageUrl);
        }
        return recipe;
    }

    /**
     * Generates an image for each recipe using Gemini image generation, based on the recipe name,
     * and replaces imageUrl with the local file path. Replaces the old Pollinations-based
     * downloadAndReplaceImageUrls flow.
     */
    public void generateAndAttachImages(List<RecipeDto> recipes) {
        for (RecipeDto recipe : recipes) {
            if (recipe.getName() != null && !recipe.getName().isBlank()) {
                String localImageUrl = generateRecipeImage(recipe.getName());
                recipe.setImageUrl(localImageUrl);
            }
        }
    }

    /**
     * Kept for backward compatibility with any existing callers that still pass pre-built
     * image URLs (e.g. from a scraped page) and just need them downloaded/localized.
     * This does NOT call Gemini — it fetches whatever URL is already set.
     */
    public void downloadAndReplaceImageUrls(List<RecipeDto> recipes) {
        for (RecipeDto recipe : recipes) {
            if (recipe.getImageUrl() != null && recipe.getImageUrl().startsWith("http")) {
                String localFileName = fileService.storeFromUrl(recipe.getImageUrl());
                if (localFileName != null) {
                    recipe.setImageUrl(baseUrl + "/files/" + localFileName);
                } else {
                    recipe.setImageUrl(null);
                }
            }
        }
    }

    /**
     * Calls Gemini's image generation endpoint for a single dish name and returns the local
     * server URL of the saved image, or null on failure. Used by both the single-image
     * controller endpoint and bulk generation.
     */
    public String generateRecipeImage(String dishName) {
        try {
            String prompt = "Generate a photorealistic, appetizing food photography image of this finished, "
                    + "plated dish: \"" + dishName + "\". Professional lighting, shallow depth of field, "
                    + "restaurant-quality plating. Show only the finished cooked meal — no raw ingredients, "
                    + "no live animals, no text or watermarks in the image.";

            Map<String, Object> textPart = Map.of("text", prompt);
            Map<String, Object> content = new HashMap<>();
            content.put("parts", List.of(textPart));

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("contents", List.of(content));
            requestBody.put("generationConfig", Map.of(
                    "responseModalities", List.of("TEXT", "IMAGE")
            ));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            String urlWithKey = imagenUrl + "?key=" + apiKey;
            ResponseEntity<String> response = restTemplate.postForEntity(urlWithKey, entity, String.class);

            return saveGeneratedImageFromResponse(response.getBody());
        } catch (Exception e) {
            System.err.println("==== GEMINI IMAGE GENERATION ERROR (dish: " + dishName + ") ====");
            e.printStackTrace();
            return null;
        }
    }

    @SuppressWarnings("unchecked")
    private String saveGeneratedImageFromResponse(String jsonResponse) throws Exception {
        Map<String, Object> root = objectMapper.readValue(jsonResponse, Map.class);
        List<Object> candidates = (List<Object>) root.get("candidates");
        if (candidates == null || candidates.isEmpty()) {
            System.err.println("Gemini image gen: no candidates. Raw response: " + jsonResponse);
            return null;
        }

        Map<String, Object> firstCandidate = (Map<String, Object>) candidates.get(0);
        Map<String, Object> content = (Map<String, Object>) firstCandidate.get("content");
        if (content == null) {
            System.err.println("Gemini image gen: no content. Raw response: " + jsonResponse);
            return null;
        }
        List<Object> parts = (List<Object>) content.get("parts");
        if (parts == null) return null;

        for (Object p : parts) {
            Map<String, Object> part = (Map<String, Object>) p;

            // API returns camelCase "inlineData" in JSON responses.
            Map<String, Object> inlineData = (Map<String, Object>) part.get("inlineData");
            if (inlineData == null) {
                inlineData = (Map<String, Object>) part.get("inline_data");
            }

            if (inlineData != null) {
                String base64Data = (String) inlineData.get("data");
                String mimeType = (String) inlineData.getOrDefault("mimeType", "image/png");

                byte[] imageBytes = Base64.getDecoder().decode(base64Data);
                String extension = mimeType.contains("png") ? "png" : "jpg";

                // IFileService needs a storeFromBytes(byte[], String extension) -> filename method.
                // If yours has a different signature, adjust this call accordingly.
                String localFileName = fileService.storeFromBytes(imageBytes, extension);
                if (localFileName != null) {
                    return baseUrl + "/files/" + localFileName;
                }
                return null;
            }
        }

        System.err.println("Gemini image gen: no inlineData part found. Raw response: " + jsonResponse);
        return null;
    }

    private RecipeDto callGeminiSingle(String prompt, String mimeType, String base64Data, String toolName) {
        String finalPrompt = prompt + "\n\nIMPORTANT: Return ONLY raw valid JSON matching this structure:\n" + IMPORT_JSON_SCHEMA;
        String jsonResponse = executeGeminiRequest(finalPrompt, mimeType, base64Data, toolName);

        try {
            String cleanJson = extractJsonPayload(jsonResponse);
            return objectMapper.readValue(cleanJson, RecipeDto.class);
        } catch (Exception e) {
            System.err.println("==== GEMINI SINGLE PARSING ERROR ====");
            System.err.println("Raw Response: " + jsonResponse);
            e.printStackTrace();
            throw new RuntimeException("Failed to map AI response to Recipe object.");
        }
    }

    private List<RecipeDto> callGeminiList(String prompt) {
        String finalPrompt = prompt + "\n\nIMPORTANT: Return ONLY raw valid JSON matching this exact structure as an ARRAY:\n" + GENERATE_JSON_ARRAY_SCHEMA;
        String jsonResponse = executeGeminiRequest(finalPrompt, null, null, null);

        try {
            String cleanJson = extractJsonPayload(jsonResponse);
            return Arrays.asList(objectMapper.readValue(cleanJson, RecipeDto[].class));
        } catch (Exception e) {
            System.err.println("==== GEMINI BULK PARSING ERROR ====");
            System.err.println("Raw Response: " + jsonResponse);
            e.printStackTrace();
            throw new RuntimeException("Failed to map AI response to Recipe List.");
        }
    }

    private String executeGeminiRequest(String finalPrompt, String mimeType, String base64Data, String toolName) {
        try {
            Map<String, Object> requestBody = new HashMap<>();
            Map<String, Object> content = new HashMap<>();
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
                requestBody.put("generationConfig", Map.of(
                        "response_mime_type", "application/json",
                        "temperature", 0.9
                ));
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            String urlWithKey = apiUrl + "?key=" + apiKey;
            ResponseEntity<String> response = restTemplate.postForEntity(urlWithKey, entity, String.class);

            return response.getBody();
        } catch (Exception e) {
            System.err.println("Gemini API Error: " + e.getMessage());
            throw new RuntimeException("AI Request Error: " + e.getMessage());
        }
    }

    private String fetchPageTextWithImages(String url) {
        try {
            Document doc = Jsoup.connect(url)
                    .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0")
                    .timeout(5000)
                    .get();

            StringBuilder sb = new StringBuilder();
            sb.append(doc.body().text()).append("\n\nIMAGES FOUND ON PAGE:\n");
            doc.select("img").forEach(img -> {
                String src = img.absUrl("src");
                if(!src.isEmpty()) sb.append(src).append("\n");
            });
            return sb.toString();
        } catch (Exception e) {
            return null;
        }
    }

    private String extractJsonPayload(String jsonResponse) throws Exception {
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

        String cleanJson = rawText.replaceAll("(?i)```json", "").replace("```", "").trim();

        int firstBracket = cleanJson.indexOf("[");
        int lastBracket = cleanJson.lastIndexOf("]");
        int firstBrace = cleanJson.indexOf("{");
        int lastBrace = cleanJson.lastIndexOf("}");

        if (firstBracket != -1 && lastBracket != -1 && (firstBrace == -1 || firstBracket < firstBrace)) {
            cleanJson = cleanJson.substring(firstBracket, lastBracket + 1);
        } else if (firstBrace != -1 && lastBrace != -1) {
            cleanJson = cleanJson.substring(firstBrace, lastBrace + 1);
        }

        return cleanJson;
    }
}