import React, { useState } from 'react';
import { useScheduleStore, TabType } from './store/useScheduleStore';
import { SubjectsAndBellsTab } from './components/tabs/SubjectsAndBellsTab';
import { TeachersTab } from './components/tabs/TeachersTab';
import { ClassesTab } from './components/tabs/ClassesTab';
import { ScheduleGridTab } from './components/tabs/ScheduleGridTab';
import { DataExportTab } from './components/tabs/DataExportTab';
import {
  Calendar,
  BookOpen,
  Users,
  GraduationCap,
  HardDrive,
  Printer,
  Menu,
  X,
} from 'lucide-react';

export const App: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    classes,
    teachers,
    subjects,
    entries,
  } = useScheduleStore();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const tabs: { id: TabType; label: string; icon: React.FC<{ className?: string }>; count?: number }[] = [
    { id: 'schedule', label: 'Դասացուցակ', icon: Calendar, count: entries.length },
    { id: 'subjects_bells', label: 'Առարկաներ և Զանգեր', icon: BookOpen, count: subjects.length },
    { id: 'teachers', label: 'Ուսուցիչներ', icon: Users, count: teachers.length },
    { id: 'classes', label: 'Դասարաններ և Պլան', icon: GraduationCap, count: classes.length },
    { id: 'export', label: 'Արտահանում և Տպում', icon: HardDrive },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <Calendar className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-slate-900">
                  Դպրոցի Դասացուցակ
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  SPA v1.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                School Timetable Builder • Ավտոմատ գեներացիա և խմբագրում
              </p>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center gap-2 ${
                    isActive
                      ? 'bg-white text-indigo-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-700 font-bold'
                          : 'bg-slate-200/80 text-slate-500'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Quick Actions (Print & Mobile Toggle) */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setActiveTab('schedule');
                setTimeout(() => window.print(), 200);
              }}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 shadow-2xs transition-colors"
              title="Արագ տպել դասացուցակը"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Տպել</span>
            </button>

            {/* Mobile Hamburger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-100 px-4 py-3 bg-white space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </div>
                  {tab.count !== undefined && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold">
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </header>

      {/* Main Content View */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'schedule' && <ScheduleGridTab />}
        {activeTab === 'subjects_bells' && <SubjectsAndBellsTab />}
        {activeTab === 'teachers' && <TeachersTab />}
        {activeTab === 'classes' && <ClassesTab />}
        {activeTab === 'export' && <DataExportTab />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 px-6 text-center text-xs text-slate-400 no-print">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <span>Դպրոցի Դասացուցակի Կառավարման Համակարգ • SPA</span>
          <span>Տվյալներն ավտոմատ պահպանվում են localStorage-ում</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
