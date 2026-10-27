import React, { useState, useEffect } from 'react';
import { CurriculumItem, Subject, Teacher } from '../../types/schedule';
import { Modal } from '../common/Modal';
import { Minus, Plus, Users, UserCheck } from 'lucide-react';

interface CurriculumModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Omit<CurriculumItem, 'id'>) => void;
  curriculumItem?: CurriculumItem | null;
  subjects: Subject[];
  teachers: Teacher[];
  className: string;
}

export const CurriculumModal: React.FC<CurriculumModalProps> = ({
  isOpen,
  onClose,
  onSave,
  curriculumItem,
  subjects,
  teachers,
  className,
}) => {
  const [subjectId, setSubjectId] = useState('');
  const [hoursPerWeek, setHoursPerWeek] = useState(2);
  const [isFixedTeacher, setIsFixedTeacher] = useState(false);
  const [isDualTeacher, setIsDualTeacher] = useState(false);
  const [teacher1Id, setTeacher1Id] = useState('');
  const [teacher2Id, setTeacher2Id] = useState('');
  const [room, setRoom] = useState('');
  const [error, setError] = useState('');

  // Teachers who can teach the currently selected subject
  const availableTeachers = teachers.filter((t) => t.subjectIds.includes(subjectId));

  useEffect(() => {
    if (curriculumItem) {
      setSubjectId(curriculumItem.subjectId);
      setHoursPerWeek(curriculumItem.hoursPerWeek);
      setIsFixedTeacher(curriculumItem.isFixedTeacher);
      setIsDualTeacher(curriculumItem.isDualTeacher);
      setTeacher1Id(curriculumItem.assignedTeacherIds[0] || '');
      setTeacher2Id(curriculumItem.assignedTeacherIds[1] || '');
      setRoom(curriculumItem.room || '');
    } else {
      setSubjectId(subjects[0]?.id || '');
      setHoursPerWeek(2);
      setIsFixedTeacher(false);
      setIsDualTeacher(false);
      setTeacher1Id('');
      setTeacher2Id('');
      setRoom('');
    }
    setError('');
  }, [curriculumItem, isOpen, subjects]);

  // When subject changes, reset teacher selection if they don't match
  const handleSubjectChange = (newSubjectId: string) => {
    setSubjectId(newSubjectId);
    const sub = subjects.find((s) => s.id === newSubjectId);
    if (sub?.defaultRoom && !room) {
      setRoom(sub.defaultRoom);
    }
    const matchingTeachers = teachers.filter((t) => t.subjectIds.includes(newSubjectId));
    if (!matchingTeachers.some((t) => t.id === teacher1Id)) {
      setTeacher1Id(matchingTeachers[0]?.id || '');
    }
    if (!matchingTeachers.some((t) => t.id === teacher2Id)) {
      setTeacher2Id(matchingTeachers[1]?.id || '');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectId) {
      setError('Ընտրեք առարկան');
      return;
    }
    if (hoursPerWeek <= 0) {
      setError('Դասաժամերի քանակը պետք է լինի առնվազն 1');
      return;
    }

    const assignedTeacherIds: string[] = [];
    if (isFixedTeacher) {
      if (!teacher1Id) {
        setError('Ընտրեք հիմնական ուսուցչին');
        return;
      }
      assignedTeacherIds.push(teacher1Id);

      if (isDualTeacher) {
        if (!teacher2Id) {
          setError('Ընտրեք երկրորդ ենթախմբի ուսուցչին');
          return;
        }
        if (teacher1Id === teacher2Id) {
          setError('Մեկ դասաժամի համար ընտրեք երկու տարբեր ուսուցիչ');
          return;
        }
        assignedTeacherIds.push(teacher2Id);
      }
    }

    onSave({
      subjectId,
      hoursPerWeek,
      isFixedTeacher,
      isDualTeacher,
      assignedTeacherIds,
      room: room.trim() || undefined,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={curriculumItem ? 'Խմբագրել ուսումնական առարկան' : 'Ավելացնել առարկա պլանում'}
      description={`Դասարան՝ ${className}։ Կարգավորեք ժամաքանակը և ուսուցիչների կցումը`}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Subject select */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
            Առարկա <span className="text-rose-500">*</span>
          </label>
          <select
            value={subjectId}
            onChange={(e) => handleSubjectChange(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            {subjects.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.name}
              </option>
            ))}
          </select>
        </div>

        {/* Hours per week stepper */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
            Շաբաթական դասաժամեր <span className="text-rose-500">*</span>
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setHoursPerWeek(Math.max(1, hoursPerWeek - 1))}
              className="w-10 h-10 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-700 transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
            <div className="w-20 text-center font-bold text-lg text-slate-800">
              {hoursPerWeek} <span className="text-xs font-normal text-slate-400">ժամ</span>
            </div>
            <button
              type="button"
              onClick={() => setHoursPerWeek(Math.min(15, hoursPerWeek + 1))}
              className="w-10 h-10 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
            <span className="text-xs text-slate-400 ml-2">
              (օրինակ՝ 4 ժամ շաբաթական = 4 դասացուցակի սլոտ)
            </span>
          </div>
        </div>

        {/* Checkbox: Dual Teacher (Subgroups) */}
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isDualTeacher}
              onChange={(e) => setIsDualTeacher(e.target.checked)}
              className="w-4 h-4 mt-0.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
            <div>
              <div className="text-sm font-medium text-slate-800 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                <span>2 ուսուցիչ միաժամանակ (խմբերի բաժանում)</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Դասարանը բաժանվում է 2 ենթախմբի (օր․՝ Օտար լեզու, Ինֆորմատիկա)
              </p>
            </div>
          </label>
        </div>

        {/* Checkbox: Fixed Teacher */}
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isFixedTeacher}
              onChange={(e) => setIsFixedTeacher(e.target.checked)}
              className="w-4 h-4 mt-0.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
            <div>
              <div className="text-sm font-medium text-slate-800 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-600" />
                <span>Ֆիքսված ուսուցիչ դասարանի համար</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Ամրագրել կոնկրետ ուսուցչի այս դասարանի համար (հակառակ դեպքում ալգորիթմն ինքը կընտրի)
              </p>
            </div>
          </label>

          {/* Teacher selectors if Fixed Teacher is checked */}
          {isFixedTeacher ? (
            <div className="pt-2 border-t border-slate-200 space-y-3">
              {availableTeachers.length === 0 ? (
                <div className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                  ⚠️ Այս առարկան դասավանդող ուսուցիչներ գրանցված չեն։ Նախ ավելացրեք ուսուցիչ «Ուսուցիչներ» բաժնում։
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      {isDualTeacher ? 'Ուսուցիչ 1 (Խումբ 1)' : 'Ուսուցիչ'}
                    </label>
                    <select
                      value={teacher1Id}
                      onChange={(e) => setTeacher1Id(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">-- Ընտրեք ուսուցչին --</option>
                      {availableTeachers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.fullName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {isDualTeacher && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Ուսուցիչ 2 (Խումբ 2)
                      </label>
                      <select
                        value={teacher2Id}
                        onChange={(e) => setTeacher2Id(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">-- Ընտրեք 2-րդ ուսուցչին --</option>
                        {availableTeachers
                          .filter((t) => t.id !== teacher1Id)
                          .map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.fullName}
                            </option>
                          ))}
                      </select>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="pt-2 border-t border-slate-200 text-xs text-indigo-700 bg-indigo-50/70 p-2.5 rounded-lg flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              <span>Ավտոընտրություն (ալգորիթմը կընտրի առարկայի ցանկացած ազատ ուսուցիչ)</span>
            </div>
          )}
        </div>

        {/* Room override */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
            Լսարան / Կաբինետ (ոչ պարտադիր)
          </label>
          <input
            type="text"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            placeholder="օրինակ՝ 204, Լաբ-1..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400"
          />
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Չեղարկել
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-200 transition-all active:scale-[0.98]"
          >
            {curriculumItem ? 'Պահպանել' : 'Ավելացնել պլանում'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
