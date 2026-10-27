import React, { useState, useEffect } from 'react';
import {
  DayOfWeek,
  DAY_NAMES,
  ScheduleEntry,
  SchoolClass,
  Subject,
  Teacher,
} from '../../types/schedule';
import { Modal } from '../common/Modal';
import { Lock, Unlock, Trash2, AlertCircle } from 'lucide-react';

interface EditSlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  day: DayOfWeek | null;
  period: number | null;
  classId: string | null;
  entry?: ScheduleEntry | null;
  classes: SchoolClass[];
  subjects: Subject[];
  teachers: Teacher[];
  onSave: (entry: ScheduleEntry) => void;
  onDelete: (entryId: string) => void;
}

export const EditSlotModal: React.FC<EditSlotModalProps> = ({
  isOpen,
  onClose,
  day,
  period,
  classId,
  entry,
  classes,
  subjects,
  teachers,
  onSave,
  onDelete,
}) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedTeacher1, setSelectedTeacher1] = useState('');
  const [selectedTeacher2, setSelectedTeacher2] = useState('');
  const [isDual, setIsDual] = useState(false);
  const [room, setRoom] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [error, setError] = useState('');

  const currentClass = classes.find((c) => c.id === classId);

  // Available subjects (either from curriculum or all subjects)
  const curriculumSubjectIds = currentClass?.curriculum.map((c) => c.subjectId) || [];

  // Filter teachers qualified for selected subject
  const qualifiedTeachers = teachers.filter((t) =>
    t.subjectIds.includes(selectedSubjectId)
  );

  useEffect(() => {
    if (entry) {
      setSelectedSubjectId(entry.subjectId);
      setSelectedTeacher1(entry.teacherIds[0] || '');
      setSelectedTeacher2(entry.teacherIds[1] || '');
      setIsDual(entry.teacherIds.length > 1);
      setRoom(entry.room || '');
      setIsLocked(entry.isLocked || false);
    } else {
      // Pick first subject from class curriculum or all subjects
      const initialSubId = curriculumSubjectIds[0] || subjects[0]?.id || '';
      setSelectedSubjectId(initialSubId);
      const sub = subjects.find((s) => s.id === initialSubId);
      setRoom(sub?.defaultRoom || '');

      const initialQualified = teachers.filter((t) => t.subjectIds.includes(initialSubId));
      setSelectedTeacher1(initialQualified[0]?.id || '');
      setSelectedTeacher2('');
      setIsDual(false);
      setIsLocked(false);
    }
    setError('');
  }, [entry, isOpen, classId, subjects, teachers]);

  const handleSubjectChange = (newSubId: string) => {
    setSelectedSubjectId(newSubId);
    const sub = subjects.find((s) => s.id === newSubId);
    if (sub?.defaultRoom) {
      setRoom(sub.defaultRoom);
    }
    const matching = teachers.filter((t) => t.subjectIds.includes(newSubId));
    if (!matching.some((t) => t.id === selectedTeacher1)) {
      setSelectedTeacher1(matching[0]?.id || '');
    }
    if (!matching.some((t) => t.id === selectedTeacher2)) {
      setSelectedTeacher2(matching[1]?.id || '');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!day || period === null || !classId) return;

    if (!selectedSubjectId) {
      setError('Ընտրեք առարկան');
      return;
    }

    const teacherIds: string[] = [];
    if (selectedTeacher1) teacherIds.push(selectedTeacher1);
    if (isDual && selectedTeacher2) {
      if (selectedTeacher1 === selectedTeacher2) {
        setError('Մեկ դասաժամի համար ընտրեք 2 տարբեր ուսուցիչ');
        return;
      }
      teacherIds.push(selectedTeacher2);
    }

    const savedEntry: ScheduleEntry = {
      id: entry?.id || `entry-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      classId,
      day,
      period,
      subjectId: selectedSubjectId,
      teacherIds,
      room: room.trim() || undefined,
      isLocked,
    };

    onSave(savedEntry);
    onClose();
  };

  const handleDelete = () => {
    if (entry) {
      onDelete(entry.id);
      onClose();
    }
  };

  if (!day || period === null || !currentClass) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={entry ? 'Խմբագրել դասաժամը' : 'Նշանակել դասաժամ'}
      description={`${currentClass.name} դասարան • ${DAY_NAMES[day].full} • Դաս ${period}`}
      maxWidth="md"
    >
      <form onSubmit={handleSave} className="space-y-4">
        {/* Subject */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
            Առարկա <span className="text-rose-500">*</span>
          </label>
          <select
            value={selectedSubjectId}
            onChange={(e) => handleSubjectChange(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            {subjects.map((s) => {
              const inCurriculum = curriculumSubjectIds.includes(s.id);
              return (
                <option key={s.id} value={s.id}>
                  {s.name} {inCurriculum ? '★' : ''}
                </option>
              );
            })}
          </select>
        </div>

        {/* Dual Teacher checkbox */}
        <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 select-none">
          <input
            type="checkbox"
            checked={isDual}
            onChange={(e) => setIsDual(e.target.checked)}
            className="w-4 h-4 text-indigo-600 rounded border-slate-300"
          />
          <span>2 ուսուցիչ (դասարանի բաժանում ենթախմբերի)</span>
        </label>

        {/* Teachers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              {isDual ? 'Ուսուցիչ 1' : 'Ուսուցիչ'}
            </label>
            <select
              value={selectedTeacher1}
              onChange={(e) => setSelectedTeacher1(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">-- Առանց ուսուցչի --</option>
              {qualifiedTeachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.fullName}
                </option>
              ))}
            </select>
          </div>

          {isDual && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Ուսուցիչ 2
              </label>
              <select
                value={selectedTeacher2}
                onChange={(e) => setSelectedTeacher2(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">-- Առանց ուսուցչի --</option>
                {qualifiedTeachers
                  .filter((t) => t.id !== selectedTeacher1)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.fullName}
                    </option>
                  ))}
              </select>
            </div>
          )}
        </div>

        {/* Room */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
            Լսարան / Կաբինետ
          </label>
          <input
            type="text"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            placeholder="օր․՝ 204, Լաբ-1..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Lock toggle */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isLocked}
              onChange={(e) => setIsLocked(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300"
            />
            <div className="flex items-center gap-2">
              {isLocked ? (
                <Lock className="w-4 h-4 text-amber-600" />
              ) : (
                <Unlock className="w-4 h-4 text-slate-400" />
              )}
              <span className="text-xs font-medium text-slate-700">
                Ամրագրել դասը 🔒 (պաշտպանել ավտոմատ վերագեներացիայից)
              </span>
            </div>
          </label>
        </div>

        {error && (
          <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          {entry ? (
            <button
              type="button"
              onClick={handleDelete}
              className="px-3 py-2 rounded-xl text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Ջնջել դասը</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Չեղարկել
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all"
            >
              Պահպանել
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
