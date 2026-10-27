import React, { useState, useMemo } from 'react';
import { useScheduleStore } from '../../store/useScheduleStore';
import { Teacher } from '../../types/schedule';
import { TeacherModal } from '../modals/TeacherModal';
import {
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  Clock,
  Calendar,
} from 'lucide-react';

export const TeachersTab: React.FC = () => {
  const {
    teachers,
    subjects,
    settings,
    entries,
    addTeacher,
    updateTeacher,
    deleteTeacher,
  } = useScheduleStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubjectId, setFilterSubjectId] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);

  const handleOpenAdd = () => {
    setEditingTeacher(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (t: Teacher) => {
    setEditingTeacher(t);
    setIsModalOpen(true);
  };

  const handleSave = (data: Omit<Teacher, 'id'>) => {
    if (editingTeacher) {
      updateTeacher(editingTeacher.id, data);
    } else {
      addTeacher(data);
    }
  };

  const handleDelete = (t: Teacher) => {
    if (
      window.confirm(
        `Համոզվա՞ծ եք, որ ցանկանում եք ջնջել ${t.fullName}-ին։ Այս ուսուցչի դասերը կհեռացվեն նաև դասացուցակից։`
      )
    ) {
      deleteTeacher(t.id);
    }
  };

  // Filtered teachers list
  const filteredTeachers = useMemo(() => {
    return teachers.filter((t) => {
      const matchesSearch = t.fullName
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesSubject =
        filterSubjectId === 'all' || t.subjectIds.includes(filterSubjectId);
      return matchesSearch && matchesSubject;
    });
  }, [teachers, searchQuery, filterSubjectId]);

  // Overall stats
  const totalSlotsCount = settings.activeDays.length * settings.periods.length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Ուսուցչական Կազմ
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Կառավարեք ուսուցիչների տվյալները, դասավանդվող առարկաները և հարմար ժամանակացույցի մատրիցան
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-200 transition-all active:scale-95 flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Ավելացնել ուսուցիչ</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Որոնել ըստ ԱԱՀ..."
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400"
            />
          </div>

          {/* Subject Filter */}
          <div className="w-56">
            <select
              value={filterSubjectId}
              onChange={(e) => setFilterSubjectId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Բոլոր առարկաները ({subjects.length})</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Ցուցադրված է՝ <span className="font-bold text-slate-800">{filteredTeachers.length}</span> / {teachers.length} ուսուցիչ
        </div>
      </div>

      {/* Teachers Grid */}
      {filteredTeachers.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-base font-semibold text-slate-700">Ուսուցիչներ չեն գտնվել</p>
          <p className="text-xs text-slate-400 mt-1">
            Փորձեք փոխել որոնման կամ ֆիլտրի պարամետրերը
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTeachers.map((t) => {
            // Calculate current scheduled hours
            const scheduledHours = entries.filter((e) => e.teacherIds.includes(t.id)).length;
            const maxHours = t.maxHoursPerWeek || 20;
            const isOverloaded = scheduledHours > maxHours;

            // Calculate availability stats
            let availableSlots = 0;
            settings.activeDays.forEach((day) => {
              settings.periods.forEach((p) => {
                if (t.availability[`${day}-${p.number}`] ?? true) {
                  availableSlots++;
                }
              });
            });

            return (
              <div
                key={t.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all duration-150 p-5 flex flex-col justify-between group"
              >
                <div>
                  {/* Top info */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm shadow-xs">
                        {t.fullName.slice(0, 1)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors">
                          {t.fullName}
                        </h3>
                        <p className="text-[11px] text-slate-400">
                          {t.subjectIds.length} դասավանդվող առարկա
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(t)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Խմբագրել"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(t)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Ջնջել"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Subjects Badges */}
                  <div className="mt-3.5 flex flex-wrap gap-1">
                    {t.subjectIds.map((subId) => {
                      const sub = subjects.find((s) => s.id === subId);
                      if (!sub) return null;
                      return (
                        <span
                          key={sub.id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border"
                          style={{
                            backgroundColor: `${sub.color}14`,
                            color: sub.color,
                            borderColor: `${sub.color}35`,
                          }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: sub.color }}
                          />
                          <span>{sub.name}</span>
                        </span>
                      );
                    })}
                  </div>

                  {/* Workload and Availability stats */}
                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                    {/* Load progress */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-slate-500 font-medium">Շաբաթական ծանրաբեռնվածություն</span>
                        <span
                          className={`font-semibold ${
                            isOverloaded ? 'text-rose-600' : 'text-slate-700'
                          }`}
                        >
                          {scheduledHours} / {maxHours} ժամ
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isOverloaded
                              ? 'bg-rose-500'
                              : scheduledHours === maxHours
                              ? 'bg-emerald-500'
                              : 'bg-indigo-500'
                          }`}
                          style={{
                            width: `${Math.min(100, (scheduledHours / (maxHours || 1)) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Availability summary */}
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Հասանելիություն՝</span>
                      </span>
                      <span className="font-mono text-slate-700 font-medium">
                        {availableSlots} / {totalSlotsCount} ժամ ({Math.round((availableSlots / (totalSlotsCount || 1)) * 100)}%)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card footer action */}
                <div className="mt-4 pt-2">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(t)}
                    className="w-full py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 hover:text-indigo-600 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Կարգավորել հարմար ժամերը</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Teacher Modal */}
      <TeacherModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        teacher={editingTeacher}
        subjects={subjects}
        settings={settings}
      />
    </div>
  );
};
