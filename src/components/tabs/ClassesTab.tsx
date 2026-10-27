import React, { useState } from 'react';
import { useScheduleStore } from '../../store/useScheduleStore';
import { SchoolClass, CurriculumItem } from '../../types/schedule';
import { ClassModal } from '../modals/ClassModal';
import { CurriculumModal } from '../modals/CurriculumModal';
import { AvailabilityMatrix } from '../common/AvailabilityMatrix';
import {
  GraduationCap,
  Plus,
  Edit2,
  Trash2,
  BookOpen,
  Users,
  UserCheck,
  DoorOpen,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

export const ClassesTab: React.FC = () => {
  const {
    classes,
    subjects,
    teachers,
    settings,
    selectedClassId,
    setSelectedClassId,
    addClass,
    updateClass,
    deleteClass,
    batchSetClassAvailability,
    addCurriculumItem,
    updateCurriculumItem,
    deleteCurriculumItem,
  } = useScheduleStore();

  const [activeSubTab, setActiveSubTab] = useState<'curriculum' | 'availability'>('curriculum');
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<SchoolClass | null>(null);

  const [isCurriculumModalOpen, setIsCurriculumModalOpen] = useState(false);
  const [editingCurriculumItem, setEditingCurriculumItem] = useState<CurriculumItem | null>(null);

  // Active selected class
  const currentClass = classes.find((c) => c.id === selectedClassId) || classes[0] || null;

  const handleOpenAddClass = () => {
    setEditingClass(null);
    setIsClassModalOpen(true);
  };

  const handleOpenEditClass = (c: SchoolClass) => {
    setEditingClass(c);
    setIsClassModalOpen(true);
  };

  const handleSaveClass = (name: string) => {
    if (editingClass) {
      updateClass(editingClass.id, { name });
    } else {
      // Default class availability
      const initAvail: Record<string, boolean> = {};
      settings.activeDays.forEach((d) => {
        settings.periods.forEach((p) => {
          initAvail[`${d}-${p.number}`] = true;
        });
      });
      const created = addClass({
        name,
        availability: initAvail,
        curriculum: [],
      });
      setSelectedClassId(created.id);
    }
  };

  const handleDeleteClass = (c: SchoolClass) => {
    if (
      window.confirm(
        `Համոզվա՞ծ եք, որ ցանկանում եք ջնջել ${c.name} դասարանը։ Կջնջվեն նաև նրա բոլոր պլանավորված դասերը։`
      )
    ) {
      deleteClass(c.id);
    }
  };

  // Curriculum actions
  const handleOpenAddCurriculum = () => {
    setEditingCurriculumItem(null);
    setIsCurriculumModalOpen(true);
  };

  const handleOpenEditCurriculum = (item: CurriculumItem) => {
    setEditingCurriculumItem(item);
    setIsCurriculumModalOpen(true);
  };

  const handleSaveCurriculum = (itemData: Omit<CurriculumItem, 'id'>) => {
    if (!currentClass) return;
    if (editingCurriculumItem) {
      updateCurriculumItem(currentClass.id, editingCurriculumItem.id, itemData);
    } else {
      addCurriculumItem(currentClass.id, itemData);
    }
  };

  const handleDeleteCurriculum = (itemId: string) => {
    if (!currentClass) return;
    deleteCurriculumItem(currentClass.id, itemId);
  };

  // Total weekly hours in curriculum
  const totalWeeklyHours =
    currentClass?.curriculum.reduce((sum, item) => sum + item.hoursPerWeek, 0) || 0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Դասարաններ և Ուսումնական Պլան
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Կառավարեք դպրոցի դասարանները, յուրաքանչյուր դասարանի շաբաթական առարկայացանկը և հասանելի ժամերը
        </p>
      </div>

      {/* Main 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left column: Class list */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-indigo-600" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                Դասարաններ ({classes.length})
              </h2>
            </div>
            <button
              type="button"
              onClick={handleOpenAddClass}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ավելացնել</span>
            </button>
          </div>

          <div className="p-2 space-y-1 max-h-[600px] overflow-y-auto">
            {classes.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                Դասարաններ չկան։ Սեղմեք «Ավելացնել»։
              </div>
            ) : (
              classes.map((cls) => {
                const isSelected = currentClass?.id === cls.id;
                const hours = cls.curriculum.reduce((sum, c) => sum + c.hoursPerWeek, 0);

                return (
                  <div
                    key={cls.id}
                    onClick={() => setSelectedClassId(cls.id)}
                    className={`p-3 rounded-xl cursor-pointer transition-all duration-150 flex items-center justify-between group ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-indigo-50 text-indigo-700'
                        }`}
                      >
                        {cls.name}
                      </div>
                      <div>
                        <div className="font-semibold text-sm">{cls.name}</div>
                        <div
                          className={`text-xs ${
                            isSelected ? 'text-indigo-100' : 'text-slate-400'
                          }`}
                        >
                          {cls.curriculum.length} առարկա • {hours} ժամ
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditClass(cls);
                        }}
                        className={`p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity ${
                          isSelected
                            ? 'text-white hover:bg-white/20'
                            : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-100'
                        }`}
                        title="Վերանվանել"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {classes.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClass(cls);
                          }}
                          className={`p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity ${
                            isSelected
                              ? 'text-white hover:bg-white/20'
                              : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                          }`}
                          title="Ջնջել դասարանը"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <ChevronRight
                        className={`w-4 h-4 transition-transform ${
                          isSelected ? 'text-white' : 'text-slate-300'
                        }`}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right column: Selected Class details */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {currentClass ? (
            <div>
              {/* Class Header with Subtabs */}
              <div className="p-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-xl bg-indigo-600 text-white font-bold text-base shadow-xs">
                      {currentClass.name}
                    </span>
                    <h2 className="text-lg font-bold text-slate-800">
                      Դասարանի կարգավորումներ
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Ընդհանուր ծանրաբեռնվածություն՝{' '}
                    <span className="font-semibold text-slate-800">{totalWeeklyHours} ժամ/շաբաթ</span>
                  </p>
                </div>

                {/* Sub-tab pills */}
                <div className="flex items-center bg-slate-100/80 p-1 rounded-xl text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setActiveSubTab('curriculum')}
                    className={`px-3.5 py-1.5 rounded-lg transition-all ${
                      activeSubTab === 'curriculum'
                        ? 'bg-white text-indigo-600 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Ուսումնական պլան ({currentClass.curriculum.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveSubTab('availability')}
                    className={`px-3.5 py-1.5 rounded-lg transition-all ${
                      activeSubTab === 'availability'
                        ? 'bg-white text-indigo-600 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Հասանելի ժամեր
                  </button>
                </div>
              </div>

              {/* Sub-tab A: Curriculum */}
              {activeSubTab === 'curriculum' && (
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-800">
                        Առարկայացանկ և ուսուցիչների ամրագրում
                      </h3>
                      <p className="text-xs text-slate-400">
                        Նշեք յուրաքանչյուր առարկայի ժամաքանակը և ուսուցչի կցման կանոնները
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleOpenAddCurriculum}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-200 transition-all flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Ավելացնել առարկա</span>
                    </button>
                  </div>

                  {currentClass.curriculum.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400">
                      <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-40" />
                      <p className="text-xs font-medium">
                        Առարկայացանկը դատարկ է
                      </p>
                      <button
                        type="button"
                        onClick={handleOpenAddCurriculum}
                        className="mt-3 px-3 py-1.5 rounded-lg text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100"
                      >
                        Ավելացնել առաջին առարկան
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {currentClass.curriculum.map((item) => {
                        const sub = subjects.find((s) => s.id === item.subjectId);
                        const assignedTeachers = item.assignedTeacherIds
                          .map((tId) => teachers.find((t) => t.id === tId)?.fullName)
                          .filter(Boolean);

                        return (
                          <div
                            key={item.id}
                            className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex flex-wrap items-center justify-between gap-3 group"
                          >
                            <div className="flex items-center gap-3">
                              {/* Color bar & icon */}
                              <div
                                className="w-2.5 h-10 rounded-full"
                                style={{ backgroundColor: sub?.color || '#cbd5e1' }}
                              />

                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-sm text-slate-800">
                                    {sub?.name || 'Առարկա'}
                                  </span>

                                  {/* Subgroups badge */}
                                  {item.isDualTeacher && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-violet-50 text-violet-700 border border-violet-200">
                                      <Users className="w-3 h-3" />
                                      <span>2 ուսուցիչ (խմբեր)</span>
                                    </span>
                                  )}

                                  {/* Room badge */}
                                  {item.room && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-600">
                                      <DoorOpen className="w-3 h-3 text-slate-400" />
                                      <span>{item.room}</span>
                                    </span>
                                  )}
                                </div>

                                {/* Teacher assignment status */}
                                <div className="mt-1 flex items-center gap-2 text-xs">
                                  {item.isFixedTeacher ? (
                                    <span className="flex items-center gap-1 text-emerald-700 font-medium">
                                      <UserCheck className="w-3.5 h-3.5" />
                                      <span>
                                        Ֆիքսված՝ {assignedTeachers.join(' / ') || 'Ընտրված չէ'}
                                      </span>
                                    </span>
                                  ) : (
                                    <span className="text-indigo-600 flex items-center gap-1">
                                      <Sparkles className="w-3 h-3" />
                                      <span>Ավտոընտրություն (ազատ ուսուցիչ)</span>
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Hours and actions */}
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <span className="font-bold text-base text-slate-800">
                                  {item.hoursPerWeek}
                                </span>
                                <span className="text-xs text-slate-400 ml-1">ժամ/շաբաթ</span>
                              </div>

                              <div className="flex items-center gap-1 border-l border-slate-100 pl-3">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditCurriculum(item)}
                                  className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                  title="Խմբագրել"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCurriculum(item.id)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                  title="Ջնջել"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Sub-tab B: Class Availability Matrix */}
              {activeSubTab === 'availability' && (
                <div className="p-6 space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800">
                      Դասարանի հասանելի ժամանակացույց (Մատրիցա)
                    </h3>
                    <p className="text-xs text-slate-400">
                      Անջատեք այն ժամերը, երբ {currentClass.name} դասարանը չպետք է դասեր ունենա (օր․՝ 7-րդ դասերը կամ շաբաթ օրը)
                    </p>
                  </div>

                  <AvailabilityMatrix
                    availability={currentClass.availability}
                    onChange={(newAvail) =>
                      batchSetClassAvailability(currentClass.id, newAvail)
                    }
                    settings={settings}
                    activeLabel="Դասերի թույլատրելի ժամ"
                    inactiveLabel="Արգելված ժամ (դասեր չդնել)"
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400">
              Ընտրեք դասարանը ձախ ցուցակից
            </div>
          )}
        </div>
      </div>

      {/* Class Name Modal */}
      <ClassModal
        isOpen={isClassModalOpen}
        onClose={() => setIsClassModalOpen(false)}
        onSave={handleSaveClass}
        schoolClass={editingClass}
      />

      {/* Curriculum Item Modal */}
      {currentClass && (
        <CurriculumModal
          isOpen={isCurriculumModalOpen}
          onClose={() => setIsCurriculumModalOpen(false)}
          onSave={handleSaveCurriculum}
          curriculumItem={editingCurriculumItem}
          subjects={subjects}
          teachers={teachers}
          className={currentClass.name}
        />
      )}
    </div>
  );
};
