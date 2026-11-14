import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  ImagePlus,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
} from 'lucide-react';
import { apiFetch, resolveTeamLogoUrl } from '../../../shared/api/httpClient';
import { ConfirmDeleteModal } from '../../../shared/components/ConfirmDeleteModal';
import {
  MatchSummary,
  Team,
  TournamentRules,
} from '../../../shared/types/volleyball.types';
import { AdminSidebarLayout } from '../components/AdminSidebarLayout';

interface TournamentWithMatches extends TournamentRules {
  teams: Team[];
  matches: MatchSummary[];
}

export const AdminTeamsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [selectedTournamentId, setSelectedTournamentId] = useState<string>('');
  const [teamName, setTeamName] = useState('');
  const [delegateName, setDelegateName] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [teamSearchQuery, setTeamSearchQuery] = useState('');

  const [editingTeam, setEditingTeam] = useState<{
    id: number;
    name: string;
    delegateName: string;
    logoFile: File | null;
  } | null>(null);
  const [teamToDelete, setTeamToDelete] = useState<{
    id: number;
    name: string;
  } | null>(null);

  const { data: tournaments = [] } = useQuery<TournamentWithMatches[]>({
    queryKey: ['tournaments-list'],
    queryFn: () => apiFetch<TournamentWithMatches[]>('/tournaments'),
  });

  useEffect(() => {
    if (!selectedTournamentId && tournaments.length > 0) {
      setSelectedTournamentId(String(tournaments[0].id));
    }
  }, [tournaments, selectedTournamentId]);

  const numericTournamentId = selectedTournamentId
    ? Number(selectedTournamentId)
    : undefined;

  const { data: teamsInTournament = [], isLoading: isLoadingTeams } = useQuery<
    Team[]
  >({
    queryKey: ['admin-teams-tournament', numericTournamentId],
    queryFn: () =>
      apiFetch<Team[]>(
        numericTournamentId
          ? `/teams?tournamentId=${numericTournamentId}`
          : '/teams',
      ),
    enabled: Boolean(numericTournamentId),
  });

  const targetTournament = tournaments.find(
    (t) => String(t.id) === selectedTournamentId,
  );
  const maxAllowedTeams = targetTournament?.maxTeams ?? 20;
  const currentCount = selectedTournamentId ? teamsInTournament.length : 0;
  const isQuotaReached = Boolean(
    targetTournament && currentCount >= maxAllowedTeams,
  );
  const remainingQuota = Math.max(0, maxAllowedTeams - currentCount);

  const filteredTeams = useMemo(() => {
    if (!teamSearchQuery.trim()) return teamsInTournament;
    const q = teamSearchQuery.toLowerCase();
    return teamsInTournament.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        (t.delegateName && t.delegateName.toLowerCase().includes(q)),
    );
  }, [teamsInTournament, teamSearchQuery]);

  const isDuplicateTeamName = useMemo(() => {
    if (!teamName.trim()) return false;
    return teamsInTournament.some(
      (t) => t.name.trim().toLowerCase() === teamName.trim().toLowerCase(),
    );
  }, [teamsInTournament, teamName]);

  const createTeamMutation = useMutation({
    mutationFn: () => {
      setErrorMsg(null);
      if (!selectedTournamentId) {
        throw new Error(
          'Debes seleccionar el torneo al que vas a registrar el equipo.',
        );
      }
      const formData = new FormData();
      formData.append('name', teamName.trim());
      if (delegateName.trim()) {
        formData.append('delegateName', delegateName.trim());
      }
      formData.append('tournamentId', selectedTournamentId);
      if (logoFile) {
        formData.append('logo', logoFile);
      }
      return apiFetch('/teams', {
        method: 'POST',
        body: formData,
      });
    },
    onSuccess: () => {
      setTeamName('');
      setDelegateName('');
      setLogoFile(null);
      setFeedback('Equipo registrado correctamente en el torneo.');
      void queryClient.invalidateQueries({
        queryKey: ['admin-teams-tournament', numericTournamentId],
      });
      void queryClient.invalidateQueries({ queryKey: ['tournaments-list'] });
    },
    onError: (err: Error) => setErrorMsg(err.message),
  });

  const updateTeamMutation = useMutation({
    mutationFn: () => {
      if (!editingTeam) throw new Error('No hay equipo seleccionado.');
      setErrorMsg(null);
      const formData = new FormData();
      formData.append('name', editingTeam.name.trim());
      formData.append('delegateName', editingTeam.delegateName.trim());
      if (editingTeam.logoFile) {
        formData.append('logo', editingTeam.logoFile);
      }
      return apiFetch(`/teams/${editingTeam.id}`, {
        method: 'PATCH',
        body: formData,
      });
    },
    onSuccess: () => {
      setEditingTeam(null);
      setFeedback('Equipo actualizado correctamente.');
      void queryClient.invalidateQueries({
        queryKey: ['admin-teams-tournament', numericTournamentId],
      });
      void queryClient.invalidateQueries({ queryKey: ['tournaments-list'] });
    },
    onError: (err: Error) => setErrorMsg(err.message),
  });

  const deleteTeamMutation = useMutation({
    mutationFn: (teamId: number) => {
      setErrorMsg(null);
      return apiFetch(`/teams/${teamId}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      setTeamToDelete(null);
      setFeedback('Equipo eliminado correctamente.');
      void queryClient.invalidateQueries({
        queryKey: ['admin-teams-tournament', numericTournamentId],
      });
      void queryClient.invalidateQueries({ queryKey: ['tournaments-list'] });
    },
    onError: (err: Error) => {
      setTeamToDelete(null);
      setErrorMsg(err.message);
    },
  });

  return (
    <AdminSidebarLayout>
      <div className="px-4 py-6 md:px-8 md:py-8 max-w-7xl mx-auto space-y-6">
        <div>
          <Link
            to="/admin"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-yellow-400 mb-2 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Volver al Dashboard
          </Link>
          <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-2.5">
            <Users className="w-7 h-7 text-yellow-400 shrink-0" />
            <span>Equipos del Torneo</span>
          </h1>
          <p className="text-xs md:text-sm text-zinc-400 mt-1">
            Selecciona un torneo para inscribir, editar o eliminar sus equipos
            participantes.
          </p>
        </div>

        {feedback && (
          <div className="p-4 rounded-2xl border border-yellow-400/50 bg-zinc-900/90 text-yellow-400 text-xs font-bold flex items-center justify-between gap-2 shadow-xl">
            <span>{feedback}</span>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="text-white"
            >
              ✕
            </button>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 rounded-2xl border border-rose-500/50 bg-rose-950/50 text-rose-300 text-xs font-bold flex items-center justify-between gap-2 shadow-xl">
            <span>{errorMsg}</span>
            <button type="button" onClick={() => setErrorMsg(null)}>
              ✕
            </button>
          </div>
        )}

        {/* Selector de Torneo + Progreso de Cupo */}
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/85 p-5 space-y-3 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex-1">
              <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">
                Torneo a Gestionar
              </label>
              <select
                value={selectedTournamentId}
                onChange={(e) => {
                  setSelectedTournamentId(e.target.value);
                  setTeamSearchQuery('');
                }}
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:border-yellow-400 outline-none"
              >
                <option value="">-- Elige un Torneo --</option>
                {tournaments.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} (Cupo: {t.teams.length}/{t.maxTeams ?? 20})
                  </option>
                ))}
              </select>
            </div>

            {targetTournament && (
              <div className="sm:text-right shrink-0">
                <span
                  className={`inline-block text-xs font-black px-3 py-1 rounded-full ${
                    isQuotaReached
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-zinc-950 text-yellow-400 border border-zinc-800'
                  }`}
                >
                  {currentCount} / {maxAllowedTeams} Equipos
                </span>
                <div className="text-[11px] text-zinc-400 mt-1">
                  {isQuotaReached
                    ? 'Cupo completo para iniciar'
                    : `Faltan ${remainingQuota} equipos`}
                </div>
              </div>
            )}
          </div>

          {targetTournament && (
            <div className="w-full h-2 rounded-full bg-zinc-950 overflow-hidden border border-zinc-800">
              <div
                className={`h-full transition-all duration-500 ${
                  isQuotaReached ? 'bg-emerald-400' : 'bg-yellow-400'
                }`}
                style={{
                  width: `${Math.min(100, (currentCount / maxAllowedTeams) * 100)}%`,
                }}
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Formulario de Inscripción */}
          <div className="lg:col-span-5 rounded-3xl border border-zinc-800 bg-zinc-900/85 p-5 md:p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-2 text-yellow-400 font-black text-sm border-b border-zinc-800 pb-3">
              <Plus className="w-4 h-4" />
              <span>Inscribir Nuevo Equipo</span>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createTeamMutation.mutate();
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">
                  Nombre del Equipo
                </label>
                <input
                  type="text"
                  required
                  disabled={!selectedTournamentId || isQuotaReached}
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="Ej. Titanes Voley"
                  className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white disabled:opacity-40 focus:border-yellow-400 outline-none"
                />
                {isDuplicateTeamName && (
                  <span className="text-[10px] text-rose-400 font-bold">
                    Ya existe en este torneo
                  </span>
                )}
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">
                  Delegado del Equipo
                </label>
                <input
                  type="text"
                  required
                  disabled={!selectedTournamentId || isQuotaReached}
                  value={delegateName}
                  onChange={(e) => setDelegateName(e.target.value)}
                  placeholder="Ej. Juan Gómez"
                  className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white disabled:opacity-40 focus:border-yellow-400 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">
                  Escudo / Icono (Opcional)
                </label>
                <label
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl bg-zinc-950 border border-dashed border-zinc-700 text-xs text-zinc-300 ${
                    !selectedTournamentId || isQuotaReached
                      ? 'opacity-40 cursor-not-allowed'
                      : 'hover:border-yellow-400 cursor-pointer'
                  }`}
                >
                  <span className="inline-flex items-center gap-1.5 truncate">
                    <ImagePlus className="w-4 h-4 text-yellow-400 shrink-0" />
                    {logoFile ? logoFile.name : 'Subir imagen de escudo...'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={!selectedTournamentId || isQuotaReached}
                    onChange={(e) =>
                      setLogoFile(e.target.files?.[0] ? e.target.files[0] : null)
                    }
                    className="hidden"
                  />
                </label>
              </div>

              <button
                type="submit"
                disabled={
                  !selectedTournamentId ||
                  isQuotaReached ||
                  createTeamMutation.isPending ||
                  isDuplicateTeamName
                }
                className="w-full py-3 rounded-xl bg-yellow-400 hover:bg-yellow-300 disabled:opacity-40 text-zinc-950 font-black text-xs inline-flex items-center justify-center gap-1.5 transition shadow-lg shadow-yellow-400/20"
              >
                {createTeamMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Inscribiendo...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Inscribir Equipo en Torneo
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Listado y Buscador de Equipos */}
          <div className="lg:col-span-7 rounded-3xl border border-zinc-800 bg-zinc-900/85 p-5 md:p-6 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
              <h2 className="text-sm font-black uppercase tracking-wider text-zinc-200">
                Equipos Inscritos ({filteredTeams.length})
              </h2>
              <div className="relative sm:w-64">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={teamSearchQuery}
                  onChange={(e) => setTeamSearchQuery(e.target.value)}
                  placeholder="Buscar equipo o delegado..."
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:border-yellow-400 outline-none"
                />
              </div>
            </div>

            {!selectedTournamentId ? (
              <div className="p-8 text-center text-xs text-zinc-400">
                Selecciona un torneo arriba para ver y administrar sus equipos.
              </div>
            ) : isLoadingTeams ? (
              <div className="p-8 text-center text-xs text-zinc-400">
                Cargando equipos...
              </div>
            ) : filteredTeams.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-500">
                {teamsInTournament.length === 0
                  ? 'No hay equipos registrados en este torneo aún.'
                  : 'No coincide ningún equipo con la búsqueda.'}
              </div>
            ) : (
              <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                {filteredTeams.map((t) => {
                  const logo = resolveTeamLogoUrl(t.logoUrl);
                  return (
                    <div
                      key={t.id}
                      className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-2xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center overflow-hidden text-xs font-black text-yellow-400 shrink-0">
                          {logo ? (
                            <img
                              src={logo}
                              alt={t.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            t.name.slice(0, 2).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-black text-white truncate">
                            {t.name}
                          </div>
                          <div className="text-[11px] text-zinc-400 truncate">
                            Delegado: {t.delegateName || 'N/A'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            setEditingTeam({
                              id: t.id,
                              name: t.name,
                              delegateName: t.delegateName ?? '',
                              logoFile: null,
                            })
                          }
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-yellow-400 text-zinc-200 hover:text-zinc-950 text-xs font-bold transition"
                          title="Editar equipo"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Editar</span>
                        </button>
                        <button
                          type="button"
                          disabled={deleteTeamMutation.isPending}
                          onClick={() =>
                            setTeamToDelete({ id: t.id, name: t.name })
                          }
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/30 text-xs font-bold transition"
                          title="Eliminar equipo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Eliminar</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal: Editar Equipo */}
      {editingTeam && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateTeamMutation.mutate();
            }}
            className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900 p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-black text-white">Editar Equipo</h3>
              <button
                type="button"
                onClick={() => setEditingTeam(null)}
                className="text-xs text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">
                  Nombre del Equipo
                </label>
                <input
                  type="text"
                  required
                  value={editingTeam.name}
                  onChange={(e) =>
                    setEditingTeam({ ...editingTeam, name: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">
                  Delegado del Equipo
                </label>
                <input
                  type="text"
                  value={editingTeam.delegateName}
                  onChange={(e) =>
                    setEditingTeam({
                      ...editingTeam,
                      delegateName: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">
                  Cambiar Escudo (Opcional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setEditingTeam({
                      ...editingTeam,
                      logoFile: e.target.files?.[0] ?? null,
                    })
                  }
                  className="w-full text-xs text-zinc-300"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingTeam(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-800 text-zinc-300"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={updateTeamMutation.isPending}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-black bg-yellow-400 hover:bg-yellow-300 disabled:opacity-60 text-zinc-950 transition"
              >
                {updateTeamMutation.isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Guardar Cambios'
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={Boolean(teamToDelete)}
        title="Eliminar Equipo"
        description={`¿Estás seguro de eliminar al equipo "${teamToDelete?.name ?? ''}"? Esta acción no se puede deshacer.`}
        isLoading={deleteTeamMutation.isPending}
        onCancel={() => setTeamToDelete(null)}
        onConfirm={() => {
          if (teamToDelete) {
            deleteTeamMutation.mutate(teamToDelete.id);
          }
        }}
      />
    </AdminSidebarLayout>
  );
};

