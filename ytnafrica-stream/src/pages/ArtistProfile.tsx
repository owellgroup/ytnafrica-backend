import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { api, ArtistProfile as ArtistProfileData, Song } from '@/lib/api';
import { VerifiedBadge } from '@/components/VerifiedBadge';
import { SongCard } from '@/components/cards/SongCard';
import { AlbumCard } from '@/components/cards/AlbumCard';
import { UserCircle } from 'lucide-react';

export default function ArtistProfile() {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<ArtistProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api
      .getArtistProfile(Number(id))
      .then(setProfile)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-20">
        <p className="text-xl font-medium">Artist not found</p>
        <Link to="/" className="text-primary mt-4 inline-block">
          Back home
        </Link>
      </div>
    );
  }

  const { artist, songs, albums } = profile;
  const singles = songs.filter((s) => !s.album);

  return (
    <div className="space-y-10 pb-32">
      <Link
        to="/artists"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        All Artists
      </Link>
      <div className="flex flex-col md:flex-row items-center md:items-end gap-8 p-8 rounded-2xl glass">
        <div className="w-40 h-40 rounded-full overflow-hidden bg-muted shrink-0 ring-4 ring-primary/30">
          {artist.profileImagePath ? (
            <img src={artist.profileImagePath} alt={artist.artistName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <UserCircle className="w-24 h-24 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="text-center md:text-left">
          <p className="text-sm uppercase tracking-wider text-muted-foreground mb-1">Artist</p>
          <h1 className="text-4xl md:text-5xl font-bold flex items-center justify-center md:justify-start gap-2">
            {artist.artistName}
            <VerifiedBadge verified={artist.verified} size="md" />
          </h1>
          <p className="text-muted-foreground mt-2">
            {singles.length} singles · {albums.length} albums
          </p>
        </div>
      </div>

      {singles.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold mb-6">Singles</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {singles.map((song: Song, i: number) => (
              <SongCard key={song.id} song={song} queue={singles} index={i} />
            ))}
          </div>
        </section>
      )}

      {albums.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold mb-6">Albums</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {albums.map((album, i) => (
              <AlbumCard key={album.id} album={album} index={i} />
            ))}
          </div>
        </section>
      )}

      {singles.length === 0 && albums.length === 0 && (
        <p className="text-center text-muted-foreground py-12">No music published yet.</p>
      )}
    </div>
  );
}
