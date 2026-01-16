# MLMusik Music Streaming API - Complete Guide

## Table of Contents
1. [Overview](#overview)
2. [Setup Instructions](#setup-instructions)
3. [API Endpoints](#api-endpoints)
4. [Upload Workflows](#upload-workflows)
5. [Postman Testing Guide](#postman-testing-guide)
6. [Sample Requests](#sample-requests)
7. [Error Handling](#error-handling)

---

## Overview

MLMusik is a complete music streaming system backend built with Java Spring Boot. The system supports:

- **Album Upload**: Upload albums with multiple songs, each with individual metadata
- **Single Track Upload**: Upload individual tracks with complete metadata
- **MP3 Metadata Embedding**: Automatically embeds cover art into MP3 files
- **User Interactions**: Play, like, dislike, share, and download songs
- **Statistics Tracking**: Views, likes, downloads, and shares

---

## Setup Instructions

### Prerequisites
- Java 17 or higher
- Maven 3.6+
- PostgreSQL 12+
- Postman (for API testing)

### Database Setup

1. **Create PostgreSQL Database**:
```sql
CREATE DATABASE mlmusik;
```

2. **Update `application.properties`**:
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/mlmusik
spring.datasource.username=your_username
spring.datasource.password=your_password
```

### Running the Application

1. **Navigate to backend directory**:
```bash
cd backend
```

2. **Build the project**:
```bash
mvn clean install
```

3. **Run the application**:
```bash
mvn spring-boot:run
```

The API will be available at: `http://localhost:8080/api`

### File Storage

The application creates the following directories automatically:
- `./uploads/cover-art/` - Stores cover art images
- `./uploads/songs/` - Stores MP3 files

---

## API Endpoints

### Base URL
```
http://localhost:8080/api
```

### Admin Endpoints

#### 1. Admin Login
```
POST /admin/login
Content-Type: application/json

{
    "email": "admin@mlmusik.com",
    "password": "admin123"
}
```

**Response:**
```json
{
    "success": true,
    "message": "Login successful",
    "admin": {
        "id": 1,
        "email": "admin@mlmusik.com",
        "createdAt": "2024-01-01T10:00:00"
    }
}
```

#### 2. Create Admin
```
POST /admin
Content-Type: application/json

{
    "email": "admin@mlmusik.com",
    "password": "admin123"
}
```

#### 3. Get All Admins
```
GET /admin
```

#### 4. Get Admin By ID
```
GET /admin/{id}
```

#### 5. Update Admin
```
PUT /admin/{id}
Content-Type: application/json

{
    "email": "newemail@mlmusik.com",
    "password": "newpassword"
}
```

#### 6. Delete Admin
```
DELETE /admin/{id}
```

---

### Album Endpoints

#### 1. Upload Album with Multiple Songs
```
POST /albums/upload
Content-Type: multipart/form-data

Form Data (Single Values):
- title: "Greatest Hits 2024"
- artist: "The Weekend"
- coverArt: [file] (3000x3000 JPG/PNG)

Form Data (Arrays - add multiple entries with same key):
- songTitles: ["Blinding Lights", "Save Your Tears"]
- songArtists: ["The Weekend", "The Weekend"]
- songFeaturedArtists: ["Ariana Grande", ""] (optional, can be empty)
- songProducers: ["Max Martin", "Oscar Holter"]
- songTrackNumbers: [1, 2]
- mp3Files: [file1.mp3, file2.mp3]
```

**Important Notes:**
- All song arrays must have the same length
- Each array index corresponds to one song (index 0 = song 1, index 1 = song 2, etc.)
- Featured artists are optional - use empty string "" if a song has no featured artists
- The album cover art is automatically embedded into each MP3 file
- Track numbers should be sequential (1, 2, 3, etc.)

**Response:**
```json
{
    "success": true,
    "message": "Album with songs uploaded successfully",
    "album": {
        "id": 1,
        "title": "Greatest Hits 2024",
        "artist": "The Weekend",
        "coverArtPath": "./uploads/cover-art/uuid.jpg",
        "totalViews": 0,
        "totalDownloads": 0,
        "createdAt": "2024-01-01T10:00:00",
        "songs": [
            {
                "id": 1,
                "title": "Blinding Lights",
                "artist": "The Weekend",
                "featuredArtists": "Ariana Grande",
                "producer": "Max Martin",
                "trackNumber": 1,
                "views": 0,
                "likes": 0,
                "downloads": 0
            },
            {
                "id": 2,
                "title": "Save Your Tears",
                "artist": "The Weekend",
                "featuredArtists": null,
                "producer": "Oscar Holter",
                "trackNumber": 2,
                "views": 0,
                "likes": 0,
                "downloads": 0
            }
        ]
    }
}
```

**Note:** The cover art from the album is automatically embedded into each song's MP3 file.

#### 2. Get All Albums
```
GET /albums
```

#### 3. Get Album By ID
```
GET /albums/{id}
```

#### 4. Update Album
```
PUT /albums/{id}
Content-Type: application/json

{
    "title": "Updated Album Title",
    "artist": "Updated Artist"
}
```

#### 5. Delete Album
```
DELETE /albums/{id}
```

---

### Song Endpoints

#### 1. Upload Single Track
```
POST /songs/upload
Content-Type: multipart/form-data

Form Data:
- title: "Single Track Title"
- artist: "Artist Name"
- featuredArtists: "Featured Artist" (optional)
- producer: "Producer Name"
- coverArt: [file] (3000x3000 JPG/PNG)
- mp3File: [file] (MP3 file)
```

**Response:**
```json
{
    "success": true,
    "message": "Single track uploaded successfully",
    "song": {
        "id": 1,
        "title": "Single Track Title",
        "artist": "Artist Name",
        "featuredArtists": "Featured Artist",
        "producer": "Producer Name",
        "trackNumber": null,
        "coverArtPath": "./uploads/cover-art/uuid.jpg",
        "filePath": "./uploads/songs/uuid.mp3",
        "views": 0,
        "likes": 0,
        "dislikes": 0,
        "downloads": 0,
        "shares": 0,
        "album": null
    }
}
```

**Note:** The cover art is automatically embedded into the MP3 file metadata.

#### 2. Get All Songs
```
GET /songs
```

#### 3. Get Song By ID
```
GET /songs/{id}
```

#### 4. Get Songs By Album
```
GET /songs/album/{albumId}
```

#### 5. Update Song
```
PUT /songs/{id}
Content-Type: application/json

{
    "title": "Updated Title",
    "artist": "Updated Artist",
    "featuredArtists": "Updated Featured Artists",
    "producer": "Updated Producer"
}
```

#### 6. Delete Song
```
DELETE /songs/{id}
```

#### 7. Play Song (Increment Views)
```
POST /songs/{id}/play
```

**Response:**
```json
{
    "success": true,
    "song": {
        "id": 1,
        "views": 1,
        ...
    }
}
```

#### 8. Like Song
```
POST /songs/{id}/like
```

#### 9. Dislike Song
```
POST /songs/{id}/dislike
```

#### 10. Share Song
```
POST /songs/{id}/share
```

**Response:**
```json
{
    "success": true,
    "shareableUrl": "http://localhost:8080/api/songs/1",
    "song": {
        "id": 1,
        "shares": 1,
        ...
    }
}
```

#### 11. Download Song
```
GET /songs/{id}/download
```

Downloads the MP3 file with embedded cover art. Automatically increments download count.

---

## Upload Workflows

### Workflow 1: Upload Album with Multiple Songs (Single Request)

**Single Step: Upload Complete Album**
1. Use `POST /albums/upload`
2. Provide:
   - Album info: title, artist, cover art (3000x3000)
   - Songs arrays: songTitles[], songArtists[], songFeaturedArtists[] (optional), songProducers[], songTrackNumbers[], mp3Files[]
3. All songs are processed and the album cover art is automatically embedded into each MP3 file

**Example Request Structure:**
```
POST /albums/upload
Form Data:
- title: "Greatest Hits 2024"
- artist: "The Weekend"
- coverArt: [album-cover.jpg]
- songTitles: ["Blinding Lights", "Save Your Tears", "Take My Breath"]
- songArtists: ["The Weekend", "The Weekend", "The Weekend"]
- songFeaturedArtists: ["Ariana Grande", "", "Dua Lipa"]
- songProducers: ["Max Martin", "Oscar Holter", "Max Martin"]
- songTrackNumbers: [1, 2, 3]
- mp3Files: [song1.mp3, song2.mp3, song3.mp3]
```

**Important:** All arrays must have the same length. Each index corresponds to one song.

### Workflow 2: Upload Single Track

**Single Step:**
1. Use `POST /songs/upload`
2. Provide: title, artist, featuredArtists (optional), producer, coverArt, mp3File
3. The cover art is automatically embedded into the MP3 file

---

## Postman Testing Guide

### Importing the Collection

1. **Open Postman**
2. **Click "Import"**
3. **Select `postman_collection.json`** from the backend directory
4. **Set Environment Variable**:
   - Variable: `base_url`
   - Value: `http://localhost:8080/api`

### Testing Album Upload

1. **Create Admin** (if needed):
   - Use `POST /admin` to create an admin account

2. **Upload Album with Multiple Songs**:
   - Select "Upload Album with Multiple Songs" request
   - Fill in form data:
     - **Album Info:**
       - `title`: "My Album"
       - `artist`: "My Artist"
       - `coverArt`: Select a 3000x3000 image file
     - **Song 1:**
       - `songTitles`: "Song 1"
       - `songArtists`: "My Artist"
       - `songFeaturedArtists`: "Featured Artist" (optional, can leave empty)
       - `songProducers`: "Producer Name"
       - `songTrackNumbers`: 1
       - `mp3Files`: Select MP3 file 1
     - **Song 2:**
       - Click the "+" button or duplicate the key fields
       - `songTitles`: "Song 2" (add as new entry with same key)
       - `songArtists`: "My Artist" (add as new entry)
       - `songFeaturedArtists`: "" (empty if no featured artists)
       - `songProducers`: "Producer Name 2" (add as new entry)
       - `songTrackNumbers`: 2 (add as new entry)
       - `mp3Files`: Select MP3 file 2 (add as new entry)
     - Repeat for additional songs
   - Click "Send"
   - The response will include the complete album with all songs

### Testing Single Track Upload

1. **Select "Upload Single Track" request**
2. **Fill in form data**:
   - `title`: "My Single Track"
   - `artist`: "My Artist"
   - `featuredArtists`: "Featured Artist" (optional)
   - `producer`: "Producer Name"
   - `coverArt`: Select a 3000x3000 image file
   - `mp3File`: Select an MP3 file
3. **Click "Send"**

### Testing User Interactions

1. **Play Song**: Use `POST /songs/{id}/play` to increment views
2. **Like Song**: Use `POST /songs/{id}/like`
3. **Dislike Song**: Use `POST /songs/{id}/dislike`
4. **Share Song**: Use `POST /songs/{id}/share` to get shareable URL
5. **Download Song**: Use `GET /songs/{id}/download` to download MP3

---

## Sample Requests

### cURL Examples

#### Upload Album with Multiple Songs
```bash
curl -X POST http://localhost:8080/api/albums/upload \
  -F "title=Greatest Hits 2024" \
  -F "artist=The Weekend" \
  -F "coverArt=@/path/to/cover.jpg" \
  -F "songTitles=Blinding Lights" \
  -F "songTitles=Save Your Tears" \
  -F "songArtists=The Weekend" \
  -F "songArtists=The Weekend" \
  -F "songFeaturedArtists=Ariana Grande" \
  -F "songFeaturedArtists=" \
  -F "songProducers=Max Martin" \
  -F "songProducers=Oscar Holter" \
  -F "songTrackNumbers=1" \
  -F "songTrackNumbers=2" \
  -F "mp3Files=@/path/to/song1.mp3" \
  -F "mp3Files=@/path/to/song2.mp3"
```

**Note:** In curl, repeat the same parameter name multiple times to create arrays.

#### Upload Single Track
```bash
curl -X POST http://localhost:8080/api/songs/upload \
  -F "title=Single Track" \
  -F "artist=Artist Name" \
  -F "featuredArtists=Featured Artist" \
  -F "producer=Producer Name" \
  -F "coverArt=@/path/to/cover.jpg" \
  -F "mp3File=@/path/to/song.mp3"
```

#### Play Song
```bash
curl -X POST http://localhost:8080/api/songs/1/play
```

#### Download Song
```bash
curl -X GET http://localhost:8080/api/songs/1/download \
  -o downloaded_song.mp3
```

---

## Error Handling

### Common Errors

#### 400 Bad Request
- **Cause**: Missing required fields or invalid file format
- **Solution**: Check all required form fields are provided and files are valid

#### 404 Not Found
- **Cause**: Resource (album/song/admin) doesn't exist
- **Solution**: Verify the ID exists using GET endpoints

#### 500 Internal Server Error
- **Cause**: Server-side error (database, file system, etc.)
- **Solution**: Check server logs and ensure database is running

### Error Response Format
```json
{
    "success": false,
    "message": "Error description"
}
```

---

## Cover Art Requirements

- **Dimensions**: 3000x3000 pixels
- **Formats**: JPG or PNG
- **Size**: Recommended under 10MB
- **Embedding**: Automatically embedded into MP3 metadata using ID3 tags

---

## MP3 File Requirements

- **Format**: MP3 (.mp3)
- **Size**: Maximum 100MB per file
- **Metadata**: Automatically set with title, artist, featured artists, producer, track number, and cover art

---

## Notes

1. **Cover Art Embedding**: All MP3 files have cover art embedded in their metadata using JAudioTagger library
2. **Track Numbers**: Only required for album songs, not single tracks
3. **Statistics**: Views, likes, downloads, and shares are automatically tracked
4. **File Storage**: Files are stored locally in `./uploads/` directory
5. **CORS**: API allows all origins (`*`) for development

---

## Support

For issues or questions, check:
- Server logs in console
- Database connection settings
- File permissions for upload directory
- PostgreSQL database status

---

**Last Updated**: 2024

