import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppNavbar } from './shared/components/AppNavbar';
import { ActiveTournamentsPage } from './modules/tournaments/pages/ActiveTournamentsPage';
import { TournamentDetailPage } from './modules/tournaments/pages/TournamentDetailPage';
import { AdminDashboardPage } from './modules/tournaments/pages/AdminDashboardPage';
import { RefereeMatchesPage } from './modules/referee/pages/RefereeMatchesPage';
import { RefereeScoringPage } from './modules/referee/pages/RefereeScoringPage';
import { LiveMatchPublicPage } from './modules/teams/pages/LiveMatchPublicPage';
import { LoginPage } from './modules/teams/pages/LoginPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
          <AppNavbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Navigate to="/tournaments" replace />} />
              {/* URL Pública de Torneos Activos */}
              <Route path="/tournaments" element={<ActiveTournamentsPage />} />
              {/* URL de Detalle de Torneo -> Equipos -> Partidos por Equipo */}
              <Route
                path="/tournaments/:tournamentId"
                element={<TournamentDetailPage />}
              />
              {/* Vista Pública de Marcador y Rotaciones en Tiempo Real */}
              <Route
                path="/matches/:matchId/live"
                element={<LiveMatchPublicPage />}
              />
              {/* Login para Jueces y Administrador */}
              <Route path="/login" element={<LoginPage />} />
              {/* Consola Táctil del Juez (REFEREE) */}
              <Route
                path="/referee/matches"
                element={<RefereeMatchesPage />}
              />
              <Route
                path="/referee/matches/:matchId/score"
                element={<RefereeScoringPage />}
              />
              {/* Panel de Administración (ADMIN) */}
              <Route path="/admin" element={<AdminDashboardPage />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;

