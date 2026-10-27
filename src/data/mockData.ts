import { AppSettings, SchoolClass, Subject, Teacher } from '../types/schedule';

export const INITIAL_SETTINGS: AppSettings = {
  activeDays: ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ'],
  periods: [
    { number: 1, startTime: '08:30', endTime: '09:15' },
    { number: 2, startTime: '09:25', endTime: '10:10' },
    { number: 3, startTime: '10:20', endTime: '11:05' },
    { number: 4, startTime: '11:25', endTime: '12:10' },
    { number: 5, startTime: '12:20', endTime: '13:05' },
    { number: 6, startTime: '13:15', endTime: '14:00' },
    { number: 7, startTime: '14:10', endTime: '14:55' },
  ],
};

export const INITIAL_SUBJECTS: Subject[] = [
  { id: 'sub-math', name: 'Մաթեմատիկա', color: '#6366f1', defaultRoom: '204' },
  { id: 'sub-arm', name: 'Հայոց լեզու և Գրականություն', color: '#10b981', defaultRoom: '305' },
  { id: 'sub-eng', name: 'Անգլերեն', color: '#f59e0b', defaultRoom: '108' },
  { id: 'sub-phys', name: 'Ֆիզիկա', color: '#0284c7', defaultRoom: 'Լաբ-1' },
  { id: 'sub-inf', name: 'Ինֆորմատիկա', color: '#8b5cf6', defaultRoom: 'Համ-2' },
  { id: 'sub-hist', name: 'Հայոց Պատմություն', color: '#f43f5e', defaultRoom: '210' },
  { id: 'sub-chem', name: 'Քիմիա', color: '#14b8a6', defaultRoom: 'Լաբ-2' },
  { id: 'sub-bio', name: 'Կենսաբանություն', color: '#84cc16', defaultRoom: '103' },
  { id: 'sub-pe', name: 'Ֆիզկուլտուրա', color: '#f97316', defaultRoom: 'Մարզադահլիճ' },
];

// Helper to create availability with optional blocked slots
function makeAvailability(blocked: string[] = []): Record<string, boolean> {
  const days = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'];
  const res: Record<string, boolean> = {};
  for (const day of days) {
    for (let p = 1; p <= 7; p++) {
      const key = `${day}-${p}`;
      res[key] = !blocked.includes(key);
    }
  }
  return res;
}

