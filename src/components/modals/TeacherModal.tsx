import React, { useState, useEffect } from 'react';
import { Subject, Teacher, AppSettings } from '../../types/schedule';
import { Modal } from '../common/Modal';
import { AvailabilityMatrix } from '../common/AvailabilityMatrix';
import { Check, Search } from 'lucide-react';

interface TeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (teacherData: Omit<Teacher, 'id'>) => void;
  teacher?: Teacher | null;
  subjects: Subject[];
  settings: AppSettings;
}

export const TeacherModal: React.FC<TeacherModalProps> = ({
  isOpen,
  onClose,
  onSave,
  teacher,
  subjects,
  settings,
}) => {
  const [fullName, setFullName] = useState('');
  const [subjectIds, setSubjectIds] = useState<string[]>([]);
  const [maxHoursPerWeek, setMaxHoursPerWeek] = useState<number>(20);
  const [availability, setAvailability] = useState<Record<string, boolean>>({});
  const [subjectSearch, setSubjectSearch] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (teacher) {
      setFullName(teacher.fullName);
      setSubjectIds(teacher.subjectIds || []);
      setMaxHoursPerWeek(teacher.maxHoursPerWeek || 20);
      setAvailability(teacher.availability || {});
    } else {
      setFullName('');
      setSubjectIds([]);
      setMaxHoursPerWeek(20);
      // Default all available
      const initAvail: Record<string, boolean> = {};
      settings.activeDays.forEach((d) => {
        settings.periods.forEach((p) => {
          initAvail[`${d}-${p.number}`] = true;
        });
      });
      setAvailability(initAvail);
    }
    setSubjectSearch('');
    setError('');
  }, [teacher, isOpen, settings]);

  const toggleSubject = (subId: string) => {
    if (subjectIds.includes(subId)) {
      setSubjectIds(subjectIds.filter((id) => id !== subId));
    } else {
      setSubjectIds([...subjectIds, subId]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('Ուսուցչի անուն-ազգանունը պարտադիր է');
      return;
    }
    if (subjectIds.length === 0) {
      setError('Ընտրեք գոնե մեկ առարկա, որը դասավանդում է ուսուցիչը');
      return;
    }
    onSave({
      fullName: fullName.trim(),
      subjectIds,
      maxHoursPerWeek: Number(maxHoursPerWeek) || 20,
      availability,
    });
    onClose();
  };

  const filteredSubjects = subjects.filter((s) =>
    s.name.toLowerCase().includes(subjectSearch.toLowerCase())
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={teacher ? 'Խմբագրել ուսուցչին' : 'Ավելացնել նոր ուսուցիչ'}
      description="Կարգավորեք ուսուցչի տվյալները, առարկաները և դասավանդման համար հարմար ժամերը"
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name and Max Hours */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Ուսուցչի ԱԱՀ (Անուն, Ազգանուն) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                if (error) setError('');
              }}
              placeholder="օրինակ՝ Արամ Գրիգորյան"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-slate-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Առավելագույն ժամ/շաբաթ
            </label>
            <input
              type="number"
              min={1}
              max={40}
              value={maxHoursPerWeek}
              onChange={(e) => setMaxHoursPerWeek(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Subjects Multi-select */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
            Դասավանդվող առարկաներ <span className="text-rose-500">*</span>
          </label>

          {/* Selected subjects badges */}
          <div className="flex flex-wrap gap-1.5 mb-2.5 min-h-[32px] p-2 bg-slate-50 rounded-xl border border-slate-200">
            {subjectIds.length === 0 ? (
              <span className="text-xs text-slate-400 self-center italic">
                Առարկաներ ընտրված չեն (ընտրեք ցանկից ներքևում)
              </span>
            ) : (
              subjectIds.map((subId) => {
                const sub = subjects.find((s) => s.id === subId);
                if (!sub) return null;
                return (
                  <span
                    key={sub.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border shadow-xs"
                    style={{
                      backgroundColor: `${sub.color}15`,
                      color: sub.color,
                      borderColor: `${sub.color}40`,
                    }}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: sub.color }}
                    />
                    <span>{sub.name}</span>
                    <button
                      type="button"
                      onClick={() => toggleSubject(sub.id)}
                      className="hover:opacity-75 font-bold ml-0.5"
                    >
                      ×
                    </button>
                  </span>
                );
              })
            )}
          </div>

          {/* Search and picker list */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
            <div className="relative border-b border-slate-100">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={subjectSearch}
                onChange={(e) => setSubjectSearch(e.target.value)}
                placeholder="Որոնել առարկաների ցանկում..."
                className="w-full pl-9 pr-3.5 py-2 text-xs focus:outline-none bg-transparent"
              />
            </div>
            <div className="max-h-36 overflow-y-auto p-1.5 grid grid-cols-1 sm:grid-cols-2 gap-1">
              {filteredSubjects.length === 0 ? (
                <div className="text-xs text-slate-400 p-2 col-span-2 text-center">
                  Առարկաներ չեն գտնվել
                </div>
              ) : (
                filteredSubjects.map((sub) => {
                  const isSelected = subjectIds.includes(sub.id);
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => toggleSubject(sub.id)}
                      className={`flex items-center justify-between p-2 rounded-lg text-xs transition-colors ${
                        isSelected
                          ? 'bg-indigo-50/80 text-indigo-900 font-medium'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: sub.color }}
                        />
                        <span className="truncate">{sub.name}</span>
                      </div>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Interactive Availability Matrix */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Մատրիցա․ «Հարմար օրեր և ժամեր»
              </label>
              <p className="text-[11px] text-slate-400">
                Նշեք ժամերը, երբ ուսուցիչը հասանելի է դասավանդման համար
              </p>
            </div>
          </div>

          <AvailabilityMatrix
            availability={availability}
            onChange={setAvailability}
            settings={settings}
            activeLabel="Հարմար է"
            inactiveLabel="Զբաղված է"
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
            {teacher ? 'Պահպանել փոփոխությունները' : 'Ավելացնել ուսուցչին'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
