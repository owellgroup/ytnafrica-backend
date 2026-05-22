package com.ytnafrica.backend.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "songs")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Song {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String artist;

    @Column(name = "artist_id")
    private Long artistId;

    @Column(name = "featured_artists")
    private String featuredArtists;

    @Column(nullable = false)
    private String producer;

    @Column(name = "track_number")
    private Integer trackNumber;

    @Column(name = "file_path", nullable = false)
    private String filePath;

    @Column(name = "cover_art_path")
    private String coverArtPath;

    @Column(name = "views")
    private Long views = 0L;

    @Column(name = "likes")
    private Long likes = 0L;

    @Column(name = "dislikes")
    private Long dislikes = 0L;

    @Column(name = "downloads")
    private Long downloads = 0L;

    @Column(name = "shares")
    private Long shares = 0L;

    @Column(name = "share_token", unique = true)
    private String shareToken;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "album_id")
    @JsonBackReference
    private Album album;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    // Constructors
    public Song() {}

    public Song(String title, String artist, String featuredArtists, String producer, 
                Integer trackNumber, String filePath, String coverArtPath) {
        this.title = title;
        this.artist = artist;
        this.featuredArtists = featuredArtists;
        this.producer = producer;
        this.trackNumber = trackNumber;
        this.filePath = filePath;
        this.coverArtPath = coverArtPath;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getArtist() {
        return artist;
    }

    public void setArtist(String artist) {
        this.artist = artist;
    }

    public Long getArtistId() {
        return artistId;
    }

    public void setArtistId(Long artistId) {
        this.artistId = artistId;
    }

    public String getFeaturedArtists() {
        return featuredArtists;
    }

    public void setFeaturedArtists(String featuredArtists) {
        this.featuredArtists = featuredArtists;
    }

    public String getProducer() {
        return producer;
    }

    public void setProducer(String producer) {
        this.producer = producer;
    }

    public Integer getTrackNumber() {
        return trackNumber;
    }

    public void setTrackNumber(Integer trackNumber) {
        this.trackNumber = trackNumber;
    }

    public String getFilePath() {
        return filePath;
    }

    public void setFilePath(String filePath) {
        this.filePath = filePath;
    }

    public String getCoverArtPath() {
        return coverArtPath;
    }

    public void setCoverArtPath(String coverArtPath) {
        this.coverArtPath = coverArtPath;
    }

    public Long getViews() {
        return views;
    }

    public void setViews(Long views) {
        this.views = views;
    }

    public Long getLikes() {
        return likes;
    }

    public void setLikes(Long likes) {
        this.likes = likes;
    }

    public Long getDislikes() {
        return dislikes;
    }

    public void setDislikes(Long dislikes) {
        this.dislikes = dislikes;
    }

    public Long getDownloads() {
        return downloads;
    }

    public void setDownloads(Long downloads) {
        this.downloads = downloads;
    }

    public Long getShares() {
        return shares;
    }

    public void setShares(Long shares) {
        this.shares = shares;
    }

    public String getShareToken() {
        return shareToken;
    }

    public void setShareToken(String shareToken) {
        this.shareToken = shareToken;
    }

    public Album getAlbum() {
        return album;
    }

    public void setAlbum(Album album) {
        this.album = album;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}

