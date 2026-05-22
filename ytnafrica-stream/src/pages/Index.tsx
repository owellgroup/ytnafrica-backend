import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Clock, Disc3, ChevronRight, Music2 } from 'lucide-react';
import { api, Song, Album } from '@/lib/api';
import { SongCard } from '@/components/cards/SongCard';
import { AlbumCard } from '@/components/cards/AlbumCard';

export default function Index() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [songsData, albumsData] = await Promise.all([
          api.getSongs(),
          api.getAlbums(),
        ]);
        setSongs(songsData);
        setAlbums(albumsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const trendingSongs = [...songs].sort((a, b) => b.views - a.views).slice(0, 12);
  const recentSongs = [...songs].slice(0, 6);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Trending Now — landing section */}
      {trendingSongs.length > 0 && (
        <section className="px-4 md:px-8 pt-6 md:pt-10 pb-8 md:pb-12">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-6 md:mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-accent/15 ring-1 ring-accent/25">
                  <TrendingUp className="w-6 h-6 md:w-7 md:h-7 text-accent" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-4xl font-bold tracking-tight">Trending Now</h1>
                  <p className="text-sm md:text-base text-muted-foreground mt-0.5">
                    Most played on YTN Africa
                  </p>
                </div>
              </div>
              <Link
                to="/songs"
                className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                See all <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
              {trendingSongs.map((song, index) => (
                <SongCard key={song.id} song={song} queue={songs} index={index} />
              ))}
            </div>
          </div>
        </section>
      )}

      {albums.length > 0 && (
        <section className="px-4 md:px-8 py-8 md:py-12 bg-gradient-to-b from-transparent to-card/30">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Disc3 className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-bold">Featured Albums</h2>
                  <p className="text-xs md:text-sm text-muted-foreground">Curated collections for you</p>
                </div>
              </div>
              <Link
                to="/albums"
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                See all <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {albums.map((album, index) => (
                <AlbumCard key={album.id} album={album} index={index} />
              ))}
            </div>
          </div>
        </section>
      )}

      {recentSongs.length > 0 && (
        <section className="px-4 md:px-8 py-8 md:py-12">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Clock className="w-5 h-5 md:w-6 md:h-6 text-green-500" />
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-bold">Recently Added</h2>
                  <p className="text-xs md:text-sm text-muted-foreground">Fresh tracks just for you</p>
                </div>
              </div>
              <Link
                to="/songs"
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                See all <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
              {recentSongs.map((song, index) => (
                <SongCard key={song.id} song={song} queue={songs} index={index} />
              ))}
            </div>
          </div>
        </section>
      )}

      {songs.length === 0 && albums.length === 0 && !isLoading && (
        <div className="text-center py-20 px-4">
          <Music2 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">No music available</h2>
          <p className="text-muted-foreground">Check back later for new content</p>
        </div>
      )}
    </div>
  );
}
