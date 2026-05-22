import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { Song, api, getStreamUrl } from '@/lib/api';
import { setPlayerProgress } from '@/hooks/use-player-progress';
import { useToast } from '@/hooks/use-toast';

interface PlayerState {
  currentSong: Song | null;
  isPlaying: boolean;
  isTrackLoading: boolean;
  isBuffering: boolean;
  volume: number;
  queue: Song[];
  currentIndex: number;
  isShuffled: boolean;
  repeatMode: 'off' | 'all' | 'one';
}

interface PlayerActions {
  playSong: (song: Song, queue?: Song[]) => void;
  prefetchSong: (song: Song) => void;
  togglePlay: () => void;
  playNext: () => void;
  playPrevious: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  addToQueue: (song: Song) => void;
  clearQueue: () => void;
}

type PlayerContextValue = PlayerState & PlayerActions;

const PlayerContext = createContext<PlayerContextValue | null>(null);

const initialState: PlayerState = {
  currentSong: null,
  isPlaying: false,
  isTrackLoading: false,
  isBuffering: false,
  volume: 0.7,
  queue: [],
  currentIndex: 0,
  isShuffled: false,
  repeatMode: 'off',
};

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prefetchRef = useRef<HTMLAudioElement | null>(null);
  const playSongRef = useRef<((song: Song, queue?: Song[]) => void) | null>(null);
  const playRequestRef = useRef(0);
  const stateRef = useRef<PlayerState & { currentTime: number }>({
    ...initialState,
    currentTime: 0,
  });
  const [state, setState] = useState<PlayerState>(initialState);

  const patchState = useCallback((patch: Partial<PlayerState>) => {
    setState((prev) => {
      const next = { ...prev, ...patch };
      stateRef.current = { ...stateRef.current, ...next };
      return next;
    });
  }, []);

  const resumePlayback = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !stateRef.current.isPlaying) return;

    const requestId = ++playRequestRef.current;
    audio.play().catch((err: DOMException) => {
      if (err.name === 'AbortError') return;
      if (requestId === playRequestRef.current) {
        patchState({ isPlaying: false, isTrackLoading: false, isBuffering: false });
      }
    });
  }, [patchState]);

  const prefetchSong = useCallback((song: Song) => {
    if (!song?.id || stateRef.current.currentSong?.id === song.id) return;
    try {
      if (!prefetchRef.current) {
        prefetchRef.current = new Audio();
        prefetchRef.current.preload = 'metadata';
      }
      const url = getStreamUrl(song.id);
      if (prefetchRef.current.src !== url) {
        prefetchRef.current.src = url;
        prefetchRef.current.load();
      }
    } catch {
      /* ignore */
    }
  }, []);

  const prefetchNextInQueue = useCallback((queue: Song[], currentIndex: number) => {
    if (queue.length < 2) return;
    const next = queue[(currentIndex + 1) % queue.length];
    if (next) prefetchSong(next);
  }, [prefetchSong]);

  useEffect(() => {
    const audio = new Audio();
    audio.volume = state.volume;
    audio.preload = 'auto';
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      const t = audio.currentTime;
      stateRef.current.currentTime = t;
      setPlayerProgress({ currentTime: t });
    };

    const handleLoadedMetadata = () => {
      if (Number.isFinite(audio.duration)) {
        setPlayerProgress({ duration: audio.duration });
      }
    };

    const handlePlaying = () => {
      patchState({ isTrackLoading: false, isBuffering: false });
    };

    const handleWaiting = () => {
      if (stateRef.current.isPlaying) {
        patchState({ isBuffering: true });
      }
    };

    const handleSeeked = () => {
      const t = audio.currentTime;
      stateRef.current.currentTime = t;
      setPlayerProgress({ currentTime: t });
      patchState({ isBuffering: false });
      if (stateRef.current.isPlaying && audio.paused) {
        resumePlayback();
      }
    };

    const handleEnded = () => {
      const current = stateRef.current;
      if (current.repeatMode === 'one') {
        audio.currentTime = 0;
        setPlayerProgress({ currentTime: 0 });
        resumePlayback();
        return;
      }
      if (current.queue.length === 0) return;

      const nextIndex = current.isShuffled
        ? Math.floor(Math.random() * current.queue.length)
        : (current.currentIndex + 1) % current.queue.length;

      if (nextIndex === 0 && current.repeatMode === 'off' && !current.isShuffled) {
        patchState({ isPlaying: false, isTrackLoading: false, isBuffering: false });
        return;
      }

      const nextSong = current.queue[nextIndex];
      if (nextSong && playSongRef.current) {
        playSongRef.current(nextSong, current.queue);
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('seeked', handleSeeked);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('seeked', handleSeeked);
      audio.removeEventListener('ended', handleEnded);
      playRequestRef.current += 1;
      audio.pause();
      audio.src = '';
    };
  }, [patchState, resumePlayback, state.volume]);

  const playSong = useCallback(
    (song: Song, queue?: Song[]) => {
      const audio = audioRef.current;
      if (!audio || !song?.id) return;

      const newQueue = queue || [song];
      const newIndex = newQueue.findIndex((s) => s.id === song.id);

      // Same track: instant play/pause toggle
      if (stateRef.current.currentSong?.id === song.id) {
        if (stateRef.current.isPlaying) {
          playRequestRef.current += 1;
          audio.pause();
          patchState({ isPlaying: false, isBuffering: false, isTrackLoading: false });
        } else {
          patchState({ isPlaying: true, isBuffering: false, isTrackLoading: false });
          resumePlayback();
        }
        return;
      }

      patchState({
        currentSong: song,
        isPlaying: true,
        isTrackLoading: true,
        isBuffering: false,
        queue: newQueue,
        currentIndex: newIndex >= 0 ? newIndex : 0,
      });
      stateRef.current.currentTime = 0;
      setPlayerProgress({ currentTime: 0, duration: 0 });

      prefetchNextInQueue(newQueue, newIndex >= 0 ? newIndex : 0);
      api.playSong(song.id).catch(() => {});

      playRequestRef.current += 1;
      audio.pause();
      audio.currentTime = 0;

      const streamUrl = getStreamUrl(song.id);
      const fallbackUrl =
        song.filePath && song.filePath.startsWith('http') ? song.filePath : null;

      const onCanPlay = () => {
        if (stateRef.current.currentSong?.id === song.id && stateRef.current.isPlaying) {
          resumePlayback();
        }
      };

      const onError = () => {
        if (fallbackUrl && audio.src !== fallbackUrl) {
          audio.removeEventListener('canplay', onCanPlay);
          audio.src = fallbackUrl;
          audio.load();
          audio.addEventListener('canplay', onCanPlay, { once: true });
          return;
        }
        patchState({ isPlaying: false, isTrackLoading: false, isBuffering: false });
        toast({
          title: 'Unable to play song',
          description: `${song.title} could not be loaded.`,
          variant: 'destructive',
        });
      };

      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('error', onError);
      audio.addEventListener('canplay', onCanPlay, { once: true });
      audio.addEventListener('error', onError, { once: true });

      audio.src = streamUrl;
      audio.load();
    },
    [patchState, prefetchNextInQueue, resumePlayback, toast]
  );

  useEffect(() => {
    playSongRef.current = playSong;
  }, [playSong]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !stateRef.current.currentSong) return;

    if (stateRef.current.isPlaying) {
      playRequestRef.current += 1;
      patchState({ isPlaying: false, isBuffering: false, isTrackLoading: false });
      audio.pause();
    } else {
      patchState({ isPlaying: true, isBuffering: false, isTrackLoading: false });
      resumePlayback();
    }
  }, [patchState, resumePlayback]);

  const playNext = useCallback(() => {
    const current = stateRef.current;
    if (current.queue.length === 0) return;

    const nextIndex = current.isShuffled
      ? Math.floor(Math.random() * current.queue.length)
      : (current.currentIndex + 1) % current.queue.length;

    if (nextIndex === 0 && current.repeatMode === 'off' && !current.isShuffled) {
      patchState({ isPlaying: false });
      return;
    }

    const nextSong = current.queue[nextIndex];
    if (nextSong) playSong(nextSong, current.queue);
  }, [playSong, patchState]);

  const playPrevious = useCallback(() => {
    const current = stateRef.current;
    const audio = audioRef.current;
    if (current.queue.length === 0) return;

    if (current.currentTime > 3) {
      if (audio) {
        audio.currentTime = 0;
        stateRef.current.currentTime = 0;
        setPlayerProgress({ currentTime: 0 });
      }
      return;
    }

    const prevIndex =
      current.currentIndex === 0 ? current.queue.length - 1 : current.currentIndex - 1;
    const prevSong = current.queue[prevIndex];
    if (prevSong) playSong(prevSong, current.queue);
  }, [playSong]);

  const seek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(time)) return;

    const clamped = Math.max(0, Math.min(time, audio.duration || time));
    const wasPlaying = stateRef.current.isPlaying;

    audio.currentTime = clamped;
    stateRef.current.currentTime = clamped;
    setPlayerProgress({ currentTime: clamped });
    if (wasPlaying) {
      patchState({ isBuffering: true });
    }
  }, [patchState]);

  const setVolume = useCallback((volume: number) => {
    if (audioRef.current) audioRef.current.volume = volume;
    patchState({ volume });
  }, [patchState]);

  const toggleShuffle = useCallback(() => {
    patchState({ isShuffled: !stateRef.current.isShuffled });
  }, [patchState]);

  const toggleRepeat = useCallback(() => {
    const mode = stateRef.current.repeatMode;
    patchState({
      repeatMode: mode === 'off' ? 'all' : mode === 'all' ? 'one' : 'off',
    });
  }, [patchState]);

  const addToQueue = useCallback((song: Song) => {
    patchState({ queue: [...stateRef.current.queue, song] });
  }, [patchState]);

  const clearQueue = useCallback(() => {
    patchState({ queue: [], currentIndex: 0 });
  }, [patchState]);

  const value = useMemo<PlayerContextValue>(
    () => ({
      ...state,
      playSong,
      prefetchSong,
      togglePlay,
      playNext,
      playPrevious,
      seek,
      setVolume,
      toggleShuffle,
      toggleRepeat,
      addToQueue,
      clearQueue,
    }),
    [
      state,
      playSong,
      prefetchSong,
      togglePlay,
      playNext,
      playPrevious,
      seek,
      setVolume,
      toggleShuffle,
      toggleRepeat,
      addToQueue,
      clearQueue,
    ]
  );

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
}
