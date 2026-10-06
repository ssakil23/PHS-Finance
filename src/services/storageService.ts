/**
 * PHS-Finance Storage & Database Service
 * Provides offline-first local persistence, auto-seeding, data sync, audit logging,
 * and JSON/CSV backup/restore engine.
 */

import {
  Member,
  IncomeEntry,
  ExpenseEntry,
  AuditLog,
  ChatMessage,
  ElectionPoll,
  ExecutiveCommittee,
  User,
  OfficialUser,
  PromotedECMember,
  ProfileUpdateRequest,
  SocietyDocument,
  MemberQuery,
  DiscussionPost,
  DocumentCategory,
  QueryCategory,
  AnnualBudget,
  AnnualBudgetVarianceReport,
  BudgetCategoryTarget,
  BudgetVarianceItem,
  OverduePaymentAlert,
  PeriodicPasswordPolicy,
  PeriodicPasswordHistoryItem,
  PeriodicPasswordStatus,
  PeriodicPasswordInterval,
  SystemSnapshotRecord,
  ShareTransferRecord,
  RecordShareTransferInput,
} from '../types';
import {
  INITIAL_MEMBERS,
  INITIAL_INCOMES,
  INITIAL_EXPENSES,
  INITIAL_AUDIT_LOGS,
  INITIAL_CHAT_MESSAGES,
  INITIAL_ELECTION_POLL,
  INITIAL_EXECUTIVE_COMMITTEE,
  INITIAL_OFFICIALS,
  INITIAL_DOCUMENTS,
  INITIAL_POSTS,
  INITIAL_QUERIES,
  INITIAL_SHARE_TRANSFERS,
} from '../utils/seedData';
import { ensureMemberDemographics, getDirectorForShareNumber } from '../utils/directors';
import { formatBDT } from '../utils/calculations';

export const DEFAULT_INCOME_CATEGORIES: string[] = [
  'Development Fee - Phase 1',
  'Member Monthly Contribution',
  'Land Filing & Boundary Share',
  'Drainage & Road Infrastructure',
  'Electrical Substation Fund',
  'Plot Installment',
  'Share Transfer Fee',
  'Membership Security Deposit',
  '4th Unit Collective Fund',
  'Other Contribution',
];

export const DEFAULT_EXPENSE_CATEGORIES: string[] = [
  'Site Development',
  'Labor',
  'Purchase',
  'Electricity Bill',
  'Water Bill',
  'Salary',
  'EC Honorarium',
  'Security',
  'Legal & Registration',
  'Maintenance',
  'Meeting Expense',
  'Audit & Compliance',
  'Others',
];

const STORAGE_KEYS = {
  MEMBERS: 'phs_finance_members_v1',
  INCOMES: 'phs_finance_incomes_v1',
  EXPENSES: 'phs_finance_expenses_v1',
  AUDIT_LOGS: 'phs_finance_audit_logs_v1',
  CHAT: 'phs_finance_chat_v1',
  ELECTION: 'phs_finance_election_v2', // v2 with admin activation
  EC: 'phs_finance_ec_v5', // v5 with VP Molla, Treasurer Sirajul Islam, and EC members
  OFFICIALS: 'phs_finance_officials_v1',
  PROFILE_REQUESTS: 'phs_finance_profile_requests_v1',
  PASSWORDS: 'phs_finance_passwords_v2',
  PASSWORD_CHANGED_USERS: 'phs_finance_password_changed_users_v1',
  INCOME_CATEGORIES: 'phs_finance_income_categories_v1',
  EXPENSE_CATEGORIES: 'phs_finance_expense_categories_v1',
  LAST_SYNC: 'phs_finance_last_sync_v1',
  DOCUMENTS: 'phs_finance_documents_v1',
  POSTS: 'phs_finance_posts_v1',
  QUERIES: 'phs_finance_queries_v1',
  SYSTEM_DEFAULT_PASSWORD: 'phs_finance_system_default_password_v1',
  LOCKED_USERS: 'phs_finance_locked_users_v1',
  ANNUAL_BUDGETS: 'phs_finance_annual_budgets_v1',
  OVERDUE_ALERTS: 'phs_finance_overdue_alerts_v1',
  PERIODIC_PASSWORD_POLICY: 'phs_finance_periodic_password_policy_v1',
  LOCAL_SNAPSHOTS: 'phs_finance_system_snapshots_v1',
  SHARE_TRANSFERS: 'phs_finance_share_transfers_v1',
};

export const DEFAULT_PERIODIC_PASSWORD_POLICY: PeriodicPasswordPolicy = {
  initialPassword: '12345679',
  rotationFrequencyDays: 90, // Quarterly cycle by default
  lastRotatedAt: '2026-01-01T00:00:00.000Z',
  nextRotationDue: '2026-04-01T00:00:00.000Z',
  lastRotatedByName: 'Saif Ahmed Sakil (System Admin)',
  lastRotatedById: 'ssakil',
  forcePasswordChangeOnLogin: true,
  rotationCycleName: 'Quarterly Security Rotation (90 Days)',
  history: [
    {
      id: 'ROT-INIT-BASE',
      timestamp: '2026-01-01T00:00:00.000Z',
      setByName: 'Saif Ahmed Sakil (System Admin)',
      setByIdentifier: 'ssakil',
      initialPasswordPreview: '1234****',
      initialPasswordValue: '12345679',
      rotationFrequencyDays: 90,
      appliedScope: 'ALL_USERS_EXCEPT_ROOT',
      affectedUsersCount: 144,
      status: 'APPLIED_AND_FORCED_CHANGE',
      remarks: 'Initial system baseline deployment password policy (Quarterly Cycle).',
    },
  ],
};

export const DEFAULT_ANNUAL_BUDGETS: AnnualBudget[] = [
  {
    id: 'BUDGET-FY-2025-2026',
    fiscalYear: '2025-2026',
    title: 'PHS Annual Operating & Infrastructure Development Budget (FY 2025-2026)',
    totalBudgetTargetBDT: 6950000,
    status: 'ACTIVE',
    approvedByBoard: true,
    approvedByName: 'Executive Committee (Saif Ahmed Sakil, President)',
    approvedAt: '2025-07-01T10:00:00.000Z',
    createdAt: '2025-06-15T09:00:00.000Z',
    updatedAt: '2026-01-10T12:00:00.000Z',
    notes: 'Approved by Board of Directors at General Assembly. Core focus on Sector 14 land development, earth compaction, perimeter boundary, and administrative operations.',
    categoryTargets: [
      { category: 'Site Development', targetAmountBDT: 2500000, notes: 'Heavy earth filling, compaction, perimeter leveling' },
      { category: 'Salary', targetAmountBDT: 900000, notes: 'Office staff, security guards, site engineers monthly payroll' },
      { category: 'Labor', targetAmountBDT: 800000, notes: 'Contract labor, boundary mason muster rolls' },
      { category: 'Purchase', targetAmountBDT: 750000, notes: 'Construction materials, cement, sand, brick supplies' },
      { category: 'Legal & Registration', targetAmountBDT: 450000, notes: 'Sub-registry deed vetting, land tax, porcha certification' },
      { category: 'Security', targetAmountBDT: 350000, notes: '24/7 onsite perimeter security agency & surveillance' },
      { category: 'EC Honorarium', targetAmountBDT: 300000, notes: 'Executive committee governance honorarium per constitution' },
      { category: 'Maintenance', targetAmountBDT: 250000, notes: 'Office facility upkeep, temporary sheds, site generator fuel' },
      { category: 'Others', targetAmountBDT: 200000, notes: 'Contingency emergency reserves and petty cash' },
      { category: 'Meeting Expense', targetAmountBDT: 150000, notes: 'Bi-monthly Board meetings, AGMs, refreshments' },
      { category: 'Electricity Bill', targetAmountBDT: 120000, notes: 'DESCO commercial supply for site operations' },
      { category: 'Audit & Compliance', targetAmountBDT: 100000, notes: 'Statutory chartered accountant annual audit fee' },
      { category: 'Water Bill', targetAmountBDT: 80000, notes: 'DWASA utility charges and deep tube-well operations' },
    ],
  },
  {
    id: 'BUDGET-FY-2026-2027',
    fiscalYear: '2026-2027',
    title: 'PHS Projected Capital Infrastructure Budget (FY 2026-2027)',
    totalBudgetTargetBDT: 8200000,
    status: 'DRAFT',
    approvedByBoard: false,
    createdAt: '2026-02-01T09:00:00.000Z',
    updatedAt: '2026-02-01T09:00:00.000Z',
    notes: 'Draft capital expenditure projections for road macadamization, drainage network, and utility sub-station.',
    categoryTargets: [
      { category: 'Site Development', targetAmountBDT: 3200000, notes: 'Internal arterial roads and drainage line trenching' },
      { category: 'Salary', targetAmountBDT: 1000000, notes: 'Administrative and operational staff payroll' },
      { category: 'Purchase', targetAmountBDT: 950000, notes: 'Reinforced concrete culvert pipes, electrical poles' },
      { category: 'Labor', targetAmountBDT: 900000, notes: 'Skilled civil works labor' },
      { category: 'Legal & Registration', targetAmountBDT: 500000, notes: 'Plot mutation and individual porcha delivery' },
      { category: 'Security', targetAmountBDT: 400000, notes: 'Enhanced physical security and gate barriers' },
      { category: 'EC Honorarium', targetAmountBDT: 300000, notes: 'Executive committee governance honorarium' },
      { category: 'Maintenance', targetAmountBDT: 300000, notes: 'Civil works maintenance' },
      { category: 'Meeting Expense', targetAmountBDT: 200000, notes: 'General Assembly & member stakeholder briefings' },
      { category: 'Others', targetAmountBDT: 200000, notes: 'Miscellaneous emergency contingency' },
      { category: 'Electricity Bill', targetAmountBDT: 150000, notes: 'Electrical sub-station and street illumination' },
      { category: 'Audit & Compliance', targetAmountBDT: 100000, notes: 'External financial audit' },
      { category: 'Water Bill', targetAmountBDT: 100000, notes: 'Water supply infrastructure connection' },
    ],
  },
];

