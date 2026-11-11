import { create } from 'zustand';
import { AuthUser } from '../types/volleyball.types';

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  setSession: (token: string, user: AuthUser) => void;
  logout: () => void;
}

const STORAGE_KEY = 'voleilive_auth_session';

function loadInitialSession(): { token: string | null; user: AuthUser | null } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { token: null, user: null };
    return JSON.parse(raw) as { token: string | null; user: AuthUser | null };
  } catch {
    return { token: null, user: null };
  }
}

const initial = loadInitialSession();

export const useAuthStore = create<AuthState>((set) => ({
  token: initial.token,
  user: initial.user,
  setSession: (token, user) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user }));
    set({ token, user });
  },
  logout: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ token: null, user: null });
  },
}));

