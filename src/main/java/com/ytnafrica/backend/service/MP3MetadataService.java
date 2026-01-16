package com.ytnafrica.backend.service;

import com.mpatric.mp3agic.ID3v24Tag;
import com.mpatric.mp3agic.Mp3File;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;

@Service
public class MP3MetadataService {

    /**
     * Creates a fresh ID3v24Tag to avoid obsolete frames issues.
     * Always creates a new tag instead of reusing existing ones that may contain obsolete frames.
     */
    private ID3v24Tag createFreshTag(Mp3File mp3) {
        // Always create a fresh ID3v24Tag to avoid "Packing Obsolete frames" error
        // This ensures we don't try to pack obsolete frames from older ID3v2 versions
        return new ID3v24Tag();
    }

    /**
     * Combined method to set all metadata and embed cover art in a single operation.
     * This is much more efficient than calling separate methods multiple times.
     * 
     * @param mp3FilePath Path to the MP3 file
     * @param title Song title
     * @param artist Song artist
     * @param featuredArtists Featured artists
     * @param producer Producer
     * @param trackNumber Track number
     * @param albumTitle Album title (optional)
     * @param albumArtist Album artist (optional)
     * @param coverArtFilePath Path to the cover art image file (optional)
     * @throws Exception If setting metadata fails
     */
    public void setAllMetadata(String mp3FilePath, String title, String artist, 
                              String featuredArtists, String producer, Integer trackNumber,
                              String albumTitle, String albumArtist, String coverArtFilePath) throws Exception {
        try {
            File mp3File = new File(mp3FilePath);
            if (!mp3File.exists()) {
                throw new IOException("MP3 file not found: " + mp3FilePath);
            }

            // Read MP3 file
            Mp3File mp3 = new Mp3File(mp3FilePath);
            
            // Always create a fresh ID3v24Tag to avoid obsolete frames error
            ID3v24Tag id3v2Tag = createFreshTag(mp3);
            mp3.setId3v2Tag(id3v2Tag);

            // Set song metadata fields
            if (title != null) id3v2Tag.setTitle(title);
            if (artist != null) {
                String artistName = artist;
                if (featuredArtists != null && !featuredArtists.isEmpty()) {
                    artistName = artist + " ft. " + featuredArtists;
                }
                id3v2Tag.setArtist(artistName);
            }
            if (producer != null) {
                // Producer is stored in TPE4 frame (usually "Interpreted, remixed, or otherwise modified by")
                id3v2Tag.setOriginalArtist(producer);
            }
            if (trackNumber != null) {
                id3v2Tag.setTrack(String.valueOf(trackNumber));
            }

            // Set album metadata if provided
            if (albumTitle != null) id3v2Tag.setAlbum(albumTitle);
            if (albumArtist != null) id3v2Tag.setAlbumArtist(albumArtist);

            // Embed cover art if provided
            if (coverArtFilePath != null) {
                File coverArtFile = new File(coverArtFilePath);
                if (coverArtFile.exists()) {
                    byte[] imageData = Files.readAllBytes(coverArtFile.toPath());
                    id3v2Tag.setAlbumImage(imageData, getMimeType(coverArtFilePath));
                }
            }

            // Save the MP3 file with updated tag (single write operation)
            String tempPath = mp3FilePath + ".tmp";
            mp3.save(tempPath);
            
            // Atomic file replacement
            File originalFile = new File(mp3FilePath);
            File tempFile = new File(tempPath);
            if (originalFile.delete()) {
                if (!tempFile.renameTo(originalFile)) {
                    throw new IOException("Failed to rename temporary file");
                }
            } else {
                throw new IOException("Failed to delete original file");
            }
            
        } catch (Exception e) {
            throw new Exception("Failed to set MP3 metadata: " + e.getMessage(), e);
        }
    }

