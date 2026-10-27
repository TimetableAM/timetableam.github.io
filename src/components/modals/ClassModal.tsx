import React, { useState, useEffect } from 'react';
import { SchoolClass } from '../../types/schedule';
import { Modal } from '../common/Modal';

interface ClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  schoolClass?: SchoolClass | null;
}

export const ClassModal: React.FC<ClassModalProps> = ({
  isOpen,
  onClose,
  onSave,
  schoolClass,
}) => {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (schoolClass) {
      setName(schoolClass.name);
    } else {
      setName('');
    }
    setError('');
  }, [schoolClass, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Դասարանի անվանումը պարտադիր է (օր․՝ 9Ա)');
      return;
    }
    onSave(name.trim());
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={schoolClass ? 'Խմբագրել դասարանը' : 'Ավելացնել նոր դասարան'}
      description="Մուտքագրեք դասարանի անվանումը"
      maxWidth="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
            Դասարանի անվանում <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            autoFocus
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError('');
            }}
            placeholder="օրինակ՝ 9Ա, 10Բ, 11Գ..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400"
          />
          {error && <p className="text-xs text-rose-500 mt-1">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Չեղարկել
          </button>
          <button
            type="submit"
            className="px-5 py-2 rounded-xl text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all active:scale-95"
          >
            {schoolClass ? 'Պահպանել' : 'Ավելացնել'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
