package com.ytnafrica.backend.service;

import com.ytnafrica.backend.model.Album;
import com.ytnafrica.backend.model.Song;
import com.ytnafrica.backend.repository.AlbumRepository;
import com.ytnafrica.backend.repository.SongRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Optional;

@Service
public class AlbumService {

    @Autowired
    private AlbumRepository albumRepository;

    @Autowired
    private SongRepository songRepository;

    @Autowired
    private FileStorageService fileStorageService;

    @Autowired
    private MP3MetadataService mp3MetadataService;

    @Autowired
    @Lazy
    private ArtistService artistService;

    public List<Album> getAllAlbums() {
        return albumRepository.findAll();
    }

    public Optional<Album> getAlbumById(Long id) {
        return albumRepository.findById(id);
    }

    public Album createAlbum(String title, String artist, MultipartFile coverArt) throws Exception {
        // Store cover art
        String coverArtPath = fileStorageService.storeCoverArt(coverArt);

        // Create album
        Album album = new Album(title, artist, coverArtPath);
        return albumRepository.save(album);
    }

    public Album createAlbumWithSongs(String title, String artist, MultipartFile coverArt,
                                      String[] songTitles, String[] songArtists, String[] songFeaturedArtists,
                                      String[] songProducers, Integer[] songTrackNumbers, MultipartFile[] mp3Files,
                                      Long artistId) throws Exception {
        String resolvedArtist = artistService.resolveArtistName(artistId, artist);
        // Store cover art
        String coverArtPath = fileStorageService.storeCoverArt(coverArt);

        // Create album
        Album album = new Album(title, resolvedArtist, coverArtPath);
        album.setArtistId(artistId);
        album = albumRepository.save(album);

        // Process each song
        for (int i = 0; i < songTitles.length; i++) {
            String songTitle = songTitles[i];
            String songArtist = artistService.resolveArtistName(artistId, songArtists[i]);
            String featuredArtists = (songFeaturedArtists != null && i < songFeaturedArtists.length) 
                    ? songFeaturedArtists[i] : null;
            String producer = songProducers[i];
            Integer trackNumber = songTrackNumbers[i];
            MultipartFile mp3File = mp3Files[i];

            // Store MP3 file (returns filename only)
            String mp3Filename = fileStorageService.storeSong(mp3File);

            // Get full paths for metadata operations
            String mp3FullPath = fileStorageService.getSongFullPath(mp3Filename);
            String coverArtFullPath = fileStorageService.getCoverArtFullPath(album.getCoverArtPath());

            // Set all metadata and embed cover art in a single operation (much faster - 3x speed improvement)
            mp3MetadataService.setAllMetadata(mp3FullPath, songTitle, songArtist, featuredArtists, producer, trackNumber,
                                            album.getTitle(), album.getArtist(), coverArtFullPath);

            // Create song - store only filename in database
            Song song = new Song(songTitle, songArtist, featuredArtists, producer, trackNumber, mp3Filename, album.getCoverArtPath());
            song.setArtistId(artistId);
            song.setAlbum(album);
            song = songRepository.save(song);

            album.getSongs().add(song);
        }

        // Save album with all songs
        return albumRepository.save(album);
    }

    public Album addSongToAlbum(Long albumId, String title, String artist, String featuredArtists,
                                String producer, Integer trackNumber, MultipartFile mp3File) throws Exception {
        Optional<Album> albumOpt = albumRepository.findById(albumId);
        if (!albumOpt.isPresent()) {
            throw new RuntimeException("Album not found");
        }

        Album album = albumOpt.get();

        // Store MP3 file (returns filename only)
        String mp3Filename = fileStorageService.storeSong(mp3File);

        // Get full paths for metadata operations
        String mp3FullPath = fileStorageService.getSongFullPath(mp3Filename);
        String coverArtFullPath = fileStorageService.getCoverArtFullPath(album.getCoverArtPath());

        // Set all metadata and embed cover art in a single operation (much faster - 3x speed improvement)
        mp3MetadataService.setAllMetadata(mp3FullPath, title, artist, featuredArtists, producer, trackNumber,
                                        album.getTitle(), album.getArtist(), coverArtFullPath);

        // Create song - store only filename in database
        Song song = new Song(title, artist, featuredArtists, producer, trackNumber, mp3Filename, album.getCoverArtPath());
        song.setAlbum(album);
        song = songRepository.save(song);

        album.getSongs().add(song);
        return albumRepository.save(album);
    }

    public Album updateAlbum(Long id, String title, String artist, Long artistId) {
        Optional<Album> albumOpt = albumRepository.findById(id);
        if (albumOpt.isPresent()) {
            Album album = albumOpt.get();
            album.setTitle(title);
            if (artistId != null) {
                album.setArtistId(artistId);
                album.setArtist(artistService.resolveArtistName(artistId, artist));
            } else if (album.getArtistId() == null) {
                album.setArtist(artist);
            }
            album = albumRepository.save(album);

            List<Song> tracks = songRepository.findByAlbumId(id);
            for (Song track : tracks) {
                track.setArtist(album.getArtist());
                if (album.getArtistId() != null) {
                    track.setArtistId(album.getArtistId());
                }
                songRepository.save(track);
            }
            album.setSongs(tracks);
            return album;
        }
        return null;
    }

    public List<Album> getAlbumsByArtistId(Long artistId) {
        return albumRepository.findByArtistId(artistId);
    }

    public boolean deleteAlbum(Long id) {
        Optional<Album> albumOpt = albumRepository.findById(id);
        if (albumOpt.isPresent()) {
            albumRepository.delete(albumOpt.get());
            return true;
        }
        return false;
    }

    public boolean deleteAlbumForArtist(Long id, Long artistId) {
        Optional<Album> albumOpt = albumRepository.findById(id);
        if (albumOpt.isPresent() && artistId != null && artistId.equals(albumOpt.get().getArtistId())) {
            albumRepository.delete(albumOpt.get());
            return true;
        }
        return false;
    }
}

