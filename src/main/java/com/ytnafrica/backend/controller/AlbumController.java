package com.ytnafrica.backend.controller;

import com.ytnafrica.backend.model.Album;
import com.ytnafrica.backend.service.AlbumService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/albums")
public class AlbumController {

    @Autowired
    private AlbumService albumService;

    @PostMapping("/upload")
    public ResponseEntity<Map<String, Object>> uploadAlbum(
            @RequestParam("title") String title,
            @RequestParam("artist") String artist,
            @RequestParam(value = "artistId", required = false) Long artistId,
            @RequestParam("coverArt") MultipartFile coverArt,
            @RequestParam("songTitles") String[] songTitles,
            @RequestParam("songArtists") String[] songArtists,
            @RequestParam(value = "songFeaturedArtists", required = false) String[] songFeaturedArtists,
            @RequestParam("songProducers") String[] songProducers,
            @RequestParam("songTrackNumbers") Integer[] songTrackNumbers,
            @RequestParam("mp3Files") MultipartFile[] mp3Files) {
        Map<String, Object> response = new HashMap<>();
        try {
            // Validate arrays have same length
            if (songTitles.length != songArtists.length || 
                songTitles.length != songProducers.length || 
                songTitles.length != songTrackNumbers.length || 
                songTitles.length != mp3Files.length) {
                response.put("success", false);
                response.put("message", "All song arrays must have the same length");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }

            // Validate featured artists array if provided
            if (songFeaturedArtists != null && songFeaturedArtists.length != songTitles.length) {
                response.put("success", false);
                response.put("message", "songFeaturedArtists array must have the same length as other song arrays");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }

            Album album = albumService.createAlbumWithSongs(
                    title, artist, coverArt, 
                    songTitles, songArtists, songFeaturedArtists, 
                    songProducers, songTrackNumbers, mp3Files, artistId);
            
            response.put("success", true);
            response.put("message", "Album with songs uploaded successfully");
            response.put("album", album);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Failed to upload album: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    @GetMapping
    public ResponseEntity<List<Album>> getAllAlbums() {
        return ResponseEntity.ok(albumService.getAllAlbums());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Album> getAlbumById(@PathVariable Long id) {
        return albumService.getAlbumById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/artist/{artistId}")
    public ResponseEntity<List<Album>> getAlbumsByArtist(@PathVariable Long artistId) {
        return ResponseEntity.ok(albumService.getAlbumsByArtistId(artistId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Album> updateAlbum(@PathVariable Long id, @RequestBody Map<String, Object> albumData) {
        Long artistId = albumData.get("artistId") != null ? Long.valueOf(albumData.get("artistId").toString()) : null;
        Album album = albumService.updateAlbum(id, (String) albumData.get("title"), (String) albumData.get("artist"), artistId);
        if (album != null) {
            return ResponseEntity.ok(album);
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAlbum(
            @PathVariable Long id,
            @RequestParam(value = "artistId", required = false) Long artistId) {
        boolean deleted = artistId != null
                ? albumService.deleteAlbumForArtist(id, artistId)
                : albumService.deleteAlbum(id);
        if (deleted) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}

