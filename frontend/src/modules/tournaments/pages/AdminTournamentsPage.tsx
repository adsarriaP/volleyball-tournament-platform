import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Calendar,
  ExternalLink,
  Loader2,
  Pencil,
  Plus,
  Save,
  Trash2,
  Trophy,
  X,
} from 'lucide-react';
import { apiFetch } from '../../../shared/api/httpClient';
import { ConfirmDeleteModal } from '../../../shared/components/ConfirmDeleteModal';
import { CustomDatePicker } from '../../../shared/components/CustomDatePicker';
import {
  MatchSummary,
  Team,
  TournamentFormatType,
  TournamentRules,
} from '../../../shared/types/volleyball.types';
import { AdminSidebarLayout } from '../components/AdminSidebarLayout';

interface TournamentWithMatches extends TournamentRules {
  teams: Team[];
  matches: MatchSummary[];
}

interface TournamentFormState {
  name: string;
  formatType: TournamentFormatType;
  maxTeams: string;
  groupsCount: string;
  qualifiersPerGroup: string;
  maxSets: string;
  pointsRegularSet: string;
  pointsFinalSet: string;
  pointsDifference: string;
  startDate: string;
  endDate: string;
  dailyStartHour: string;
  dailyEndHour: string;
}

const DEFAULT_START_DATE = new Date().toISOString().slice(0, 10);
const DEFAULT_END_DATE = new Date(
  Date.now() + 7 * 24 * 60 * 60 * 1000,
).toISOString().slice(0, 10);

const INITIAL_FORM_STATE: TournamentFormState = {
  name: '',
  formatType: 'GROUPS_THEN_KNOCKOUT',
  maxTeams: '20',
  groupsCount: '2',
  qualifiersPerGroup: '2',
  maxSets: '3',
  pointsRegularSet: '25',
  pointsFinalSet: '15',
  pointsDifference: '2',
  startDate: DEFAULT_START_DATE,
  endDate: DEFAULT_END_DATE,
  dailyStartHour: '8',
  dailyEndHour: '18',
};

/**
 * Permite borrar el input completamente sin forzar un "0" adelante.
 */
function sanitizeNumericInput(raw: string): string {
  const digitsOnly = raw.replace(/\D/g, '');
  return digitsOnly.replace(/^0+(?=\d)/, '');
}

