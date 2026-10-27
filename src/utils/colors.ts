export const PRESET_COLORS = [
  { name: 'Indigo', value: '#6366f1', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  { name: 'Emerald', value: '#10b981', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  { name: 'Amber', value: '#f59e0b', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  { name: 'Sky', value: '#0284c7', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
  { name: 'Violet', value: '#8b5cf6', bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
  { name: 'Rose', value: '#f43f5e', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  { name: 'Teal', value: '#14b8a6', bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
  { name: 'Lime', value: '#84cc16', bg: 'bg-lime-50', text: 'text-lime-700', border: 'border-lime-200' },
  { name: 'Orange', value: '#f97316', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  { name: 'Fuchsia', value: '#d946ef', bg: 'bg-fuchsia-50', text: 'text-fuchsia-700', border: 'border-fuchsia-200' },
  { name: 'Cyan', value: '#06b6d4', bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
  { name: 'Slate', value: '#64748b', bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' },
];

export function getSubjectColorStyles(colorHex?: string) {
  if (!colorHex) {
    return {
      style: { backgroundColor: '#f1f5f9', color: '#334155', borderColor: '#cbd5e1' },
      stripStyle: { backgroundColor: '#94a3b8' },
    };
  }

  // Generate pleasant light pastel background and rich border/text based on hex
  return {
    style: {
      backgroundColor: `${colorHex}15`,
      color: colorHex,
      borderColor: `${colorHex}40`,
    },
    stripStyle: {
      backgroundColor: colorHex,
    },
  };
}
