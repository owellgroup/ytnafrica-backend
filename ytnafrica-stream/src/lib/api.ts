// API Configuration and Services

//const API_BASE_URL = 'https://ytnafricaapi.owellgraphics.com/api';
export const API_BASE_URL = 'http://localhost:8282/api';

/** Optimized stream URL by song ID — supports HTTP Range for instant start on slow networks */
export function getStreamUrl(songId: number): string {
  return `${API_BASE_URL}/uploads/songs/song/${songId}`;
}

// Helper to verify if a file URL is accessible
export async function verifyFileUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

// Types
export interface Admin {
  id: number;
  email: string;
  password?: string;
  systemAdmin?: boolean;
  createdAt: string;
}

export interface Artist {
  id: number;
  email: string;
  artistName: string;
  profileImagePath: string | null;
  verified: boolean;
  createdAt: string;
}

export interface ArtistProfile {
  artist: Artist;
  songs: Song[];
  albums: Album[];
}

export interface Album {
  id: number;
  title: string;
  artist: string;
  artistId?: number | null;
  coverArtPath: string;
  totalViews: number;
  totalDownloads: number;
  createdAt: string;
  songs: Song[];
}

export interface Song {
  id: number;
  title: string;
  artist: string;
  artistId?: number | null;
  featuredArtists: string | null;
  producer: string;
  trackNumber: number | null;
  filePath: string;
  coverArtPath: string;
  views: number;
  likes: number;
  dislikes: number;
  downloads: number;
  shares: number;
  album: Album | null;
  createdAt: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  admin?: Admin;
}

export interface ArtistLoginResponse {
  success: boolean;
  message: string;
  artist?: Artist;
}

export interface ActionResponse {
  success: boolean;
  message?: string;
  song?: Song;
  shareableUrl?: string;
}

