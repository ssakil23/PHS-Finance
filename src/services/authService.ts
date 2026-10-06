/**
 * PHS-Finance Authentication & RBAC Service
 * Secure session management, credential validation, role checking,
 * and user switching protection.
 */

import { User, UserRole } from '../types';
import { storageService } from './storageService';
import { DIRECTORS, formatMemberId, parseShareNumberFromMemberId, getDirectorForShareNumber } from '../utils/directors';

const AUTH_STORAGE_KEY = 'phs_finance_auth_user_v1';

export interface PredefinedPersona {
  label: string;
  role: UserRole;
  username: string;
  name: string;
  description: string;
  memberId?: string;
  directorName?: string;
}

export const PREDEFINED_PERSONAS: PredefinedPersona[] = [
  {
    label: 'President (Root Admin)',
    role: 'SYSTEM_ADMIN',
    username: 'ssakil',
    name: 'SAIF AHMED SAKIL',
    description: 'President, EC | Applied Statistics, ISRT, DU | Root Control, Full Entry & EC Rights',
    memberId: 'PHSM-001',
    directorName: 'SAIF AHMED SAKIL',
  },
  {
    label: 'Vice President (VP)',
    role: 'DELEGATED_ADMIN',
    username: 'molla',
    name: 'M OMAR FARUQUE MOLLA',
    description: 'Vice President (VP), EC | Designated Director (Shares 49–55) | Delegated Authority',
    memberId: 'PHSM-049',
    directorName: 'M OMAR FARUQUE MOLLA',
  },
  {
    label: 'General Secretary (Director)',
    role: 'DELEGATED_ADMIN',
    username: 'sawdagor',
    name: 'M MASUD SAWDAGOR',
    description: 'General Secretary, EC | Designated Director (Shares 21–48) | Approval Rights',
    memberId: 'PHSM-021',
    directorName: 'M MASUD SAWDAGOR',
  },
  {
    label: 'Treasurer (Director)',
    role: 'DELEGATED_ADMIN',
    username: 'sirajul',
    name: 'SIRAJUL ISLAM',
    description: 'Treasurer, EC | Designated Director (Shares 88–94) | Financial Approvals',
    memberId: 'PHSM-088',
    directorName: 'SIRAJUL ISLAM',
  },
  {
    label: 'Manager (Empowered Official)',
    role: 'MANAGER',
    username: 'manager1',
    name: 'Md. Rafiqul Islam',
    description: 'Society Manager | Empowered by System Admin to make Income & Expense entries',
  },
  {
    label: 'DyM (Empowered Official)',
    role: 'MANAGER',
    username: 'dym_hasan',
    name: 'Kazi Hasan (DyM)',
    description: 'Deputy Manager | Empowered Official for operational entries',
  },
  {
    label: 'AistM (NOT Empowered)',
    role: 'MANAGER',
    username: 'aistm_kamal',
    name: 'Kamal Hossain (AistM)',
    description: 'Assistant Manager | Entry permission NOT yet empowered by System Admin (Restricted)',
  },
  {
    label: 'Share Owner (PHSM-007)',
    role: 'MEMBER',
    username: 'PHSM-007',
    name: 'Engr. Tanvir Ahmed',
    description: 'General Member | Strict Data Isolation, Live Chat, EC Ballot Voting',
    memberId: 'PHSM-007',
    directorName: 'SAIF AHMED SAKIL',
  },
];

class AuthService {
  private currentUser: User | null = null;
  private listeners: Set<(user: User | null) => void> = new Set();

  constructor() {
    this.loadSession();
  }

  public subscribe(listener: (user: User | null) => void): () => void {
    this.listeners.add(listener);
    listener(this.currentUser);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((listener) => {
      try {
        listener(this.currentUser);
      } catch (err) {
        console.error('Auth listener error:', err);
      }
    });
  }

