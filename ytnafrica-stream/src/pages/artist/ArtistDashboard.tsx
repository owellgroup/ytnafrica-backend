import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Music, Disc3, Upload } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api, Song, Album } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function ArtistDashboard() {
  const { artist } = useAuth();
  const [songs, setSongs] = useState<Song[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);

  useEffect(() => {
    if (!artist) return;
    Promise.all([
      api.getSongsByArtist(artist.id),
      api.getAlbumsByArtist(artist.id),
    ]).then(([s, a]) => {
      setSongs(s);
      setAlbums(a);
    });
  }, [artist]);

  if (!artist) return null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Welcome, {artist.artistName}</h1>
        <p className="text-muted-foreground">Your uploads appear on the public site immediately.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="glass">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <Music className="w-8 h-8 text-primary mb-2" />
              <p className="text-2xl font-bold">{songs.length}</p>
              <p className="text-muted-foreground">Singles</p>
            </div>
            <Button variant="gold" asChild>
              <Link to="/artist/songs">
                <Upload className="w-4 h-4 mr-2" />
                Upload song
              </Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <Disc3 className="w-8 h-8 text-primary mb-2" />
              <p className="text-2xl font-bold">{albums.length}</p>
              <p className="text-muted-foreground">Albums</p>
            </div>
            <Button variant="gold" asChild>
              <Link to="/artist/albums">
                <Upload className="w-4 h-4 mr-2" />
                Upload album
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
