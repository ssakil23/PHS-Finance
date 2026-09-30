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

export const EDUCATION_DEGREES = [
  'B.Sc. in Civil Engineering (BUET)',
  'M.B.A. (IBA, University of Dhaka)',
  'B.Sc. in Electrical & Electronic Engineering',
  'M.Sc. in Computer Science & Engineering',
  'B.B.A. (Finance & Banking, DU)',
  'LL.B. (Hons), LL.M. (Advocate, Supreme Court)',
  'M.B.B.S., FCPS (Medicine)',
  'B.Com (Hons), M.Com (Accounting)',
  'M.A. in English (University of Dhaka)',
  'B.Sc. in Architecture (BUET)',
  'Chartered Accountant (FCA, ICAB)',
  'M.S. in Economics',
];

export const PERMANENT_DISTRICTS = [
  'Vill: Rampur, PO: Chandpur Sadar, Dist: Chandpur',
  'Sawdagor Bari, PO: Dagonbhuiyan, Dist: Feni',
  'Molla Bari, PO: Comilla Sadar, Dist: Comilla',
  'Ahmed Villa, PO: Chhatak, Dist: Sunamganj',
  'Hashim Nibash, PO: Hathazari, Dist: Chattogram',
  'Bhuiyan Para, PO: Munshiganj Sadar, Dist: Munshiganj',
  'Sarker Bari, PO: Nabinagar, Dist: Brahmanbaria',
  'Vill: Mirzapur, PO: Tangail Sadar, Dist: Tangail',
  'Talukder Manzil, PO: Bakerganj, Dist: Barishal',
  'Chowdhury Bari, PO: Sylhet Sadar, Dist: Sylhet',
  'Vill: Kaliganj, PO: Gazipur Sadar, Dist: Gazipur',
  'Haque Cottage, PO: Sonargaon, Dist: Narayanganj',
  'Vill: Shibganj, PO: Bogura Sadar, Dist: Bogura',
  'Rahman House, PO: Mymensingh Sadar, Dist: Mymensingh',
];

export const SPOUSE_FIRST_NAMES = [
  'Mrs. Farhana', 'Mrs. Nasreen', 'Mrs. Sultana', 'Mrs. Shahnaz', 'Mrs. Bilkis',
  'Mrs. Rokeya', 'Mrs. Nusrat', 'Mrs. Sabina', 'Mrs. Rozina', 'Mrs. Tahmina',
  'Mrs. Shamima', 'Mrs. Parveen', 'Mrs. Afroza', 'Mrs. Rehana', 'Mrs. Salma'
];

export const EMERGENCY_RELATIONS = [
  'Brother', 'Brother', 'Son', 'Spouse', 'Cousin', 'Uncle', 'Sister', 'Friend'
];

/**
 * Enriches any member object with authentic demographic and contact information
 */
