import React, { useState } from 'react';
import { useScheduleStore } from '../../store/useScheduleStore';
import { DayOfWeek, DAY_NAMES, Subject } from '../../types/schedule';
import { SubjectModal } from '../modals/SubjectModal';
import {
  BookOpen,
  Plus,
  Trash2,
  Edit2,
  Clock,
  DoorOpen,
  Calendar,
} from 'lucide-react';

export const SubjectsAndBellsTab: React.FC = () => {
  const {
    settings,
    subjects,
    teachers,
    updatePeriod,
    addPeriod,
    removePeriod,
    toggleActiveDay,
    addSubject,
    updateSubject,
    deleteSubject,
  } = useScheduleStore();

  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  const allDays: DayOfWeek[] = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'];

  const handleOpenAddSubject = () => {
    setEditingSubject(null);
    setIsSubjectModalOpen(true);
  };

  const handleOpenEditSubject = (sub: Subject) => {
    setEditingSubject(sub);
    setIsSubjectModalOpen(true);
  };

  const handleSaveSubject = (data: Omit<Subject, 'id'>) => {
    if (editingSubject) {
      updateSubject(editingSubject.id, data);
    } else {
      addSubject(data);
    }
  };

  const handleDeleteSubject = (sub: Subject) => {
    if (
      window.confirm(
        `Համոզվա՞ծ եք, որ ցանկանում եք ջնջել «${sub.name}» առարկան։ Այն կջնջվի նաև դասացուցակից և ուսումնական պլաններից։`
      )
    ) {
      deleteSubject(sub.id);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Tab Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Առարկաներ և Զանգերի Ցանց
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Կառավարեք դպրոցի ուսումնական առարկաները, աշխատանքային օրերը և դասաժամերի ժամանակացույցը
        </p>
      </div>

      {/* Block 1: Bells Grid and Days of Week */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-800">
                Զանգերի ցանց և Շաբաթվա աշխատանքային օրեր
              </h2>
              <p className="text-xs text-slate-500">
                Ակտիվ օրերի ընտրություն և դասաժամերի տևողության կարգավորում
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Active Days Toggle */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>Աշխատանքային օրեր (Շաբաթվա ռեժիմ)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {allDays.map((day) => {
                const isActive = settings.activeDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleActiveDay(day)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 flex items-center gap-2 border ${
                      isActive
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-200'
                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-700'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-current opacity-70" />
                    <span>{DAY_NAMES[day].full}</span>
                    <span className="text-[10px] opacity-75 font-normal">({DAY_NAMES[day].short})</span>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-slate-400 mt-2">
              * Օրինակ՝ ընտրեք 5-օրյա (Երկուշաբթի–Ուրբաթ) կամ 6-օրյա (ներառյալ Շաբաթ) ռեժիմ
            </p>
          </div>

          <hr className="border-slate-100" />

          {/* Periods List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Դասաժամերի ցուցակ ({settings.periods.length} դաս)
                </label>
                <p className="text-xs text-slate-400">
                  Սահմանեք յուրաքանչյուր դասաժամի սկիզբը և ավարտը
                </p>
              </div>

              <button
                type="button"
                onClick={addPeriod}
                className="px-3 py-1.5 rounded-xl text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ավելացնել դասաժամ</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {settings.periods.map((period) => (
                <div
                  key={period.number}
                  className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:shadow-xs transition-all duration-150 flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100/70 text-indigo-700 flex items-center justify-center font-bold text-xs">
                      {period.number}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="time"
                        value={period.startTime}
                        onChange={(e) =>
                          updatePeriod(period.number, e.target.value, period.endTime)
                        }
                        className="w-16 px-1.5 py-1 text-xs font-mono font-medium rounded-md border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <span className="text-slate-400 text-xs">-</span>
                      <input
                        type="time"
                        value={period.endTime}
                        onChange={(e) =>
                          updatePeriod(period.number, period.startTime, e.target.value)
                        }
                        className="w-16 px-1.5 py-1 text-xs font-mono font-medium rounded-md border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  {settings.periods.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePeriod(period.number)}
                      className="p-1 text-slate-300 hover:text-rose-600 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                      title="Հեռացնել դասաժամը"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Block 2: Subjects */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-800">
                Ուսումնական առարկաներ ({subjects.length})
              </h2>
              <p className="text-xs text-slate-500">
                Դպրոցի բոլոր առարկաների ցանկը՝ իրենց գույներով և լռելյայն լսարաններով
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenAddSubject}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-200 transition-all active:scale-95 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Ավելացնել առարկա</span>
          </button>
        </div>

        <div className="p-6">
          {subjects.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="text-sm font-medium">Առարկաներ չեն գտնվել</p>
              <p className="text-xs mt-1">
                Ավելացրեք առաջին առարկան կոճակով կամ բեռնեք դեմո-տվյալներ
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {subjects.map((sub) => {
                // Count how many teachers teach this subject
                const qualifiedCount = teachers.filter((t) =>
                  t.subjectIds.includes(sub.id)
                ).length;

                return (
                  <div
                    key={sub.id}
                    className="p-4 rounded-xl border border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-xs transition-all duration-150 flex flex-col justify-between group relative overflow-hidden"
                  >
                    {/* Color top accent */}
                    <div
                      className="absolute top-0 left-0 right-0 h-1.5"
                      style={{ backgroundColor: sub.color }}
                    />

                    <div>
                      <div className="flex items-start justify-between gap-2 mt-1">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: sub.color }}
                          />
                          <h3 className="font-semibold text-slate-800 text-sm line-clamp-1">
                            {sub.name}
                          </h3>
                        </div>
                      </div>

                      <div className="mt-3 space-y-1 text-xs text-slate-500">
                        {sub.defaultRoom && (
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <DoorOpen className="w-3.5 h-3.5 text-slate-400" />
                            <span>Լսարան՝ <span className="font-medium text-slate-800">{sub.defaultRoom}</span></span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                          <span>
                            {qualifiedCount} {qualifiedCount === 1 ? 'ուսուցիչ' : 'ուսուցիչներ'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEditSubject(sub)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Խմբագրել"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSubject(sub)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Ջնջել"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      <SubjectModal
        isOpen={isSubjectModalOpen}
        onClose={() => setIsSubjectModalOpen(false)}
        onSave={handleSaveSubject}
        subject={editingSubject}
      />
    </div>
  );
};
