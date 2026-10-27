export type DayOfWeek = 'ПН' | 'ВТ' | 'СР' | 'ЧТ' | 'ПТ' | 'СБ';

export interface PeriodSlot {
  number: number;      // Номер урока (1, 2, 3...)
  startTime: string;   // Например, "08:30"
  endTime: string;     // Например, "09:15"
}

export interface Subject {
  id: string;
  name: string;        // Например, "Մաթեմատիկա", "Հայոց լեզու"
  color: string;       // HEX или Tailwind-класс для бейджа (пастельные тона)
  defaultRoom?: string;// Кабинет по умолчанию (опционально)
}

export interface Teacher {
  id: string;
  fullName: string;
  subjectIds: string[]; // ID предметов, которые учитель может вести
  // Доступность учителя: ключ = `${day}-${periodNumber}` (например, "ПН-1"), значение = boolean (true = удобно/доступен)
  availability: Record<string, boolean>;
  maxHoursPerWeek?: number;
}

export interface CurriculumItem {
  id: string;
  subjectId: string;
  hoursPerWeek: number;         // Количество уроков в неделю для этого класса
  isFixedTeacher: boolean;      // Галочка "Фиксированный учитель для класса"
  isDualTeacher: boolean;       // Галочка "2 учителя одновременно (деление на подгруппы / парный урок)"
  assignedTeacherIds: string[]; // Если isFixedTeacher = true: 1 ID (или 2 ID, если isDualTeacher = true). Если false — может быть пустым, алгоритм подберет сам.
  room?: string;
}

export interface SchoolClass {
  id: string;
  name: string;                 // Например, "9Ա", "10Բ"
  // Доступность самого класса: `${day}-${periodNumber}` -> boolean (например, чтобы отключить 7-8 уроки или субботу для младших классов)
  availability: Record<string, boolean>;
  curriculum: CurriculumItem[]; // Учебный план класса
}

export interface ScheduleEntry {
  id: string;
  classId: string;
  subjectId: string;
  teacherIds: string[];         // 1 или 2 учителя
  day: DayOfWeek;
  period: number;
  room?: string;
  isLocked?: boolean;           // Заморожен ли урок от перегенерации
}

export interface AppSettings {
  activeDays: DayOfWeek[];      // Например, ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ'] или с 'СБ'
  periods: PeriodSlot[];        // Сетка звонков (по умолчанию 7 уроков)
}

// Հայերեն օրերի անվանումներ (Armenian Day Translations)
export const DAY_NAMES: Record<DayOfWeek, { short: string; full: string }> = {
  'ПН': { short: 'Երկ', full: 'Երկուշաբթի' },
  'ВТ': { short: 'Երք', full: 'Երեքշաբթի' },
  'СР': { short: 'Չոր', full: 'Չորեքշաբթի' },
  'ЧТ': { short: 'Հնգ', full: 'Հինգշաբթի' },
  'ПТ': { short: 'Ուրբ', full: 'Ուրբաթ' },
  'СБ': { short: 'Շաբ', full: 'Շաբաթ' },
};

export const ALL_DAYS: DayOfWeek[] = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'];
export const DEFAULT_ACTIVE_DAYS: DayOfWeek[] = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ'];

export interface ConflictInfo {
  type: 'teacher_double_booking' | 'teacher_unavailable' | 'class_unavailable' | 'room_conflict';
  severity: 'error' | 'warning';
  message: string;
  teacherId?: string;
}

export interface UnplacedLesson {
  id: string;
  classId: string;
  subjectId: string;
  teacherIds: string[];
  room?: string;
  reason: string;
}

export interface GenerationReport {
  placedCount: number;
  totalCount: number;
  unplacedLessons: UnplacedLesson[];
  executionTimeMs: number;
}
