import { DirectorInfo, Member } from '../types';

export const TOTAL_SHARES = 144;

export const DIRECTORS: DirectorInfo[] = [
  {
    key: 'SAIF_AHMED_SAKIL',
    name: 'SAIF AHMED SAKIL',
    startShare: 1,
    endShare: 20,
    shareCount: 20,
    phone: '+8801611447765',
    email: 'saif049@gmail.com',
    isUnit: false,
  },
  {
    key: 'M_MASUD_SAWDAGOR',
    name: 'M MASUD SAWDAGOR',
    startShare: 21,
    endShare: 48,
    shareCount: 28,
    phone: '+8801711223344',
    email: 'masud.sawdagor@prottasha.org',
    isUnit: false,
  },
  {
    key: 'M_OMAR_FARUQUE_MOLLA',
    name: 'M OMAR FARUQUE MOLLA',
    startShare: 49,
    endShare: 55,
    shareCount: 7,
    phone: '+8801811334455',
    email: 'omar.faruque@prottasha.org',
    isUnit: false,
  },
  {
    key: 'SHAHIN_AHMED',
    name: 'SHAHIN AHMED',
    startShare: 56,
    endShare: 70,
    shareCount: 15,
    phone: '+8801911445566',
    email: 'shahin.ahmed@prottasha.org',
    isUnit: false,
  },
  {
    key: 'ABUL_HASHIM',
    name: 'ABUL HASHIM',
    startShare: 71,
    endShare: 87,
    shareCount: 17,
    phone: '+8801511556677',
    email: 'abul.hashim@prottasha.org',
    isUnit: false,
  },
  {
    key: 'SIRAJUL_ISLAM',
    name: 'SIRAJUL ISLAM',
    startShare: 88,
    endShare: 94,
    shareCount: 7,
    phone: '+8801611667788',
    email: 'sirajul.islam@prottasha.org',
    isUnit: false,
  },
  {
    key: 'M_ABU_YOUSUF',
    name: 'M ABU YOUSUF',
    startShare: 95,
    endShare: 101,
    shareCount: 7,
    phone: '+8801711778899',
    email: 'abu.yousuf@prottasha.org',
    isUnit: false,
  },
  {
    key: 'FAIZAN_AHMED',
    name: 'FAIZAN AHMED',
    startShare: 102,
    endShare: 108,
    shareCount: 7,
    phone: '+8801811889900',
    email: 'faizan.ahmed@prottasha.org',
    isUnit: false,
  },
  {
    key: 'FOURTH_UNIT',
    name: '4th Unit (General Reserve)',
    startShare: 109,
    endShare: 144,
    shareCount: 36,
    phone: '+8801611447765',
    email: 'fourth.unit@prottasha.org',
    isUnit: true,
  },
];

/**
 * Given a share number (1-144), find its controlling director
 */
export function getDirectorForShareNumber(shareNumber: number): DirectorInfo {
  const normalized = Math.max(1, Math.min(TOTAL_SHARES, Math.floor(shareNumber)));
  const found = DIRECTORS.find(
    (d) => normalized >= d.startShare && normalized <= d.endShare
  );
  return found || DIRECTORS[0];
}

/**
 * Given a member ID (e.g. 'PHSM-007'), parse share number and get controlling director
 */
export function getDirectorForMemberId(memberId: string): DirectorInfo {
  const shareNum = parseShareNumberFromMemberId(memberId);
  return getDirectorForShareNumber(shareNum);
}

/**
 * Format number to PHSM-XXX (e.g. 1 -> PHSM-001)
 */
export function formatMemberId(shareNumber: number): string {
  return `PHSM-${String(shareNumber).padStart(3, '0')}`;
}

/**
 * Parse share number from PHSM-XXX
 */
export function parseShareNumberFromMemberId(memberId: string): number {
  if (!memberId) return 1;
  const match = memberId.match(/\d+/);
  if (!match) return 1;
  const num = parseInt(match[0], 10);
  return isNaN(num) ? 1 : Math.max(1, Math.min(TOTAL_SHARES, num));
}

// Sample Bangladeshi prominent surnames & names for generation
const FIRST_NAMES = [
  'Md. Rafiqul', 'Mohammad Ali', 'Dr. Mahmudur', 'Engr. Tanvir', 'Kazi Nazmul', 
  'Syed Jahangir', 'Golam Mostafa', 'Alhaj Mokhlesur', 'Nurul', 'Fazlul', 
  'Zahirul', 'Shafiqul', 'Abdul', 'Anwar', 'Kamrul', 'Tariqul', 'Ashraful', 
  'Mominul', 'Shahidul', 'Zakir', 'Habibur', 'Nasir', 'Faridul', 'Rezaul'
];

const LAST_NAMES = [
  'Hasan', 'Rahman', 'Karim', 'Hossain', 'Islam', 'Chowdhury', 'Ahmed', 
  'Alam', 'Sarker', 'Bhuiyan', 'Mollah', 'Haque', 'Uddin', 'Khan', 'Siddiqui', 
  'Talukder', 'Majumder', 'Barua', 'Mirza', 'Gazi'
];

/**
 * Generate seed list of all 144 members
 */
export function generateInitialMembers(): Member[] {
  const members: Member[] = [];

  for (let share = 1; share <= TOTAL_SHARES; share++) {
    const id = formatMemberId(share);
    const director = getDirectorForShareNumber(share);

    let name = '';
    let email = '';
    let phone = `+88017${String(10000000 + share * 3871).slice(0, 8)}`;

    if (share === 1) {
      name = 'Saif Ahmed Sakil';
      email = 'saif049@gmail.com';
      phone = '+8801611447765';
    } else if (share === 21) {
      name = 'M Masud Sawdagor';
      email = 'masud.sawdagor@prottasha.org';
    } else if (share === 49) {
      name = 'M Omar Faruque Molla';
      email = 'omar.faruque@prottasha.org';
    } else if (share === 56) {
      name = 'Shahin Ahmed';
      email = 'shahin.ahmed@prottasha.org';
    } else if (share === 71) {
      name = 'Abul Hashim';
      email = 'abul.hashim@prottasha.org';
    } else if (share === 88) {
      name = 'Sirajul Islam';
      email = 'sirajul.islam@prottasha.org';
    } else if (share === 95) {
      name = 'M Abu Yousuf';
      email = 'abu.yousuf@prottasha.org';
    } else if (share === 102) {
      name = 'Faizan Ahmed';
      email = 'faizan.ahmed@prottasha.org';
    } else {
      const fIndex = (share * 7) % FIRST_NAMES.length;
      const lIndex = (share * 11) % LAST_NAMES.length;
      name = `${FIRST_NAMES[fIndex]} ${LAST_NAMES[lIndex]}`;
      email = `member${share}@prottasha.org`;
    }

    const ecDesig =
      share === 1
        ? 'President'
        : share === 49
        ? 'VICE PRESIDENT (VP)'
        : share === 21
        ? 'General Secretary'
        : share === 88
        ? 'TREASURER'
        : share === 56 || share === 71 || share === 95 || share === 102
        ? 'MEMBER'
        : undefined;

    members.push({
      id,
      shareNumber: share,
      name,
      phone,
      email,
      address: `Plot #${(share % 30) + 1}, Sector 14, Uttara Model Town, Dhaka`,
      controllingDirectorKey: director.key,
      controllingDirectorName: director.name,
      joinedDate: '2023-01-15',
      status: 'ACTIVE',
      ecDesignation: ecDesig,
    });
  }

  return members;
}