export const INITIAL_TEACHERS: Teacher[] = [
  {
    id: 't-aram',
    fullName: 'Արամ Գրիգորյան',
    subjectIds: ['sub-math'],
    maxHoursPerWeek: 22,
    availability: makeAvailability(['ПН-1', 'ПТ-7']),
  },
  {
    id: 't-anahit',
    fullName: 'Անահիտ Հովհաննիսյան',
    subjectIds: ['sub-math'],
    maxHoursPerWeek: 20,
    availability: makeAvailability(['СР-1', 'СР-2']),
  },
  {
    id: 't-lilit',
    fullName: 'Լիլիթ Պետրոսյան',
    subjectIds: ['sub-arm'],
    maxHoursPerWeek: 20,
    availability: makeAvailability(['ВТ-1', 'ЧТ-7']),
  },
  {
    id: 't-gayane',
    fullName: 'Գայանե Մանուկյան',
    subjectIds: ['sub-arm'],
    maxHoursPerWeek: 18,
    availability: makeAvailability(['ПТ-5', 'ПТ-6', 'ПТ-7']),
  },
  {
    id: 't-meri',
    fullName: 'Մերի Սարգսյան',
    subjectIds: ['sub-eng'],
    maxHoursPerWeek: 22,
    availability: makeAvailability(['ПН-1']),
  },
  {
    id: 't-karine',
    fullName: 'Կարինե Դավթյան',
    subjectIds: ['sub-eng'],
    maxHoursPerWeek: 20,
    availability: makeAvailability(['ЧТ-1', 'ЧТ-2']),
  },
  {
    id: 't-tigran',
    fullName: 'Տիգրան Կարապետյան',
    subjectIds: ['sub-phys'],
    maxHoursPerWeek: 16,
    availability: makeAvailability(['СР-6', 'СР-7']),
  },
  {
    id: 't-davit',
    fullName: 'Դավիթ Խաչատրյան',
    subjectIds: ['sub-inf'],
    maxHoursPerWeek: 18,
    availability: makeAvailability(['ПН-6', 'ПН-7']),
  },
  {
    id: 't-suren',
    fullName: 'Սուրեն Ավագյան',
    subjectIds: ['sub-inf'],
    maxHoursPerWeek: 18,
    availability: makeAvailability(['ВТ-1']),
  },
  {
    id: 't-narine',
    fullName: 'Նարինե Բաղդասարյան',
    subjectIds: ['sub-hist'],
    maxHoursPerWeek: 16,
    availability: makeAvailability(['ПТ-6', 'ПТ-7']),
  },
  {
    id: 't-ruzan',
    fullName: 'Ռուզաննա Մկրտչյան',
    subjectIds: ['sub-chem'],
    maxHoursPerWeek: 14,
    availability: makeAvailability(['ЧТ-6', 'ЧТ-7']),
  },
  {
    id: 't-anush',
    fullName: 'Անուշ Գևորգյան',
    subjectIds: ['sub-bio', 'sub-chem'],
    maxHoursPerWeek: 18,
    availability: makeAvailability(['ВТ-6', 'ВТ-7']),
  },
  {
    id: 't-samvel',
    fullName: 'Սամվել Հարությունյան',
    subjectIds: ['sub-pe'],
    maxHoursPerWeek: 20,
    availability: makeAvailability(),
  },
];