function formatDateLabel(iso?: string | null): string {
  if (!iso) return 'Sin definir';
  return new Date(iso).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export const AdminTournamentsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<TournamentFormState>(INITIAL_FORM_STATE);
  const [editingTournamentId, setEditingTournamentId] = useState<number | null>(
    null,
  );
  const [tournamentToDelete, setTournamentToDelete] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data: tournaments = [], isLoading } = useQuery<
    TournamentWithMatches[]
  >({
    queryKey: ['tournaments-list'],
    queryFn: () => apiFetch<TournamentWithMatches[]>('/tournaments'),
  });

  const buildValidatedPayload = () => {
    const trimmedName = form.name.trim();
    if (!trimmedName) {
      throw new Error('El nombre del torneo es obligatorio.');
    }

    const maxTeams = Number(form.maxTeams);
    const groupsCount = Number(form.groupsCount);
    const qualifiersPerGroup = Number(form.qualifiersPerGroup);
    const maxSets = Number(form.maxSets);
    const pointsRegularSet = Number(form.pointsRegularSet);
    const pointsFinalSet = Number(form.pointsFinalSet);
    const pointsDifference = Number(form.pointsDifference);
    const dailyStartHour = Number(form.dailyStartHour);
    const dailyEndHour = Number(form.dailyEndHour);

    if (!Number.isInteger(maxTeams) || maxTeams < 2 || maxTeams > 128) {
      throw new Error('El cupo de equipos debe estar entre 2 y 128.');
    }
    if (!Number.isInteger(groupsCount) || groupsCount < 1 || groupsCount > 16) {
      throw new Error('El número de grupos debe estar entre 1 y 16.');
    }
    if (!Number.isInteger(qualifiersPerGroup) || qualifiersPerGroup < 1) {
      throw new Error('Los clasificados por grupo deben ser al menos 1.');
    }
    if (!Number.isInteger(maxSets) || maxSets < 1 || maxSets > 7) {
      throw new Error('El máximo de sets debe estar entre 1 y 7.');
    }
    if (!Number.isInteger(pointsRegularSet) || pointsRegularSet < 5) {
      throw new Error('Los puntos por set regular deben ser al menos 5.');
    }
    if (!Number.isInteger(pointsFinalSet) || pointsFinalSet < 5) {
      throw new Error('Los puntos del set decisivo deben ser al menos 5.');
    }
    if (!Number.isInteger(pointsDifference) || pointsDifference < 1) {
      throw new Error('La diferencia mínima de puntos debe ser al menos 1.');
    }
    if (
      !Number.isInteger(dailyStartHour) ||
      dailyStartHour < 6 ||
      dailyStartHour > 22
    ) {
      throw new Error('La hora de inicio diaria debe estar entre 6 y 22.');
    }
    if (
      !Number.isInteger(dailyEndHour) ||
      dailyEndHour < 7 ||
      dailyEndHour > 23 ||
      dailyEndHour <= dailyStartHour
    ) {
      throw new Error(
        'La hora de fin diaria debe ser mayor que la hora de inicio (máx. 23).',
      );
    }

    return {
      name: trimmedName,
      formatType: form.formatType,
      maxTeams,
      groupsCount,
      qualifiersPerGroup,
      maxSets,
      pointsRegularSet,
      pointsFinalSet,
      pointsDifference,
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
      dailyStartHour,
      dailyEndHour,
    };
  };

  const createTournamentMutation = useMutation({
    mutationFn: async () => {
      setErrorMsg(null);
      const payload = buildValidatedPayload();
      return apiFetch<{ id: number; name: string }>('/tournaments', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    onSuccess: (created) => {
      setForm(INITIAL_FORM_STATE);
      setFeedback(`Torneo "${created.name}" creado correctamente.`);
      void queryClient.invalidateQueries({ queryKey: ['tournaments-list'] });
    },
    onError: (err: Error) => setErrorMsg(err.message),
  });

  const updateTournamentMutation = useMutation({
    mutationFn: async () => {
      if (!editingTournamentId) {
        throw new Error('No hay torneo seleccionado para actualizar.');
      }
      setErrorMsg(null);
      const payload = buildValidatedPayload();
      return apiFetch<{ id: number; name: string }>(
        `/tournaments/${editingTournamentId}`,
        {
          method: 'PATCH',
          body: JSON.stringify(payload),
        },
      );
    },
    onSuccess: (updated) => {
      setEditingTournamentId(null);
      setForm(INITIAL_FORM_STATE);
      setFeedback(`Torneo "${updated.name}" actualizado correctamente.`);
      void queryClient.invalidateQueries({ queryKey: ['tournaments-list'] });
    },
    onError: (err: Error) => setErrorMsg(err.message),
  });

  const deleteTournamentMutation = useMutation({
    mutationFn: (tournamentId: number) => {
      setErrorMsg(null);
      return apiFetch(`/tournaments/${tournamentId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: (_res, deletedId) => {
      if (editingTournamentId === deletedId) {
        setEditingTournamentId(null);
        setForm(INITIAL_FORM_STATE);
      }
      setTournamentToDelete(null);
      setFeedback('Torneo eliminado correctamente.');
      void queryClient.invalidateQueries({ queryKey: ['tournaments-list'] });
    },
    onError: (err: Error) => {
      setTournamentToDelete(null);
      setErrorMsg(err.message);
    },
  });

  const startEditTournament = (t: TournamentWithMatches) => {
    setErrorMsg(null);
    setFeedback(null);
    setEditingTournamentId(t.id);
    setForm({
      name: t.name,
      formatType: t.formatType,
      maxTeams: String(t.maxTeams ?? 20),
      groupsCount: String(t.groupsCount ?? 2),
      qualifiersPerGroup: String(t.qualifiersPerGroup ?? 2),
      maxSets: String(t.maxSets ?? 3),
      pointsRegularSet: String(t.pointsRegularSet ?? 25),
      pointsFinalSet: String(t.pointsFinalSet ?? 15),
      pointsDifference: String(t.pointsDifference ?? 2),
      startDate: t.startDate ? t.startDate.slice(0, 10) : DEFAULT_START_DATE,
      endDate: t.endDate ? t.endDate.slice(0, 10) : DEFAULT_END_DATE,
      dailyStartHour: String(t.dailyStartHour ?? 8),
      dailyEndHour: String(t.dailyEndHour ?? 18),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingTournamentId(null);
    setForm(INITIAL_FORM_STATE);
  };

  const isSubmitting =
    createTournamentMutation.isPending || updateTournamentMutation.isPending;

  const previewTeamsPerGroup = Math.ceil(
    (Number(form.maxTeams) || 0) / Math.max(1, Number(form.groupsCount) || 1),
  );

  return (
    <AdminSidebarLayout>
      <div className="px-4 py-6 md:px-8 md:py-8 max-w-7xl mx-auto space-y-6">
        {/* Cabecera */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link
              to="/admin"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-yellow-400 mb-2 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Volver al Dashboard
            </Link>
            <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-2.5">
              <Trophy className="w-7 h-7 text-yellow-400 shrink-0" />
              <span>Torneos y Configuración</span>
            </h1>
            <p className="text-xs md:text-sm text-zinc-400 mt-1">
              Crea nuevos torneos, ajusta su formato y reglas, o actualiza y
              elimina los torneos existentes.
            </p>
          </div>
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Formulario de Creación / Edición */}
          <div className="lg:col-span-5 rounded-3xl border border-zinc-800 bg-zinc-900/85 p-5 md:p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2 text-yellow-400 font-black text-sm">
                {editingTournamentId ? (
                  <>
                    <Pencil className="w-4 h-4" />
                    <span>Editando Torneo #{editingTournamentId}</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Crear Nuevo Torneo</span>
                  </>
                )}
              </div>
              {editingTournamentId && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="inline-flex items-center gap-1 text-xs font-bold text-zinc-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                  Cancelar
                </button>
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (editingTournamentId) {
                  updateTournamentMutation.mutate();
                } else {
                  createTournamentMutation.mutate();
                }
              }}
              className="space-y-3.5"
            >
              <div>
                <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">
                  Nombre del Torneo
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ej. Copa Nacional Voleibol 2026"
                  className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:border-yellow-400 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">
                  Formato de Competencia
                </label>
                <select
                  value={form.formatType}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      formatType: e.target.value as TournamentFormatType,
                    })
                  }
                  className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:border-yellow-400 outline-none"
                >
                  <option value="GROUPS_THEN_KNOCKOUT">
                    Grupos + Eliminatoria Directa
                  </option>
                  <option value="LEAGUE_ONLY">Liga (Todos contra todos)</option>
                  <option value="KNOCKOUT_ONLY">Eliminación Directa</option>
                </select>
              </div>

              {/* Cupo, Grupos y Clasificados (sin 0 delante) */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">
                    Cupo Equipos
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={form.maxTeams}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        maxTeams: sanitizeNumericInput(e.target.value),
                      })
                    }
                    placeholder="20"
                    className="w-full px-2.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-yellow-400 font-black text-center focus:border-yellow-400 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">
                    N° Grupos
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={form.groupsCount}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        groupsCount: sanitizeNumericInput(e.target.value),
                      })
                    }
                    placeholder="2"
                    className="w-full px-2.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white font-bold text-center focus:border-yellow-400 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">
                    Clasif./Grupo
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={form.qualifiersPerGroup}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        qualifiersPerGroup: sanitizeNumericInput(
                          e.target.value,
                        ),
                      })
                    }
                    placeholder="2"
                    className="w-full px-2.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-yellow-400 font-black text-center focus:border-yellow-400 outline-none"
                  />
                </div>
              </div>

              {/* Reglas de Sets y Puntos */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">
                    Máx. Sets
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={form.maxSets}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        maxSets: sanitizeNumericInput(e.target.value),
                      })
                    }
                    placeholder="3"
                    className="w-full px-2 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white font-bold text-center"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">
                    Pts Set
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={form.pointsRegularSet}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        pointsRegularSet: sanitizeNumericInput(e.target.value),
                      })
                    }
                    placeholder="25"
                    className="w-full px-2 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white font-bold text-center"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">
                    Pts Desempate
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={form.pointsFinalSet}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        pointsFinalSet: sanitizeNumericInput(e.target.value),
                      })
                    }
                    placeholder="15"
                    className="w-full px-2 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white font-bold text-center"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">
                    Dif. Mínima
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={form.pointsDifference}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        pointsDifference: sanitizeNumericInput(e.target.value),
                      })
                    }
                    placeholder="2"
                    className="w-full px-2 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white font-bold text-center"
                  />
                </div>
              </div>

              {/* Fechas con CustomDatePicker responsive */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <CustomDatePicker
                  label="Fecha Inicio"
                  value={form.startDate}
                  onChange={(val) => setForm({ ...form, startDate: val })}
                />
                <CustomDatePicker
                  label="Fecha Fin"
                  value={form.endDate}
                  onChange={(val) => setForm({ ...form, endDate: val })}
                />
              </div>

              {/* Horario Diario */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">
                    Hora Inicio (6-22)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={form.dailyStartHour}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        dailyStartHour: sanitizeNumericInput(e.target.value),
                      })
                    }
                    placeholder="8"
                    className="w-full px-2.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white font-bold text-center"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">
                    Hora Fin (7-23)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={form.dailyEndHour}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        dailyEndHour: sanitizeNumericInput(e.target.value),
                      })
                    }
                    placeholder="18"
                    className="w-full px-2.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white font-bold text-center"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-300">
                Distribución estimada:{' '}
                <strong>
                  {form.groupsCount || '0'} grupos de {previewTeamsPerGroup}{' '}
                  equipos
                </strong>
                . Clasifican{' '}
                <strong className="text-yellow-400">
                  {form.qualifiersPerGroup || '0'} por grupo
                </strong>
                .
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-zinc-950 font-black text-xs inline-flex items-center justify-center gap-2 transition shadow-lg shadow-yellow-400/20"
              >
                {editingTournamentId ? (
                  <>
                    {updateTournamentMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {updateTournamentMutation.isPending
                      ? 'Actualizando Torneo...'
                      : 'Guardar Cambios del Torneo'}
                  </>
                ) : (
                  <>
                    {createTournamentMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    {createTournamentMutation.isPending
                      ? 'Creando Torneo...'
                      : 'Crear Torneo Oficial'}
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Listado de Torneos Existentes */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-wider text-zinc-300">
                Torneos Registrados ({tournaments.length})
              </h2>
            </div>

            {isLoading ? (
              <div className="p-8 rounded-3xl border border-zinc-800 bg-zinc-900/60 text-center text-xs text-zinc-400">
                Cargando torneos...
              </div>
            ) : tournaments.length === 0 ? (
              <div className="p-8 rounded-3xl border border-zinc-800 bg-zinc-900/60 text-center text-xs text-zinc-400">
                Aún no hay torneos creados. Usa el formulario para crear el
                primero.
              </div>
            ) : (
              <div className="space-y-3">
                {tournaments.map((t) => {
                  const isEditingThis = editingTournamentId === t.id;
                  return (
                    <div
                      key={t.id}
                      className={`rounded-3xl border p-5 transition space-y-3 ${
                        isEditingThis
                          ? 'border-yellow-400 bg-zinc-900 shadow-xl shadow-yellow-400/10'
                          : 'border-zinc-800 bg-zinc-900/80 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="space-y-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-black text-white truncate">
                              {t.name}
                            </h3>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-zinc-950 border border-zinc-800 text-yellow-400">
                              {t.formatType}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-400">
                            <span className="inline-flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-yellow-400" />
                              {formatDateLabel(t.startDate)} –{' '}
                              {formatDateLabel(t.endDate)}
                            </span>
                            <span>
                              Horario: {t.dailyStartHour ?? 8}:00 -{' '}
                              {t.dailyEndHour ?? 18}:00
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          <Link
                            to={`/tournaments/${t.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-zinc-950 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 transition"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-yellow-400" />
                            Ver
                          </Link>
                          <button
                            type="button"
                            onClick={() => startEditTournament(t)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-yellow-400 text-zinc-200 hover:text-zinc-950 transition"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Editar
                          </button>
                          <button
                            type="button"
                            disabled={deleteTournamentMutation.isPending}
                            onClick={() =>
                              setTournamentToDelete({ id: t.id, name: t.name })
                            }
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500/15 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/30 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Eliminar
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-zinc-800/80 text-[11px]">
                        <div className="px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800">
                          <span className="text-zinc-500 block">Equipos</span>
                          <span className="font-black text-white">
                            {t.teams.length} / {t.maxTeams}
                          </span>
                        </div>
                        <div className="px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800">
                          <span className="text-zinc-500 block">
                            Grupos / Clasif.
                          </span>
                          <span className="font-black text-white">
                            {t.groupsCount} grp • Top {t.qualifiersPerGroup}
                          </span>
                        </div>
                        <div className="px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800">
                          <span className="text-zinc-500 block">Reglas</span>
                          <span className="font-black text-white">
                            {t.maxSets} sets ({t.pointsRegularSet}/
                            {t.pointsFinalSet})
                          </span>
                        </div>
                        <div className="px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800">
                          <span className="text-zinc-500 block">Partidos</span>
                          <span className="font-black text-yellow-400">
                            {t.matches.length} cruces
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDeleteModal
        isOpen={Boolean(tournamentToDelete)}
        title="Eliminar Torneo"
        description={`¿Estás seguro de eliminar el torneo "${tournamentToDelete?.name ?? ''}"? Se eliminarán también sus fases y partidos programados.`}
        isLoading={deleteTournamentMutation.isPending}
        onCancel={() => setTournamentToDelete(null)}
        onConfirm={() => {
          if (tournamentToDelete) {
            deleteTournamentMutation.mutate(tournamentToDelete.id);
          }
        }}
      />
    </AdminSidebarLayout>
  );
};

