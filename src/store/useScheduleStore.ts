import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  AppSettings,
  CurriculumItem,
  DayOfWeek,
  GenerationReport,
  ScheduleEntry,
  SchoolClass,
  Subject,
  Teacher,
  UnplacedLesson,
} from '../types/schedule';
import {
  INITIAL_CLASSES,
  INITIAL_SETTINGS,
  INITIAL_SUBJECTS,
  INITIAL_TEACHERS,
} from '../data/mockData';
import { generateSchedule } from '../utils/scheduler';

export type TabType = 'subjects_bells' | 'teachers' | 'classes' | 'schedule' | 'export';
export type ViewMode = 'by_class' | 'by_teacher' | 'overview';

interface ScheduleState {
  settings: AppSettings;
  subjects: Subject[];
  teachers: Teacher[];
  classes: SchoolClass[];
  entries: ScheduleEntry[];
  unplacedLessons: UnplacedLesson[];
  activeTab: TabType;
  viewMode: ViewMode;
  selectedClassId: string | null;
  selectedTeacherId: string | null;
  generationReport: GenerationReport | null;

  // Navigation
  setActiveTab: (tab: TabType) => void;
  setViewMode: (mode: ViewMode) => void;
  setSelectedClassId: (id: string | null) => void;
  setSelectedTeacherId: (id: string | null) => void;

  // Settings
  updateSettings: (settings: Partial<AppSettings>) => void;
  toggleActiveDay: (day: DayOfWeek) => void;
  addPeriod: () => void;
  removePeriod: (num: number) => void;
  updatePeriod: (num: number, startTime: string, endTime: string) => void;

  // Subjects
  addSubject: (sub: Omit<Subject, 'id'>) => Subject;
  updateSubject: (id: string, updates: Partial<Subject>) => void;
  deleteSubject: (id: string) => void;

  // Teachers
  addTeacher: (teacher: Omit<Teacher, 'id'>) => Teacher;
  updateTeacher: (id: string, updates: Partial<Teacher>) => void;
  deleteTeacher: (id: string) => void;
  setTeacherAvailability: (teacherId: string, slotKey: string, available: boolean) => void;
  batchSetTeacherAvailability: (teacherId: string, slots: Record<string, boolean>) => void;

  // Classes & Curriculum
  addClass: (cls: Omit<SchoolClass, 'id'>) => SchoolClass;
  updateClass: (id: string, updates: Partial<SchoolClass>) => void;
  deleteClass: (id: string) => void;
  setClassAvailability: (classId: string, slotKey: string, available: boolean) => void;
  batchSetClassAvailability: (classId: string, slots: Record<string, boolean>) => void;
  addCurriculumItem: (classId: string, item: Omit<CurriculumItem, 'id'>) => void;
  updateCurriculumItem: (classId: string, itemId: string, updates: Partial<CurriculumItem>) => void;
  deleteCurriculumItem: (classId: string, itemId: string) => void;

  // Schedule Entries
  addOrUpdateEntry: (entry: ScheduleEntry) => void;
  deleteEntry: (id: string) => void;
  toggleLockEntry: (id: string) => void;
  moveEntry: (entryId: string, newDay: DayOfWeek, newPeriod: number, targetClassId?: string) => void;
  swapEntries: (entryId1: string, entryId2: string) => void;
  clearSchedule: (onlyUnlocked?: boolean) => void;
  generateScheduleAuto: (keepLockedOnly?: boolean) => GenerationReport;
  placeUnplacedLesson: (lessonId: string, day: DayOfWeek, period: number) => void;

  // Backup & Reset
  loadDemoData: () => void;
  resetAllData: () => void;
  importFromJSON: (jsonStr: string) => { success: boolean; message: string };
  exportToJSON: () => string;
}

// Helper to generate initial timetable if fresh
const initialResult = generateSchedule(
  INITIAL_CLASSES,
  INITIAL_TEACHERS,
  INITIAL_SUBJECTS,
  INITIAL_SETTINGS,
  [],
  false
);

