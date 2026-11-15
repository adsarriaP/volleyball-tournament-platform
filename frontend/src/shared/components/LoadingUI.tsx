import React from 'react';
import { useIsFetching } from '@tanstack/react-query';
import { CircleDot as Volleyball } from 'lucide-react';

export const GlobalFetchingBar: React.FC = () => {
  const isFetching = useIsFetching();
  if (isFetching === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 z-[60] h-[3px] bg-zinc-900/80 overflow-hidden pointer-events-none"
    >
      <div className="h-full w-1/2 bg-gradient-to-r from-transparent via-yellow-400 to-transparent animate-[pulse_1.1s_ease-in-out_infinite] mx-auto" />
    </div>
  );
};

interface BrandLoaderPillProps {
  label: string;
}

export const BrandLoaderPill: React.FC<BrandLoaderPillProps> = ({ label }) => (
  <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-zinc-900/90 border border-zinc-800 shadow-lg">
    <Volleyball className="w-4 h-4 text-yellow-400 animate-spin shrink-0" />
    <span className="text-xs font-bold text-zinc-200 tracking-wide">
      {label}
    </span>
  </div>
);

interface CardGridSkeletonProps {
  count?: number;
  columnsClass?: string;
  label?: string;
}

export const CardGridSkeleton: React.FC<CardGridSkeletonProps> = ({
  count = 6,
  columnsClass = 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  label,
}) => (
  <div className="space-y-4">
    {label && (
      <div className="flex justify-center">
        <BrandLoaderPill label={label} />
      </div>
    )}
    <div className={`grid ${columnsClass} gap-4`}>
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="p-5 rounded-3xl border border-zinc-800 bg-zinc-900/70 space-y-4 animate-pulse"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-11 h-11 rounded-2xl bg-zinc-800 shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="h-4 w-3/4 rounded-lg bg-zinc-800" />
                <div className="h-3 w-1/2 rounded-lg bg-zinc-800/80" />
              </div>
            </div>
            <div className="h-6 w-20 rounded-full bg-zinc-800 shrink-0" />
          </div>
          <div className="space-y-2 pt-2 border-t border-zinc-800/70">
            <div className="h-3 w-full rounded-lg bg-zinc-800/80" />
            <div className="h-3 w-2/3 rounded-lg bg-zinc-800/60" />
          </div>
          <div className="flex items-center justify-between pt-2">
            <div className="h-7 w-24 rounded-xl bg-zinc-800" />
            <div className="h-9 w-28 rounded-xl bg-zinc-800" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

interface ScoreboardSkeletonProps {
  label?: string;
}

export const ScoreboardSkeleton: React.FC<ScoreboardSkeletonProps> = ({
  label = 'Conectando al marcador en tiempo real...',
}) => (
  <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
    <div className="flex items-center justify-between gap-3">
      <div className="h-5 w-36 rounded-lg bg-zinc-800 animate-pulse" />
      <BrandLoaderPill label={label} />
    </div>

    {/* Skeleton del LiveScoreBanner */}
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5 sm:p-8 space-y-6 animate-pulse">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="h-6 w-44 rounded-full bg-zinc-800" />
        <div className="h-6 w-28 rounded-full bg-zinc-800" />
      </div>

      <div className="grid grid-cols-3 items-center gap-3 sm:gap-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl bg-zinc-800" />
          <div className="h-4 w-24 sm:w-32 rounded-lg bg-zinc-800" />
        </div>

        <div className="flex items-center justify-center gap-3 sm:gap-5">
          <div className="w-14 h-16 sm:w-20 sm:h-24 rounded-2xl bg-zinc-800" />
          <div className="h-6 w-3 rounded bg-zinc-800" />
          <div className="w-14 h-16 sm:w-20 sm:h-24 rounded-2xl bg-zinc-800" />
        </div>

        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl bg-zinc-800" />
          <div className="h-4 w-24 sm:w-32 rounded-lg bg-zinc-800" />
        </div>
      </div>

      <div className="flex justify-center gap-2 pt-2">
        <div className="h-7 w-24 rounded-full bg-zinc-800" />
        <div className="h-7 w-24 rounded-full bg-zinc-800" />
      </div>
    </div>

    {/* Skeleton de cancha / consola */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 animate-pulse">
      <div className="h-64 rounded-3xl border border-zinc-800 bg-zinc-900/60" />
      <div className="h-64 rounded-3xl border border-zinc-800 bg-zinc-900/60" />
    </div>
  </div>
);

export const TournamentDetailSkeleton: React.FC = () => (
  <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
    <div className="flex items-center justify-between gap-3">
      <div className="h-5 w-40 rounded-lg bg-zinc-800 animate-pulse" />
      <BrandLoaderPill label="Cargando centro de resultados..." />
    </div>

    <div className="p-6 rounded-3xl border border-zinc-800 bg-zinc-900/80 space-y-4 animate-pulse">
      <div className="h-7 w-2/3 max-w-md rounded-xl bg-zinc-800" />
      <div className="flex flex-wrap gap-2">
        <div className="h-6 w-24 rounded-full bg-zinc-800" />
        <div className="h-6 w-32 rounded-full bg-zinc-800" />
        <div className="h-6 w-28 rounded-full bg-zinc-800" />
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
      {Array.from({ length: 4 }).map((_, idx) => (
        <div
          key={idx}
          className="h-36 rounded-3xl border border-zinc-800 bg-zinc-900/70"
        />
      ))}
    </div>
  </div>
);

interface ListRowsSkeletonProps {
  rows?: number;
}

export const ListRowsSkeleton: React.FC<ListRowsSkeletonProps> = ({
  rows = 4,
}) => (
  <div className="space-y-2.5 py-2">
    {Array.from({ length: rows }).map((_, idx) => (
      <div
        key={idx}
        className="p-3.5 rounded-2xl border border-zinc-800 bg-zinc-950/80 flex items-center justify-between gap-3 animate-pulse"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-xl bg-zinc-800 shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="h-3.5 w-2/5 rounded bg-zinc-800" />
            <div className="h-3 w-3/5 rounded bg-zinc-800/70" />
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-zinc-800" />
          <div className="w-8 h-8 rounded-xl bg-zinc-800" />
        </div>
      </div>
    ))}
  </div>
);

