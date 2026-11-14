import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  MapPin,
  Play,
  Radio,
  Trophy,
  UserPlus,
  Users,
  Zap,
} from 'lucide-react';
import { AdminSidebarLayout } from '../components/AdminSidebarLayout';

interface GuideStep {
  step: number;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  to: string;
  ctaLabel: string;
  details: string[];
  tip: string;
}

const ADMIN_FLOW_STEPS: GuideStep[] = [
  {
    step: 1,
    title: 'Crear el Torneo (o Partido de Fogueo)',
    subtitle: 'Define formato, cupo de equipos, sets y fechas.',
    icon: Trophy,
    to: '/admin/tournaments',
    ctaLabel: 'Ir a Torneos',
    details: [
      'Ingresa a "Torneos y Configuración" desde el menú lateral o el Dashboard.',
      'Elige el formato: Liga (Todos contra todos), Eliminación Directa, o Grupos + Eliminatoria.',
      'Si solo vas a jugar 1 partido amistoso/fogueo, usa el botón "⚡ Preconfigurar Partido de Fogueo" (2 equipos · 1 partido).',
      'Configura los puntos por set (ej. 25 regular / 15 decisivo) y las fechas de inicio y fin.',
    ],
    tip: 'Si configuras más grupos de los que permiten tus equipos, el sistema ajusta automáticamente a Grupo Único para evitar cruces vacíos.',
  },
  {
    step: 2,
    title: 'Inscribir Equipos y Escudos',
    subtitle: 'Registra los clubes participantes y su delegado.',
    icon: Users,
    to: '/admin/teams',
    ctaLabel: 'Ir a Equipos',
    details: [
      'Abre el módulo "Equipos" y selecciona el torneo en el filtro superior.',
      'Registra cada equipo con su nombre, delegado y escudo (se sube directo a la nube en Cloudflare R2).',
      'Puedes editar el nombre, delegado o escudo en cualquier momento o eliminar un equipo con confirmación.',
    ],
    tip: 'Necesitas al menos 2 equipos inscritos en el torneo para poder iniciarlo y generar cruces.',
  },
  {
    step: 3,
    title: 'Crear Cuentas de Jueces (Árbitros)',
    subtitle: 'Habilita a los jueces que llevarán la planilla en vivo.',
    icon: UserPlus,
    to: '/admin/referees',
    ctaLabel: 'Ir a Jueces',
    details: [
      'En el módulo "Jueces", crea la cuenta con nombre, correo y contraseña para cada árbitro.',
      'El juez iniciará sesión con esas credenciales y verá únicamente los partidos que le asignes.',
      'Puedes editar sus datos, cambiar su contraseña o eliminar la cuenta cuando lo necesites.',
    ],
    tip: 'Comparte el correo y contraseña con tu juez para que entre desde su celular o tablet como PWA.',
  },
  {
    step: 4,
    title: 'Iniciar Torneo y Programar Partidos',
    subtitle: 'Genera los cruces, asigna fecha, cancha, Google Maps y juez.',
    icon: Calendar,
    to: '/admin',
    ctaLabel: 'Ir al Dashboard',
    details: [
      'En el Dashboard Principal, ubica tu torneo y haz clic en "Iniciar Torneo" para generar los partidos automáticamente.',
      'Despliega el acordeón "Partidos Programados" haciendo clic en la barra del torneo.',
      'En cada partido asigna: Fecha/Hora, Cancha, Link de Google Maps y Juez, y presiona "Guardar".',
    ],
    tip: 'Cuando agregas Cancha y Link de Google Maps, tanto los equipos en la vista pública como el juez en su panel verán el botón "📍 Ver en Google Maps".',
  },
  {
    step: 5,
    title: 'Seguimiento en Vivo, Correcciones y Fase Final',
    subtitle: 'Controla el torneo mientras se juegan los partidos.',
    icon: Radio,
    to: '/admin',
    ctaLabel: 'Ver Marcadores',
    details: [
      'El juez anota puntos y rotaciones en tiempo real; los espectadores lo ven en vivo sin recargar la página.',
      'Si hubo un error de mesa, en el Dashboard puedes abrir "Editar Resultado" en cualquier partido para corregir sets o ganador.',
      'En torneos con Grupos + Eliminatoria, al terminar la fase regular usa "Generar Llaves Fase Final" para crear semifinales/final.',
    ],
    tip: 'Todas las acciones muestran un indicador de carga y un pop-up (toast) arriba a la derecha confirmando si se guardó o si hubo algún error.',
  },
  {
    step: 6,
    title: 'Finalizar Torneo',
    subtitle: 'Cierra oficialmente la competencia manteniendo el historial visible.',
    icon: CheckCircle2,
    to: '/admin',
    ctaLabel: 'Gestionar Cierre',
    details: [
      'Cuando todos los partidos hayan concluido, haz clic en "Finalizar Torneo" (en el Dashboard o en Torneos) y confirma en el modal.',
      'El torneo cambiará a estado FINALIZADO, pero seguirá visible en "Torneos Activos" para que todos consulten resultados y posiciones.',
    ],
    tip: 'Si necesitas eliminar un torneo de prueba por completo, usa el botón "Eliminar" en el módulo de Torneos.',
  },
];