export const INITIAL_CLASSES: SchoolClass[] = [
  {
    id: 'c-8a',
    name: '8Ա',
    availability: makeAvailability([
      'ПН-7', 'ВТ-7', 'СР-7', 'ЧТ-7', 'ПТ-7', // 8A ends at 6th lesson
      'СБ-1', 'СБ-2', 'СБ-3', 'СБ-4', 'СБ-5', 'СБ-6', 'СБ-7'
    ]),
    curriculum: [
      {
        id: 'cur-8a-1',
        subjectId: 'sub-math',
        hoursPerWeek: 5,
        isFixedTeacher: true,
        isDualTeacher: false,
        assignedTeacherIds: ['t-aram'],
        room: '204',
      },
      {
        id: 'cur-8a-2',
        subjectId: 'sub-arm',
        hoursPerWeek: 4,
        isFixedTeacher: true,
        isDualTeacher: false,
        assignedTeacherIds: ['t-lilit'],
        room: '305',
      },
      {
        id: 'cur-8a-3',
        subjectId: 'sub-eng',
        hoursPerWeek: 3,
        isFixedTeacher: true,
        isDualTeacher: true, // Dual teacher for foreign language groups!
        assignedTeacherIds: ['t-meri', 't-karine'],
        room: '108',
      },
      {
        id: 'cur-8a-4',
        subjectId: 'sub-phys',
        hoursPerWeek: 2,
        isFixedTeacher: false, // Auto teacher selection
        isDualTeacher: false,
        assignedTeacherIds: [],
        room: 'Լաբ-1',
      },
      {
        id: 'cur-8a-5',
        subjectId: 'sub-inf',
        hoursPerWeek: 2,
        isFixedTeacher: true,
        isDualTeacher: true, // Dual teacher for Informatics
        assignedTeacherIds: ['t-davit', 't-suren'],
        room: 'Համ-2',
      },
      {
        id: 'cur-8a-6',
        subjectId: 'sub-hist',
        hoursPerWeek: 2,
        isFixedTeacher: true,
        isDualTeacher: false,
        assignedTeacherIds: ['t-narine'],
        room: '210',
      },
      {
        id: 'cur-8a-7',
        subjectId: 'sub-bio',
        hoursPerWeek: 2,
        isFixedTeacher: false,
        isDualTeacher: false,
        assignedTeacherIds: [],
        room: '103',
      },
      {
        id: 'cur-8a-8',
        subjectId: 'sub-pe',
        hoursPerWeek: 2,
        isFixedTeacher: true,
        isDualTeacher: false,
        assignedTeacherIds: ['t-samvel'],
        room: 'Մարզադահլիճ',
      },
    ],
  },
  {
    id: 'c-9a',
    name: '9Ա',
    availability: makeAvailability([
      'ПН-7', 'ВТ-7', 'СР-7', 'ЧТ-7', 'ПТ-7',
      'СБ-1', 'СБ-2', 'СБ-3', 'СБ-4', 'СБ-5', 'СБ-6', 'СБ-7'
    ]),
    curriculum: [
      {
        id: 'cur-9a-1',
        subjectId: 'sub-math',
        hoursPerWeek: 5,
        isFixedTeacher: true,
        isDualTeacher: false,
        assignedTeacherIds: ['t-anahit'],
        room: '202',
      },
      {
        id: 'cur-9a-2',
        subjectId: 'sub-arm',
        hoursPerWeek: 4,
        isFixedTeacher: true,
        isDualTeacher: false,
        assignedTeacherIds: ['t-gayane'],
        room: '302',
      },
      {
        id: 'cur-9a-3',
        subjectId: 'sub-eng',
        hoursPerWeek: 3,
        isFixedTeacher: true,
        isDualTeacher: true,
        assignedTeacherIds: ['t-meri', 't-karine'],
        room: '108',
      },
      {
        id: 'cur-9a-4',
        subjectId: 'sub-phys',
        hoursPerWeek: 2,
        isFixedTeacher: true,
        isDualTeacher: false,
        assignedTeacherIds: ['t-tigran'],
        room: 'Լաբ-1',
      },
      {
        id: 'cur-9a-5',
        subjectId: 'sub-chem',
        hoursPerWeek: 2,
        isFixedTeacher: false,
        isDualTeacher: false,
        assignedTeacherIds: [],
        room: 'Լաբ-2',
      },
      {
        id: 'cur-9a-6',
        subjectId: 'sub-hist',
        hoursPerWeek: 2,
        isFixedTeacher: true,
        isDualTeacher: false,
        assignedTeacherIds: ['t-narine'],
        room: '210',
      },
      {
        id: 'cur-9a-7',
        subjectId: 'sub-inf',
        hoursPerWeek: 2,
        isFixedTeacher: true,
        isDualTeacher: true,
        assignedTeacherIds: ['t-davit', 't-suren'],
        room: 'Համ-2',
      },
      {
        id: 'cur-9a-8',
        subjectId: 'sub-pe',
        hoursPerWeek: 2,
        isFixedTeacher: true,
        isDualTeacher: false,
        assignedTeacherIds: ['t-samvel'],
        room: 'Մարզադահլիճ',
      },
    ],
  },
  {
    id: 'c-10a',
    name: '10Ա',
    availability: makeAvailability([
      'СБ-1', 'СБ-2', 'СБ-3', 'СБ-4', 'СБ-5', 'СБ-6', 'СБ-7'
    ]),
    curriculum: [
      {
        id: 'cur-10a-1',
        subjectId: 'sub-math',
        hoursPerWeek: 5,
        isFixedTeacher: true,
        isDualTeacher: false,
        assignedTeacherIds: ['t-aram'],
        room: '204',
      },
      {
        id: 'cur-10a-2',
        subjectId: 'sub-arm',
        hoursPerWeek: 4,
        isFixedTeacher: true,
        isDualTeacher: false,
        assignedTeacherIds: ['t-lilit'],
        room: '305',
      },
      {
        id: 'cur-10a-3',
        subjectId: 'sub-eng',
        hoursPerWeek: 3,
        isFixedTeacher: true,
        isDualTeacher: true,
        assignedTeacherIds: ['t-meri', 't-karine'],
        room: '108',
      },
      {
        id: 'cur-10a-4',
        subjectId: 'sub-phys',
        hoursPerWeek: 3,
        isFixedTeacher: true,
        isDualTeacher: false,
        assignedTeacherIds: ['t-tigran'],
        room: 'Լաբ-1',
      },
      {
        id: 'cur-10a-5',
        subjectId: 'sub-chem',
        hoursPerWeek: 2,
        isFixedTeacher: true,
        isDualTeacher: false,
        assignedTeacherIds: ['t-ruzan'],
        room: 'Լաբ-2',
      },
      {
        id: 'cur-10a-6',
        subjectId: 'sub-bio',
        hoursPerWeek: 2,
        isFixedTeacher: true,
        isDualTeacher: false,
        assignedTeacherIds: ['t-anush'],
        room: '103',
      },
      {
        id: 'cur-10a-7',
        subjectId: 'sub-hist',
        hoursPerWeek: 2,
        isFixedTeacher: true,
        isDualTeacher: false,
        assignedTeacherIds: ['t-narine'],
        room: '210',
      },
      {
        id: 'cur-10a-8',
        subjectId: 'sub-pe',
        hoursPerWeek: 2,
        isFixedTeacher: true,
        isDualTeacher: false,
        assignedTeacherIds: ['t-samvel'],
        room: 'Մարզադահլիճ',
      },
    ],
  },
  {
    id: 'c-11a',
    name: '11Ա',
    availability: makeAvailability([
      'СБ-1', 'СБ-2', 'СБ-3', 'СБ-4', 'СБ-5', 'СБ-6', 'СБ-7'
    ]),
    curriculum: [
      {
        id: 'cur-11a-1',
        subjectId: 'sub-math',
        hoursPerWeek: 5,
        isFixedTeacher: true,
        isDualTeacher: false,
        assignedTeacherIds: ['t-anahit'],
        room: '202',
      },
      {
        id: 'cur-11a-2',
        subjectId: 'sub-arm',
        hoursPerWeek: 4,
        isFixedTeacher: true,
        isDualTeacher: false,
        assignedTeacherIds: ['t-gayane'],
        room: '302',
      },
      {
        id: 'cur-11a-3',
        subjectId: 'sub-eng',
        hoursPerWeek: 3,
        isFixedTeacher: true,
        isDualTeacher: true,
        assignedTeacherIds: ['t-meri', 't-karine'],
        room: '108',
      },
      {
        id: 'cur-11a-4',
        subjectId: 'sub-phys',
        hoursPerWeek: 3,
        isFixedTeacher: true,
        isDualTeacher: false,
        assignedTeacherIds: ['t-tigran'],
        room: 'Լաբ-1',
      },
      {
        id: 'cur-11a-5',
        subjectId: 'sub-chem',
        hoursPerWeek: 2,
        isFixedTeacher: true,
        isDualTeacher: false,
        assignedTeacherIds: ['t-ruzan'],
        room: 'Լաբ-2',
      },
      {
        id: 'cur-11a-6',
        subjectId: 'sub-bio',
        hoursPerWeek: 2,
        isFixedTeacher: false,
        isDualTeacher: false,
        assignedTeacherIds: [],
        room: '103',
      },
      {
        id: 'cur-11a-7',
        subjectId: 'sub-hist',
        hoursPerWeek: 2,
        isFixedTeacher: true,
        isDualTeacher: false,
        assignedTeacherIds: ['t-narine'],
        room: '210',
      },
      {
        id: 'cur-11a-8',
        subjectId: 'sub-pe',
        hoursPerWeek: 2,
        isFixedTeacher: true,
        isDualTeacher: false,
        assignedTeacherIds: ['t-samvel'],
        room: 'Մարզադահլիճ',
      },
    ],
  },
];
