import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Loader2,
  Pencil,
  Search,
  Trash2,
  UserPlus,
} from 'lucide-react';
import { apiFetch } from '../../../shared/api/httpClient';
import { ConfirmDeleteModal } from '../../../shared/components/ConfirmDeleteModal';
import { useToastStore } from '../../../shared/store/useToastStore';
import { AuthUser } from '../../../shared/types/volleyball.types';
import { AdminSidebarLayout } from '../components/AdminSidebarLayout';

export const AdminRefereesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [refName, setRefName] = useState('');
  const [refEmail, setRefEmail] = useState('');
  const [refPassword, setRefPassword] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [editingReferee, setEditingReferee] = useState<{
    id: number;
    name: string;
    email: string;
    password: string;
  } | null>(null);

  const [refereeToDelete, setRefereeToDelete] = useState<{
    id: number;
    name: string;
  } | null>(null);

  const { data: referees = [], isLoading } = useQuery<AuthUser[]>({
    queryKey: ['admin-referees'],
    queryFn: () => apiFetch<AuthUser[]>('/auth/referees'),
  });

  const filteredReferees = useMemo(() => {
    if (!searchQuery.trim()) return referees;
    const q = searchQuery.toLowerCase();
    return referees.filter(
      (r) =>
        r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q),
    );
  }, [referees, searchQuery]);

  const createRefereeMutation = useMutation({
    mutationFn: () => {
      setErrorMsg(null);
      return apiFetch('/auth/referees', {
        method: 'POST',
        body: JSON.stringify({
          name: refName.trim(),
          email: refEmail.trim(),
          password: refPassword,
        }),
      });
    },
    onSuccess: () => {
      setRefName('');
      setRefEmail('');
      setRefPassword('');
      const msg = 'Cuenta de Juez creada exitosamente.';
      setFeedback(msg);
      useToastStore.getState().success(msg);
      void queryClient.invalidateQueries({ queryKey: ['admin-referees'] });
    },
    onError: (err: Error) => {
      setErrorMsg(err.message);
      useToastStore.getState().error(err.message);
    },
  });

  const updateRefereeMutation = useMutation({
    mutationFn: () => {
      if (!editingReferee) throw new Error('No hay juez seleccionado.');
      setErrorMsg(null);
      const payload: { name: string; email: string; password?: string } = {
        name: editingReferee.name.trim(),
        email: editingReferee.email.trim(),
      };
      if (editingReferee.password.trim()) {
        payload.password = editingReferee.password.trim();
      }
      return apiFetch(`/auth/referees/${editingReferee.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      setEditingReferee(null);
      const msg = 'Juez actualizado correctamente.';
      setFeedback(msg);
      useToastStore.getState().success(msg);
      void queryClient.invalidateQueries({ queryKey: ['admin-referees'] });
      void queryClient.invalidateQueries({ queryKey: ['tournaments-list'] });
    },
    onError: (err: Error) => {
      setErrorMsg(err.message);
      useToastStore.getState().error(err.message);
    },
  });

  const deleteRefereeMutation = useMutation({
    mutationFn: (refereeId: number) => {
      setErrorMsg(null);
      return apiFetch(`/auth/referees/${refereeId}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      setRefereeToDelete(null);
      const msg = 'Juez eliminado correctamente.';
      setFeedback(msg);
      useToastStore.getState().success(msg);
      void queryClient.invalidateQueries({ queryKey: ['admin-referees'] });
      void queryClient.invalidateQueries({ queryKey: ['tournaments-list'] });
    },
    onError: (err: Error) => {
      setRefereeToDelete(null);
      setErrorMsg(err.message);
      useToastStore.getState().error(err.message);
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
            <UserPlus className="w-7 h-7 text-yellow-400 shrink-0" />
            <span>Gestión de Jueces</span>
          </h1>
          <p className="text-xs md:text-sm text-zinc-400 mt-1">
            Crea credenciales para jueces de planilla, actualiza sus datos o
            elimina cuentas existentes.
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Formulario de Creación de Juez */}
          <div className="lg:col-span-5 rounded-3xl border border-zinc-800 bg-zinc-900/85 p-5 md:p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-2 text-yellow-400 font-black text-sm border-b border-zinc-800 pb-3">
              <UserPlus className="w-4 h-4" />
              <span>Crear Usuario Juez</span>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createRefereeMutation.mutate();
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  required
                  value={refName}
                  onChange={(e) => setRefName(e.target.value)}
                  placeholder="Nombre completo del Juez"
                  className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:border-yellow-400 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  required
                  value={refEmail}
                  onChange={(e) => setRefEmail(e.target.value)}
                  placeholder="juez@voleibol.com"
                  className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:border-yellow-400 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">
                  Contraseña de Acceso (mín. 4 caracteres)
                </label>
                <input
                  type="password"
                  required
                  minLength={4}
                  value={refPassword}
                  onChange={(e) => setRefPassword(e.target.value)}
                  placeholder="Contraseña de acceso"
                  className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:border-yellow-400 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={createRefereeMutation.isPending}
                className="w-full py-3 rounded-xl bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-zinc-950 font-black text-xs inline-flex items-center justify-center gap-2 transition shadow-lg shadow-yellow-400/20"
              >
                {createRefereeMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creando Juez...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Crear Cuenta de Juez
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Listado y Buscador de Jueces */}
          <div className="lg:col-span-7 rounded-3xl border border-zinc-800 bg-zinc-900/85 p-5 md:p-6 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
              <h2 className="text-sm font-black uppercase tracking-wider text-zinc-200">
                Jueces Registrados ({filteredReferees.length})
              </h2>
              <div className="relative sm:w-64">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por nombre o correo..."
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:border-yellow-400 outline-none"
                />
              </div>
            </div>

            {isLoading ? (
              <div className="p-8 text-center text-xs text-zinc-400">
                Cargando jueces...
              </div>
            ) : filteredReferees.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-500">
                {referees.length === 0
                  ? 'No hay jueces registrados aún.'
                  : 'No coincide ningún juez con la búsqueda.'}
              </div>
            ) : (
              <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                {filteredReferees.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 transition"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-black text-white truncate">
                        {r.name}
                      </div>
                      <div className="text-[11px] text-zinc-400 truncate">
                        {r.email}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          setEditingReferee({
                            id: r.id,
                            name: r.name,
                            email: r.email,
                            password: '',
                          })
                        }
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-yellow-400 text-zinc-200 hover:text-zinc-950 text-xs font-bold transition"
                        title="Editar juez"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Editar</span>
                      </button>
                      <button
                        type="button"
                        disabled={deleteRefereeMutation.isPending}
                        onClick={() =>
                          setRefereeToDelete({ id: r.id, name: r.name })
                        }
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/30 text-xs font-bold transition"
                        title="Eliminar juez"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Eliminar</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal: Editar Juez */}
      {editingReferee && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateRefereeMutation.mutate();
            }}
            className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900 p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-black text-white">Editar Juez</h3>
              <button
                type="button"
                onClick={() => setEditingReferee(null)}
                className="text-xs text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  required
                  value={editingReferee.name}
                  onChange={(e) =>
                    setEditingReferee({
                      ...editingReferee,
                      name: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  required
                  value={editingReferee.email}
                  onChange={(e) =>
                    setEditingReferee({
                      ...editingReferee,
                      email: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">
                  Nueva Contraseña (dejar vacío para mantener la actual)
                </label>
                <input
                  type="password"
                  minLength={4}
                  value={editingReferee.password}
                  onChange={(e) =>
                    setEditingReferee({
                      ...editingReferee,
                      password: e.target.value,
                    })
                  }
                  placeholder="Opcional"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingReferee(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-800 text-zinc-300"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={updateRefereeMutation.isPending}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-black bg-yellow-400 hover:bg-yellow-300 disabled:opacity-60 text-zinc-950 transition"
              >
                {updateRefereeMutation.isPending ? (
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
        isOpen={Boolean(refereeToDelete)}
        title="Eliminar Juez"
        description={`¿Estás seguro de eliminar al juez "${refereeToDelete?.name ?? ''}"? Los partidos que tenía asignados quedarán sin juez.`}
        isLoading={deleteRefereeMutation.isPending}
        onCancel={() => setRefereeToDelete(null)}
        onConfirm={() => {
          if (refereeToDelete) {
            deleteRefereeMutation.mutate(refereeToDelete.id);
          }
        }}
      />
    </AdminSidebarLayout>
  );
};

