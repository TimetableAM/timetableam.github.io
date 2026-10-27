import React, { useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { useScheduleStore } from '../../store/useScheduleStore';
import { exportScheduleToExcel } from '../../utils/excelExport';
import {
  Download,
  Upload,
  Printer,
  Sparkles,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  FileSpreadsheet,
  Check,
  Layers,
  Users,
  GraduationCap,
  Loader2,
} from 'lucide-react';

export const DataExportTab: React.FC = () => {
  const {
    settings,
    subjects,
    teachers,
    classes,
    entries,
    loadDemoData,
    resetAllData,
    exportToJSON,
    importFromJSON,
    setActiveTab,
  } = useScheduleStore();

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportExcel = async () => {
    try {
      setIsExportingExcel(true);
      await exportScheduleToExcel({
        settings,
        classes,
        teachers,
        subjects,
        entries,
      });

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });

      setMessage({
        type: 'success',
        text: 'Excel ֆայլը (.xlsx) հաջողությամբ ստեղծվեց և ներբեռնվեց (4 առանձին թերթերով)։',
      });
    } catch (e) {
      console.error(e);
      setMessage({
        type: 'error',
        text: `Չհաջողվեց ստեղծել Excel ֆայլը: ${e instanceof Error ? e.message : 'անհայտ սխալ'}`,
      });
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleLoadDemo = () => {
    if (
      window.confirm(
        'Բեռնե՞լ դեմո-տվյալները։ Սա կլրացնի համակարգը 4 դասարանով, 13 ուսուցչով, 9 առարկայով և պատրաստի դասացուցակով։'
      )
    ) {
      loadDemoData();
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
      setMessage({
        type: 'success',
        text: 'Դեմո-տվյալները հաջողությամբ բեռնվեցին և դասացուցակը կազմվեց։',
      });
    }
  };

  const handlePrint = () => {
    setActiveTab('schedule');
    setTimeout(() => {
      window.print();
    }, 250);
  };

  const handleExportJSON = () => {
    try {
      const json = exportToJSON();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const dateStr = new Date().toISOString().slice(0, 10);
      link.href = url;
      link.download = `school_timetable_${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setMessage({
        type: 'success',
        text: 'Տվյալների արխիվային ֆայլը (JSON) հաջողությամբ ներբեռնվեց։',
      });
    } catch {
      setMessage({
        type: 'error',
        text: 'Չհաջողվեց արտահանել տվյալները։',
      });
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = importFromJSON(content);
      if (res.success) {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 },
        });
        setMessage({ type: 'success', text: res.message });
      } else {
        setMessage({ type: 'error', text: res.message });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleReset = () => {
    if (
      window.confirm(
        'ՈՒՇԱԴՐՈՒԹՅՈՒՆ․ Համոզվա՞ծ եք, որ ցանկանում եք ջնջել բոլոր տվյալները։ Այս գործողությունը հնարավոր չէ հետարկել։'
      )
    ) {
      resetAllData();
      setMessage({
        type: 'success',
        text: 'Բոլոր տվյալները զրոյացվեցին։',
      });
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Արտահանում, Տպում և Տվյալների Կառավարում
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Արտահանեք դասացուցակը պրոֆեսիոնալ Excel ֆորմատով, տպեք պատրաստի թերթերը կամ պահպանեք պահուստային պատճեններ
        </p>
      </div>

      {/* Alert message if any */}
      {message && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs font-medium animate-fadeIn ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setMessage(null)}
            className="text-slate-400 hover:text-slate-600 font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* Current DB summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-400 font-medium">Առարկաներ</div>
          <div className="text-2xl font-bold text-slate-800 mt-1">{subjects.length}</div>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-400 font-medium">Ուսուցիչներ</div>
          <div className="text-2xl font-bold text-slate-800 mt-1">{teachers.length}</div>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-400 font-medium">Դասարաններ</div>
          <div className="text-2xl font-bold text-slate-800 mt-1">{classes.length}</div>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-400 font-medium">Դասեր ցուցակում</div>
          <div className="text-2xl font-bold text-indigo-600 mt-1">{entries.length}</div>
        </div>
      </div>

      {/* Featured Card: Excel Export (.XLSX) */}
      <div className="p-6 sm:p-7 bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/50 rounded-2xl border-2 border-emerald-300 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-200">
                <FileSpreadsheet className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                  Նոր հնարավորություն • Pro Ձևաչափ
                </span>
                <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                  Արտահանել ամբողջական Excel (.XLSX) ֆայլ
                </h2>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Ստեղծում է բազմաէջ, նրբագեղ ձևավորված Excel աշխատանքային գիրք, որը միանգամից հարմար է ինչպես <strong>աշակերտների ու ծնողների</strong>, այնպես էլ <strong>ուսուցիչների ու տնօրինության</strong> համար։
            </p>

            {/* Excel Sheet Features Pills */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs text-slate-700">
              <div className="flex items-start gap-2 bg-white/80 p-2.5 rounded-xl border border-emerald-200/70">
                <Layers className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-semibold text-slate-800">Թերթ 1․ Ընդհանուր դասացուցակ</span>
                  <p className="text-[11px] text-slate-500">Բոլոր դասարանների ամփոփ մատրիցա</p>
                </div>
              </div>

              <div className="flex items-start gap-2 bg-white/80 p-2.5 rounded-xl border border-emerald-200/70">
                <GraduationCap className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-semibold text-slate-800">Թերթ 2․ Ըստ դասարանների</span>
                  <p className="text-[11px] text-slate-500">Առանձին պատրաստի աղյուսակ աշակերտների համար</p>
                </div>
              </div>

              <div className="flex items-start gap-2 bg-white/80 p-2.5 rounded-xl border border-emerald-200/70">
                <Users className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-semibold text-slate-800">Թերթ 3․ Ըստ ուսուցիչների</span>
                  <p className="text-[11px] text-slate-500">Յուրաքանչյուր ուսուցչի անձնական գրաֆիկ</p>
                </div>
              </div>

              <div className="flex items-start gap-2 bg-white/80 p-2.5 rounded-xl border border-emerald-200/70">
                <Check className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-semibold text-slate-800">Թերթ 4․ Ծանրաբեռնվածություն</span>
                  <p className="text-[11px] text-slate-500">Ուսուցիչների ժամաքանակ և վիճակագրություն</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-shrink-0 flex flex-col items-center justify-center">
            <button
              type="button"
              disabled={isExportingExcel}
              onClick={handleExportExcel}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-200 hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2.5 disabled:opacity-50"
            >
              {isExportingExcel ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Ֆայլը ձևավորվում է...</span>
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-4 h-4 stroke-[2.2]" />
                  <span>Ներբեռնել Excel (.XLSX)</span>
                </>
              )}
            </button>
            <span className="text-[10px] text-slate-400 mt-2">
              Microsoft Excel, LibreOffice, Google Sheets
            </span>
          </div>
        </div>
      </div>

      {/* Action Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Load Demo Data */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
              <Sparkles className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-slate-800">
              Բեռնել դեմո-տվյալներ
            </h2>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Ակնթարթորեն լրացրեք հավելվածը պատրաստի օրինակով (4 դասարան՝ 8Ա, 9Ա, 10Ա, 11Ա, 13 ուսուցիչ՝ իրենց հարմար ժամերով և ավտոմատ կազմված դասացուցակով)։
            </p>
          </div>

          <button
            type="button"
            onClick={handleLoadDemo}
            className="mt-6 w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-200 transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Բեռնել դեմո բազան</span>
          </button>
        </div>

        {/* Card 2: Print Timetable */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center mb-4">
              <Printer className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-slate-800">
              Տպել / Պահպանել PDF
            </h2>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Բացում է դասացուցակի մաքուր, տպագրության համար օպտիմիզացված տարբերակը (թաքցնում է կառավարման վահանակները և կոճակները)։
            </p>
          </div>

          <button
            type="button"
            onClick={handlePrint}
            className="mt-6 w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>Տպել դասացուցակը</span>
          </button>
        </div>

        {/* Card 3: Export JSON */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-4">
              <Download className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-slate-800">
              Արտահանել բազան (JSON)
            </h2>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Ներբեռնեք դպրոցի ամբողջ տվյալների բազան (առարկաներ, ուսուցիչներ, պլաններ, դասացուցակ) մեկ ֆայլի տեսքով՝ այլ համակարգչում օգտագործելու համար։
            </p>
          </div>

          <button
            type="button"
            onClick={handleExportJSON}
            className="mt-6 w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Ներբեռնել .JSON ֆայլը</span>
          </button>
        </div>

        {/* Card 4: Import JSON */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center mb-4">
              <Upload className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-slate-800">
              Ներմուծել բազան (JSON)
            </h2>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Վերականգնեք նախկինում պահպանված `.json` պահուստային ֆայլը։ Բոլոր տվյալները կթարմացվեն։
            </p>
          </div>

          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportFile}
              accept=".json"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-6 w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4 text-slate-500" />
              <span>Ընտրել .JSON ֆայլը</span>
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone: Reset Data */}
      <div className="p-6 bg-rose-50/50 rounded-2xl border border-rose-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-rose-900 flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-rose-600" />
            <span>Զրոյացնել ամբողջ բազան</span>
          </h2>
          <p className="text-xs text-rose-700 mt-1">
            Ջնջում է բոլոր առարկաները, ուսուցիչներին, դասարանները և դասացուցակը։
          </p>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 transition-all flex items-center gap-2"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Մաքրել բոլոր տվյալները</span>
        </button>
      </div>
    </div>
  );
};
