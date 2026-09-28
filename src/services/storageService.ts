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
} from '../utils/seedData';
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
  INCOME_CATEGORIES: 'phs_finance_income_categories_v1',
  EXPENSE_CATEGORIES: 'phs_finance_expense_categories_v1',
  LAST_SYNC: 'phs_finance_last_sync_v1',
};

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
    if (!localStorage.getItem(STORAGE_KEYS.LAST_SYNC)) {
      localStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
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
      // Ensure required EC designations on member records
      members.forEach((m) => {
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
      });
      return members;
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
    proposed: { name: string; phone: string; email: string; address: string },
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
        requestedAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
    }

    this.logAudit(
      currentUser,
      'UPDATE',
      'MEMBER',
      memberId,
      `Submitted profile change request for member ${memberId} (Awaiting Admin Approval)`
    );

    this.notify();
    return newReq;
  }

  public approveProfileUpdateRequest(
    requestId: string,
    currentUser: User,
    modifications?: { name?: string; phone?: string; email?: string; address?: string }
  ): void {
    if (currentUser.role !== 'SYSTEM_ADMIN' && currentUser.role !== 'DELEGATED_ADMIN') {
      throw new Error('Only System Admin or Delegated Admin can approve profile updates.');
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
      m.name = modifications?.name || req.proposedName;
      m.phone = modifications?.phone || req.proposedPhone;
      m.email = modifications?.email || req.proposedEmail;
      m.address = modifications?.address || req.proposedAddress;
      delete m.pendingUpdate;
      localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
    }

    localStorage.setItem(STORAGE_KEYS.PROFILE_REQUESTS, JSON.stringify(requests));

    this.logAudit(
      currentUser,
      'APPROVE',
      'MEMBER',
      req.memberId,
      `Approved and committed profile changes for member ${req.memberId} (${m?.name})`
    );

    this.notify();
  }

  public rejectProfileUpdateRequest(
    requestId: string,
    reason: string,
    currentUser: User
  ): void {
    if (currentUser.role !== 'SYSTEM_ADMIN' && currentUser.role !== 'DELEGATED_ADMIN') {
      throw new Error('Only System Admin or Delegated Admin can reject profile updates.');
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
    if (currentUser.role !== 'SYSTEM_ADMIN' && currentUser.role !== 'DELEGATED_ADMIN') {
      throw new Error('Only System Admin or Delegated Admin can directly modify member profiles.');
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
  public getUserPassword(usernameOrId: string): string {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PASSWORDS);
      if (data) {
        const passwords = JSON.parse(data);
        const key = usernameOrId.trim().toLowerCase();
        if (passwords[key]) {
          return passwords[key];
        }
      }
    } catch (e) {
      console.error('Error reading passwords:', e);
    }
    // Default initial password for all users
    return '12345679';
  }

  public resetUserPassword(
    targetIdentifier: string,
    newPassword: string,
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
      lowerTarget === 'saif ahmed sakil' ||
      lowerTarget === 'phsm-001' ||
      lowerTarget === 'usr-admin-root';

    if (currentUser.role === 'DELEGATED_ADMIN' && isTargetSakil) {
      throw new Error('Access Denied: Delegated Admin is strictly excluded from resetting password for Root System Admin Saif Ahmed Sakil.');
    }

    if (!newPassword || newPassword.trim().length === 0) {
      throw new Error('Password cannot be empty.');
    }

    let passwords: Record<string, string> = {};
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PASSWORDS);
      if (data) {
        passwords = JSON.parse(data);
      }
    } catch {}

    const cleanPass = newPassword.trim();
    passwords[lowerTarget] = cleanPass;
    passwords[cleanTarget] = cleanPass;

    localStorage.setItem(STORAGE_KEYS.PASSWORDS, JSON.stringify(passwords));

    this.logAudit(
      currentUser,
      'UPDATE',
      'USER',
      cleanTarget,
      `${currentUser.name} (${currentUser.role}) reset password for user ${cleanTarget}`
    );

    this.notify();
    return {
      success: true,
      message: `Password for ${cleanTarget} successfully reset to "${cleanPass}".`,
    };
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

  // --- Backup & Restore Engine ---
  public createDatabaseBackupJSON(currentUser: User): string {
    const backup = {
      meta: {
        system: 'Prottasha Housing Society - Finance (PHS-Finance)',
        exportedAt: new Date().toISOString(),
        exportedBy: {
          id: currentUser.id,
          name: currentUser.name,
          role: currentUser.role,
        },
        version: '1.0.0',
      },
      data: {
        members: this.getMembers(),
        incomes: this.getIncomes(),
        expenses: this.getExpenses(),
        executiveCommittee: this.getExecutiveCommittee(),
        electionPoll: this.getElectionPoll(),
        chatMessages: this.getChatMessages(),
        auditLogs: this.getAuditLogs(),
        profileRequests: this.getProfileUpdateRequests(),
      },
    };

    this.logAudit(
      currentUser,
      'EXPORT_BACKUP',
      'SYSTEM_CONFIG',
      'BACKUP-JSON',
      `Generated full database snapshot backup JSON`
    );

    return JSON.stringify(backup, null, 2);
  }

  public restoreDatabaseBackupJSON(jsonString: string, currentUser: User): { success: boolean; message: string } {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.data || !parsed.data.incomes || !parsed.data.expenses) {
        return { success: false, message: 'Invalid backup structure. Required entities are missing.' };
      }

      if (parsed.data.members) localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(parsed.data.members));
      if (parsed.data.incomes) localStorage.setItem(STORAGE_KEYS.INCOMES, JSON.stringify(parsed.data.incomes));
      if (parsed.data.expenses) localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(parsed.data.expenses));
      if (parsed.data.executiveCommittee) localStorage.setItem(STORAGE_KEYS.EC, JSON.stringify(parsed.data.executiveCommittee));
      if (parsed.data.electionPoll) localStorage.setItem(STORAGE_KEYS.ELECTION, JSON.stringify(parsed.data.electionPoll));
      if (parsed.data.chatMessages) localStorage.setItem(STORAGE_KEYS.CHAT, JSON.stringify(parsed.data.chatMessages));
      if (parsed.data.profileRequests) localStorage.setItem(STORAGE_KEYS.PROFILE_REQUESTS, JSON.stringify(parsed.data.profileRequests));

      this.logAudit(
        currentUser,
        'RESTORE_BACKUP',
        'SYSTEM_CONFIG',
        'RESTORE-JSON',
        `Restored database from external JSON snapshot (Original export: ${parsed.meta?.exportedAt || 'Unknown'})`
      );

      this.notify();
      return { success: true, message: 'Database successfully restored and synchronized.' };
    } catch (err: any) {
      return { success: false, message: `Failed to restore database: ${err.message}` };
    }
  }

  public resetToFactoryDefaults(currentUser: User): void {
    if (currentUser.role !== 'SYSTEM_ADMIN') {
      throw new Error('Only System Admin can reset to factory default database state.');
    }
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(INITIAL_MEMBERS));
    localStorage.setItem(STORAGE_KEYS.INCOMES, JSON.stringify(INITIAL_INCOMES));
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(INITIAL_EXPENSES));
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(INITIAL_AUDIT_LOGS));
    localStorage.setItem(STORAGE_KEYS.CHAT, JSON.stringify(INITIAL_CHAT_MESSAGES));
    localStorage.setItem(STORAGE_KEYS.ELECTION, JSON.stringify(INITIAL_ELECTION_POLL));
    localStorage.setItem(STORAGE_KEYS.EC, JSON.stringify(INITIAL_EXECUTIVE_COMMITTEE));
    localStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());

    this.logAudit(
      currentUser,
      'CREATE',
      'SYSTEM_CONFIG',
      'FACTORY-RESET',
      'Reset all databases to default initial state'
    );
    this.notify();
  }

  // --- CSV Export Generation ---
  public exportIncomesCSV(): string {
    const incomes = this.getIncomes().filter((i) => !i.isSoftDeleted);
    const headers = [
      'Deposit ID',
      'Deposit Tier',
      'Type',
      'Amount (BDT)',
      'Category',
      'Date',
      'Member ID',
      'Member Name',
      'Controlling Director',
      'Sales Description',
      'Payment Method',
      'Ref Number',
      'Status',
      'Remarks',
    ];

    const rows = incomes.map((i) => [
      i.id,
      i.tier || 'Tier-1',
      i.type,
      i.amount,
      `"${(i.category || '').replace(/"/g, '""')}"`,
      i.date,
      i.shareOwnerId || 'N/A',
      `"${(i.memberName || '').replace(/"/g, '""')}"`,
      `"${(i.controllingDirector || '').replace(/"/g, '""')}"`,
      `"${(i.salesDescription || '').replace(/"/g, '""')}"`,
      i.paymentMethod,
      `"${(i.referenceNumber || '').replace(/"/g, '""')}"`,
      i.status,
      `"${(i.remarks || '').replace(/"/g, '""')}"`,
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  public exportExpensesCSV(): string {
    const expenses = this.getExpenses().filter((e) => !e.isSoftDeleted);
    const headers = [
      'Expense ID',
      'Expense Tier',
      'Amount (BDT)',
      'Category',
      'Date',
      'Payee / Bill Recipient',
      'Voucher No',
      'Submitter Name',
      'Submitter Role',
      'Status',
      'Remarks',
    ];

    const rows = expenses.map((e) => [
      e.id,
      e.tier || 'Tier-1',
      e.amount,
      `"${(e.category || '').replace(/"/g, '""')}"`,
      e.date,
      `"${(e.billRecipient || '').replace(/"/g, '""')}"`,
      `"${(e.voucherNumber || '').replace(/"/g, '""')}"`,
      `"${(e.submitterName || '').replace(/"/g, '""')}"`,
      e.submitterRole,
      e.status,
      `"${(e.remarks || '').replace(/"/g, '""')}"`,
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }
}

export const storageService = new StorageService();