  private loadSession() {
    try {
      const data = localStorage.getItem(AUTH_STORAGE_KEY);
      if (data) {
        this.currentUser = JSON.parse(data);
        if (this.currentUser) {
          // Sync photo with member or official record
          if (this.currentUser.memberId) {
            const m = storageService.getMemberById(this.currentUser.memberId);
            if (m) {
              this.currentUser.photoUrl = m.photoUrl;
              this.currentUser.photoStatus = m.photoStatus;
              this.currentUser.pendingPhotoUrl = m.pendingPhotoUrl;
            }
          } else {
            const officials = storageService.getOfficials();
            const off = officials.find(
              (o) =>
                o.username.toLowerCase() === this.currentUser?.username.toLowerCase() ||
                o.id === this.currentUser?.id
            );
            if (off) {
              this.currentUser.photoUrl = off.photoUrl;
              this.currentUser.photoStatus = off.photoStatus;
            }
          }

          const requiresChange =
            storageService.isPasswordChangeRequired(this.currentUser.username) ||
            (this.currentUser.memberId ? storageService.isPasswordChangeRequired(this.currentUser.memberId) : false);
          this.currentUser.requiresPasswordChange = requiresChange;
          this.currentUser.hasChangedDefaultPassword = !requiresChange;
        }
      } else {
        this.currentUser = null;
      }
    } catch {
      this.currentUser = null;
    }
  }

  public getCurrentUser(): User | null {
    if (this.currentUser) {
      // Synchronize password requirement state dynamically
      const hasCustom = storageService.hasCustomPassword(this.currentUser.username);
      this.currentUser.hasChangedDefaultPassword = hasCustom;
      this.currentUser.requiresPasswordChange = storageService.isPasswordChangeRequired(
        this.currentUser.username
      );

      if (this.currentUser.memberId) {
        const m = storageService.getMemberById(this.currentUser.memberId);
        if (m) {
          this.currentUser.photoUrl = m.photoUrl;
          this.currentUser.photoStatus = m.photoStatus;
          this.currentUser.pendingPhotoUrl = m.pendingPhotoUrl;
        }
      } else {
        const officials = storageService.getOfficials();
        const off = officials.find(
          (o) =>
            o.username.toLowerCase() === this.currentUser?.username.toLowerCase() ||
            o.id === this.currentUser?.id
        );
        if (off) {
          this.currentUser.photoUrl = off.photoUrl;
          this.currentUser.photoStatus = off.photoStatus;
        }
      }
    }
    return this.currentUser;
  }

