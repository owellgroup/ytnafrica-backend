import { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, Upload, Disc3, Search } from 'lucide-react';
import { api, Album } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
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

interface SongUpload {
  title: string;
  artist: string;
  featuredArtists: string;
  producer: string;
  audioFile: File | null;
}

export default function ArtistAlbums() {
  const { artist } = useAuth();
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
    { title: '', artist: '', featuredArtists: '', producer: '', audioFile: null },
  ]);

  useEffect(() => {
    if (artist) {
      setFormData({ title: '', artist: artist.artistName });
      setSongUploads([
        { title: '', artist: artist.artistName, featuredArtists: '', producer: '', audioFile: null },
      ]);
      fetchAlbums();
    }
  }, [artist]);

  const fetchAlbums = async () => {
    if (!artist) return;
    try {
      setAlbums(await api.getAlbumsByArtist(artist.id));
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!artist || !formData.title || !coverArtFile) {
      toast({ title: 'Album title and cover required', variant: 'destructive' });
      return;
    }
    const validSongs = songUploads.filter((s) => s.title && s.producer && s.audioFile);
    if (validSongs.length === 0) {
      toast({ title: 'Add at least one complete track', variant: 'destructive' });
      return;
    }
    setIsUploading(true);
    try {
      const uploadData = new FormData();
      uploadData.append('title', formData.title);
      uploadData.append('artist', artist.artistName);
      uploadData.append('artistId', String(artist.id));
      uploadData.append('coverArt', coverArtFile);
      validSongs.forEach((song, index) => {
        uploadData.append('songTitles', song.title);
        uploadData.append('songArtists', artist.artistName);
        uploadData.append('songFeaturedArtists', song.featuredArtists || '');
        uploadData.append('songProducers', song.producer);
        uploadData.append('songTrackNumbers', String(index + 1));
        uploadData.append('mp3Files', song.audioFile!);
      });
      const result = await api.uploadAlbum(uploadData);
      if (result.success) {
        toast({ title: 'Album published on ytnAfrica' });
        setIsUploadOpen(false);
        resetForm();
        fetchAlbums();
      }
    } catch (error) {
      toast({
        title: error instanceof Error ? error.message : 'Upload failed',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!artist) return;
    try {
      await api.deleteAlbum(id, artist.id);
      await fetchAlbums();
      toast({ title: 'Album deleted' });
    } catch (error) {
      toast({
        title: error instanceof Error ? error.message : 'Error deleting album',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    if (!artist) return;
    setFormData({ title: '', artist: artist.artistName });
    setCoverArtFile(null);
    setSongUploads([
      { title: '', artist: artist.artistName, featuredArtists: '', producer: '', audioFile: null },
    ]);
  };

  const addSongUpload = () => {
    if (!artist) return;
    setSongUploads([
      ...songUploads,
      { title: '', artist: artist.artistName, featuredArtists: '', producer: '', audioFile: null },
    ]);
  };

  const updateSongUpload = (index: number, field: keyof SongUpload, value: string | File | null) => {
    const updated = [...songUploads];
    (updated[index] as Record<string, unknown>)[field] = value;
    setSongUploads(updated);
  };

  const filteredAlbums = albums.filter(
    (a) =>
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!artist || isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Albums</h1>
          <p className="text-muted-foreground">{albums.length} albums on the site</p>
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
                <label className="text-sm font-medium">Artist</label>
                <Input value={artist.artistName} readOnly className="bg-muted" />
              </div>
              <Input
                placeholder="Album title *"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
              <input
                type="file"
                accept="image/*"
                ref={coverArtRef}
                className="hidden"
                onChange={(e) => setCoverArtFile(e.target.files?.[0] || null)}
              />
              <div
                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer"
                onClick={() => coverArtRef.current?.click()}
              >
                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm">{coverArtFile?.name || 'Album cover art *'}</p>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Tracks</span>
                <Button variant="outline" size="sm" onClick={addSongUpload}>
                  <Plus className="w-4 h-4 mr-1" /> Add track
                </Button>
              </div>
              {songUploads.map((song, index) => (
                <div key={index} className="p-4 bg-card rounded-lg space-y-2">
                  <p className="text-sm font-medium">Track {index + 1}</p>
                  <Input
                    placeholder="Title *"
                    value={song.title}
                    onChange={(e) => updateSongUpload(index, 'title', e.target.value)}
                  />
                  <Input value={artist.artistName} readOnly className="bg-muted" />
                  <Input
                    placeholder="Producer *"
                    value={song.producer}
                    onChange={(e) => updateSongUpload(index, 'producer', e.target.value)}
                  />
                  <input
                    type="file"
                    accept="audio/mp3,audio/mpeg"
                    className="hidden"
                    id={`track-${index}`}
                    onChange={(e) => updateSongUpload(index, 'audioFile', e.target.files?.[0] || null)}
                  />
                  <label htmlFor={`track-${index}`} className="block border border-dashed rounded p-3 text-center text-sm cursor-pointer">
                    {song.audioFile?.name || 'MP3 file *'}
                  </label>
                </div>
              ))}
              <Button variant="gold" className="w-full" onClick={handleUpload} disabled={isUploading}>
                {isUploading ? 'Uploading...' : 'Publish Album'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Input
        placeholder="Search albums..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="max-w-md bg-card"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAlbums.map((album) => (
          <Card key={album.id} className="glass overflow-hidden">
            <img src={album.coverArtPath || '/placeholder.svg'} alt="" className="w-full aspect-square object-cover" />
            <CardContent className="p-4">
              <h3 className="font-bold truncate">{album.title}</h3>
              <p className="text-sm text-muted-foreground">{album.songs?.length || 0} tracks</p>
              <div className="flex gap-2 mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    setSelectedAlbum(album);
                    setFormData({ title: album.title, artist: artist.artistName });
                    setIsEditOpen(true);
                  }}
                >
                  <Edit2 className="w-4 h-4 mr-1" /> Edit
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Trash2 className="w-4 h-4 mr-1" /> Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete album?</AlertDialogTitle>
                      <AlertDialogDescription>Remove &quot;{album.title}&quot; and all its tracks.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(album.id)}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Album</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input value={artist.artistName} readOnly className="bg-muted" />
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
            <Button
              variant="gold"
              className="w-full"
              onClick={async () => {
                if (!selectedAlbum) return;
                await api.updateAlbum(selectedAlbum.id, formData.title, formData.artist, artist.id);
                fetchAlbums();
                setIsEditOpen(false);
                toast({ title: 'Album updated' });
              }}
            >
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
