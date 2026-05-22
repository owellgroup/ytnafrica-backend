package com.ytnafrica.backend.controller;

import com.ytnafrica.backend.model.Song;
import com.ytnafrica.backend.repository.SongRepository;
import com.ytnafrica.backend.service.SongService;
import com.ytnafrica.backend.service.FileStorageService;
import com.ytnafrica.backend.util.AudioStreamHelper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import java.io.File;
import java.util.Optional;

@RestController
@RequestMapping("/uploads")
public class FileController {

    @Autowired
    private SongService songService;

    @Autowired
    private SongRepository songRepository;
    
    @Autowired
    private FileStorageService fileStorageService;

    /**
     * Serve cover art image by path
     * Example: /api/uploads/cover-art/uuid.jpg
     */
    @GetMapping("/cover-art/{filename:.+}")
    public ResponseEntity<Resource> getCoverArt(@PathVariable String filename) {
        try {
            // Extract just the filename from the path (handle old paths with full directory structure)
            String actualFilename = extractFilename(filename);
            
            // Try multiple possible locations
            String[] possiblePaths = {
                "./uploads/cover-art/" + actualFilename,
                "uploads/cover-art/" + actualFilename,
                actualFilename, // In case it's already a full path
                filename // Original path as-is
            };
            
            for (String path : possiblePaths) {
                File coverArtFile = new File(path);
                if (coverArtFile.exists() && coverArtFile.isFile()) {
                Resource resource = new FileSystemResource(coverArtFile);
                    String contentType = getContentType(actualFilename);
                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .header(HttpHeaders.CACHE_CONTROL, "public, max-age=31536000")
                        .body(resource);
                }
            }
        } catch (Exception e) {
            // Fall through to not found
        }
        return ResponseEntity.notFound().build();
    }

    /**
     * Serve MP3 file for playback by song ID (streaming with range support).
     * Declared before /songs/{filename} so "song/{id}" is not captured as a filename.
     */
    @GetMapping("/songs/song/{songId}")
    public ResponseEntity<StreamingResponseBody> getSongFileBySongId(@PathVariable Long songId,
                                                        @RequestHeader(value = "Range", required = false) String rangeHeader) {
        File songFile = songService.getSongFile(songId);
        return AudioStreamHelper.streamFile(songFile, rangeHeader);
    }

    /**
     * Serve MP3 file by path for playback (streaming with range support)
     * Example: /api/uploads/songs/uuid.mp3
     */
    @GetMapping("/songs/{filename:.+}")
    public ResponseEntity<StreamingResponseBody> getSongFile(@PathVariable String filename,
                                              @RequestHeader(value = "Range", required = false) String rangeHeader) {
        String actualFilename = extractFilename(filename);
        File songFile = resolveSongFile(actualFilename, filename);
        return AudioStreamHelper.streamFile(songFile, rangeHeader);
    }

    private File resolveSongFile(String actualFilename, String originalPath) {
        String fullPath = fileStorageService.getSongFullPath(actualFilename);
        File songFile = fullPath != null ? new File(fullPath) : null;
        if (songFile != null && songFile.exists() && songFile.isFile()) {
            return songFile;
        }
        String currentDir = System.getProperty("user.dir");
        String[] possiblePaths = {
                currentDir + "/uploads/songs/" + actualFilename,
                currentDir + "\\uploads\\songs\\" + actualFilename,
                "./uploads/songs/" + actualFilename,
                "uploads/songs/" + actualFilename,
                actualFilename,
                originalPath
        };
        for (String path : possiblePaths) {
            File testFile = new File(path);
            if (testFile.exists() && testFile.isFile()) {
                return testFile;
            }
        }
        return null;
    }

    /**
     * Serve cover art image for a song by ID
     */
    @GetMapping("/cover-art/song/{songId}")
    public ResponseEntity<Resource> getCoverArtBySongId(@PathVariable Long songId) {
        Optional<Song> songOpt = songRepository.findById(songId);
        if (songOpt.isPresent()) {
            Song song = songOpt.get();
            if (song.getCoverArtPath() != null && !song.getCoverArtPath().isEmpty()) {
                String coverArtPath = song.getCoverArtPath();
                String filename = extractFilename(coverArtPath);
                
                // Try multiple possible locations
                String[] possiblePaths = {
                    coverArtPath, // Original path as-is
                    "./uploads/cover-art/" + filename,
                    "uploads/cover-art/" + filename,
                    filename
                };
                
                for (String path : possiblePaths) {
                    File coverArtFile = new File(path);
                    if (coverArtFile.exists() && coverArtFile.isFile()) {
                    Resource resource = new FileSystemResource(coverArtFile);
                        String contentType = getContentType(filename);
                    return ResponseEntity.ok()
                            .contentType(MediaType.parseMediaType(contentType))
                            .header(HttpHeaders.CACHE_CONTROL, "public, max-age=31536000")
                            .body(resource);
                    }
                }
            }
        }
        return ResponseEntity.notFound().build();
    }

    /**
     * Extract filename from a path, handling both Windows and Unix paths
     */
    private String extractFilename(String path) {
        if (path == null || path.isEmpty()) {
            return path;
        }
        // Handle both forward and backslashes
        String normalized = path.replace("\\", "/");
        int lastSlash = normalized.lastIndexOf("/");
        if (lastSlash >= 0 && lastSlash < normalized.length() - 1) {
            return normalized.substring(lastSlash + 1);
        }
        return path;
    }

    private String getContentType(String filename) {
        String lower = filename.toLowerCase();
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
            return "image/jpeg";
        } else if (lower.endsWith(".png")) {
            return "image/png";
        } else if (lower.endsWith(".gif")) {
            return "image/gif";
        }
        return "image/jpeg";
    }
}

