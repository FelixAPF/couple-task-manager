package com.couple.taskmanager.controller;

import com.couple.taskmanager.model.CTMUser;
import com.couple.taskmanager.model.Recipe;
import com.couple.taskmanager.model.dto.RecipeDto;
import com.couple.taskmanager.service.RecipeAIParserService;
import com.couple.taskmanager.service.RecipeService;
import jakarta.transaction.SystemException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/recipes")
public class RecipeController extends GenericController<Recipe, RecipeDto, RecipeService> {

    @Autowired
    private RecipeAIParserService aiParserService;

    @PostMapping(value = "/smart-import", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<RecipeDto> smartImportRecipe(@RequestParam("file") MultipartFile file) {
        try {
            RecipeDto recipe = aiParserService.parseRecipe(file);
            return ResponseEntity.ok(recipe);
        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/smart-import-url")
    public ResponseEntity<RecipeDto> smartImportUrl(@RequestBody Map<String, String> payload) {
        String url = payload.get("url");
        if (url == null || url.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        try {
            RecipeDto recipe = aiParserService.parseRecipeFromUrl(url);
            return ResponseEntity.ok(recipe);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/ai/generate")
    public ResponseEntity<?> generateRandomBulk(
            @RequestParam("count") int count,
            @RequestParam(value = "cuisines", required = false) List<String> cuisines) { // <--- Changed to List<String>
        try {
            List<RecipeDto> recipes = aiParserService.generateBulkRecipes(count, cuisines);
            return ResponseEntity.ok(recipes);
        } catch (Exception e) {
            if (e.getMessage() != null && e.getMessage().contains("429")) {
                return ResponseEntity.status(org.springframework.http.HttpStatus.TOO_MANY_REQUESTS)
                        .body("Quota AI dépassé. Veuillez patienter.");
            }
            System.err.println("===== CONTROLLER AI GENERATION ERROR =====");
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping({"/batch", "/bulk"})
    public List<RecipeDto> batchSave(@RequestBody List<Recipe> recipes, @AuthenticationPrincipal UserDetails userDetails){
        return this.service.create(recipes, (CTMUser) userDetails);
    }

    @GetMapping("/type/{recipeType}")
    public List<RecipeDto> findByRecipeType(@PathVariable String recipeType, @AuthenticationPrincipal UserDetails userDetails) {
        return this.service.findByRecipeType(recipeType, (CTMUser) userDetails);
    }

    @GetMapping("/random")
    public RecipeDto randomRecipe(@AuthenticationPrincipal UserDetails userDetails) throws SystemException {
        return this.service.findRandomRecipe((CTMUser) userDetails);
    }
}