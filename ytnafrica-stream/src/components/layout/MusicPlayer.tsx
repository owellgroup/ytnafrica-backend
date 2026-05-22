import { useState, useCallback, useRef, useEffect, memo } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Repeat,
  Repeat1,
  Shuffle,
  Heart,
  Share2,
  Download,
  Loader2,
} from 'lucide-react';
import { usePlayer } from '@/contexts/PlayerContext';
import { usePlayerProgress } from '@/hooks/use-player-progress';
import { formatDuration, api } from '@/lib/api';
import { ArtistName } from '@/components/ArtistName';
import { useArtistsMap } from '@/hooks/use-artists-map';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

function LoadingSpinner({ className }: { className?: string }) {
  return (
    <Loader2
      className={cn('animate-spin text-primary', className)}
      aria-label="Loading audio"
    />
  );
}

const PlayerSeekBar = memo(function PlayerSeekBar({ onSeek }: { onSeek: (time: number) => void }) {
  const { currentTime, duration } = usePlayerProgress();
  return <SeekBar currentTime={currentTime} duration={duration} onSeek={onSeek} />;
});

function SeekBar({
  currentTime,
  duration,
  onSeek,
}: {
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [scrubTime, setScrubTime] = useState<number | null>(null);
  const isDragging = scrubTime !== null;
  const displayTime = isDragging ? scrubTime! : currentTime;
  const progress = duration > 0 ? displayTime / duration : 0;

  const timeFromClientX = useCallback(
    (clientX: number) => {
      const track = trackRef.current;
      if (!track || duration <= 0) return 0;
      const rect = track.getBoundingClientRect();
      const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      return percent * duration;
    },
    [duration]
  );

  const commitSeek = useCallback(
    (clientX: number) => {
      onSeek(timeFromClientX(clientX));
      setScrubTime(null);
    },
    [onSeek, timeFromClientX]
  );

  useEffect(() => {
    if (!isDragging) return;

    const onMove = (e: PointerEvent) => {
      setScrubTime(timeFromClientX(e.clientX));
    };
    const onUp = (e: PointerEvent) => {
      commitSeek(e.clientX);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [isDragging, timeFromClientX, commitSeek]);

  return (
    <div className="w-full flex items-center gap-2 md:gap-3">
      <span className="text-xs md:text-sm text-muted-foreground w-10 md:w-12 text-right tabular-nums shrink-0">
        {formatDuration(displayTime)}
      </span>
      <div
        ref={trackRef}
        className="flex-1 h-1.5 md:h-1 bg-muted/80 rounded-full cursor-pointer group relative touch-none select-none"
        onPointerDown={(e) => {
          if (duration <= 0) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          const t = timeFromClientX(e.clientX);
          setScrubTime(t);
        }}
        onPointerUp={(e) => {
          if (duration <= 0) return;
          commitSeek(e.clientX);
        }}
        role="slider"
        aria-valuemin={0}
        aria-valuemax={duration}
        aria-valuenow={displayTime}
        aria-label="Seek"
      >
        <div
          className="absolute inset-y-0 left-0 bg-foreground rounded-full group-hover:bg-primary transition-colors"
          style={{ width: `${progress * 100}%` }}
        />
        <div
          className={cn(
            'absolute top-1/2 -translate-y-1/2 w-3 h-3 md:w-3.5 md:h-3.5 bg-foreground rounded-full shadow-md pointer-events-none transition-opacity',
            isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          )}
          style={{ left: `calc(${progress * 100}% - 6px)` }}
        />
      </div>
      <span className="text-xs md:text-sm text-muted-foreground w-10 md:w-12 tabular-nums shrink-0">
        {formatDuration(duration)}
      </span>
    </div>
  );
}

function VolumeControl({
  volume,
  isMuted,
  onVolumeChange,
  onToggleMute,
  className,
}: {
  volume: number;
  isMuted: boolean;
  onVolumeChange: (v: number) => void;
  onToggleMute: () => void;
  className?: string;
}) {
  const displayVolume = isMuted ? 0 : volume;

  return (
    <div className={cn('flex items-center gap-2 group/vol', className)}>
      <button
        type="button"
        onClick={onToggleMute}
        className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors shrink-0"
        aria-label={isMuted || volume === 0 ? 'Unmute' : 'Mute'}
      >
        {isMuted || volume === 0 ? (
          <VolumeX className="w-5 h-5" />
        ) : volume < 0.35 ? (
          <Volume2 className="w-5 h-5 opacity-70" />
        ) : (
          <Volume2 className="w-5 h-5" />
        )}
      </button>
      <div className="w-24 sm:w-28 md:w-32 flex items-center">
        <Slider
          value={[displayVolume * 100]}
          max={100}
          step={1}
          onValueChange={([v]) => onVolumeChange(v / 100)}
          className={cn(
            'cursor-pointer',
            '[&_[role=slider]]:h-3.5 [&_[role=slider]]:w-3.5 [&_[role=slider]]:border-0',
            '[&_[role=slider]]:bg-foreground [&_[role=slider]]:shadow-md',
            '[&_[role=slider]]:opacity-0 group-hover/vol:opacity-100 focus-visible:opacity-100',
            '[&_[role=slider]]:transition-opacity',
            '[&_.bg-secondary]:h-1 [&_.bg-secondary]:bg-muted/90',
            '[&_.bg-primary]:bg-foreground group-hover/vol:[&_.bg-primary]:bg-primary'
          )}
          aria-label="Volume"
        />
      </div>
    </div>
  );
}

function LikeButton({ isLiked, onClick }: { isLiked: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'p-2.5 rounded-full transition-all duration-200 shrink-0',
        'hover:scale-105 active:scale-95',
        isLiked
          ? 'text-accent bg-accent/15 ring-1 ring-accent/30'
          : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
      )}
      aria-label={isLiked ? 'Unlike' : 'Like'}
      title={isLiked ? 'Liked' : 'Like'}
    >
      <Heart
        className={cn(
          'w-5 h-5 md:w-6 md:h-6 transition-all',
          isLiked && 'fill-accent text-accent scale-110'
        )}
      />
    </button>
  );
}

function DownloadButton({ onClick, compact }: { onClick: () => void; compact?: boolean }) {
  if (compact) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'flex items-center justify-center p-2.5 rounded-full shrink-0',
          'bg-secondary/80 hover:bg-primary/20 text-foreground',
          'ring-1 ring-border hover:ring-primary/40 transition-all'
        )}
        aria-label="Download"
        title="Download"
      >
        <Download className="w-5 h-5" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-2 px-4 py-2 rounded-full shrink-0',
        'bg-secondary/80 hover:bg-primary/15 text-foreground font-medium text-sm',
        'ring-1 ring-border hover:ring-primary/50 transition-all',
        'hover:shadow-sm active:scale-[0.98]'
      )}
      aria-label="Download song"
    >
      <Download className="w-4 h-4" />
      <span className="hidden sm:inline">Download</span>
    </button>
  );
}

