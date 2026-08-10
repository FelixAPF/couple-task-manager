package com.couple.taskmanager.service;

import com.couple.taskmanager.model.ReceiptItem;
import com.couple.taskmanager.model.dto.ParsedReceiptDto;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
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
public class ReceiptParserService {

    @Value("${gemini.api.key}")
    private String apiKey;

    @Value("${gemini.api.url}")
    private String apiUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    private final ObjectMapper objectMapper = new ObjectMapper()
            .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false)
            .configure(com.fasterxml.jackson.core.JsonParser.Feature.ALLOW_COMMENTS, true)
            .configure(com.fasterxml.jackson.core.JsonParser.Feature.ALLOW_UNQUOTED_CONTROL_CHARS, true);

    private static final String RECEIPT_JSON_SCHEMA = """
    {
      "storeName": "Store Name",
      "items": [
        {
          "name": "Item Name",
          "price": 10.99,
          "taxable": false
        }
      ]
    }
    """;

    public ParsedReceiptDto parseReceiptImage(MultipartFile file) throws IOException {
        String base64Image = Base64.getEncoder().encodeToString(file.getBytes());
        String mimeType = file.getContentType() != null ? file.getContentType() : "image/jpeg";

        // UPDATED PROMPT: Added instruction to extract store name and structure as an object
        String promptText = """
        Analyze this grocery receipt image line by line. Extract the name of the store and all purchased items with their exact prices.
        CRITICAL INSTRUCTIONS FOR ACCURACY:
        1. Identify the store name at the top of the receipt.
        2. Read strictly sequentially. DO NOT skip lines or mix up horizontal rows.
        3. Watch out for 'CONSIGNE' (bottle deposits) and 'RABAIS' (discounts). These are usually indented below a main item.
        4. Treat 'CONSIGNE' and 'RABAIS' as separate, individual items in the JSON array with their own prices (discounts should be negative numbers). DO NOT assign a Consigne or Rabais price to the item below it.
        5. Double-check that the price you extract perfectly aligns horizontally with the item name on that specific row.
        6. Determine if each item is taxable based on the receipt indicators (like FP, asterisks, or tax codes next to the price).
        7. Ignore subtotals, taxes, tips, and the final total at the very bottom.
        """;

        String finalPrompt = promptText + "\n\nIMPORTANT: Return ONLY raw valid JSON matching this exact structure:\n" + RECEIPT_JSON_SCHEMA;

        String jsonResponse = executeGeminiRequest(finalPrompt, mimeType, base64Image);

        try {
            String cleanJson = extractJsonPayload(jsonResponse);
            return objectMapper.readValue(cleanJson, ParsedReceiptDto.class);
        } catch (Exception e) {
            System.err.println("==== GEMINI RECEIPT PARSING ERROR ====");
            System.err.println("Raw Response: " + jsonResponse);
            e.printStackTrace();
            throw new RuntimeException("Failed to map AI response to Receipt Items.");
        }
    }

    private String executeGeminiRequest(String finalPrompt, String mimeType, String base64Data) {
        try {
            Map<String, Object> requestBody = new HashMap<>();
            Map<String, Object> content = new HashMap<>();
            Map<String, Object> textPart = Map.of("text", finalPrompt);
            Map<String, Object> filePart = Map.of("inline_data", Map.of("mime_type", mimeType, "data", base64Data));

            content.put("parts", List.of(textPart, filePart));
            requestBody.put("contents", List.of(content));
            requestBody.put("generationConfig", Map.of("response_mime_type", "application/json"));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            String urlWithKey = apiUrl + "?key=" + apiKey;
            ResponseEntity<String> response = restTemplate.postForEntity(urlWithKey, entity, String.class);

            return response.getBody();
        } catch (Exception e) {
            throw new RuntimeException("AI Request Error: " + e.getMessage());
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

        int firstBrace = cleanJson.indexOf("{");
        int lastBrace = cleanJson.lastIndexOf("}");

        if (firstBrace != -1 && lastBrace != -1) {
            cleanJson = cleanJson.substring(firstBrace, lastBrace + 1);
        }

        return cleanJson;
    }
}