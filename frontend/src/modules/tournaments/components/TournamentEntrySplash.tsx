import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CircleDot as Volleyball, ShieldCheck, Trophy, X } from 'lucide-react';
import { useAuthStore } from '../../../shared/store/useAuthStore';

const SLIDES = [
  {
    badge: 'VoleiScore • Torneos en Vivo',
    title: '¡Crea y sigue tus torneos de voleibol en tiempo real!',
    subtitle:
      'Marcadores punto a punto, rotaciones 1 a 6, tablas de posiciones y programación automática en un solo lugar.',
  },
  {
    badge: 'Planilla Digital Oficial',
    title: 'Control total para jueces, delegados y aficionados.',
    subtitle:
      'Consulta canchas en Google Maps, horarios diarios y resultados al instante desde tu celular o computador.',
  },
];

interface TournamentEntrySplashProps {
  onEnter: () => void;
}

export const TournamentEntrySplash: React.FC<TournamentEntrySplashProps> = ({
  onEnter,
}) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % SLIDES.length);
    }, 5500);
    return () => window.clearInterval(timer);
  }, []);

  const current = SLIDES[activeSlide];

  const handleSecondaryAction = () => {
    onEnter();
    if (user?.role === 'ADMIN') {
      navigate('/admin');
    } else if (user?.role === 'REFEREE') {
      navigate('/referee/matches');
    } else {
      navigate('/login');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-zinc-950 text-white overflow-hidden flex flex-col justify-between select-none"
      role="dialog"
      aria-modal="true"
      aria-label="Bienvenida a VoleiScore Torneos"
    >
      {/* Fondo responsivo: Móvil (vertical) vs Web (horizontal) */}
      <picture className="absolute inset-0 w-full h-full pointer-events-none">
        <source media="(min-width: 768px)" srcSet="/assets/entry-web.jpg" />
        <img
          src="/assets/entry-mobile.jpg"
          alt="Torneos de Voleibol VoleiScore"
          className="w-full h-full object-cover object-center"
        />
      </picture>

      {/* Gradientes de contraste estilo Spotify / Banco de Occidente */}
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-zinc-950/30 md:bg-gradient-to-r md:from-zinc-950/95 md:via-zinc-950/65 md:to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent md:hidden pointer-events-none" />

      {/* Barra superior: Indicadores tipo Story + Marca + Saltar */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 space-y-4">
        {/* Barras de progreso estilo Story */}
        <div className="grid grid-cols-2 gap-2 max-w-md mx-auto md:mx-0">
          {SLIDES.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveSlide(idx)}
              aria-label={`Diapositiva ${idx + 1}`}
              className="h-1 rounded-full bg-white/25 overflow-hidden cursor-pointer"
            >
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  idx <= activeSlide ? 'w-full bg-yellow-400' : 'w-0 bg-white'
                }`}
              />
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-zinc-950/60 backdrop-blur-md border border-white/10">
            <div className="w-7 h-7 rounded-lg bg-yellow-400 flex items-center justify-center text-zinc-950">
              <Volleyball className="w-4 h-4 stroke-[2.5]" />
            </div>
            <span className="font-black text-sm tracking-tight text-white">
              VOLEI<span className="text-yellow-400">SCORE</span>
            </span>
          </div>

          <button
            type="button"
            onClick={onEnter}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-zinc-950/60 hover:bg-zinc-900 backdrop-blur-md border border-white/15 text-xs font-bold text-zinc-200 transition cursor-pointer"
          >
            <span>Saltar</span>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Contenido inferior izquierdo + Botones de acción */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-5 sm:px-8 pb-8 sm:pb-14">
        <div className="max-w-xl space-y-4 sm:space-y-5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-yellow-400 text-zinc-950 uppercase tracking-wider shadow-lg">
            <Trophy className="w-3.5 h-3.5" />
            {current.badge}
          </span>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-[1.08] text-white drop-shadow-md">
            {current.title}
          </h1>

          <p className="text-sm sm:text-base text-zinc-200 leading-relaxed max-w-lg">
            {current.subtitle}
          </p>

          <div className="pt-2 flex flex-col gap-3 max-w-md">
            <button
              type="button"
              onClick={onEnter}
              className="w-full py-3.5 px-6 rounded-xl bg-yellow-400 hover:bg-yellow-300 active:scale-[0.99] text-zinc-950 font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-xl shadow-yellow-400/20 transition cursor-pointer"
            >
              <span>Explorar Torneos en Vivo</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>

            <button
              type="button"
              onClick={handleSecondaryAction}
              className="w-full py-3.5 px-6 rounded-xl bg-white/10 hover:bg-white/20 active:scale-[0.99] backdrop-blur-md border border-white/35 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-yellow-400" />
              <span>
                {user
                  ? user.role === 'ADMIN'
                    ? 'Ir al Panel de Administrador'
                    : 'Ir a mi Planilla de Juez'
                  : 'Soy Juez o Administrador'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