  public updateCurrentUserPhoto(photoUrl: string, photoStatus: 'AUTHORIZED' | 'PENDING_AUTHORIZATION' | 'REJECTED') {
    if (!this.currentUser) return;
    this.currentUser.photoUrl = photoUrl;
    this.currentUser.photoStatus = photoStatus;
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(this.currentUser));
    this.notify();
  }

  public login(usernameInput: string, passwordInput: string): { success: boolean; message: string; user?: User } {
    const username = usernameInput.trim();
    const password = passwordInput.trim();

    if (!username) {
      return { success: false, message: 'Please enter your Username or Member ID.' };
    }

    // Check if user account is locked
    if (storageService.isUserLocked(username)) {
      return {
        success: false,
        message: 'ACCOUNT LOCKED: This account has been locked by administration. Please contact the System Admin or Delegated Admin to unlock your account.',
      };
    }

    // Passwords check: user-specific password, system default password set by System Admin, or root password
    const hasCustom = storageService.hasCustomPassword(username);
    const storedPass = storageService.getUserPassword(username);
    const systemDefault = storageService.getSystemDefaultPassword();

    let isPassValid = false;

    if (hasCustom) {
      // User has set a custom personal password. The old default password CANNOT open the account anymore!
      isPassValid = password === storedPass;
      if (!isPassValid) {
        if (
          password === systemDefault ||
          password === '12345679' ||
          password === 'Sarah@14#2014'
        ) {
          return {
            success: false,
            message:
              'Invalid password. You have previously set a personal password for this account. The old default password is no longer accepted. Please enter your new personal password.',
          };
        }
        return {
          success: false,
          message: 'Invalid password. Please enter the new personal password you set for this account.',
        };
      }
    } else {
      // User has not set a personal password yet (initial default password or reset by admin)
      isPassValid =
        password === storedPass ||
        password === systemDefault ||
        password === '12345679' ||
        ((username.toLowerCase() === 'ssakil' ||
          username.toUpperCase() === 'PHSM-001' ||
          username === '1') &&
          password === 'Sarah@14#2014');

      if (!isPassValid) {
        return {
          success: false,
          message: `Invalid password. (Initial system default password is: ${systemDefault})`,
        };
      }
    }

    const lowerUser = username.toLowerCase();
    const upperUser = username.toUpperCase();

    // 1. Root System Admin: Saif Ahmed Sakil (President)
    if (
      lowerUser === 'ssakil' ||
      lowerUser === 'sakil' ||
      lowerUser === 'saif' ||
      upperUser === 'PHSM-001' ||
      username === '1'
    ) {
      const adminUser: User = {
        id: 'usr-admin-root',
        username: 'ssakil',
        name: 'SAIF AHMED SAKIL',
        role: 'SYSTEM_ADMIN',
        memberId: 'PHSM-001',
        shareNumber: 1,
        directorKey: 'SAIF_AHMED_SAKIL',
        phone: '+8801611447765',
        email: 'saif049@gmail.com',
        department: 'Applied Statistics, ISRT, DU',
        ecDesignation: 'President',
        monthlyHonorariumBDT: 35000,
      };
      return this.trySetUser(adminUser, 'Welcome Saif Ahmed Sakil (President & Root System Admin)');
    }

    // 2. Delegated Admin Directors:
    const directorKeys: Record<string, { name: string; key: string; memberId: string; shareNumber: number; phone: string; ecDesignation?: User['ecDesignation']; honorarium?: number }> = {
      sawdagor: { name: 'M MASUD SAWDAGOR', key: 'M_MASUD_SAWDAGOR', memberId: 'PHSM-021', shareNumber: 21, phone: '+8801711223344', ecDesignation: 'General Secretary', honorarium: 30000 },
      masud: { name: 'M MASUD SAWDAGOR', key: 'M_MASUD_SAWDAGOR', memberId: 'PHSM-021', shareNumber: 21, phone: '+8801711223344', ecDesignation: 'General Secretary', honorarium: 30000 },
      'phsm-021': { name: 'M MASUD SAWDAGOR', key: 'M_MASUD_SAWDAGOR', memberId: 'PHSM-021', shareNumber: 21, phone: '+8801711223344', ecDesignation: 'General Secretary', honorarium: 30000 },
      '21': { name: 'M MASUD SAWDAGOR', key: 'M_MASUD_SAWDAGOR', memberId: 'PHSM-021', shareNumber: 21, phone: '+8801711223344', ecDesignation: 'General Secretary', honorarium: 30000 },

      molla: { name: 'M OMAR FARUQUE MOLLA', key: 'M_OMAR_FARUQUE_MOLLA', memberId: 'PHSM-049', shareNumber: 49, phone: '+8801811334455', ecDesignation: 'VICE PRESIDENT (VP)', honorarium: 25000 },
      faruque: { name: 'M OMAR FARUQUE MOLLA', key: 'M_OMAR_FARUQUE_MOLLA', memberId: 'PHSM-049', shareNumber: 49, phone: '+8801811334455', ecDesignation: 'VICE PRESIDENT (VP)', honorarium: 25000 },
      omar: { name: 'M OMAR FARUQUE MOLLA', key: 'M_OMAR_FARUQUE_MOLLA', memberId: 'PHSM-049', shareNumber: 49, phone: '+8801811334455', ecDesignation: 'VICE PRESIDENT (VP)', honorarium: 25000 },
      'phsm-049': { name: 'M OMAR FARUQUE MOLLA', key: 'M_OMAR_FARUQUE_MOLLA', memberId: 'PHSM-049', shareNumber: 49, phone: '+8801811334455', ecDesignation: 'VICE PRESIDENT (VP)', honorarium: 25000 },
      '49': { name: 'M OMAR FARUQUE MOLLA', key: 'M_OMAR_FARUQUE_MOLLA', memberId: 'PHSM-049', shareNumber: 49, phone: '+8801811334455', ecDesignation: 'VICE PRESIDENT (VP)', honorarium: 25000 },

      shahin: { name: 'SHAHIN AHMED', key: 'SHAHIN_AHMED', memberId: 'PHSM-056', shareNumber: 56, phone: '+8801911445566', ecDesignation: 'MEMBER', honorarium: 20000 },
      'phsm-056': { name: 'SHAHIN AHMED', key: 'SHAHIN_AHMED', memberId: 'PHSM-056', shareNumber: 56, phone: '+8801911445566', ecDesignation: 'MEMBER', honorarium: 20000 },
      '56': { name: 'SHAHIN AHMED', key: 'SHAHIN_AHMED', memberId: 'PHSM-056', shareNumber: 56, phone: '+8801911445566', ecDesignation: 'MEMBER', honorarium: 20000 },

      hashim: { name: 'ABUL HASHIM', key: 'ABUL_HASHIM', memberId: 'PHSM-071', shareNumber: 71, phone: '+8801511556677', ecDesignation: 'MEMBER', honorarium: 20000 },
      'phsm-071': { name: 'ABUL HASHIM', key: 'ABUL_HASHIM', memberId: 'PHSM-071', shareNumber: 71, phone: '+8801511556677', ecDesignation: 'MEMBER', honorarium: 20000 },
      '71': { name: 'ABUL HASHIM', key: 'ABUL_HASHIM', memberId: 'PHSM-071', shareNumber: 71, phone: '+8801511556677', ecDesignation: 'MEMBER', honorarium: 20000 },

      sirajul: { name: 'SIRAJUL ISLAM', key: 'SIRAJUL_ISLAM', memberId: 'PHSM-088', shareNumber: 88, phone: '+8801611667788', ecDesignation: 'TREASURER', honorarium: 25000 },
      'phsm-088': { name: 'SIRAJUL ISLAM', key: 'SIRAJUL_ISLAM', memberId: 'PHSM-088', shareNumber: 88, phone: '+8801611667788', ecDesignation: 'TREASURER', honorarium: 25000 },
      '88': { name: 'SIRAJUL ISLAM', key: 'SIRAJUL_ISLAM', memberId: 'PHSM-088', shareNumber: 88, phone: '+8801611667788', ecDesignation: 'TREASURER', honorarium: 25000 },

      yousuf: { name: 'M ABU YOUSUF', key: 'M_ABU_YOUSUF', memberId: 'PHSM-095', shareNumber: 95, phone: '+8801711778899', ecDesignation: 'MEMBER', honorarium: 20000 },
      'phsm-095': { name: 'M ABU YOUSUF', key: 'M_ABU_YOUSUF', memberId: 'PHSM-095', shareNumber: 95, phone: '+8801711778899', ecDesignation: 'MEMBER', honorarium: 20000 },
      '95': { name: 'M ABU YOUSUF', key: 'M_ABU_YOUSUF', memberId: 'PHSM-095', shareNumber: 95, phone: '+8801711778899', ecDesignation: 'MEMBER', honorarium: 20000 },

      faizan: { name: 'FAIZAN AHMED', key: 'FAIZAN_AHMED', memberId: 'PHSM-102', shareNumber: 102, phone: '+8801811889900', ecDesignation: 'MEMBER', honorarium: 20000 },
      'phsm-102': { name: 'FAIZAN AHMED', key: 'FAIZAN_AHMED', memberId: 'PHSM-102', shareNumber: 102, phone: '+8801811889900', ecDesignation: 'MEMBER', honorarium: 20000 },
      '102': { name: 'FAIZAN AHMED', key: 'FAIZAN_AHMED', memberId: 'PHSM-102', shareNumber: 102, phone: '+8801811889900', ecDesignation: 'MEMBER', honorarium: 20000 },
    };

    if (directorKeys[lowerUser]) {
      const dInfo = directorKeys[lowerUser];
      const delegatedUser: User = {
        id: `usr-del-${dInfo.shareNumber}`,
        username: lowerUser,
        name: dInfo.name,
        role: 'DELEGATED_ADMIN',
        memberId: dInfo.memberId,
        shareNumber: dInfo.shareNumber,
        directorKey: dInfo.key,
        phone: dInfo.phone,
        email: `${dInfo.memberId.toLowerCase()}@prottasha.org`,
        isDelegatedAdmin: true,
        ecDesignation: dInfo.ecDesignation || 'None',
        monthlyHonorariumBDT: dInfo.honorarium,
      };
      return this.trySetUser(delegatedUser, `Welcome Director ${dInfo.name} (Delegated Admin)`);
    }

    // 3. Official Staff Users (Manager, DyM, AistM, Accounts Officer, etc. created by System Admin)
    const officials = storageService.getOfficials();
    const matchedOfficial = officials.find(
      (o) =>
        o.username.toLowerCase() === username.toLowerCase() ||
        o.id.toLowerCase() === username.toLowerCase()
    );
    if (matchedOfficial) {
      const officialUser: User = {
        id: matchedOfficial.id,
        username: matchedOfficial.username,
        name: matchedOfficial.name,
        role: 'MANAGER',
        phone: matchedOfficial.phone,
        email: matchedOfficial.email,
        department: matchedOfficial.department,
        officialDesignation: matchedOfficial.designation,
        isEmpoweredForEntry: matchedOfficial.isEmpoweredForEntry,
      };
      return this.trySetUser(
        officialUser,
        `Welcome ${matchedOfficial.name} (${matchedOfficial.designation}) [Entry: ${
          matchedOfficial.isEmpoweredForEntry ? 'Empowered' : 'Restricted'
        }]`
      );
    }

    if (username.toLowerCase() === 'manager2') {
      const managerUser: User = {
        id: 'usr-mgr-2',
        username: 'manager2',
        name: 'Anisur Rahman (Manager)',
        role: 'MANAGER',
        phone: '+8801711002233',
        email: 'anisur.manager@prottasha.org',
        department: 'Accounts & Operations',
        isEmpoweredForEntry: true,
      };
      return this.trySetUser(managerUser, `Welcome ${managerUser.name}`);
    }

    // 4. Member ID: PHSM-001 to PHSM-144, member1 to member144, share1 to share144, or bare number 1-144
    let shareNum: number | null = null;
    const matchMember = username.toUpperCase().match(/^PHSM-(\d{1,3})$/);
    if (matchMember) {
      shareNum = parseInt(matchMember[1], 10);
    } else {
      const matchAlt = username.toLowerCase().match(/^(?:member|share)?(\d{1,3})$/);
      if (matchAlt) {
        shareNum = parseInt(matchAlt[1], 10);
      }
    }

    if (shareNum !== null && shareNum >= 1 && shareNum <= 144) {
      const formattedId = formatMemberId(shareNum);
      const memberObj = storageService.getMemberById(formattedId);
      const director = getDirectorForShareNumber(shareNum);

      const memberUser: User = {
        id: `usr-mbr-${shareNum}`,
        username: formattedId,
        name: memberObj ? memberObj.name : `Member ${formattedId}`,
        role: 'MEMBER',
        memberId: formattedId,
        shareNumber: shareNum,
        directorKey: director.key,
        phone: memberObj?.phone || '+8801700000000',
        email: memberObj?.email || `${formattedId.toLowerCase()}@prottasha.org`,
      };
      return this.trySetUser(memberUser, `Welcome Shareholder ${memberUser.name} (${formattedId})`);
    }

    return {
      success: false,
      message: 'Unrecognized user credentials. Try ssakil, sawdagor, manager1, or a Share ID like PHSM-007 (Password: 12345679)',
    };
  }

  private trySetUser(user: User, welcomeMessage: string): { success: boolean; message: string; user?: User } {
    try {
      this.setUser(user);
      return { success: true, message: welcomeMessage, user };
    } catch (err: any) {
      return { success: false, message: err.message || 'Login failed.' };
    }
  }

  public loginAsPersona(username: string): boolean {
    const activePass = storageService.getUserPassword(username);
    const result = this.login(username, activePass);
    return result.success;
  }

  private setUser(user: User) {
    // Prevent logging in if user or member account is locked
    const isLocked =
      storageService.isUserLocked(user.username) ||
      (user.memberId ? storageService.isUserLocked(user.memberId) : false) ||
      storageService.isUserLocked(user.id);

    if (isLocked) {
      throw new Error('ACCOUNT LOCKED: This account has been locked by administration. Please contact the System Admin or Delegated Admin to unlock your account.');
    }

    const requiresChange =
      storageService.isPasswordChangeRequired(user.username) ||
      (user.memberId ? storageService.isPasswordChangeRequired(user.memberId) : false);

    user.requiresPasswordChange = requiresChange;
    user.hasChangedDefaultPassword = !requiresChange;
    user.isLocked = false;

    this.currentUser = user;
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    storageService.logAudit(
      user,
      'LOGIN',
      'USER',
      user.id,
      `User ${user.name} logged in with role ${user.role}`
    );
    this.notify();
  }

  public completePasswordChange(newPassword: string): { success: boolean; message: string } {
    if (!this.currentUser) {
      return { success: false, message: 'No active user session.' };
    }
    try {
      const res = storageService.changeUserPassword(this.currentUser.username, newPassword, this.currentUser);
      this.currentUser.requiresPasswordChange = false;
      this.currentUser.hasChangedDefaultPassword = true;
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(this.currentUser));
      this.notify();
      return res;
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed to update password.' };
    }
  }

  public logout() {
    this.currentUser = null;
    localStorage.removeItem(AUTH_STORAGE_KEY);
    this.notify();
  }

  // --- Permission checks ---
  public canHardDelete(): boolean {
    return this.currentUser?.role === 'SYSTEM_ADMIN';
  }

  public canRecordEntry(): boolean {
    return storageService.isUserEmpoweredForEntry(this.currentUser);
  }

  public canApprove(): boolean {
    return (
      this.currentUser?.role === 'SYSTEM_ADMIN' ||
      this.currentUser?.role === 'DELEGATED_ADMIN'
    );
  }

  public canModerateChat(): boolean {
    return (
      this.currentUser?.role === 'SYSTEM_ADMIN' ||
      this.currentUser?.role === 'DELEGATED_ADMIN' ||
      this.currentUser?.role === 'MANAGER'
    );
  }

  public canManageEC(): boolean {
    return (
      this.currentUser?.role === 'SYSTEM_ADMIN' ||
      this.currentUser?.role === 'DELEGATED_ADMIN'
    );
  }

  public canExportBackup(): boolean {
    return (
      this.currentUser?.role === 'SYSTEM_ADMIN' ||
      this.currentUser?.role === 'DELEGATED_ADMIN' ||
      this.currentUser?.role === 'MANAGER'
    );
  }

  public isMemberIsolated(): boolean {
    return this.currentUser?.role === 'MEMBER';
  }
}

export const authService = new AuthService();