// Helper to convert file paths to full URLs
export function convertToUrl(filePath: string): string {
  if (!filePath) return '';
  
  // Extract just the filename from the path
  // Handles paths like: "./uploads/songs/uuid.mp3" or "uploads/songs/uuid.mp3" or "uuid.mp3"
  let filename = filePath;
  
  // Remove leading "./" if present
  filename = filename.replace(/^\.\//, '');
  
  // Extract filename from path (handles both forward and backslashes)
  const pathParts = filename.split(/[/\\]/);
  filename = pathParts[pathParts.length - 1];
  
  // Determine the endpoint based on file extension
  if (filename.match(/\.(mp3|wav|m4a|ogg|flac)$/i)) {
    // Audio file - use songs endpoint
    return `${API_BASE_URL}/uploads/songs/${filename}`;
  } else if (filename.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
    // Image file - use cover-art endpoint
    return `${API_BASE_URL}/uploads/cover-art/${filename}`;
  }
  
  // Fallback: try to determine from path structure
  if (filePath.includes('songs')) {
    return `${API_BASE_URL}/uploads/songs/${filename}`;
  } else if (filePath.includes('cover-art')) {
    return `${API_BASE_URL}/uploads/cover-art/${filename}`;
  }
  
  // Default fallback
  return `${API_BASE_URL}/uploads/${filename}`;
}

// Format numbers (1.2K, 1.5M)
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

// Format duration (seconds to mm:ss)
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// API Service Class
class ApiService {
  private baseUrl = API_BASE_URL;

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  }

  // Admin APIs
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await fetch(`${this.baseUrl}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return response.json();
  }

  async getAdmins(): Promise<Admin[]> {
    return this.request<Admin[]>('/admin');
  }

  async createAdmin(email: string, password: string): Promise<Admin> {
    return this.request<Admin>('/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
  }

  async updateAdmin(id: number, email: string, password: string): Promise<Admin> {
    return this.request<Admin>(`/admin/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
  }

  async deleteAdmin(id: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/admin/${id}`, { method: 'DELETE' });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.message || `API Error: ${response.status}`);
    }
  }

  // Artist APIs
  async loginArtist(email: string, password: string): Promise<ArtistLoginResponse> {
    const response = await fetch(`${this.baseUrl}/artists/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return response.json();
  }

  async getArtists(): Promise<Artist[]> {
    const artists = await this.request<Artist[]>('/artists');
    return artists.map(a => ({
      ...a,
      profileImagePath: a.profileImagePath ? convertToUrl(a.profileImagePath) : null,
    }));
  }

  async getArtist(id: number): Promise<Artist> {
    const artist = await this.request<Artist>(`/artists/${id}`);
    return {
      ...artist,
      profileImagePath: artist.profileImagePath ? convertToUrl(artist.profileImagePath) : null,
    };
  }

  async getArtistProfile(id: number): Promise<ArtistProfile> {
    const profile = await this.request<ArtistProfile>(`/artists/${id}/profile`);
    return {
      artist: {
        ...profile.artist,
        profileImagePath: profile.artist.profileImagePath
          ? convertToUrl(profile.artist.profileImagePath)
          : null,
      },
      songs: profile.songs.map(song => ({
        ...song,
        coverArtPath: convertToUrl(song.coverArtPath),
        filePath: convertToUrl(song.filePath),
      })),
      albums: profile.albums.map(album => ({
        ...album,
        coverArtPath: convertToUrl(album.coverArtPath),
        songs: album.songs?.map(song => ({
          ...song,
          coverArtPath: convertToUrl(song.coverArtPath),
          filePath: convertToUrl(song.filePath),
        })) || [],
      })),
    };
  }

  async createArtist(formData: FormData): Promise<Artist> {
    const response = await fetch(`${this.baseUrl}/artists`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.message || `API Error: ${response.status}`);
    }
    const artist = await response.json();
    return {
      ...artist,
      profileImagePath: artist.profileImagePath ? convertToUrl(artist.profileImagePath) : null,
    };
  }

  async updateArtist(id: number, formData: FormData): Promise<Artist> {
    const response = await fetch(`${this.baseUrl}/artists/${id}`, {
      method: 'PUT',
      body: formData,
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.message || `API Error: ${response.status}`);
    }
    const artist = await response.json();
    return {
      ...artist,
      profileImagePath: artist.profileImagePath ? convertToUrl(artist.profileImagePath) : null,
    };
  }

  async deleteArtist(id: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/artists/${id}`, { method: 'DELETE' });
    if (!response.ok && response.status !== 204) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.message || `API Error: ${response.status}`);
    }
  }

  async getSongsByArtist(artistId: number): Promise<Song[]> {
    const songs = await this.request<Song[]>(`/songs/artist/${artistId}`);
    return songs.map(song => ({
      ...song,
      coverArtPath: convertToUrl(song.coverArtPath),
      filePath: convertToUrl(song.filePath),
    }));
  }

  async getAlbumsByArtist(artistId: number): Promise<Album[]> {
    const albums = await this.request<Album[]>(`/albums/artist/${artistId}`);
    return albums.map(album => ({
      ...album,
      coverArtPath: convertToUrl(album.coverArtPath),
      songs: album.songs?.map(song => ({
        ...song,
        coverArtPath: convertToUrl(song.coverArtPath),
        filePath: convertToUrl(song.filePath),
      })) || [],
    }));
  }

  // Album APIs
  async getAlbums(): Promise<Album[]> {
    const albums = await this.request<Album[]>('/albums');
    return albums.map(album => ({
      ...album,
      coverArtPath: convertToUrl(album.coverArtPath),
      songs: album.songs?.map(song => ({
        ...song,
        coverArtPath: convertToUrl(song.coverArtPath),
        filePath: convertToUrl(song.filePath),
      })) || [],
    }));
  }

  async getAlbum(id: number): Promise<Album> {
    const album = await this.request<Album>(`/albums/${id}`);
    return {
      ...album,
      coverArtPath: convertToUrl(album.coverArtPath),
      songs: album.songs?.map(song => ({
        ...song,
        coverArtPath: convertToUrl(song.coverArtPath),
        filePath: convertToUrl(song.filePath),
      })) || [],
    };
  }

  async uploadAlbum(formData: FormData): Promise<{ success: boolean; album?: Album; message?: string }> {
    const response = await fetch(`${this.baseUrl}/albums/upload`, {
      method: 'POST',
      body: formData,
    });
    
    // Handle response - if status is 201, album was created successfully
    if (response.status === 201) {
      try {
        const data = await response.json();
        if (data.success && data.album) {
          // Convert URLs in the returned album
          data.album = {
            ...data.album,
            coverArtPath: convertToUrl(data.album.coverArtPath),
            songs: data.album.songs?.map((song: Song) => ({
              ...song,
              coverArtPath: convertToUrl(song.coverArtPath),
              filePath: convertToUrl(song.filePath),
            })) || [],
          };
        }
        return data;
      } catch (parseError) {
        // If JSON parsing fails but status is 201, album was created successfully
        // Return success so UI can refresh the list
        console.warn('Response parsing failed, but album was created (status 201)', parseError);
        return { success: true, message: 'Album uploaded successfully' };
      }
    }
    
    // Handle error responses
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `API Error: ${response.status}` }));
      throw new Error(errorData.message || `API Error: ${response.status}`);
    }
    
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || `API Error: ${response.status}`);
    }
    return data;
  }

  async updateAlbum(id: number, title: string, artist: string, artistId?: number): Promise<Album> {
    const album = await this.request<Album>(`/albums/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, artist, artistId }),
    });
    return {
      ...album,
      coverArtPath: convertToUrl(album.coverArtPath),
      songs: album.songs?.map((song) => ({
        ...song,
        coverArtPath: convertToUrl(song.coverArtPath),
        filePath: convertToUrl(song.filePath),
      })) || [],
    };
  }

  async deleteAlbum(id: number, artistId?: number): Promise<void> {
    const query = artistId != null ? `?artistId=${artistId}` : '';
    const response = await fetch(`${this.baseUrl}/albums/${id}${query}`, { method: 'DELETE' });
    if (!response.ok && response.status !== 204) {
      throw new Error(`Failed to delete album (${response.status})`);
    }
  }

  // Song APIs
  async getSongs(): Promise<Song[]> {
    const songs = await this.request<Song[]>('/songs');
    return songs.map(song => ({
      ...song,
      coverArtPath: convertToUrl(song.coverArtPath),
      filePath: convertToUrl(song.filePath),
    }));
  }

  async getSong(id: number): Promise<Song> {
    const song = await this.request<Song>(`/songs/${id}`);
    return {
      ...song,
      coverArtPath: convertToUrl(song.coverArtPath),
      filePath: convertToUrl(song.filePath),
    };
  }

  async getSongsByAlbum(albumId: number): Promise<Song[]> {
    const songs = await this.request<Song[]>(`/songs/album/${albumId}`);
    return songs.map(song => ({
      ...song,
      coverArtPath: convertToUrl(song.coverArtPath),
      filePath: convertToUrl(song.filePath),
    }));
  }

  async uploadSong(formData: FormData): Promise<{ success: boolean; song?: Song; message?: string }> {
    const response = await fetch(`${this.baseUrl}/songs/upload`, {
      method: 'POST',
      body: formData,
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || `API Error: ${response.status}`);
    }
    // Convert URLs in the returned song
    if (data.song) {
      data.song = {
        ...data.song,
        coverArtPath: convertToUrl(data.song.coverArtPath),
        filePath: convertToUrl(data.song.filePath),
      };
    }
    return data;
  }

  async updateSong(
    id: number,
    data: {
      title: string;
      artist: string;
      featuredArtists?: string | null;
      producer: string;
      artistId?: number | null;
    }
  ): Promise<Song> {
    const song = await this.request<Song>(`/songs/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: data.title,
        artist: data.artist,
        featuredArtists: data.featuredArtists ?? '',
        producer: data.producer,
        artistId: data.artistId ?? null,
      }),
    });
    return {
      ...song,
      coverArtPath: convertToUrl(song.coverArtPath),
      filePath: convertToUrl(song.filePath),
    };
  }

  async deleteSong(id: number, artistId?: number): Promise<void> {
    const query = artistId != null ? `?artistId=${artistId}` : '';
    const response = await fetch(`${this.baseUrl}/songs/${id}${query}`, { method: 'DELETE' });
    if (!response.ok && response.status !== 204) {
      throw new Error(`Failed to delete song (${response.status})`);
    }
  }

  async playSong(id: number): Promise<ActionResponse> {
    return this.request<ActionResponse>(`/songs/${id}/play`, { method: 'POST' });
  }

  async likeSong(id: number): Promise<ActionResponse> {
    return this.request<ActionResponse>(`/songs/${id}/like`, { method: 'POST' });
  }

  async dislikeSong(id: number): Promise<ActionResponse> {
    return this.request<ActionResponse>(`/songs/${id}/dislike`, { method: 'POST' });
  }

  async shareSong(id: number): Promise<ActionResponse> {
    return this.request<ActionResponse>(`/songs/${id}/share`, { method: 'POST' });
  }

  getDownloadUrl(id: number): string {
    return `${this.baseUrl}/songs/${id}/download`;
  }
}

export const api = new ApiService();
