package com.couple.taskmanager.controller;

import com.couple.taskmanager.exception.StorageFileNotFoundException;
import com.couple.taskmanager.service.HouseholdService;
import com.couple.taskmanager.service.IFileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.MvcUriComponentsBuilder;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/files")
public class FileController {
    private final IFileService storageService;
    @Value("${app.base-url}")
    private String baseUrl;

    @Autowired
    HouseholdService householdService;

    @Autowired
    public FileController(IFileService storageService) {
        this.storageService = storageService;
    }

    @GetMapping
    public String listUploadedFiles(Model model) throws IOException {

        model.addAttribute("files", storageService.loadAll().map(
                        path -> MvcUriComponentsBuilder.fromMethodName(FileController.class,
                                "serveFile", path.getFileName().toString()).build().toUri().toString())
                .toList());

        return "uploadForm";
    }

    @GetMapping("/{filename:.+}")
    @ResponseBody
    public ResponseEntity<Resource> serveFile(@PathVariable String filename) {

        Resource file = storageService.loadAsResource(filename);

        if (file == null)
            return ResponseEntity.notFound().build();

        return ResponseEntity.ok().header(HttpHeaders.CONTENT_DISPOSITION,
                "attachment; filename=\"" + file.getFilename() + "\"").body(file);
    }

    @PostMapping
    public ResponseEntity<?> handleFileUpload(@RequestParam("file") MultipartFile file) {
        String fileName = storageService.store(file);
        String fileUrl = baseUrl + "/files/" + fileName;

        return ResponseEntity.ok().body(Map.of(
                "fileName", fileName,
                "url", fileUrl,
                "message", "Upload successful"
        ));
    }

    @PostMapping("/household/{memberId}/image")
    public ResponseEntity<?> handleHouseholdImageUpload(@RequestParam("file") MultipartFile file, @PathVariable("memberId") Long memberId){
        // 1. Store the file and get the filename
        String fileName = storageService.store(file);

        // 2. Construct the full URL
        String imageUrl = baseUrl + "/files/" + fileName;

        // 3. Pass the full URL to the service
        householdService.setHouseholdMemberImage(memberId, imageUrl);

        // 4. Return success response (optionally include the URL)
        return ResponseEntity.ok().body(Map.of(
                "message", "Upload successful",
                "url", imageUrl // Good practice to return the generated URL
        ));
    }

    @ExceptionHandler(StorageFileNotFoundException.class)
    public ResponseEntity<?> handleStorageFileNotFound(StorageFileNotFoundException exc) {
        return ResponseEntity.notFound().build();
    }

}
