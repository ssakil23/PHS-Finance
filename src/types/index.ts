/**
 * Prottasha Housing Society - Finance (PHS-Finance)
 * Core Domain Models and Type Definitions
 */

export type UserRole = 'SYSTEM_ADMIN' | 'DELEGATED_ADMIN' | 'MANAGER' | 'MEMBER';

export interface DirectorInfo {
  key: string;
  name: string;
  startShare: number;
  endShare: number;
  shareCount: number;
  phone?: string;
  email?: string;
  isUnit?: boolean;
}

export interface ProfileUpdateRequest {
  id: string;
  memberId: string;
  proposedName: string;
  proposedPhone: string;
  proposedEmail: string;
  proposedAddress: string;
  requestedAt: string;
  requestedBy: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  reviewRemarks?: string;
}

export interface Member {
  id: string; // e.g., 'PHSM-001'
  shareNumber: number; // 1 to 144
  name: string;
  phone: string;
  email: string;
  address: string;
  controllingDirectorKey: string;
  controllingDirectorName: string;
  joinedDate: string;
  status: 'ACTIVE' | 'INACTIVE';
  ecDesignation?: string;
  officialDesignation?: string;
  isEmpoweredForEntry?: boolean;
  pendingUpdate?: {
    name: string;
    phone: string;
    email: string;
    address: string;
    requestedAt: string;
  };
}

export type PaymentMethod = 
  | 'Bank Transfer' 
  | 'Cheque' 
  | 'Cash' 
  | 'bKash / Nagad' 
  | 'Pay Order';

export type IncomeType = 'GENERAL_DEPOSIT' | 'SALES_DEPOSIT';

export type EntryStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type TransactionTier = 'Tier-1' | 'Tier-2' | 'Tier-3' | 'Tier-4' | 'Tier-5';

export interface IncomeEntry {
  id: string; // e.g., 'DEP-2026-001'
  type: IncomeType;
  amount: number; // in BDT
  category: string; // Development Fee, Member Contribution, Installment, etc. or Sales
  date: string; // YYYY-MM-DD
  time?: string;
  tier?: TransactionTier; // Tier-1 to Tier-5
  
  // General Deposit fields
  shareOwnerId?: string; // PHSM-001 to PHSM-144
  memberName?: string;
  controllingDirector?: string;
  shareNumber?: number;

  // Sales Deposit fields
  salesDescription?: string;

  paymentMethod: PaymentMethod;
  referenceNumber?: string; // Cheque No, Bank Trx ID, etc.
  remarks: string;

  submitterId: string;
  submitterName: string;
  submitterRole: UserRole;

  status: EntryStatus;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
  rejectionReason?: string;

  isSoftDeleted?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseEntry {
  id: string; // e.g., 'EXP-2026-001'
  amount: number; // in BDT
  category: 
    | 'Salary' 
    | 'Purchase' 
    | 'Labor' 
    | 'Water Bill' 
    | 'Electricity Bill' 
    | 'Site Development' 
    | 'Legal & Registration' 
    | 'Maintenance' 
    | 'Security' 
    | 'Meeting Expense' 
    | 'Audit & Compliance' 
    | 'EC Honorarium'
    | 'Others'
    | string;
  date: string; // YYYY-MM-DD
  time?: string;
  tier?: TransactionTier; // Tier-1 to Tier-5

  submitterId: string;
  submitterName: string;
  submitterRole: UserRole;

  billRecipient: string; // Payee Name / Contractor / Authority
  voucherNumber?: string;
  remarks: string;

  status: EntryStatus;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
  rejectionReason?: string;

  isSoftDeleted?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OfficialUser {
  id: string;
  username: string;
  name: string;
  designation: 'Manager' | 'Deputy Manager (DyM)' | 'Assistant Manager (AistM)' | 'Accounts Officer' | 'Site Supervisor' | 'Audit Officer';
  phone: string;
  email: string;
  department: string;
  isEmpoweredForEntry: boolean; // Empowered by System Admin to make Income/Expense entries
  empoweredBy?: string;
  empoweredAt?: string;
  createdAt: string;
  createdBy: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  memberId?: string; // if role is MEMBER
  shareNumber?: number;
  directorKey?: string; // if user is a director
  phone?: string;
  email?: string;
  department?: string;
  isDelegatedAdmin?: boolean;
  officialDesignation?: string;
  isEmpoweredForEntry?: boolean; // Empowered by System Admin
  ecDesignation?: 'President' | 'VICE PRESIDENT (VP)' | 'Vice President' | 'General Secretary' | 'TREASURER' | 'Treasurer' | 'MEMBER' | 'EC Member' | 'None' | string;
  monthlyHonorariumBDT?: number;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: 
    | 'CREATE' 
    | 'UPDATE' 
    | 'SOFT_DELETE' 
    | 'HARD_DELETE' 
    | 'APPROVE' 
    | 'REJECT' 
    | 'EXPORT_BACKUP' 
    | 'RESTORE_BACKUP' 
    | 'EC_VOTE' 
    | 'HONORARIUM_UPDATE'
    | 'MEMBER_UPDATE'
    | 'LOGIN';
  entity: 'INCOME' | 'EXPENSE' | 'USER' | 'MEMBER' | 'EC_COMMITTEE' | 'SYSTEM_CONFIG' | 'CHAT';
  entityId: string;
  details: string;
  ipAddress?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  senderMemberId?: string;
  message: string;
  timestamp: string;
  category: 'GENERAL' | 'FINANCE_QUERY' | 'EC_NOTICE' | 'DEVELOPMENT_UPDATE';
  isRemovedByModerator?: boolean;
  moderatedBy?: string;
}

export interface ElectionCandidate {
  id: string;
  name: string;
  memberId: string;
  position: 'President' | 'General Secretary' | 'Treasurer' | 'General EC Member';
  manifesto: string;
  votes: number;
}

export interface ElectionPoll {
  id: string;
  title: string;
  description: string;
  position: 'President' | 'General Secretary' | 'Treasurer' | 'General EC Member';
  candidates: ElectionCandidate[];
  voters: Record<string, string>; // memberId -> candidateId
  status: 'ACTIVE' | 'CLOSED' | 'INACTIVE';
  isActivatedByAdmin: boolean; // Must be activated by System Admin for voting to be allowed
  activatedAt?: string;
  activatedBy?: string;
  createdAt: string;
  closingDate: string;
}

export interface PromotedECMember {
  id: string;
  memberId: string;
  name: string;
  designation: string; // e.g. "EC Member", "Executive Member", "Joint Secretary", "Vice President"
  honorariumBDT: number;
  phone: string;
  appointedAt: string;
  appointedBy: string; // Must be System Admin
}

export interface ECLeadershipMember {
  name: string;
  memberId: string;
  honorariumBDT: number;
  phone: string;
  designation?: string;
}

export interface ExecutiveCommittee {
  president: ECLeadershipMember;
  vicePresident?: ECLeadershipMember;
  generalSecretary: ECLeadershipMember;
  treasurer: ECLeadershipMember;
  additionalECMembers?: PromotedECMember[];
  termYear: string;
  lastUpdated: string;
}
