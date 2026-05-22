package com.ytnafrica.backend.controller;

import com.ytnafrica.backend.model.Song;
import com.ytnafrica.backend.service.SongService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/songs")
public class SongController {

    @Autowired
    private SongService songService;

    @Value("${app.base-url}")
    private String baseUrl;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @PostMapping("/upload")
    public ResponseEntity<Map<String, Object>> uploadSingleTrack(
            @RequestParam("title") String title,
            @RequestParam("artist") String artist,
            @RequestParam(value = "artistId", required = false) Long artistId,
            @RequestParam(value = "featuredArtists", required = false) String featuredArtists,
            @RequestParam("producer") String producer,
            @RequestParam("coverArt") MultipartFile coverArt,
            @RequestParam("mp3File") MultipartFile mp3File) {
        Map<String, Object> response = new HashMap<>();
        try {
            Song song = songService.createSingleTrack(title, artist, featuredArtists, producer, coverArt, mp3File, artistId);
            response.put("success", true);
            response.put("message", "Single track uploaded successfully");
            response.put("song", song);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Failed to upload track: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @GetMapping
    public ResponseEntity<List<Song>> getAllSongs() {
        return ResponseEntity.ok(songService.getAllSongs());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Song> getSongById(@PathVariable Long id) {
        return songService.getSongById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/album/{albumId}")
    public ResponseEntity<List<Song>> getSongsByAlbum(@PathVariable Long albumId) {
        return ResponseEntity.ok(songService.getSongsByAlbum(albumId));
    }

    @GetMapping("/artist/{artistId}")
    public ResponseEntity<List<Song>> getSongsByArtist(@PathVariable Long artistId) {
        return ResponseEntity.ok(songService.getSongsByArtistId(artistId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Song> updateSong(@PathVariable Long id, @RequestBody Map<String, Object> songData) {
        Long artistId = songData.get("artistId") != null ? Long.valueOf(songData.get("artistId").toString()) : null;
        Song song = songService.updateSong(
                id,
                (String) songData.get("title"),
                (String) songData.get("artist"),
                (String) songData.get("featuredArtists"),
                (String) songData.get("producer"),
                artistId
        );
        if (song != null) {
            return ResponseEntity.ok(song);
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSong(
            @PathVariable Long id,
            @RequestParam(value = "artistId", required = false) Long artistId) {
        boolean deleted = artistId != null
                ? songService.deleteSongForArtist(id, artistId)
                : songService.deleteSong(id);
        if (deleted) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/{id}/play")
    public ResponseEntity<Map<String, Object>> playSong(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        Song song = songService.incrementViews(id);
        if (song != null) {
            response.put("success", true);
            response.put("song", song);
            return ResponseEntity.ok(response);
        }
        response.put("success", false);
        response.put("message", "Song not found");
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/{id}/like")
    public ResponseEntity<Map<String, Object>> likeSong(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        Song song = songService.incrementLikes(id);
        if (song != null) {
            response.put("success", true);
            response.put("song", song);
            return ResponseEntity.ok(response);
        }
        response.put("success", false);
        response.put("message", "Song not found");
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/{id}/dislike")
    public ResponseEntity<Map<String, Object>> dislikeSong(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        Song song = songService.incrementDislikes(id);
        if (song != null) {
            response.put("success", true);
            response.put("song", song);
            return ResponseEntity.ok(response);
        }
        response.put("success", false);
        response.put("message", "Song not found");
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/{id}/share")
    public ResponseEntity<Map<String, Object>> shareSong(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        Song song = songService.incrementShares(id);
        if (song != null && song.getShareToken() != null) {
            // Generate shareable link using frontend URL with token as query parameter
            // This ensures it works even if /share route doesn't exist on frontend yet
            String cleanFrontendUrl = frontendUrl.endsWith("/") ? frontendUrl.substring(0, frontendUrl.length() - 1) : frontendUrl;
            String shareableUrl = cleanFrontendUrl + "/songs?share=" + song.getShareToken();
            response.put("success", true);
            response.put("shareableUrl", shareableUrl);
            response.put("song", song);
            return ResponseEntity.ok(response);
        }
        response.put("success", false);
        response.put("message", "Song not found");
        return ResponseEntity.notFound().build();
    }

    /**
     * Redirect endpoint for share links - redirects to frontend website
     * This endpoint can be used as a fallback if frontend route doesn't exist yet
     * Always redirects to /songs page (main website) to avoid 404 errors
     */
    @GetMapping("/share/{token}")
    public ResponseEntity<Void> redirectShareLink(@PathVariable String token) {
        java.util.Optional<Song> songOpt = songService.getSongByShareToken(token);
        String cleanFrontendUrl = frontendUrl.endsWith("/") ? frontendUrl.substring(0, frontendUrl.length() - 1) : frontendUrl;
        
        if (songOpt.isPresent()) {
            // Redirect to songs page with share token as query parameter
            // Frontend can then handle the token and navigate to the specific song
            String redirectUrl = cleanFrontendUrl + "/songs?share=" + token;
            return ResponseEntity.status(HttpStatus.FOUND)
                    .header(HttpHeaders.LOCATION, redirectUrl)
                    .build();
        }
        // If token not found, redirect to songs page (main website)
        String redirectUrl = cleanFrontendUrl + "/songs";
        return ResponseEntity.status(HttpStatus.FOUND)
                .header(HttpHeaders.LOCATION, redirectUrl)
                .build();
    }

    /**
     * API endpoint to resolve share token and get song information
     * Frontend can call this to get the song ID from a share token
     */
    @GetMapping("/share/{token}/resolve")
    public ResponseEntity<Map<String, Object>> resolveShareToken(@PathVariable String token) {
        Map<String, Object> response = new HashMap<>();
        java.util.Optional<Song> songOpt = songService.getSongByShareToken(token);
        if (songOpt.isPresent()) {
            Song song = songOpt.get();
            response.put("success", true);
            response.put("songId", song.getId());
            response.put("song", song);
            return ResponseEntity.ok(response);
        }
        response.put("success", false);
        response.put("message", "Invalid share token");
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<Resource> downloadSong(@PathVariable Long id) {
        File songFile = songService.getSongFile(id);
        if (songFile != null && songFile.exists()) {
            songService.incrementDownloads(id);
            
            // Get song to use its title and artist as filename
            String filename = songFile.getName(); // Default to stored filename
            java.util.Optional<Song> songOpt = songService.getSongById(id);
            if (songOpt.isPresent()) {
                Song song = songOpt.get();
                // Create filename in format: "Artist - Title.mp3"
                String artist = song.getArtist() != null ? sanitizeFilename(song.getArtist()) : "";
                String title = song.getTitle() != null ? sanitizeFilename(song.getTitle()) : "song";
                
                // Build filename
                if (!artist.isEmpty()) {
                    filename = artist + " - " + title;
                } else {
                    filename = title;
                }
                
                // Add extension
                String extension = "";
                int lastDot = songFile.getName().lastIndexOf('.');
                if (lastDot > 0) {
                    extension = songFile.getName().substring(lastDot);
                } else {
                    extension = ".mp3";
                }
                filename = filename + extension;
            }
            
            Resource resource = new FileSystemResource(songFile);
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType("audio/mpeg"))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .body(resource);
        }
        return ResponseEntity.notFound().build();
    }
    
    /**
     * Sanitizes a filename by removing or replacing invalid characters
     */
    private String sanitizeFilename(String filename) {
        if (filename == null || filename.isEmpty()) {
            return "song";
        }
        // Replace invalid filename characters with underscore
        // Windows/Linux invalid chars: < > : " / \ | ? *
        String sanitized = filename.replaceAll("[<>:\"/\\\\|?*]", "_");
        // Remove leading/trailing dots and spaces
        sanitized = sanitized.replaceAll("^\\.+|\\.+$", "").trim();
        // Limit length to avoid filesystem issues (max 255 chars, but keep it shorter)
        if (sanitized.length() > 200) {
            sanitized = sanitized.substring(0, 200);
        }
        // If empty after sanitization, use default
        if (sanitized.isEmpty()) {
            sanitized = "song";
        }
        return sanitized;
    }
}

