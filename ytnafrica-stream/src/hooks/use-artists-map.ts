import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, Artist } from '@/lib/api';

export function useArtistsMap() {
  const { data: artists = [] } = useQuery({
    queryKey: ['artists'],
    queryFn: () => api.getArtists(),
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
  });

  const { byId, byName } = useMemo(() => {
    const idMap = new Map<number, Artist>();
    const nameMap = new Map<string, Artist>();
    artists.forEach((a) => {
      idMap.set(a.id, a);
      nameMap.set(a.artistName.toLowerCase(), a);
    });
    return { byId: idMap, byName: nameMap };
  }, [artists]);

  const getVerified = useMemo(
    () => (artistId?: number | null, artistName?: string) => {
      if (artistId && byId.has(artistId)) {
        return byId.get(artistId)!.verified;
      }
      if (artistName) {
        return byName.get(artistName.toLowerCase())?.verified ?? false;
      }
      return false;
    },
    [byId, byName]
  );

  const getArtistId = useMemo(
    () => (artistId?: number | null, artistName?: string) => {
      if (artistId) return artistId;
      if (artistName) return byName.get(artistName.toLowerCase())?.id;
      return undefined;
    },
    [byName]
  );

  return { artists, byId, getVerified, getArtistId };
}