export const useScheduleStore = create<ScheduleState>()(
  persist(
    (set, get) => ({
      settings: INITIAL_SETTINGS,
      subjects: INITIAL_SUBJECTS,
      teachers: INITIAL_TEACHERS,
      classes: INITIAL_CLASSES,
      entries: initialResult.entries,
      unplacedLessons: initialResult.report.unplacedLessons,
      activeTab: 'schedule',
      viewMode: 'by_class',
      selectedClassId: INITIAL_CLASSES[0]?.id || null,
      selectedTeacherId: INITIAL_TEACHERS[0]?.id || null,
      generationReport: initialResult.report,

      setActiveTab: (tab) => set({ activeTab: tab }),
      setViewMode: (mode) => set({ viewMode: mode }),
      setSelectedClassId: (id) => set({ selectedClassId: id }),
      setSelectedTeacherId: (id) => set({ selectedTeacherId: id }),

      // Settings
      updateSettings: (newSettings) =>
        set((state) => ({ settings: { ...state.settings, ...newSettings } })),

      toggleActiveDay: (day) =>
        set((state) => {
          const current = state.settings.activeDays;
          const nextDays = current.includes(day)
            ? current.filter((d) => d !== day)
            : [...current, day];
          // Keep at least one day
          if (nextDays.length === 0) return state;
          return { settings: { ...state.settings, activeDays: nextDays } };
        }),

      addPeriod: () =>
        set((state) => {
          const periods = state.settings.periods;
          const nextNum = periods.length + 1;
          const lastPeriod = periods[periods.length - 1];
          let start = '15:00';
          let end = '15:45';
          if (lastPeriod) {
            const [lh, lm] = lastPeriod.endTime.split(':').map(Number);
            const startM = lh * 60 + lm + 10;
            const endM = startM + 45;
            start = `${String(Math.floor(startM / 60)).padStart(2, '0')}:${String(startM % 60).padStart(2, '0')}`;
            end = `${String(Math.floor(endM / 60)).padStart(2, '0')}:${String(endM % 60).padStart(2, '0')}`;
          }
          return {
            settings: {
              ...state.settings,
              periods: [...periods, { number: nextNum, startTime: start, endTime: end }],
            },
          };
        }),

      removePeriod: (num) =>
        set((state) => {
          if (state.settings.periods.length <= 1) return state;
          const nextPeriods = state.settings.periods
            .filter((p) => p.number !== num)
            .map((p, idx) => ({ ...p, number: idx + 1 }));
          // Also remove entries associated with removed period
          const nextEntries = state.entries.filter((e) => e.period <= nextPeriods.length);
          return {
            settings: { ...state.settings, periods: nextPeriods },
            entries: nextEntries,
          };
        }),

      updatePeriod: (num, startTime, endTime) =>
        set((state) => ({
          settings: {
            ...state.settings,
            periods: state.settings.periods.map((p) =>
              p.number === num ? { ...p, startTime, endTime } : p
            ),
          },
        })),

      // Subjects
      addSubject: (sub) => {
        const newSub: Subject = {
          ...sub,
          id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        };
        set((state) => ({ subjects: [...state.subjects, newSub] }));
        return newSub;
      },

      updateSubject: (id, updates) =>
        set((state) => ({
          subjects: state.subjects.map((s) => (s.id === id ? { ...s, ...updates } : s)),
        })),

      deleteSubject: (id) =>
        set((state) => ({
          subjects: state.subjects.filter((s) => s.id !== id),
          teachers: state.teachers.map((t) => ({
            ...t,
            subjectIds: t.subjectIds.filter((subId) => subId !== id),
          })),
          classes: state.classes.map((c) => ({
            ...c,
            curriculum: c.curriculum.filter((cur) => cur.subjectId !== id),
          })),
          entries: state.entries.filter((e) => e.subjectId !== id),
        })),

      // Teachers
      addTeacher: (teacher) => {
        const newTeacher: Teacher = {
          ...teacher,
          id: `t-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        };
        set((state) => ({
          teachers: [...state.teachers, newTeacher],
          selectedTeacherId: state.selectedTeacherId || newTeacher.id,
        }));
        return newTeacher;
      },

      updateTeacher: (id, updates) =>
        set((state) => ({
          teachers: state.teachers.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        })),

      deleteTeacher: (id) =>
        set((state) => ({
          teachers: state.teachers.filter((t) => t.id !== id),
          classes: state.classes.map((c) => ({
            ...c,
            curriculum: c.curriculum.map((cur) => ({
              ...cur,
              assignedTeacherIds: cur.assignedTeacherIds.filter((tId) => tId !== id),
            })),
          })),
          entries: state.entries.filter((e) => !e.teacherIds.includes(id)),
          selectedTeacherId:
            state.selectedTeacherId === id
              ? state.teachers.find((t) => t.id !== id)?.id || null
              : state.selectedTeacherId,
        })),

      setTeacherAvailability: (teacherId, slotKey, available) =>
        set((state) => ({
          teachers: state.teachers.map((t) =>
            t.id === teacherId
              ? { ...t, availability: { ...t.availability, [slotKey]: available } }
              : t
          ),
        })),

      batchSetTeacherAvailability: (teacherId, slots) =>
        set((state) => ({
          teachers: state.teachers.map((t) =>
            t.id === teacherId
              ? { ...t, availability: { ...t.availability, ...slots } }
              : t
          ),
        })),

      // Classes
      addClass: (cls) => {
        const newClass: SchoolClass = {
          ...cls,
          id: `c-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        };
        set((state) => ({
          classes: [...state.classes, newClass],
          selectedClassId: state.selectedClassId || newClass.id,
        }));
        return newClass;
      },

      updateClass: (id, updates) =>
        set((state) => ({
          classes: state.classes.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        })),

      deleteClass: (id) =>
        set((state) => ({
          classes: state.classes.filter((c) => c.id !== id),
          entries: state.entries.filter((e) => e.classId !== id),
          selectedClassId:
            state.selectedClassId === id
              ? state.classes.find((c) => c.id !== id)?.id || null
              : state.selectedClassId,
        })),

      setClassAvailability: (classId, slotKey, available) =>
        set((state) => ({
          classes: state.classes.map((c) =>
            c.id === classId
              ? { ...c, availability: { ...c.availability, [slotKey]: available } }
              : c
          ),
        })),

      batchSetClassAvailability: (classId, slots) =>
        set((state) => ({
          classes: state.classes.map((c) =>
            c.id === classId
              ? { ...c, availability: { ...c.availability, ...slots } }
              : c
          ),
        })),

      addCurriculumItem: (classId, item) =>
        set((state) => {
          const newItem: CurriculumItem = {
            ...item,
            id: `cur-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          };
          return {
            classes: state.classes.map((c) =>
              c.id === classId ? { ...c, curriculum: [...c.curriculum, newItem] } : c
            ),
          };
        }),

      updateCurriculumItem: (classId, itemId, updates) =>
        set((state) => ({
          classes: state.classes.map((c) =>
            c.id === classId
              ? {
                  ...c,
                  curriculum: c.curriculum.map((item) =>
                    item.id === itemId ? { ...item, ...updates } : item
                  ),
                }
              : c
          ),
        })),

      deleteCurriculumItem: (classId, itemId) =>
        set((state) => ({
          classes: state.classes.map((c) =>
            c.id === classId
              ? { ...c, curriculum: c.curriculum.filter((item) => item.id !== itemId) }
              : c
          ),
        })),

      // Entries
      addOrUpdateEntry: (entry) =>
        set((state) => {
          // If replacing in same class, day, period
          const filtered = state.entries.filter(
            (e) =>
              e.id !== entry.id &&
              !(e.classId === entry.classId && e.day === entry.day && e.period === entry.period)
          );
          return {
            entries: [...filtered, entry],
            unplacedLessons: state.unplacedLessons.filter((u) => u.id !== entry.id),
          };
        }),

      deleteEntry: (id) =>
        set((state) => ({
          entries: state.entries.filter((e) => e.id !== id),
        })),

      toggleLockEntry: (id) =>
        set((state) => ({
          entries: state.entries.map((e) =>
            e.id === id ? { ...e, isLocked: !e.isLocked } : e
          ),
        })),

      moveEntry: (entryId, newDay, newPeriod, targetClassId) =>
        set((state) => {
          const entry = state.entries.find((e) => e.id === entryId);
          if (!entry) return state;

          const destClassId = targetClassId || entry.classId;
          // Check if destination slot is occupied by another lesson in the same class
          const existingInDest = state.entries.find(
            (e) =>
              e.classId === destClassId &&
              e.day === newDay &&
              e.period === newPeriod &&
              e.id !== entryId
          );

          if (existingInDest) {
            // Swap places!
            return {
              entries: state.entries.map((e) => {
                if (e.id === entryId) {
                  return { ...e, classId: destClassId, day: newDay, period: newPeriod };
                }
                if (e.id === existingInDest.id) {
                  return { ...e, day: entry.day, period: entry.period };
                }
                return e;
              }),
            };
          }

          return {
            entries: state.entries.map((e) =>
              e.id === entryId
                ? { ...e, classId: destClassId, day: newDay, period: newPeriod }
                : e
            ),
          };
        }),

      swapEntries: (entryId1, entryId2) =>
        set((state) => {
          const e1 = state.entries.find((e) => e.id === entryId1);
          const e2 = state.entries.find((e) => e.id === entryId2);
          if (!e1 || !e2) return state;

          return {
            entries: state.entries.map((e) => {
              if (e.id === entryId1) {
                return { ...e, day: e2.day, period: e2.period };
              }
              if (e.id === entryId2) {
                return { ...e, day: e1.day, period: e1.period };
              }
              return e;
            }),
          };
        }),

      clearSchedule: (onlyUnlocked = true) =>
        set((state) => ({
          entries: onlyUnlocked ? state.entries.filter((e) => e.isLocked) : [],
          unplacedLessons: [],
          generationReport: null,
        })),

      generateScheduleAuto: (keepLockedOnly = true) => {
        const state = get();
        const result = generateSchedule(
          state.classes,
          state.teachers,
          state.subjects,
          state.settings,
          state.entries,
          keepLockedOnly
        );

        set({
          entries: result.entries,
          unplacedLessons: result.report.unplacedLessons,
          generationReport: result.report,
        });

        return result.report;
      },

      placeUnplacedLesson: (lessonId, day, period) =>
        set((state) => {
          const unplaced = state.unplacedLessons.find((u) => u.id === lessonId);
          if (!unplaced) return state;

          const newEntry: ScheduleEntry = {
            id: unplaced.id,
            classId: unplaced.classId,
            subjectId: unplaced.subjectId,
            teacherIds: unplaced.teacherIds,
            day,
            period,
            room: unplaced.room,
            isLocked: false,
          };

          // Remove any existing entry at that slot for that class
          const filtered = state.entries.filter(
            (e) => !(e.classId === unplaced.classId && e.day === day && e.period === period)
          );

          return {
            entries: [...filtered, newEntry],
            unplacedLessons: state.unplacedLessons.filter((u) => u.id !== lessonId),
          };
        }),

      // Backup & Reset
      loadDemoData: () => {
        const result = generateSchedule(
          INITIAL_CLASSES,
          INITIAL_TEACHERS,
          INITIAL_SUBJECTS,
          INITIAL_SETTINGS,
          [],
          false
        );
        set({
          settings: INITIAL_SETTINGS,
          subjects: INITIAL_SUBJECTS,
          teachers: INITIAL_TEACHERS,
          classes: INITIAL_CLASSES,
          entries: result.entries,
          unplacedLessons: result.report.unplacedLessons,
          generationReport: result.report,
          selectedClassId: INITIAL_CLASSES[0]?.id || null,
          selectedTeacherId: INITIAL_TEACHERS[0]?.id || null,
        });
      },

      resetAllData: () =>
        set({
          settings: INITIAL_SETTINGS,
          subjects: [],
          teachers: [],
          classes: [],
          entries: [],
          unplacedLessons: [],
          generationReport: null,
          selectedClassId: null,
          selectedTeacherId: null,
        }),

      importFromJSON: (jsonStr) => {
        try {
          const data = JSON.parse(jsonStr);
          if (!data.subjects || !data.teachers || !data.classes || !data.settings) {
            return {
              success: false,
              message: 'Ֆայլի ձևաչափը սխալ է (պակասում են անհրաժեշտ դաշտերը)',
            };
          }
          set({
            settings: data.settings,
            subjects: data.subjects,
            teachers: data.teachers,
            classes: data.classes,
            entries: data.entries || [],
            unplacedLessons: data.unplacedLessons || [],
            selectedClassId: data.classes[0]?.id || null,
            selectedTeacherId: data.teachers[0]?.id || null,
          });
          return {
            success: true,
            message: 'Տվյալները հաջողությամբ ներմուծվեցին',
          };
        } catch (e) {
          return {
            success: false,
            message: `Սխալ ֆայլի ընթերցման ժամանակ: ${e instanceof Error ? e.message : 'անհայտ սխալ'}`,
          };
        }
      },

      exportToJSON: () => {
        const state = get();
        const exportData = {
          version: '1.0',
          exportedAt: new Date().toISOString(),
          settings: state.settings,
          subjects: state.subjects,
          teachers: state.teachers,
          classes: state.classes,
          entries: state.entries,
          unplacedLessons: state.unplacedLessons,
        };
        return JSON.stringify(exportData, null, 2);
      },
    }),
    {
      name: 'school-timetable-builder-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
