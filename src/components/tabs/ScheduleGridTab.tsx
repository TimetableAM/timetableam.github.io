import React, { useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { useScheduleStore } from '../../store/useScheduleStore';
import {
  DayOfWeek,
  DAY_NAMES,
  ScheduleEntry,
  SchoolClass,
  Subject,
  Teacher,
} from '../../types/schedule';
import { validateSchedule } from '../../utils/scheduler';
import { exportScheduleToExcel } from '../../utils/excelExport';
import { EditSlotModal } from '../modals/EditSlotModal';
import {
  Sparkles,
  Trash2,
  Lock,
  Unlock,
  AlertTriangle,
  Clock,
  DoorOpen,
  Users,
  GraduationCap,
  Info,
  ChevronDown,
  Layers,
  X,
  Plus,
  FileSpreadsheet,
  Loader2,
} from 'lucide-react';

export const ScheduleGridTab: React.FC = () => {
  const {
    settings,
    classes,
    teachers,
    subjects,
    entries,
    unplacedLessons,
    viewMode,
    selectedClassId,
    selectedTeacherId,
    setViewMode,
    setSelectedClassId,
    setSelectedTeacherId,
    addOrUpdateEntry,
    deleteEntry,
    toggleLockEntry,
    moveEntry,
    clearSchedule,
    generateScheduleAuto,
    placeUnplacedLesson,
  } = useScheduleStore();

  // Active selections
  const currentClassId = selectedClassId || classes[0]?.id || '';
  const currentTeacherId = selectedTeacherId || teachers[0]?.id || '';

  // Slot Edit Modal state
  const [editingSlot, setEditingSlot] = useState<{
    day: DayOfWeek;
    period: number;
    classId: string;
    entry: ScheduleEntry | null;
  } | null>(null);

  // Drag and Drop state
  const [draggedEntryId, setDraggedEntryId] = useState<string | null>(null);
  const [draggedUnplacedId, setDraggedUnplacedId] = useState<string | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<string | null>(null);

  // Unplaced panel toggle
  const [showUnplacedPanel, setShowUnplacedPanel] = useState(false);

  // Generator dropdown / modal state
  const [showGenOptions, setShowGenOptions] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  // Fast lookups
  const subjectMap = useMemo(() => new Map(subjects.map((s) => [s.id, s])), [subjects]);
  const teacherMap = useMemo(() => new Map(teachers.map((t) => [t.id, t])), [teachers]);
  const classMap = useMemo(() => new Map(classes.map((c) => [c.id, c])), [classes]);

  // Live validate conflicts
  const conflictsMap = useMemo(
    () => validateSchedule(entries, classes, teachers, subjects, settings),
    [entries, classes, teachers, subjects, settings]
  );

  // Total curriculum hours across all classes
  const totalCurriculumHours = useMemo(() => {
    return classes.reduce(
      (sum, c) => sum + c.curriculum.reduce((s2, cur) => s2 + cur.hoursPerWeek, 0),
      0
    );
  }, [classes]);

  // Handle generation
  const handleGenerate = (keepLockedOnly: boolean) => {
    setShowGenOptions(false);
    const report = generateScheduleAuto(keepLockedOnly);
    if (report.unplacedLessons.length === 0) {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
    } else {
      setShowUnplacedPanel(true);
    }
  };

  const handleExportExcel = async () => {
    try {
      setIsExportingExcel(true);
      await exportScheduleToExcel({
        settings,
        classes,
        teachers,
        subjects,
        entries,
      });
      confetti({
        particleCount: 70,
        spread: 50,
        origin: { y: 0.6 },
      });
    } catch (e) {
      console.error(e);
      alert('Չհաջողվեց արտահանել Excel ֆայլը');
    } finally {
      setIsExportingExcel(false);
    }
  };

  // Drag events for grid entries
  const handleDragStart = (e: React.DragEvent, entryId: string) => {
    e.dataTransfer.setData('text/plain', entryId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedEntryId(entryId);
  };

  // Drag events for unplaced lessons
  const handleUnplacedDragStart = (e: React.DragEvent, unplacedId: string) => {
    e.dataTransfer.setData('application/unplaced-id', unplacedId);
    e.dataTransfer.effectAllowed = 'copy';
    setDraggedUnplacedId(unplacedId);
  };

  const handleDragOver = (e: React.DragEvent, slotKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverSlot !== slotKey) {
      setDragOverSlot(slotKey);
    }
  };

  const handleDragLeave = () => {
    setDragOverSlot(null);
  };

  const handleDrop = (
    e: React.DragEvent,
    targetDay: DayOfWeek,
    targetPeriod: number,
    targetClassId: string
  ) => {
    e.preventDefault();
    setDragOverSlot(null);

    // If dropping an unplaced lesson
    const unplacedId = e.dataTransfer.getData('application/unplaced-id') || draggedUnplacedId;
    if (unplacedId) {
      placeUnplacedLesson(unplacedId, targetDay, targetPeriod);
      setDraggedUnplacedId(null);
      return;
    }

    // If dropping a grid lesson
    const sourceEntryId = e.dataTransfer.getData('text/plain') || draggedEntryId;
    if (sourceEntryId) {
      moveEntry(sourceEntryId, targetDay, targetPeriod, targetClassId);
      setDraggedEntryId(null);
    }
  };

  // Click on cell to open edit modal
  const handleCellClick = (
    day: DayOfWeek,
    period: number,
    targetClassId: string,
    existingEntry?: ScheduleEntry
  ) => {
    setEditingSlot({
      day,
      period,
      classId: targetClassId,
      entry: existingEntry || null,
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Actions Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        {/* View mode switcher */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setViewMode('by_class')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                viewMode === 'by_class'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Ըստ դասարանների</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('by_teacher')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                viewMode === 'by_teacher'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Ըստ ուսուցիչների</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('overview')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                viewMode === 'overview'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Ամփոփ աղյուսակ</span>
            </button>
          </div>

          {/* Selector for Class or Teacher based on viewMode */}
          {viewMode === 'by_class' && (
            <div className="flex items-center gap-1.5">
              <select
                value={currentClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    Դասարան՝ {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {viewMode === 'by_teacher' && (
            <div className="flex items-center gap-1.5">
              <select
                value={currentTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    Ուսուցիչ՝ {t.fullName}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Generator and Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Generator dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowGenOptions(!showGenOptions)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-200 transition-all active:scale-95 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>⚡ Գեներացնել դասացուցակ</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-80" />
            </button>

            {showGenOptions && (
              <div className="absolute right-0 mt-1.5 w-64 bg-white rounded-xl shadow-xl border border-slate-100 p-1.5 z-30">
                <button
                  type="button"
                  onClick={() => handleGenerate(false)}
                  className="w-full text-left p-2.5 rounded-lg text-xs hover:bg-slate-50 transition-colors flex flex-col gap-0.5"
                >
                  <span className="font-semibold text-slate-800">Վերակազմել ամբողջը</span>
                  <span className="text-[11px] text-slate-400">
                    Ջնջում է չամրագրված դասերը և կազմում նորից
                  </span>
                </button>
                <div className="my-1 border-t border-slate-100" />
                <button
                  type="button"
                  onClick={() => handleGenerate(true)}
                  className="w-full text-left p-2.5 rounded-lg text-xs hover:bg-slate-50 transition-colors flex flex-col gap-0.5"
                >
                  <span className="font-semibold text-indigo-600">
                    Լրացնել միայն դատարկները 🔒
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Պահպանում է բոլոր ամրագրված (կողպված) դասերը
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Export to Excel */}
          <button
            type="button"
            disabled={isExportingExcel}
            onClick={handleExportExcel}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all flex items-center gap-1.5 shadow-2xs active:scale-95 disabled:opacity-50"
            title="Արտահանել ամբողջ դասացուցակը Excel (.xlsx) ֆայլով"
          >
            {isExportingExcel ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            )}
            <span className="hidden sm:inline">Excel (.xlsx)</span>
          </button>

          {/* Clear Schedule */}
          <button
            type="button"
            onClick={() => {
              if (
                window.confirm(
                  'Մաքրե՞լ դասացուցակը (բացի կողպված 🔒 դասերից)։'
                )
              ) {
                clearSchedule(true);
              }
            }}
            className="px-3 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors flex items-center gap-1.5"
            title="Մաքրել դասացուցակը"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Մաքրել</span>
          </button>
        </div>
      </div>

      {/* Status Bar / Statistics Banner */}
      <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-medium text-slate-600">
              Տեղադրված է՝{' '}
              <strong className="text-slate-900 font-bold">
                {entries.length} / {totalCurriculumHours}
              </strong>{' '}
              դաս
            </span>
          </div>

          {conflictsMap.size > 0 && (
            <div className="flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg font-semibold border border-amber-200">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>Բախումներ՝ {conflictsMap.size}</span>
            </div>
          )}
        </div>

        {/* Unplaced lessons notification button */}
        {unplacedLessons.length > 0 && (
          <button
            type="button"
            onClick={() => setShowUnplacedPanel(!showUnplacedPanel)}
            className="px-3 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 font-semibold hover:bg-rose-100 transition-colors flex items-center gap-1.5"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Չտեղադրված դասեր ({unplacedLessons.length})</span>
          </button>
        )}
      </div>

      {/* Unplaced Lessons Drawer / Panel */}
      {showUnplacedPanel && unplacedLessons.length > 0 && (
        <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-800 font-semibold text-xs">
              <Info className="w-4 h-4 text-amber-600" />
              <span>
                Ուսումնական պլանից չտեղադրված դասեր (տեղափոխեք դասացուցակի մեջ քաշելով կամ սեղմելով)
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowUnplacedPanel(false)}
              className="text-amber-600 hover:text-amber-800 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {unplacedLessons.map((item) => {
              const sub = subjectMap.get(item.subjectId);
              const cls = classMap.get(item.classId);
              const teacherNames = item.teacherIds
                .map((tId) => teacherMap.get(tId)?.fullName)
                .filter(Boolean)
                .join(' / ');

              return (
                <div
                  key={item.id}
                  draggable
                  onDragStart={(e) => handleUnplacedDragStart(e, item.id)}
                  className="p-2.5 bg-white rounded-xl border border-amber-200 shadow-xs flex items-center justify-between gap-2 cursor-grab active:cursor-grabbing hover:border-amber-400 transition-colors"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span
                      className="w-2.5 h-8 rounded-full flex-shrink-0"
                      style={{ backgroundColor: sub?.color || '#cbd5e1' }}
                    />
                    <div className="overflow-hidden">
                      <div className="font-bold text-xs text-slate-800 truncate">
                        {cls?.name} • {sub?.name}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">
                        {teacherNames || 'Ուսուցիչ ընտրված չէ'}
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 flex-shrink-0">
                    Քաշել
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Timetable Matrix View */}
      {viewMode === 'by_class' && (
        <ClassGridView
          activeClass={classMap.get(currentClassId)}
          settings={settings}
          entries={entries.filter((e) => e.classId === currentClassId)}
          subjectMap={subjectMap}
          teacherMap={teacherMap}
          conflictsMap={conflictsMap}
          dragOverSlot={dragOverSlot}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onCellClick={handleCellClick}
          onToggleLock={toggleLockEntry}
          onDeleteEntry={deleteEntry}
        />
      )}

      {viewMode === 'by_teacher' && (
        <TeacherGridView
          activeTeacher={teacherMap.get(currentTeacherId)}
          settings={settings}
          entries={entries.filter((e) => e.teacherIds.includes(currentTeacherId))}
          classMap={classMap}
          subjectMap={subjectMap}
          conflictsMap={conflictsMap}
          onDragStart={handleDragStart}
          onCellClick={handleCellClick}
        />
      )}

      {viewMode === 'overview' && (
        <OverviewGridView
          classes={classes}
          settings={settings}
          entries={entries}
          subjectMap={subjectMap}
          teacherMap={teacherMap}
          conflictsMap={conflictsMap}
          dragOverSlot={dragOverSlot}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onCellClick={handleCellClick}
        />
      )}

      {/* Slot Edit Modal */}
      {editingSlot && (
        <EditSlotModal
          isOpen={true}
          onClose={() => setEditingSlot(null)}
          day={editingSlot.day}
          period={editingSlot.period}
          classId={editingSlot.classId}
          entry={editingSlot.entry}
          classes={classes}
          subjects={subjects}
          teachers={teachers}
          onSave={addOrUpdateEntry}
          onDelete={deleteEntry}
        />
      )}
    </div>
  );
};

/* -------------------------------------------------------------
   SUB-COMPONENT: Class Schedule Grid View (Standard Timetable)
   ------------------------------------------------------------- */
interface ClassGridViewProps {
  activeClass?: SchoolClass;
  settings: any;
  entries: ScheduleEntry[];
  subjectMap: Map<string, Subject>;
  teacherMap: Map<string, Teacher>;
  conflictsMap: Map<string, any[]>;
  dragOverSlot: string | null;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragOver: (e: React.DragEvent, slotKey: string) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, day: DayOfWeek, period: number, classId: string) => void;
  onCellClick: (day: DayOfWeek, period: number, classId: string, entry?: ScheduleEntry) => void;
  onToggleLock: (id: string) => void;
  onDeleteEntry: (id: string) => void;
}

const ClassGridView: React.FC<ClassGridViewProps> = ({
  activeClass,
  settings,
  entries,
  subjectMap,
  teacherMap,
  conflictsMap,
  dragOverSlot,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onCellClick,
  onToggleLock,
  onDeleteEntry,
}) => {
  if (!activeClass) {
    return (
      <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
        Դասարան ընտրված չէ
      </div>
    );
  }

  const { activeDays, periods } = settings;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden print-full-width">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-700 text-xs font-semibold">
              <th className="py-3 px-4 w-28 border-r border-slate-200">
                <span>Դասաժամ</span>
              </th>
              {activeDays.map((day: DayOfWeek) => (
                <th
                  key={day}
                  className="py-3 px-3 border-r last:border-r-0 border-slate-200 min-w-[170px]"
                >
                  <div className="font-bold text-slate-800">{DAY_NAMES[day].full}</div>
                  <div className="text-[10px] text-slate-400 font-normal">
                    {DAY_NAMES[day].short}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {periods.map((period: any) => (
              <tr
                key={period.number}
                className="border-b last:border-b-0 border-slate-100 hover:bg-slate-50/20"
              >
                {/* Period time slot column */}
                <td className="py-3 px-4 border-r border-slate-200 align-top bg-slate-50/40">
                  <div className="font-bold text-sm text-slate-800">{period.number}-ին դաս</div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                    {period.startTime} - {period.endTime}
                  </div>
                </td>

                {/* Day columns */}
                {activeDays.map((day: DayOfWeek) => {
                  const slotKey = `${day}-${period.number}`;
                  const isDragOver = dragOverSlot === `${activeClass.id}__${slotKey}`;
                  const entry = entries.find(
                    (e) => e.day === day && e.period === period.number
                  );

                  // Class availability check
                  const isClassAvailable = activeClass.availability[slotKey] ?? true;

                  const conflicts = entry ? conflictsMap.get(entry.id) || [] : [];
                  const hasError = conflicts.some((c) => c.severity === 'error');
                  const hasWarning = conflicts.some((c) => c.severity === 'warning');

                  const sub = entry ? subjectMap.get(entry.subjectId) : null;
                  const teacherNames = entry
                    ? entry.teacherIds
                        .map((tId) => teacherMap.get(tId)?.fullName)
                        .filter(Boolean)
                        .join(' / ')
                    : '';

                  return (
                    <td
                      key={day}
                      onDragOver={(e) => onDragOver(e, `${activeClass.id}__${slotKey}`)}
                      onDragLeave={onDragLeave}
                      onDrop={(e) => onDrop(e, day, period.number, activeClass.id)}
                      onClick={() => onCellClick(day, period.number, activeClass.id, entry)}
                      className={`p-2 border-r last:border-r-0 border-slate-100 align-top min-h-[90px] transition-all cursor-pointer select-none ${
                        isDragOver
                          ? 'bg-indigo-50/80 ring-2 ring-indigo-400 ring-inset'
                          : !isClassAvailable && !entry
                          ? 'bg-slate-100/50 hover:bg-slate-100'
                          : 'hover:bg-slate-50/60'
                      }`}
                    >
                      {entry ? (
                        <div
                          draggable
                          onDragStart={(e) => onDragStart(e, entry.id)}
                          onClick={(e) => {
                            e.stopPropagation();
                            onCellClick(day, period.number, activeClass.id, entry);
                          }}
                          className={`rounded-xl p-2.5 transition-all relative overflow-hidden group shadow-2xs border ${
                            hasError
                              ? 'border-rose-400 bg-rose-50/60 shadow-rose-100'
                              : hasWarning
                              ? 'border-amber-400 bg-amber-50/60 shadow-amber-100'
                              : 'border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-xs'
                          }`}
                        >
                          {/* Subject color left border stripe */}
                          <div
                            className="absolute top-0 bottom-0 left-0 w-1.5"
                            style={{ backgroundColor: sub?.color || '#cbd5e1' }}
                          />

                          <div className="pl-1.5">
                            {/* Subject Title & Icons */}
                            <div className="flex items-start justify-between gap-1">
                              <span className="font-bold text-xs text-slate-800 line-clamp-1">
                                {sub?.name || 'Առարկա'}
                              </span>

                              <div className="flex items-center gap-1 flex-shrink-0">
                                {hasError && (
                                  <span
                                    title={conflicts
                                      .filter((c) => c.severity === 'error')
                                      .map((c) => c.message)
                                      .join('; ')}
                                    className="text-rose-600 animate-bounce"
                                  >
                                    <AlertTriangle className="w-3.5 h-3.5" />
                                  </span>
                                )}
                                {hasWarning && !hasError && (
                                  <span
                                    title={conflicts
                                      .filter((c) => c.severity === 'warning')
                                      .map((c) => c.message)
                                      .join('; ')}
                                    className="text-amber-500"
                                  >
                                    <Clock className="w-3.5 h-3.5" />
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleLock(entry.id);
                                  }}
                                  className={`p-0.5 rounded transition-colors ${
                                    entry.isLocked
                                      ? 'text-amber-600 hover:text-amber-700'
                                      : 'text-slate-300 hover:text-slate-600 opacity-0 group-hover:opacity-100'
                                  }`}
                                  title={entry.isLocked ? 'Ամրագրված է 🔒' : 'Ամրագրել 🔓'}
                                >
                                  {entry.isLocked ? (
                                    <Lock className="w-3.5 h-3.5" />
                                  ) : (
                                    <Unlock className="w-3.5 h-3.5" />
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteEntry(entry.id);
                                  }}
                                  className="p-0.5 text-slate-300 hover:text-rose-600 rounded transition-colors opacity-0 group-hover:opacity-100"
                                  title="Հեռացնել"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Teacher name */}
                            <div className="text-[11px] text-slate-500 font-medium mt-1 line-clamp-1">
                              {teacherNames || 'Ուսուցիչ չկա'}
                            </div>

                            {/* Room */}
                            {entry.room && (
                              <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                                <DoorOpen className="w-3 h-3 text-slate-400" />
                                <span>{entry.room}</span>
                              </div>
                            )}

                            {/* Conflict message tooltip/pill */}
                            {conflicts.length > 0 && (
                              <div className="mt-1.5 text-[9px] font-semibold text-rose-700 bg-rose-100/80 px-1.5 py-0.5 rounded line-clamp-2">
                                {conflicts[0].message}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div
                          className={`h-16 rounded-xl flex items-center justify-center border border-dashed transition-all ${
                            !isClassAvailable
                              ? 'border-slate-200 text-slate-300 bg-slate-100/40 text-[10px]'
                              : 'border-slate-200 hover:border-indigo-300 text-slate-300 hover:text-indigo-500'
                          }`}
                        >
                          {!isClassAvailable ? (
                            <span>Անհասանելի</span>
                          ) : (
                            <Plus className="w-4 h-4 opacity-40 hover:opacity-100" />
                          )}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------
   SUB-COMPONENT: Teacher Schedule Grid View
   ------------------------------------------------------------- */
interface TeacherGridViewProps {
  activeTeacher?: Teacher;
  settings: any;
  entries: ScheduleEntry[];
  classMap: Map<string, SchoolClass>;
  subjectMap: Map<string, Subject>;
  conflictsMap: Map<string, any[]>;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onCellClick: (day: DayOfWeek, period: number, classId: string, entry?: ScheduleEntry) => void;
}

const TeacherGridView: React.FC<TeacherGridViewProps> = ({
  activeTeacher,
  settings,
  entries,
  classMap,
  subjectMap,
  conflictsMap,
  onDragStart,
  onCellClick,
}) => {
  if (!activeTeacher) {
    return (
      <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
        Ուսուցիչ ընտրված չէ
      </div>
    );
  }

  const { activeDays, periods } = settings;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden print-full-width">
      <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
            {activeTeacher.fullName.slice(0, 1)}
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-800">{activeTeacher.fullName}</h3>
            <p className="text-xs text-slate-400">
              Շաբաթական պարապմունքներ՝ {entries.length} ժամ
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-700 text-xs font-semibold">
              <th className="py-3 px-4 w-28 border-r border-slate-200">Դասաժամ</th>
              {activeDays.map((day: DayOfWeek) => (
                <th
                  key={day}
                  className="py-3 px-3 border-r last:border-r-0 border-slate-200 min-w-[170px]"
                >
                  <div className="font-bold text-slate-800">{DAY_NAMES[day].full}</div>
                  <div className="text-[10px] text-slate-400 font-normal">
                    {DAY_NAMES[day].short}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {periods.map((period: any) => (
              <tr key={period.number} className="border-b last:border-b-0 border-slate-100">
                <td className="py-3 px-4 border-r border-slate-200 bg-slate-50/40 align-top">
                  <div className="font-bold text-sm text-slate-800">{period.number}-ին դաս</div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                    {period.startTime} - {period.endTime}
                  </div>
                </td>

                {activeDays.map((day: DayOfWeek) => {
                  const slotKey = `${day}-${period.number}`;
                  const entry = entries.find(
                    (e) => e.day === day && e.period === period.number
                  );

                  const isTeacherAvailable =
                    activeTeacher.availability[slotKey] ?? true;

                  const conflicts = entry ? conflictsMap.get(entry.id) || [] : [];
                  const hasError = conflicts.some((c) => c.severity === 'error');
                  const hasWarning = conflicts.some((c) => c.severity === 'warning');

                  const sub = entry ? subjectMap.get(entry.subjectId) : null;
                  const cls = entry ? classMap.get(entry.classId) : null;

                  return (
                    <td
                      key={day}
                      className={`p-2 border-r last:border-r-0 border-slate-100 align-top min-h-[90px] select-none ${
                        !isTeacherAvailable && !entry ? 'bg-slate-100/50' : ''
                      }`}
                    >
                      {entry ? (
                        <div
                          draggable
                          onDragStart={(e) => onDragStart(e, entry.id)}
                          onClick={() => onCellClick(day, period.number, entry.classId, entry)}
                          className={`rounded-xl p-2.5 transition-all relative overflow-hidden group shadow-2xs border cursor-pointer ${
                            hasError
                              ? 'border-rose-400 bg-rose-50/60'
                              : hasWarning
                              ? 'border-amber-400 bg-amber-50/60'
                              : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                          }`}
                        >
                          <div
                            className="absolute top-0 bottom-0 left-0 w-1.5"
                            style={{ backgroundColor: sub?.color || '#cbd5e1' }}
                          />

                          <div className="pl-1.5">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-bold text-xs text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                                {cls?.name || 'Դասարան'}
                              </span>
                              <div className="flex items-center gap-1">
                                {entry.isLocked && (
                                  <Lock className="w-3 h-3 text-amber-600" />
                                )}
                              </div>
                            </div>

                            <div className="font-semibold text-xs text-slate-800 mt-1 line-clamp-1">
                              {sub?.name}
                            </div>

                            {entry.room && (
                              <div className="text-[10px] text-slate-400 mt-1">
                                Լսարան՝ {entry.room}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="h-16 rounded-xl flex items-center justify-center text-[10px] text-slate-300">
                          {!isTeacherAvailable ? 'Զբաղված ժամ' : 'Ազատ'}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------
   SUB-COMPONENT: Overview Summary Grid View (All Classes)
   ------------------------------------------------------------- */
interface OverviewGridViewProps {
  classes: SchoolClass[];
  settings: any;
  entries: ScheduleEntry[];
  subjectMap: Map<string, Subject>;
  teacherMap: Map<string, Teacher>;
  conflictsMap: Map<string, any[]>;
  dragOverSlot: string | null;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragOver: (e: React.DragEvent, slotKey: string) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, day: DayOfWeek, period: number, classId: string) => void;
  onCellClick: (day: DayOfWeek, period: number, classId: string, entry?: ScheduleEntry) => void;
}

const OverviewGridView: React.FC<OverviewGridViewProps> = ({
  classes,
  settings,
  entries,
  subjectMap,
  teacherMap,
  conflictsMap,
  dragOverSlot,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onCellClick,
}) => {
  const { activeDays, periods } = settings;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden print-full-width">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-700 font-semibold sticky top-0 z-20">
              <th className="py-3 px-3 w-20 border-r border-slate-200">Օր</th>
              <th className="py-3 px-3 w-24 border-r border-slate-200">Ժամ</th>
              {classes.map((cls) => (
                <th
                  key={cls.id}
                  className="py-3 px-3 border-r last:border-r-0 border-slate-200 min-w-[150px]"
                >
                  <div className="font-bold text-indigo-700 text-sm">{cls.name}</div>
                  <div className="text-[10px] text-slate-400 font-normal">
                    {cls.curriculum.reduce((sum, c) => sum + c.hoursPerWeek, 0)} ժամ/շաբաթ
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {activeDays.map((day: DayOfWeek) => {
              return periods.map((period: any, pIdx: number) => {
                const isFirstPeriod = pIdx === 0;

                return (
                  <tr
                    key={`${day}-${period.number}`}
                    className={`border-b last:border-b-0 border-slate-100 hover:bg-slate-50/30 ${
                      isFirstPeriod ? 'border-t-2 border-t-slate-200' : ''
                    }`}
                  >
                    {/* Day span column */}
                    {isFirstPeriod && (
                      <td
                        rowSpan={periods.length}
                        className="py-3 px-3 font-bold text-slate-800 bg-slate-50/60 border-r border-slate-200 align-top text-center"
                      >
                        <div className="text-sm">{DAY_NAMES[day].full}</div>
                        <div className="text-[10px] text-slate-400">{DAY_NAMES[day].short}</div>
                      </td>
                    )}

                    {/* Period time slot */}
                    <td className="py-2 px-2.5 border-r border-slate-200 bg-slate-50/30 align-middle">
                      <div className="font-bold text-slate-700">{period.number}-ին</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {period.startTime}
                      </div>
                    </td>

                    {/* Classes columns */}
                    {classes.map((cls) => {
                      const slotKey = `${day}-${period.number}`;
                      const isDragOver = dragOverSlot === `${cls.id}__${slotKey}`;
                      const entry = entries.find(
                        (e) => e.classId === cls.id && e.day === day && e.period === period.number
                      );

                      const sub = entry ? subjectMap.get(entry.subjectId) : null;
                      const teacherNames = entry
                        ? entry.teacherIds
                            .map((tId) => teacherMap.get(tId)?.fullName)
                            .filter(Boolean)
                            .join(' / ')
                        : '';

                      const conflicts = entry ? conflictsMap.get(entry.id) || [] : [];
                      const hasError = conflicts.some((c) => c.severity === 'error');

                      return (
                        <td
                          key={cls.id}
                          onDragOver={(e) => onDragOver(e, `${cls.id}__${slotKey}`)}
                          onDragLeave={onDragLeave}
                          onDrop={(e) => onDrop(e, day, period.number, cls.id)}
                          onClick={() => onCellClick(day, period.number, cls.id, entry)}
                          className={`p-1.5 border-r last:border-r-0 border-slate-100 align-top cursor-pointer select-none transition-colors ${
                            isDragOver ? 'bg-indigo-50 ring-1 ring-indigo-400 ring-inset' : ''
                          }`}
                        >
                          {entry ? (
                            <div
                              draggable
                              onDragStart={(e) => onDragStart(e, entry.id)}
                              className={`p-2 rounded-lg text-xs relative overflow-hidden border ${
                                hasError
                                  ? 'border-rose-400 bg-rose-50'
                                  : 'border-slate-200 bg-white hover:border-slate-300 shadow-2xs'
                              }`}
                            >
                              <div
                                className="absolute top-0 bottom-0 left-0 w-1"
                                style={{ backgroundColor: sub?.color || '#cbd5e1' }}
                              />
                              <div className="pl-1">
                                <div className="font-bold text-slate-800 line-clamp-1">
                                  {sub?.name}
                                </div>
                                <div className="text-[10px] text-slate-500 line-clamp-1">
                                  {teacherNames}
                                </div>
                                {entry.room && (
                                  <div className="text-[9px] text-slate-400">
                                    {entry.room}
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="h-10 rounded border border-dashed border-slate-100 hover:border-slate-300" />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              });
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
