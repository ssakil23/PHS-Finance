import {
  IncomeEntry,
  ExpenseEntry,
  AuditLog,
  ChatMessage,
  ElectionPoll,
  ExecutiveCommittee,
  OfficialUser,
  SocietyDocument,
  MemberQuery,
  DiscussionPost,
} from '../types';
import { generateInitialMembers } from './directors';

// --- Production User Data: All 144 Share Owner Accounts (001 to 144) ---
export const INITIAL_MEMBERS = generateInitialMembers();

// --- Production Official Accounts (System Admin, Managers, Officers) ---
export const INITIAL_OFFICIALS: OfficialUser[] = [
  {
    id: 'OFF-001',
    username: 'manager1',
    name: 'Md. Rafiqul Islam',
    designation: 'Manager',
    phone: '+8801711998877',
    email: 'rafiqul.manager@prottasha.org',
    department: 'Accounts & Operations',
    isEmpoweredForEntry: true, // Empowered by System Admin
    empoweredBy: 'Saif Ahmed Sakil (System Admin)',
    empoweredAt: '2026-01-10T10:00:00.000Z',
    createdAt: '2026-01-10T10:00:00.000Z',
    createdBy: 'Saif Ahmed Sakil',
    status: 'ACTIVE',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&h=400&q=80',
    photoStatus: 'AUTHORIZED',
    photoAuthorizedBy: 'SAIF AHMED SAKIL',
    photoAuthorizedByName: 'Saif Ahmed Sakil (President)',
    photoAuthorizedAt: '2026-01-10T10:00:00.000Z',
  },
  {
    id: 'OFF-002',
    username: 'dym_hasan',
    name: 'Kazi Hasan',
    designation: 'Deputy Manager (DyM)',
    phone: '+8801711883322',
    email: 'hasan.dym@prottasha.org',
    department: 'Field Operations & Billing',
    isEmpoweredForEntry: true, // Empowered by System Admin
    empoweredBy: 'Saif Ahmed Sakil (System Admin)',
    empoweredAt: '2026-01-15T11:00:00.000Z',
    createdAt: '2026-01-15T11:00:00.000Z',
    createdBy: 'Saif Ahmed Sakil',
    status: 'ACTIVE',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&h=400&q=80',
    photoStatus: 'AUTHORIZED',
    photoAuthorizedBy: 'SAIF AHMED SAKIL',
    photoAuthorizedByName: 'Saif Ahmed Sakil (President)',
    photoAuthorizedAt: '2026-01-15T11:00:00.000Z',
  },
  {
    id: 'OFF-003',
    username: 'aistm_kamal',
    name: 'Kamal Hossain',
    designation: 'Assistant Manager (AistM)',
    phone: '+8801711774433',
    email: 'kamal.aistm@prottasha.org',
    department: 'Member Liaison & Desk',
    isEmpoweredForEntry: false, // NOT empowered by System Admin yet
    createdAt: '2026-02-01T09:00:00.000Z',
    createdBy: 'Saif Ahmed Sakil',
    status: 'ACTIVE',
    photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&h=400&q=80',
    photoStatus: 'AUTHORIZED',
    photoAuthorizedBy: 'SAIF AHMED SAKIL',
    photoAuthorizedByName: 'Saif Ahmed Sakil (President)',
    photoAuthorizedAt: '2026-02-01T09:00:00.000Z',
  },
  {
    id: 'OFF-004',
    username: 'accts_tanvir',
    name: 'Tanvir Chowdhury',
    designation: 'Accounts Officer',
    phone: '+8801711665544',
    email: 'tanvir.accounts@prottasha.org',
    department: 'Finance & Banking Escrow',
    isEmpoweredForEntry: true, // Empowered by System Admin
    empoweredBy: 'Saif Ahmed Sakil (System Admin)',
    empoweredAt: '2026-02-05T14:00:00.000Z',
    createdAt: '2026-02-05T14:00:00.000Z',
    createdBy: 'Saif Ahmed Sakil',
    status: 'ACTIVE',
    photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&h=400&q=80',
    photoStatus: 'AUTHORIZED',
    photoAuthorizedBy: 'SAIF AHMED SAKIL',
    photoAuthorizedByName: 'Saif Ahmed Sakil (President)',
    photoAuthorizedAt: '2026-02-05T14:00:00.000Z',
  },
];

