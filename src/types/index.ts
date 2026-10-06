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
  proposedNidOrBirthId?: string;
  proposedDob?: string;
  proposedEducation?: string;
  proposedPermanentAddress?: string;
  proposedCurrentAddress?: string;
  proposedSpouseName?: string;
  proposedSpouseMobile?: string;
  proposedEmergencyContact?: string;
  proposedPhotoUrl?: string; // 2x2 passport photo data URL
  currentPhotoUrl?: string;
  isPhotoOnly?: boolean;
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
  
  // 2x2 Passport Photo fields
  photoUrl?: string; // 2x2 passport photo data URL (1:1 ratio)
  photoStatus?: 'AUTHORIZED' | 'PENDING_AUTHORIZATION' | 'REJECTED';
  photoAuthorizedBy?: string;
  photoAuthorizedByName?: string;
  photoAuthorizedAt?: string;
  photoUpdatedBy?: string;
  photoUpdatedAt?: string;
  photoRejectReason?: string;
  pendingPhotoUrl?: string; // photo awaiting official / admin authorization
  pendingPhotoRequestedAt?: string;

  // Member demographic & contact fields
  nidOrBirthId?: string;
  dob?: string; // YYYY-MM-DD
  education?: string;
  permanentAddress?: string;
  currentAddress?: string;
  spouseName?: string;
  spouseMobile?: string;
  emergencyContact?: string;

  pendingUpdate?: {
    name: string;
    phone: string;
    email: string;
    address: string;
    nidOrBirthId?: string;
    dob?: string;
    education?: string;
    permanentAddress?: string;
    currentAddress?: string;
    spouseName?: string;
    spouseMobile?: string;
    emergencyContact?: string;
    proposedPhotoUrl?: string;
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
  subCategory?: string;
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
  photoUrl?: string; // 2x2 passport photo data URL
  photoStatus?: 'AUTHORIZED' | 'PENDING_AUTHORIZATION' | 'REJECTED';
  photoAuthorizedBy?: string;
  photoAuthorizedByName?: string;
  photoAuthorizedAt?: string;
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
  requiresPasswordChange?: boolean;
  hasChangedDefaultPassword?: boolean;
  isLocked?: boolean;
  lockedReason?: string;
  lockedAt?: string;
  lockedBy?: string;
  photoUrl?: string; // 2x2 passport photo data URL
  photoStatus?: 'AUTHORIZED' | 'PENDING_AUTHORIZATION' | 'REJECTED';
  photoAuthorizedBy?: string;
  photoAuthorizedByName?: string;
  photoAuthorizedAt?: string;
  pendingPhotoUrl?: string;
}

export interface BudgetCategoryTarget {
  category: string;
  targetAmountBDT: number; // in BDT
  notes?: string;
}