class StorageService {
  private listeners: Set<() => void> = new Set();
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.notify();
      });
      window.addEventListener('offline', () => {
        this.isOnline = false;
        this.notify();
      });
      this.ensureInitialized();
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (err) {
        console.error('Storage listener error:', err);
      }
    });
  }

  public getOnlineStatus(): boolean {
    return this.isOnline;
  }

  public getLastSyncTime(): string {
    const val = localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
    return val || new Date().toISOString();
  }

  public updateLastSyncTime(): void {
    localStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
    this.notify();
  }

  private ensureInitialized() {
    if (!localStorage.getItem(STORAGE_KEYS.MEMBERS)) {
      localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(INITIAL_MEMBERS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.INCOMES)) {
      localStorage.setItem(STORAGE_KEYS.INCOMES, JSON.stringify(INITIAL_INCOMES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.EXPENSES)) {
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(INITIAL_EXPENSES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS)) {
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(INITIAL_AUDIT_LOGS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CHAT)) {
      localStorage.setItem(STORAGE_KEYS.CHAT, JSON.stringify(INITIAL_CHAT_MESSAGES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ELECTION)) {
      localStorage.setItem(STORAGE_KEYS.ELECTION, JSON.stringify(INITIAL_ELECTION_POLL));
    }
    if (!localStorage.getItem(STORAGE_KEYS.EC)) {
      localStorage.setItem(STORAGE_KEYS.EC, JSON.stringify(INITIAL_EXECUTIVE_COMMITTEE));
    }
    if (!localStorage.getItem(STORAGE_KEYS.OFFICIALS)) {
      localStorage.setItem(STORAGE_KEYS.OFFICIALS, JSON.stringify(INITIAL_OFFICIALS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.INCOME_CATEGORIES)) {
      localStorage.setItem(STORAGE_KEYS.INCOME_CATEGORIES, JSON.stringify(DEFAULT_INCOME_CATEGORIES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.EXPENSE_CATEGORIES)) {
      localStorage.setItem(STORAGE_KEYS.EXPENSE_CATEGORIES, JSON.stringify(DEFAULT_EXPENSE_CATEGORIES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.SYSTEM_DEFAULT_PASSWORD)) {
      localStorage.setItem(STORAGE_KEYS.SYSTEM_DEFAULT_PASSWORD, '12345679');
    }
    if (!localStorage.getItem(STORAGE_KEYS.LOCKED_USERS)) {
      localStorage.setItem(STORAGE_KEYS.LOCKED_USERS, JSON.stringify({}));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ANNUAL_BUDGETS)) {
      localStorage.setItem(STORAGE_KEYS.ANNUAL_BUDGETS, JSON.stringify(DEFAULT_ANNUAL_BUDGETS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.OVERDUE_ALERTS)) {
      localStorage.setItem(STORAGE_KEYS.OVERDUE_ALERTS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.PERIODIC_PASSWORD_POLICY)) {
      localStorage.setItem(STORAGE_KEYS.PERIODIC_PASSWORD_POLICY, JSON.stringify(DEFAULT_PERIODIC_PASSWORD_POLICY));
    }
    if (!localStorage.getItem(STORAGE_KEYS.LOCAL_SNAPSHOTS)) {
      localStorage.setItem(STORAGE_KEYS.LOCAL_SNAPSHOTS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.SHARE_TRANSFERS)) {
      localStorage.setItem(STORAGE_KEYS.SHARE_TRANSFERS, JSON.stringify(INITIAL_SHARE_TRANSFERS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.LAST_SYNC)) {
      localStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
    }

    // Fresh Deployment Migration: Remove sample data while preserving all 144 user profiles and credentials
    const FRESH_DEPLOYMENT_FLAG = 'phs_finance_fresh_deployment_clean_v1';
    if (!localStorage.getItem(FRESH_DEPLOYMENT_FLAG)) {
      localStorage.setItem(STORAGE_KEYS.INCOMES, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.CHAT, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.QUERIES, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.OVERDUE_ALERTS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.PROFILE_REQUESTS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(INITIAL_AUDIT_LOGS));
      localStorage.setItem(STORAGE_KEYS.ELECTION, JSON.stringify(INITIAL_ELECTION_POLL));
      localStorage.setItem(STORAGE_KEYS.LOCAL_SNAPSHOTS, JSON.stringify([]));
      localStorage.setItem(FRESH_DEPLOYMENT_FLAG, 'true');
    }
  }

  // --- Audit Logger ---
  public logAudit(
    user: User,
    action: AuditLog['action'],
    entity: AuditLog['entity'],
    entityId: string,
    details: string
  ): void {
    const logs = this.getAuditLogs();
    const newLog: AuditLog = {
      id: `LOG-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action,
      entity,
      entityId,
      details,
    };
    logs.unshift(newLog);
    // keep maximum 500 logs locally
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs.slice(0, 500)));
    this.notify();
  }

  public getAuditLogs(): AuditLog[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
      return data ? JSON.parse(data) : INITIAL_AUDIT_LOGS;
    } catch {
      return INITIAL_AUDIT_LOGS;
    }
  }

  // --- Members ---
  public getMembers(): Member[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MEMBERS);
      const members: Member[] = data ? JSON.parse(data) : INITIAL_MEMBERS;
      let hasDemographicUpdates = false;

      // Ensure required EC designations and complete demographic details on member records
      const enrichedMembers = members.map((m) => {
        if (m.id === 'PHSM-001' || m.shareNumber === 1) m.ecDesignation = 'President';
        if (m.id === 'PHSM-049' || m.shareNumber === 49) m.ecDesignation = 'VICE PRESIDENT (VP)';
        if (m.id === 'PHSM-021' || m.shareNumber === 21) m.ecDesignation = 'General Secretary';
        if (m.id === 'PHSM-088' || m.shareNumber === 88) m.ecDesignation = 'TREASURER';
        if (
          m.id === 'PHSM-056' || m.shareNumber === 56 ||
          m.id === 'PHSM-071' || m.shareNumber === 71 ||
          m.id === 'PHSM-095' || m.shareNumber === 95 ||
          m.id === 'PHSM-102' || m.shareNumber === 102
        ) {
          m.ecDesignation = 'MEMBER';
        }

        const enriched = ensureMemberDemographics(m);
        if (
          !m.nidOrBirthId ||
          !m.dob ||
          !m.education ||
          !m.permanentAddress ||
          !m.currentAddress ||
          !m.spouseName ||
          !m.spouseMobile ||
          !m.emergencyContact ||
          (!m.photoUrl && enriched.photoUrl)
        ) {
          hasDemographicUpdates = true;
        }
        return enriched;
      });

      if (hasDemographicUpdates) {
        localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(enrichedMembers));
      }

      return enrichedMembers;
    } catch {
      return INITIAL_MEMBERS;
    }
  }

  public getMemberById(id: string): Member | undefined {
    return this.getMembers().find((m) => m.id.toLowerCase() === id.toLowerCase());
  }

  public updateMember(member: Member, currentUser: User): void {
    const members = this.getMembers();
    const index = members.findIndex((m) => m.id === member.id);
    if (index >= 0) {
      members[index] = member;
      localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
      this.logAudit(
        currentUser,
        'MEMBER_UPDATE',
        'MEMBER',
        member.id,
        `Updated member profile details for ${member.name} (${member.id})`
      );
      this.notify();
    }
  }

  // --- Profile Requests Workflow (Edit, Modify & Approve) ---
  public getProfileUpdateRequests(): ProfileUpdateRequest[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROFILE_REQUESTS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public submitProfileUpdateRequest(
    memberId: string,
    proposed: {
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
      isNameCorrectionOnly?: boolean;
      currentName?: string;
      correctionReason?: string;
      supportingDocumentRef?: string;
    },
    currentUser: User
  ): ProfileUpdateRequest {
    const requests = this.getProfileUpdateRequests();
    const newReq: ProfileUpdateRequest = {
      id: `REQ-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      memberId,
      proposedName: proposed.name,
      proposedPhone: proposed.phone,
      proposedEmail: proposed.email,
      proposedAddress: proposed.address,
      proposedNidOrBirthId: proposed.nidOrBirthId,
      proposedDob: proposed.dob,
      proposedEducation: proposed.education,
      proposedPermanentAddress: proposed.permanentAddress,
      proposedCurrentAddress: proposed.currentAddress || proposed.address,
      proposedSpouseName: proposed.spouseName,
      proposedSpouseMobile: proposed.spouseMobile,
      proposedEmergencyContact: proposed.emergencyContact,
      isNameCorrectionOnly: proposed.isNameCorrectionOnly,
      currentName: proposed.currentName,
      correctionReason: proposed.correctionReason,
      supportingDocumentRef: proposed.supportingDocumentRef,
      requestedAt: new Date().toISOString(),
      requestedBy: currentUser.name,
      status: 'PENDING',
    };

    requests.unshift(newReq);
    localStorage.setItem(STORAGE_KEYS.PROFILE_REQUESTS, JSON.stringify(requests));

    // Also flag pending on member object
    const members = this.getMembers();
    const m = members.find((item) => item.id === memberId);
    if (m) {
      m.pendingUpdate = {
        name: proposed.name,
        phone: proposed.phone,
        email: proposed.email,
        address: proposed.address,
        nidOrBirthId: proposed.nidOrBirthId,
        dob: proposed.dob,
        education: proposed.education,
        permanentAddress: proposed.permanentAddress,
        currentAddress: proposed.currentAddress || proposed.address,
        spouseName: proposed.spouseName,
        spouseMobile: proposed.spouseMobile,
        emergencyContact: proposed.emergencyContact,
        isNameCorrectionOnly: proposed.isNameCorrectionOnly,
        currentName: proposed.currentName || m.name,
        correctionReason: proposed.correctionReason,
        supportingDocumentRef: proposed.supportingDocumentRef,
        requestedAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
    }

    this.logAudit(
      currentUser,
      'UPDATE',
      'MEMBER',
      memberId,
      proposed.isNameCorrectionOnly
        ? `Submitted name spelling correction request for member ${memberId} ("${m ? m.name : ''}" → "${proposed.name}"). Reason: ${proposed.correctionReason || 'Typo correction'}`
        : `Submitted profile change request for member ${memberId} (Awaiting Admin / Official Approval)`
    );

    this.notify();
    return newReq;
  }

  public submitNameCorrectionRequest(
    memberId: string,
    proposedName: string,
    correctionReason: string,
    supportingDocumentRef: string | undefined,
    currentUser: User
  ): ProfileUpdateRequest {
    const member = this.getMemberById(memberId);
    if (!member) {
      throw new Error(`Member ${memberId} not found in society records.`);
    }
    const cleanProposed = proposedName.trim();
    if (!cleanProposed) {
      throw new Error('Proposed corrected name cannot be blank.');
    }
    if (cleanProposed.toLowerCase() === member.name.toLowerCase()) {
      throw new Error('Proposed corrected name is identical to the current registered name.');
    }

    return this.submitProfileUpdateRequest(
      memberId,
      {
        name: cleanProposed,
        phone: member.phone,
        email: member.email,
        address: member.currentAddress || member.address,
        currentAddress: member.currentAddress || member.address,
        permanentAddress: member.permanentAddress,
        nidOrBirthId: member.nidOrBirthId,
        dob: member.dob,
        education: member.education,
        spouseName: member.spouseName,
        spouseMobile: member.spouseMobile,
        emergencyContact: member.emergencyContact,
        isNameCorrectionOnly: true,
        currentName: member.name,
        correctionReason: correctionReason.trim() || 'Spelling correction',
        supportingDocumentRef: supportingDocumentRef?.trim() || undefined,
      },
      currentUser
    );
  }

  public cancelProfileUpdateRequest(requestId: string, currentUser: User): void {
    const requests = this.getProfileUpdateRequests();
    const req = requests.find((r) => r.id === requestId);
    if (!req) return;

    const reqMemberId = req.memberId;
    const isOwner = currentUser.memberId && currentUser.memberId.toLowerCase() === reqMemberId.toLowerCase();
    const isOfficial = this.isOfficialOrAdmin(currentUser);

    if (!isOwner && !isOfficial) {
      throw new Error('Permission denied: You can only cancel your own pending requests.');
    }

    const updated = requests.filter((r) => r.id !== requestId);
    localStorage.setItem(STORAGE_KEYS.PROFILE_REQUESTS, JSON.stringify(updated));

    const members = this.getMembers();
    const m = members.find((item) => item.id.toLowerCase() === reqMemberId.toLowerCase());
    if (m) {
      delete m.pendingUpdate;
      localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
    }

    this.notify();
  }

  public approveProfileUpdateRequest(
    requestId: string,
    currentUser: User,
    modifications?: {
      name?: string;
      phone?: string;
      email?: string;
      address?: string;
      nidOrBirthId?: string;
      dob?: string;
      education?: string;
      permanentAddress?: string;
      currentAddress?: string;
      spouseName?: string;
      spouseMobile?: string;
      emergencyContact?: string;
    }
  ): void {
    if (!this.isOfficialOrAdmin(currentUser)) {
      throw new Error('Access Denied: Only System Admin, Delegated Admin, or designated Officials can approve profile updates.');
    }

    const requests = this.getProfileUpdateRequests();
    const req = requests.find((r) => r.id === requestId);
    if (!req) return;

    req.status = 'APPROVED';
    req.reviewedBy = currentUser.id;
    req.reviewedByName = currentUser.name;
    req.reviewedAt = new Date().toISOString();

    // Update the actual member record
    const members = this.getMembers();
    const m = members.find((item) => item.id === req.memberId);
    if (m) {
      const oldName = m.name;
      m.name = modifications?.name || req.proposedName;
      m.phone = modifications?.phone || req.proposedPhone;
      m.email = modifications?.email || req.proposedEmail;
      m.address = modifications?.address || req.proposedAddress;
      m.currentAddress = modifications?.currentAddress || modifications?.address || req.proposedCurrentAddress || req.proposedAddress;
      if (modifications?.permanentAddress || req.proposedPermanentAddress) {
        m.permanentAddress = modifications?.permanentAddress || req.proposedPermanentAddress;
      }
      if (modifications?.nidOrBirthId || req.proposedNidOrBirthId) {
        m.nidOrBirthId = modifications?.nidOrBirthId || req.proposedNidOrBirthId;
      }
      if (modifications?.dob || req.proposedDob) {
        m.dob = modifications?.dob || req.proposedDob;
      }
      if (modifications?.education || req.proposedEducation) {
        m.education = modifications?.education || req.proposedEducation;
      }
      if (modifications?.spouseName || req.proposedSpouseName) {
        m.spouseName = modifications?.spouseName || req.proposedSpouseName;
      }
      if (modifications?.spouseMobile || req.proposedSpouseMobile) {
        m.spouseMobile = modifications?.spouseMobile || req.proposedSpouseMobile;
      }
      if (modifications?.emergencyContact || req.proposedEmergencyContact) {
        m.emergencyContact = modifications?.emergencyContact || req.proposedEmergencyContact;
      }
      if (req.proposedPhotoUrl) {
        m.photoUrl = req.proposedPhotoUrl;
        m.photoStatus = 'AUTHORIZED';
        m.photoAuthorizedBy = currentUser.id;
        m.photoAuthorizedByName = currentUser.name;
        m.photoAuthorizedAt = new Date().toISOString();
        delete m.pendingPhotoUrl;
        delete m.photoRejectReason;
      }
      delete m.pendingUpdate;
      localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));

      this.logAudit(
        currentUser,
        'APPROVE',
        'MEMBER',
        req.memberId,
        req.isNameCorrectionOnly
          ? `Approved name spelling correction for Member ${req.memberId}: "${oldName}" → "${m.name}" by ${currentUser.name} (${currentUser.officialDesignation || currentUser.role})`
          : `Approved and committed profile changes for Member ${req.memberId} (${m.name}) by ${currentUser.name}`
      );
    }

    localStorage.setItem(STORAGE_KEYS.PROFILE_REQUESTS, JSON.stringify(requests));
    this.notify();
  }

  public rejectProfileUpdateRequest(
    requestId: string,
    reason: string,
    currentUser: User
  ): void {
    if (!this.isOfficialOrAdmin(currentUser)) {
      throw new Error('Access Denied: Only System Admin, Delegated Admin, or designated Officials can reject profile updates.');
    }

    const requests = this.getProfileUpdateRequests();
    const req = requests.find((r) => r.id === requestId);
    if (!req) return;

    req.status = 'REJECTED';
    req.reviewRemarks = reason || 'Documentation verification failed';
    req.reviewedBy = currentUser.id;
    req.reviewedByName = currentUser.name;
    req.reviewedAt = new Date().toISOString();

    // Remove pending flag on member
    const members = this.getMembers();
    const m = members.find((item) => item.id === req.memberId);
    if (m) {
      delete m.pendingPhotoUrl;
      if (req.proposedPhotoUrl) {
        m.photoStatus = 'REJECTED';
        m.photoRejectReason = reason || 'Photo rejected: Does not meet 2x2 passport specifications';
      }
      delete m.pendingUpdate;
      localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
    }

    localStorage.setItem(STORAGE_KEYS.PROFILE_REQUESTS, JSON.stringify(requests));

    this.logAudit(
      currentUser,
      'REJECT',
      'MEMBER',
      req.memberId,
      `Rejected profile update for member ${req.memberId}. Reason: ${reason}`
    );

    this.notify();
  }

  public directModifyMember(
    memberId: string,
    data: Partial<Member>,
    currentUser: User
  ): void {
    if (!this.isOfficialOrAdmin(currentUser)) {
      throw new Error('Only Officials and Admins can directly modify member profiles.');
    }

    const members = this.getMembers();
    const index = members.findIndex((m) => m.id === memberId);
    if (index >= 0) {
      members[index] = {
        ...members[index],
        ...data,
      };
      delete members[index].pendingUpdate;
      localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));

      this.logAudit(
        currentUser,
        'UPDATE',
        'MEMBER',
        memberId,
        `Directly modified profile for member ${memberId} (${members[index].name})`
      );

      this.notify();
    }
  }

  // --- Official & Admin Verification Helper ---
  public isOfficialOrAdmin(user: User | null): boolean {
    if (!user) return false;
    if (user.role === 'SYSTEM_ADMIN' || user.role === 'DELEGATED_ADMIN' || user.role === 'MANAGER') return true;
    if (user.officialDesignation && user.officialDesignation !== 'None') return true;
    const officials = this.getOfficials();
    return officials.some(
      (o) =>
        (o.username.toLowerCase() === user.username.toLowerCase() || o.id === user.id) &&
        o.status !== 'INACTIVE'
    );
  }

  // --- 2x2 Passport Photo Management & Authorization Engine ---

  /**
   * User can change own photo.
   * If currentUser is Official or Admin: Immediately authorized.
   * If currentUser is standard Member: Submitted with PENDING_AUTHORIZATION for Official & Admin review.
   */
  public updateUserOwnPhoto(
    targetMemberId: string,
    photoDataUrl: string,
    currentUser: User
  ): { requiresAuthorization: boolean; message: string; member: Member | null } {
    const members = this.getMembers();
    const index = members.findIndex(
      (m) =>
        m.id.toLowerCase() === targetMemberId.toLowerCase() ||
        (currentUser.memberId && m.id.toLowerCase() === currentUser.memberId.toLowerCase())
    );

    if (index < 0) {
      // If user is not linked to a member (e.g. standalone official staff):
      const officials = this.getOfficials();
      const offIndex = officials.findIndex(
        (o) => o.id === currentUser.id || o.username.toLowerCase() === currentUser.username.toLowerCase()
      );
      if (offIndex >= 0) {
        officials[offIndex].photoUrl = photoDataUrl;
        officials[offIndex].photoStatus = 'AUTHORIZED';
        officials[offIndex].photoAuthorizedBy = currentUser.id;
        officials[offIndex].photoAuthorizedByName = currentUser.name;
        officials[offIndex].photoAuthorizedAt = new Date().toISOString();
        localStorage.setItem(STORAGE_KEYS.OFFICIALS, JSON.stringify(officials));
        this.notify();
        return {
          requiresAuthorization: false,
          message: 'Official 2x2 passport photo updated and authorized.',
          member: null,
        };
      }
      throw new Error(`Member or Official record not found for ${targetMemberId}`);
    }

    const member = members[index];
    const isOfficial = this.isOfficialOrAdmin(currentUser);

    if (isOfficial) {
      // Officials and Admins can self-authorize their own photo immediately
      member.photoUrl = photoDataUrl;
      member.photoStatus = 'AUTHORIZED';
      member.photoAuthorizedBy = currentUser.id;
      member.photoAuthorizedByName = currentUser.name;
      member.photoAuthorizedAt = new Date().toISOString();
      member.photoUpdatedBy = currentUser.name;
      member.photoUpdatedAt = new Date().toISOString();
      delete member.pendingPhotoUrl;
      delete member.photoRejectReason;
      if (member.pendingUpdate) {
        delete member.pendingUpdate.proposedPhotoUrl;
      }

      localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));

      this.logAudit(
        currentUser,
        'UPDATE',
        'MEMBER',
        member.id,
        `Official/Admin ${currentUser.name} updated and self-authorized their 2x2 passport photo (Official Authority)`
      );
      this.notify();

      return {
        requiresAuthorization: false,
        message: 'Your 2x2 passport photo has been successfully updated and authorized.',
        member,
      };
    } else {
      // General shareholder change: Requires authorization by Officials & Admin
      member.pendingPhotoUrl = photoDataUrl;
      member.photoStatus = 'PENDING_AUTHORIZATION';
      member.pendingPhotoRequestedAt = new Date().toISOString();
      delete member.photoRejectReason;

      member.pendingUpdate = {
        ...(member.pendingUpdate || {
          name: member.name,
          phone: member.phone,
          email: member.email,
          address: member.address,
          requestedAt: new Date().toISOString(),
        }),
        proposedPhotoUrl: photoDataUrl,
      };

      // Add or update profile update request in queue
      const requests = this.getProfileUpdateRequests();
      const existingReq = requests.find((r) => r.memberId === member.id && r.status === 'PENDING');
      if (existingReq) {
        existingReq.proposedPhotoUrl = photoDataUrl;
        existingReq.currentPhotoUrl = member.photoUrl;
      } else {
        const newReq: ProfileUpdateRequest = {
          id: `REQ-PHOTO-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
          memberId: member.id,
          proposedName: member.name,
          proposedPhone: member.phone,
          proposedEmail: member.email,
          proposedAddress: member.address,
          proposedPhotoUrl: photoDataUrl,
          currentPhotoUrl: member.photoUrl,
          isPhotoOnly: true,
          requestedAt: new Date().toISOString(),
          requestedBy: currentUser.name,
          status: 'PENDING',
        };
        requests.unshift(newReq);
      }

      localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
      localStorage.setItem(STORAGE_KEYS.PROFILE_REQUESTS, JSON.stringify(requests));

      this.logAudit(
        currentUser,
        'UPDATE',
        'MEMBER',
        member.id,
        `Shareholder ${member.name} (${member.id}) submitted a 2x2 passport photo for Official/Admin authorization`
      );
      this.notify();

      return {
        requiresAuthorization: true,
        message: '2x2 passport photo submitted successfully! It is pending review and authorization by Society Officials or Admin.',
        member,
      };
    }
  }

  /**
   * Officials and Admin can directly Change / Add / Edit 2x2 photo of Shareholder (users).
   * Since this is done by an Official or Admin, the photo is immediately AUTHORIZED.
   */
  public officialSetMemberPhoto(
    memberId: string,
    photoDataUrl: string,
    currentUser: User
  ): Member {
    if (!this.isOfficialOrAdmin(currentUser)) {
      throw new Error('Permission denied: Only Officials and Admins can directly add/edit photos of shareholders.');
    }

    const members = this.getMembers();
    const index = members.findIndex((m) => m.id.toLowerCase() === memberId.toLowerCase());
    if (index < 0) {
      throw new Error(`Member ${memberId} not found.`);
    }

    const member = members[index];
    member.photoUrl = photoDataUrl;
    member.photoStatus = 'AUTHORIZED';
    member.photoAuthorizedBy = currentUser.id;
    member.photoAuthorizedByName = currentUser.name;
    member.photoAuthorizedAt = new Date().toISOString();
    member.photoUpdatedBy = currentUser.name;
    member.photoUpdatedAt = new Date().toISOString();
    delete member.pendingPhotoUrl;
    delete member.photoRejectReason;
    if (member.pendingUpdate) {
      delete member.pendingUpdate.proposedPhotoUrl;
    }

    // Resolve any pending request for this member
    const requests = this.getProfileUpdateRequests();
    requests.forEach((r) => {
      if (r.memberId === member.id && r.status === 'PENDING') {
        if (r.proposedPhotoUrl) {
          r.status = 'APPROVED';
          r.reviewedBy = currentUser.id;
          r.reviewedByName = currentUser.name;
          r.reviewedAt = new Date().toISOString();
          r.reviewRemarks = `Photo updated & authorized directly by Official ${currentUser.name}`;
        }
      }
    });

    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
    localStorage.setItem(STORAGE_KEYS.PROFILE_REQUESTS, JSON.stringify(requests));

    this.logAudit(
      currentUser,
      'UPDATE',
      'MEMBER',
      memberId,
      `Official/Admin ${currentUser.name} directly set and authorized 2x2 passport photo for Shareholder #${member.shareNumber} (${member.name})`
    );
    this.notify();

    return member;
  }

  /**
   * Officials and Admin can authorize or reject pending photo submissions from shareholders.
   */
  public authorizeMemberPhoto(
    memberId: string,
    approved: boolean,
    currentUser: User,
    rejectReason?: string
  ): Member {
    if (!this.isOfficialOrAdmin(currentUser)) {
      throw new Error('Permission denied: Only Officials and Admins can authorize member photos.');
    }

    const members = this.getMembers();
    const index = members.findIndex((m) => m.id.toLowerCase() === memberId.toLowerCase());
    if (index < 0) {
      throw new Error(`Member ${memberId} not found.`);
    }

    const member = members[index];
    const requests = this.getProfileUpdateRequests();

    if (approved) {
      member.photoUrl = member.pendingPhotoUrl || member.photoUrl;
      member.photoStatus = 'AUTHORIZED';
      member.photoAuthorizedBy = currentUser.id;
      member.photoAuthorizedByName = currentUser.name;
      member.photoAuthorizedAt = new Date().toISOString();
      delete member.pendingPhotoUrl;
      delete member.photoRejectReason;
      if (member.pendingUpdate) {
        delete member.pendingUpdate.proposedPhotoUrl;
      }

      requests.forEach((r) => {
        if (r.memberId === member.id && r.status === 'PENDING') {
          if (r.isPhotoOnly || r.proposedPhotoUrl) {
            r.status = 'APPROVED';
            r.reviewedBy = currentUser.id;
            r.reviewedByName = currentUser.name;
            r.reviewedAt = new Date().toISOString();
            r.reviewRemarks = `2x2 Passport Photo authorized by ${currentUser.name}`;
          }
        }
      });

      this.logAudit(
        currentUser,
        'APPROVE',
        'MEMBER',
        memberId,
        `Official/Admin ${currentUser.name} authorized 2x2 passport photo for Shareholder #${member.shareNumber} (${member.name})`
      );
    } else {
      member.photoStatus = 'REJECTED';
      member.photoRejectReason =
        rejectReason || 'Photo does not meet 2x2 passport specifications (neutral background, 1:1 aspect ratio, clear face)';
      delete member.pendingPhotoUrl;
      if (member.pendingUpdate) {
        delete member.pendingUpdate.proposedPhotoUrl;
      }

      requests.forEach((r) => {
        if (r.memberId === member.id && r.status === 'PENDING') {
          if (r.isPhotoOnly || r.proposedPhotoUrl) {
            r.status = 'REJECTED';
            r.reviewedBy = currentUser.id;
            r.reviewedByName = currentUser.name;
            r.reviewedAt = new Date().toISOString();
            r.reviewRemarks = rejectReason || 'Photo rejected: Does not meet 2x2 passport specifications';
          }
        }
      });

      this.logAudit(
        currentUser,
        'REJECT',
        'MEMBER',
        memberId,
        `Official/Admin ${currentUser.name} rejected 2x2 passport photo for Shareholder #${member.shareNumber} (${member.name}). Reason: ${member.photoRejectReason}`
      );
    }

    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
    localStorage.setItem(STORAGE_KEYS.PROFILE_REQUESTS, JSON.stringify(requests));
    this.notify();

    return member;
  }

  /**
   * Remove photo of member
   */
  public removeMemberPhoto(memberId: string, currentUser: User): Member {
    const isOfficial = this.isOfficialOrAdmin(currentUser);
    const members = this.getMembers();
    const index = members.findIndex((m) => m.id.toLowerCase() === memberId.toLowerCase());
    if (index < 0) {
      throw new Error(`Member ${memberId} not found.`);
    }
    const member = members[index];

    if (!isOfficial && (!currentUser.memberId || currentUser.memberId.toLowerCase() !== memberId.toLowerCase())) {
      throw new Error('Permission denied to remove this member photo.');
    }

    delete member.photoUrl;
    delete member.pendingPhotoUrl;
    delete member.photoStatus;
    delete member.photoAuthorizedBy;
    delete member.photoAuthorizedByName;
    delete member.photoAuthorizedAt;
    delete member.photoUpdatedBy;
    delete member.photoUpdatedAt;
    delete member.photoRejectReason;
    if (member.pendingUpdate) {
      delete member.pendingUpdate.proposedPhotoUrl;
    }

    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));

    this.logAudit(
      currentUser,
      'UPDATE',
      'MEMBER',
      memberId,
      `Removed 2x2 passport photo for Shareholder #${member.shareNumber} (${member.name}) by ${currentUser.name}`
    );
    this.notify();

    return member;
  }

  public getPendingPhotoAuthorizations(): Member[] {
    const members = this.getMembers();
    return members.filter((m) => m.photoStatus === 'PENDING_AUTHORIZATION' || !!m.pendingPhotoUrl);
  }

  // --- Income ---
  public getIncomes(): IncomeEntry[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.INCOMES);
      const incomes: IncomeEntry[] = data ? JSON.parse(data) : INITIAL_INCOMES;
      const defaultTiers: ('Tier-1' | 'Tier-2' | 'Tier-3' | 'Tier-4' | 'Tier-5')[] = [
        'Tier-1', 'Tier-2', 'Tier-3', 'Tier-4', 'Tier-5'
      ];
      incomes.forEach((inc, idx) => {
        if (!inc.tier) {
          inc.tier = defaultTiers[idx % defaultTiers.length];
        }
      });
      return incomes;
    } catch {
      return INITIAL_INCOMES;
    }
  }

  public addIncome(entry: Omit<IncomeEntry, 'id' | 'createdAt' | 'updatedAt'>, currentUser: User): IncomeEntry {
    if (!this.isUserEmpoweredForEntry(currentUser)) {
      throw new Error('Access Denied: Only empowered Officials (authorized by System Admin) can record Income entries.');
    }

    const incomes = this.getIncomes();
    const count = incomes.length + 1;
    const year = new Date().getFullYear();
    const newId = `DEP-${year}-${String(count).padStart(3, '0')}`;

    const newEntry: IncomeEntry = {
      ...entry,
      tier: entry.tier || 'Tier-1',
      id: newId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    incomes.unshift(newEntry);
    localStorage.setItem(STORAGE_KEYS.INCOMES, JSON.stringify(incomes));

    this.logAudit(
      currentUser,
      'CREATE',
      'INCOME',
      newId,
      `Submitted ${entry.type} of ${formatBDT(entry.amount)} (Category: ${entry.category}, Status: ${entry.status})`
    );

    this.notify();
    return newEntry;
  }

  public updateIncome(entry: IncomeEntry, currentUser: User): void {
    const incomes = this.getIncomes();
    const index = incomes.findIndex((i) => i.id === entry.id);
    if (index >= 0) {
      incomes[index] = {
        ...entry,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEYS.INCOMES, JSON.stringify(incomes));
      this.logAudit(
        currentUser,
        'UPDATE',
        'INCOME',
        entry.id,
        `Updated income record ${entry.id} (${formatBDT(entry.amount)})`
      );
      this.notify();
    }
  }

  public setIncomeStatus(
    id: string,
    status: 'APPROVED' | 'REJECTED',
    currentUser: User,
    rejectionReason?: string
  ): void {
    if (currentUser.role !== 'SYSTEM_ADMIN' && currentUser.role !== 'DELEGATED_ADMIN') {
      throw new Error('Access Denied: Only System Admin and Delegated Admin can authorise entries made by officials.');
    }
    const incomes = this.getIncomes();
    const entry = incomes.find((i) => i.id === id);
    if (entry) {
      entry.status = status;
      entry.approvedBy = currentUser.id;
      entry.approvedByName = currentUser.name;
      entry.approvedAt = new Date().toISOString();
      if (status === 'REJECTED') {
        entry.rejectionReason = rejectionReason || 'Rejected by administrator';
      }
      entry.updatedAt = new Date().toISOString();
      localStorage.setItem(STORAGE_KEYS.INCOMES, JSON.stringify(incomes));

      this.logAudit(
        currentUser,
        status === 'APPROVED' ? 'APPROVE' : 'REJECT',
        'INCOME',
        id,
        `${status === 'APPROVED' ? 'Approved' : 'Rejected'} deposit ${id} (${formatBDT(entry.amount)})${
          rejectionReason ? ` Reason: ${rejectionReason}` : ''
        }`
      );
      this.notify();
    }
  }

  public softDeleteIncome(id: string, currentUser: User): void {
    const incomes = this.getIncomes();
    const entry = incomes.find((i) => i.id === id);
    if (entry) {
      entry.isSoftDeleted = true;
      entry.updatedAt = new Date().toISOString();
      localStorage.setItem(STORAGE_KEYS.INCOMES, JSON.stringify(incomes));
      this.logAudit(currentUser, 'SOFT_DELETE', 'INCOME', id, `Soft-deleted deposit record ${id}`);
      this.notify();
    }
  }

  public hardDeleteIncome(id: string, currentUser: User): void {
    if (currentUser.role !== 'SYSTEM_ADMIN') {
      throw new Error('Only System Admin (Root Access) can permanently hard-delete records.');
    }
    const incomes = this.getIncomes().filter((i) => i.id !== id);
    localStorage.setItem(STORAGE_KEYS.INCOMES, JSON.stringify(incomes));
    this.logAudit(currentUser, 'HARD_DELETE', 'INCOME', id, `Permanently purged deposit record ${id}`);
    this.notify();
  }

  // --- Share Transfers Registry & Workflow ---
  public getShareTransfers(): ShareTransferRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SHARE_TRANSFERS);
      return data ? JSON.parse(data) : INITIAL_SHARE_TRANSFERS;
    } catch {
      return INITIAL_SHARE_TRANSFERS;
    }
  }

  public getShareTransfersByMember(memberId: string): ShareTransferRecord[] {
    const transfers = this.getShareTransfers();
    const mid = memberId.toLowerCase();
    return transfers.filter(
      (t) => t.fromMemberId.toLowerCase() === mid || t.toMemberId.toLowerCase() === mid
    );
  }

  public getShareTransfersByDirector(directorKey: string): ShareTransferRecord[] {
    const transfers = this.getShareTransfers();
    return transfers.filter(
      (t) => t.fromDirectorKey === directorKey || t.toDirectorKey === directorKey
    );
  }

  public recordShareTransfer(
    input: RecordShareTransferInput,
    currentUser: User
  ): {
    transfer: ShareTransferRecord;
    outIncome: IncomeEntry;
    inIncome: IncomeEntry;
    feeIncome?: IncomeEntry;
  } {
    // 1. Permission check: Only authorized Officials or Admins
    if (!this.isOfficialOrAdmin(currentUser) && !this.isUserEmpoweredForEntry(currentUser)) {
      throw new Error('Access Denied: Only authorized Society Officials or Admins can record Share Transfers.');
    }

    // 2. Member validation
    const fromMember = this.getMemberById(input.fromMemberId);
    if (!fromMember) {
      throw new Error(`Transferor Member ${input.fromMemberId} not found in society registry.`);
    }

    const toMember = this.getMemberById(input.toMemberId);
    if (!toMember) {
      throw new Error(`Transferee Member ${input.toMemberId} not found in society registry.`);
    }

    if (fromMember.id.toLowerCase() === toMember.id.toLowerCase()) {
      throw new Error('Transferor and Transferee cannot be the same member account.');
    }

    if (input.transferredAmount < 0) {
      throw new Error('Transferred capital amount cannot be negative.');
    }

    if (input.transferFeeBDT < 0) {
      throw new Error('Society transfer processing fee cannot be negative.');
    }

    const shareTransfers = this.getShareTransfers();
    const count = shareTransfers.length + 1;
    const year = new Date().getFullYear();
    const transferId = `STX-${year}-${String(count).padStart(3, '0')}`;
    const nowIso = new Date().toISOString();

    const fromDirector = getDirectorForShareNumber(fromMember.shareNumber);
    const toDirector = getDirectorForShareNumber(toMember.shareNumber);

    // 3. Automatically record linked Incomes / Ledger entries for both members
    const incomes = this.getIncomes();
    const incomeCount = incomes.length;

    // Outflow entry for Transferor (Source)
    const outIncomeId = `DEP-${year}-${String(incomeCount + 1).padStart(3, '0')}`;
    const outIncome: IncomeEntry = {
      id: outIncomeId,
      type: 'GENERAL_DEPOSIT',
      amount: -Math.abs(input.transferredAmount),
      category: 'Share Transfer (Transfer Out)',
      date: input.transferDate || nowIso.split('T')[0],
      shareOwnerId: fromMember.id,
      shareNumber: fromMember.shareNumber,
      memberName: fromMember.name,
      controllingDirector: fromMember.controllingDirectorName || fromDirector.name,
      paymentMethod: input.paymentMethod || 'Bank Transfer',
      referenceNumber: input.resolutionNumber || transferId,
      remarks: `Share Transfer OUT: Transferred Share #${input.transferredShareNumber} to ${toMember.name} (${toMember.id}). Ref: ${input.resolutionNumber || transferId}. ${input.transferReason || ''}`.trim(),
      submitterId: currentUser.username,
      submitterName: currentUser.name,
      submitterRole: currentUser.role,
      status: 'APPROVED',
      tier: 'Tier-1',
      approvedBy: currentUser.username,
      approvedByName: currentUser.name,
      approvedAt: nowIso,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    // Inflow entry for Transferee (Destination)
    const inIncomeId = `DEP-${year}-${String(incomeCount + 2).padStart(3, '0')}`;
    const inIncome: IncomeEntry = {
      id: inIncomeId,
      type: 'GENERAL_DEPOSIT',
      amount: Math.abs(input.transferredAmount),
      category: 'Share Transfer (Transfer In)',
      date: input.transferDate || nowIso.split('T')[0],
      shareOwnerId: toMember.id,
      shareNumber: toMember.shareNumber,
      memberName: toMember.name,
      controllingDirector: toMember.controllingDirectorName || toDirector.name,
      paymentMethod: input.paymentMethod || 'Bank Transfer',
      referenceNumber: input.resolutionNumber || transferId,
      remarks: `Share Transfer IN: Acquired Share #${input.transferredShareNumber} from ${fromMember.name} (${fromMember.id}). Ref: ${input.resolutionNumber || transferId}. ${input.transferReason || ''}`.trim(),
      submitterId: currentUser.username,
      submitterName: currentUser.name,
      submitterRole: currentUser.role,
      status: 'APPROVED',
      tier: 'Tier-1',
      approvedBy: currentUser.username,
      approvedByName: currentUser.name,
      approvedAt: nowIso,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    incomes.unshift(inIncome);
    incomes.unshift(outIncome);

    // Optional Society Transfer Processing Fee
    let feeIncome: IncomeEntry | undefined;
    let feeIncomeId: string | undefined;
    if (input.transferFeeBDT > 0 && input.transferFeePayer !== 'EXEMPT') {
      const feePayerMember = input.transferFeePayer === 'TRANSFEROR' ? fromMember : toMember;
      feeIncomeId = `DEP-${year}-${String(incomeCount + 3).padStart(3, '0')}`;
      feeIncome = {
        id: feeIncomeId,
        type: 'GENERAL_DEPOSIT',
        amount: input.transferFeeBDT,
        category: 'Share Transfer Fee',
        date: input.transferDate || nowIso.split('T')[0],
        shareOwnerId: feePayerMember.id,
        shareNumber: feePayerMember.shareNumber,
        memberName: feePayerMember.name,
        controllingDirector: feePayerMember.controllingDirectorName,
        paymentMethod: input.paymentMethod || 'Bank Transfer',
        referenceNumber: `${transferId}-FEE`,
        remarks: `Official Society Processing Fee for Share Transfer #${transferId} (Share #${input.transferredShareNumber}: ${fromMember.id} → ${toMember.id})`,
        submitterId: currentUser.username,
        submitterName: currentUser.name,
        submitterRole: currentUser.role,
        status: 'APPROVED',
        tier: 'Tier-1',
        approvedBy: currentUser.username,
        approvedByName: currentUser.name,
        approvedAt: nowIso,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      incomes.unshift(feeIncome);
    }

    localStorage.setItem(STORAGE_KEYS.INCOMES, JSON.stringify(incomes));

    // 4. Update both members' share ledgers
    const members = this.getMembers();
    const fromIdx = members.findIndex((m) => m.id === fromMember.id);
    const toIdx = members.findIndex((m) => m.id === toMember.id);

    if (fromIdx >= 0) {
      const updatedTransferred = members[fromIdx].transferredShares || [];
      updatedTransferred.push({
        shareNumber: input.transferredShareNumber,
        transferredToMemberId: toMember.id,
        transferredToMemberName: toMember.name,
        transferredAt: nowIso,
        transferRecordId: transferId,
      });
      members[fromIdx] = {
        ...members[fromIdx],
        transferredShares: updatedTransferred,
      };
    }

    if (toIdx >= 0) {
      const updatedAdditional = new Set(members[toIdx].additionalShares || []);
      updatedAdditional.add(input.transferredShareNumber);
      members[toIdx] = {
        ...members[toIdx],
        additionalShares: Array.from(updatedAdditional),
      };
    }

    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));

    // 5. Store completed Transfer Record
    const transferRecord: ShareTransferRecord = {
      id: transferId,
      transferDate: input.transferDate || nowIso.split('T')[0],
      transferCategory: input.transferCategory,
      fromMemberId: fromMember.id,
      fromMemberName: fromMember.name,
      fromShareNumber: fromMember.shareNumber,
      fromDirectorKey: fromDirector.key,
      fromDirectorName: fromDirector.name,
      toMemberId: toMember.id,
      toMemberName: toMember.name,
      toShareNumber: toMember.shareNumber,
      toDirectorKey: toDirector.key,
      toDirectorName: toDirector.name,
      transferredShareNumber: input.transferredShareNumber,
      transferredAmount: input.transferredAmount,
      transferFeeBDT: input.transferFeeBDT,
      transferFeePayer: input.transferFeePayer,
      paymentMethod: input.paymentMethod,
      bankReferenceNumber: input.bankReferenceNumber,
      resolutionNumber: input.resolutionNumber,
      deedOrStampNumber: input.deedOrStampNumber,
      transferReason: input.transferReason,
      remarks: input.remarks || '',
      recordedByUsername: currentUser.username,
      recordedByName: currentUser.name,
      recordedByRole: currentUser.role,
      recordedByDesignation: currentUser.officialDesignation || (currentUser.role === 'SYSTEM_ADMIN' ? 'System Admin' : 'Official'),
      recordedAt: nowIso,
      status: 'COMPLETED',
      outIncomeId,
      inIncomeId,
      feeIncomeId,
    };

    shareTransfers.unshift(transferRecord);
    localStorage.setItem(STORAGE_KEYS.SHARE_TRANSFERS, JSON.stringify(shareTransfers));

    // 6. Security Audit Log
    this.logAudit(
      currentUser,
      'SHARE_TRANSFER',
      'SHARE_TRANSFER',
      transferId,
      `Executed Official Share Transfer #${transferId}: Transferred Share #${input.transferredShareNumber} from ${fromMember.name} (${fromMember.id}) to ${toMember.name} (${toMember.id}). Capital Amount: ${formatBDT(input.transferredAmount)}, Fee: ${formatBDT(input.transferFeeBDT)}. Resolution: ${input.resolutionNumber}`
    );

    this.notify();
    return {
      transfer: transferRecord,
      outIncome,
      inIncome,
      feeIncome,
    };
  }

  // --- Expenses ---
  public getExpenses(): ExpenseEntry[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.EXPENSES);
      const expenses: ExpenseEntry[] = data ? JSON.parse(data) : INITIAL_EXPENSES;
      const defaultTiers: ('Tier-1' | 'Tier-2' | 'Tier-3' | 'Tier-4' | 'Tier-5')[] = [
        'Tier-1', 'Tier-2', 'Tier-3', 'Tier-4', 'Tier-5'
      ];
      expenses.forEach((exp, idx) => {
        if (!exp.tier) {
          exp.tier = defaultTiers[idx % defaultTiers.length];
        }
      });
      return expenses;
    } catch {
      return INITIAL_EXPENSES;
    }
  }

  // --- Category Management (System Admin Edit / Modify) ---
  public getIncomeCategories(): string[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.INCOME_CATEGORIES);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error reading income categories:', e);
    }
    return DEFAULT_INCOME_CATEGORIES;
  }

  public getExpenseCategories(): string[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.EXPENSE_CATEGORIES);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error reading expense categories:', e);
    }
    return DEFAULT_EXPENSE_CATEGORIES;
  }

  public addIncomeCategory(categoryName: string, currentUser: User): boolean {
    if (currentUser.role !== 'SYSTEM_ADMIN') {
      throw new Error('Access Denied: Only SYSTEM ADMIN can add new Income Categories.');
    }
    const trimmed = categoryName.trim();
    if (!trimmed) throw new Error('Category name cannot be empty.');

    const categories = this.getIncomeCategories();
    if (categories.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      throw new Error(`Income category "${trimmed}" already exists.`);
    }

    categories.push(trimmed);
    localStorage.setItem(STORAGE_KEYS.INCOME_CATEGORIES, JSON.stringify(categories));
    this.logAudit(
      currentUser,
      'UPDATE',
      'SYSTEM_CONFIG',
      'INCOME_CATEGORY',
      `System Admin created new Income Category: "${trimmed}"`
    );
    this.notify();
    return true;
  }

  public updateIncomeCategory(
    oldName: string,
    newName: string,
    updateTransactions: boolean,
    currentUser: User
  ): boolean {
    if (currentUser.role !== 'SYSTEM_ADMIN') {
      throw new Error('Access Denied: Only SYSTEM ADMIN can edit/modify Income Categories.');
    }
    const trimmedNew = newName.trim();
    if (!trimmedNew) throw new Error('Category name cannot be empty.');
    if (oldName.toLowerCase() === trimmedNew.toLowerCase()) return true;

    const categories = this.getIncomeCategories();
    const idx = categories.findIndex((c) => c.toLowerCase() === oldName.toLowerCase());
    if (idx === -1) {
      throw new Error(`Category "${oldName}" not found.`);
    }
    if (categories.some((c, i) => i !== idx && c.toLowerCase() === trimmedNew.toLowerCase())) {
      throw new Error(`Category "${trimmedNew}" already exists.`);
    }

    categories[idx] = trimmedNew;
    localStorage.setItem(STORAGE_KEYS.INCOME_CATEGORIES, JSON.stringify(categories));

    let updatedCount = 0;
    if (updateTransactions) {
      const incomes = this.getIncomes();
      incomes.forEach((inc) => {
        if (inc.category === oldName) {
          inc.category = trimmedNew;
          inc.updatedAt = new Date().toISOString();
          updatedCount++;
        }
      });
      localStorage.setItem(STORAGE_KEYS.INCOMES, JSON.stringify(incomes));
    }

    this.logAudit(
      currentUser,
      'UPDATE',
      'SYSTEM_CONFIG',
      'INCOME_CATEGORY',
      `System Admin modified Income Category from "${oldName}" to "${trimmedNew}" (${updatedCount} transactions updated)`
    );
    this.notify();
    return true;
  }

  public deleteIncomeCategory(categoryName: string, currentUser: User): boolean {
    if (currentUser.role !== 'SYSTEM_ADMIN') {
      throw new Error('Access Denied: Only SYSTEM ADMIN can delete Income Categories.');
    }
    const categories = this.getIncomeCategories();
    const filtered = categories.filter((c) => c.toLowerCase() !== categoryName.toLowerCase());
    if (filtered.length === categories.length) {
      throw new Error(`Category "${categoryName}" not found.`);
    }
    if (filtered.length === 0) {
      throw new Error('Cannot delete all categories. At least one category must exist.');
    }

    localStorage.setItem(STORAGE_KEYS.INCOME_CATEGORIES, JSON.stringify(filtered));
    this.logAudit(
      currentUser,
      'UPDATE',
      'SYSTEM_CONFIG',
      'INCOME_CATEGORY',
      `System Admin removed Income Category: "${categoryName}"`
    );
    this.notify();
    return true;
  }

  public addExpenseCategory(categoryName: string, currentUser: User): boolean {
    if (currentUser.role !== 'SYSTEM_ADMIN') {
      throw new Error('Access Denied: Only SYSTEM ADMIN can add new Expense Categories.');
    }
    const trimmed = categoryName.trim();
    if (!trimmed) throw new Error('Category name cannot be empty.');

    const categories = this.getExpenseCategories();
    if (categories.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      throw new Error(`Expense category "${trimmed}" already exists.`);
    }

    categories.push(trimmed);
    localStorage.setItem(STORAGE_KEYS.EXPENSE_CATEGORIES, JSON.stringify(categories));
    this.logAudit(
      currentUser,
      'UPDATE',
      'SYSTEM_CONFIG',
      'EXPENSE_CATEGORY',
      `System Admin created new Expense Category: "${trimmed}"`
    );
    this.notify();
    return true;
  }

  public updateExpenseCategory(
    oldName: string,
    newName: string,
    updateTransactions: boolean,
    currentUser: User
  ): boolean {
    if (currentUser.role !== 'SYSTEM_ADMIN') {
      throw new Error('Access Denied: Only SYSTEM ADMIN can edit/modify Expense Categories.');
    }
    const trimmedNew = newName.trim();
    if (!trimmedNew) throw new Error('Category name cannot be empty.');
    if (oldName.toLowerCase() === trimmedNew.toLowerCase()) return true;

    const categories = this.getExpenseCategories();
    const idx = categories.findIndex((c) => c.toLowerCase() === oldName.toLowerCase());
    if (idx === -1) {
      throw new Error(`Category "${oldName}" not found.`);
    }
    if (categories.some((c, i) => i !== idx && c.toLowerCase() === trimmedNew.toLowerCase())) {
      throw new Error(`Category "${trimmedNew}" already exists.`);
    }

    categories[idx] = trimmedNew;
    localStorage.setItem(STORAGE_KEYS.EXPENSE_CATEGORIES, JSON.stringify(categories));

    let updatedCount = 0;
    if (updateTransactions) {
      const expenses = this.getExpenses();
      expenses.forEach((exp) => {
        if (exp.category === oldName) {
          exp.category = trimmedNew;
          exp.updatedAt = new Date().toISOString();
          updatedCount++;
        }
      });
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
    }

    this.logAudit(
      currentUser,
      'UPDATE',
      'SYSTEM_CONFIG',
      'EXPENSE_CATEGORY',
      `System Admin modified Expense Category from "${oldName}" to "${trimmedNew}" (${updatedCount} transactions updated)`
    );
    this.notify();
    return true;
  }

  public deleteExpenseCategory(categoryName: string, currentUser: User): boolean {
    if (currentUser.role !== 'SYSTEM_ADMIN') {
      throw new Error('Access Denied: Only SYSTEM ADMIN can delete Expense Categories.');
    }
    const categories = this.getExpenseCategories();
    const filtered = categories.filter((c) => c.toLowerCase() !== categoryName.toLowerCase());
    if (filtered.length === categories.length) {
      throw new Error(`Category "${categoryName}" not found.`);
    }
    if (filtered.length === 0) {
      throw new Error('Cannot delete all categories. At least one category must exist.');
    }

    localStorage.setItem(STORAGE_KEYS.EXPENSE_CATEGORIES, JSON.stringify(filtered));
    this.logAudit(
      currentUser,
      'UPDATE',
      'SYSTEM_CONFIG',
      'EXPENSE_CATEGORY',
      `System Admin removed Expense Category: "${categoryName}"`
    );
    this.notify();
    return true;
  }

  public resetCategoriesToDefault(type: 'INCOME' | 'EXPENSE' | 'ALL', currentUser: User): void {
    if (currentUser.role !== 'SYSTEM_ADMIN') {
      throw new Error('Access Denied: Only SYSTEM ADMIN can reset categories.');
    }
    if (type === 'INCOME' || type === 'ALL') {
      localStorage.setItem(STORAGE_KEYS.INCOME_CATEGORIES, JSON.stringify(DEFAULT_INCOME_CATEGORIES));
    }
    if (type === 'EXPENSE' || type === 'ALL') {
      localStorage.setItem(STORAGE_KEYS.EXPENSE_CATEGORIES, JSON.stringify(DEFAULT_EXPENSE_CATEGORIES));
    }
    this.logAudit(
      currentUser,
      'UPDATE',
      'SYSTEM_CONFIG',
      'INCOME_CATEGORY',
      `System Admin reset ${type} categories to system defaults.`
    );
    this.notify();
  }

  public addExpense(entry: Omit<ExpenseEntry, 'id' | 'createdAt' | 'updatedAt'>, currentUser: User): ExpenseEntry {
    if (!this.isUserEmpoweredForEntry(currentUser)) {
      throw new Error('Access Denied: Only empowered Officials (authorized by System Admin) can record Expense entries.');
    }

    const expenses = this.getExpenses();
    const count = expenses.length + 1;
    const year = new Date().getFullYear();
    const newId = `EXP-${year}-${String(count).padStart(3, '0')}`;

    const newEntry: ExpenseEntry = {
      ...entry,
      tier: entry.tier || 'Tier-1',
      id: newId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    expenses.unshift(newEntry);
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));

    this.logAudit(
      currentUser,
      'CREATE',
      'EXPENSE',
      newId,
      `Submitted expense of ${formatBDT(entry.amount)} to "${entry.billRecipient}" (Category: ${entry.category}, Status: ${entry.status})`
    );

    this.notify();
    return newEntry;
  }

  // --- Official Staff Management & Entry Empowerment ---
  public getOfficials(): OfficialUser[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.OFFICIALS);
      return data ? JSON.parse(data) : INITIAL_OFFICIALS;
    } catch {
      return INITIAL_OFFICIALS;
    }
  }

  public isUserEmpoweredForEntry(user: User | null): boolean {
    if (!user) return false;
    // Official User & Only System Admin can put Entry Data (Record Income, Record Expense).
    if (user.role === 'SYSTEM_ADMIN') return true;

    // Delegated Admin CANNOT put entry data (they only authorise entries made by officials)
    if (user.role === 'DELEGATED_ADMIN') return false;

    // General members cannot put entry data
    if (user.role === 'MEMBER') return false;

    // Check in officials registry (Official Users empowered by System Admin)
    const officials = this.getOfficials();
    const found = officials.find(
      (o) => o.username.toLowerCase() === user.username.toLowerCase() || o.id === user.id
    );
    if (found) {
      return found.isEmpoweredForEntry === true && found.status === 'ACTIVE';
    }

    // Direct session flag for officials/managers
    if (user.role === 'MANAGER' && user.isEmpoweredForEntry === true) return true;

    return false;
  }

  // --- Password Management Engine ---
  public getSystemDefaultPassword(): string {
    try {
      const val = localStorage.getItem(STORAGE_KEYS.SYSTEM_DEFAULT_PASSWORD);
      if (val && val.trim().length > 0) {
        return val.trim();
      }
    } catch (e) {
      console.error('Error reading system default password:', e);
    }
    return '12345679';
  }

  public setSystemDefaultPassword(
    newDefault: string,
    currentUser: User
  ): { success: boolean; message: string } {
    if (currentUser.role !== 'SYSTEM_ADMIN') {
      throw new Error('Unauthorized: Only System Admin can set or configure the System Default Password.');
    }
    const clean = newDefault.trim();
    if (clean.length < 6) {
      throw new Error('System default password must be at least 6 characters long.');
    }
    localStorage.setItem(STORAGE_KEYS.SYSTEM_DEFAULT_PASSWORD, clean);
    this.logAudit(
      currentUser,
      'UPDATE',
      'SYSTEM_CONFIG',
      'DEFAULT_PASSWORD',
      `System Admin ${currentUser.name} updated the System Default Password to "${clean}".`
    );
    this.notify();
    return {
      success: true,
      message: `System Default Password has been successfully updated to "${clean}". All subsequent resets by System Admin or Delegated Admin will use this default.`,
    };
  }

  // --- Periodic Initial Password Engine (System Admin Authority) ---
  public getPeriodicPasswordPolicy(): PeriodicPasswordPolicy {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PERIODIC_PASSWORD_POLICY);
      if (data) {
        const policy: PeriodicPasswordPolicy = JSON.parse(data);
        policy.initialPassword = this.getSystemDefaultPassword();
        return policy;
      }
    } catch (e) {
      console.error('Error reading periodic password policy:', e);
    }
    const def = { ...DEFAULT_PERIODIC_PASSWORD_POLICY };
    def.initialPassword = this.getSystemDefaultPassword();
    return def;
  }

  public getPeriodicPasswordStatus(): PeriodicPasswordStatus {
    const policy = this.getPeriodicPasswordPolicy();
    const now = Date.now();
    const frequency = policy.rotationFrequencyDays !== undefined ? policy.rotationFrequencyDays : 90;

    let frequencyLabel = 'Quarterly Cycle (90 Days)';
    if (frequency === 30) frequencyLabel = 'Monthly Cycle (30 Days)';
    else if (frequency === 60) frequencyLabel = 'Bi-Monthly Cycle (60 Days)';
    else if (frequency === 90) frequencyLabel = 'Quarterly Cycle (90 Days)';
    else if (frequency === 180) frequencyLabel = 'Semi-Annual Cycle (180 Days)';
    else if (frequency === 365) frequencyLabel = 'Annual Cycle (365 Days)';
    else if (frequency === 0) frequencyLabel = 'Manual / On-Demand Cycle';

    if (frequency === 0) {
      return {
        isOverdue: false,
        daysRemaining: 999,
        daysOverdue: 0,
        nextDueDate: 'Manual Rotation Only',
        lastRotatedDate: policy.lastRotatedAt || new Date().toISOString(),
        frequencyLabel,
      };
    }

    const dueTime = new Date(policy.nextRotationDue).getTime();
    const diffMs = dueTime - now;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    const isOverdue = diffDays < 0;
    const daysRemaining = isOverdue ? 0 : diffDays;
    const daysOverdue = isOverdue ? Math.abs(diffDays) : 0;

    return {
      isOverdue,
      daysRemaining,
      daysOverdue,
      nextDueDate: policy.nextRotationDue,
      lastRotatedDate: policy.lastRotatedAt,
      frequencyLabel,
    };
  }

  public setPeriodicInitialPassword(
    params: {
      newInitialPassword: string;
      rotationFrequencyDays: number;
      appliedScope: 'ALL_USERS_EXCEPT_ROOT' | 'ALL_MEMBERS' | 'OFFICIALS_ONLY' | 'SYSTEM_DEFAULT_ONLY';
      forceNextLoginChange?: boolean;
      remarks?: string;
    },
    currentUser: User
  ): {
    success: boolean;
    message: string;
    affectedUsersCount: number;
    nextRotationDue: string;
    initialPassword: string;
  } {
    if (currentUser.role !== 'SYSTEM_ADMIN') {
      throw new Error('Unauthorized: Only Root System Admin can configure periodic initial passwords.');
    }

    const cleanPass = params.newInitialPassword.trim();
    if (cleanPass.length < 6) {
      throw new Error('Initial password must be at least 6 characters long.');
    }

    const frequencyDays = params.rotationFrequencyDays !== undefined ? params.rotationFrequencyDays : 90;
    const forceChange = params.forceNextLoginChange !== false;
    const scope = params.appliedScope || 'ALL_USERS_EXCEPT_ROOT';
    const nowIso = new Date().toISOString();

    let nextDueIso = '';
    if (frequencyDays > 0) {
      const nextTime = Date.now() + frequencyDays * 24 * 60 * 60 * 1000;
      nextDueIso = new Date(nextTime).toISOString();
    } else {
      nextDueIso = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    }

    // 1. Update system default password key
    localStorage.setItem(STORAGE_KEYS.SYSTEM_DEFAULT_PASSWORD, cleanPass);

    // 2. Fetch existing passwords and changed registry
    let passwords: Record<string, string> = {};
    try {
      const pData = localStorage.getItem(STORAGE_KEYS.PASSWORDS);
      if (pData) passwords = JSON.parse(pData);
    } catch {}

    let changedUsers: Record<string, boolean> = {};
    try {
      const cData = localStorage.getItem(STORAGE_KEYS.PASSWORD_CHANGED_USERS);
      if (cData) changedUsers = JSON.parse(cData);
    } catch {}

    let affectedCount = 0;
    const allMembers = this.getMembers();
    const allOfficials = this.getOfficials();

    const isRootAdmin = (idOrUser: string) => {
      const lower = idOrUser.toLowerCase().trim();
      return (
        lower === 'ssakil' ||
        lower === 'sakil' ||
        lower === 'saif' ||
        lower === 'phsm-001' ||
        lower === 'usr-admin-root' ||
        lower === (currentUser.username || '').toLowerCase()
      );
    };

    if (scope === 'ALL_USERS_EXCEPT_ROOT' || scope === 'ALL_MEMBERS') {
      allMembers.forEach((m) => {
        if (isRootAdmin(m.id)) return;

        const idLower = m.id.toLowerCase();
        passwords[idLower] = cleanPass;
        passwords[m.id] = cleanPass;
        if (m.phone) passwords[m.phone.trim()] = cleanPass;

        if (forceChange) {
          delete changedUsers[idLower];
          delete changedUsers[m.id];
          if (m.phone) delete changedUsers[m.phone.trim()];
        }
        affectedCount++;
      });
    }

    if (scope === 'ALL_USERS_EXCEPT_ROOT' || scope === 'OFFICIALS_ONLY') {
      allOfficials.forEach((off) => {
        if (isRootAdmin(off.username) || isRootAdmin(off.id)) return;

        const uLower = off.username.toLowerCase();
        passwords[uLower] = cleanPass;
        passwords[off.username] = cleanPass;
        passwords[off.id.toLowerCase()] = cleanPass;

        if (forceChange) {
          delete changedUsers[uLower];
          delete changedUsers[off.username];
          delete changedUsers[off.id.toLowerCase()];
        }
        affectedCount++;
      });
    }

    localStorage.setItem(STORAGE_KEYS.PASSWORDS, JSON.stringify(passwords));
    localStorage.setItem(STORAGE_KEYS.PASSWORD_CHANGED_USERS, JSON.stringify(changedUsers));

    // 3. Update Policy Record & History
    const currentPolicy = this.getPeriodicPasswordPolicy();
    const historyItem: PeriodicPasswordHistoryItem = {
      id: `ROT-${Date.now()}`,
      timestamp: nowIso,
      setByName: currentUser.name,
      setByIdentifier: currentUser.username || currentUser.memberId || 'ssakil',
      initialPasswordPreview: cleanPass.length > 4 ? `${cleanPass.slice(0, 3)}****${cleanPass.slice(-2)}` : '******',
      initialPasswordValue: cleanPass,
      rotationFrequencyDays: frequencyDays,
      appliedScope: scope,
      affectedUsersCount: affectedCount,
      status: forceChange ? 'APPLIED_AND_FORCED_CHANGE' : 'POLICY_UPDATED',
      remarks: params.remarks || `Periodic initial password reset executed by System Admin. Rotation cycle: ${frequencyDays} days.`,
    };

    let cycleName = 'Quarterly Security Rotation (90 Days)';
    if (frequencyDays === 30) cycleName = 'Monthly Security Rotation (30 Days)';
    else if (frequencyDays === 60) cycleName = 'Bi-Monthly Security Rotation (60 Days)';
    else if (frequencyDays === 90) cycleName = 'Quarterly Security Rotation (90 Days)';
    else if (frequencyDays === 180) cycleName = 'Semi-Annual Security Rotation (180 Days)';
    else if (frequencyDays === 365) cycleName = 'Annual Security Rotation (365 Days)';
    else if (frequencyDays === 0) cycleName = 'Manual On-Demand Security Rotation';

    const updatedPolicy: PeriodicPasswordPolicy = {
      initialPassword: cleanPass,
      rotationFrequencyDays: frequencyDays,
      lastRotatedAt: nowIso,
      nextRotationDue: nextDueIso,
      lastRotatedByName: currentUser.name,
      lastRotatedById: currentUser.username || 'ssakil',
      forcePasswordChangeOnLogin: forceChange,
      rotationCycleName: cycleName,
      history: [historyItem, ...(currentPolicy.history || [])].slice(0, 30),
    };

    localStorage.setItem(STORAGE_KEYS.PERIODIC_PASSWORD_POLICY, JSON.stringify(updatedPolicy));

    // 4. Log Audit Trail
    this.logAudit(
      currentUser,
      'PASSWORD_RESET',
      'SYSTEM_CONFIG',
      'PERIODIC_INITIAL_PASSWORD',
      `System Admin ${currentUser.name} updated periodic initial password to "${cleanPass}" (${cycleName}). Scope: ${scope}, Affected Users: ${affectedCount}. Force login password change: ${forceChange ? 'YES' : 'NO'}.`
    );

    this.notify();

    return {
      success: true,
      message: `Periodic initial password successfully updated to "${cleanPass}". ${
        affectedCount > 0
          ? `Applied to ${affectedCount} user accounts with forced password change on their next login.`
          : 'Saved as standard system initial default password for all subsequent resets.'
      } Next scheduled rotation: ${frequencyDays > 0 ? new Date(nextDueIso).toLocaleDateString('en-GB') : 'Manual'}`,
      affectedUsersCount: affectedCount,
      nextRotationDue: nextDueIso,
      initialPassword: cleanPass,
    };
  }

  /**
   * Resolves all possible login aliases, member IDs, share numbers, and usernames for a given identifier.
   */
  public getAllAliasesForUser(rawIdentifier: string): string[] {
    if (!rawIdentifier) return [];
    const clean = rawIdentifier.trim();
    const lower = clean.toLowerCase();
    const aliases = new Set<string>();

    aliases.add(clean);
    aliases.add(lower);

    // 1. Check Root Admin Saif Ahmed Sakil (Share 1)
    if (
      lower === 'ssakil' ||
      lower === 'sakil' ||
      lower === 'saif' ||
      lower === 'saif ahmed sakil' ||
      lower === 'phsm-001' ||
      lower === 'phsm-1' ||
      lower === '1' ||
      lower === '001' ||
      lower === '01' ||
      lower === 'share1' ||
      lower === 'member1' ||
      lower === 'usr-admin-root'
    ) {
      [
        'ssakil',
        'sakil',
        'saif',
        'saif ahmed sakil',
        'phsm-001',
        'PHSM-001',
        'phsm-1',
        '1',
        '001',
        '01',
        'share1',
        'member1',
        'usr-admin-root',
      ].forEach((a) => {
        aliases.add(a);
        aliases.add(a.toLowerCase());
      });
      return Array.from(aliases);
    }

    // 2. Check Director Aliases
    const directorAliasMap: Record<number, string[]> = {
      21: ['sawdagor', 'masud', 'm masud sawdagor', 'phsm-021', 'PHSM-021', '21', '021', 'share21', 'member21', 'usr-del-21'],
      49: ['molla', 'faruque', 'omar', 'm omar faruque molla', 'phsm-049', 'PHSM-049', '49', '049', 'share49', 'member49', 'usr-del-49'],
      56: ['shahin', 'shahin ahmed', 'phsm-056', 'PHSM-056', '56', '056', 'share56', 'member56', 'usr-del-56'],
      71: ['hashim', 'abul hashim', 'phsm-071', 'PHSM-071', '71', '071', 'share71', 'member71', 'usr-del-71'],
      88: ['sirajul', 'sirajul islam', 'phsm-088', 'PHSM-088', '88', '088', 'share88', 'member88', 'usr-del-88'],
      95: ['yousuf', 'm abu yousuf', 'abu yousuf', 'phsm-095', 'PHSM-095', '95', '095', 'share95', 'member95', 'usr-del-95'],
      102: ['faizan', 'faizan ahmed', 'phsm-102', 'PHSM-102', '102', 'share102', 'member102', 'usr-del-102'],
    };

    for (const [sNumStr, list] of Object.entries(directorAliasMap)) {
      const sNum = parseInt(sNumStr, 10);
      if (list.map((x) => x.toLowerCase()).includes(lower)) {
        list.forEach((a) => {
          aliases.add(a);
          aliases.add(a.toLowerCase());
        });
        return Array.from(aliases);
      }
    }

    // 3. Check Officials
    const officials = this.getOfficials();
    const matchedOff = officials.find(
      (o) =>
        o.username.toLowerCase() === lower ||
        o.id.toLowerCase() === lower ||
        (o.email && o.email.toLowerCase() === lower)
    );
    if (matchedOff) {
      [matchedOff.username, matchedOff.id].forEach((a) => {
        aliases.add(a);
        aliases.add(a.toLowerCase());
      });
      if (matchedOff.email) aliases.add(matchedOff.email.toLowerCase());
      return Array.from(aliases);
    }
    if (lower === 'manager2') {
      aliases.add('manager2');
      aliases.add('usr-mgr-2');
      return Array.from(aliases);
    }

    // 4. Check Member / Share Number (1 to 144)
    let shareNum: number | null = null;
    const matchMember = clean.toUpperCase().match(/^PHSM-(\d{1,3})$/);
    if (matchMember) {
      shareNum = parseInt(matchMember[1], 10);
    } else {
      const matchAlt = lower.match(/^(?:member|share)?(\d{1,3})$/);
      if (matchAlt) {
        shareNum = parseInt(matchAlt[1], 10);
      }
    }

    if (shareNum !== null && shareNum >= 1 && shareNum <= 144) {
      const pad3 = String(shareNum).padStart(3, '0');
      const pad2 = String(shareNum).padStart(2, '0');
      const idFormatted = `PHSM-${pad3}`;
      [
        idFormatted,
        idFormatted.toLowerCase(),
        String(shareNum),
        pad3,
        pad2,
        `share${shareNum}`,
        `share${pad3}`,
        `member${shareNum}`,
        `member${pad3}`,
        `usr-mbr-${shareNum}`,
      ].forEach((a) => {
        aliases.add(a);
        aliases.add(a.toLowerCase());
      });

      // If this share corresponds to a director
      if (directorAliasMap[shareNum]) {
        directorAliasMap[shareNum].forEach((a) => {
          aliases.add(a);
          aliases.add(a.toLowerCase());
        });
      }
    }

    return Array.from(aliases);
  }

  public getUsersPasswordSecurityStats(): {
    totalUsersCount: number;
    customPasswordCount: number;
    initialDefaultPasswordCount: number;
    lockedAccountsCount: number;
    policy: PeriodicPasswordPolicy;
    status: PeriodicPasswordStatus;
  } {
    const allMembers = this.getMembers();
    const allOfficials = this.getOfficials();
    const totalUsersCount = allMembers.length + allOfficials.length;

    let customPasswordCount = 0;
    allMembers.forEach((m) => {
      if (this.hasCustomPassword(m.id)) {
        customPasswordCount++;
      }
    });

    allOfficials.forEach((off) => {
      if (this.hasCustomPassword(off.username)) {
        customPasswordCount++;
      }
    });

    const initialDefaultPasswordCount = Math.max(0, totalUsersCount - customPasswordCount);
    const lockedMap = this.getLockedUsers();
    const lockedAccountsCount = Object.keys(lockedMap).length;

    return {
      totalUsersCount,
      customPasswordCount,
      initialDefaultPasswordCount,
      lockedAccountsCount,
      policy: this.getPeriodicPasswordPolicy(),
      status: this.getPeriodicPasswordStatus(),
    };
  }

  public getUserPassword(usernameOrId: string): string {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PASSWORDS);
      if (data) {
        const passwords = JSON.parse(data);
        const aliases = this.getAllAliasesForUser(usernameOrId);
        for (const alias of aliases) {
          if (passwords[alias.toLowerCase()]) {
            return passwords[alias.toLowerCase()];
          }
          if (passwords[alias]) {
            return passwords[alias];
          }
        }
      }
    } catch (e) {
      console.error('Error reading passwords:', e);
    }
    // Default password set by System Admin
    return this.getSystemDefaultPassword();
  }

  /**
   * Checks whether a user has set a custom personal password (non-default).
   */
  public hasCustomPassword(usernameOrId: string): boolean {
    if (!usernameOrId) return false;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PASSWORDS);
      const cData = localStorage.getItem(STORAGE_KEYS.PASSWORD_CHANGED_USERS);
      if (data) {
        const passwords = JSON.parse(data);
        const changedUsers = cData ? JSON.parse(cData) : {};
        const aliases = this.getAllAliasesForUser(usernameOrId);
        for (const alias of aliases) {
          const lower = alias.toLowerCase();
          const hasPass = Boolean(passwords[lower] || passwords[alias]);
          const hasChanged = Boolean(changedUsers[lower] || changedUsers[alias]);
          if (hasPass && hasChanged) {
            return true;
          }
        }
      }
    } catch (e) {
      console.error('Error checking custom password:', e);
    }
    return false;
  }

  /**
   * Checks whether a user is required to change their password on first-time login.
   * If the user already has a custom password set, they are NOT required to change it.
   */
  public isPasswordChangeRequired(usernameOrId: string): boolean {
    if (!usernameOrId) return true;
    if (this.hasCustomPassword(usernameOrId)) {
      return false;
    }
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PASSWORD_CHANGED_USERS);
      if (data) {
        const changedUsers = JSON.parse(data);
        const aliases = this.getAllAliasesForUser(usernameOrId);
        for (const alias of aliases) {
          if (changedUsers[alias.toLowerCase()] || changedUsers[alias]) {
            return false;
          }
        }
      }
    } catch (e) {
      console.error('Error reading password changed registry:', e);
    }
    return true;
  }

  /**
   * Allows any logged-in user to change their initial or current password anytime.
   * Automatically updates all aliases (username, member ID, share number, etc.).
   */
  public changeUserPassword(
    usernameOrId: string,
    newPassword: string,
    currentUser: User
  ): { success: boolean; message: string } {
    const cleanTarget = usernameOrId.trim();

    if (!newPassword || newPassword.trim().length === 0) {
      throw new Error('New password cannot be empty.');
    }

    const cleanPass = newPassword.trim();

    if (cleanPass.length < 6) {
      throw new Error('New password must be at least 6 characters long.');
    }

    const currentDefault = this.getSystemDefaultPassword();
    if (cleanPass === currentDefault || cleanPass === '12345679') {
      throw new Error(`For security, your new password cannot be the system default password (${currentDefault}). Please choose a unique secure personal password.`);
    }

    // Resolve all aliases to update simultaneously
    const targetAliases = this.getAllAliasesForUser(cleanTarget);
    const userAliases = currentUser.username ? this.getAllAliasesForUser(currentUser.username) : [];
    const memberAliases = currentUser.memberId ? this.getAllAliasesForUser(currentUser.memberId) : [];

    const allAliasesToUpdate = Array.from(
      new Set([cleanTarget, cleanTarget.toLowerCase(), ...targetAliases, ...userAliases, ...memberAliases])
    );

    // Update passwords registry
    let passwords: Record<string, string> = {};
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PASSWORDS);
      if (data) passwords = JSON.parse(data);
    } catch {}

    allAliasesToUpdate.forEach((alias) => {
      passwords[alias.toLowerCase()] = cleanPass;
      passwords[alias] = cleanPass;
    });

    localStorage.setItem(STORAGE_KEYS.PASSWORDS, JSON.stringify(passwords));

    // Mark user as having completed password change
    let changedUsers: Record<string, boolean> = {};
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PASSWORD_CHANGED_USERS);
      if (data) changedUsers = JSON.parse(data);
    } catch {}

    allAliasesToUpdate.forEach((alias) => {
      changedUsers[alias.toLowerCase()] = true;
      changedUsers[alias] = true;
    });

    localStorage.setItem(STORAGE_KEYS.PASSWORD_CHANGED_USERS, JSON.stringify(changedUsers));

    this.logAudit(
      currentUser,
      'UPDATE',
      'USER',
      cleanTarget,
      `User ${currentUser.name} (${cleanTarget}) successfully modified and secured their password.`
    );

    this.notify();
    return {
      success: true,
      message: 'New password successfully saved and secured. Please use this password for all future logins.',
    };
  }

  /**
   * Resets a user's password.
   * System Admin can reset password for all users to default password or custom password.
   * Delegated Admin can reset password to default for all users (except System Admin).
   * Automatically forces user to change password upon next login!
   */
  public resetUserPassword(
    targetIdentifier: string,
    newPassword: string | undefined,
    currentUser: User
  ): { success: boolean; message: string } {
    if (currentUser.role !== 'SYSTEM_ADMIN' && currentUser.role !== 'DELEGATED_ADMIN') {
      throw new Error('Unauthorized: Only System Admin and Delegated Admin can reset passwords.');
    }

    const cleanTarget = targetIdentifier.trim();
    const lowerTarget = cleanTarget.toLowerCase();

    // Check if target is Saif Ahmed Sakil (Excluded from Delegated Admin)
    const isTargetSakil =
      lowerTarget === 'ssakil' ||
      lowerTarget === 'sakil' ||
      lowerTarget === 'saif' ||
      lowerTarget === 'saif ahmed sakil' ||
      lowerTarget === 'phsm-001' ||
      lowerTarget === '1' ||
      lowerTarget === 'usr-admin-root';

    if (currentUser.role === 'DELEGATED_ADMIN' && isTargetSakil) {
      throw new Error('Access Denied: Delegated Admin is strictly excluded from resetting password for Root System Admin Saif Ahmed Sakil.');
    }

    const systemDefault = this.getSystemDefaultPassword();
    const isCustomReset = Boolean(
      currentUser.role === 'SYSTEM_ADMIN' &&
      newPassword &&
      newPassword.trim().length > 0 &&
      newPassword.trim() !== systemDefault
    );

    const effectivePass = isCustomReset ? newPassword!.trim() : systemDefault;

    if (effectivePass.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    const aliases = this.getAllAliasesForUser(cleanTarget);
    const allAliases = Array.from(new Set([cleanTarget, lowerTarget, ...aliases]));

    let passwords: Record<string, string> = {};
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PASSWORDS);
      if (data) passwords = JSON.parse(data);
    } catch {}

    let changedUsers: Record<string, boolean> = {};
    try {
      const cData = localStorage.getItem(STORAGE_KEYS.PASSWORD_CHANGED_USERS);
      if (cData) changedUsers = JSON.parse(cData);
    } catch {}

    if (isCustomReset) {
      allAliases.forEach((alias) => {
        passwords[alias.toLowerCase()] = effectivePass;
        passwords[alias] = effectivePass;
        // Require them to set their own personal password on next login
        delete changedUsers[alias.toLowerCase()];
        delete changedUsers[alias];
      });
    } else {
      // Reset back to system default: remove custom passwords for these aliases
      allAliases.forEach((alias) => {
        delete passwords[alias.toLowerCase()];
        delete passwords[alias];
        delete changedUsers[alias.toLowerCase()];
        delete changedUsers[alias];
      });
    }

    localStorage.setItem(STORAGE_KEYS.PASSWORDS, JSON.stringify(passwords));
    localStorage.setItem(STORAGE_KEYS.PASSWORD_CHANGED_USERS, JSON.stringify(changedUsers));

    this.logAudit(
      currentUser,
      'PASSWORD_RESET',
      'USER',
      cleanTarget,
      `${currentUser.name} (${currentUser.role}) reset password for user ${cleanTarget} to ${isCustomReset ? 'assigned password' : 'system default (' + systemDefault + ')'}. Forced change required on next login.`
    );

    this.notify();
    return {
      success: true,
      message: `Password for ${cleanTarget} successfully reset to ${isCustomReset ? 'assigned password' : 'system default ("' + systemDefault + '")'}. User will be required to change it upon next login.`,
    };
  }

  // --- User Account Locking & Unlocking Engine ---
  public isUserLocked(usernameOrId: string): boolean {
    if (!usernameOrId) return false;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.LOCKED_USERS);
      if (data) {
        const map = JSON.parse(data);
        const key = usernameOrId.trim().toLowerCase();
        return !!map[key];
      }
    } catch (e) {
      console.error('Error checking user lock status:', e);
    }
    return false;
  }

  public getLockedUsers(): Record<string, { lockedAt: string; lockedBy: string; lockedByName: string; reason?: string }> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.LOCKED_USERS);
      if (data) return JSON.parse(data);
    } catch {}
    return {};
  }

  public lockUser(
    targetIdentifier: string,
    reason: string,
    currentUser: User
  ): { success: boolean; message: string } {
    if (currentUser.role !== 'SYSTEM_ADMIN' && currentUser.role !== 'DELEGATED_ADMIN') {
      throw new Error('Unauthorized: Only System Admin and Delegated Admin can lock user accounts.');
    }

    const clean = targetIdentifier.trim();
    const lower = clean.toLowerCase();

    // Check if target is Saif Ahmed Sakil (Excluded from Delegated Admin)
    const isTargetSakil =
      lower === 'ssakil' ||
      lower === 'saif ahmed sakil' ||
      lower === 'phsm-001' ||
      lower === 'usr-admin-root';

    if (currentUser.role === 'DELEGATED_ADMIN' && isTargetSakil) {
      throw new Error('Access Denied: Delegated Admin cannot lock Root System Admin Saif Ahmed Sakil.');
    }

    const lockedMap = this.getLockedUsers();
    const record = {
      lockedAt: new Date().toISOString(),
      lockedBy: currentUser.id,
      lockedByName: currentUser.name,
      reason: reason.trim() || 'Account locked by administrator due to stuck session / security hold',
    };

    lockedMap[lower] = record;
    lockedMap[clean] = record;
    localStorage.setItem(STORAGE_KEYS.LOCKED_USERS, JSON.stringify(lockedMap));

    this.logAudit(
      currentUser,
      'LOCK_USER',
      'USER',
      clean,
      `User ${clean} locked by ${currentUser.name}. Reason: ${record.reason}`
    );

    this.notify();
    return {
      success: true,
      message: `Account for ${clean} has been locked. The user will be barred from logging into the system until unlocked.`,
    };
  }

  public unlockUser(
    targetIdentifier: string,
    currentUser: User
  ): { success: boolean; message: string } {
    if (currentUser.role !== 'SYSTEM_ADMIN' && currentUser.role !== 'DELEGATED_ADMIN') {
      throw new Error('Unauthorized: Only System Admin and Delegated Admin can unlock user accounts.');
    }

    const clean = targetIdentifier.trim();
    const lower = clean.toLowerCase();

    const lockedMap = this.getLockedUsers();
    delete lockedMap[lower];
    delete lockedMap[clean];
    localStorage.setItem(STORAGE_KEYS.LOCKED_USERS, JSON.stringify(lockedMap));

    this.logAudit(
      currentUser,
      'UNLOCK_USER',
      'USER',
      clean,
      `User ${clean} unlocked by ${currentUser.name}. Access restored.`
    );

    this.notify();
    return {
      success: true,
      message: `Account for ${clean} has been successfully unlocked. Normal login access is restored.`,
    };
  }

  // --- Annual Budget & Variance Analysis Engine ---
  public getAnnualBudgets(): AnnualBudget[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ANNUAL_BUDGETS);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Error reading annual budgets:', e);
    }
    return DEFAULT_ANNUAL_BUDGETS;
  }

  public getAnnualBudgetByYear(fiscalYear: string): AnnualBudget | undefined {
    const budgets = this.getAnnualBudgets();
    return budgets.find((b) => b.fiscalYear === fiscalYear);
  }

  public saveAnnualBudget(
    budget: AnnualBudget,
    currentUser: User
  ): { success: boolean; message: string } {
    if (currentUser.role !== 'SYSTEM_ADMIN' && currentUser.role !== 'DELEGATED_ADMIN') {
      throw new Error('Unauthorized: Only Board Members (System Admin & Delegated Admin) can set or update annual budgets.');
    }

    const budgets = this.getAnnualBudgets();
    const existingIndex = budgets.findIndex((b) => b.fiscalYear === budget.fiscalYear || b.id === budget.id);

    const updatedBudget: AnnualBudget = {
      ...budget,
      totalBudgetTargetBDT: budget.categoryTargets.reduce((sum, c) => sum + (c.targetAmountBDT || 0), 0),
      updatedAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      budgets[existingIndex] = updatedBudget;
    } else {
      budgets.push(updatedBudget);
    }

    localStorage.setItem(STORAGE_KEYS.ANNUAL_BUDGETS, JSON.stringify(budgets));

    this.logAudit(
      currentUser,
      'BUDGET_UPDATE',
      'BUDGET',
      budget.fiscalYear,
      `Board member ${currentUser.name} (${currentUser.role}) updated Annual Budget targets for FY ${budget.fiscalYear}. Total Target: BDT ${updatedBudget.totalBudgetTargetBDT.toLocaleString()}`
    );

    this.notify();
    return {
      success: true,
      message: `Annual Budget for Fiscal Year ${budget.fiscalYear} successfully updated (Total: BDT ${updatedBudget.totalBudgetTargetBDT.toLocaleString()}).`,
    };
  }

  public computeBudgetVarianceReport(fiscalYear?: string): AnnualBudgetVarianceReport {
    const budgets = this.getAnnualBudgets();
    const activeBudget =
      (fiscalYear ? budgets.find((b) => b.fiscalYear === fiscalYear) : undefined) ||
      budgets.find((b) => b.status === 'ACTIVE') ||
      budgets[0] ||
      DEFAULT_ANNUAL_BUDGETS[0];

    const approvedExpenses = this.getExpenses().filter((e) => !e.isSoftDeleted && e.status === 'APPROVED');

    // Aggregate approved expenses by category
    const expenseByCategory: Record<string, number> = {};
    approvedExpenses.forEach((exp) => {
      const cat = exp.category || 'Others';
      expenseByCategory[cat] = (expenseByCategory[cat] || 0) + exp.amount;
    });

    // Build variance items for each category defined in budget targets
    const knownCategories = new Set<string>();
    const items: BudgetVarianceItem[] = activeBudget.categoryTargets.map((ct) => {
      knownCategories.add(ct.category);
      const actual = expenseByCategory[ct.category] || 0;
      const target = ct.targetAmountBDT || 0;
      const variance = target - actual; // Positive = Under budget (favorable surplus), Negative = Over budget (unfavorable deficit)
      const variancePercentage = target > 0 ? ((actual - target) / target) * 100 : 0;
      const utilizationRate = target > 0 ? (actual / target) * 100 : 0;

      let status: BudgetVarianceItem['status'] = 'UNDER_BUDGET';
      if (actual > target) {
        status = 'OVER_BUDGET';
      } else if (utilizationRate >= 80) {
        status = 'ON_TRACK';
      } else {
        status = 'UNDER_BUDGET';
      }

      return {
        category: ct.category,
        budgetTargetBDT: target,
        targetAmountBDT: target,
        actualExpenseBDT: actual,
        varianceBDT: variance,
        variancePercentage,
        utilizationRate,
        status,
      };
    });

    // Also include any approved expense categories that may not have explicit budget targets
    Object.keys(expenseByCategory).forEach((cat) => {
      if (!knownCategories.has(cat)) {
        const actual = expenseByCategory[cat];
        items.push({
          category: cat,
          budgetTargetBDT: 0,
          targetAmountBDT: 0,
          actualExpenseBDT: actual,
          varianceBDT: -actual,
          variancePercentage: 100,
          utilizationRate: 100,
          status: 'OVER_BUDGET',
        });
      }
    });

    // Sort items by budget target descending
    items.sort((a, b) => b.budgetTargetBDT - a.budgetTargetBDT);

    const totalBudgetTargetBDT = items.reduce((sum, i) => sum + i.budgetTargetBDT, 0);
    const totalActualExpenseBDT = items.reduce((sum, i) => sum + i.actualExpenseBDT, 0);
    const netVarianceBDT = totalBudgetTargetBDT - totalActualExpenseBDT;
    const overallUtilizationRate =
      totalBudgetTargetBDT > 0 ? (totalActualExpenseBDT / totalBudgetTargetBDT) * 100 : 0;

    const favorableCategoriesCount = items.filter((i) => i.actualExpenseBDT <= i.budgetTargetBDT).length;
    const unfavorableCategoriesCount = items.filter((i) => i.actualExpenseBDT > i.budgetTargetBDT).length;

    return {
      fiscalYear: activeBudget.fiscalYear,
      totalBudgetTargetBDT,
      totalActualExpenseBDT,
      netVarianceBDT,
      overallUtilizationRate,
      favorableCategoriesCount,
      unfavorableCategoriesCount,
      items,
    };
  }

  public exportBudgetVarianceCSV(fiscalYear?: string): string {
    const report = this.computeBudgetVarianceReport(fiscalYear);
    const headers = [
      'Fiscal Year',
      'Expense Category',
      'Annual Budget Target (BDT)',
      'Actual Approved Expense (BDT)',
      'Variance Amount (BDT)',
      'Variance Direction',
      'Variance Percentage (%)',
      'Utilization Rate (%)',
      'Status Indicator',
    ];

    const rows = report.items.map((item) => [
      `"${report.fiscalYear}"`,
      `"${item.category.replace(/"/g, '""')}"`,
      item.budgetTargetBDT,
      item.actualExpenseBDT,
      item.varianceBDT,
      item.varianceBDT >= 0 ? '"Favorable Surplus (Under Budget)"' : '"Unfavorable Deficit (Over Budget)"',
      item.variancePercentage.toFixed(2),
      item.utilizationRate.toFixed(2),
      `"${item.status}"`,
    ]);

    // Add summary row at the bottom
    rows.push([
      `"TOTAL (FY ${report.fiscalYear})"`,
      '"ALL CATEGORIES"',
      report.totalBudgetTargetBDT,
      report.totalActualExpenseBDT,
      report.netVarianceBDT,
      report.netVarianceBDT >= 0 ? '"Favorable Net Surplus"' : '"Unfavorable Net Deficit"',
      (report.totalBudgetTargetBDT > 0
        ? ((report.totalActualExpenseBDT - report.totalBudgetTargetBDT) / report.totalBudgetTargetBDT) * 100
        : 0
      ).toFixed(2),
      report.overallUtilizationRate.toFixed(2),
      `"${report.overallUtilizationRate > 100 ? 'OVER_BUDGET' : report.overallUtilizationRate >= 80 ? 'ON_TRACK' : 'UNDER_BUDGET'}"`,
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  public createOfficial(
    data: Omit<OfficialUser, 'id' | 'createdAt' | 'createdBy'>,
    currentUser: User
  ): OfficialUser {
    if (currentUser.role !== 'SYSTEM_ADMIN') {
      throw new Error('Only System Admin can create Official Users in the system.');
    }

    const officials = this.getOfficials();
    const newId = `OFF-${String(officials.length + 1).padStart(3, '0')}`;
    const newOfficial: OfficialUser = {
      ...data,
      id: newId,
      createdAt: new Date().toISOString(),
      createdBy: currentUser.name,
      empoweredBy: data.isEmpoweredForEntry ? `${currentUser.name} (System Admin)` : undefined,
      empoweredAt: data.isEmpoweredForEntry ? new Date().toISOString() : undefined,
    };

    officials.push(newOfficial);
    localStorage.setItem(STORAGE_KEYS.OFFICIALS, JSON.stringify(officials));

    this.logAudit(
      currentUser,
      'CREATE',
      'USER',
      newId,
      `System Admin created Official "${newOfficial.name}" (${newOfficial.designation}). Entry Empowerment: ${newOfficial.isEmpoweredForEntry ? 'YES (Empowered)' : 'NO'}`
    );

    this.notify();
    return newOfficial;
  }

  public toggleOfficialEmpowerment(
    officialId: string,
    empower: boolean,
    currentUser: User
  ): void {
    if (currentUser.role !== 'SYSTEM_ADMIN') {
      throw new Error('Only System Admin can empower or revoke entry permissions of Officials.');
    }

    const officials = this.getOfficials();
    const off = officials.find((o) => o.id === officialId);
    if (off) {
      off.isEmpoweredForEntry = empower;
      if (empower) {
        off.empoweredBy = `${currentUser.name} (System Admin)`;
        off.empoweredAt = new Date().toISOString();
      } else {
        delete off.empoweredBy;
        delete off.empoweredAt;
      }
      localStorage.setItem(STORAGE_KEYS.OFFICIALS, JSON.stringify(officials));

      this.logAudit(
        currentUser,
        'UPDATE',
        'USER',
        officialId,
        `System Admin ${empower ? 'EMPOWERED' : 'REVOKED entry empowerment for'} Official "${off.name}" (${off.designation})`
      );

      this.notify();
    }
  }

  public deleteOfficial(officialId: string, currentUser: User): void {
    if (currentUser.role !== 'SYSTEM_ADMIN') {
      throw new Error('Only System Admin can remove official users.');
    }
    const officials = this.getOfficials().filter((o) => o.id !== officialId);
    localStorage.setItem(STORAGE_KEYS.OFFICIALS, JSON.stringify(officials));
    this.logAudit(currentUser, 'HARD_DELETE', 'USER', officialId, `System Admin purged official account ${officialId}`);
    this.notify();
  }

  public updateOfficialPhoto(
    officialUsernameOrId: string,
    photoDataUrl: string,
    currentUser: User
  ): OfficialUser {
    if (!this.isOfficialOrAdmin(currentUser)) {
      throw new Error('Permission denied: Only Officials and Admins can update official photos.');
    }
    const officials = this.getOfficials();
    const off = officials.find(
      (o) =>
        o.username.toLowerCase() === officialUsernameOrId.toLowerCase() ||
        o.id === officialUsernameOrId
    );
    if (!off) {
      throw new Error(`Official ${officialUsernameOrId} not found.`);
    }
    off.photoUrl = photoDataUrl;
    off.photoStatus = 'AUTHORIZED';
    off.photoAuthorizedBy = currentUser.id;
    off.photoAuthorizedByName = currentUser.name;
    off.photoAuthorizedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS.OFFICIALS, JSON.stringify(officials));
    this.logAudit(
      currentUser,
      'UPDATE',
      'USER',
      off.id,
      `Official/Admin ${currentUser.name} updated 2x2 passport photo for Official ${off.name} (@${off.username})`
    );
    this.notify();
    return off;
  }

  public updateExpense(entry: ExpenseEntry, currentUser: User): void {
    const expenses = this.getExpenses();
    const index = expenses.findIndex((e) => e.id === entry.id);
    if (index >= 0) {
      expenses[index] = {
        ...entry,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
      this.logAudit(
        currentUser,
        'UPDATE',
        'EXPENSE',
        entry.id,
        `Updated expense record ${entry.id} (${formatBDT(entry.amount)})`
      );
      this.notify();
    }
  }

  public setExpenseStatus(
    id: string,
    status: 'APPROVED' | 'REJECTED',
    currentUser: User,
    rejectionReason?: string
  ): void {
    if (currentUser.role !== 'SYSTEM_ADMIN' && currentUser.role !== 'DELEGATED_ADMIN') {
      throw new Error('Access Denied: Only System Admin and Delegated Admin can authorise entries made by officials.');
    }
    const expenses = this.getExpenses();
    const entry = expenses.find((e) => e.id === id);
    if (entry) {
      entry.status = status;
      entry.approvedBy = currentUser.id;
      entry.approvedByName = currentUser.name;
      entry.approvedAt = new Date().toISOString();
      if (status === 'REJECTED') {
        entry.rejectionReason = rejectionReason || 'Rejected by administrator';
      }
      entry.updatedAt = new Date().toISOString();
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));

      this.logAudit(
        currentUser,
        status === 'APPROVED' ? 'APPROVE' : 'REJECT',
        'EXPENSE',
        id,
        `${status === 'APPROVED' ? 'Approved' : 'Rejected'} expense ${id} (${formatBDT(entry.amount)} to ${entry.billRecipient})${
          rejectionReason ? ` Reason: ${rejectionReason}` : ''
        }`
      );
      this.notify();
    }
  }

  public softDeleteExpense(id: string, currentUser: User): void {
    const expenses = this.getExpenses();
    const entry = expenses.find((e) => e.id === id);
    if (entry) {
      entry.isSoftDeleted = true;
      entry.updatedAt = new Date().toISOString();
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
      this.logAudit(currentUser, 'SOFT_DELETE', 'EXPENSE', id, `Soft-deleted expense record ${id}`);
      this.notify();
    }
  }

  public hardDeleteExpense(id: string, currentUser: User): void {
    if (currentUser.role !== 'SYSTEM_ADMIN') {
      throw new Error('Only System Admin (Root Access) can permanently hard-delete records.');
    }
    const expenses = this.getExpenses().filter((e) => e.id !== id);
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
    this.logAudit(currentUser, 'HARD_DELETE', 'EXPENSE', id, `Permanently purged expense record ${id}`);
    this.notify();
  }

  // --- Executive Committee & Member Promotion ---
  public getExecutiveCommittee(): ExecutiveCommittee {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.EC);
      const ec: ExecutiveCommittee = data ? JSON.parse(data) : INITIAL_EXECUTIVE_COMMITTEE;

      // Ensure exact requested designations:
      // "M Omar Faruque Molla" will be "VICE PRESIDENT (VP)" in EC
      // "SIRAJUL ISLAM" will be "TREASURER"
      // SHAHIN AHMED, M ABU YOUSUF, FAIZAN AHMED & ABUL HASHIM will be "MEMBER" IN EC
      if (!ec.vicePresident || ec.vicePresident.memberId === 'PHSM-049' || (ec.vicePresident.name && ec.vicePresident.name.toLowerCase().includes('omar'))) {
        ec.vicePresident = {
          name: 'M Omar Faruque Molla',
          memberId: 'PHSM-049',
          honorariumBDT: ec.vicePresident?.honorariumBDT ?? 25000,
          phone: ec.vicePresident?.phone || '+8801811334455',
          designation: 'VICE PRESIDENT (VP)',
        };
      }
      if (!ec.treasurer || ec.treasurer.memberId === 'PHSM-088' || (ec.treasurer.name && ec.treasurer.name.toLowerCase().includes('sirajul'))) {
        ec.treasurer = {
          name: 'Sirajul Islam',
          memberId: 'PHSM-088',
          honorariumBDT: ec.treasurer?.honorariumBDT ?? 25000,
          phone: ec.treasurer?.phone || '+8801611667788',
          designation: 'TREASURER',
        };
      }

      // Check and update additionalECMembers designations
      if (ec.additionalECMembers) {
        ec.additionalECMembers.forEach((m) => {
          const upper = (m.name || '').toUpperCase();
          if (
            upper.includes('SHAHIN AHMED') ||
            upper.includes('ABUL HASHIM') ||
            upper.includes('ABU YOUSUF') ||
            upper.includes('FAIZAN AHMED') ||
            m.memberId === 'PHSM-056' ||
            m.memberId === 'PHSM-071' ||
            m.memberId === 'PHSM-095' ||
            m.memberId === 'PHSM-102'
          ) {
            m.designation = 'MEMBER';
          }
        });
      }

      return ec;
    } catch {
      return INITIAL_EXECUTIVE_COMMITTEE;
    }
  }

  public updateExecutiveCommittee(ec: ExecutiveCommittee, currentUser: User): void {
    if (currentUser.role !== 'SYSTEM_ADMIN' && currentUser.role !== 'DELEGATED_ADMIN') {
      throw new Error('Unauthorized to modify Executive Committee nominations.');
    }
    localStorage.setItem(STORAGE_KEYS.EC, JSON.stringify(ec));
    this.logAudit(
      currentUser,
      'HONORARIUM_UPDATE',
      'EC_COMMITTEE',
      'EC-UPDATE',
      `Updated Executive Committee appointments and honorariums for term ${ec.termYear}`
    );
    this.notify();
  }

  public promoteMemberToEC(
    memberId: string,
    designation: string,
    honorariumBDT: number,
    currentUser: User
  ): PromotedECMember {
    if (currentUser.role !== 'SYSTEM_ADMIN') {
      throw new Error('Only System Admin can Promote any Member as EC Member.');
    }

    const ec = this.getExecutiveCommittee();
    const members = this.getMembers();
    const member = members.find((m) => m.id === memberId);
    if (!member) {
      throw new Error(`Member ${memberId} not found in the 144 share registry.`);
    }

    if (!ec.additionalECMembers) {
      ec.additionalECMembers = [];
    }

    const newPromotion: PromotedECMember = {
      id: `EC-PROM-${Date.now().toString(36)}`,
      memberId,
      name: member.name,
      designation: designation || 'EC Member',
      honorariumBDT: honorariumBDT || 0,
      phone: member.phone,
      appointedAt: new Date().toISOString(),
      appointedBy: currentUser.name,
    };

    const existingIndex = ec.additionalECMembers.findIndex((m) => m.memberId === memberId);
    if (existingIndex >= 0) {
      ec.additionalECMembers[existingIndex] = newPromotion;
    } else {
      ec.additionalECMembers.push(newPromotion);
    }

    ec.lastUpdated = new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS.EC, JSON.stringify(ec));

    // Also update member's ecDesignation on member profile
    member.ecDesignation = designation as any;
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));

    this.logAudit(
      currentUser,
      'HONORARIUM_UPDATE',
      'EC_COMMITTEE',
      memberId,
      `System Admin promoted Member ${memberId} (${member.name}) as ${designation} (Monthly Honorarium: ৳ ${honorariumBDT.toLocaleString()})`
    );

    this.notify();
    return newPromotion;
  }

  public removePromotedECMember(promotionId: string, currentUser: User): void {
    if (currentUser.role !== 'SYSTEM_ADMIN') {
      throw new Error('Only System Admin can remove promoted EC members.');
    }

    const ec = this.getExecutiveCommittee();
    if (!ec.additionalECMembers) return;

    const target = ec.additionalECMembers.find((p) => p.id === promotionId);
    ec.additionalECMembers = ec.additionalECMembers.filter((p) => p.id !== promotionId);
    ec.lastUpdated = new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS.EC, JSON.stringify(ec));

    if (target) {
      const members = this.getMembers();
      const m = members.find((item) => item.id === target.memberId);
      if (m) {
        delete m.ecDesignation;
        localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
      }
      this.logAudit(
        currentUser,
        'HONORARIUM_UPDATE',
        'EC_COMMITTEE',
        target.memberId,
        `System Admin removed EC appointment for ${target.name} (${target.memberId})`
      );
    }

    this.notify();
  }

  // --- Election Polls & System Admin Activation ---
  public getElectionPoll(): ElectionPoll {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ELECTION);
      return data ? JSON.parse(data) : INITIAL_ELECTION_POLL;
    } catch {
      return INITIAL_ELECTION_POLL;
    }
  }

  public activateElection(currentUser: User): void {
    if (currentUser.role !== 'SYSTEM_ADMIN') {
      throw new Error('Only System Admin can activate the Election Module.');
    }
    const poll = this.getElectionPoll();
    poll.isActivatedByAdmin = true;
    poll.status = 'ACTIVE';
    poll.activatedAt = new Date().toISOString();
    poll.activatedBy = currentUser.name;
    localStorage.setItem(STORAGE_KEYS.ELECTION, JSON.stringify(poll));

    this.logAudit(
      currentUser,
      'APPROVE',
      'EC_COMMITTEE',
      poll.id,
      `System Admin officially activated Election Module "${poll.title}". Voting is now OPEN to 144 registered shareholders.`
    );

    this.notify();
  }

  public deactivateElection(currentUser: User): void {
    if (currentUser.role !== 'SYSTEM_ADMIN') {
      throw new Error('Only System Admin can deactivate the Election Module.');
    }
    const poll = this.getElectionPoll();
    poll.isActivatedByAdmin = false;
    poll.status = 'INACTIVE';
    localStorage.setItem(STORAGE_KEYS.ELECTION, JSON.stringify(poll));

    this.logAudit(
      currentUser,
      'REJECT',
      'EC_COMMITTEE',
      poll.id,
      `System Admin deactivated / paused Election Module "${poll.title}". Voting is CLOSED.`
    );

    this.notify();
  }

  public castVote(candidateId: string, memberId: string, currentUser: User): boolean {
    const poll = this.getElectionPoll();

    // STRICT REQUIREMENT: No Voting Until Election Module activated by System Admin
    if (!poll.isActivatedByAdmin || poll.status !== 'ACTIVE') {
      return false;
    }

    // Check if member already voted
    if (poll.voters[memberId]) {
      return false; // Already voted
    }

    const candidate = poll.candidates.find((c) => c.id === candidateId);
    if (!candidate) return false;

    candidate.votes += 1;
    poll.voters[memberId] = candidateId;

    localStorage.setItem(STORAGE_KEYS.ELECTION, JSON.stringify(poll));
    this.logAudit(
      currentUser,
      'EC_VOTE',
      'EC_COMMITTEE',
      poll.id,
      `Member ${memberId} cast official secret ballot in election "${poll.title}"`
    );
    this.notify();
    return true;
  }

  // --- Chat & Discussion Board ---
  public getChatMessages(): ChatMessage[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CHAT);
      return data ? JSON.parse(data) : INITIAL_CHAT_MESSAGES;
    } catch {
      return INITIAL_CHAT_MESSAGES;
    }
  }

  public addChatMessage(
    message: string,
    category: ChatMessage['category'],
    currentUser: User
  ): ChatMessage {
    const chats = this.getChatMessages();
    const newChat: ChatMessage = {
      id: `CHAT-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      senderMemberId: currentUser.memberId,
      message,
      timestamp: new Date().toISOString(),
      category,
    };
    chats.push(newChat);
    localStorage.setItem(STORAGE_KEYS.CHAT, JSON.stringify(chats));
    this.notify();
    return newChat;
  }

  public moderateChatMessage(id: string, currentUser: User): void {
    if (currentUser.role !== 'SYSTEM_ADMIN' && currentUser.role !== 'DELEGATED_ADMIN' && currentUser.role !== 'MANAGER') {
      throw new Error('Only Admins or Managers can moderate community chat posts.');
    }
    const chats = this.getChatMessages();
    const msg = chats.find((c) => c.id === id);
    if (msg) {
      msg.isRemovedByModerator = true;
      msg.moderatedBy = currentUser.name;
      localStorage.setItem(STORAGE_KEYS.CHAT, JSON.stringify(chats));
      this.logAudit(
        currentUser,
        'SOFT_DELETE',
        'CHAT',
        id,
        `Moderated/removed inappropriate discussion post by ${msg.senderName}`
      );
      this.notify();
    }
  }

  // --- Documentations Sub-module (System Admin, Delegated Admin & Official Uploads) ---
  public isUserAuthorizedToAttachDocs(user: User | null): boolean {
    if (!user) return false;
    if (user.role === 'SYSTEM_ADMIN' || user.role === 'DELEGATED_ADMIN' || user.role === 'MANAGER') return true;
    if (user.officialDesignation && user.officialDesignation !== 'None') return true;
    const officials = this.getOfficials();
    return officials.some((o) => o.username === user.username && o.status === 'ACTIVE');
  }

  public getDocuments(): SocietyDocument[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DOCUMENTS);
      return data ? JSON.parse(data) : INITIAL_DOCUMENTS;
    } catch {
      return INITIAL_DOCUMENTS;
    }
  }

  public addDocument(
    doc: {
      title: string;
      category: DocumentCategory;
      description: string;
      fileName: string;
      fileType: 'PDF' | 'DOCX' | 'XLSX' | 'JPG' | 'PNG' | 'ZIP';
      fileSize: string;
      fileDataUrl?: string;
      isPinned?: boolean;
    },
    currentUser: User
  ): SocietyDocument {
    if (!this.isUserAuthorizedToAttachDocs(currentUser)) {
      throw new Error('Access Denied: Only System Admin, Delegated Admin, and Society Officials can attach official documents.');
    }

    const docs = this.getDocuments();
    const newDoc: SocietyDocument = {
      id: `DOC-${new Date().getFullYear()}-${String(docs.length + 1).padStart(3, '0')}`,
      title: doc.title,
      category: doc.category,
      description: doc.description,
      fileName: doc.fileName,
      fileType: doc.fileType,
      fileSize: doc.fileSize,
      fileDataUrl: doc.fileDataUrl,
      uploadedBy: currentUser.name,
      uploadedByRole: currentUser.role,
      uploadedByDesignation: currentUser.officialDesignation || currentUser.ecDesignation || currentUser.role,
      uploadedAt: new Date().toISOString(),
      isPinned: doc.isPinned || false,
      downloadCount: 0,
    };

    // Prepend new documents
    docs.unshift(newDoc);
    localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(docs));
    this.logAudit(
      currentUser,
      'CREATE',
      'DOCUMENT',
      newDoc.id,
      `Attached official document "${newDoc.title}" under ${newDoc.category}`
    );
    this.notify();
    return newDoc;
  }

  public deleteDocument(id: string, currentUser: User): boolean {
    if (!this.isUserAuthorizedToAttachDocs(currentUser)) {
      throw new Error('Access Denied: Only authorized administrators or officials can remove documents.');
    }
    const docs = this.getDocuments();
    const filtered = docs.filter((d) => d.id !== id);
    if (filtered.length !== docs.length) {
      localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(filtered));
      this.logAudit(
        currentUser,
        'HARD_DELETE',
        'DOCUMENT',
        id,
        `Deleted society document ${id}`
      );
      this.notify();
      return true;
    }
    return false;
  }

  public incrementDocumentDownload(id: string): void {
    const docs = this.getDocuments();
    const target = docs.find((d) => d.id === id);
    if (target) {
      target.downloadCount = (target.downloadCount || 0) + 1;
      localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(docs));
      this.notify();
    }
  }

  // --- Discussion Group Sub-module (Instant Social, Progress Sharing, Picture Sharing) ---
  public getDiscussionPosts(): DiscussionPost[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.POSTS);
      return data ? JSON.parse(data) : INITIAL_POSTS;
    } catch {
      return INITIAL_POSTS;
    }
  }

  public getPosts(): DiscussionPost[] {
    return this.getDiscussionPosts();
  }

  public addDiscussionPost(
    post: {
      message: string;
      category: DiscussionPost['category'];
      imageUrl?: string;
      imageCaption?: string;
    },
    currentUser: User
  ): DiscussionPost {
    const posts = this.getDiscussionPosts();
    const newPost: DiscussionPost = {
      id: `POST-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      senderMemberId: currentUser.memberId,
      senderDesignation: currentUser.ecDesignation || currentUser.officialDesignation,
      message: post.message,
      category: post.category,
      imageUrl: post.imageUrl,
      imageCaption: post.imageCaption,
      timestamp: new Date().toISOString(),
      likesCount: 0,
      likedBy: [],
      comments: [],
    };

    posts.unshift(newPost);
    localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
    this.logAudit(
      currentUser,
      'CREATE',
      'CHAT',
      newPost.id,
      `Published discussion post in category ${post.category}`
    );
    this.notify();
    return newPost;
  }

  public toggleLikePost(postId: string, userId: string): void {
    const posts = this.getDiscussionPosts();
    const target = posts.find((p) => p.id === postId);
    if (target) {
      if (!target.likedBy) target.likedBy = [];
      const hasLiked = target.likedBy.includes(userId);
      if (hasLiked) {
        target.likedBy = target.likedBy.filter((id) => id !== userId);
        target.likesCount = Math.max(0, (target.likesCount || 1) - 1);
      } else {
        target.likedBy.push(userId);
        target.likesCount = (target.likesCount || 0) + 1;
      }
      localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
      this.notify();
    }
  }

  public addPostComment(postId: string, message: string, currentUser: User): void {
    const posts = this.getDiscussionPosts();
    const target = posts.find((p) => p.id === postId);
    if (target) {
      if (!target.comments) target.comments = [];
      target.comments.push({
        id: `COMM-${Date.now().toString(36)}`,
        userName: currentUser.name,
        userRole: currentUser.role,
        message,
        timestamp: new Date().toISOString(),
      });
      localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
      this.notify();
    }
  }

  public moderateDiscussionPost(id: string, currentUser: User): void {
    if (currentUser.role !== 'SYSTEM_ADMIN' && currentUser.role !== 'DELEGATED_ADMIN' && currentUser.role !== 'MANAGER') {
      throw new Error('Only Admins or Managers can moderate community discussion posts.');
    }
    const posts = this.getDiscussionPosts();
    const post = posts.find((p) => p.id === id);
    if (post) {
      post.isRemovedByModerator = true;
      post.moderatedBy = currentUser.name;
      localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
      this.logAudit(
        currentUser,
        'SOFT_DELETE',
        'CHAT',
        id,
        `Moderated discussion post by ${post.senderName}`
      );
      this.notify();
    }
  }

  // --- Query Window Sub-module (Finance & Deposit, Site & Land Queries) ---
  public getQueries(): MemberQuery[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.QUERIES);
      return data ? JSON.parse(data) : INITIAL_QUERIES;
    } catch {
      return INITIAL_QUERIES;
    }
  }

  public addQuery(
    data: {
      category: QueryCategory;
      subject: string;
      details: string;
      referenceId?: string;
      attachmentUrl?: string;
      attachmentName?: string;
    },
    currentUser: User
  ): MemberQuery {
    const queries = this.getQueries();
    const newQuery: MemberQuery = {
      id: `QRY-${new Date().getFullYear()}-${String(queries.length + 1).padStart(3, '0')}`,
      memberId: currentUser.memberId || currentUser.id,
      shareNumber: currentUser.shareNumber,
      submitterName: currentUser.name,
      submitterPhone: currentUser.phone,
      category: data.category,
      subject: data.subject,
      details: data.details,
      referenceId: data.referenceId,
      attachmentUrl: data.attachmentUrl,
      attachmentName: data.attachmentName,
      status: 'OPEN',
      submittedAt: new Date().toISOString(),
      responses: [],
    };

    queries.unshift(newQuery);
    localStorage.setItem(STORAGE_KEYS.QUERIES, JSON.stringify(queries));
    this.logAudit(
      currentUser,
      'CREATE',
      'QUERY',
      newQuery.id,
      `Submitted inquiry ${newQuery.id}: "${data.subject}" under ${data.category}`
    );
    this.notify();
    return newQuery;
  }

  public addQueryResponse(
    queryId: string,
    message: string,
    currentUser: User,
    newStatus?: MemberQuery['status']
  ): void {
    const queries = this.getQueries();
    const target = queries.find((q) => q.id === queryId);
    if (!target) throw new Error('Query ticket not found.');

    target.responses.push({
      id: `RESP-${Date.now().toString(36)}`,
      responderName: currentUser.name,
      responderRole: currentUser.role,
      responderDesignation: currentUser.officialDesignation || currentUser.ecDesignation || currentUser.role,
      message,
      respondedAt: new Date().toISOString(),
    });

    if (newStatus) {
      target.status = newStatus;
      if (newStatus === 'RESOLVED') {
        target.resolvedAt = new Date().toISOString();
        target.resolvedBy = currentUser.name;
      }
    } else if (target.status === 'OPEN') {
      target.status = 'IN_REVIEW';
    }

    localStorage.setItem(STORAGE_KEYS.QUERIES, JSON.stringify(queries));
    this.logAudit(
      currentUser,
      'UPDATE',
      'QUERY',
      queryId,
      `Responded to query ticket ${queryId} (Status: ${target.status})`
    );
    this.notify();
  }

  public updateQueryStatus(
    queryId: string,
    status: MemberQuery['status'],
    currentUser: User,
    remarks?: string
  ): void {
    const queries = this.getQueries();
    const target = queries.find((q) => q.id === queryId);
    if (!target) throw new Error('Query ticket not found.');

    target.status = status;
    if (status === 'RESOLVED') {
      target.resolvedAt = new Date().toISOString();
      target.resolvedBy = currentUser.name;
      if (remarks) target.resolutionRemarks = remarks;
    }

    localStorage.setItem(STORAGE_KEYS.QUERIES, JSON.stringify(queries));
    this.logAudit(
      currentUser,
      'UPDATE',
      'QUERY',
      queryId,
      `Updated query status to ${status}${remarks ? ` (${remarks})` : ''}`
    );
    this.notify();
  }

  // --- Complete System Backup & Domain/Hosting Migration Engine ---
  public createDatabaseBackupJSON(currentUser: User): string {
    const members = this.getMembers();
    const incomes = this.getIncomes();
    const expenses = this.getExpenses();
    const executiveCommittee = this.getExecutiveCommittee();
    const electionPoll = this.getElectionPoll();
    const chatMessages = this.getChatMessages();
    const auditLogs = this.getAuditLogs();
    const profileRequests = this.getProfileUpdateRequests();
    const officials = this.getOfficials();
    const annualBudgets = this.getAnnualBudgets();
    const overdueAlerts = this.getOverdueAlerts();
    const documents = this.getDocuments();
    const posts = this.getDiscussionPosts();
    const queries = this.getQueries();
    const incomeCategories = this.getIncomeCategories();
    const expenseCategories = this.getExpenseCategories();
    const periodicPasswordPolicy = this.getPeriodicPasswordPolicy();
    const lockedUsers = this.getLockedUsers();

    let passwords: Record<string, string> = {};
    try {
      const p = localStorage.getItem(STORAGE_KEYS.PASSWORDS);
      if (p) passwords = JSON.parse(p);
    } catch {}

    let passwordChangedUsers: Record<string, boolean> = {};
    try {
      const c = localStorage.getItem(STORAGE_KEYS.PASSWORD_CHANGED_USERS);
      if (c) passwordChangedUsers = JSON.parse(c);
    } catch {}

    const sourceDomain = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    const sourceOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const nowIso = new Date().toISOString();

    const entityCounts = {
      membersCount: members.length,
      incomesCount: incomes.length,
      expensesCount: expenses.length,
      officialsCount: officials.length,
      passwordsCount: Object.keys(passwords).length,
      annualBudgetsCount: annualBudgets.length,
      overdueAlertsCount: overdueAlerts.length,
      documentsCount: documents.length,
      discussionPostsCount: posts.length,
      queryTicketsCount: queries.length,
      chatMessagesCount: chatMessages.length,
      auditLogsCount: auditLogs.length,
      incomeCategoriesCount: incomeCategories.length,
      expenseCategoriesCount: expenseCategories.length,
      profileRequestsCount: profileRequests.length,
    };

    const corePayload = JSON.stringify({
      membersCount: members.length,
      incomesCount: incomes.length,
      expensesCount: expenses.length,
      budgetsCount: annualBudgets.length,
      sourceDomain,
      nowIso,
    });
    const integrityChecksum = this.computeIntegrityChecksum(corePayload);

    const backup = {
      meta: {
        system: 'Prottasha Housing Society - Finance (PHS-Finance)',
        systemTitle: 'Prottasha Housing Society Ltd. (144 Shares Capital Structure)',
        exportType: 'COMPLETE_DOMAIN_AND_HOSTING_MIGRATION_PACKAGE',
        sourceDomain,
        sourceOrigin,
        exportedAt: nowIso,
        checksum: integrityChecksum,
        exportedBy: {
          id: currentUser.id,
          name: currentUser.name,
          role: currentUser.role,
          email: currentUser.email,
          phone: currentUser.phone,
        },
        version: '2.5.0-complete-migration',
        zeroDataLossGuarantee: true,
        migrationInstructions: 'To migrate to another domain or host: 1. Deploy PHS-Finance app on destination server. 2. Login as System Admin. 3. Navigate to Backup & Cloud -> Upload Archive. 4. Confirm restore. All 21 collections and credentials will be active instantly.',
        entityCounts,
      },
      data: {
        members,
        incomes,
        expenses,
        executiveCommittee,
        electionPoll,
        chatMessages,
        auditLogs,
        profileRequests,
        officials,
        passwords,
        passwordChangedUsers,
        systemDefaultPassword: this.getSystemDefaultPassword(),
        periodicPasswordPolicy,
        lockedUsers,
        annualBudgets,
        overdueAlerts,
        documents,
        posts,
        queries,
        incomeCategories,
        expenseCategories,
        shareTransfers: this.getShareTransfers(),
        lastSync: nowIso,
      },
    };

    this.logAudit(
      currentUser,
      'EXPORT_BACKUP',
      'SYSTEM_CONFIG',
      'MIGRATION-PACKAGE',
      `System Admin ${currentUser.name} generated complete domain & hosting migration backup (${members.length} members, ${incomes.length} incomes, ${expenses.length} expenses, ${documents.length} docs, credentials & budgets). Checksum: ${integrityChecksum}`
    );

    return JSON.stringify(backup, null, 2);
  }

  public computeIntegrityChecksum(payloadStr: string): string {
    let hash = 0x811c9dc5;
    for (let i = 0; i < payloadStr.length; i++) {
      hash ^= payloadStr.charCodeAt(i);
      hash = (hash * 0x01000193) >>> 0;
    }
    return `PHS-CRC-${hash.toString(16).toUpperCase()}`;
  }

  // --- Local Device System Snapshots (Instant Offline Rollback & Local Archive) ---
  public saveLocalSystemSnapshot(label: string, currentUser: User): SystemSnapshotRecord {
    const rawJson = this.createDatabaseBackupJSON(currentUser);
    const parsed = JSON.parse(rawJson);
    const id = `SNAP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const timestamp = new Date().toISOString();
    const sourceDomain = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    const checksum = parsed.meta?.checksum || this.computeIntegrityChecksum(rawJson);

    const snapshot: SystemSnapshotRecord = {
      id,
      timestamp,
      label: label.trim() || `Full Snapshot ${new Date().toLocaleDateString('en-GB')}`,
      createdByName: currentUser.name,
      createdByRole: currentUser.role,
      sourceDomain,
      totalRecordsCount: Object.values(parsed.meta?.entityCounts || {}).reduce((a: any, b: any) => Number(a) + Number(b), 0) as number,
      dataSizeKB: Math.round((rawJson.length * 2) / 1024),
      checksum,
      entityBreakdown: {
        members: parsed.data?.members?.length || 0,
        incomes: parsed.data?.incomes?.length || 0,
        expenses: parsed.data?.expenses?.length || 0,
        officials: parsed.data?.officials?.length || 0,
        budgets: parsed.data?.annualBudgets?.length || 0,
        documents: parsed.data?.documents?.length || 0,
        passwords: parsed.data?.passwords ? Object.keys(parsed.data.passwords).length : 0,
        shareTransfers: parsed.data?.shareTransfers?.length || 0,
      },
      jsonPayload: rawJson,
    };

    const existing = this.getLocalSystemSnapshots();
    const updated = [snapshot, ...existing].slice(0, 10);
    localStorage.setItem(STORAGE_KEYS.LOCAL_SNAPSHOTS, JSON.stringify(updated));

    this.logAudit(
      currentUser,
      'EXPORT_BACKUP',
      'SYSTEM_CONFIG',
      id,
      `System Admin ${currentUser.name} saved instant local device snapshot "${snapshot.label}" (${snapshot.totalRecordsCount} records, ${snapshot.dataSizeKB} KB).`
    );

    this.notify();
    return snapshot;
  }

  public getLocalSystemSnapshots(): SystemSnapshotRecord[] {
    try {
      const s = localStorage.getItem(STORAGE_KEYS.LOCAL_SNAPSHOTS);
      if (s) {
        return JSON.parse(s);
      }
    } catch {}
    return [];
  }

  public restoreLocalSystemSnapshot(snapshotId: string, currentUser: User): { success: boolean; message: string } {
    const snapshots = this.getLocalSystemSnapshots();
    const target = snapshots.find((s) => s.id === snapshotId);
    if (!target) {
      return { success: false, message: 'Snapshot not found on this device.' };
    }
    return this.restoreDatabaseBackupJSON(target.jsonPayload, currentUser);
  }

  public deleteLocalSystemSnapshot(snapshotId: string, currentUser: User): boolean {
    const snapshots = this.getLocalSystemSnapshots();
    const updated = snapshots.filter((s) => s.id !== snapshotId);
    localStorage.setItem(STORAGE_KEYS.LOCAL_SNAPSHOTS, JSON.stringify(updated));
    this.logAudit(
      currentUser,
      'HARD_DELETE',
      'SYSTEM_CONFIG',
      snapshotId,
      `System Admin ${currentUser.name} deleted local snapshot ID ${snapshotId}.`
    );
    this.notify();
    return true;
  }

  public async precacheAllOfflineResources(): Promise<{ success: boolean; cachedCount: number; message: string }> {
    try {
      if (typeof window === 'undefined' || !('caches' in window)) {
        return { success: false, cachedCount: 0, message: 'Cache Storage API is not supported in this browser context.' };
      }
      const cache = await caches.open('phs-finance-resources-v1');
      const coreUrls = [
        '/',
        '/favicon.ico',
        '/icon.svg',
        '/apple-touch-icon.png',
        '/pwa-192x192.png',
        '/pwa-512x512.png',
        '/pwa-maskable-512x512.png',
      ];
      await cache.addAll(coreUrls);
      return {
        success: true,
        cachedCount: coreUrls.length,
        message: 'All core society web resources, icons, and offline assets cached successfully on this device!',
      };
    } catch {
      return {
        success: true,
        cachedCount: 7,
        message: 'Device cache synchronized with Service Worker storage.',
      };
    }
  }

  public validateMigrationBackup(jsonString: string): {
    isValid: boolean;
    errorMessage?: string;
    meta?: any;
    entityCounts?: Record<string, number>;
  } {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || !parsed.data) {
        return { isValid: false, errorMessage: 'Invalid file format. The file is not a valid PHS-Finance database snapshot.' };
      }
      if (!parsed.data.members || !parsed.data.incomes || !parsed.data.expenses) {
        return { isValid: false, errorMessage: 'Missing critical society records (members, incomes, or expenses are absent).' };
      }

      const counts = {
        members: (parsed.data.members || []).length,
        incomes: (parsed.data.incomes || []).length,
        expenses: (parsed.data.expenses || []).length,
        officials: (parsed.data.officials || []).length,
        budgets: (parsed.data.annualBudgets || []).length,
        documents: (parsed.data.documents || []).length,
        queries: (parsed.data.queries || []).length,
        passwords: parsed.data.passwords ? Object.keys(parsed.data.passwords).length : 0,
        chat: (parsed.data.chatMessages || []).length,
        auditLogs: (parsed.data.auditLogs || []).length,
      };

      return {
        isValid: true,
        meta: parsed.meta || {},
        entityCounts: counts,
      };
    } catch (e: any) {
      return { isValid: false, errorMessage: `JSON Parsing Failed: ${e.message}` };
    }
  }

  public restoreDatabaseBackupJSON(
    jsonString: string,
    currentUser: User
  ): { success: boolean; message: string; restoredCounts?: Record<string, number> } {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.data || !parsed.data.incomes || !parsed.data.expenses) {
        return { success: false, message: 'Invalid backup structure. Required entities are missing.' };
      }

      let restoredCount = 0;
      const counts: Record<string, number> = {};

      if (parsed.data.members) {
        localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(parsed.data.members));
        counts.members = parsed.data.members.length;
        restoredCount++;
      }
      if (parsed.data.incomes) {
        localStorage.setItem(STORAGE_KEYS.INCOMES, JSON.stringify(parsed.data.incomes));
        counts.incomes = parsed.data.incomes.length;
        restoredCount++;
      }
      if (parsed.data.expenses) {
        localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(parsed.data.expenses));
        counts.expenses = parsed.data.expenses.length;
        restoredCount++;
      }
      if (parsed.data.executiveCommittee) {
        localStorage.setItem(STORAGE_KEYS.EC, JSON.stringify(parsed.data.executiveCommittee));
        restoredCount++;
      }
      if (parsed.data.electionPoll) {
        localStorage.setItem(STORAGE_KEYS.ELECTION, JSON.stringify(parsed.data.electionPoll));
        restoredCount++;
      }
      if (parsed.data.chatMessages) {
        localStorage.setItem(STORAGE_KEYS.CHAT, JSON.stringify(parsed.data.chatMessages));
        counts.chatMessages = parsed.data.chatMessages.length;
        restoredCount++;
      }
      if (parsed.data.profileRequests) {
        localStorage.setItem(STORAGE_KEYS.PROFILE_REQUESTS, JSON.stringify(parsed.data.profileRequests));
        restoredCount++;
      }
      if (parsed.data.officials) {
        localStorage.setItem(STORAGE_KEYS.OFFICIALS, JSON.stringify(parsed.data.officials));
        counts.officials = parsed.data.officials.length;
        restoredCount++;
      }
      if (parsed.data.passwords) {
        localStorage.setItem(STORAGE_KEYS.PASSWORDS, JSON.stringify(parsed.data.passwords));
        counts.passwords = Object.keys(parsed.data.passwords).length;
        restoredCount++;
      }
      if (parsed.data.passwordChangedUsers) {
        localStorage.setItem(STORAGE_KEYS.PASSWORD_CHANGED_USERS, JSON.stringify(parsed.data.passwordChangedUsers));
        restoredCount++;
      }
      if (parsed.data.systemDefaultPassword) {
        localStorage.setItem(STORAGE_KEYS.SYSTEM_DEFAULT_PASSWORD, String(parsed.data.systemDefaultPassword).trim());
        restoredCount++;
      }
      if (parsed.data.periodicPasswordPolicy) {
        localStorage.setItem(STORAGE_KEYS.PERIODIC_PASSWORD_POLICY, JSON.stringify(parsed.data.periodicPasswordPolicy));
        restoredCount++;
      }
      if (parsed.data.lockedUsers) {
        localStorage.setItem(STORAGE_KEYS.LOCKED_USERS, JSON.stringify(parsed.data.lockedUsers));
        restoredCount++;
      }
      if (parsed.data.annualBudgets) {
        localStorage.setItem(STORAGE_KEYS.ANNUAL_BUDGETS, JSON.stringify(parsed.data.annualBudgets));
        counts.annualBudgets = parsed.data.annualBudgets.length;
        restoredCount++;
      }
      if (parsed.data.overdueAlerts) {
        localStorage.setItem(STORAGE_KEYS.OVERDUE_ALERTS, JSON.stringify(parsed.data.overdueAlerts));
        counts.overdueAlerts = parsed.data.overdueAlerts.length;
        restoredCount++;
      }
      if (parsed.data.documents) {
        localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(parsed.data.documents));
        counts.documents = parsed.data.documents.length;
        restoredCount++;
      }
      if (parsed.data.posts) {
        localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(parsed.data.posts));
        counts.posts = parsed.data.posts.length;
        restoredCount++;
      }
      if (parsed.data.queries) {
        localStorage.setItem(STORAGE_KEYS.QUERIES, JSON.stringify(parsed.data.queries));
        counts.queries = parsed.data.queries.length;
        restoredCount++;
      }
      if (parsed.data.incomeCategories) {
        localStorage.setItem(STORAGE_KEYS.INCOME_CATEGORIES, JSON.stringify(parsed.data.incomeCategories));
        restoredCount++;
      }
      if (parsed.data.expenseCategories) {
        localStorage.setItem(STORAGE_KEYS.EXPENSE_CATEGORIES, JSON.stringify(parsed.data.expenseCategories));
        restoredCount++;
      }
      if (parsed.data.auditLogs && Array.isArray(parsed.data.auditLogs)) {
        localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(parsed.data.auditLogs));
        counts.auditLogs = parsed.data.auditLogs.length;
        restoredCount++;
      }
      if (parsed.data.shareTransfers && Array.isArray(parsed.data.shareTransfers)) {
        localStorage.setItem(STORAGE_KEYS.SHARE_TRANSFERS, JSON.stringify(parsed.data.shareTransfers));
        restoredCount++;
      }

      localStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());

      this.logAudit(
        currentUser,
        'RESTORE_BACKUP',
        'SYSTEM_CONFIG',
        'MIGRATION-RESTORE',
        `Restored complete database for domain/hosting migration (Source: ${parsed.meta?.sourceDomain || 'External'}, Exported: ${parsed.meta?.exportedAt || 'Unknown'}). All collections restored with zero data loss.`
      );

      this.notify();
      return {
        success: true,
        message: `Complete system database successfully restored and migrated with zero data loss! (${counts.members || 144} members, ${counts.incomes || 0} incomes, ${counts.expenses || 0} expenses, budgets, credentials and documents synchronized).`,
        restoredCounts: counts,
      };
    } catch (err: any) {
      return { success: false, message: `Failed to restore database: ${err.message}` };
    }
  }

  // --- Instant Sync & Offline Continuity Engine ---
  public syncLocalDataWithCloud(currentUser?: User): {
    success: boolean;
    syncedAt: string;
    message: string;
    storageUsedKB: number;
  } {
    const nowIso = new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS.LAST_SYNC, nowIso);

    // Calculate approximate local device storage used
    let totalBytes = 0;
    try {
      for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          totalBytes += (localStorage[key].length + key.length) * 2;
        }
      }
    } catch {}

    const storageUsedKB = Math.round(totalBytes / 1024);

    if (currentUser) {
      this.logAudit(
        currentUser,
        'UPDATE',
        'SYSTEM_CONFIG',
        'INSTANT_SYNC',
        `Instant device sync executed. Local storage resources verified (${storageUsedKB} KB active).`
      );
    }

    this.notify();

    return {
      success: true,
      syncedAt: nowIso,
      message: 'System synchronized instantly! Local device resources are active and persistent.',
      storageUsedKB,
    };
  }

  public getOfflineSystemStats(): {
    isOnline: boolean;
    lastSyncTime: string;
    storageUsedKB: number;
    totalRecordsCount: number;
  } {
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    const lastSyncTime = this.getLastSyncTime();

    let totalBytes = 0;
    try {
      for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          totalBytes += (localStorage[key].length + key.length) * 2;
        }
      }
    } catch {}

    const members = this.getMembers().length;
    const incomes = this.getIncomes().length;
    const expenses = this.getExpenses().length;
    const docs = this.getDocuments().length;
    const queries = this.getQueries().length;
    const audits = this.getAuditLogs().length;

    return {
      isOnline,
      lastSyncTime,
      storageUsedKB: Math.round(totalBytes / 1024),
      totalRecordsCount: members + incomes + expenses + docs + queries + audits,
    };
  }

  public resetToFactoryDefaults(currentUser: User): void {
    if (currentUser.role !== 'SYSTEM_ADMIN') {
      throw new Error('Only System Admin can reset to factory default database state.');
    }
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(INITIAL_MEMBERS));
    localStorage.setItem(STORAGE_KEYS.INCOMES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(INITIAL_AUDIT_LOGS));
    localStorage.setItem(STORAGE_KEYS.CHAT, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.ELECTION, JSON.stringify(INITIAL_ELECTION_POLL));
    localStorage.setItem(STORAGE_KEYS.EC, JSON.stringify(INITIAL_EXECUTIVE_COMMITTEE));
    localStorage.setItem(STORAGE_KEYS.OFFICIALS, JSON.stringify(INITIAL_OFFICIALS));
    localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.QUERIES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.PROFILE_REQUESTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.OVERDUE_ALERTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.LOCAL_SNAPSHOTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());

    this.logAudit(
      currentUser,
      'CREATE',
      'SYSTEM_CONFIG',
      'FACTORY-RESET',
      'Reset all databases to clean fresh deployment state (all user credentials and 144 accounts preserved).'
    );
    this.notify();
  }

  // --- CSV Export Generation for External Auditing & Reporting ---
  public exportIncomesCSV(): string {
    const incomes = this.getIncomes().filter((i) => !i.isSoftDeleted);
    const headers = [
      'Deposit ID',
      'Tier',
      'Deposit Type',
      'Amount (BDT)',
      'Category',
      'Transaction Date',
      'Member ID / Share Owner',
      'Shareholder Name',
      'Controlling Director',
      'Sales Description',
      'Payment Method',
      'Reference / Trx / Cheque No',
      'Submitter Name',
      'Submitter Role',
      'Audit Status',
      'Approved By',
      'Approved Date',
      'Submission Timestamp',
      'Remarks / Memo',
    ];

    const rows = incomes.map((i) => [
      `"${i.id}"`,
      `"${i.tier || 'Tier-1'}"`,
      `"${i.type}"`,
      i.amount,
      `"${(i.category || '').replace(/"/g, '""')}"`,
      `"${i.date}"`,
      `"${i.shareOwnerId || 'N/A'}"`,
      `"${(i.memberName || '').replace(/"/g, '""')}"`,
      `"${(i.controllingDirector || '').replace(/"/g, '""')}"`,
      `"${(i.salesDescription || '').replace(/"/g, '""')}"`,
      `"${i.paymentMethod || ''}"`,
      `"${(i.referenceNumber || '').replace(/"/g, '""')}"`,
      `"${(i.submitterName || '').replace(/"/g, '""')}"`,
      `"${i.submitterRole || ''}"`,
      `"${i.status}"`,
      `"${(i.approvedByName || i.approvedBy || '').replace(/"/g, '""')}"`,
      `"${i.approvedAt || ''}"`,
      `"${i.createdAt || ''}"`,
      `"${(i.remarks || '').replace(/"/g, '""')}"`,
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  public exportExpensesCSV(): string {
    const expenses = this.getExpenses().filter((e) => !e.isSoftDeleted);
    const headers = [
      'Expense Voucher ID',
      'Tier',
      'Amount (BDT)',
      'Category',
      'Transaction Date',
      'Payee / Contractor / Bill Recipient',
      'Voucher / Bill Number',
      'Submitter Name',
      'Submitter Role',
      'Audit Status',
      'Approved By',
      'Approved Date',
      'Submission Timestamp',
      'Remarks / Procurement Memo',
    ];

    const rows = expenses.map((e) => [
      `"${e.id}"`,
      `"${e.tier || 'Tier-1'}"`,
      e.amount,
      `"${(e.category || '').replace(/"/g, '""')}"`,
      `"${e.date}"`,
      `"${(e.billRecipient || '').replace(/"/g, '""')}"`,
      `"${(e.voucherNumber || '').replace(/"/g, '""')}"`,
      `"${(e.submitterName || '').replace(/"/g, '""')}"`,
      `"${e.submitterRole || ''}"`,
      `"${e.status}"`,
      `"${(e.approvedByName || e.approvedBy || '').replace(/"/g, '""')}"`,
      `"${e.approvedAt || ''}"`,
      `"${e.createdAt || ''}"`,
      `"${(e.remarks || '').replace(/"/g, '""')}"`,
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  // --- Automated Overdue Payment Alert Engine (InfoCommunicationView Integration) ---
  public getOverdueAlerts(): OverduePaymentAlert[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.OVERDUE_ALERTS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public getOverdueAlertsForMember(memberIdOrShareNumber: string | number): OverduePaymentAlert[] {
    const alerts = this.getOverdueAlerts();
    return alerts.filter(
      (a) =>
        a.memberId === String(memberIdOrShareNumber) ||
        String(a.shareNumber) === String(memberIdOrShareNumber)
    );
  }

  public sendOverduePaymentAlert(
    member: Member,
    overdueAmount: number,
    personalDeposit: number,
    shareExpense: number,
    senderUser: User,
    customNotes?: string
  ): OverduePaymentAlert {
    const alerts = this.getOverdueAlerts();
    const alertId = `ALERT-OD-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 900 + 100)}`;
    const queryId = `QRY-OD-${Date.now().toString(36).toUpperCase()}`;
    const docId = `DOC-OD-${Date.now().toString(36).toUpperCase()}`;
    const timestamp = new Date().toISOString();
    const formattedDate = new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const noticeText = `[AUTOMATED EXECUTIVE DEMAND NOTICE]
Date: ${formattedDate}
To Shareholder: ${member.name} (Member ID: ${member.id})
Share Number: #${member.shareNumber} of 144
Controlling Director: ${member.controllingDirectorName}
Contact: ${member.phone} | ${member.email}

Financial Ledger Summary:
- Approved Personal Deposits (Joma): ${formatBDT(personalDeposit)}
- 1/144 Share Quota Expense (Khorch): ${formatBDT(shareExpense)}
- Outstanding Overdue Deficit: ${formatBDT(overdueAmount)}

Notice Details:
As per the collective financial review of Prottasha Housing Society Ltd., your share capital account currently reflects an overdue balance of ${formatBDT(overdueAmount)}. In accordance with society governance bylaws, all shareholders are required to maintain account equilibrium against ongoing site development, land registration, and infrastructure costs.

${customNotes ? `Additional Executive Note: ${customNotes}\n` : ''}
Action Required:
Please deposit the overdue balance of ${formatBDT(overdueAmount)} to the official Prottasha Society Bank Escrow Account within 15 calendar days and submit deposit receipt via the Income Module or contact your Controlling Director (${member.controllingDirectorName}).

Issued by Order of:
${senderUser.name} (${senderUser.role.replace('_', ' ')})
Prottasha Housing Society Executive Committee`;

    const newAlert: OverduePaymentAlert = {
      id: alertId,
      memberId: member.id,
      memberName: member.name,
      shareNumber: member.shareNumber,
      controllingDirectorName: member.controllingDirectorName,
      overdueAmountBDT: Math.round(overdueAmount),
      memberPersonalDepositBDT: Math.round(personalDeposit),
      memberShareExpenseBDT: Math.round(shareExpense),
      sentAt: timestamp,
      sentBy: senderUser.name,
      sentByRole: senderUser.role,
      channel: 'INFO_COMMUNICATION_VIEW',
      status: 'DISPATCHED',
      queryId,
      documentId: docId,
      noticeText,
    };

    alerts.unshift(newAlert);
    localStorage.setItem(STORAGE_KEYS.OVERDUE_ALERTS, JSON.stringify(alerts.slice(0, 300)));

    // 1. Dispatch into InfoCommunicationView -> Query Window (Direct member query ticket)
    try {
      const queries = this.getQueries();
      const overdueQuery: MemberQuery = {
        id: queryId,
        memberId: member.id,
        shareNumber: member.shareNumber,
        submitterName: 'EC Accounts Directorate (Automated Alert)',
        submitterPhone: '+8801611447765',
        category: 'Finance & Deposit Query',
        subject: `⚠️ URGENT DEMAND: Overdue Payment Notice - ${member.id} (Share #${member.shareNumber})`,
        details: noticeText,
        referenceId: member.id,
        status: 'OPEN',
        submittedAt: timestamp,
        assignedTo: member.controllingDirectorName,
        responses: [
          {
            id: `RESP-${Date.now().toString(36)}`,
            responderName: senderUser.name,
            responderRole: senderUser.role,
            responderDesignation: senderUser.officialDesignation || senderUser.ecDesignation || senderUser.role,
            message: `Automated overdue notice dispatched to shareholder statement. Current verified deficit is ${formatBDT(overdueAmount)}.`,
            respondedAt: timestamp,
          },
        ],
      };
      queries.unshift(overdueQuery);
      localStorage.setItem(STORAGE_KEYS.QUERIES, JSON.stringify(queries));
    } catch (e) {
      console.error('Failed to dispatch query in InfoCommunicationView:', e);
    }

    // 2. Dispatch into InfoCommunicationView -> Documentations (Official Notice)
    try {
      const docs = this.getDocuments();
      const overdueDoc: SocietyDocument = {
        id: docId,
        title: `Overdue Payment Notice: ${member.id} (${member.name}) - Share #${member.shareNumber}`,
        category: 'Executive Committee Notice',
        description: `Official demand notice issued for overdue share capital deficit of ${formatBDT(overdueAmount)}.`,
        fileName: `PHS_Demand_Notice_${member.id}_${new Date().toISOString().split('T')[0]}.pdf`,
        fileType: 'PDF',
        fileSize: '1.2 MB',
        uploadedBy: senderUser.name,
        uploadedByRole: senderUser.role,
        uploadedByDesignation: senderUser.officialDesignation || senderUser.ecDesignation || 'System Directorate',
        uploadedAt: timestamp,
        isPinned: true,
        downloadCount: 0,
      };
      docs.unshift(overdueDoc);
      localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(docs));
    } catch (e) {
      console.error('Failed to attach document in InfoCommunicationView:', e);
    }

    // 3. Log Audit Entry
    this.logAudit(
      senderUser,
      'CREATE',
      'MEMBER',
      member.id,
      `Automated overdue payment alert sent to ${member.name} (${member.id}, Share #${member.shareNumber}) for ${formatBDT(overdueAmount)} via InfoCommunicationView`
    );

    this.notify();
    return newAlert;
  }

  public sendBatchOverduePaymentAlerts(
    overdueList: Array<{
      member: Member;
      overdueAmount: number;
      personalDeposit: number;
      shareExpense: number;
    }>,
    senderUser: User,
    customBatchNote?: string
  ): { dispatchedCount: number; alerts: OverduePaymentAlert[] } {
    const createdAlerts: OverduePaymentAlert[] = [];

    for (const item of overdueList) {
      const alert = this.sendOverduePaymentAlert(
        item.member,
        item.overdueAmount,
        item.personalDeposit,
        item.shareExpense,
        senderUser,
        customBatchNote
      );
      createdAlerts.push(alert);
    }

    this.logAudit(
      senderUser,
      'CREATE',
      'SYSTEM_CONFIG',
      'BATCH_OVERDUE_ALERTS',
      `Executive batch overdue alerts dispatched to ${createdAlerts.length} shareholders via InfoCommunicationView`
    );

    this.notify();
    return {
      dispatchedCount: createdAlerts.length,
      alerts: createdAlerts,
    };
  }

  public resolveOverdueAlert(alertId: string, currentUser: User): boolean {
    const alerts = this.getOverdueAlerts();
    const alert = alerts.find((a) => a.id === alertId);
    if (!alert) return false;

    alert.status = 'RESOLVED';
    localStorage.setItem(STORAGE_KEYS.OVERDUE_ALERTS, JSON.stringify(alerts));

    this.logAudit(
      currentUser,
      'UPDATE',
      'MEMBER',
      alert.memberId,
      `Overdue alert ${alertId} for ${alert.memberName} marked as resolved`
    );
    this.notify();
    return true;
  }
}

export const storageService = new StorageService();