// --- Executive Committee Constitutional Structure ---
export const INITIAL_EXECUTIVE_COMMITTEE: ExecutiveCommittee = {
  president: {
    name: 'Saif Ahmed Sakil',
    memberId: 'PHSM-001',
    honorariumBDT: 35000,
    phone: '+8801611447765',
    designation: 'President',
  },
  vicePresident: {
    name: 'M Omar Faruque Molla',
    memberId: 'PHSM-049',
    honorariumBDT: 25000,
    phone: '+8801811334455',
    designation: 'VICE PRESIDENT (VP)',
  },
  generalSecretary: {
    name: 'M Masud Sawdagor',
    memberId: 'PHSM-021',
    honorariumBDT: 30000,
    phone: '+8801711223344',
    designation: 'General Secretary',
  },
  treasurer: {
    name: 'Sirajul Islam',
    memberId: 'PHSM-088',
    honorariumBDT: 25000,
    phone: '+8801611667788',
    designation: 'TREASURER',
  },
  additionalECMembers: [
    {
      id: 'EC-ADD-01',
      memberId: 'PHSM-056',
      name: 'Shahin Ahmed',
      designation: 'MEMBER',
      honorariumBDT: 20000,
      phone: '+8801911445566',
      appointedAt: '2026-01-10T10:00:00.000Z',
      appointedBy: 'Saif Ahmed Sakil (System Admin)',
    },
    {
      id: 'EC-ADD-02',
      memberId: 'PHSM-071',
      name: 'Abul Hashim',
      designation: 'MEMBER',
      honorariumBDT: 20000,
      phone: '+8801511556677',
      appointedAt: '2026-01-10T10:00:00.000Z',
      appointedBy: 'Saif Ahmed Sakil (System Admin)',
    },
    {
      id: 'EC-ADD-03',
      memberId: 'PHSM-095',
      name: 'M Abu Yousuf',
      designation: 'MEMBER',
      honorariumBDT: 20000,
      phone: '+8801711778899',
      appointedAt: '2026-01-10T10:00:00.000Z',
      appointedBy: 'Saif Ahmed Sakil (System Admin)',
    },
    {
      id: 'EC-ADD-04',
      memberId: 'PHSM-102',
      name: 'Faizan Ahmed',
      designation: 'MEMBER',
      honorariumBDT: 20000,
      phone: '+8801811889900',
      appointedAt: '2026-01-10T10:00:00.000Z',
      appointedBy: 'Saif Ahmed Sakil (System Admin)',
    },
  ],
  termYear: '2025-2027',
  lastUpdated: '2026-01-10T10:00:00.000Z',
};

// --- Fresh Deployment: All Transaction & Sample Records Empty ---
export const INITIAL_INCOMES: IncomeEntry[] = [];

export const INITIAL_EXPENSES: ExpenseEntry[] = [];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'LOG-INIT-001',
    timestamp: '2026-01-10T10:00:00.000Z',
    userId: 'usr-admin',
    userName: 'Saif Ahmed Sakil',
    userRole: 'SYSTEM_ADMIN',
    action: 'CREATE',
    entity: 'SYSTEM_CONFIG',
    entityId: 'ROOT-INIT',
    details: 'System initialized for fresh deployment. 144 shareholder accounts, credentials, and Director governance structure active.',
  },
];

export const INITIAL_CHAT_MESSAGES: ChatMessage[] = [];

export const INITIAL_ELECTION_POLL: ElectionPoll = {
  id: 'POLL-2026-01',
  title: '2026-2028 Executive Committee Election',
  description: 'Official voting for the next term of Prottasha Housing Society Executive Committee. Each share owner (PHSM-001 to PHSM-144) is entitled to 1 vote per registered share.',
  position: 'President',
  status: 'INACTIVE', // Inactive by default until activated by System Admin
  isActivatedByAdmin: false, // Strict Rule: No Voting Until Election Module activated by System Admin
  createdAt: '2026-03-01T00:00:00.000Z',
  closingDate: '2026-04-15T23:59:59.000Z',
  candidates: [
    {
      id: 'CAND-01',
      name: 'M Masud Sawdagor',
      memberId: 'PHSM-021',
      position: 'President',
      manifesto: 'Accelerating land registration, establishing dedicated 33kV electric substation, and complete boundary fortification by Q3 2026.',
      votes: 0,
    },
    {
      id: 'CAND-02',
      name: 'Shahin Ahmed',
      memberId: 'PHSM-056',
      position: 'President',
      manifesto: 'Transparent procurement committees, rapid handover of Phase 1 plots, and zero-interest flexible installment timeline.',
      votes: 0,
    },
    {
      id: 'CAND-03',
      name: 'Abul Hashim',
      memberId: 'PHSM-071',
      position: 'President',
      manifesto: 'High-yield society reserve investments, commercial hub leasing revenue, and immediate stormwater drainage network.',
      votes: 0,
    },
  ],
  voters: {},
};

export const INITIAL_DOCUMENTS: SocietyDocument[] = [];

export const INITIAL_POSTS: DiscussionPost[] = [];

export const INITIAL_QUERIES: MemberQuery[] = [];
