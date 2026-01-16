package com.ytnafrica.backend.controller;

import com.ytnafrica.backend.model.Song;
import com.ytnafrica.backend.repository.SongRepository;
import com.ytnafrica.backend.service.SongService;
import com.ytnafrica.backend.service.FileStorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
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
     * Serve MP3 file by path for playback (streaming with range support)
     * Example: /api/uploads/songs/uuid.mp3
     */
    @GetMapping("/songs/{filename:.+}")
    public ResponseEntity<?> getSongFile(@PathVariable String filename, 
                                         @RequestHeader(value = "Range", required = false) String rangeHeader) {
        try {
            // Extract just the filename from the path (handle old paths with full directory structure)
            String actualFilename = extractFilename(filename);
            
            // Use FileStorageService to get the correct path
            String fullPath = fileStorageService.getSongFullPath(actualFilename);
            File songFile = fullPath != null ? new File(fullPath) : null;
            
            // Log for debugging
            System.out.println("=== File Request Debug ===");
            System.out.println("Requested filename: " + filename);
            System.out.println("Extracted filename: " + actualFilename);
            System.out.println("Primary path from service: " + fullPath);
            System.out.println("File exists: " + (songFile != null && songFile.exists()));
            if (songFile != null) {
                System.out.println("File path: " + songFile.getAbsolutePath());
                System.out.println("Is file: " + songFile.isFile());
            }
            
            // If file doesn't exist at expected location, try alternative paths
            if (songFile == null || !songFile.exists() || !songFile.isFile()) {
                String currentDir = System.getProperty("user.dir");
                System.out.println("Current working directory: " + currentDir);
                
                String[] possiblePaths = {
                    currentDir + "/uploads/songs/" + actualFilename,
                    currentDir + "\\uploads\\songs\\" + actualFilename, // Windows path
                    "./uploads/songs/" + actualFilename,
                    "uploads/songs/" + actualFilename,
                    actualFilename, // In case it's already a full path
                    filename // Original path as-is
                };
                
                System.out.println("Trying alternative paths...");
                for (String path : possiblePaths) {
                    File testFile = new File(path);
                    String absPath = testFile.getAbsolutePath();
                    boolean exists = testFile.exists();
                    boolean isFile = testFile.isFile();
                    System.out.println("  Checking: " + path);
                    System.out.println("    Absolute: " + absPath);
                    System.out.println("    Exists: " + exists);
                    System.out.println("    Is file: " + isFile);
                    if (exists && isFile) {
                        songFile = testFile;
                        System.out.println("  ✓ Found file at: " + absPath);
                        break;
                    }
                }
            }
            
            if (songFile != null && songFile.exists() && songFile.isFile()) {
                long fileLength = songFile.length();
                
                // Support range requests for streaming (enables instant playback)
                if (rangeHeader != null && rangeHeader.startsWith("bytes=")) {
                        try {
                            String[] ranges = rangeHeader.substring(6).split("-");
                            long rangeStart = Long.parseLong(ranges[0]);
                            long rangeEnd = ranges.length > 1 && !ranges[1].isEmpty() 
                                ? Long.parseLong(ranges[1]) 
                                : fileLength - 1;
                            
                            // Ensure range is valid
                            if (rangeStart < 0) rangeStart = 0;
                            if (rangeEnd >= fileLength) rangeEnd = fileLength - 1;
                            if (rangeStart > rangeEnd) {
                                rangeStart = 0;
                                rangeEnd = fileLength - 1;
                            }
                            
                            long contentLength = rangeEnd - rangeStart + 1;
                            final long finalRangeStart = rangeStart;
                            final long finalRangeEnd = rangeEnd;
                            
                            final File finalSongFile = songFile;
                            StreamingResponseBody stream = outputStream -> {
                                try (InputStream inputStream = new FileInputStream(finalSongFile)) {
                                    long skipped = inputStream.skip(finalRangeStart);
                                    if (skipped < finalRangeStart) {
                                        // If skip didn't work, read and discard
                                        long remaining = finalRangeStart - skipped;
                                        byte[] skipBuffer = new byte[8192];
                                        while (remaining > 0) {
                                            long read = inputStream.read(skipBuffer, 0, (int) Math.min(skipBuffer.length, remaining));
                                            if (read <= 0) break;
                                            remaining -= read;
                                        }
                                    }
                                    byte[] buffer = new byte[8192];
                                    long bytesToRead = contentLength;
                                    long bytesRead = 0;
                                    
                                    while (bytesToRead > 0 && (bytesRead = inputStream.read(buffer, 0, 
                                            (int) Math.min(buffer.length, bytesToRead))) != -1) {
                                        outputStream.write(buffer, 0, (int) bytesRead);
                                        bytesToRead -= bytesRead;
                                    }
                                } catch (IOException e) {
                                    throw new RuntimeException("Error streaming file", e);
                                }
                            };
                            
                            return ResponseEntity.status(HttpStatus.PARTIAL_CONTENT)
                                    .contentType(MediaType.parseMediaType("audio/mpeg"))
                                    .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                                    .header(HttpHeaders.CONTENT_RANGE, 
                                        String.format("bytes %d-%d/%d", finalRangeStart, finalRangeEnd, fileLength))
                                    .header(HttpHeaders.CONTENT_LENGTH, String.valueOf(contentLength))
                                    .header(HttpHeaders.CACHE_CONTROL, "public, max-age=3600")
                                    .header(HttpHeaders.CONNECTION, "keep-alive")
                                    .body(stream);
                    } catch (Exception e) {
                        // If range parsing fails, fall through to full file
                    }
                }
                
                // Full file response (no range request)
                Resource resource = new FileSystemResource(songFile);
                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType("audio/mpeg"))
                        .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                        .header(HttpHeaders.CONTENT_LENGTH, String.valueOf(fileLength))
                        .header(HttpHeaders.CACHE_CONTROL, "public, max-age=3600")
                        .header(HttpHeaders.CONNECTION, "keep-alive")
                        .body(resource);
            }
        } catch (Exception e) {
            // Log error for debugging
            System.err.println("Error serving song file: " + filename);
            System.err.println("Exception: " + e.getMessage());
            e.printStackTrace();
        }
        
        // Log that file was not found
        System.err.println("File not found: " + filename);
        System.err.println("Current directory: " + System.getProperty("user.dir"));
        File uploadsDir = new File("./uploads/songs");
        System.err.println("Uploads directory exists: " + uploadsDir.exists());
        if (uploadsDir.exists()) {
            File[] files = uploadsDir.listFiles();
            System.err.println("Files in uploads/songs: " + (files != null ? files.length : 0));
        }
        
        return ResponseEntity.notFound().build();
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
     * Serve MP3 file for playback by song ID (streaming with range support)
     */
    @GetMapping("/songs/song/{songId}")
    public ResponseEntity<?> getSongFileBySongId(@PathVariable Long songId,
                                                 @RequestHeader(value = "Range", required = false) String rangeHeader) {
        try {
        File songFile = songService.getSongFile(songId);
        if (songFile != null && songFile.exists()) {
                long fileLength = songFile.length();
                
                // Support range requests for streaming (enables instant playback)
                if (rangeHeader != null && rangeHeader.startsWith("bytes=")) {
                try {
                    String[] ranges = rangeHeader.substring(6).split("-");
                    long rangeStart = Long.parseLong(ranges[0]);
                    long rangeEnd = ranges.length > 1 && !ranges[1].isEmpty() 
                        ? Long.parseLong(ranges[1]) 
                        : fileLength - 1;
                    
                    // Ensure range is valid
                    if (rangeStart < 0) rangeStart = 0;
                    if (rangeEnd >= fileLength) rangeEnd = fileLength - 1;
                    if (rangeStart > rangeEnd) {
                        rangeStart = 0;
                        rangeEnd = fileLength - 1;
                    }
                    
                    long contentLength = rangeEnd - rangeStart + 1;
                    final long finalRangeStart = rangeStart;
                    final long finalRangeEnd = rangeEnd;
                    
                    final File finalSongFile = songFile;
                    StreamingResponseBody stream = outputStream -> {
                        try (InputStream inputStream = new FileInputStream(finalSongFile)) {
                            long skipped = inputStream.skip(finalRangeStart);
                            if (skipped < finalRangeStart) {
                                // If skip didn't work, read and discard
                                long remaining = finalRangeStart - skipped;
                                byte[] skipBuffer = new byte[8192];
                                while (remaining > 0) {
                                    long read = inputStream.read(skipBuffer, 0, (int) Math.min(skipBuffer.length, remaining));
                                    if (read <= 0) break;
                                    remaining -= read;
                                }
                            }
                            byte[] buffer = new byte[8192];
                            long bytesToRead = contentLength;
                            long bytesRead = 0;
                            
                            while (bytesToRead > 0 && (bytesRead = inputStream.read(buffer, 0, 
                                    (int) Math.min(buffer.length, bytesToRead))) != -1) {
                                outputStream.write(buffer, 0, (int) bytesRead);
                                bytesToRead -= bytesRead;
                            }
                        } catch (IOException e) {
                            throw new RuntimeException("Error streaming file", e);
                        }
                    };
                    
                    return ResponseEntity.status(HttpStatus.PARTIAL_CONTENT)
                            .contentType(MediaType.parseMediaType("audio/mpeg"))
                            .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                            .header(HttpHeaders.CONTENT_RANGE, 
                                String.format("bytes %d-%d/%d", finalRangeStart, finalRangeEnd, fileLength))
                            .header(HttpHeaders.CONTENT_LENGTH, String.valueOf(contentLength))
                            .header(HttpHeaders.CACHE_CONTROL, "public, max-age=3600")
                    .header(HttpHeaders.CONNECTION, "keep-alive")
                    .body(stream);
                } catch (Exception e) {
                    // If range parsing fails, fall through to full file response
                    System.err.println("Range parsing error: " + e.getMessage());
                }
            }
            
            // Full file response (no range request)
            Resource resource = new FileSystemResource(songFile);
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType("audio/mpeg"))
                    .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                    .header(HttpHeaders.CONTENT_LENGTH, String.valueOf(fileLength))
                    .header(HttpHeaders.CACHE_CONTROL, "public, max-age=3600")
                    .header(HttpHeaders.CONNECTION, "keep-alive")
                    .body(resource);
            }
        } catch (Exception e) {
            System.err.println("Error serving song file by ID: " + songId);
            System.err.println("Exception: " + e.getMessage());
            e.printStackTrace();
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

