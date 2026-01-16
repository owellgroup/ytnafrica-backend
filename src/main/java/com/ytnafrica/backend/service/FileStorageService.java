package com.ytnafrica.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class FileStorageService {

    @Value("${file.upload.dir}")
    private String uploadDir;

    @Value("${file.upload.cover-art-dir}")
    private String coverArtDir;

    @Value("${file.upload.songs-dir}")
    private String songsDir;

    public void initDirectories() {
        try {
            Files.createDirectories(Paths.get(uploadDir));
            Files.createDirectories(Paths.get(coverArtDir));
            Files.createDirectories(Paths.get(songsDir));
        } catch (IOException e) {
            throw new RuntimeException("Could not create upload directories", e);
        }
    }

    public String storeCoverArt(MultipartFile file) throws IOException {
        initDirectories();
        String originalFilename = file.getOriginalFilename();
        String extension = originalFilename != null && originalFilename.contains(".") 
            ? originalFilename.substring(originalFilename.lastIndexOf(".")) 
            : ".jpg";
        String filename = UUID.randomUUID().toString() + extension;
        Path targetLocation = Paths.get(coverArtDir).resolve(filename);
        Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
        // Return only the filename for consistent storage in database
        return filename;
    }

    public String storeSong(MultipartFile file) throws IOException {
        initDirectories();
        String originalFilename = file.getOriginalFilename();
        String extension = originalFilename != null && originalFilename.contains(".") 
            ? originalFilename.substring(originalFilename.lastIndexOf(".")) 
            : ".mp3";
        String filename = UUID.randomUUID().toString() + extension;
        Path targetLocation = Paths.get(songsDir).resolve(filename);
        Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
        // Return only the filename for consistent storage in database
        return filename;
    }

    public File getFile(String filePath) {
        // Handle both old full paths and new filename-only paths
        if (filePath == null || filePath.isEmpty()) {
            return null;
        }
        
        // If it's already a full path (contains directory separators), use it as-is
        if (filePath.contains("/") || filePath.contains("\\")) {
            File file = new File(filePath);
            if (file.exists()) {
                return file;
            }
            // Try to extract filename and look in standard locations
            String filename = extractFilename(filePath);
            // Try songs directory first
            File songFile = new File(songsDir, filename);
            if (songFile.exists()) {
                return songFile;
            }
            // Try cover-art directory
            File coverFile = new File(coverArtDir, filename);
            if (coverFile.exists()) {
                return coverFile;
            }
        } else {
            // It's just a filename, try standard locations
            File songFile = new File(songsDir, filePath);
            if (songFile.exists()) {
                return songFile;
            }
            File coverFile = new File(coverArtDir, filePath);
            if (coverFile.exists()) {
                return coverFile;
            }
        }
        
        return null;
    }
    
    /**
     * Get the full path for a song filename
     * @param filename The filename (e.g., "uuid.mp3")
     * @return Full path to the file
     */
    public String getSongFullPath(String filename) {
        if (filename == null || filename.isEmpty()) {
            return null;
        }
        // If it's already a full path, return as-is
        if (filename.contains("/") || filename.contains("\\")) {
            return filename;
        }
        // Otherwise, construct the full path
        // Ensure directory exists
        initDirectories();
        Path fullPath = Paths.get(songsDir).resolve(filename);
        // Convert to absolute path
        File file = fullPath.toFile();
        if (!file.isAbsolute()) {
            file = file.getAbsoluteFile();
        }
        return file.getAbsolutePath();
    }

    /**
     * Get the full path for a cover art filename
     * @param filename The filename (e.g., "uuid.jpg")
     * @return Full path to the file
     */
    public String getCoverArtFullPath(String filename) {
        if (filename == null || filename.isEmpty()) {
            return null;
        }
        // If it's already a full path, return as-is
        if (filename.contains("/") || filename.contains("\\")) {
            return filename;
        }
        // Otherwise, construct the full path
        return Paths.get(coverArtDir).resolve(filename).toString();
    }

    /**
     * Extract filename from a path, handling both Windows and Unix paths
     */
    private String extractFilename(String path) {
        if (path == null || path.isEmpty()) {
            return path;
        }
        String normalized = path.replace("\\", "/");
        int lastSlash = normalized.lastIndexOf("/");
        if (lastSlash >= 0 && lastSlash < normalized.length() - 1) {
            return normalized.substring(lastSlash + 1);
        }
        return path;
    }
}

