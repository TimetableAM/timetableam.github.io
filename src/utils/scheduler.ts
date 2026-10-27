import {
  AppSettings,
  DayOfWeek,
  SchoolClass,
  ScheduleEntry,
  Subject,
  Teacher,
  ConflictInfo,
  GenerationReport,
  UnplacedLesson,
  DAY_NAMES,
} from '../types/schedule';

interface TaskLesson {
  id: string;
  classId: string;
  subjectId: string;
  teacherIds: string[];
  room?: string;
  isDualTeacher: boolean;
  hoursPerWeek: number;
}

export function validateSchedule(
  entries: ScheduleEntry[],
  classes: SchoolClass[],
  teachers: Teacher[],
  _subjects?: Subject[],
  _settings?: AppSettings
): Map<string, ConflictInfo[]> {
  const conflictMap = new Map<string, ConflictInfo[]>();

  const classMap = new Map(classes.map((c) => [c.id, c]));
  const teacherMap = new Map(teachers.map((t) => [t.id, t]));

  // Index entries by slot and teacher
  // slotKey = `${day}-${period}`
  const teacherSlots = new Map<string, { entryId: string; classId: string }[]>();
  const roomSlots = new Map<string, { entryId: string; classId: string; room: string }[]>();

  for (const entry of entries) {
    const slotKey = `${entry.day}-${entry.period}`;

    // 1. Check teacher double booking
    for (const teacherId of entry.teacherIds) {
      const tKey = `${teacherId}__${slotKey}`;
      const existing = teacherSlots.get(tKey) || [];
      existing.push({ entryId: entry.id, classId: entry.classId });
      teacherSlots.set(tKey, existing);
    }

    // 2. Check room conflicts if room specified
    if (entry.room && entry.room.trim() !== '') {
      const rKey = `${entry.room.trim().toLowerCase()}__${slotKey}`;
      const existing = roomSlots.get(rKey) || [];
      existing.push({ entryId: entry.id, classId: entry.classId, room: entry.room });
      roomSlots.set(rKey, existing);
    }

    // 3. Check teacher availability for this slot
    for (const teacherId of entry.teacherIds) {
      const teacher = teacherMap.get(teacherId);
      if (teacher) {
        const isAvailable = teacher.availability[slotKey] ?? true;
        if (!isAvailable) {
          const list = conflictMap.get(entry.id) || [];
          list.push({
            type: 'teacher_unavailable',
            severity: 'warning',
            message: `Ուսուցիչ ${teacher.fullName}-ի համար այս ժամն անհարմար է (${DAY_NAMES[entry.day].short}, դաս ${entry.period})`,
            teacherId,
          });
          conflictMap.set(entry.id, list);
        }
      }
    }

    // 4. Check class availability for this slot
    const schoolClass = classMap.get(entry.classId);
    if (schoolClass) {
      const isAvailable = schoolClass.availability[slotKey] ?? true;
      if (!isAvailable) {
        const list = conflictMap.get(entry.id) || [];
        list.push({
          type: 'class_unavailable',
          severity: 'error',
          message: `${schoolClass.name} դասարանի համար այս ժամն անհասանելի է`,
        });
        conflictMap.set(entry.id, list);
      }
    }
  }

  // Record teacher double booking conflicts
  for (const [, occurrences] of teacherSlots.entries()) {
    if (occurrences.length > 1) {
      for (const item of occurrences) {
        const otherClasses = occurrences
          .filter((o) => o.entryId !== item.entryId)
          .map((o) => classMap.get(o.classId)?.name || o.classId);

        const list = conflictMap.get(item.entryId) || [];
        list.push({
          type: 'teacher_double_booking',
          severity: 'error',
          message: `Ուսուցչի զբաղվածության բախում (միաժամանակ նաև՝ ${otherClasses.join(', ')})`,
        });
        conflictMap.set(item.entryId, list);
      }
    }
  }

  // Record room double booking conflicts
  for (const [, occurrences] of roomSlots.entries()) {
    if (occurrences.length > 1) {
      for (const item of occurrences) {
        const otherClasses = occurrences
          .filter((o) => o.entryId !== item.entryId)
          .map((o) => classMap.get(o.classId)?.name || o.classId);

        const list = conflictMap.get(item.entryId) || [];
        list.push({
          type: 'room_conflict',
          severity: 'warning',
          message: `Լսարանի բախում (${item.room} լսարանում նաև՝ ${otherClasses.join(', ')})`,
        });
        conflictMap.set(item.entryId, list);
      }
    }
  }

  return conflictMap;
}

