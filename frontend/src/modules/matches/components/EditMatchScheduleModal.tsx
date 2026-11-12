import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Calendar, MapPin, Shield, User, X } from 'lucide-react';
import { apiFetch } from '../../../shared/api/httpClient';
import { CustomDatePicker } from '../../../shared/components/CustomDatePicker';
import { MatchSummary } from '../../../shared/types/volleyball.types';

interface RefereeOption {
  id: number;
  name: string;
  email: string;
}

interface EditMatchScheduleModalProps {
  match: MatchSummary;
  isOpen: boolean;
  onClose: () => void;
  tournamentId: number;
}

export const EditMatchScheduleModal: React.FC<EditMatchScheduleModalProps> = ({
  match,
  isOpen,
  onClose,
  tournamentId,
}) => {
  const queryClient = useQueryClient();

  const [scheduledAt, setScheduledAt] = useState<string>(
    match.scheduledAt ? match.scheduledAt.slice(0, 16) : '',
  );
  const [courtNumber, setCourtNumber] = useState<string>(match.courtNumber ?? '');
  const [courtMapUrl, setCourtMapUrl] = useState<string>(match.courtMapUrl ?? '');
  const [refereeId, setRefereeId] = useState<number | null>(
    match.referee?.id ?? null,
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Obtener lista de jueces registrados desde el backend
  const { data: referees } = useQuery<RefereeOption[]>({
    queryKey: ['referees-list'],
    queryFn: () => apiFetch<RefereeOption[]>('/auth/referees'),
    enabled: isOpen,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      setErrorMsg(null);
      return apiFetch(`/matches/${match.id}/schedule`, {
        method: 'PATCH',
        body: JSON.stringify({
          scheduledAt: scheduledAt || null,
          courtNumber: courtNumber.trim() || null,
          courtMapUrl: courtMapUrl.trim() || null,
          refereeId: refereeId ? Number(refereeId) : null,
        }),
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['tournament-detail', tournamentId],
      });
      void queryClient.invalidateQueries({
        queryKey: ['referee-assigned-matches'],
      });
      onClose();
    },
    onError: (err: Error) => {
      setErrorMsg(err.message);
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-3xl border border-zinc-800 bg-zinc-900 p-6 space-y-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="space-y-0.5">
            <span className="text-[11px] font-black uppercase tracking-wider text-yellow-400">
              Gestión de Partido #{match.id}
            </span>
            <h3 className="text-lg font-black text-white">
              {match.homeTeam.name} vs {match.awayTeam.name}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs">
            {errorMsg}
          </div>
        )}

        <div className="space-y-4 text-xs">
          {/* Asignación de Árbitro / Juez */}
          <div>
            <label className="flex items-center gap-1.5 font-bold text-zinc-300 mb-1.5">
              <Shield className="w-4 h-4 text-yellow-400" />
              Árbitro / Juez de Mesa
            </label>
            <select
              value={refereeId ?? ''}
              onChange={(e) =>
                setRefereeId(e.target.value ? Number(e.target.value) : null)
              }
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 font-semibold focus:border-yellow-400 focus:outline-none transition"
            >
              <option value="">-- Sin juez asignado --</option>
              {referees?.map((ref) => (
                <option key={ref.id} value={ref.id}>
                  {ref.name} ({ref.email})
                </option>
              ))}
            </select>
          </div>

          {/* Fecha y Hora con CustomDatePicker */}
          <div>
            <label className="flex items-center gap-1.5 font-bold text-zinc-300 mb-1.5">
              <Calendar className="w-4 h-4 text-yellow-400" />
              Fecha y Hora Programada
            </label>
            <CustomDatePicker
              value={scheduledAt}
              onChange={(val) => setScheduledAt(val)}
            />
          </div>

          {/* Cancha */}
          <div>
            <label className="flex items-center gap-1.5 font-bold text-zinc-300 mb-1.5">
              <MapPin className="w-4 h-4 text-yellow-400" />
              Número o Nombre de Cancha
            </label>
            <input
              type="text"
              placeholder="Ej. Cancha 1, Cancha Principal..."
              value={courtNumber}
              onChange={(e) => setCourtNumber(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 font-medium focus:border-yellow-400 focus:outline-none transition"
            />
          </div>

          {/* Enlace de Google Maps */}
          <div>
            <label className="flex items-center gap-1.5 font-bold text-zinc-300 mb-1.5">
              <MapPin className="w-4 h-4 text-sky-400" />
              Enlace de Ubicación (Google Maps URL)
            </label>
            <input
              type="url"
              placeholder="https://maps.google.com/..."
              value={courtMapUrl}
              onChange={(e) => setCourtMapUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 font-medium focus:border-yellow-400 focus:outline-none transition"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate()}
            className="px-5 py-2.5 rounded-xl text-xs font-black bg-yellow-400 hover:bg-yellow-300 text-black transition"
          >
            {mutation.isPending ? 'Guardando...' : 'Guardar Asignación'}
          </button>
        </div>
      </div>
    </div>
  );
};
