import React, { useState, useEffect } from 'react';
import { Subject } from '../../types/schedule';
import { Modal } from '../common/Modal';
import { PRESET_COLORS } from '../../utils/colors';
import { Palette } from 'lucide-react';

interface SubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (subjectData: Omit<Subject, 'id'>) => void;
  subject?: Subject | null;
}

export const SubjectModal: React.FC<SubjectModalProps> = ({
  isOpen,
  onClose,
  onSave,
  subject,
}) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#6366f1');
  const [defaultRoom, setDefaultRoom] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (subject) {
      setName(subject.name);
      setColor(subject.color);
      setDefaultRoom(subject.defaultRoom || '');
    } else {
      setName('');
      setColor('#6366f1');
      setDefaultRoom('');
    }
    setError('');
  }, [subject, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Առարկայի անվանումը պարտադիր է');
      return;
    }
    onSave({
      name: name.trim(),
      color,
      defaultRoom: defaultRoom.trim() || undefined,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={subject ? 'Խմբագրել առարկան' : 'Ավելացնել նոր առարկա'}
      description="Նշեք առարկայի անունը, գույնը աղյուսակի համար և լռելյայն լսարանը"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Name */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
            Առարկայի անվանում <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError('');
            }}
            placeholder="օրինակ՝ Մաթեմատիկա, Ֆիզիկա..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-slate-400"
          />
          {error && <p className="text-xs text-rose-500 mt-1">{error}</p>}
        </div>

        {/* Color Palette */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
            Գույն աղյուսակում (Բեյջ)
          </label>
          <div className="grid grid-cols-6 gap-2 mb-3">
            {PRESET_COLORS.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setColor(item.value)}
                style={{ backgroundColor: item.value }}
                className={`h-9 rounded-lg transition-transform flex items-center justify-center text-white shadow-sm ${
                  color === item.value
                    ? 'ring-2 ring-offset-2 ring-slate-800 scale-105'
                    : 'hover:scale-105 opacity-90'
                }`}
                title={item.name}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-500">Կամ ընտրեք հատուկ գույն՝</span>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent p-0"
            />
            <span className="text-xs font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
              {color}
            </span>
          </div>
        </div>

        {/* Default Classroom */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
            Լռելյայն լսարան / Կաբինետ (ոչ պարտադիր)
          </label>
          <input
            type="text"
            value={defaultRoom}
            onChange={(e) => setDefaultRoom(e.target.value)}
            placeholder="օրինակ՝ 204, Լաբ-1, Մարզադահլիճ..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Preview badge */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
            Նախադիտում
          </label>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center">
            <div
              className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 border shadow-xs"
              style={{
                backgroundColor: `${color}18`,
                color: color,
                borderColor: `${color}40`,
              }}
            >
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span>{name || 'Առարկայի անուն'}</span>
              {defaultRoom && (
                <span className="text-[10px] opacity-75">({defaultRoom})</span>
              )}
            </div>
          </div>
        </div>

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
            {subject ? 'Պահպանել փոփոխությունները' : 'Ավելացնել'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
