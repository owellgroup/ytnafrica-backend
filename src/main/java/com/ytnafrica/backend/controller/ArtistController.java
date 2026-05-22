package com.ytnafrica.backend.controller;

import com.ytnafrica.backend.model.Artist;
import com.ytnafrica.backend.service.ArtistService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/artists")
public class ArtistController {

    @Autowired
    private ArtistService artistService;

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, String> credentials) {
        String email = credentials.get("email");
        String password = credentials.get("password");
        Artist artist = artistService.login(email, password);
        Map<String, Object> response = new HashMap<>();
        if (artist != null) {
            response.put("success", true);
            response.put("message", "Login successful");
            response.put("artist", artist);
            return ResponseEntity.ok(response);
        }
        response.put("success", false);
        response.put("message", "Invalid email or password");
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<Artist>> getAllArtists() {
        return ResponseEntity.ok(artistService.getAllArtists());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Artist> getArtistById(@PathVariable Long id) {
        return artistService.getArtistById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/profile")
    public ResponseEntity<Map<String, Object>> getArtistProfile(@PathVariable Long id) {
        Map<String, Object> profile = artistService.getArtistProfile(id);
        if (profile != null) {
            return ResponseEntity.ok(profile);
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping
    public ResponseEntity<?> createArtist(
            @RequestParam("email") String email,
            @RequestParam("password") String password,
            @RequestParam("artistName") String artistName,
            @RequestParam(value = "verified", defaultValue = "false") boolean verified,
            @RequestParam(value = "profileImage", required = false) MultipartFile profileImage) {
        try {
            Artist artist = artistService.createArtist(email, password, artistName, verified, profileImage);
            return ResponseEntity.status(HttpStatus.CREATED).body(artist);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateArtist(
            @PathVariable Long id,
            @RequestParam(value = "email", required = false) String email,
            @RequestParam(value = "password", required = false) String password,
            @RequestParam(value = "artistName", required = false) String artistName,
            @RequestParam(value = "verified", required = false) Boolean verified,
            @RequestParam(value = "profileImage", required = false) MultipartFile profileImage) {
        try {
            Artist artist = artistService.updateArtist(id, email, password, artistName, verified, profileImage);
            if (artist != null) {
                return ResponseEntity.ok(artist);
            }
            return ResponseEntity.notFound().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteArtist(@PathVariable Long id) {
        artistService.deleteArtist(id);
        return ResponseEntity.noContent().build();
    }
}
