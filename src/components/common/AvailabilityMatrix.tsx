import React from 'react';
import { Check, X, CheckSquare, Square } from 'lucide-react';
import { AppSettings, DayOfWeek, DAY_NAMES } from '../../types/schedule';
import { cn } from '../../utils/cn';

interface AvailabilityMatrixProps {
  availability: Record<string, boolean>;
  onChange: (newAvailability: Record<string, boolean>) => void;
  settings: AppSettings;
  activeLabel?: string;
  inactiveLabel?: string;
  readOnly?: boolean;
}

export const AvailabilityMatrix: React.FC<AvailabilityMatrixProps> = ({
  availability,
  onChange,
  settings,
  activeLabel = 'Հարմար / Ազատ',
  inactiveLabel = 'Անհարմար / Զբաղված',
  readOnly = false,
}) => {
  const { activeDays, periods } = settings;

  // Toggle single cell
  const handleToggleCell = (day: DayOfWeek, periodNum: number) => {
    if (readOnly) return;
    const key = `${day}-${periodNum}`;
    const current = availability[key] ?? true;
    onChange({
      ...availability,
      [key]: !current,
    });
  };

  // Toggle whole column (day)
  const handleToggleDay = (day: DayOfWeek) => {
    if (readOnly) return;
    // If all are true -> make all false. Else make all true.
    const allActive = periods.every((p) => availability[`${day}-${p.number}`] ?? true);
    const updated = { ...availability };
    periods.forEach((p) => {
      updated[`${day}-${p.number}`] = !allActive;
    });
    onChange(updated);
  };

  // Toggle whole row (period)
  const handleTogglePeriod = (periodNum: number) => {
    if (readOnly) return;
    const allActive = activeDays.every((d) => availability[`${d}-${periodNum}`] ?? true);
    const updated = { ...availability };
    activeDays.forEach((d) => {
      updated[`${d}-${periodNum}`] = !allActive;
    });
    onChange(updated);
  };

  // Select all
  const handleSelectAll = () => {
    if (readOnly) return;
    const updated = { ...availability };
    activeDays.forEach((d) => {
      periods.forEach((p) => {
        updated[`${d}-${p.number}`] = true;
      });
    });
    onChange(updated);
  };

  // Clear all
  const handleClearAll = () => {
    if (readOnly) return;
    const updated = { ...availability };
    activeDays.forEach((d) => {
      periods.forEach((p) => {
        updated[`${d}-${p.number}`] = false;
      });
    });
    onChange(updated);
  };

  // Calculate statistics
  let totalSlots = 0;
  let activeSlots = 0;
  activeDays.forEach((d) => {
    periods.forEach((p) => {
      totalSlots++;
      if (availability[`${d}-${p.number}`] ?? true) {
        activeSlots++;
      }
    });
  });

  return (
    <div className="space-y-3">
      {/* Action Header & Legend */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-medium text-slate-700">
            <span className="inline-block w-3 h-3 rounded bg-emerald-500 shadow-sm" />
            <span>{activeLabel}</span>
          </div>
          <div className="flex items-center gap-1.5 font-medium text-slate-400">
            <span className="inline-block w-3 h-3 rounded bg-slate-200 border border-slate-300" />
            <span>{inactiveLabel}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-mono">
            {activeSlots} / {totalSlots} ժամ ({Math.round((activeSlots / (totalSlots || 1)) * 100)}%)
          </span>
          {!readOnly && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleSelectAll}
                className="px-2 py-1 rounded-md text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors flex items-center gap-1"
                title="Նշել բոլորը"
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>Բոլորը</span>
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                className="px-2 py-1 rounded-md text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center gap-1"
                title="Մաքրել բոլորը"
              >
                <Square className="w-3.5 h-3.5" />
                <span>Մաքրել</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Grid Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-xs text-center border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-700 font-medium">
              <th className="py-2.5 px-3 text-left w-24 border-r border-slate-200">
                <span className="text-slate-400 font-normal">Ժամ / Օր</span>
              </th>
              {activeDays.map((day) => (
                <th
                  key={day}
                  onClick={() => handleToggleDay(day)}
                  className={cn(
                    'py-2 px-2 border-r last:border-r-0 border-slate-200 select-none transition-colors group',
                    !readOnly && 'cursor-pointer hover:bg-indigo-50/50'
                  )}
                  title={!readOnly ? `Սեղմեք ${DAY_NAMES[day].full} օրվա բոլոր ժամերը փոխելու համար` : undefined}
                >
                  <div className="font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">
                    {DAY_NAMES[day].short}
                  </div>
                  <div className="text-[10px] text-slate-400 font-normal hidden sm:block">
                    {DAY_NAMES[day].full}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {periods.map((period) => (
              <tr
                key={period.number}
                className="border-b last:border-b-0 border-slate-100 hover:bg-slate-50/40 transition-colors"
              >
                {/* Period row header */}
                <td
                  onClick={() => handleTogglePeriod(period.number)}
                  className={cn(
                    'py-2 px-3 text-left font-medium border-r border-slate-200 select-none group',
                    !readOnly && 'cursor-pointer hover:bg-indigo-50/50'
                  )}
                  title={!readOnly ? `Սեղմեք բոլոր օրերին ${period.number}-րդ ժամը փոխելու համար` : undefined}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800 group-hover:text-indigo-600">
                      {period.number}-ին
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {period.startTime}
                    </span>
                  </div>
                </td>

                {/* Day cells */}
                {activeDays.map((day) => {
                  const key = `${day}-${period.number}`;
                  const isAvailable = availability[key] ?? true;

                  return (
                    <td
                      key={day}
                      onClick={() => handleToggleCell(day, period.number)}
                      className="p-1 border-r last:border-r-0 border-slate-100"
                    >
                      <button
                        type="button"
                        disabled={readOnly}
                        className={cn(
                          'w-full py-2 px-1 rounded-lg font-medium transition-all duration-150 flex items-center justify-center gap-1 select-none',
                          isAvailable
                            ? 'bg-emerald-500 text-white shadow-sm hover:bg-emerald-600 active:scale-95'
                            : 'bg-slate-100 text-slate-400 hover:bg-slate-200 active:scale-95 line-through opacity-75'
                        )}
                      >
                        {isAvailable ? (
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        ) : (
                          <X className="w-3.5 h-3.5 stroke-[2]" />
                        )}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-[11px] text-slate-400 italic">
        * Հուշում. Սեղմեք օրվա վերնագրին կամ դասաժամի համարին՝ ամբողջ սյունակը կամ տողը միանգամից փոխելու համար։
      </p>
    </div>
  );
};
