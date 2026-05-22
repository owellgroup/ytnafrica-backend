package com.ytnafrica.backend.service;

import com.ytnafrica.backend.model.Album;
import com.ytnafrica.backend.model.Artist;
import com.ytnafrica.backend.model.Song;
import com.ytnafrica.backend.repository.AlbumRepository;
import com.ytnafrica.backend.repository.ArtistRepository;
import com.ytnafrica.backend.repository.SongRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class ArtistService {

    @Autowired
    private ArtistRepository artistRepository;

    @Autowired
    private SongRepository songRepository;

    @Autowired
    private AlbumRepository albumRepository;

    @Autowired
    private FileStorageService fileStorageService;

    public Artist login(String email, String password) {
        Optional<Artist> artistOpt = artistRepository.findByEmail(email);
        if (artistOpt.isPresent()) {
            Artist artist = artistOpt.get();
            if (artist.getPassword().equals(password)) {
                return artist;
            }
        }
        return null;
    }

    public List<Artist> getAllArtists() {
        return artistRepository.findAll();
    }

    public Optional<Artist> getArtistById(Long id) {
        return artistRepository.findById(id);
    }

    public Artist createArtist(String email, String password, String artistName,
                               boolean verified, MultipartFile profileImage) throws Exception {
        if (artistRepository.findByEmail(email).isPresent()) {
            throw new IllegalArgumentException("Email already registered");
        }
        Artist artist = new Artist();
        artist.setEmail(email);
        artist.setPassword(password);
        artist.setArtistName(artistName);
        artist.setVerified(verified);
        if (profileImage != null && !profileImage.isEmpty()) {
            artist.setProfileImagePath(fileStorageService.storeCoverArt(profileImage));
        }
        return artistRepository.save(artist);
    }

    public Artist updateArtist(Long id, String email, String password, String artistName,
                               Boolean verified, MultipartFile profileImage) throws Exception {
        Optional<Artist> artistOpt = artistRepository.findById(id);
        if (!artistOpt.isPresent()) {
            return null;
        }
        Artist artist = artistOpt.get();
        if (email != null && !email.isBlank()) {
            Optional<Artist> existingByEmail = artistRepository.findByEmail(email);
            if (existingByEmail.isPresent() && !existingByEmail.get().getId().equals(id)) {
                throw new IllegalArgumentException("Email already in use");
            }
            artist.setEmail(email);
        }
        if (password != null && !password.isBlank()) {
            artist.setPassword(password);
        }
        if (artistName != null && !artistName.isBlank()) {
            String oldName = artist.getArtistName();
            artist.setArtistName(artistName);
            syncArtistNameOnContent(id, oldName, artistName);
        }
        if (verified != null) {
            artist.setVerified(verified);
        }
        if (profileImage != null && !profileImage.isEmpty()) {
            artist.setProfileImagePath(fileStorageService.storeCoverArt(profileImage));
        }
        return artistRepository.save(artist);
    }

    public void deleteArtist(Long id) {
        artistRepository.deleteById(id);
    }

    public Map<String, Object> getArtistProfile(Long id) {
        Optional<Artist> artistOpt = artistRepository.findById(id);
        if (!artistOpt.isPresent()) {
            return null;
        }
        Artist artist = artistOpt.get();
        List<Song> songs = songRepository.findByArtistId(id);
        List<Album> albums = albumRepository.findByArtistId(id);
        Map<String, Object> profile = new HashMap<>();
        profile.put("artist", artist);
        profile.put("songs", songs);
        profile.put("albums", albums);
        return profile;
    }

    private void syncArtistNameOnContent(Long artistId, String oldName, String newName) {
        songRepository.findByArtistId(artistId).forEach(song -> {
            if (song.getArtist().equals(oldName)) {
                song.setArtist(newName);
                songRepository.save(song);
            }
        });
        albumRepository.findByArtistId(artistId).forEach(album -> {
            if (album.getArtist().equals(oldName)) {
                album.setArtist(newName);
                albumRepository.save(album);
            }
        });
    }

    public String resolveArtistName(Long artistId, String fallbackArtist) {
        if (artistId == null) {
            return fallbackArtist;
        }
        return artistRepository.findById(artistId)
                .map(Artist::getArtistName)
                .orElse(fallbackArtist);
    }

    public boolean isArtistVerified(Long artistId) {
        if (artistId == null) {
            return false;
        }
        return artistRepository.findById(artistId)
                .map(Artist::isVerified)
                .orElse(false);
    }
}