export function generateSchedule(
  classes: SchoolClass[],
  teachers: Teacher[],
  subjects: Subject[],
  settings: AppSettings,
  existingEntries: ScheduleEntry[] = [],
  keepLockedOnly: boolean = false
): { entries: ScheduleEntry[]; report: GenerationReport } {
  const startTime = performance.now();

  const activeDays = settings.activeDays;
  const periods = settings.periods.map((p) => p.number);
  const teacherMap = new Map(teachers.map((t) => [t.id, t]));
  const classMap = new Map(classes.map((c) => [c.id, c]));
  const subjectMap = new Map(subjects.map((s) => [s.id, s]));

  // Entries to preserve
  let entries: ScheduleEntry[] = [];
  if (keepLockedOnly) {
    entries = existingEntries.filter((e) => e.isLocked);
  } else {
    // If not keepLockedOnly, check if existingEntries has locked items
    entries = existingEntries.filter((e) => e.isLocked);
  }

  // Lookup fast occupied slots
  // classOccupied: classId -> Set of `${day}-${period}`
  // teacherOccupied: teacherId -> Set of `${day}-${period}`
  const classOccupied = new Map<string, Set<string>>();
  const teacherOccupied = new Map<string, Set<string>>();

  for (const c of classes) {
    classOccupied.set(c.id, new Set());
  }
  for (const t of teachers) {
    teacherOccupied.set(t.id, new Set());
  }

  // Register preserved entries
  for (const entry of entries) {
    const slotKey = `${entry.day}-${entry.period}`;
    classOccupied.get(entry.classId)?.add(slotKey);
    for (const tId of entry.teacherIds) {
      teacherOccupied.get(tId)?.add(slotKey);
    }
  }

  // 1. Resolve teacher assignments for curriculum items where isFixedTeacher is false
  // We determine a consistent teacher (or pair) for the class for this week
  const resolvedCurriculums: {
    classId: string;
    subjectId: string;
    hoursPerWeek: number;
    isDualTeacher: boolean;
    assignedTeacherIds: string[];
    room?: string;
  }[] = [];

  // Track teacher loads across all assignments to balance auto-assigned teachers
  const teacherAssignedHours = new Map<string, number>();
  for (const t of teachers) {
    teacherAssignedHours.set(t.id, 0);
  }
  // Count hours already locked/assigned
  for (const entry of entries) {
    for (const tId of entry.teacherIds) {
      teacherAssignedHours.set(tId, (teacherAssignedHours.get(tId) || 0) + 1);
    }
  }

  for (const c of classes) {
    for (const cur of c.curriculum) {
      let chosenTeachers = [...cur.assignedTeacherIds];

      if (!cur.isFixedTeacher || chosenTeachers.length === 0) {
        // Find qualified teachers who teach this subject
        const candidates = teachers.filter((t) => t.subjectIds.includes(cur.subjectId));

        if (cur.isDualTeacher) {
          if (candidates.length >= 2) {
            // Sort by current assigned hours + availability score
            candidates.sort((a, b) => {
              const hoursA = teacherAssignedHours.get(a.id) || 0;
              const hoursB = teacherAssignedHours.get(b.id) || 0;
              return hoursA - hoursB;
            });
            chosenTeachers = [candidates[0].id, candidates[1].id];
          } else if (candidates.length === 1) {
            chosenTeachers = [candidates[0].id];
          }
        } else {
          if (candidates.length > 0) {
            candidates.sort((a, b) => {
              const hoursA = teacherAssignedHours.get(a.id) || 0;
              const hoursB = teacherAssignedHours.get(b.id) || 0;
              return hoursA - hoursB;
            });
            chosenTeachers = [candidates[0].id];
          }
        }
      }

      // Update load tracker
      for (const tId of chosenTeachers) {
        teacherAssignedHours.set(
          tId,
          (teacherAssignedHours.get(tId) || 0) + cur.hoursPerWeek
        );
      }

      const subject = subjectMap.get(cur.subjectId);
      const defaultRoom = cur.room || subject?.defaultRoom;

      resolvedCurriculums.push({
        classId: c.id,
        subjectId: cur.subjectId,
        hoursPerWeek: cur.hoursPerWeek,
        isDualTeacher: cur.isDualTeacher,
        assignedTeacherIds: chosenTeachers,
        room: defaultRoom,
      });
    }
  }

  // 2. Build list of individual lessons needed
  // Subtract lessons already locked in entries
  const tasksToPlace: TaskLesson[] = [];
  let totalCurriculumHours = 0;

  for (const item of resolvedCurriculums) {
    totalCurriculumHours += item.hoursPerWeek;

    // Count how many already locked in entries for this class & subject
    const alreadyPlaced = entries.filter(
      (e) => e.classId === item.classId && e.subjectId === item.subjectId
    ).length;

    const remainingHours = Math.max(0, item.hoursPerWeek - alreadyPlaced);

    for (let i = 0; i < remainingHours; i++) {
      tasksToPlace.push({
        id: `gen-${item.classId}-${item.subjectId}-${i}-${Math.random().toString(36).substring(2, 7)}`,
        classId: item.classId,
        subjectId: item.subjectId,
        teacherIds: item.assignedTeacherIds,
        room: item.room,
        isDualTeacher: item.isDualTeacher,
        hoursPerWeek: item.hoursPerWeek,
      });
    }
  }

  // 3. Sort tasks: Most Constrained First
  // Priority:
  // a) Dual teacher lessons (hardest to align 2 teachers)
  // b) Teachers with fewest available slots
  // c) Higher weekly hours subjects
  tasksToPlace.sort((a, b) => {
    if (a.isDualTeacher !== b.isDualTeacher) {
      return a.isDualTeacher ? -1 : 1;
    }

    // Availability score of teachers
    const getTeacherScore = (tIds: string[]) => {
      if (tIds.length === 0) return 999;
      let totalFree = 0;
      for (const tId of tIds) {
        const teacher = teacherMap.get(tId);
        if (!teacher) continue;
        let freeSlots = 0;
        for (const day of activeDays) {
          for (const p of periods) {
            if (teacher.availability[`${day}-${p}`] ?? true) {
              freeSlots++;
            }
          }
        }
        totalFree += freeSlots;
      }
      return totalFree / tIds.length;
    };

    const scoreA = getTeacherScore(a.teacherIds);
    const scoreB = getTeacherScore(b.teacherIds);
    if (scoreA !== scoreB) {
      return scoreA - scoreB;
    }

    return b.hoursPerWeek - a.hoursPerWeek;
  });

  // Track daily distribution of subjects per class:
  // classSubjectDays: `${classId}__${subjectId}__${day}` -> count
  const classSubjectDayCount = new Map<string, number>();
  for (const entry of entries) {
    const key = `${entry.classId}__${entry.subjectId}__${entry.day}`;
    classSubjectDayCount.set(key, (classSubjectDayCount.get(key) || 0) + 1);
  }

  // 4. Place tasks with intelligent heuristic scoring
  const unplacedLessons: UnplacedLesson[] = [];

  for (const task of tasksToPlace) {
    const schoolClass = classMap.get(task.classId);
    if (!schoolClass) continue;

    if (task.teacherIds.length === 0) {
      const subName = subjectMap.get(task.subjectId)?.name || 'Առարկա';
      unplacedLessons.push({
        id: task.id,
        classId: task.classId,
        subjectId: task.subjectId,
        teacherIds: [],
        room: task.room,
        reason: `${schoolClass.name} — ${subName}․ նշանակված չէ ուսուցիչ`,
      });
      continue;
    }

    // Evaluate all valid candidate slots (day, period)
    interface CandidateSlot {
      day: DayOfWeek;
      period: number;
      score: number;
    }

    const candidateSlots: CandidateSlot[] = [];

    for (const day of activeDays) {
      for (const period of periods) {
        const slotKey = `${day}-${period}`;

        // Hard constraint 1: class must not already have a lesson in this slot
        if (classOccupied.get(task.classId)?.has(slotKey)) {
          continue;
        }

        // Hard constraint 2: class availability
        if (schoolClass.availability[slotKey] === false) {
          continue;
        }

        // Hard constraint 3: all teachers must be free and available
        let allTeachersAvailable = true;
        for (const tId of task.teacherIds) {
          const teacher = teacherMap.get(tId);
          if (!teacher) {
            allTeachersAvailable = false;
            break;
          }
          if (teacherOccupied.get(tId)?.has(slotKey)) {
            allTeachersAvailable = false;
            break;
          }
          if (teacher.availability[slotKey] === false) {
            allTeachersAvailable = false;
            break;
          }
        }

        if (!allTeachersAvailable) {
          continue;
        }

        // Slot is valid! Calculate soft heuristic score (lower is better)
        let score = 0;

        // Soft Rule 1: Subject repetition in the same day
        const daySubjectKey = `${task.classId}__${task.subjectId}__${day}`;
        const countOnDay = classSubjectDayCount.get(daySubjectKey) || 0;
        if (countOnDay === 0) {
          score += 0; // Great, fresh day for subject
        } else if (countOnDay === 1 && task.hoursPerWeek >= 4) {
          score += 25; // Acceptable for 4-5 hr/week subjects (e.g. Math double)
        } else {
          score += 150 * (countOnDay + 1); // Avoid 2+ on same day
        }

        // Soft Rule 2: Compact student schedule (avoid "windows" / gaps)
        // Prefer periods that are connected to existing lessons for this class on this day
        const daySlots = periods.map((p) => classOccupied.get(task.classId)?.has(`${day}-${p}`));
        const periodIdx = periods.indexOf(period);

        // Preference for earlier periods (1, 2, 3...)
        score += period * 3;

        // Check continuity with previous period
        if (periodIdx > 0 && daySlots[periodIdx - 1]) {
          score -= 15; // Good: adjacent to previous lesson
        }
        if (periodIdx < periods.length - 1 && daySlots[periodIdx + 1]) {
          score -= 10; // Good: adjacent to next lesson
        }

        // Penalize isolated floating lessons (e.g., lesson 5 when 1,2,3,4 are empty)
        const hasAnyOnDay = daySlots.some(Boolean);
        if (hasAnyOnDay) {
          let hasBefore = false;
          for (let p = 0; p < periodIdx; p++) {
            if (daySlots[p]) hasBefore = true;
          }
          let hasAfter = false;
          for (let p = periodIdx + 1; p < daySlots.length; p++) {
            if (daySlots[p]) hasAfter = true;
          }
          // If filling a hole between existing lessons, huge bonus!
          if (hasBefore && hasAfter) {
            score -= 30;
          }
        }

        candidateSlots.push({ day, period, score });
      }
    }

    if (candidateSlots.length > 0) {
      // Pick best slot (lowest score)
      candidateSlots.sort((a, b) => a.score - b.score);
      const chosen = candidateSlots[0];
      const slotKey = `${chosen.day}-${chosen.period}`;

      const newEntry: ScheduleEntry = {
        id: task.id,
        classId: task.classId,
        subjectId: task.subjectId,
        teacherIds: task.teacherIds,
        day: chosen.day,
        period: chosen.period,
        room: task.room,
        isLocked: false,
      };

      entries.push(newEntry);
      classOccupied.get(task.classId)?.add(slotKey);
      for (const tId of task.teacherIds) {
        teacherOccupied.get(tId)?.add(slotKey);
      }

      const daySubjectKey = `${task.classId}__${task.subjectId}__${chosen.day}`;
      classSubjectDayCount.set(
        daySubjectKey,
        (classSubjectDayCount.get(daySubjectKey) || 0) + 1
      );
    } else {
      // Could not place due to constraints
      const subName = subjectMap.get(task.subjectId)?.name || 'Առարկա';
      const teacherNames = task.teacherIds
        .map((id) => teacherMap.get(id)?.fullName || id)
        .join(', ');

      unplacedLessons.push({
        id: task.id,
        classId: task.classId,
        subjectId: task.subjectId,
        teacherIds: task.teacherIds,
        room: task.room,
        reason: `${schoolClass.name} — ${subName} (${teacherNames})․ դասացուցակում չկա համընկնող ազատ ժամ`,
      });
    }
  }

  const executionTimeMs = Math.round(performance.now() - startTime);

  return {
    entries,
    report: {
      placedCount: entries.length,
      totalCount: totalCurriculumHours,
      unplacedLessons,
      executionTimeMs,
    },
  };
}
