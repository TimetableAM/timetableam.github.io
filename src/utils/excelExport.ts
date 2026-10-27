import ExcelJS from 'exceljs';
import {
  AppSettings,
  DAY_NAMES,
  ScheduleEntry,
  SchoolClass,
  Subject,
  Teacher,
} from '../types/schedule';

interface ExportScheduleParams {
  settings: AppSettings;
  classes: SchoolClass[];
  teachers: Teacher[];
  subjects: Subject[];
  entries: ScheduleEntry[];
}

export async function exportScheduleToExcel({
  settings,
  classes,
  teachers,
  subjects,
  entries,
}: ExportScheduleParams): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Դպրոցի Դասացուցակի Կազմման Համակարգ';
  workbook.lastModifiedBy = 'School Timetable Builder';
  workbook.created = new Date();
  workbook.modified = new Date();

  const { activeDays, periods } = settings;

  const subjectMap = new Map(subjects.map((s) => [s.id, s]));
  const teacherMap = new Map(teachers.map((t) => [t.id, t]));
  const classMap = new Map(classes.map((c) => [c.id, c]));

  // Common styles
  const thinBorder: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: 'CBD5E1' } },
    left: { style: 'thin', color: { argb: 'CBD5E1' } },
    bottom: { style: 'thin', color: { argb: 'CBD5E1' } },
    right: { style: 'thin', color: { argb: 'CBD5E1' } },
  };

  const mediumBorder: Partial<ExcelJS.Borders> = {
    top: { style: 'medium', color: { argb: '94A3B8' } },
    left: { style: 'medium', color: { argb: '94A3B8' } },
    bottom: { style: 'medium', color: { argb: '94A3B8' } },
    right: { style: 'medium', color: { argb: '94A3B8' } },
  };

  // Convert hex color to argb for Excel
  const hexToArgb = (hex?: string, alpha = 'FF') => {
    if (!hex) return 'FFF1F5F9';
    const clean = hex.replace('#', '');
    return `${alpha}${clean}`.toUpperCase();
  };

  /* ==========================================================================
     1. SHEET: Ընդհանուր դասացուցակ (Overview - All Classes)
     ========================================================================== */
  const overviewSheet = workbook.addWorksheet('Ընդհանուր դասացուցակ', {
    views: [{ showGridLines: true }],
  });

  // Title Row
  overviewSheet.mergeCells(1, 1, 1, 3 + classes.length);
  const titleCell = overviewSheet.getCell(1, 1);
  titleCell.value = 'ԴՊՐՈՑԱԿԱՆ ԴԱՍԱՑՈՒՑԱԿ (ԸՆԴՀԱՆՈՒՐ ԱՄՓՈՓԱԳԻՐ)';
  titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4338CA' }, // indigo-700
  };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  overviewSheet.getRow(1).height = 36;

  // Subtitle / Date Row
  overviewSheet.mergeCells(2, 1, 2, 3 + classes.length);
  const subCell = overviewSheet.getCell(2, 1);
  subCell.value = `Արտահանման ամսաթիվ՝ ${new Date().toLocaleDateString('hy-AM')} | Ընդհանուր դասարաններ՝ ${classes.length} | Ուսուցիչներ՝ ${teachers.length}`;
  subCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF475569' } };
  subCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF1F5F9' },
  };
  subCell.alignment = { horizontal: 'center', vertical: 'middle' };
  overviewSheet.getRow(2).height = 22;

  // Header Row (Row 4)
  const headerRow = overviewSheet.getRow(4);
  headerRow.height = 30;

  headerRow.getCell(1).value = 'Շաբաթվա օր';
  headerRow.getCell(2).value = 'Դաս';
  headerRow.getCell(3).value = 'Ժամ';

  classes.forEach((cls, idx) => {
    headerRow.getCell(4 + idx).value = `${cls.name} դասարան`;
  });

  for (let c = 1; c <= 3 + classes.length; c++) {
    const cell = headerRow.getCell(c);
    cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F46E5' }, // indigo-600
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = mediumBorder;
  }

  // Populate rows
  let currentRow = 5;

  activeDays.forEach((day) => {
    const startDayRow = currentRow;

    periods.forEach((period) => {
      const row = overviewSheet.getRow(currentRow);
      row.height = 48; // comfortable lesson cell height

      // Period and Time
      row.getCell(2).value = `${period.number}-ին`;
      row.getCell(2).font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF1E293B' } };
      row.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell(2).border = thinBorder;
      row.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };

      row.getCell(3).value = `${period.startTime}\n${period.endTime}`;
      row.getCell(3).font = { name: 'Arial', size: 9, color: { argb: 'FF64748B' } };
      row.getCell(3).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      row.getCell(3).border = thinBorder;
      row.getCell(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };

      // Each Class column
      classes.forEach((cls, cIdx) => {
        const colIdx = 4 + cIdx;
        const cell = row.getCell(colIdx);
        cell.border = thinBorder;
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

        const entry = entries.find(
          (e) => e.classId === cls.id && e.day === day && e.period === period.number
        );

        if (entry) {
          const sub = subjectMap.get(entry.subjectId);
          const teacherNames = entry.teacherIds
            .map((tId) => teacherMap.get(tId)?.fullName)
            .filter(Boolean)
            .join(' / ');

          const roomStr = entry.room ? ` [${entry.room}]` : '';

          cell.value = {
            richText: [
              {
                font: { name: 'Arial', size: 10, bold: true, color: { argb: 'FF0F172A' } },
                text: `${sub?.name || 'Առարկա'}${roomStr}\n`,
              },
              {
                font: { name: 'Arial', size: 8.5, color: { argb: 'FF475569' } },
                text: teacherNames || 'Առանց ուսուցչի',
              },
            ],
          };

          // Light pastel background tint from subject color
          if (sub?.color) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: hexToArgb(sub.color, '1F') },
            };
          }
        } else {
          // Check if class is available in this slot
          const isAvail = cls.availability[`${day}-${period.number}`] ?? true;
          if (!isAvail) {
            cell.value = '—';
            cell.font = { name: 'Arial', size: 9, color: { argb: 'FF94A3B8' } };
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFF1F5F9' },
            };
          } else {
            cell.value = '';
          }
        }
      });

      currentRow++;
    });

    // Merge day column cells for this day
    overviewSheet.mergeCells(startDayRow, 1, currentRow - 1, 1);
    const dayCell = overviewSheet.getCell(startDayRow, 1);
    dayCell.value = `${DAY_NAMES[day].full}\n(${DAY_NAMES[day].short})`;
    dayCell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF312E81' } };
    dayCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    dayCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFEEF2FF' }, // indigo-50
    };
    dayCell.border = mediumBorder;
  });

  // Set Overview column widths
  overviewSheet.getColumn(1).width = 16;
  overviewSheet.getColumn(2).width = 8;
  overviewSheet.getColumn(3).width = 13;
  classes.forEach((_, idx) => {
    overviewSheet.getColumn(4 + idx).width = 24;
  });

  /* ==========================================================================
     2. SHEET: Ըստ դասարանների (By Class - For Students & Homeroom Teachers)
     ========================================================================== */
  const classesSheet = workbook.addWorksheet('Ըստ դասարանների', {
    views: [{ showGridLines: true }],
  });

  let classStartRow = 1;

  classes.forEach((cls) => {
    const totalHours = cls.curriculum.reduce((sum, cur) => sum + cur.hoursPerWeek, 0);

    // Header banner for this class
    classesSheet.mergeCells(classStartRow, 1, classStartRow, 1 + activeDays.length);
    const classBanner = classesSheet.getCell(classStartRow, 1);
    classBanner.value = `${cls.name} ԴԱՍԱՐԱՆԻ ՇԱԲԱԹԱԿԱՆ ԴԱՍԱՑՈՒՑԱԿ (${totalHours} ժամ/շաբաթ)`;
    classBanner.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
    classBanner.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4338CA' },
    };
    classBanner.alignment = { horizontal: 'center', vertical: 'middle' };
    classesSheet.getRow(classStartRow).height = 28;

    // Table Columns Header (Days)
    const tableHeaderRow = classesSheet.getRow(classStartRow + 1);
    tableHeaderRow.height = 24;

    tableHeaderRow.getCell(1).value = 'Դասաժամ';
    tableHeaderRow.getCell(1).font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    tableHeaderRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
    tableHeaderRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    tableHeaderRow.getCell(1).border = thinBorder;

    activeDays.forEach((day, dIdx) => {
      const cell = tableHeaderRow.getCell(2 + dIdx);
      cell.value = `${DAY_NAMES[day].full} (${DAY_NAMES[day].short})`;
      cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = thinBorder;
    });

    // Periods rows
    periods.forEach((period, pIdx) => {
      const row = classesSheet.getRow(classStartRow + 2 + pIdx);
      row.height = 44;

      // Period & time
      const timeCell = row.getCell(1);
      timeCell.value = `${period.number}-ին (${period.startTime}-${period.endTime})`;
      timeCell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF334155' } };
      timeCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      timeCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
      timeCell.border = thinBorder;

      activeDays.forEach((day, dIdx) => {
        const cell = row.getCell(2 + dIdx);
        cell.border = thinBorder;
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

        const entry = entries.find(
          (e) => e.classId === cls.id && e.day === day && e.period === period.number
        );

        if (entry) {
          const sub = subjectMap.get(entry.subjectId);
          const teacherNames = entry.teacherIds
            .map((tId) => teacherMap.get(tId)?.fullName)
            .filter(Boolean)
            .join(' / ');
          const roomStr = entry.room ? ` (${entry.room})` : '';

          cell.value = {
            richText: [
              {
                font: { name: 'Arial', size: 10, bold: true, color: { argb: 'FF0F172A' } },
                text: `${sub?.name || 'Առարկա'}${roomStr}\n`,
              },
              {
                font: { name: 'Arial', size: 8.5, color: { argb: 'FF475569' } },
                text: teacherNames || 'Առանց ուսուցչի',
              },
            ],
          };

          if (sub?.color) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: hexToArgb(sub.color, '1A') },
            };
          }
        } else {
          cell.value = '';
        }
      });
    });

    // Advance for next class (+ spacing)
    classStartRow += periods.length + 4;
  });

  // Set widths for Classes sheet
  classesSheet.getColumn(1).width = 18;
  activeDays.forEach((_, idx) => {
    classesSheet.getColumn(2 + idx).width = 24;
  });

  /* ==========================================================================
     3. SHEET: Ըստ ուսուցիչների (By Teacher - For Teachers & Administration)
     ========================================================================== */
  const teachersSheet = workbook.addWorksheet('Ըստ ուսուցիչների', {
    views: [{ showGridLines: true }],
  });

  let teacherStartRow = 1;

  teachers.forEach((teacher) => {
    const teacherEntries = entries.filter((e) => e.teacherIds.includes(teacher.id));
    const subNames = teacher.subjectIds
      .map((sId) => subjectMap.get(sId)?.name)
      .filter(Boolean)
      .join(', ');

    // Teacher Banner
    teachersSheet.mergeCells(teacherStartRow, 1, teacherStartRow, 1 + activeDays.length);
    const teacherBanner = teachersSheet.getCell(teacherStartRow, 1);
    teacherBanner.value = `${teacher.fullName} • ${subNames || 'Առարկաներ'} (Ծանրաբեռնվածություն՝ ${teacherEntries.length} / ${teacher.maxHoursPerWeek || 20} ժամ)`;
    teacherBanner.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    teacherBanner.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E293B' }, // slate-800
    };
    teacherBanner.alignment = { horizontal: 'center', vertical: 'middle' };
    teachersSheet.getRow(teacherStartRow).height = 26;

    // Header (Days)
    const tHeaderRow = teachersSheet.getRow(teacherStartRow + 1);
    tHeaderRow.height = 22;

    tHeaderRow.getCell(1).value = 'Դասաժամ';
    tHeaderRow.getCell(1).font = { name: 'Arial', size: 9.5, bold: true, color: { argb: 'FFFFFFFF' } };
    tHeaderRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF475569' } };
    tHeaderRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    tHeaderRow.getCell(1).border = thinBorder;

    activeDays.forEach((day, dIdx) => {
      const cell = tHeaderRow.getCell(2 + dIdx);
      cell.value = `${DAY_NAMES[day].full} (${DAY_NAMES[day].short})`;
      cell.font = { name: 'Arial', size: 9.5, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF475569' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = thinBorder;
    });

    // Periods rows
    periods.forEach((period, pIdx) => {
      const row = teachersSheet.getRow(teacherStartRow + 2 + pIdx);
      row.height = 36;

      const timeCell = row.getCell(1);
      timeCell.value = `${period.number}-ին (${period.startTime})`;
      timeCell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF334155' } };
      timeCell.alignment = { horizontal: 'center', vertical: 'middle' };
      timeCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
      timeCell.border = thinBorder;

      activeDays.forEach((day, dIdx) => {
        const cell = row.getCell(2 + dIdx);
        cell.border = thinBorder;
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

        const entry = teacherEntries.find(
          (e) => e.day === day && e.period === period.number
        );

        if (entry) {
          const cls = classMap.get(entry.classId);
          const sub = subjectMap.get(entry.subjectId);
          const roomStr = entry.room ? ` [${entry.room}]` : '';

          cell.value = {
            richText: [
              {
                font: { name: 'Arial', size: 10, bold: true, color: { argb: 'FF4338CA' } },
                text: `${cls?.name || 'Դասարան'}: `,
              },
              {
                font: { name: 'Arial', size: 9, color: { argb: 'FF0F172A' } },
                text: `${sub?.name || ''}${roomStr}`,
              },
            ],
          };

          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFEEF2FF' }, // indigo-50
          };
        } else {
          // Check teacher availability
          const isAvail = teacher.availability[`${day}-${period.number}`] ?? true;
          if (!isAvail) {
            cell.value = 'Անհարմար ժամ';
            cell.font = { name: 'Arial', size: 8, italic: true, color: { argb: 'FF94A3B8' } };
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFF1F5F9' },
            };
          } else {
            cell.value = '';
          }
        }
      });
    });

    teacherStartRow += periods.length + 3;
  });

  teachersSheet.getColumn(1).width = 16;
  activeDays.forEach((_, idx) => {
    teachersSheet.getColumn(2 + idx).width = 24;
  });

  /* ==========================================================================
     4. SHEET: Ուսուցչական ծանրաբեռնվածություն (Summary & Workloads)
     ========================================================================== */
  const workloadSheet = workbook.addWorksheet('Ուսուցիչների ծանրաբեռնվածություն', {
    views: [{ showGridLines: true }],
  });

  // Header
  workloadSheet.mergeCells(1, 1, 1, 6);
  const wTitle = workloadSheet.getCell(1, 1);
  wTitle.value = 'ՈՒՍՈՒՑԻՉՆԵՐԻ ՇԱԲԱԹԱԿԱՆ ԾԱՆՐԱԲԵՌՆՎԱԾՈՒԹՅՈՒՆ ԵՎ ՎԻՃԱԿԱԳՐՈՒԹՅՈՒՆ';
  wTitle.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
  wTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4338CA' } };
  wTitle.alignment = { horizontal: 'center', vertical: 'middle' };
  workloadSheet.getRow(1).height = 28;

  const wHeader = workloadSheet.getRow(3);
  wHeader.height = 24;
  const columns = [
    '№',
    'Ուսուցչի ԱԱՀ',
    'Դասավանդվող առարկաներ',
    'Փաստացի դասեր (ժամ/շաբ)',
    'Առավելագույն նորմա (ժամ/շաբ)',
    'Հասանելի սլոտներ (ընդհանուրից)',
  ];

  columns.forEach((colTitle, idx) => {
    const cell = wHeader.getCell(idx + 1);
    cell.value = colTitle;
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = thinBorder;
  });

  let totalScheduledAll = 0;
  let totalMaxAll = 0;

  teachers.forEach((t, idx) => {
    const row = workloadSheet.getRow(4 + idx);
    row.height = 20;

    const scheduled = entries.filter((e) => e.teacherIds.includes(t.id)).length;
    const maxH = t.maxHoursPerWeek || 20;
    totalScheduledAll += scheduled;
    totalMaxAll += maxH;

    const subNames = t.subjectIds
      .map((sId) => subjectMap.get(sId)?.name)
      .filter(Boolean)
      .join(', ');

    let freeSlots = 0;
    activeDays.forEach((d) => {
      periods.forEach((p) => {
        if (t.availability[`${d}-${p.number}`] ?? true) freeSlots++;
      });
    });
    const totalSlots = activeDays.length * periods.length;

    row.getCell(1).value = idx + 1;
    row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };

    row.getCell(2).value = t.fullName;
    row.getCell(2).font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF1E293B' } };
    row.getCell(2).alignment = { horizontal: 'left', vertical: 'middle' };

    row.getCell(3).value = subNames;
    row.getCell(3).alignment = { horizontal: 'left', vertical: 'middle' };

    row.getCell(4).value = scheduled;
    row.getCell(4).font = {
      name: 'Arial',
      size: 10,
      bold: true,
      color: { argb: scheduled > maxH ? 'FFE11D48' : 'FF0F172A' },
    };
    row.getCell(4).alignment = { horizontal: 'center', vertical: 'middle' };

    row.getCell(5).value = maxH;
    row.getCell(5).alignment = { horizontal: 'center', vertical: 'middle' };

    row.getCell(6).value = `${freeSlots} / ${totalSlots} (${Math.round((freeSlots / (totalSlots || 1)) * 100)}%)`;
    row.getCell(6).alignment = { horizontal: 'center', vertical: 'middle' };

    for (let c = 1; c <= 6; c++) {
      row.getCell(c).border = thinBorder;
    }
  });

  // Summary row
  const summaryRow = workloadSheet.getRow(4 + teachers.length);
  summaryRow.height = 24;
  summaryRow.getCell(1).value = '';
  summaryRow.getCell(2).value = 'ԸՆԴԱՄԵՆԸ՝';
  summaryRow.getCell(2).font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF1E293B' } };
  summaryRow.getCell(2).alignment = { horizontal: 'right', vertical: 'middle' };

  summaryRow.getCell(3).value = `${teachers.length} ուսուցիչ`;
  summaryRow.getCell(3).font = { name: 'Arial', size: 10, italic: true };
  summaryRow.getCell(3).alignment = { horizontal: 'left', vertical: 'middle' };

  summaryRow.getCell(4).value = totalScheduledAll;
  summaryRow.getCell(4).font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF4338CA' } };
  summaryRow.getCell(4).alignment = { horizontal: 'center', vertical: 'middle' };

  summaryRow.getCell(5).value = totalMaxAll;
  summaryRow.getCell(5).font = { name: 'Arial', size: 11, bold: true };
  summaryRow.getCell(5).alignment = { horizontal: 'center', vertical: 'middle' };

  summaryRow.getCell(6).value = '';

  for (let c = 1; c <= 6; c++) {
    const cell = summaryRow.getCell(c);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
    cell.border = mediumBorder;
  }

  workloadSheet.getColumn(1).width = 6;
  workloadSheet.getColumn(2).width = 26;
  workloadSheet.getColumn(3).width = 34;
  workloadSheet.getColumn(4).width = 24;
  workloadSheet.getColumn(5).width = 24;
  workloadSheet.getColumn(6).width = 28;

  // Generate buffer and trigger browser download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const dateStr = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `dproc_dasacucak_${dateStr}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
