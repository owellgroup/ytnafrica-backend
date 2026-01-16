package com.ytnafrica.backend.service;

import com.ytnafrica.backend.model.Song;
import com.ytnafrica.backend.repository.SongRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.List;
import java.util.Optional;

@Service
public class SongService {

    @Autowired
    private SongRepository songRepository;

    @Autowired
    private FileStorageService fileStorageService;

    @Autowired
    private MP3MetadataService mp3MetadataService;

    public List<Song> getAllSongs() {
        return songRepository.findAll();
    }

    public Optional<Song> getSongById(Long id) {
        return songRepository.findById(id);
    }

    public Song createSingleTrack(String title, String artist, String featuredArtists,
                                 String producer, MultipartFile coverArt, MultipartFile mp3File) throws Exception {
        // Store cover art (returns filename only)
        String coverArtFilename = fileStorageService.storeCoverArt(coverArt);

        // Store MP3 file (returns filename only)
        String mp3Filename = fileStorageService.storeSong(mp3File);

        // Get full paths for metadata operations
        String mp3FullPath = fileStorageService.getSongFullPath(mp3Filename);
        String coverArtFullPath = fileStorageService.getCoverArtFullPath(coverArtFilename);

        // Set all metadata and embed cover art in a single operation (much faster)
        mp3MetadataService.setAllMetadata(mp3FullPath, title, artist, featuredArtists, producer, null, 
                                         null, null, coverArtFullPath);

        // Create song - store only filenames in database for consistency
        Song song = new Song(title, artist, featuredArtists, producer, null, mp3Filename, coverArtFilename);
        return songRepository.save(song);
    }

    public Song updateSong(Long id, String title, String artist, String featuredArtists, String producer) {
        Optional<Song> songOpt = songRepository.findById(id);
        if (songOpt.isPresent()) {
            Song song = songOpt.get();
            song.setTitle(title);
            song.setArtist(artist);
            song.setFeaturedArtists(featuredArtists);
            song.setProducer(producer);
            return songRepository.save(song);
        }
        return null;
    }

    public void deleteSong(Long id) {
        songRepository.deleteById(id);
    }

    public Song incrementViews(Long id) {
        Optional<Song> songOpt = songRepository.findById(id);
        if (songOpt.isPresent()) {
            Song song = songOpt.get();
            song.setViews(song.getViews() + 1);
            return songRepository.save(song);
        }
        return null;
    }

    public Song incrementLikes(Long id) {
        Optional<Song> songOpt = songRepository.findById(id);
        if (songOpt.isPresent()) {
            Song song = songOpt.get();
            song.setLikes(song.getLikes() + 1);
            return songRepository.save(song);
        }
        return null;
    }

    public Song incrementDislikes(Long id) {
        Optional<Song> songOpt = songRepository.findById(id);
        if (songOpt.isPresent()) {
            Song song = songOpt.get();
            song.setDislikes(song.getDislikes() + 1);
            return songRepository.save(song);
        }
        return null;
    }

    public Song incrementDownloads(Long id) {
        Optional<Song> songOpt = songRepository.findById(id);
        if (songOpt.isPresent()) {
            Song song = songOpt.get();
            song.setDownloads(song.getDownloads() + 1);
            return songRepository.save(song);
        }
        return null;
    }

    public Song incrementShares(Long id) {
        Optional<Song> songOpt = songRepository.findById(id);
        if (songOpt.isPresent()) {
            Song song = songOpt.get();
            song.setShares(song.getShares() + 1);
            
            // Generate a random share token if it doesn't exist
            if (song.getShareToken() == null || song.getShareToken().isEmpty()) {
                song.setShareToken(generateShareToken());
            }
            
            return songRepository.save(song);
        }
        return null;
    }

    /**
     * Generates a random URL-safe token for sharing
     */
    private String generateShareToken() {
        SecureRandom random = new SecureRandom();
        byte[] bytes = new byte[16];
        random.nextBytes(bytes);
        // Use Base64 URL-safe encoding to create a random token
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    /**
     * Finds a song by its share token
     */
    public Optional<Song> getSongByShareToken(String shareToken) {
        return songRepository.findByShareToken(shareToken);
    }

    public File getSongFile(Long id) {
        Optional<Song> songOpt = songRepository.findById(id);
        if (songOpt.isPresent()) {
            Song song = songOpt.get();
            return fileStorageService.getFile(song.getFilePath());
        }
        return null;
    }

    public List<Song> getSongsByAlbum(Long albumId) {
        return songRepository.findByAlbumId(albumId);
    }
}