export interface AnnualBudget {
  id: string; // e.g., 'BUDGET-FY-2025-2026'
  fiscalYear: string; // e.g., '2025-2026'
  title: string;
  totalBudgetTargetBDT: number;
  categoryTargets: BudgetCategoryTarget[];
  status: 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
  approvedByBoard: boolean;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

export interface BudgetVarianceItem {
  category: string;
  budgetTargetBDT: number;
  targetAmountBDT?: number;
  actualExpenseBDT: number;
  varianceBDT: number; // target - actual (positive = under budget / surplus, negative = over budget / deficit)
  variancePercentage: number;
  utilizationRate: number; // (actual / budget) * 100
  status: 'UNDER_BUDGET' | 'ON_TRACK' | 'OVER_BUDGET';
}

export interface AnnualBudgetVarianceReport {
  fiscalYear: string;
  totalBudgetTargetBDT: number;
  totalActualExpenseBDT: number;
  netVarianceBDT: number;
  overallUtilizationRate: number;
  favorableCategoriesCount: number;
  unfavorableCategoriesCount: number;
  items: BudgetVarianceItem[];
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
    | 'LOCK_USER'
    | 'UNLOCK_USER'
    | 'PASSWORD_RESET'
    | 'BUDGET_UPDATE'
    | 'LOGIN';
  entity: 'INCOME' | 'EXPENSE' | 'USER' | 'MEMBER' | 'EC_COMMITTEE' | 'SYSTEM_CONFIG' | 'CHAT' | 'DOCUMENT' | 'QUERY' | 'BUDGET';
  entityId: string;
  details: string;
  ipAddress?: string;
}

export type DocumentCategory = 
  | 'Executive Committee Notice'
  | 'Site & Land Development'
  | 'Legal & Deed Porcha'
  | 'Financial & Audit Report'
  | 'Engineering & Layout Map'
  | 'Member Circular & Guidelines';

export interface SocietyDocument {
  id: string; // e.g. 'DOC-2026-001'
  title: string;
  category: DocumentCategory;
  description: string;
  fileName: string;
  fileType: 'PDF' | 'DOCX' | 'XLSX' | 'JPG' | 'PNG' | 'ZIP';
  fileSize: string;
  fileDataUrl?: string; // base64 or SVG or downloadable text/data
  uploadedBy: string; // Name
  uploadedByRole: UserRole | string;
  uploadedByDesignation?: string;
  uploadedAt: string;
  isPinned?: boolean;
  downloadCount: number;
}

export type QueryCategory = 
  | 'Finance & Deposit Query'
  | 'Site & Land Development'
  | 'Share Transfer & Ownership'
  | 'Utility & Infrastructure'
  | 'General Inquiry';

export interface QueryResponse {
  id: string;
  responderName: string;
  responderRole: string;
  responderDesignation?: string;
  message: string;
  respondedAt: string;
  attachmentName?: string;
}

export interface MemberQuery {
  id: string; // e.g. 'QRY-2026-001'
  memberId: string;
  shareNumber?: number;
  submitterName: string;
  submitterPhone?: string;
  category: QueryCategory;
  subject: string;
  details: string;
  referenceId?: string; // e.g. 'DEP-2026-001' or 'Plot-14'
  attachmentUrl?: string;
  attachmentName?: string;
  status: 'OPEN' | 'IN_REVIEW' | 'RESOLVED';
  submittedAt: string;
  assignedTo?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionRemarks?: string;
  responses: QueryResponse[];
}

export interface DiscussionPost {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  senderMemberId?: string;
  senderDesignation?: string;
  message: string;
  category: 
    | 'PROJECT_PROGRESS' 
    | 'INFO_SHARING' 
    | 'PICTURE_SHARING' 
    | 'GENERAL';
  timestamp: string;
  imageUrl?: string;
  imageCaption?: string;
  likesCount: number;
  likedBy: string[]; // user IDs
  comments: {
    id: string;
    userName: string;
    userRole: string;
    message: string;
    timestamp: string;
  }[];
  isRemovedByModerator?: boolean;
  moderatedBy?: string;
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

export interface OverduePaymentAlert {
  id: string; // e.g. 'ALERT-OD-2026-001'
  memberId: string;
  memberName: string;
  shareNumber: number;
  controllingDirectorName: string;
  overdueAmountBDT: number;
  memberPersonalDepositBDT: number;
  memberShareExpenseBDT: number;
  sentAt: string;
  sentBy: string; // Name of sender (Admin/Director)
  sentByRole: UserRole | string;
  channel: 'INFO_COMMUNICATION_VIEW';
  status: 'DISPATCHED' | 'ACKNOWLEDGED' | 'RESOLVED';
  queryId?: string; // ID of Query ticket in InfoCommunicationView
  documentId?: string; // ID of official Notice Document in InfoCommunicationView
  noticeText: string;
}

export interface SocietySummaryReportData {
  fiscalYear?: string;
  incomes: IncomeEntry[];
  expenses: ExpenseEntry[];
  members: Member[];
  currentUser?: User | null;
  annualBudget?: AnnualBudget;
  reportDate?: string;
}

export type PeriodicPasswordInterval = 30 | 60 | 90 | 180 | 365 | 0;

export interface PeriodicPasswordHistoryItem {
  id: string;
  timestamp: string;
  setByName: string;
  setByIdentifier: string;
  initialPasswordPreview: string;
  initialPasswordValue: string;
  rotationFrequencyDays: number;
  appliedScope: 'ALL_USERS_EXCEPT_ROOT' | 'ALL_MEMBERS' | 'OFFICIALS_ONLY' | 'SYSTEM_DEFAULT_ONLY';
  affectedUsersCount: number;
  status: 'APPLIED_AND_FORCED_CHANGE' | 'POLICY_UPDATED';
  remarks?: string;
}

export interface PeriodicPasswordPolicy {
  initialPassword: string;
  rotationFrequencyDays: number; // 30, 60, 90, 180, 365, or 0 (Manual)
  lastRotatedAt: string; // ISO date
  nextRotationDue: string; // ISO date
  lastRotatedByName: string;
  lastRotatedById: string;
  forcePasswordChangeOnLogin: boolean; // default true
  rotationCycleName: string;
  history: PeriodicPasswordHistoryItem[];
}

export interface PeriodicPasswordStatus {
  isOverdue: boolean;
  daysRemaining: number;
  daysOverdue: number;
  nextDueDate: string;
  lastRotatedDate: string;
  frequencyLabel: string;
}

export interface SystemSnapshotRecord {
  id: string;
  timestamp: string;
  label: string;
  createdByName: string;
  createdByRole: string;
  sourceDomain: string;
  totalRecordsCount: number;
  dataSizeKB: number;
  checksum: string;
  entityBreakdown: {
    members: number;
    incomes: number;
    expenses: number;
    officials: number;
    budgets: number;
    documents: number;
    passwords: number;
  };
  jsonPayload: string;
}