    /**
     * Embeds cover art into MP3 file metadata
     * @param mp3FilePath Path to the MP3 file
     * @param coverArtFilePath Path to the cover art image file
     * @throws Exception If embedding fails
     */
    public void embedCoverArt(String mp3FilePath, String coverArtFilePath) throws Exception {
        try {
            File mp3File = new File(mp3FilePath);
            File coverArtFile = new File(coverArtFilePath);

            if (!mp3File.exists()) {
                throw new IOException("MP3 file not found: " + mp3FilePath);
            }
            if (!coverArtFile.exists()) {
                throw new IOException("Cover art file not found: " + coverArtFilePath);
            }

            // Read MP3 file
            Mp3File mp3 = new Mp3File(mp3FilePath);
            
            // Always create a fresh ID3v24Tag to avoid obsolete frames error
            ID3v24Tag id3v2Tag = createFreshTag(mp3);
            mp3.setId3v2Tag(id3v2Tag);

            // Read cover art image
            byte[] imageData = Files.readAllBytes(coverArtFile.toPath());
            
            // Set album art (APIC frame)
            id3v2Tag.setAlbumImage(imageData, getMimeType(coverArtFilePath));
            
            // Save the MP3 file with updated tag
            String tempPath = mp3FilePath + ".tmp";
            mp3.save(tempPath);
            
            // Atomic file replacement
            File originalFile = new File(mp3FilePath);
            File tempFile = new File(tempPath);
            if (originalFile.delete()) {
                if (!tempFile.renameTo(originalFile)) {
                    throw new IOException("Failed to rename temporary file");
                }
            } else {
                throw new IOException("Failed to delete original file");
            }
            
        } catch (Exception e) {
            throw new Exception("Failed to embed cover art into MP3: " + e.getMessage(), e);
        }
    }

    /**
     * Sets MP3 metadata (title, artist, featured artists, producer, track number)
     * @param mp3FilePath Path to the MP3 file
     * @param title Song title
     * @param artist Song artist
     * @param featuredArtists Featured artists
     * @param producer Producer
     * @param trackNumber Track number
     * @throws Exception If setting metadata fails
     */
    public void setMetadata(String mp3FilePath, String title, String artist, 
                           String featuredArtists, String producer, Integer trackNumber) throws Exception {
        // Use the combined method for consistency
        setAllMetadata(mp3FilePath, title, artist, featuredArtists, producer, trackNumber, null, null, null);
    }

    /**
     * Sets album metadata for MP3
     * @param mp3FilePath Path to the MP3 file
     * @param albumTitle Album title
     * @param albumArtist Album artist
     * @throws Exception If setting metadata fails
     */
    public void setAlbumMetadata(String mp3FilePath, String albumTitle, String albumArtist) throws Exception {
        try {
            File mp3File = new File(mp3FilePath);
            if (!mp3File.exists()) {
                throw new IOException("MP3 file not found: " + mp3FilePath);
            }

            // Read MP3 file
            Mp3File mp3 = new Mp3File(mp3FilePath);
            
            // Always create a fresh ID3v24Tag to avoid obsolete frames error
            ID3v24Tag id3v2Tag = createFreshTag(mp3);
            mp3.setId3v2Tag(id3v2Tag);

            if (albumTitle != null) id3v2Tag.setAlbum(albumTitle);
            if (albumArtist != null) id3v2Tag.setAlbumArtist(albumArtist);

            // Save the MP3 file with updated tag
            String tempPath = mp3FilePath + ".tmp";
            mp3.save(tempPath);
            
            // Atomic file replacement
            File originalFile = new File(mp3FilePath);
            File tempFile = new File(tempPath);
            if (originalFile.delete()) {
                if (!tempFile.renameTo(originalFile)) {
                    throw new IOException("Failed to rename temporary file");
                }
            } else {
                throw new IOException("Failed to delete original file");
            }
            
        } catch (Exception e) {
            throw new Exception("Failed to set album metadata: " + e.getMessage(), e);
        }
    }

    /**
     * Determines MIME type from file extension
     * @param filePath Path to the image file
     * @return MIME type string
     */
    private String getMimeType(String filePath) {
        String lowerPath = filePath.toLowerCase();
        if (lowerPath.endsWith(".jpg") || lowerPath.endsWith(".jpeg")) {
            return "image/jpeg";
        } else if (lowerPath.endsWith(".png")) {
            return "image/png";
        } else if (lowerPath.endsWith(".gif")) {
            return "image/gif";
        } else if (lowerPath.endsWith(".bmp")) {
            return "image/bmp";
        }
        return "image/jpeg"; // Default to JPEG
    }
}

