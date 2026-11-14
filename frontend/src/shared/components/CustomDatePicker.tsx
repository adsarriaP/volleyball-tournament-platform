import React, { useEffect, useRef, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface CustomDatePickerProps {
  label?: string;
  value: string; // YYYY-MM-DD
  onChange: (newDate: string) => void;
  placeholder?: string;
}

const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const DAY_LABELS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];

function parseDateString(str: string): Date {
  if (!str) return new Date();
  const [y, m, d] = str.split('-').map(Number);
  if (!y || !m || !d) return new Date();
  return new Date(y, m - 1, d);
}

function formatYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  label,
  value,
  onChange,
  placeholder = 'Seleccionar fecha...',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedDate = parseDateString(value);
  const [viewYear, setViewYear] = useState(selectedDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(selectedDate.getMonth());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const d = parseDateString(value);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
  // Convertir domingo (0) a 6, lunes (1) a 0
  const startOffset = (firstDayOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const picked = new Date(viewYear, viewMonth, day);
    onChange(formatYMD(picked));
    setIsOpen(false);
  };

  const todayYMD = formatYMD(new Date());

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">
          {label}
        </label>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-yellow-400 text-xs text-white font-bold transition shadow-inner"
      >
        <span className="truncate">
          {value
            ? parseDateString(value).toLocaleDateString('es-ES', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })
            : placeholder}
        </span>
        <Calendar className="w-4 h-4 text-yellow-400 shrink-0" />
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 sm:static sm:inset-auto sm:block sm:bg-transparent sm:backdrop-blur-none sm:p-0"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsOpen(false);
            }
          }}
        >
          <div className="w-full max-w-[320px] sm:w-72 sm:absolute sm:left-0 sm:mt-2 sm:z-50 rounded-2xl border border-zinc-700 bg-zinc-900 p-4 shadow-2xl space-y-3">
            {label && (
              <div className="sm:hidden text-[11px] font-black uppercase tracking-wider text-yellow-400 text-center pb-1 border-b border-zinc-800">
                {label}
              </div>
            )}
          {/* Navegación de Mes y Año */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-zinc-200 border border-zinc-800"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="text-xs font-black text-white uppercase tracking-wider">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </div>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-zinc-200 border border-zinc-800"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Cabecera de días de la semana */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {DAY_LABELS.map((d) => (
              <span
                key={d}
                className="text-[10px] font-black uppercase text-zinc-400 py-1"
              >
                {d}
              </span>
            ))}
          </div>

          {/* Días del Mes */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: startOffset }).map((_, idx) => (
              <div key={`empty-${idx}`} className="h-8" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const cellYMD = formatYMD(new Date(viewYear, viewMonth, dayNum));
              const isSelected = cellYMD === value;
              const isToday = cellYMD === todayYMD;

              return (
                <button
                  key={dayNum}
                  type="button"
                  onClick={() => handleSelectDay(dayNum)}
                  className={`h-8 rounded-lg text-xs font-bold transition flex items-center justify-center ${
                    isSelected
                      ? 'bg-yellow-400 text-zinc-950 font-black shadow-md shadow-yellow-400/20'
                      : isToday
                        ? 'bg-zinc-800 text-yellow-400 border border-yellow-400/50'
                        : 'text-zinc-200 hover:bg-zinc-800'
                  }`}
                >
                  {dayNum}
                </button>
              );
            })}
          </div>

          {/* Botones Rápidos */}
          <div className="flex items-center justify-between pt-2 border-t border-zinc-800 text-[11px]">
            <button
              type="button"
              onClick={() => {
                onChange(todayYMD);
                setIsOpen(false);
              }}
              className="font-black text-yellow-400 hover:underline"
            >
              Hoy
            </button>
            <button
              type="button"
              onClick={() => {
                const plus7 = new Date();
                plus7.setDate(plus7.getDate() + 7);
                onChange(formatYMD(plus7));
                setIsOpen(false);
              }}
              className="font-bold text-zinc-300 hover:text-white"
            >
              +7 días
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-zinc-400 hover:text-white"
            >
              Cerrar
            </button>
          </div>
          </div>
        </div>
      )}
    </div>
  );
};

