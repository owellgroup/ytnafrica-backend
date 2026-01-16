# YTN Africa Backend

A complete music streaming system backend built with Java Spring Boot, PostgreSQL, and MP3 metadata embedding capabilities.

## Features

- ✅ Album upload with multiple songs
- ✅ Single track upload
- ✅ MP3 metadata embedding (cover art, title, artist, producer, etc.)
- ✅ User interactions (play, like, dislike, share, download)
- ✅ Statistics tracking (views, likes, downloads, shares)
- ✅ RESTful API architecture
- ✅ PostgreSQL database integration

## Technology Stack

- **Framework**: Spring Boot 3.2.0
- **Language**: Java 17
- **Database**: PostgreSQL
- **Build Tool**: Maven
- **MP3 Metadata**: JAudioTagger 3.0.1

## Project Structure

```
backend/
├── src/main/java/com/ytnafrica/backend/
│   ├── YtnafricaBackendApplication.java
│   ├── model/
│   │   ├── Admin.java
│   │   ├── Album.java
│   │   └── Song.java
│   ├── repository/
│   │   ├── AdminRepository.java
│   │   ├── AlbumRepository.java
│   │   └── SongRepository.java
│   ├── service/
│   │   ├── AdminService.java
│   │   ├── AlbumService.java
│   │   ├── SongService.java
│   │   ├── FileStorageService.java
│   │   └── MP3MetadataService.java
│   └── controller/
│       ├── AdminController.java
│       ├── AlbumController.java
│       ├── SongController.java
│       └── FileController.java
├── src/main/resources/
│   └── application.properties
├── pom.xml
├── README.md
├── API_GUIDE.md
└── postman_collection.json
```

## Prerequisites

- Java 17 or higher
- Maven 3.6+
- PostgreSQL 12+
- Postman (for API testing)

## Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd mlmusik/backend
```

### 2. Database Setup

Create a PostgreSQL database:
```sql
CREATE DATABASE mlmusik;
```

### 3. Configure Database

Edit `src/main/resources/application.properties`:
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/mlmusik
spring.datasource.username=your_username
spring.datasource.password=your_password
```

### 4. Build the Project
```bash
mvn clean install
```

### 5. Run the Application
```bash
mvn spring-boot:run
```

The API will be available at: `http://localhost:8282/api`

## API Documentation

### Base URL
```
http://localhost:8282/api
```

### Main Endpoints

#### Admin
- `POST /admin/login` - Admin login
- `POST /admin` - Create admin
- `GET /admin` - Get all admins
- `GET /admin/{id}` - Get admin by ID
- `PUT /admin/{id}` - Update admin
- `DELETE /admin/{id}` - Delete admin

#### Albums
- `POST /albums/upload` - Upload album with multiple songs (title, artist, cover art, and all songs in one request)
- `GET /albums` - Get all albums
- `GET /albums/{id}` - Get album by ID
- `PUT /albums/{id}` - Update album
- `DELETE /albums/{id}` - Delete album

#### Songs
- `POST /songs/upload` - Upload single track
- `GET /songs` - Get all songs
- `GET /songs/{id}` - Get song by ID
- `GET /songs/album/{albumId}` - Get songs by album
- `PUT /songs/{id}` - Update song
- `DELETE /songs/{id}` - Delete song
- `POST /songs/{id}/play` - Play song (increment views)
- `POST /songs/{id}/like` - Like song
- `POST /songs/{id}/dislike` - Dislike song
- `POST /songs/{id}/share` - Share song
- `GET /songs/{id}/download` - Download song

## Upload Workflows

### Upload Album with Multiple Songs (Single Request)

**Upload Complete Album in One Request**:
```
POST /albums/upload
Form Data:
- title: "Album Title"
- artist: "Artist Name"
- coverArt: [3000x3000 image file]
- songTitles: ["Song 1", "Song 2", "Song 3"] (array)
- songArtists: ["Artist", "Artist", "Artist"] (array)
- songFeaturedArtists: ["Featured", "", "Featured"] (optional array)
- songProducers: ["Producer 1", "Producer 2", "Producer 3"] (array)
- songTrackNumbers: [1, 2, 3] (array)
- mp3Files: [file1.mp3, file2.mp3, file3.mp3] (array of files)
```

**Important:** All song arrays must have the same length. Each index corresponds to one song. The album cover art is automatically embedded into each MP3 file.

### Upload Single Track

```
POST /songs/upload
Form Data:
- title: "Track Title"
- artist: "Artist Name"
- featuredArtists: "Featured Artist" (optional)
- producer: "Producer Name"
- coverArt: [3000x3000 image file]
- mp3File: [MP3 file]
```

## Testing with Postman

1. Import `postman_collection.json` into Postman
2. Set environment variable `base_url` to `http://localhost:8282/api`
3. Follow the workflows in `API_GUIDE.md`

## File Storage

Files are stored in:
- `./uploads/cover-art/` - Cover art images
- `./uploads/songs/` - MP3 files

These directories are created automatically on first upload.

## MP3 Metadata Embedding

The system automatically:
- Embeds cover art into MP3 files using ID3 tags
- Sets metadata (title, artist, featured artists, producer, track number)
- Ensures all downloaded MP3s include embedded cover art

## Requirements

### Cover Art
- Dimensions: 3000x3000 pixels
- Formats: JPG or PNG
- Size: Recommended under 10MB

### MP3 Files
- Format: MP3 (.mp3)
- Size: Maximum 100MB per file

## Architecture

The project follows a strict layered architecture:

- **Model**: Entity classes (Admin, Album, Song)
- **Repository**: JPA repositories for database access
- **Service**: Business logic and file operations
- **Controller**: REST API endpoints

No DTOs or extra layers are used as per requirements.

## Development

### Running in Development Mode
```bash
mvn spring-boot:run
```

### Building for Production
```bash
mvn clean package
java -jar target/ytnafrica-backend-1.0.0.jar
```

## Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running
- Check database credentials in `application.properties`
- Ensure database exists and is configured correctly

### File Upload Issues
- Check file size limits (100MB max)
- Verify upload directory permissions
- Ensure sufficient disk space

### MP3 Metadata Issues
- Verify MP3 file is valid
- Check cover art file format and size
- Review server logs for detailed errors

## License

This project is part of the YTN Africa Music Streaming System.

## Support

For detailed API documentation, see `API_GUIDE.md`.
For Postman collection, see `postman_collection.json`.