function MusicPlayerInner() {
  const {
    currentSong,
    isPlaying,
    isTrackLoading,
    isBuffering,
    volume,
    isShuffled,
    repeatMode,
    togglePlay,
    playNext,
    playPrevious,
    seek,
    setVolume,
    toggleShuffle,
    toggleRepeat,
  } = usePlayer();

  const { toast } = useToast();
  const { getVerified, getArtistId } = useArtistsMap();
  const [isLiked, setIsLiked] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(0.7);

  const showCoverLoading = isTrackLoading;
  const showBufferingHint = isBuffering && isPlaying && !isTrackLoading;

  const handleSeek = useCallback(
    (time: number) => {
      seek(time);
    },
    [seek]
  );

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (newVolume > 0) setIsMuted(false);
  };

  const toggleMute = () => {
    if (isMuted) {
      setVolume(prevVolume);
      setIsMuted(false);
    } else {
      setPrevVolume(volume);
      setVolume(0);
      setIsMuted(true);
    }
  };

  if (!currentSong) {
    return (
      <div className="fixed bottom-0 left-0 right-0 h-24 md:h-28 bg-card/95 backdrop-blur-xl border-t border-border z-50">
        <div className="h-full flex items-center justify-center text-muted-foreground">
          <p className="text-sm md:text-base">Select a song to start playing</p>
        </div>
      </div>
    );
  }

  const artistId = getArtistId(currentSong.artistId, currentSong.artist);
  const verified = getVerified(currentSong.artistId, currentSong.artist);
  const handleLike = async () => {
    try {
      await api.likeSong(currentSong.id);
      setIsLiked(!isLiked);
      toast({ title: isLiked ? 'Removed from Liked Songs' : 'Added to Liked Songs' });
    } catch (error) {
      console.error('Error liking song:', error);
    }
  };

  const handleShare = async () => {
    try {
      const response = await api.shareSong(currentSong.id);
      if (response.shareableUrl) {
        await navigator.clipboard.writeText(response.shareableUrl);
        toast({ title: 'Link copied!', description: 'Share this song with your friends' });
      }
    } catch (error) {
      console.error('Error sharing song:', error);
    }
  };

  const handleDownload = () => {
    window.open(api.getDownloadUrl(currentSong.id), '_blank');
  };

  const CoverArt = ({ className }: { className?: string }) => (
    <div className={cn('relative flex-shrink-0', className)}>
      <img
        src={currentSong.coverArtPath || '/placeholder.svg'}
        alt={currentSong.title}
        className={cn(
          'rounded-md object-cover shadow-md aspect-square',
          showCoverLoading && 'opacity-60',
          isPlaying && !showCoverLoading && 'ring-1 ring-primary/30'
        )}
      />
      {showCoverLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-md">
          <LoadingSpinner className="w-8 h-8" />
        </div>
      )}
    </div>
  );

  const PlayPauseButton = () => (
    <Button
      variant="player"
      size="icon-lg"
      onClick={togglePlay}
      disabled={isTrackLoading}
      className="touch-manipulation h-11 w-11 md:h-12 md:w-12 rounded-full active:scale-95 transition-transform duration-75"
      aria-label={isPlaying ? 'Pause' : 'Play'}
    >
      {isPlaying ? (
        <Pause className="w-6 h-6 fill-current" />
      ) : (
        <Play className="w-6 h-6 fill-current ml-0.5" />
      )}
    </Button>
  );

  const TransportControls = () => (
    <div className="flex items-center justify-center gap-2 md:gap-4">
      <Button
        variant="icon"
        size="icon"
        onClick={toggleShuffle}
        className={cn('h-8 w-8', isShuffled && 'text-primary')}
      >
        <Shuffle className="w-4 h-4" />
      </Button>
      <Button variant="icon" size="icon" onClick={playPrevious} className="h-9 w-9">
        <SkipBack className="w-5 h-5 fill-current" />
      </Button>
      <PlayPauseButton />
      <Button variant="icon" size="icon" onClick={playNext} className="h-9 w-9">
        <SkipForward className="w-5 h-5 fill-current" />
      </Button>
      <Button
        variant="icon"
        size="icon"
        onClick={toggleRepeat}
        className={cn('h-8 w-8', repeatMode !== 'off' && 'text-primary')}
      >
        {repeatMode === 'one' ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
      </Button>
    </div>
  );

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#181818]/95 backdrop-blur-xl border-t border-border/80 z-50">
      {/* Mobile */}
      <div className="md:hidden">
        <div className="px-3 pt-2">
          <PlayerSeekBar onSeek={handleSeek} />
        </div>
        <div className="px-3 py-2.5 flex items-center gap-3">
          <CoverArt className="w-14 h-14" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm truncate">{currentSong.title}</p>
            <p className="text-xs text-muted-foreground truncate">
              <ArtistName name={currentSong.artist} artistId={artistId} verified={verified} />
            </p>
          </div>
          <LikeButton isLiked={isLiked} onClick={handleLike} />
          <DownloadButton onClick={handleDownload} compact />
        </div>
        <div className="px-3 pb-3 flex items-center justify-between gap-2">
          <TransportControls />
          <VolumeControl
            volume={volume}
            isMuted={isMuted}
            onVolumeChange={handleVolumeChange}
            onToggleMute={toggleMute}
          />
        </div>
      </div>

      {/* Desktop — Spotify-style layout */}
      <div className="hidden md:grid md:grid-cols-[1fr_2fr_1fr] md:items-center md:gap-4 lg:gap-6 h-[90px] lg:h-[96px] px-4 lg:px-6">
        {/* Left: track info */}
        <div className="flex items-center gap-3 min-w-0">
          <CoverArt className="w-14 h-14 lg:w-16 lg:h-16" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm lg:text-base truncate hover:underline cursor-default">
              {currentSong.title}
            </p>
            <p className="text-xs lg:text-sm text-muted-foreground truncate">
              <ArtistName name={currentSong.artist} artistId={artistId} verified={verified} />
              {currentSong.featuredArtists && ` · ${currentSong.featuredArtists}`}
            </p>
            {(showCoverLoading || showBufferingHint) && (
              <p className="text-xs text-primary mt-0.5 flex items-center gap-1">
                <LoadingSpinner className="w-3 h-3" />
                {showCoverLoading ? 'Loading…' : 'Buffering…'}
              </p>
            )}
          </div>
          <LikeButton isLiked={isLiked} onClick={handleLike} />
        </div>

        {/* Center: controls + seek */}
        <div className="flex flex-col items-center gap-1.5 min-w-0 px-2">
          <TransportControls />
          <PlayerSeekBar onSeek={handleSeek} />
        </div>

        {/* Right: actions + volume */}
        <div className="flex items-center justify-end gap-3 lg:gap-4 min-w-0">
          <button
            type="button"
            onClick={handleShare}
            className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
            aria-label="Share"
          >
            <Share2 className="w-5 h-5" />
          </button>
          <DownloadButton onClick={handleDownload} />
          <VolumeControl
            volume={volume}
            isMuted={isMuted}
            onVolumeChange={handleVolumeChange}
            onToggleMute={toggleMute}
            className="min-w-0"
          />
        </div>
      </div>
    </div>
  );
}

export const MusicPlayer = memo(MusicPlayerInner);
