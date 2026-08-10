package com.couple.taskmanager.service;

import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Path;
import java.util.stream.Stream;

public interface IFileService {
    void init();

    String store(MultipartFile file);

    String storeFromUrl(String urlString);

    Stream<Path> loadAll();

    Path load(String filename);

    Resource loadAsResource(String filename);


    String storeFromBytes(byte[] data, String extension);

    void deleteAll();
}