export function ensureMemberDemographics(m: Member): Member {
  const share = m.shareNumber || 1;
  const lIndex = (share * 11) % LAST_NAMES.length;
  const lastName = LAST_NAMES[lIndex];

  let nid = m.nidOrBirthId;
  let dob = m.dob;
  let education = m.education;
  let permAddress = m.permanentAddress;
  let currAddress = m.currentAddress || m.address;
  let spouseName = m.spouseName;
  let spouseMobile = m.spouseMobile;
  let emergencyContact = m.emergencyContact;

  if (share === 1) {
    nid = nid || '19852692500000001';
    dob = dob || '1985-04-12';
    education = education || 'M.Sc. in Civil Engineering (BUET)';
    permAddress = permAddress || 'Vill: Rampur, PO: Chandpur Sadar, Dist: Chandpur';
    currAddress = currAddress || 'House #12, Road #7, Sector 14, Uttara Model Town, Dhaka-1230';
    spouseName = spouseName || 'Mrs. Farhana Sakil';
    spouseMobile = spouseMobile || '+8801712345678';
    emergencyContact = emergencyContact || '+8801819998877 (Tanvir Sakil - Brother)';
  } else if (share === 21) {
    nid = nid || '19792692500000021';
    dob = dob || '1979-08-20';
    education = education || 'M.B.A. (Finance, IBA DU)';
    permAddress = permAddress || 'Sawdagor Bari, PO: Dagonbhuiyan, Dist: Feni';
    currAddress = currAddress || 'Flat 4A, Plot #21, Sector 14, Uttara, Dhaka-1230';
    spouseName = spouseName || 'Mrs. Nasreen Sawdagor';
    spouseMobile = spouseMobile || '+8801711223399';
    emergencyContact = emergencyContact || '+8801711223300 (Kamal Sawdagor - Brother)';
  } else if (share === 49) {
    nid = nid || '19822692500000049';
    dob = dob || '1982-11-15';
    education = education || 'B.Sc. in Electrical Engineering';
    permAddress = permAddress || 'Molla Bari, PO: Comilla Sadar, Dist: Comilla';
    currAddress = currAddress || 'Plot #49, Road #11, Sector 14, Uttara, Dhaka-1230';
    spouseName = spouseName || 'Mrs. Sultana Molla';
    spouseMobile = spouseMobile || '+8801811334400';
    emergencyContact = emergencyContact || '+8801811334411 (Zahir Molla - Brother)';
  } else if (share === 56) {
    nid = nid || '19842692500000056';
    dob = dob || '1984-06-25';
    education = education || 'B.B.A. (Marketing, DU)';
    permAddress = permAddress || 'Ahmed Villa, PO: Chhatak, Dist: Sunamganj';
    currAddress = currAddress || 'Plot #56, Sector 14, Uttara, Dhaka-1230';
    spouseName = spouseName || 'Mrs. Shahnaz Ahmed';
    spouseMobile = spouseMobile || '+8801911445500';
    emergencyContact = emergencyContact || '+8801911445511 (Dr. Rafiq - Cousin)';
  } else if (share === 71) {
    nid = nid || '19762692500000071';
    dob = dob || '1976-02-18';
    education = education || 'M.A. in Political Science (DU)';
    permAddress = permAddress || 'Hashim Nibash, PO: Hathazari, Dist: Chattogram';
    currAddress = currAddress || 'Plot #71, Sector 14, Uttara, Dhaka-1230';
    spouseName = spouseName || 'Mrs. Rokeya Hashim';
    spouseMobile = spouseMobile || '+8801511556600';
    emergencyContact = emergencyContact || '+8801511556611 (Nayeem Hashim - Son)';
  } else if (share === 88) {
    nid = nid || '19802692500000088';
    dob = dob || '1980-03-10';
    education = education || 'M.Com in Accounting (DU), FCA';
    permAddress = permAddress || 'Bhuiyan Para, PO: Munshiganj Sadar, Dist: Munshiganj';
    currAddress = currAddress || 'Plot #88, Sector 14, Uttara, Dhaka-1230';
    spouseName = spouseName || 'Mrs. Bilkis Begum';
    spouseMobile = spouseMobile || '+8801611667700';
    emergencyContact = emergencyContact || '+8801611667711 (Tariqul Islam - Son)';
  } else if (share === 95) {
    nid = nid || '19832692500000095';
    dob = dob || '1983-09-14';
    education = education || 'B.Sc. in Civil Engineering (BUET)';
    permAddress = permAddress || 'Vill: Kaliganj, PO: Gazipur Sadar, Dist: Gazipur';
    currAddress = currAddress || 'Plot #95, Sector 14, Uttara, Dhaka-1230';
    spouseName = spouseName || 'Mrs. Sabina Yousuf';
    spouseMobile = spouseMobile || '+8801711778800';
    emergencyContact = emergencyContact || '+8801711778811 (Kawsar Yousuf - Brother)';
  } else if (share === 102) {
    nid = nid || '19862692500000102';
    dob = dob || '1986-12-05';
    education = education || 'M.Sc. in Computer Science & Engineering';
    permAddress = permAddress || 'Chowdhury Bari, PO: Sylhet Sadar, Dist: Sylhet';
    currAddress = currAddress || 'Plot #102, Sector 14, Uttara, Dhaka-1230';
    spouseName = spouseName || 'Mrs. Nusrat Faizan';
    spouseMobile = spouseMobile || '+8801811889911';
    emergencyContact = emergencyContact || '+8801811889922 (Asif Ahmed - Brother)';
  } else {
    const birthYear = 1968 + (share % 28);
    const birthMonth = String((share % 12) + 1).padStart(2, '0');
    const birthDay = String((share % 27) + 1).padStart(2, '0');
    nid = nid || `198${(share % 15) + 70}26925${String(share).padStart(6, '0')}`;
    dob = dob || `${birthYear}-${birthMonth}-${birthDay}`;
    education = education || EDUCATION_DEGREES[share % EDUCATION_DEGREES.length];
    permAddress = permAddress || PERMANENT_DISTRICTS[share % PERMANENT_DISTRICTS.length];
    currAddress = currAddress || `House #${(share % 45) + 1}, Road #${(share % 19) + 1}, Sector 14, Uttara, Dhaka-1230`;
    spouseName = spouseName || `${SPOUSE_FIRST_NAMES[share % SPOUSE_FIRST_NAMES.length]} ${lastName}`;
    spouseMobile = spouseMobile || `+88017${String(20000000 + share * 4921).slice(0, 8)}`;
    const rel = EMERGENCY_RELATIONS[share % EMERGENCY_RELATIONS.length];
    emergencyContact = emergencyContact || `+88018${String(30000000 + share * 5137).slice(0, 8)} (${rel})`;
  }

  return {
    ...m,
    address: currAddress,
    currentAddress: currAddress,
    permanentAddress: permAddress,
    nidOrBirthId: nid,
    dob,
    education,
    spouseName,
    spouseMobile,
    emergencyContact,
  };
}

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

    const baseMember: Member = {
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
    };

    members.push(ensureMemberDemographics(baseMember));
  }

  return members;
}
