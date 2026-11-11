import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '../api/httpClient';
import { useAuthStore } from '../store/useAuthStore';
import { MatchLivePayload } from '../types/volleyball.types';

interface UseMatchLiveSocketResult {
  liveData: MatchLivePayload | null;
  isConnected: boolean;
  lastRotatedTeamId: number | null;
  setInitialData: (data: MatchLivePayload) => void;
}

/**
 * Custom Hook `useMatchLiveSocket(matchId: number)`
 * - Se conecta al Gateway Socket.io de NestJS con token JWT.
 * - Emite `joinMatchRoom` con el `matchId`.
 * - Escucha `matchScoreUpdated` y actualiza el estado reactivo sin recargar la página.
 * - Limpia la suscripción y emite `leaveMatchRoom` al desmontar.
 */
export function useMatchLiveSocket(matchId: number): UseMatchLiveSocketResult {
  const token = useAuthStore((s) => s.token);
  const [liveData, setLiveData] = useState<MatchLivePayload | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [lastRotatedTeamId, setLastRotatedTeamId] = useState<number | null>(
    null,
  );

  useEffect(() => {
    if (!matchId || Number.isNaN(matchId)) return;

    const socket: Socket = io(API_BASE_URL, {
      transports: ['websocket', 'polling'],
      auth: token ? { token } : undefined,
    });

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('joinMatchRoom', { matchId });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('matchScoreUpdated', (payload: MatchLivePayload) => {
      if (payload && payload.matchId === matchId) {
        setLiveData(payload);
        if (payload.didServeChange && payload.rotatedTeamId) {
          setLastRotatedTeamId(payload.rotatedTeamId);
          setTimeout(() => setLastRotatedTeamId(null), 2200);
        }
      }
    });

    return () => {
      socket.emit('leaveMatchRoom', { matchId });
      socket.disconnect();
    };
  }, [matchId, token]);

  return {
    liveData,
    isConnected,
    lastRotatedTeamId,
    setInitialData: setLiveData,
  };
}