const FAQ_ITEMS = [
  {
    q: '¿Cómo hago un solo partido de fogueo?',
    a: 'En Torneos, haz clic en "⚡ Preconfigurar Partido de Fogueo", ponle nombre y créalo. Luego registra 2 equipos en Equipos, ve al Dashboard, presiona "Iniciar Torneo" y se creará 1 único partido listo para programar y arbitrar.',
  },
  {
    q: '¿Dónde ven los jugadores y el juez la ubicación de Google Maps?',
    a: 'Al guardar el enlace en el campo "Link Google Maps" del partido en el Dashboard, aparecerá automáticamente el botón "📍 Ver en Google Maps" en la ficha pública del torneo, en el banner en vivo y en "Mis Partidos" del juez.',
  },
  {
    q: '¿Cómo sé si un cambio se guardó o falló?',
    a: 'Cada botón muestra un ícono de carga mientras procesa y al terminar verás una notificación flotante (pop-up) verde si fue exitoso o roja con el detalle si ocurrió un error.',
  },
  {
    q: '¿Los torneos finalizados desaparecen para el público?',
    a: 'No. Al finalizar un torneo pasa a estado FINALIZADO y sigue visible en Torneos Activos con su insignia correspondiente y filtro para consultar tabla y marcadores.',
  },
];

export const AdminHelpPage: React.FC = () => {
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);

  return (
    <AdminSidebarLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
        {/* Cabecera */}
        <header className="rounded-3xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 p-6 sm:p-8 shadow-2xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-yellow-400 text-zinc-950">
              <BookOpen className="w-3.5 h-3.5" />
              Manual del Administrador
            </span>
            <Link
              to="/admin"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black bg-zinc-950 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 transition"
            >
              Volver al Dashboard
              <ArrowRight className="w-3.5 h-3.5 text-yellow-400" />
            </Link>
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              Guía Completa de Administración
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-2xl leading-relaxed">
              Sigue estos 6 pasos en orden para gestionar cualquier torneo o partido de fogueo desde su creación hasta el cierre oficial.
            </p>
          </div>
        </header>

        {/* Flujo de 6 Pasos */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-yellow-400">
            <Play className="w-4 h-4 fill-current" />
            Flujo Recomendado Paso a Paso
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ADMIN_FLOW_STEPS.map((item) => {
              const Icon = item.icon;
              return (
                <article
                  key={item.step}
                  className="rounded-3xl border border-zinc-800 bg-zinc-900/90 p-5 sm:p-6 flex flex-col justify-between gap-4 shadow-xl hover:border-zinc-700 transition"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-yellow-400 text-zinc-950 flex items-center justify-center font-black text-base shrink-0 shadow-lg shadow-yellow-400/20">
                          {item.step}
                        </div>
                        <div>
                          <h2 className="text-base font-black text-white leading-tight">
                            {item.title}
                          </h2>
                          <p className="text-xs text-zinc-400 mt-0.5">
                            {item.subtitle}
                          </p>
                        </div>
                      </div>
                      <div className="w-8 h-8 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-yellow-400 shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                    </div>

                    <ul className="space-y-1.5 text-xs text-zinc-300 leading-relaxed pl-1">
                      {item.details.map((detail, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-yellow-400 font-black mt-0.5">•</span>
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="rounded-2xl bg-zinc-950 border border-zinc-800/90 px-3.5 py-2.5 text-[11px] text-zinc-300 flex items-start gap-2">
                      <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-amber-300">Tip:</strong> {item.tip}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-zinc-800/80 flex justify-end">
                    <Link
                      to={item.to}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black bg-yellow-400 hover:bg-yellow-300 text-zinc-950 transition"
                    >
                      {item.ctaLabel}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* Preguntas Frecuentes */}
        <section className="rounded-3xl border border-zinc-800 bg-zinc-900/90 p-5 sm:p-6 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-yellow-400">
            <HelpCircle className="w-4 h-4" />
            Preguntas Frecuentes
          </div>

          <div className="space-y-2.5">
            {FAQ_ITEMS.map((faq, idx) => {
              const isOpen = openFaqIdx === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-zinc-800 bg-zinc-950/90 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-zinc-900/60 transition"
                  >
                    <span className="text-xs sm:text-sm font-black text-white flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                      {faq.q}
                    </span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-zinc-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 text-xs text-zinc-300 leading-relaxed border-t border-zinc-800/60">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </AdminSidebarLayout>
  );
};

