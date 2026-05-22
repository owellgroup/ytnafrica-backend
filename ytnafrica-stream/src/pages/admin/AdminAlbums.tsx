import { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, Upload, Disc3, Search, Music } from 'lucide-react';
import { api, Album, Artist, formatNumber } from '@/lib/api';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface SongUpload {
  title: string;
  artist: string;
  featuredArtists: string;
  producer: string;
  audioFile: File | null;
}

export default function AdminAlbums() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const coverArtRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({ title: '', artist: '' });
  const [coverArtFile, setCoverArtFile] = useState<File | null>(null);
  const [songUploads, setSongUploads] = useState<SongUpload[]>([
    { title: '', artist: '', featuredArtists: '', producer: '', audioFile: null }
  ]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [selectedArtistId, setSelectedArtistId] = useState<string>('');
  const [editArtistId, setEditArtistId] = useState<string>('');

  useEffect(() => {
    fetchAlbums();
    api.getArtists().then(setArtists).catch(console.error);
  }, []);

  const applyArtistToForm = (id: string, target: 'upload' | 'edit') => {
    if (target === 'upload') setSelectedArtistId(id);
    else setEditArtistId(id);
    if (id) {
      const a = artists.find((x) => x.id === Number(id));
      if (a) {
        setFormData((f) => ({ ...f, artist: a.artistName }));
        if (target === 'upload') {
          setSongUploads((songs) => songs.map((s) => ({ ...s, artist: a.artistName })));
        }
      }
    }
  };

  const fetchAlbums = async () => {
    try {
      const data = await api.getAlbums();
      setAlbums(data);
    } catch (error) {
      console.error('Error fetching albums:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async () => {
    // Validate required fields
    if (!selectedArtistId || !formData.title || !formData.artist || !coverArtFile) {
      toast({ title: "Please select an artist and fill album title and cover art", variant: "destructive" });
      return;
    }

    // Filter out empty songs and validate
    const validSongs = songUploads.filter(song => 
      song.title && song.artist && song.producer && song.audioFile
    );

    if (validSongs.length === 0) {
      toast({ title: "Please add at least one song with all required fields", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    try {
      const uploadData = new FormData();
      uploadData.append('title', formData.title);
      uploadData.append('artist', formData.artist);
      uploadData.append('artistId', selectedArtistId);
      uploadData.append('coverArt', coverArtFile);
      
      // Add songs data as arrays (backend expects multiple entries with same key)
      validSongs.forEach((song, index) => {
        uploadData.append('songTitles', song.title);
        uploadData.append('songArtists', song.artist);
        uploadData.append('songFeaturedArtists', song.featuredArtists || '');
        uploadData.append('songProducers', song.producer);
        uploadData.append('songTrackNumbers', String(index + 1)); // Track numbers start at 1
        uploadData.append('mp3Files', song.audioFile!);
      });

      const result = await api.uploadAlbum(uploadData);
      if (result.success) {
        toast({ title: "Album uploaded successfully" });
        setIsUploadOpen(false);
        resetForm();
        fetchAlbums();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error uploading album";
      toast({ title: errorMessage, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setFormData({ title: '', artist: '' });
    setCoverArtFile(null);
    setSelectedArtistId('');
    setSongUploads([{ title: '', artist: '', featuredArtists: '', producer: '', audioFile: null }]);
  };

  const addSongUpload = () => {
    const artistName = formData.artist;
    setSongUploads([...songUploads, { title: '', artist: artistName, featuredArtists: '', producer: '', audioFile: null }]);
  };

  const updateSongUpload = (index: number, field: keyof SongUpload, value: string | File | null) => {
    const updated = [...songUploads];
    (updated[index] as any)[field] = value;
    setSongUploads(updated);
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deleteAlbum(id);
      await fetchAlbums();
      toast({ title: "Album deleted successfully" });
    } catch (error) {
      toast({
        title: error instanceof Error ? error.message : "Error deleting album",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (album: Album) => {
    setSelectedAlbum(album);
    setFormData({ title: album.title, artist: album.artist });
    if (album.artistId) {
      setEditArtistId(String(album.artistId));
    } else {
      const match = artists.find(
        (a) => a.artistName.toLowerCase() === album.artist.toLowerCase()
      );
      setEditArtistId(match ? String(match.id) : '');
    }
    setIsEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedAlbum) return;
    if (!formData.title.trim()) {
      toast({ title: "Album title is required", variant: "destructive" });
      return;
    }
    const artistId = editArtistId ? Number(editArtistId) : selectedAlbum.artistId ?? undefined;
    const artistName =
      artists.find((a) => a.id === artistId)?.artistName ?? formData.artist;
    try {
      await api.updateAlbum(
        selectedAlbum.id,
        formData.title.trim(),
        artistName,
        artistId
      );
      await fetchAlbums();
      setIsEditOpen(false);
      toast({ title: "Album updated successfully" });
    } catch (error) {
      toast({
        title: error instanceof Error ? error.message : "Error updating album",
        variant: "destructive",
      });
    }
  };

  const filteredAlbums = albums.filter(album =>
    album.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    album.artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Manage Albums</h1>
          <p className="text-muted-foreground">{albums.length} total albums</p>
        </div>
        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogTrigger asChild>
            <Button variant="gold" className="gap-2">
              <Plus className="w-5 h-5" />
              Upload Album
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Upload New Album</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Artist *</label>
                <Select value={selectedArtistId} onValueChange={(id) => applyArtistToForm(id, 'upload')}>
                  <SelectTrigger className="bg-card">
                    <SelectValue placeholder="Choose registered artist" />
                  </SelectTrigger>
                  <SelectContent>
                    {artists.map((a) => (
                      <SelectItem key={a.id} value={String(a.id)}>
                        {a.artistName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Album Title *</label>
                  <Input 
                    placeholder="Album title" 
                    className="bg-card"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Artist name</label>
                  <Input 
                    placeholder="Filled from selection" 
                    className="bg-card"
                    value={formData.artist}
                    readOnly={!!selectedArtistId}
                    onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Cover Art *</label>
                <input
                  type="file"
                  accept="image/*"
                  ref={coverArtRef}
                  className="hidden"
                  onChange={(e) => setCoverArtFile(e.target.files?.[0] || null)}
                />
                <div 
                  className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer"
                  onClick={() => coverArtRef.current?.click()}
                >
                  <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {coverArtFile ? coverArtFile.name : 'Click to upload cover art'}
                  </p>
                  <p className="text-xs text-muted-foreground">3000x3000 JPG/PNG</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Songs</label>
                  <Button variant="outline" size="sm" className="gap-2" onClick={addSongUpload}>
                    <Plus className="w-4 h-4" />
                    Add Song
                  </Button>
                </div>
                <div className="space-y-3">
                  {songUploads.map((song, index) => (
                    <div key={index} className="p-4 bg-card rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Track {index + 1}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <Input 
                          placeholder="Song title *" 
                          className="bg-background"
                          value={song.title}
                          onChange={(e) => updateSongUpload(index, 'title', e.target.value)}
                        />
                        <Input 
                          placeholder="Artist *" 
                          className="bg-background"
                          value={song.artist}
                          readOnly={!!selectedArtistId}
                          onChange={(e) => updateSongUpload(index, 'artist', e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <Input 
                          placeholder="Featured artists (optional)" 
                          className="bg-background"
                          value={song.featuredArtists}
                          onChange={(e) => updateSongUpload(index, 'featuredArtists', e.target.value)}
                        />
                        <Input 
                          placeholder="Producer *" 
                          className="bg-background"
                          value={song.producer}
                          onChange={(e) => updateSongUpload(index, 'producer', e.target.value)}
                        />
                      </div>
                      <div className="border-2 border-dashed border-border rounded-lg p-3 text-center hover:border-primary transition-colors cursor-pointer">
                        <input
                          type="file"
                          accept="audio/mp3,audio/mpeg"
                          className="hidden"
                          id={`song-file-${index}`}
                          onChange={(e) => updateSongUpload(index, 'audioFile', e.target.files?.[0] || null)}
                        />
                        <label htmlFor={`song-file-${index}`} className="cursor-pointer">
                          <Music className="w-6 h-6 mx-auto text-muted-foreground mb-1" />
                          <p className="text-sm text-muted-foreground">
                            {song.audioFile ? song.audioFile.name : 'Upload MP3 *'}
                          </p>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <Button 
                variant="gold" 
                className="w-full" 
                onClick={handleUpload}
                disabled={isUploading}
              >
                {isUploading ? 'Uploading...' : 'Upload Album'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Search albums..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-card"
        />
      </div>

      {/* Albums Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAlbums.map((album, index) => (
          <Card 
            key={album.id}
            className={cn(
              "glass border-border/50 overflow-hidden group",
              "opacity-0 animate-fade-in"
            )}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="relative aspect-square">
              <img
                src={album.coverArtPath || '/placeholder.svg'}
                alt={album.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={() => handleEdit(album)}
                >
                  <Edit2 className="w-5 h-5" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="icon">
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Album</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure? This will delete "{album.title}" and all its songs.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(album.id)}
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
            <CardContent className="p-4">
              <h3 className="font-bold text-lg truncate">{album.title}</h3>
              <p className="text-sm text-muted-foreground truncate">{album.artist}</p>
              <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                <span>{album.songs?.length || 0} songs</span>
                <span>{formatNumber(album.totalViews)} plays</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredAlbums.length === 0 && (
        <div className="text-center py-16">
          <Disc3 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-xl font-medium">No albums found</p>
          <p className="text-muted-foreground">Upload your first album to get started</p>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Album</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="bg-card"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Artist</label>
              <Select value={editArtistId} onValueChange={(id) => applyArtistToForm(id, 'edit')}>
                <SelectTrigger className="bg-card">
                  <SelectValue placeholder="Select artist" />
                </SelectTrigger>
                <SelectContent>
                  {artists.map((a) => (
                    <SelectItem key={a.id} value={String(a.id)}>
                      {a.artistName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input value={formData.artist} readOnly={!!editArtistId} className="bg-card" />
            </div>
            <Button variant="gold" className="w-full" onClick={handleUpdate}>
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
