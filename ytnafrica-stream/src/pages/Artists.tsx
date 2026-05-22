import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Mic2, Search, UserCircle, ChevronRight } from 'lucide-react';
import { api, Artist, Song, Album } from '@/lib/api';
import { VerifiedBadge } from '@/components/VerifiedBadge';
import { SongCard } from '@/components/cards/SongCard';
import { AlbumCard } from '@/components/cards/AlbumCard';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type ArtistWithReleases = Artist & {
  singles: Song[];
  albums: Album[];
};

function groupReleasesByArtist(
  artists: Artist[],
  songs: Song[],
  albums: Album[]
): ArtistWithReleases[] {
  const byId = new Map<number, ArtistWithReleases>();

  artists.forEach((artist) => {
    byId.set(artist.id, { ...artist, singles: [], albums: [] });
  });

  const matchArtistId = (artistId?: number | null, artistName?: string): number | null => {
    if (artistId && byId.has(artistId)) return artistId;
    if (artistName) {
      const found = artists.find(
        (a) => a.artistName.toLowerCase() === artistName.toLowerCase()
      );
      return found?.id ?? null;
    }
    return null;
  };

  albums.forEach((album) => {
    const id = matchArtistId(album.artistId, album.artist);
    if (id) {
      byId.get(id)!.albums.push(album);
    }
  });

  songs.forEach((song) => {
    if (song.album) return;
    const id = matchArtistId(song.artistId, song.artist);
    if (id) {
      byId.get(id)!.singles.push(song);
    }
  });

  return Array.from(byId.values()).sort((a, b) =>
    a.artistName.localeCompare(b.artistName)
  );
}

function ArtistSection({ artist }: { artist: ArtistWithReleases }) {
  const hasReleases = artist.singles.length > 0 || artist.albums.length > 0;

  return (
    <section
      id={`artist-${artist.id}`}
      className="rounded-2xl glass border border-border/50 overflow-hidden"
    >
      <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 p-6 md:p-8 border-b border-border/50">
        <Link
          to={`/artists/${artist.id}`}
          className="shrink-0 group"
        >
          <div className="w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden bg-muted ring-4 ring-primary/20 group-hover:ring-primary/50 transition-all">
            {artist.profileImagePath ? (
              <img
                src={artist.profileImagePath}
                alt={artist.artistName}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <UserCircle className="w-16 h-16 text-muted-foreground" />
              </div>
            )}
          </div>
        </Link>

        <div className="flex-1 text-center sm:text-left min-w-0">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Artist</p>
          <Link to={`/artists/${artist.id}`} className="inline-flex items-center gap-2 group">
            <h2 className="text-2xl md:text-3xl font-bold group-hover:text-primary transition-colors truncate">
              {artist.artistName}
            </h2>
            <VerifiedBadge verified={artist.verified} size="md" />
            <ChevronRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </Link>
          <p className="text-sm text-muted-foreground mt-2">
            {artist.singles.length} single{artist.singles.length !== 1 ? 's' : ''} ·{' '}
            {artist.albums.length} album{artist.albums.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="p-6 md:p-8 space-y-10">
        {artist.albums.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              Albums
              <span className="text-sm font-normal text-muted-foreground">({artist.albums.length})</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {artist.albums.map((album, i) => (
                <AlbumCard key={album.id} album={album} index={i} />
              ))}
            </div>
          </div>
        )}

        {artist.singles.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              Singles
              <span className="text-sm font-normal text-muted-foreground">({artist.singles.length})</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {artist.singles.map((song, i) => (
                <SongCard key={song.id} song={song} queue={artist.singles} index={i} />
              ))}
            </div>
          </div>
        )}

        {!hasReleases && (
          <p className="text-center text-muted-foreground py-8">No releases yet.</p>
        )}
      </div>
    </section>
  );
}

export default function Artists() {
  const [artistsWithReleases, setArtistsWithReleases] = useState<ArtistWithReleases[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [artists, songs, albums] = await Promise.all([
          api.getArtists(),
          api.getSongs(),
          api.getAlbums(),
        ]);
        setArtistsWithReleases(groupReleasesByArtist(artists, songs, albums));
      } catch (error) {
        console.error('Error loading artists:', error);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return artistsWithReleases;
    return artistsWithReleases.filter(
      (a) =>
        a.artistName.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        a.singles.some((s) => s.title.toLowerCase().includes(q)) ||
        a.albums.some((al) => al.title.toLowerCase().includes(q))
    );
  }, [artistsWithReleases, searchQuery]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-32">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/10">
            <Mic2 className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-4xl font-bold">Artists</h1>
            <p className="text-muted-foreground mt-1">
              Browse {artistsWithReleases.length} artists and their releases
            </p>
          </div>
        </div>
        <div className="relative w-full md:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search artists, albums, or songs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-card"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 rounded-2xl glass">
          <UserCircle className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-xl font-medium">
            {searchQuery ? 'No artists match your search' : 'No artists yet'}
          </p>
          <p className="text-muted-foreground mt-2">
            {searchQuery ? 'Try a different search term' : 'Artists will appear here once added by admin'}
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {filtered.map((artist, index) => (
            <div
              key={artist.id}
              className={cn('opacity-0 animate-fade-in')}
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <ArtistSection artist={artist} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
