import { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, Upload, Music, Search } from 'lucide-react';
import { api, Song, formatNumber } from '@/lib/api';
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
import { cn } from '@/lib/utils';

export default function ArtistSongs() {
  const { artist } = useAuth();
  const [songs, setSongs] = useState<Song[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const coverArtRef = useRef<HTMLInputElement>(null);
  const audioFileRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    featuredArtists: '',
    producer: '',
  });
  const [coverArtFile, setCoverArtFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);

  useEffect(() => {
    if (artist) {
      setFormData((f) => ({ ...f, artist: artist.artistName }));
      fetchSongs();
    }
  }, [artist]);

  const fetchSongs = async () => {
    if (!artist) return;
    try {
      const data = await api.getSongsByArtist(artist.id);
      setSongs(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!artist || !formData.title || !formData.producer || !audioFile || !coverArtFile) {
      toast({ title: 'Fill all required fields', variant: 'destructive' });
      return;
    }
    setIsUploading(true);
    try {
      const uploadData = new FormData();
      uploadData.append('title', formData.title);
      uploadData.append('artist', artist.artistName);
      uploadData.append('artistId', String(artist.id));
      uploadData.append('featuredArtists', formData.featuredArtists || '');
      uploadData.append('producer', formData.producer);
      uploadData.append('mp3File', audioFile);
      uploadData.append('coverArt', coverArtFile);
      const result = await api.uploadSong(uploadData);
      if (result.success) {
        toast({ title: 'Song published on ytnAfrica' });
        setIsUploadOpen(false);
        resetForm();
        fetchSongs();
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
    try {
      await api.deleteSong(id, artist?.id);
      setSongs(songs.filter((s) => s.id !== id));
      toast({ title: 'Song deleted' });
    } catch (error) {
      toast({
        title: error instanceof Error ? error.message : 'Error deleting song',
        variant: 'destructive',
      });
    }
  };

  const handleUpdate = async () => {
    if (!selectedSong || !artist) return;
    try {
      await api.updateSong(selectedSong.id, {
        title: formData.title,
        artist: artist.artistName,
        artistId: artist.id,
        featuredArtists: formData.featuredArtists,
        producer: formData.producer,
      });
      fetchSongs();
      setIsEditOpen(false);
      toast({ title: 'Song updated' });
    } catch (error) {
      toast({
        title: error instanceof Error ? error.message : 'Update failed',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      artist: artist?.artistName || '',
      featuredArtists: '',
      producer: '',
    });
    setCoverArtFile(null);
    setAudioFile(null);
  };

  const filteredSongs = songs.filter(
    (s) =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.artist.toLowerCase().includes(searchQuery.toLowerCase())
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
          <h1 className="text-3xl font-bold">My Songs</h1>
          <p className="text-muted-foreground">{songs.length} singles on the site</p>
        </div>
        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogTrigger asChild>
            <Button variant="gold" className="gap-2">
              <Plus className="w-5 h-5" />
              Upload Song
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Upload New Song</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Artist (your name)</label>
                <Input value={artist.artistName} readOnly className="bg-muted" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Title *</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="bg-card"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Featured Artists</label>
                <Input
                  value={formData.featuredArtists}
                  onChange={(e) => setFormData({ ...formData, featuredArtists: e.target.value })}
                  className="bg-card"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Producer *</label>
                <Input
                  value={formData.producer}
                  onChange={(e) => setFormData({ ...formData, producer: e.target.value })}
                  className="bg-card"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
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
                    className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary"
                    onClick={() => coverArtRef.current?.click()}
                  >
                    <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm">{coverArtFile?.name || 'Upload cover'}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">MP3 *</label>
                  <input
                    type="file"
                    accept="audio/mp3,audio/mpeg"
                    ref={audioFileRef}
                    className="hidden"
                    onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                  />
                  <div
                    className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary"
                    onClick={() => audioFileRef.current?.click()}
                  >
                    <Music className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm">{audioFile?.name || 'Upload MP3'}</p>
                  </div>
                </div>
              </div>
              <Button variant="gold" className="w-full" onClick={handleUpload} disabled={isUploading}>
                {isUploading ? 'Uploading...' : 'Publish Song'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Search your songs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-card"
        />
      </div>

      <Card className="glass">
        <CardContent className="p-0 divide-y divide-border">
          {filteredSongs.map((song) => (
            <div key={song.id} className="flex items-center gap-4 p-4 hover:bg-surface-hover">
              <img src={song.coverArtPath || '/placeholder.svg'} alt="" className="w-12 h-12 rounded object-cover" />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{song.title}</p>
                <p className="text-sm text-muted-foreground">{formatNumber(song.views)} plays</p>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => {
                  setSelectedSong(song);
                  setFormData({
                    title: song.title,
                    artist: artist.artistName,
                    featuredArtists: song.featuredArtists || '',
                    producer: song.producer,
                  });
                  setIsEditOpen(true);
                }}
              >
                <Edit2 className="w-4 h-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon-sm">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete song?</AlertDialogTitle>
                    <AlertDialogDescription>Remove &quot;{song.title}&quot; from the site.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(song.id)}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ))}
          {filteredSongs.length === 0 && (
            <p className="text-center py-12 text-muted-foreground">No songs yet. Upload your first track.</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Song</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input value={artist.artistName} readOnly className="bg-muted" />
            <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
            <Input
              value={formData.featuredArtists}
              onChange={(e) => setFormData({ ...formData, featuredArtists: e.target.value })}
              placeholder="Featured artists"
            />
            <Input
              value={formData.producer}
              onChange={(e) => setFormData({ ...formData, producer: e.target.value })}
              placeholder="Producer"
            />
            <Button variant="gold" className="w-full" onClick={handleUpdate}>
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
