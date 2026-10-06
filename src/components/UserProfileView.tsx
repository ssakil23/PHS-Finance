import React, { useState } from 'react';
import {
  User as UserIcon,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Clock,
  Edit3,
  Search,
  Building,
  Phone,
  Mail,
  MapPin,
  AlertCircle,
  Check,
  X,
  FileCheck,
  UserCog,
  Save,
  Layers,
  Sparkles,
  UserPlus,
  ShieldAlert,
  Power,
  Trash2,
  KeyRound,
  Lock,
  Download,
  Eye,
  GraduationCap,
  Calendar,
  CreditCard,
  Users,
  Heart,
  PhoneCall,
  ExternalLink,
  Globe,
  Database,
  HardDrive,
  Camera,
  CheckCircle2,
} from 'lucide-react';
import { User, Member, ProfileUpdateRequest, OfficialUser } from '../types';
import { storageService } from '../services/storageService';
import { authService } from '../services/authService';
import { PeriodicPasswordModal } from './PeriodicPasswordModal';
import { PassportPhotoModal } from './PassportPhotoModal';

interface UserProfileViewProps {
  currentUser: User | null;
  members: Member[];
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({ currentUser, members }) => {
  const [activeSubTab, setActiveSubTab] = useState<'MY_PROFILE' | 'APPROVAL_QUEUE' | 'DIRECTORY' | 'OFFICIALS'>('MY_PROFILE');
  const [requests, setRequests] = useState<ProfileUpdateRequest[]>(storageService.getProfileUpdateRequests());
  const [officials, setOfficials] = useState<OfficialUser[]>(storageService.getOfficials());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDirectorFilter, setSelectedDirectorFilter] = useState('ALL');

  // Dossier Card Modal State (Detailed View of 16 Member Attributes)
  const [selectedDossierMember, setSelectedDossierMember] = useState<Member | null>(null);

  // Password Reset State (System Admin & Delegated Admin)
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState<{
    id: string;
    name: string;
    identifier: string;
    role: string;
    isSakil: boolean;
  } | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState(storageService.getSystemDefaultPassword());
  const [resetFeedback, setResetFeedback] = useState<{ error?: string; success?: string }>({});

  // System Default Password State (Configured by System Admin)
  const [sysDefaultPass, setSysDefaultPass] = useState(storageService.getSystemDefaultPassword());
  const [showSysDefaultModal, setShowSysDefaultModal] = useState(false);
  const [newSysDefaultInput, setNewSysDefaultInput] = useState(storageService.getSystemDefaultPassword());
  const [showPeriodicPasswordModal, setShowPeriodicPasswordModal] = useState(false);
  const [periodicStatus, setPeriodicStatus] = useState(() => storageService.getPeriodicPasswordStatus());

  // User Lock / Unlock State (System Admin & Delegated Admin)
  const [lockModalOpen, setLockModalOpen] = useState(false);
  const [lockTarget, setLockTarget] = useState<{ id: string; name: string; identifier: string } | null>(null);
  const [lockReasonInput, setLockReasonInput] = useState('Account stuck / security verification hold');
  const [lockedUsersMap, setLockedUsersMap] = useState<Record<string, any>>(storageService.getLockedUsers());

  // Self Password Change State
  const [showSelfPasswordModal, setShowSelfPasswordModal] = useState(false);
  const [selfNewPass, setSelfNewPass] = useState('');
  const [selfConfirmPass, setSelfConfirmPass] = useState('');
  const [showSelfPass, setShowSelfPass] = useState(false);
  const [selfPassError, setSelfPassError] = useState('');
  const [selfPassSuccess, setSelfPassSuccess] = useState('');

  // Officials Management State
  const [showAddOfficialModal, setShowAddOfficialModal] = useState(false);
  const [offName, setOffName] = useState('');
  const [offUsername, setOffUsername] = useState('');
  const [offDesignation, setOffDesignation] = useState<OfficialUser['designation']>('Manager');
  const [offPhone, setOffPhone] = useState('+8801711');
  const [offEmail, setOffEmail] = useState('');
  const [offDept, setOffDept] = useState('Accounts & Finance');
  const [offEmpowered, setOffEmpowered] = useState(true);

  // Edit My Profile state
  const [isEditingMyProfile, setIsEditingMyProfile] = useState(false);
  const [editName, setEditName] = useState(currentUser?.name || '');
  const [editPhone, setEditPhone] = useState(currentUser?.phone || '');
  const [editEmail, setEditEmail] = useState(currentUser?.email || '');
  const [editAddress, setEditAddress] = useState('');
  const [editNid, setEditNid] = useState('');
  const [editDob, setEditDob] = useState('');
  const [editEducation, setEditEducation] = useState('');
  const [editPermAddress, setEditPermAddress] = useState('');
  const [editCurrAddress, setEditCurrAddress] = useState('');
  const [editSpouseName, setEditSpouseName] = useState('');
  const [editSpouseMobile, setEditSpouseMobile] = useState('');
  const [editEmergencyContact, setEditEmergencyContact] = useState('');

  // Admin Direct Edit Member Modal
  const [directEditMember, setDirectEditMember] = useState<Member | null>(null);
  const [adminName, setAdminName] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminAddress, setAdminAddress] = useState('');
  const [adminNid, setAdminNid] = useState('');
  const [adminDob, setAdminDob] = useState('');
  const [adminEducation, setAdminEducation] = useState('');
  const [adminPermAddress, setAdminPermAddress] = useState('');
  const [adminCurrAddress, setAdminCurrAddress] = useState('');
  const [adminSpouseName, setAdminSpouseName] = useState('');
  const [adminSpouseMobile, setAdminSpouseMobile] = useState('');
  const [adminEmergencyContact, setAdminEmergencyContact] = useState('');
  const [adminStatus, setAdminStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');

  // Modify & Approve Modal
  const [modifyingRequest, setModifyingRequest] = useState<ProfileUpdateRequest | null>(null);
  const [modName, setModName] = useState('');
  const [modPhone, setModPhone] = useState('');
  const [modEmail, setModEmail] = useState('');
  const [modAddress, setModAddress] = useState('');
  const [modNid, setModNid] = useState('');
  const [modDob, setModDob] = useState('');
  const [modEducation, setModEducation] = useState('');
  const [modPermAddress, setModPermAddress] = useState('');
  const [modCurrAddress, setModCurrAddress] = useState('');
  const [modSpouseName, setModSpouseName] = useState('');
  const [modSpouseMobile, setModSpouseMobile] = useState('');
  const [modEmergencyContact, setModEmergencyContact] = useState('');

  // 2x2 Passport Photo State
  const [showPassportModal, setShowPassportModal] = useState(false);
  const [passportTargetMember, setPassportTargetMember] = useState<Member | null>(null);
  const [passportTargetOfficial, setPassportTargetOfficial] = useState<string | undefined>(undefined);
  const [pendingPhotos, setPendingPhotos] = useState<Member[]>(() => storageService.getPendingPhotoAuthorizations());
  const [photoFilterTab, setPhotoFilterTab] = useState<'ALL' | 'WITH_PHOTO' | 'WITHOUT_PHOTO'>('ALL');

  // Photo Reject Modal State
  const [rejectingPhotoMember, setRejectingPhotoMember] = useState<Member | null>(null);
  const [photoRejectReasonInput, setPhotoRejectReasonInput] = useState('');

  // Notification banners
  const [successBanner, setSuccessBanner] = useState('');
  const [errorBanner, setErrorBanner] = useState('');

  const isOfficialOrAdmin = storageService.isOfficialOrAdmin(currentUser);
  const canApproveAndModify =
    currentUser?.role === 'SYSTEM_ADMIN' || currentUser?.role === 'DELEGATED_ADMIN' || isOfficialOrAdmin;

  // Sync with storage updates
  React.useEffect(() => {
    const unsubscribe = storageService.subscribe(() => {
      setRequests(storageService.getProfileUpdateRequests());
      setOfficials(storageService.getOfficials());
      setPendingPhotos(storageService.getPendingPhotoAuthorizations());
    });
    return () => unsubscribe();
  }, []);

  // Find member profile if currentUser is a member or has a linked memberId
  const myMemberId = currentUser?.memberId;
  const myMemberRecord = myMemberId ? (members.find((m) => m.id === myMemberId) || null) : null;

  // Photo Handlers
  const handleOpenPassportUploadForSelf = () => {
    setPassportTargetMember(myMemberRecord);
    setPassportTargetOfficial(currentUser?.role === 'MANAGER' ? currentUser.username : undefined);
    setShowPassportModal(true);
  };

  const handleOpenPassportUploadForMember = (target: Member) => {
    setPassportTargetMember(target);
    setShowPassportModal(true);
  };

  const handleAuthorizePhoto = (targetMemberId: string) => {
    if (!currentUser) return;
    try {
      storageService.authorizeMemberPhoto(targetMemberId, true, currentUser);
      setSuccessBanner(`2×2 Passport photo for ${targetMemberId} authorized and committed.`);
      setRequests(storageService.getProfileUpdateRequests());
      setPendingPhotos(storageService.getPendingPhotoAuthorizations());
      setTimeout(() => setSuccessBanner(''), 3000);
    } catch (err: any) {
      setErrorBanner(err.message || 'Failed to authorize photo.');
      setTimeout(() => setErrorBanner(''), 4000);
    }
  };

  const handleExecutePhotoReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !rejectingPhotoMember) return;
    try {
      storageService.authorizeMemberPhoto(
        rejectingPhotoMember.id,
        false,
        currentUser,
        photoRejectReasonInput.trim() || 'Photo does not meet 2×2 passport specifications'
      );
      setSuccessBanner(`2×2 Passport photo for ${rejectingPhotoMember.id} has been rejected.`);
      setRejectingPhotoMember(null);
      setPhotoRejectReasonInput('');
      setRequests(storageService.getProfileUpdateRequests());
      setPendingPhotos(storageService.getPendingPhotoAuthorizations());
      setTimeout(() => setSuccessBanner(''), 3000);
    } catch (err: any) {
      setErrorBanner(err.message || 'Failed to reject photo.');
      setTimeout(() => setErrorBanner(''), 4000);
    }
  };

  // Initialize edit fields
  const handleOpenMyProfileEdit = () => {
    setEditName(currentUser?.name || myMemberRecord?.name || '');
    setEditPhone(currentUser?.phone || myMemberRecord?.phone || '');
    setEditEmail(currentUser?.email || myMemberRecord?.email || '');
    setEditAddress(myMemberRecord?.currentAddress || myMemberRecord?.address || 'Plot #, Sector 14, Uttara, Dhaka');
    setEditCurrAddress(myMemberRecord?.currentAddress || myMemberRecord?.address || 'Plot #, Sector 14, Uttara, Dhaka');
    setEditPermAddress(myMemberRecord?.permanentAddress || '');
    setEditNid(myMemberRecord?.nidOrBirthId || '');
    setEditDob(myMemberRecord?.dob || '');
    setEditEducation(myMemberRecord?.education || '');
    setEditSpouseName(myMemberRecord?.spouseName || '');
    setEditSpouseMobile(myMemberRecord?.spouseMobile || '');
    setEditEmergencyContact(myMemberRecord?.emergencyContact || '');
    setIsEditingMyProfile(true);
  };

  const handleSaveMyProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setErrorBanner('');
    setSuccessBanner('');

    if (canApproveAndModify) {
      // System Admin / Delegated Admin can modify directly
      if (myMemberRecord) {
        storageService.directModifyMember(
          myMemberRecord.id,
          {
            name: editName,
            phone: editPhone,
            email: editEmail,
            address: editCurrAddress || editAddress,
            currentAddress: editCurrAddress || editAddress,
            permanentAddress: editPermAddress,
            nidOrBirthId: editNid,
            dob: editDob,
            education: editEducation,
            spouseName: editSpouseName,
            spouseMobile: editSpouseMobile,
            emergencyContact: editEmergencyContact,
          },
          currentUser
        );
      }
      setSuccessBanner('Profile changes updated and committed to central society registry.');
      setIsEditingMyProfile(false);
      setTimeout(() => setSuccessBanner(''), 4000);
    } else {
      // Normal Member or Manager: submit for Admin Review & Approval
      const targetId = myMemberId || 'PHSM-001';
      storageService.submitProfileUpdateRequest(
        targetId,
        {
          name: editName,
          phone: editPhone,
          email: editEmail,
          address: editCurrAddress || editAddress,
          currentAddress: editCurrAddress || editAddress,
          permanentAddress: editPermAddress,
          nidOrBirthId: editNid,
          dob: editDob,
          education: editEducation,
          spouseName: editSpouseName,
          spouseMobile: editSpouseMobile,
          emergencyContact: editEmergencyContact,
        },
        currentUser
      );
      setRequests(storageService.getProfileUpdateRequests());
      setSuccessBanner('Your profile update request has been submitted for System Admin & Delegated Admin approval.');
      setIsEditingMyProfile(false);
      setTimeout(() => setSuccessBanner(''), 4000);
    }
  };

  // Admin Direct Edit Handler
  const handleOpenDirectEdit = (member: Member) => {
    setDirectEditMember(member);
    setAdminName(member.name || '');
    setAdminPhone(member.phone || '');
    setAdminEmail(member.email || '');
    setAdminAddress(member.currentAddress || member.address || '');
    setAdminCurrAddress(member.currentAddress || member.address || '');
    setAdminPermAddress(member.permanentAddress || '');
    setAdminNid(member.nidOrBirthId || '');
    setAdminDob(member.dob || '');
    setAdminEducation(member.education || '');
    setAdminSpouseName(member.spouseName || '');
    setAdminSpouseMobile(member.spouseMobile || '');
    setAdminEmergencyContact(member.emergencyContact || '');
    setAdminStatus(member.status || 'ACTIVE');
  };

  const handleSaveDirectEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !directEditMember) return;

    storageService.directModifyMember(
      directEditMember.id,
      {
        name: adminName,
        phone: adminPhone,
        email: adminEmail,
        address: adminCurrAddress || adminAddress,
        currentAddress: adminCurrAddress || adminAddress,
        permanentAddress: adminPermAddress,
        nidOrBirthId: adminNid,
        dob: adminDob,
        education: adminEducation,
        spouseName: adminSpouseName,
        spouseMobile: adminSpouseMobile,
        emergencyContact: adminEmergencyContact,
        status: adminStatus,
      },
      currentUser
    );

    setDirectEditMember(null);
    setSuccessBanner(`Successfully updated profile details for Member ${directEditMember.id} (${adminName}).`);
    setTimeout(() => setSuccessBanner(''), 4000);
  };

  // Open Modify & Approve Modal
  const handleOpenModifyAndApprove = (req: ProfileUpdateRequest) => {
    setModifyingRequest(req);
    setModName(req.proposedName || '');
    setModPhone(req.proposedPhone || '');
    setModEmail(req.proposedEmail || '');
    setModAddress(req.proposedAddress || '');
    setModCurrAddress(req.proposedCurrentAddress || req.proposedAddress || '');
    setModPermAddress(req.proposedPermanentAddress || '');
    setModNid(req.proposedNidOrBirthId || '');
    setModDob(req.proposedDob || '');
    setModEducation(req.proposedEducation || '');
    setModSpouseName(req.proposedSpouseName || '');
    setModSpouseMobile(req.proposedSpouseMobile || '');
    setModEmergencyContact(req.proposedEmergencyContact || '');
  };

  const handleCommitApprovalWithModifications = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !modifyingRequest) return;

    storageService.approveProfileUpdateRequest(
      modifyingRequest.id,
      currentUser,
      {
        name: modName,
        phone: modPhone,
        email: modEmail,
        address: modCurrAddress || modAddress,
        currentAddress: modCurrAddress || modAddress,
        permanentAddress: modPermAddress,
        nidOrBirthId: modNid,
        dob: modDob,
        education: modEducation,
        spouseName: modSpouseName,
        spouseMobile: modSpouseMobile,
        emergencyContact: modEmergencyContact,
      }
    );

    setRequests(storageService.getProfileUpdateRequests());
    setModifyingRequest(null);
    setSuccessBanner(`Approved and applied profile changes for Member ${modifyingRequest.memberId}.`);
    setTimeout(() => setSuccessBanner(''), 4000);
  };

  // Export Member Directory CSV (All 16 columns)
  const handleExportDirectoryCSV = () => {
    const headers = [
      'Member Id',
      'Share#',
      'Full Name',
      'Controlling Director',
      'Phone',
      'Email',
      'NID/Birth ID',
      'DoB',
      'Education',
      'Permanent Address',
      'Current Address',
      'Spouse Name',
      'Spouse Mobile',
      'Emergency Contact',
      'Status',
    ];
    const rows = filteredMembers.map((m) => [
      `"${m.id}"`,
      `"${m.shareNumber}"`,
      `"${(m.name || '').replace(/"/g, '""')}"`,
      `"${(m.controllingDirectorName || '').replace(/"/g, '""')}"`,
      `"${m.phone || ''}"`,
      `"${m.email || ''}"`,
      `"${m.nidOrBirthId || ''}"`,
      `"${m.dob || ''}"`,
      `"${(m.education || '').replace(/"/g, '""')}"`,
      `"${(m.permanentAddress || '').replace(/"/g, '""')}"`,
      `"${(m.currentAddress || m.address || '').replace(/"/g, '""')}"`,
      `"${(m.spouseName || '').replace(/"/g, '""')}"`,
      `"${m.spouseMobile || ''}"`,
      `"${(m.emergencyContact || '').replace(/"/g, '""')}"`,
      `"${m.status}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `PHS_Member_Directory_144_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleQuickApprove = (reqId: string) => {
    if (!currentUser) return;
    storageService.approveProfileUpdateRequest(reqId, currentUser);
    setRequests(storageService.getProfileUpdateRequests());
    setSuccessBanner('Profile change approved and committed.');
    setTimeout(() => setSuccessBanner(''), 3000);
  };

  const handleReject = (reqId: string) => {
    if (!currentUser) return;
    let reason = 'Information verification failed';
    try {
      const input = window.prompt('Enter reason for rejecting profile change:');
      if (input !== null && input.trim()) {
        reason = input.trim();
      } else if (input === null) {
        return; // User clicked Cancel
      }
    } catch {
      // Sandbox fallback
    }
    storageService.rejectProfileUpdateRequest(reqId, reason, currentUser);
    setRequests(storageService.getProfileUpdateRequests());
    setSuccessBanner('Profile update request rejected.');
    setTimeout(() => setSuccessBanner(''), 3000);
  };

  const handleCreateOfficial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    try {
      storageService.createOfficial(
        {
          name: offName,
          username: offUsername,
          designation: offDesignation,
          phone: offPhone,
          email: offEmail,
          department: offDept,
          isEmpoweredForEntry: offEmpowered,
          status: 'ACTIVE',
        },
        currentUser
      );

      setOfficials(storageService.getOfficials());
      setShowAddOfficialModal(false);
      setOffName('');
      setOffUsername('');
      setOffEmail('');
      setSuccessBanner(`System Official "${offName}" (${offDesignation}) created successfully! Entry Empowerment: ${offEmpowered ? 'YES (Empowered)' : 'NO'}`);
      setTimeout(() => setSuccessBanner(''), 4000);
    } catch (err: any) {
      setErrorBanner(err.message);
      setTimeout(() => setErrorBanner(''), 4000);
    }
  };

  const handleToggleOfficialEmpowerment = (officialId: string, currentEmpowered: boolean) => {
    if (!currentUser) return;
    try {
      storageService.toggleOfficialEmpowerment(officialId, !currentEmpowered, currentUser);
      setOfficials(storageService.getOfficials());
      setSuccessBanner(`Updated entry empowerment status for official.`);
      setTimeout(() => setSuccessBanner(''), 3000);
    } catch (err: any) {
      setErrorBanner(err.message);
      setTimeout(() => setErrorBanner(''), 3000);
    }
  };

  const handleDeleteOfficial = (officialId: string) => {
    if (!currentUser) return;
    if (window.confirm('Are you sure you want to permanently purge this official user account?')) {
      try {
        storageService.deleteOfficial(officialId, currentUser);
        setOfficials(storageService.getOfficials());
        setSuccessBanner('Official account removed from system.');
        setTimeout(() => setSuccessBanner(''), 3000);
      } catch (err: any) {
        setErrorBanner(err.message);
        setTimeout(() => setErrorBanner(''), 3000);
      }
    }
  };

  // Password Reset Handlers (System Admin & Delegated Admin)
  const handleOpenResetPassword = (
    id: string,
    name: string,
    identifier: string,
    role: string
  ) => {
    if (!currentUser) return;

    const lowerTarget = identifier.toLowerCase().trim();
    const isSakil =
      lowerTarget === 'ssakil' ||
      lowerTarget === 'saif ahmed sakil' ||
      lowerTarget === 'phsm-001' ||
      name.toLowerCase().includes('sakil');

    if (currentUser.role === 'DELEGATED_ADMIN' && isSakil) {
      alert(
        'Access Denied: Delegated Admin is strictly excluded from resetting password for Root System Admin Saif Ahmed Sakil.'
      );
      return;
    }

    setResetTarget({ id, name, identifier, role, isSakil });
    const sysDefault = storageService.getSystemDefaultPassword();
    setNewPasswordInput(sysDefault);
    setResetFeedback({});
    setResetModalOpen(true);
  };

  const handleExecutePasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !resetTarget) return;

    try {
      const res = storageService.resetUserPassword(
        resetTarget.identifier,
        newPasswordInput,
        currentUser
      );
      setResetFeedback({ success: res.message });
      setSuccessBanner(res.message);
      setTimeout(() => {
        setResetModalOpen(false);
        setResetTarget(null);
        setResetFeedback({});
      }, 1600);
    } catch (err: any) {
      setResetFeedback({ error: err.message });
    }
  };

  // Configure System Default Password Handler (System Admin only)
  const handleUpdateSystemDefaultPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || currentUser.role !== 'SYSTEM_ADMIN') return;
    try {
      const res = storageService.setSystemDefaultPassword(newSysDefaultInput, currentUser);
      setSysDefaultPass(newSysDefaultInput.trim());
      setSuccessBanner(res.message);
      setShowSysDefaultModal(false);
      setTimeout(() => setSuccessBanner(''), 4000);
    } catch (err: any) {
      setErrorBanner(err.message || 'Failed to update system default password.');
      setTimeout(() => setErrorBanner(''), 4000);
    }
  };

  // User Locking & Unlocking Handlers (System Admin & Delegated Admin)
  const handleOpenLockUser = (id: string, name: string, identifier: string) => {
    if (!currentUser) return;
    const lower = identifier.toLowerCase().trim();
    const isSakil =
      lower === 'ssakil' ||
      lower === 'saif ahmed sakil' ||
      lower === 'phsm-001' ||
      lower === 'usr-admin-root' ||
      name.toLowerCase().includes('sakil');

    if (currentUser.role === 'DELEGATED_ADMIN' && isSakil) {
      alert('Access Denied: Delegated Admin cannot lock Root System Admin Saif Ahmed Sakil.');
      return;
    }
    setLockTarget({ id, name, identifier });
    setLockReasonInput('Account stuck / security hold - locked by administration');
    setLockModalOpen(true);
  };

  const handleConfirmLockUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !lockTarget) return;
    try {
      const res = storageService.lockUser(lockTarget.identifier, lockReasonInput, currentUser);
      setLockedUsersMap(storageService.getLockedUsers());
      setSuccessBanner(res.message);
      setLockModalOpen(false);
      setLockTarget(null);
      setTimeout(() => setSuccessBanner(''), 4000);
    } catch (err: any) {
      setErrorBanner(err.message);
      setTimeout(() => setErrorBanner(''), 4000);
    }
  };

  const handleUnlockUser = (identifier: string, name: string) => {
    if (!currentUser) return;
    try {
      const res = storageService.unlockUser(identifier, currentUser);
      setLockedUsersMap(storageService.getLockedUsers());
      setSuccessBanner(res.message);
      setTimeout(() => setSuccessBanner(''), 4000);
    } catch (err: any) {
      setErrorBanner(err.message);
      setTimeout(() => setErrorBanner(''), 4000);
    }
  };

  const handleExecuteSelfPasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    setSelfPassError('');
    setSelfPassSuccess('');

    if (!currentUser) return;

    if (selfNewPass.trim().length < 6) {
      setSelfPassError('New password must be at least 6 characters long.');
      return;
    }

    const sysDefault = storageService.getSystemDefaultPassword();
    if (selfNewPass.trim() === sysDefault || selfNewPass.trim() === '12345679') {
      setSelfPassError(`For security, your new password cannot be the system default password (${sysDefault}).`);
      return;
    }

    if (selfNewPass !== selfConfirmPass) {
      setSelfPassError('Confirmation password does not match.');
      return;
    }

    try {
      const res = storageService.changeUserPassword(currentUser.username, selfNewPass.trim(), currentUser);
      setSelfPassSuccess(res.message);
      setSuccessBanner(res.message);
      setTimeout(() => {
        setShowSelfPasswordModal(false);
        setSelfNewPass('');
        setSelfConfirmPass('');
        setSelfPassSuccess('');
      }, 1500);
    } catch (err: any) {
      setSelfPassError(err.message || 'Failed to update password.');
    }
  };

  const handleExportDomainMigrationBackup = () => {
    if (!currentUser) return;
    try {
      const jsonStr = storageService.createDatabaseBackupJSON(currentUser);
      const hostName = typeof window !== 'undefined' ? window.location.hostname : 'domain';
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `PHS_Finance_DOMAIN_MIGRATION_MASTER_BACKUP_${hostName}_${timestamp}.json`;

      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setSuccessBanner('Complete Domain & Hosting Migration Master Backup generated successfully! (Zero data loss guarantee)');
      setTimeout(() => setSuccessBanner(''), 5000);
    } catch (err: any) {
      setErrorBanner(`Backup export failed: ${err.message}`);
    }
  };

  const pendingRequests = requests.filter((r) => r.status === 'PENDING');

  // Filter members list for directory across all 16 fields
  const filteredMembers = members.filter((m) => {
    if (selectedDirectorFilter !== 'ALL' && m.controllingDirectorName !== selectedDirectorFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (m.name || '').toLowerCase().includes(q);
      const matchId = (m.id || '').toLowerCase().includes(q);
      const matchShare = String(m.shareNumber || '').includes(q);
      const matchPhone = (m.phone || '').toLowerCase().includes(q);
      const matchEmail = (m.email || '').toLowerCase().includes(q);
      const matchNid = (m.nidOrBirthId || '').toLowerCase().includes(q);
      const matchDob = (m.dob || '').toLowerCase().includes(q);
      const matchEdu = (m.education || '').toLowerCase().includes(q);
      const matchPerm = (m.permanentAddress || '').toLowerCase().includes(q);
      const matchCurr = (m.currentAddress || m.address || '').toLowerCase().includes(q);
      const matchSpouse = (m.spouseName || '').toLowerCase().includes(q);
      const matchSpouseMob = (m.spouseMobile || '').toLowerCase().includes(q);
      const matchEmerg = (m.emergencyContact || '').toLowerCase().includes(q);
      const matchDirector = (m.controllingDirectorName || '').toLowerCase().includes(q);
      const matchStatus = (m.status || '').toLowerCase().includes(q);
      return (
        matchName ||
        matchId ||
        matchShare ||
        matchPhone ||
        matchEmail ||
        matchNid ||
        matchDob ||
        matchEdu ||
        matchPerm ||
        matchCurr ||
        matchSpouse ||
        matchSpouseMob ||
        matchEmerg ||
        matchDirector ||
        matchStatus
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60">
                User Profile Management & Approval Workflow
              </span>
              {canApproveAndModify && (
                <span className="text-xs text-blue-400 font-medium bg-blue-950/80 px-2 py-0.5 rounded border border-blue-800/60">
                  Admin Edit & Approval Authority
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <UserCog className="w-5 h-5 text-emerald-400" />
              <span>User Profiles & Member Registry</span>
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Manage personal credentials, request updates, view 144 Member Directory, and allow System Admin & Delegated Admin to Edit, Modify & Approve changes.
            </p>
          </div>

          {/* Sub Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveSubTab('MY_PROFILE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeSubTab === 'MY_PROFILE'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              My Profile
            </button>

            {canApproveAndModify && (
              <button
                onClick={() => setActiveSubTab('APPROVAL_QUEUE')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                  activeSubTab === 'APPROVAL_QUEUE'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>Approval Queue</span>
                {pendingRequests.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-400 text-slate-950 font-bold">
                    {pendingRequests.length}
                  </span>
                )}
              </button>
            )}

            <button
              onClick={() => setActiveSubTab('DIRECTORY')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                activeSubTab === 'DIRECTORY'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Member Directory</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-900 text-emerald-400 border border-slate-700 font-mono font-bold">
                144
              </span>
            </button>

            {canApproveAndModify && (
              <button
                onClick={() => setActiveSubTab('OFFICIALS')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                  activeSubTab === 'OFFICIALS'
                    ? 'bg-purple-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                <span>System Officials & Passwords</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {successBanner && (
        <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{successBanner}</span>
        </div>
      )}

      {errorBanner && (
        <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorBanner}</span>
        </div>
      )}

      {/* System Admin Periodic Initial Password Security Banner */}
      {currentUser?.role === 'SYSTEM_ADMIN' && (
        <div className="bg-gradient-to-r from-amber-950/70 via-slate-900 to-amber-950/70 border border-amber-600/50 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 mt-0.5 sm:mt-0">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-white">Periodic Initial Password Policy:</span>
                <span className="font-mono text-xs font-bold text-amber-300 bg-amber-950/90 px-2 py-0.5 rounded border border-amber-700/80">
                  {sysDefaultPass}
                </span>
                <span className="text-[10px] text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
                  Cycle: {periodicStatus.frequencyLabel}
                </span>
                {periodicStatus.isOverdue ? (
                  <span className="text-[10px] font-bold text-rose-300 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-700 flex items-center gap-1 animate-pulse">
                    <AlertCircle className="w-3 h-3 text-rose-400" />
                    OVERDUE ({periodicStatus.daysOverdue} days past due)
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-700/60">
                    Next due in {periodicStatus.daysRemaining} days ({new Date(periodicStatus.nextDueDate).toLocaleDateString('en-GB')})
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Root System Admin can rotate the initial password periodically across all 144 member shares and official accounts with forced password change on next login.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowPeriodicPasswordModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs shadow-lg flex items-center gap-2 transition self-start md:self-auto shrink-0"
          >
            <KeyRound className="w-4 h-4" />
            <span>Set Initial Password Periodically</span>
          </button>
        </div>
      )}

      {/* System Admin Domain & Hosting Migration Authority Banner */}
      {currentUser?.role === 'SYSTEM_ADMIN' && (
        <div className="bg-gradient-to-r from-emerald-950/70 via-slate-900 to-emerald-950/70 border border-emerald-600/50 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5 sm:mt-0">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-white">Domain & Hosting Migration Authority:</span>
                <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/90 px-2 py-0.5 rounded border border-emerald-700/80">
                  Zero Data Loss Engine
                </span>
                <span className="text-[10px] text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
                  144 Share Records + Credentials
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                System Admin has the right to take a complete system backup to change domain & hosting from one place to another without losing any data.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start md:self-auto">
            <button
              onClick={handleExportDomainMigrationBackup}
              className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg flex items-center gap-2 transition"
            >
              <Download className="w-4 h-4" />
              <span>Export Complete System Backup (.json)</span>
            </button>
          </div>
        </div>
      )}

      {/* -------------------- TAB 1: MY PROFILE -------------------- */}
      {activeSubTab === 'MY_PROFILE' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            {/* Profile Card Header with 2x2 Passport Photo */}
            <div className="flex flex-col sm:flex-row items-center gap-4 pb-4 border-b border-slate-800">
              <div className="relative group shrink-0">
                {/* 2x2 Square Aspect Ratio Frame (1:1 standard) */}
                <div className="w-28 h-28 rounded-xl overflow-hidden border-2 border-slate-600 bg-white shadow-xl relative select-none">
                  {(myMemberRecord?.photoUrl || currentUser?.photoUrl) ? (
                    <img
                      src={myMemberRecord?.photoUrl || currentUser?.photoUrl}
                      alt={currentUser?.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 p-2 text-center text-slate-400">
                      <Camera className="w-8 h-8 text-slate-600 mb-1" />
                      <span className="text-[10px] font-semibold text-slate-400">2" × 2" Passport</span>
                      <span className="text-[9px] text-slate-500">No Photo</span>
                    </div>
                  )}

                  {/* 2"x2" Spec Label */}
                  <div className="absolute top-1 left-1 bg-slate-950/80 px-1 py-0.2 rounded text-[8px] font-mono text-emerald-400 border border-emerald-500/30">
                    2"×2"
                  </div>
                </div>

                {/* Edit Photo Quick Button overlay */}
                <button
                  type="button"
                  onClick={handleOpenPassportUploadForSelf}
                  title="Upload / Change 2x2 Passport Photo"
                  className="absolute -bottom-1 -right-1 p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full shadow-lg border-2 border-slate-900 transition hover:scale-105"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="text-center sm:text-left flex-1 min-w-0">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
                  <h3 className="text-base font-bold text-white truncate">{currentUser?.name}</h3>
                </div>
                <div className="text-xs text-emerald-400 font-mono mt-0.5">
                  Role: {currentUser?.role}
                </div>
                {currentUser?.ecDesignation && currentUser.ecDesignation !== 'None' && (
                  <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    {currentUser.ecDesignation} (EC)
                  </span>
                )}

                {/* 2x2 Photo Status Pill */}
                <div className="mt-2 flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
                  {(myMemberRecord?.photoStatus || currentUser?.photoStatus) === 'AUTHORIZED' ? (
                    <span
                      title={
                        myMemberRecord?.photoAuthorizedByName
                          ? `Authorized by ${myMemberRecord.photoAuthorizedByName} on ${
                              myMemberRecord.photoAuthorizedAt
                                ? new Date(myMemberRecord.photoAuthorizedAt).toLocaleDateString()
                                : ''
                            }`
                          : '2x2 Photo officially authorized'
                      }
                      className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800"
                    >
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>2×2 Photo Authorized</span>
                    </span>
                  ) : (myMemberRecord?.photoStatus || currentUser?.photoStatus) === 'PENDING_AUTHORIZATION' ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-800">
                      <Clock className="w-3 h-3 text-amber-400 animate-pulse" />
                      <span>Pending Official Authorization</span>
                    </span>
                  ) : (myMemberRecord?.photoStatus || currentUser?.photoStatus) === 'REJECTED' ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-300 bg-rose-950/80 px-2 py-0.5 rounded-full border border-rose-800">
                      <XCircle className="w-3 h-3 text-rose-400" />
                      <span>Photo Rejected</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-700">
                      <span>No 2×2 Photo Uploaded</span>
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={handleOpenPassportUploadForSelf}
                    className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 underline ml-1"
                  >
                    {(myMemberRecord?.photoUrl || currentUser?.photoUrl) ? 'Change Photo' : 'Upload Photo'}
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Username:</span>
                <span className="font-mono text-slate-200">{currentUser?.username}</span>
              </div>

              {currentUser?.memberId && (
                <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">Member ID:</span>
                  <span className="font-mono font-bold text-emerald-400">{currentUser.memberId}</span>
                </div>
              )}

              {currentUser?.shareNumber && (
                <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">Share#:</span>
                  <span className="font-mono text-slate-200">Share #{currentUser.shareNumber} of 144</span>
                </div>
              )}

              {myMemberRecord?.controllingDirectorName && (
                <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">Controlling Director:</span>
                  <span className="font-medium text-emerald-400">{myMemberRecord.controllingDirectorName}</span>
                </div>
              )}

              {currentUser?.monthlyHonorariumBDT !== undefined && currentUser.monthlyHonorariumBDT > 0 && (
                <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">Monthly Honorarium:</span>
                  <span className="font-mono font-bold text-emerald-400">৳ {currentUser.monthlyHonorariumBDT.toLocaleString()}</span>
                </div>
              )}

              <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Phone:</span>
                <span className="font-mono text-slate-200">{currentUser?.phone || myMemberRecord?.phone || 'N/A'}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Email:</span>
                <span className="font-mono text-slate-200">{currentUser?.email || myMemberRecord?.email || 'N/A'}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                <span className="text-slate-400">NID / Birth ID:</span>
                <span className="font-mono text-slate-200">{myMemberRecord?.nidOrBirthId || 'N/A'}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Date of Birth (DoB):</span>
                <span className="font-mono text-slate-200">{myMemberRecord?.dob || 'N/A'}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Education:</span>
                <span className="text-slate-200 text-right max-w-[60%] truncate" title={myMemberRecord?.education}>{myMemberRecord?.education || 'N/A'}</span>
              </div>

              <div className="flex justify-between items-start py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Permanent Address:</span>
                <span className="text-slate-300 text-right max-w-[60%]">
                  {myMemberRecord?.permanentAddress || 'N/A'}
                </span>
              </div>

              <div className="flex justify-between items-start py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Current Address:</span>
                <span className="text-slate-300 text-right max-w-[60%]">
                  {myMemberRecord?.currentAddress || myMemberRecord?.address || 'Sector 14, Uttara Model Town, Dhaka'}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Spouse Name:</span>
                <span className="text-slate-200">{myMemberRecord?.spouseName || 'N/A'}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Spouse Mobile:</span>
                <span className="font-mono text-slate-200">{myMemberRecord?.spouseMobile || 'N/A'}</span>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400">Emergency Contact:</span>
                <span className="font-mono text-amber-300 text-right max-w-[60%] truncate" title={myMemberRecord?.emergencyContact}>{myMemberRecord?.emergencyContact || 'N/A'}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 space-y-2">
              <button
                type="button"
                onClick={handleOpenPassportUploadForSelf}
                className="w-full py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>
                  {(myMemberRecord?.photoUrl || currentUser?.photoUrl)
                    ? 'Update / Change 2×2 Passport Photo'
                    : 'Upload 2×2 Passport Photo'}
                </span>
              </button>

              <button
                onClick={handleOpenMyProfileEdit}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700/80 text-white rounded-xl text-xs font-semibold border border-slate-700 transition flex items-center justify-center gap-1.5 shadow"
              >
                <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{canApproveAndModify ? 'Edit My Details (Admin Direct)' : 'Request Profile Update'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelfNewPass('');
                  setSelfConfirmPass('');
                  setSelfPassError('');
                  setSelfPassSuccess('');
                  setShowSelfPasswordModal(true);
                }}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700/80 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5"
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span>Change My Password</span>
              </button>
            </div>
          </div>

          {/* Edit Form or Pending Request Status */}
          <div className="lg:col-span-2 space-y-4">
            {/* Show pending photo authorization banner if photo is awaiting approval */}
            {myMemberRecord?.pendingPhotoUrl && (
              <div className="bg-amber-950/40 border border-amber-800/80 rounded-2xl p-5 text-xs text-amber-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-amber-300">
                    <Clock className="w-4 h-4" />
                    <span>2×2 Passport Photo Under Official Authorization</span>
                  </div>
                  <span className="text-[10px] font-mono bg-amber-900/60 text-amber-300 px-2 py-0.5 rounded">
                    Awaiting Official Review
                  </span>
                </div>
                <p className="text-[11px] text-amber-300/80 leading-relaxed">
                  You submitted a new 2×2 passport photo. Society Officials or the System Administrator will inspect the 1:1 framing, neutral background, and facial clarity before authorizing it for the permanent society ledger.
                </p>
                <div className="flex items-center gap-4 bg-slate-950/60 p-3 rounded-xl border border-amber-900/50">
                  <div className="w-20 h-20 rounded-lg overflow-hidden border-2 border-amber-500/70 bg-white shrink-0">
                    <img
                      src={myMemberRecord.pendingPhotoUrl}
                      alt="Pending passport photo"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="space-y-1 text-[11px]">
                    <div className="text-slate-300 font-semibold">Submitted 2×2 Photo (Pending)</div>
                    <div className="text-slate-400">
                      Specification: 1:1 Square Passport Format (2"×2")
                    </div>
                    {myMemberRecord.pendingPhotoRequestedAt && (
                      <div className="text-slate-500 text-[10px]">
                        Submitted on: {new Date(myMemberRecord.pendingPhotoRequestedAt).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Show pending update notice if user has requested changes */}
            {myMemberRecord?.pendingUpdate && (
              <div className="bg-amber-950/40 border border-amber-800/80 rounded-2xl p-5 text-xs text-amber-200 space-y-3">
                <div className="flex items-center gap-2 font-bold text-amber-300">
                  <Clock className="w-4 h-4" />
                  <span>Pending Profile Change Request Under Review</span>
                </div>
                <p className="text-[11px] text-amber-300/80 leading-relaxed">
                  You submitted changes to your profile. The System Admin or Delegated Admin can edit, modify, and approve these changes before committing them to the official society ledger.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-950/60 p-3 rounded-xl border border-amber-900/50 text-[11px]">
                  <div>
                    <span className="text-slate-400">Proposed Name:</span>
                    <div className="font-semibold text-white">{myMemberRecord.pendingUpdate.name}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Proposed Phone:</span>
                    <div className="font-semibold text-white">{myMemberRecord.pendingUpdate.phone}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Proposed Email:</span>
                    <div className="font-semibold text-white">{myMemberRecord.pendingUpdate.email}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Proposed NID/Birth ID:</span>
                    <div className="font-semibold text-white">{myMemberRecord.pendingUpdate.nidOrBirthId || 'N/A'}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Proposed DoB:</span>
                    <div className="font-semibold text-white">{myMemberRecord.pendingUpdate.dob || 'N/A'}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Proposed Education:</span>
                    <div className="font-semibold text-white">{myMemberRecord.pendingUpdate.education || 'N/A'}</div>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-400">Proposed Current Address:</span>
                    <div className="font-semibold text-white">{myMemberRecord.pendingUpdate.currentAddress || myMemberRecord.pendingUpdate.address}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Proposed Permanent Address:</span>
                    <div className="font-semibold text-white">{myMemberRecord.pendingUpdate.permanentAddress || 'N/A'}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Proposed Spouse:</span>
                    <div className="font-semibold text-white">{myMemberRecord.pendingUpdate.spouseName || 'N/A'} ({myMemberRecord.pendingUpdate.spouseMobile || 'N/A'})</div>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-400">Proposed Emergency Contact:</span>
                    <div className="font-semibold text-white">{myMemberRecord.pendingUpdate.emergencyContact || 'N/A'}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Profile Edit Form */}
            {isEditingMyProfile ? (
              <form onSubmit={handleSaveMyProfile} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-emerald-400" />
                    <span>{canApproveAndModify ? 'Direct Profile Modification (Admin Privilege)' : 'Propose Profile Information Update'}</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => setIsEditingMyProfile(false)}
                    className="text-slate-400 hover:text-white text-xs"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Full Legal Name</label>
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Mobile Contact Number</label>
                    <input
                      type="text"
                      required
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">NID / Birth Registration ID</label>
                    <input
                      type="text"
                      value={editNid}
                      onChange={(e) => setEditNid(e.target.value)}
                      placeholder="e.g. 19852692500000001"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Date of Birth (DoB)</label>
                    <input
                      type="date"
                      value={editDob}
                      onChange={(e) => setEditDob(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Educational Qualification</label>
                    <input
                      type="text"
                      value={editEducation}
                      onChange={(e) => setEditEducation(e.target.value)}
                      placeholder="e.g. B.Sc. in Civil Engineering (BUET)"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Permanent Address</label>
                    <input
                      type="text"
                      value={editPermAddress}
                      onChange={(e) => setEditPermAddress(e.target.value)}
                      placeholder="Village, PO, Upazila/Dist"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Current Address (Plot / Residence)</label>
                    <input
                      type="text"
                      required
                      value={editCurrAddress}
                      onChange={(e) => setEditCurrAddress(e.target.value)}
                      placeholder="House, Road, Sector, Uttara, Dhaka"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Spouse Full Name</label>
                    <input
                      type="text"
                      value={editSpouseName}
                      onChange={(e) => setEditSpouseName(e.target.value)}
                      placeholder="Spouse Name"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Spouse Mobile</label>
                    <input
                      type="text"
                      value={editSpouseMobile}
                      onChange={(e) => setEditSpouseMobile(e.target.value)}
                      placeholder="+88017..."
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Emergency Contact (Phone & Relationship)</label>
                  <input
                    type="text"
                    value={editEmergencyContact}
                    onChange={(e) => setEditEmergencyContact(e.target.value)}
                    placeholder="+88018... (Brother / Relative)"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400">
                  {canApproveAndModify ? (
                    <span className="text-emerald-400">
                      As a System Admin or Delegated Admin, changes will be applied and logged directly to the central registry.
                    </span>
                  ) : (
                    <span>
                      Notice: To protect society integrity, profile edits are routed to the Executive Committee for approval before taking effect.
                    </span>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsEditingMyProfile(false)}
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{canApproveAndModify ? 'Save & Commit Profile' : 'Submit for Admin Approval'}</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Prottasha Housing Society Security & Governance Privileges</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Your account is secured under Role-Based Access Control (RBAC). Only authenticated shareholders and authorized administrative personnel can access the financial statements and cast official ballots.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                    <span className="font-semibold text-emerald-400">Account Authorization</span>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Identity verified against Society Member Registration ID.
                    </p>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                    <span className="font-semibold text-blue-400">Data Isolation Protection</span>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Financial deposits and share statements are strictly protected.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* -------------------- TAB 2: APPROVAL & AUTHORIZATION QUEUE (Officials & Admin) -------------------- */}
      {activeSubTab === 'APPROVAL_QUEUE' && canApproveAndModify && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl space-y-6 p-6">
          {/* Section A: 2×2 Passport Photo Authorization Queue */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>2×2 Passport Photo Authorization Queue</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono font-bold">
                      {pendingPhotos.length} Pending
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Official & Admin Authorization authority for shareholder 2×2 passport photos.
                  </p>
                </div>
              </div>
            </div>

            {pendingPhotos.length === 0 ? (
              <div className="py-6 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-emerald-500/60" />
                <span>All shareholder 2×2 passport photos are currently verified & authorized.</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {pendingPhotos.map((pm) => (
                  <div
                    key={pm.id}
                    className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3 hover:border-slate-700 transition"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                          {pm.id}
                        </span>
                        <div>
                          <span className="font-bold text-white text-sm">{pm.name}</span>
                          <span className="text-xs text-slate-400 ml-2">Share #{pm.shareNumber} of 144</span>
                          <span className="text-xs text-emerald-400 ml-2">({pm.controllingDirectorName})</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleAuthorizePhoto(pm.id)}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Authorize 2×2 Photo</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setRejectingPhotoMember(pm);
                            setPhotoRejectReasonInput('');
                          }}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-200 border border-slate-700 rounded-lg text-xs font-semibold transition flex items-center gap-1"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </div>
                    </div>

                    {/* Visual Comparison: Current Photo vs Proposed 2x2 Photo */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
                      {/* Current Photo */}
                      <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 flex items-center gap-3">
                        <div className="w-16 h-16 rounded-lg overflow-hidden border border-slate-700 bg-white shrink-0 relative">
                          {pm.photoUrl ? (
                            <img src={pm.photoUrl} alt="Current photo" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-slate-900 flex items-center justify-center text-slate-500 text-[10px]">
                              No Photo
                            </div>
                          )}
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                            Current Registered Photo
                          </span>
                          <div className="text-slate-300 font-medium">
                            {pm.photoUrl ? 'Existing Photo' : 'No prior photo registered'}
                          </div>
                          {pm.photoAuthorizedByName && (
                            <div className="text-[10px] text-slate-500">
                              Prior auth: {pm.photoAuthorizedByName}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Proposed New 2x2 Photo */}
                      <div className="p-3 bg-emerald-950/20 rounded-xl border border-emerald-900/40 flex items-center gap-3">
                        <div className="w-16 h-16 rounded-lg overflow-hidden border-2 border-emerald-500/80 bg-white shrink-0 relative shadow-md">
                          {pm.pendingPhotoUrl ? (
                            <img src={pm.pendingPhotoUrl} alt="Proposed photo" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-slate-900 flex items-center justify-center text-slate-500 text-[10px]">
                              N/A
                            </div>
                          )}
                          <div className="absolute top-0.5 left-0.5 bg-slate-950/80 px-1 py-0.2 rounded text-[7px] font-mono text-emerald-300">
                            2"×2"
                          </div>
                        </div>
                        <div className="space-y-0.5 flex-1">
                          <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider flex items-center gap-1">
                            <span>Proposed 2×2 Passport Photo</span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                              Pending Review
                            </span>
                          </span>
                          <div className="text-[11px] text-slate-300">
                            Specification: 1:1 Square Standard Portrait
                          </div>
                          <div className="text-[10px] text-emerald-400/90 font-mono">
                            ✓ Ready for Official Authorization
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section B: Profile Data Requests */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-400" />
                <span>Pending Profile Information Requests ({pendingRequests.length})</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Review, modify, or approve contact and address changes submitted by shareholders.
              </p>
            </div>
          </div>

          {pendingRequests.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No pending profile update requests currently in the queue.
            </div>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map((req) => {
                const currentMemberData = members.find((m) => m.id === req.memberId);

                return (
                  <div
                    key={req.id}
                    className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4 hover:border-slate-700 transition"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                          {req.memberId}
                        </span>
                        <span className="font-bold text-sm text-white">
                          Requested by: {req.requestedBy}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          ({new Date(req.requestedAt).toLocaleString()})
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenModifyAndApprove(req)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shadow"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Modify & Approve</span>
                        </button>
                        <button
                          onClick={() => handleQuickApprove(req.id)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shadow"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Quick Approve</span>
                        </button>
                        <button
                          onClick={() => handleReject(req.id)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-200 border border-slate-700 rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </div>
                    </div>

                    {/* Comparison Table */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5">
                        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                          Current Registered Information
                        </span>
                        <div><span className="text-slate-400">Name:</span> <strong className="text-slate-200">{currentMemberData?.name}</strong></div>
                        <div><span className="text-slate-400">Phone:</span> <span className="text-slate-200">{currentMemberData?.phone}</span></div>
                        <div><span className="text-slate-400">Email:</span> <span className="text-slate-200">{currentMemberData?.email}</span></div>
                        <div><span className="text-slate-400">Address:</span> <span className="text-slate-200">{currentMemberData?.address}</span></div>
                      </div>

                      <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-900/40 space-y-1.5">
                        <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                          User Proposed Changes
                        </span>
                        <div>
                          <span className="text-slate-400">Proposed Name:</span>{' '}
                          <strong className={req.proposedName !== currentMemberData?.name ? 'text-emerald-300 font-bold' : 'text-slate-300'}>
                            {req.proposedName}
                          </strong>
                        </div>
                        <div>
                          <span className="text-slate-400">Proposed Phone:</span>{' '}
                          <span className={req.proposedPhone !== currentMemberData?.phone ? 'text-emerald-300 font-bold' : 'text-slate-300'}>
                            {req.proposedPhone}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400">Proposed Email:</span>{' '}
                          <span className={req.proposedEmail !== currentMemberData?.email ? 'text-emerald-300 font-bold' : 'text-slate-300'}>
                            {req.proposedEmail}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400">Proposed Address:</span>{' '}
                          <span className={req.proposedAddress !== currentMemberData?.address ? 'text-emerald-300 font-bold' : 'text-slate-300'}>
                            {req.proposedAddress}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* -------------------- TAB 3: MEMBER DIRECTORY (144 Shares) -------------------- */}
      {activeSubTab === 'DIRECTORY' && (
        <div className="space-y-4">
          {/* Controls: Search, Director Filter & Export CSV */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-md">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium">Controlling Director:</span>
                <select
                  value={selectedDirectorFilter}
                  onChange={(e) => setSelectedDirectorFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="ALL">All 144 Shares / Directors</option>
                  <option value="SAIF AHMED SAKIL">Saif Ahmed Sakil (1–20)</option>
                  <option value="M MASUD SAWDAGOR">M Masud Sawdagor (21–48)</option>
                  <option value="M OMAR FARUQUE MOLLA">M Omar Faruque Molla (49–55)</option>
                  <option value="SHAHIN AHMED">Shahin Ahmed (56–70)</option>
                  <option value="ABUL HASHIM">Abul Hashim (71–87)</option>
                  <option value="SIRAJUL ISLAM">Sirajul Islam (88–94)</option>
                  <option value="M ABU YOUSUF">M Abu Yousuf (95–101)</option>
                  <option value="FAIZAN AHMED">Faizan Ahmed (102–108)</option>
                  <option value="4th Unit (General Reserve)">4th Unit (109–144)</option>
                </select>
              </div>

              <div className="text-xs text-slate-400 border-l border-slate-800 pl-3 hidden sm:block">
                Showing <strong className="text-emerald-400 font-mono">{filteredMembers.length}</strong> of 144 Members
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="relative flex-1 sm:w-80">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Member ID, Share#, Name, NID, Phone, Address..."
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                onClick={handleExportDirectoryCSV}
                title="Download complete Member Directory in CSV format (16 columns)"
                className="px-3.5 py-1.5 bg-slate-950 hover:bg-slate-800 text-emerald-400 hover:text-emerald-300 border border-emerald-800/60 hover:border-emerald-600 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shrink-0 shadow"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Export CSV</span>
              </button>
            </div>
          </div>

          {/* Directory Table with exactly 16 requested columns */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[2150px]">
                <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase text-[11px] tracking-wider">
                  <tr>
                    <th className="py-3 px-3.5 whitespace-nowrap sticky left-0 z-20 bg-slate-950 border-r border-slate-800/80 shadow-md">
                      Member Id
                    </th>
                    <th className="py-3 px-3 whitespace-nowrap">Share#</th>
                    <th className="py-3 px-3 whitespace-nowrap">2×2 Photo</th>
                    <th className="py-3 px-4 whitespace-nowrap">Full Name</th>
                    <th className="py-3 px-4 whitespace-nowrap">Controlling Director</th>
                    <th className="py-3 px-3.5 whitespace-nowrap">Phone</th>
                    <th className="py-3 px-4 whitespace-nowrap">Email</th>
                    <th className="py-3 px-3.5 whitespace-nowrap">NID/Birth ID</th>
                    <th className="py-3 px-3 whitespace-nowrap">DoB</th>
                    <th className="py-3 px-4 whitespace-nowrap">Education</th>
                    <th className="py-3 px-4 whitespace-nowrap">Permanent Address</th>
                    <th className="py-3 px-4 whitespace-nowrap">Current Address</th>
                    <th className="py-3 px-3.5 whitespace-nowrap">Spouse Name</th>
                    <th className="py-3 px-3.5 whitespace-nowrap">Spouse Mobile</th>
                    <th className="py-3 px-4 whitespace-nowrap">Emergency Contact</th>
                    <th className="py-3 px-3 whitespace-nowrap text-center">Status</th>
                    <th className="py-3 px-4 whitespace-nowrap text-right sticky right-0 z-20 bg-slate-950 border-l border-slate-800/80 shadow-md">
                      Admin Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredMembers.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-800/50 transition group">
                      {/* 1. Member Id (Sticky Left) */}
                      <td className="py-3 px-3.5 font-mono font-bold whitespace-nowrap sticky left-0 z-10 bg-slate-900 group-hover:bg-slate-800/90 border-r border-slate-800/80">
                        <span className="px-2 py-0.5 rounded bg-emerald-950/70 border border-emerald-800/80 text-emerald-400">
                          {m.id}
                        </span>
                      </td>

                      {/* 2. Share# */}
                      <td className="py-3 px-3 font-mono font-bold text-slate-200 whitespace-nowrap">
                        #{m.shareNumber}
                      </td>

                      {/* 2×2 Passport Photo */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <div
                            onClick={() => setSelectedDossierMember(m)}
                            className="w-10 h-10 rounded-lg overflow-hidden border border-slate-700 bg-white shadow-sm flex items-center justify-center cursor-pointer hover:border-emerald-500 transition relative group/avatar shrink-0"
                            title={`2×2 Passport Photo: ${m.name} (${m.photoStatus || 'No photo uploaded'})`}
                          >
                            {m.photoUrl ? (
                              <img src={m.photoUrl} alt={m.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-slate-950 flex items-center justify-center text-slate-500 font-mono text-[10px] font-bold">
                                {m.name.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            {m.photoStatus === 'AUTHORIZED' && (
                              <span
                                className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-1 ring-slate-950 flex items-center justify-center text-[7px] text-slate-950 font-bold"
                                title="2×2 Photo Authorized"
                              >
                                ✓
                              </span>
                            )}
                            {m.photoStatus === 'PENDING_AUTHORIZATION' && (
                              <span
                                className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-amber-400 ring-1 ring-slate-950 animate-pulse"
                                title="Pending Authorization"
                              />
                            )}
                          </div>
                          {isOfficialOrAdmin && (
                            <button
                              type="button"
                              onClick={() => handleOpenPassportUploadForMember(m)}
                              title={`Change / Add / Edit 2×2 Photo for Shareholder ${m.name} (Official Authority)`}
                              className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition"
                            >
                              <Camera className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>

                      {/* 3. Full Name */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-white">{m.name}</span>
                          {m.ecDesignation && m.ecDesignation !== 'None' && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              {m.ecDesignation}
                            </span>
                          )}
                          {m.pendingUpdate && (
                            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" title="Pending update request under review" />
                          )}
                        </div>
                      </td>

                      {/* 4. Controlling Director */}
                      <td className="py-3 px-4 text-emerald-400 font-medium whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-emerald-500/80 shrink-0" />
                          <span>{m.controllingDirectorName}</span>
                        </div>
                      </td>

                      {/* 5. Phone */}
                      <td className="py-3 px-3.5 font-mono text-slate-300 whitespace-nowrap">
                        <a href={`tel:${m.phone}`} className="hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-slate-500 shrink-0" />
                          <span>{m.phone}</span>
                        </a>
                      </td>

                      {/* 6. Email */}
                      <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">
                        <a href={`mailto:${m.email}`} className="hover:text-emerald-300 transition-colors flex items-center gap-1.5">
                          <Mail className="w-3 h-3 text-slate-500 shrink-0" />
                          <span>{m.email}</span>
                        </a>
                      </td>

                      {/* 7. NID/Birth ID */}
                      <td className="py-3 px-3.5 font-mono text-slate-300 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[11px] text-slate-300 font-mono tracking-wide">
                          {m.nidOrBirthId || 'N/A'}
                        </span>
                      </td>

                      {/* 8. DoB */}
                      <td className="py-3 px-3 font-mono text-slate-300 whitespace-nowrap text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3 h-3 text-slate-500 shrink-0" />
                          <span>{m.dob || 'N/A'}</span>
                        </div>
                      </td>

                      {/* 9. Education */}
                      <td className="py-3 px-4 text-slate-300 whitespace-nowrap text-[11px]">
                        <div className="flex items-center gap-1.5 max-w-[240px] truncate" title={m.education}>
                          <GraduationCap className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          <span className="truncate">{m.education || 'N/A'}</span>
                        </div>
                      </td>

                      {/* 10. Permanent Address */}
                      <td className="py-3 px-4 text-slate-300 text-[11px]">
                        <div className="flex items-center gap-1.5 max-w-[260px] truncate" title={m.permanentAddress}>
                          <MapPin className="w-3.5 h-3.5 text-amber-400/80 shrink-0" />
                          <span className="truncate">{m.permanentAddress || 'N/A'}</span>
                        </div>
                      </td>

                      {/* 11. Current Address */}
                      <td className="py-3 px-4 text-slate-300 text-[11px]">
                        <div className="flex items-center gap-1.5 max-w-[260px] truncate" title={m.currentAddress || m.address}>
                          <MapPin className="w-3.5 h-3.5 text-emerald-400/80 shrink-0" />
                          <span className="truncate">{m.currentAddress || m.address || 'N/A'}</span>
                        </div>
                      </td>

                      {/* 12. Spouse Name */}
                      <td className="py-3 px-3.5 text-slate-300 whitespace-nowrap text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <Heart className="w-3 h-3 text-rose-400/80 shrink-0" />
                          <span>{m.spouseName || 'N/A'}</span>
                        </div>
                      </td>

                      {/* 13. Spouse Mobile */}
                      <td className="py-3 px-3.5 font-mono text-slate-400 whitespace-nowrap text-[11px]">
                        {m.spouseMobile ? (
                          <a href={`tel:${m.spouseMobile}`} className="hover:text-emerald-300 transition-colors flex items-center gap-1.5">
                            <Phone className="w-3 h-3 text-slate-500 shrink-0" />
                            <span>{m.spouseMobile}</span>
                          </a>
                        ) : (
                          <span className="text-slate-600">N/A</span>
                        )}
                      </td>

                      {/* 14. Emergency Contact */}
                      <td className="py-3 px-4 text-slate-300 whitespace-nowrap text-[11px]">
                        <div className="flex items-center gap-1.5 font-mono text-[11px] text-amber-300/90" title={m.emergencyContact}>
                          <PhoneCall className="w-3 h-3 text-amber-400 shrink-0" />
                          <span>{m.emergencyContact || 'N/A'}</span>
                        </div>
                      </td>

                      {/* 15. Status */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          (lockedUsersMap[m.id.toLowerCase()] || lockedUsersMap[m.id])
                            ? 'bg-rose-950/80 text-rose-300 border border-rose-700 font-bold'
                            : m.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        }`}>
                          {(lockedUsersMap[m.id.toLowerCase()] || lockedUsersMap[m.id]) ? 'LOCKED' : m.status}
                        </span>
                      </td>

                      {/* 16. Admin Action (Sticky Right) */}
                      <td className="py-3 px-4 text-right whitespace-nowrap sticky right-0 z-10 bg-slate-900 group-hover:bg-slate-800/90 border-l border-slate-800/80">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedDossierMember(m)}
                            title={`View full profile dossier for ${m.name}`}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded text-[11px] font-semibold transition inline-flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3 text-slate-400" />
                            <span>View</span>
                          </button>
                          {canApproveAndModify && (
                            <>
                              {/* Lock / Unlock User Button */}
                              {(lockedUsersMap[m.id.toLowerCase()] || lockedUsersMap[m.id]) ? (
                                <button
                                  onClick={() => handleUnlockUser(m.id, m.name)}
                                  title={`User account is locked. Click to unlock access for ${m.name}`}
                                  className="px-2 py-1 bg-amber-950/80 hover:bg-amber-900/80 text-amber-300 border border-amber-700 rounded text-[11px] font-semibold transition inline-flex items-center gap-1"
                                >
                                  <Lock className="w-3 h-3 text-amber-400" />
                                  <span>Unlock</span>
                                </button>
                              ) : (
                                !(m.id === 'PHSM-001' && currentUser?.role === 'DELEGATED_ADMIN') && (
                                  <button
                                    onClick={() => handleOpenLockUser(m.id, m.name, m.id)}
                                    title={`Lock user ${m.name} if stuck`}
                                    className="px-2 py-1 bg-slate-800 hover:bg-rose-950/80 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-700 rounded text-[11px] font-semibold transition inline-flex items-center gap-1"
                                  >
                                    <Power className="w-3 h-3" />
                                    <span>Lock</span>
                                  </button>
                                )
                              )}

                              {m.id === 'PHSM-001' && currentUser?.role === 'DELEGATED_ADMIN' ? (
                                <span
                                  title="Saif Ahmed Sakil (Root System Admin) is strictly excluded from Delegated Admin password reset"
                                  className="px-2 py-1 bg-slate-800/60 border border-slate-700/60 text-slate-500 rounded text-[10px] font-mono cursor-not-allowed inline-flex items-center gap-1"
                                >
                                  <Lock className="w-3 h-3 text-slate-500" />
                                  <span>Protected</span>
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleOpenResetPassword(m.id, m.name, m.id, 'MEMBER')}
                                  title={`Reset password for ${m.name} (${m.id})`}
                                  className="px-2 py-1 bg-purple-950/60 hover:bg-purple-900/60 text-purple-300 border border-purple-800/80 rounded text-[11px] font-semibold transition inline-flex items-center gap-1"
                                >
                                  <KeyRound className="w-3 h-3 text-purple-400" />
                                  <span>Reset Pass</span>
                                </button>
                              )}
                              <button
                                onClick={() => handleOpenDirectEdit(m)}
                                className="px-2.5 py-1 bg-emerald-950/60 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-800/80 rounded text-[11px] font-semibold transition inline-flex items-center gap-1 shadow"
                              >
                                <Edit3 className="w-3 h-3" />
                                <span>Edit / Modify</span>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- TAB 4: OFFICIALS MANAGEMENT & PASSWORD RESET -------------------- */}
      {activeSubTab === 'OFFICIALS' && canApproveAndModify && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-purple-400" />
                  <span>System Officials & Passwords Registry</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  System Admin & Delegated Admin can reset passwords for Official IDs. System Admin can create accounts and empower/revoke entry rights.
                </p>
              </div>

              {currentUser?.role === 'SYSTEM_ADMIN' && (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setShowPeriodicPasswordModal(true)}
                    className="px-3.5 py-1.5 bg-gradient-to-r from-amber-950/90 to-amber-900/70 hover:from-amber-900 hover:to-amber-800 text-amber-200 border border-amber-600/70 rounded-lg text-xs font-semibold shadow flex items-center gap-1.5 transition"
                    title="Configure Periodic Initial Password and Roll Out to All Users"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                    <span>
                      Set Initial Password Periodically: <strong className="font-mono text-white">{sysDefaultPass}</strong>
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40">
                      {periodicStatus.frequencyLabel}
                    </span>
                    {periodicStatus.isOverdue && (
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                    )}
                  </button>
                  <button
                    onClick={() => setShowAddOfficialModal(true)}
                    className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold shadow flex items-center gap-1.5 transition self-start sm:self-auto"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Create New Official</span>
                  </button>
                </div>
              )}
            </div>

            {/* Policy Banner */}
            <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-800/60 text-purple-200 text-xs flex items-center gap-2.5">
              <ShieldAlert className="w-4 h-4 text-purple-400 shrink-0" />
              <span>
                <strong>System Access Policy:</strong> "Only empowered (by System Admin) Official can make Entry (Record Income, Record Expense)." Non-empowered officials or members are strictly barred from submitting financial vouchers.
              </span>
            </div>

            {/* Officials Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Official ID</th>
                    <th className="py-3 px-3">2×2 Photo</th>
                    <th className="py-3 px-4">Full Name & Username</th>
                    <th className="py-3 px-4">Official Designation</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Contact Info</th>
                    <th className="py-3 px-4 text-center">Entry Empowerment</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {officials.map((off) => (
                    <tr key={off.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-purple-400">
                        {off.id}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-700 bg-white shadow-sm flex items-center justify-center relative shrink-0">
                            {off.photoUrl ? (
                              <img src={off.photoUrl} alt={off.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-slate-950 flex items-center justify-center text-slate-500 font-mono text-[10px] font-bold">
                                {off.name.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div className="absolute top-0.5 left-0.5 bg-slate-950/80 px-1 py-0.2 rounded text-[7px] font-mono text-emerald-300">
                              2"×2"
                            </div>
                          </div>
                          {isOfficialOrAdmin && (
                            <button
                              type="button"
                              onClick={() => {
                                setPassportTargetMember(null);
                                setPassportTargetOfficial(off.username);
                                setShowPassportModal(true);
                              }}
                              title={`Change / Add / Edit 2×2 Photo for Official ${off.name}`}
                              className="p-1 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded transition"
                            >
                              <Camera className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">{off.name}</div>
                        <div className="text-[11px] font-mono text-slate-400">@{off.username}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-slate-200 border border-slate-700">
                          {off.designation}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        {off.department}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-slate-300">{off.phone}</div>
                        <div className="text-[11px] text-slate-500">{off.email}</div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {off.isEmpoweredForEntry ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700">
                              <CheckCircle className="w-3 h-3 text-emerald-400" />
                              <span>EMPOWERED</span>
                            </span>
                            {off.empoweredBy && (
                              <span className="text-[9px] text-slate-500 mt-0.5">by {off.empoweredBy}</span>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                            <XCircle className="w-3 h-3 text-slate-500" />
                            <span>NOT EMPOWERED</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {canApproveAndModify && (
                            (lockedUsersMap[off.username.toLowerCase()] || lockedUsersMap[off.id.toLowerCase()]) ? (
                              <button
                                onClick={() => handleUnlockUser(off.username, off.name)}
                                title="Official account is locked. Click to unlock."
                                className="px-2 py-1 bg-amber-950/80 hover:bg-amber-900/80 text-amber-300 border border-amber-700 rounded text-[11px] font-semibold transition inline-flex items-center gap-1"
                              >
                                <Lock className="w-3 h-3 text-amber-400" />
                                <span>Unlock</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleOpenLockUser(off.id, off.name, off.username)}
                                title={`Lock official account ${off.name} if stuck`}
                                className="px-2 py-1 bg-slate-800 hover:bg-rose-950/80 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-700 rounded text-[11px] font-semibold transition inline-flex items-center gap-1"
                              >
                                <Power className="w-3 h-3" />
                                <span>Lock</span>
                              </button>
                            )
                          )}
                          <button
                            onClick={() => handleOpenResetPassword(off.id, off.name, off.username, 'OFFICIAL')}
                            title={`Reset password for Official ${off.name} (@${off.username})`}
                            className="px-2.5 py-1 bg-purple-950/60 hover:bg-purple-900/60 text-purple-300 border border-purple-800/80 rounded text-[11px] font-semibold transition flex items-center gap-1"
                          >
                            <KeyRound className="w-3 h-3 text-purple-400" />
                            <span>Reset Pass</span>
                          </button>
                          {currentUser?.role === 'SYSTEM_ADMIN' && (
                            <>
                              <button
                                onClick={() => handleToggleOfficialEmpowerment(off.id, off.isEmpoweredForEntry)}
                                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition flex items-center gap-1 ${
                                  off.isEmpoweredForEntry
                                    ? 'bg-amber-950/60 hover:bg-amber-900/60 text-amber-300 border border-amber-800'
                                    : 'bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800'
                                }`}
                              >
                                <Power className="w-3 h-3" />
                                <span>{off.isEmpoweredForEntry ? 'Revoke Entry' : 'Empower for Entry'}</span>
                              </button>
                              <button
                                onClick={() => handleDeleteOfficial(off.id)}
                                title="Remove Official Account"
                                className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Admin Direct Edit Modal */}
      {directEditMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in fade-in duration-200">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-2.5">
                <Edit3 className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Direct Member Profile Edit</span>
                    <span className="font-mono text-emerald-400 text-xs px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800">
                      {directEditMember.id}
                    </span>
                    <span className="text-slate-400 text-xs font-mono">
                      (Share #{directEditMember.shareNumber})
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Controlling Director: <strong className="text-emerald-400">{directEditMember.controllingDirectorName}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDirectEditMember(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveDirectEdit} className="p-6 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
              {/* 2x2 Passport Photo Section */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-lg overflow-hidden border-2 border-emerald-500/70 bg-white shrink-0 relative shadow-inner">
                    {directEditMember.photoUrl ? (
                      <img
                        src={directEditMember.photoUrl}
                        alt={directEditMember.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-slate-500 text-[10px]">
                        <UserIcon className="w-5 h-5 text-slate-500 mb-0.5" />
                        <span>No Photo</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-200 text-xs flex items-center gap-2">
                      <span>2×2 Passport Photo</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                        directEditMember.photoStatus === 'AUTHORIZED'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : directEditMember.photoStatus === 'PENDING_AUTHORIZATION'
                          ? 'bg-amber-950 text-amber-400 border border-amber-800'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {directEditMember.photoStatus || 'STANDARD'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Standard 1:1 Square (2"×2") Passport Format
                    </div>
                    {directEditMember.photoAuthorizedByName && (
                      <div className="text-[10px] text-slate-500">
                        Authorized by: {directEditMember.photoAuthorizedByName}
                      </div>
                    )}
                  </div>
                </div>

                {isOfficialOrAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      const target = directEditMember;
                      handleOpenPassportUploadForMember(target);
                    }}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
                  >
                    <Camera className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{directEditMember.photoUrl ? 'Change 2×2 Photo' : 'Add 2×2 Photo'}</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Full Legal Name</label>
                  <input
                    type="text"
                    required
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-medium focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Member Status</label>
                  <select
                    value={adminStatus}
                    onChange={(e: any) => setAdminStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:border-emerald-500"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={adminPhone}
                    onChange={(e) => setAdminPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">NID / Birth ID</label>
                  <input
                    type="text"
                    value={adminNid}
                    onChange={(e) => setAdminNid(e.target.value)}
                    placeholder="e.g. 19852692500000001"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Date of Birth (DoB)</label>
                  <input
                    type="date"
                    value={adminDob}
                    onChange={(e) => setAdminDob(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Educational Qualification</label>
                <input
                  type="text"
                  value={adminEducation}
                  onChange={(e) => setAdminEducation(e.target.value)}
                  placeholder="e.g. B.Sc. in Civil Engineering (BUET)"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Permanent Address</label>
                  <textarea
                    rows={2}
                    value={adminPermAddress}
                    onChange={(e) => setAdminPermAddress(e.target.value)}
                    placeholder="Village, PO, Upazila/Dist"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Current Address (Plot / Residence)</label>
                  <textarea
                    rows={2}
                    required
                    value={adminCurrAddress}
                    onChange={(e) => setAdminCurrAddress(e.target.value)}
                    placeholder="House, Road, Sector, Uttara, Dhaka"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Spouse Full Name</label>
                  <input
                    type="text"
                    value={adminSpouseName}
                    onChange={(e) => setAdminSpouseName(e.target.value)}
                    placeholder="Spouse Name"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Spouse Mobile</label>
                  <input
                    type="text"
                    value={adminSpouseMobile}
                    onChange={(e) => setAdminSpouseMobile(e.target.value)}
                    placeholder="+88017..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Emergency Contact (Phone & Relationship)</label>
                <input
                  type="text"
                  value={adminEmergencyContact}
                  onChange={(e) => setAdminEmergencyContact(e.target.value)}
                  placeholder="+88018... (Brother / Relative)"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setDirectEditMember(null)}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold shadow"
                >
                  Save & Commit Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modify & Approve Modal */}
      {modifyingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in fade-in duration-200">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-blue-400" />
                <span>Modify & Approve Profile Request: {modifyingRequest.memberId}</span>
              </h3>
              <button
                onClick={() => setModifyingRequest(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCommitApprovalWithModifications} className="p-6 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
              <p className="text-slate-300">
                You can adjust or verify the proposed information before committing the official approval.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Approved Full Name</label>
                  <input
                    type="text"
                    required
                    value={modName}
                    onChange={(e) => setModName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Approved Phone</label>
                  <input
                    type="text"
                    required
                    value={modPhone}
                    onChange={(e) => setModPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Approved Email</label>
                  <input
                    type="email"
                    required
                    value={modEmail}
                    onChange={(e) => setModEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Approved NID / Birth ID</label>
                  <input
                    type="text"
                    value={modNid}
                    onChange={(e) => setModNid(e.target.value)}
                    placeholder="NID / Birth ID"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Approved DoB</label>
                  <input
                    type="date"
                    value={modDob}
                    onChange={(e) => setModDob(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Approved Education</label>
                  <input
                    type="text"
                    value={modEducation}
                    onChange={(e) => setModEducation(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Approved Permanent Address</label>
                  <textarea
                    rows={2}
                    value={modPermAddress}
                    onChange={(e) => setModPermAddress(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Approved Current Address</label>
                  <textarea
                    rows={2}
                    required
                    value={modCurrAddress}
                    onChange={(e) => setModCurrAddress(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Approved Spouse Name</label>
                  <input
                    type="text"
                    value={modSpouseName}
                    onChange={(e) => setModSpouseName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Approved Spouse Mobile</label>
                  <input
                    type="text"
                    value={modSpouseMobile}
                    onChange={(e) => setModSpouseMobile(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Approved Emergency Contact</label>
                <input
                  type="text"
                  value={modEmergencyContact}
                  onChange={(e) => setModEmergencyContact(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModifyingRequest(null)}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold shadow"
                >
                  Approve with Modifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Member Profile Dossier Modal (All 16 Attributes) */}
      {selectedDossierMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in fade-in duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-slate-600 bg-white shadow-md relative shrink-0">
                  {selectedDossierMember.photoUrl ? (
                    <img
                      src={selectedDossierMember.photoUrl}
                      alt={selectedDossierMember.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center text-slate-500">
                      <Camera className="w-6 h-6 mb-0.5 text-slate-600" />
                      <span className="text-[8px] font-mono">2"×2"</span>
                    </div>
                  )}
                  <div className="absolute top-0.5 left-0.5 bg-slate-950/80 px-1 py-0.2 rounded text-[7px] font-mono text-emerald-300">
                    2"×2"
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">{selectedDossierMember.name}</h3>
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                      {selectedDossierMember.id}
                    </span>
                    <span className="font-mono text-xs text-slate-300 font-semibold">
                      Share #{selectedDossierMember.shareNumber}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                    <span>Prottasha Housing Society – Official Member Dossier</span>
                    {selectedDossierMember.photoStatus === 'AUTHORIZED' && (
                      <span className="text-emerald-400 font-semibold text-[10px]">
                        ✓ 2×2 Photo Authorized
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDossierMember(null)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
              >
                ✕
              </button>
            </div>

            {/* Dossier Body with 16 Attributes */}
            <div className="p-6 space-y-5 text-xs max-h-[75vh] overflow-y-auto">
              {/* Category 1: Identification & Core Share */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Shareholder Identification & Registry</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Member Id</span>
                    <span className="font-mono font-bold text-emerald-400 text-sm">{selectedDossierMember.id}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Share#</span>
                    <span className="font-mono font-bold text-white text-sm">#{selectedDossierMember.shareNumber} of 144</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Status</span>
                    <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full mt-0.5 ${
                      selectedDossierMember.status === 'ACTIVE'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                    }`}>
                      {selectedDossierMember.status}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Controlling Director</span>
                    <span className="font-medium text-emerald-300">{selectedDossierMember.controllingDirectorName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">NID / Birth ID</span>
                    <span className="font-mono text-slate-200">{selectedDossierMember.nidOrBirthId || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Date of Birth (DoB)</span>
                    <span className="font-mono text-slate-200">{selectedDossierMember.dob || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Category 2: Educational & Professional */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Educational Qualification</span>
                </span>
                <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
                  <div className="text-slate-200 font-medium">{selectedDossierMember.education || 'N/A'}</div>
                  {selectedDossierMember.ecDesignation && selectedDossierMember.ecDesignation !== 'None' && (
                    <div className="mt-2 pt-2 border-t border-slate-800/80 text-[11px] flex items-center gap-2">
                      <span className="text-slate-400">EC Designation:</span>
                      <span className="font-bold text-emerald-400">{selectedDossierMember.ecDesignation}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Category 3: Contact & Communication */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" />
                  <span>Direct Contact Information</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Primary Phone</span>
                    <a href={`tel:${selectedDossierMember.phone}`} className="font-mono text-slate-200 hover:text-emerald-400 flex items-center gap-1.5 mt-0.5">
                      <Phone className="w-3 h-3 text-slate-500" />
                      <span>{selectedDossierMember.phone}</span>
                    </a>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Official Email</span>
                    <a href={`mailto:${selectedDossierMember.email}`} className="font-mono text-slate-200 hover:text-emerald-400 flex items-center gap-1.5 mt-0.5">
                      <Mail className="w-3 h-3 text-slate-500" />
                      <span>{selectedDossierMember.email}</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Category 4: Residential & Permanent Address */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Residential & Permanent Addresses</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Current Address (Plot / Residence)</span>
                    <span className="text-slate-200 block mt-0.5 leading-relaxed">{selectedDossierMember.currentAddress || selectedDossierMember.address || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Permanent Address</span>
                    <span className="text-slate-200 block mt-0.5 leading-relaxed">{selectedDossierMember.permanentAddress || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Category 5: Family & Emergency Contact */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5" />
                  <span>Spouse & Emergency Contact</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Spouse Name</span>
                    <span className="text-slate-200 font-medium block mt-0.5">{selectedDossierMember.spouseName || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Spouse Mobile</span>
                    {selectedDossierMember.spouseMobile ? (
                      <a href={`tel:${selectedDossierMember.spouseMobile}`} className="font-mono text-slate-200 hover:text-emerald-400 block mt-0.5">
                        {selectedDossierMember.spouseMobile}
                      </a>
                    ) : (
                      <span className="text-slate-500 block mt-0.5">N/A</span>
                    )}
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Emergency Contact</span>
                    <span className="font-mono text-amber-300 font-medium block mt-0.5">{selectedDossierMember.emergencyContact || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="px-6 py-3.5 border-t border-slate-800 flex items-center justify-between bg-slate-950">
              <span className="text-[11px] text-slate-500 font-mono">
                16 Verified Attributes Registered
              </span>
              <div className="flex items-center gap-2">
                {canApproveAndModify && (
                  <>
                    {(lockedUsersMap[selectedDossierMember.id.toLowerCase()] || lockedUsersMap[selectedDossierMember.id]) ? (
                      <button
                        onClick={() => handleUnlockUser(selectedDossierMember.id, selectedDossierMember.name)}
                        className="px-3 py-1.5 bg-amber-950/80 hover:bg-amber-900/80 text-amber-300 border border-amber-700 rounded-lg text-xs font-semibold shadow transition flex items-center gap-1.5"
                      >
                        <Lock className="w-3.5 h-3.5 text-amber-400" />
                        <span>Unlock Account</span>
                      </button>
                    ) : (
                      !(selectedDossierMember.id === 'PHSM-001' && currentUser?.role === 'DELEGATED_ADMIN') && (
                        <button
                          onClick={() => {
                            const target = selectedDossierMember;
                            setSelectedDossierMember(null);
                            handleOpenLockUser(target.id, target.name, target.id);
                          }}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-rose-950/80 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-700 rounded-lg text-xs font-semibold shadow transition flex items-center gap-1.5"
                        >
                          <Power className="w-3.5 h-3.5" />
                          <span>Lock User</span>
                        </button>
                      )
                    )}

                    {!(selectedDossierMember.id === 'PHSM-001' && currentUser?.role === 'DELEGATED_ADMIN') && (
                      <button
                        onClick={() => {
                          const target = selectedDossierMember;
                          setSelectedDossierMember(null);
                          handleOpenResetPassword(target.id, target.name, target.id, 'MEMBER');
                        }}
                        className="px-3 py-1.5 bg-purple-950/60 hover:bg-purple-900/60 text-purple-300 border border-purple-800/80 rounded-lg text-xs font-semibold shadow transition flex items-center gap-1.5"
                      >
                        <KeyRound className="w-3.5 h-3.5 text-purple-400" />
                        <span>Reset Pass</span>
                      </button>
                    )}

                    {isOfficialOrAdmin && (
                      <button
                        onClick={() => {
                          const target = selectedDossierMember;
                          setSelectedDossierMember(null);
                          handleOpenPassportUploadForMember(target);
                        }}
                        className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-semibold shadow transition flex items-center gap-1.5"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>{selectedDossierMember.photoUrl ? 'Edit 2×2 Photo' : 'Add 2×2 Photo'}</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        const target = selectedDossierMember;
                        setSelectedDossierMember(null);
                        handleOpenDirectEdit(target);
                      }}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow transition flex items-center gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Profile</span>
                    </button>
                  </>
                )}
                <button
                  onClick={() => setSelectedDossierMember(null)}
                  className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Official Modal */}
      {showAddOfficialModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in duration-200">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-purple-400" />
                <span>Create System Official (Root Admin)</span>
              </h3>
              <button
                onClick={() => setShowAddOfficialModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateOfficial} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Full Legal Name</label>
                  <input
                    type="text"
                    required
                    value={offName}
                    onChange={(e) => setOffName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                    placeholder="e.g. Md. Tariqul Islam"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">System Username</label>
                  <input
                    type="text"
                    required
                    value={offUsername}
                    onChange={(e) => setOffUsername(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono"
                    placeholder="e.g. dym_tariq"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Official Designation</label>
                  <select
                    value={offDesignation}
                    onChange={(e: any) => setOffDesignation(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                  >
                    <option value="Manager">Manager</option>
                    <option value="Deputy Manager (DyM)">Deputy Manager (DyM)</option>
                    <option value="Assistant Manager (AistM)">Assistant Manager (AistM)</option>
                    <option value="Accounts Officer">Accounts Officer</option>
                    <option value="Site Supervisor">Site Supervisor</option>
                    <option value="Audit Officer">Audit Officer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Department</label>
                  <input
                    type="text"
                    required
                    value={offDept}
                    onChange={(e) => setOffDept(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                    placeholder="Accounts & Finance"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Mobile Contact</label>
                  <input
                    type="text"
                    required
                    value={offPhone}
                    onChange={(e) => setOffPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                    placeholder="+8801711..."
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={offEmail}
                    onChange={(e) => setOffEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                    placeholder="official@prottasha.org"
                  />
                </div>
              </div>

              <div className="p-3 bg-purple-950/40 border border-purple-800/60 rounded-xl">
                <label className="flex items-center gap-2.5 cursor-pointer text-xs text-purple-200">
                  <input
                    type="checkbox"
                    checked={offEmpowered}
                    onChange={(e) => setOffEmpowered(e.target.checked)}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 bg-slate-900 border-slate-700"
                  />
                  <div>
                    <span className="font-bold text-white block">Empower this Official for Entry</span>
                    <span className="text-[11px] text-slate-400">
                      Authorizes official to make daily Income and Expense records in the system.
                    </span>
                  </div>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddOfficialModal(false)}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-semibold shadow"
                >
                  Create & Empower Official
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Reset Modal (System Admin & Delegated Admin) */}
      {resetModalOpen && resetTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in duration-200">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-purple-400" />
                <span>Reset User Password</span>
              </h3>
              <button
                onClick={() => {
                  setResetModalOpen(false);
                  setResetTarget(null);
                  setResetFeedback({});
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleExecutePasswordReset} className="p-6 space-y-4 text-xs">
              {/* Target User Info */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Target User:</span>
                  <span className="font-bold text-white text-sm">{resetTarget.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Account ID:</span>
                  <span className="font-mono text-emerald-400 font-bold bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/80">
                    {resetTarget.identifier}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Role / Type:</span>
                  <span className="text-slate-300 font-medium">{resetTarget.role}</span>
                </div>
              </div>

              {/* Exclusion policy note */}
              <div className="text-[11px] text-slate-400 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 flex items-start gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-400 mt-0.5 shrink-0" />
                <span>
                  Authorized by <strong>{currentUser?.name}</strong> (
                  {currentUser?.role === 'SYSTEM_ADMIN' ? 'System Admin' : 'Delegated Admin'}
                  ). System Default Password is{' '}
                  <strong className="text-white font-mono">{sysDefaultPass}</strong>. User will be{' '}
                  <strong className="text-amber-400">forced to change password upon next login</strong>.
                </span>
              </div>

              {currentUser?.role === 'DELEGATED_ADMIN' && (
                <div className="text-[11px] text-amber-300 bg-amber-950/40 p-2.5 rounded-lg border border-amber-800/80">
                  <strong>Delegated Admin Notice:</strong> You are resetting this user account to the System Default Password set by System Admin. Root System Admin Saif Ahmed Sakil is excluded.
                </div>
              )}

              {resetFeedback.error && (
                <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{resetFeedback.error}</span>
                </div>
              )}

              {resetFeedback.success && (
                <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>{resetFeedback.success}</span>
                </div>
              )}

              {/* New Password Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-slate-300 font-semibold">New Password</label>
                  <button
                    type="button"
                    onClick={() => setNewPasswordInput(sysDefaultPass)}
                    className="text-[11px] text-purple-400 hover:text-purple-300 font-mono transition"
                  >
                    Reset to Default: {sysDefaultPass}
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-purple-500"
                    placeholder="Enter new password"
                  />
                </div>
                <span className="text-[10px] text-slate-500">
                  User can log in immediately with this default password, and will be forced to change it on next login.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setResetModalOpen(false);
                    setResetTarget(null);
                    setResetFeedback({});
                  }}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-semibold shadow flex items-center gap-1.5"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Confirm Password Reset</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Account Lock Confirmation Modal (System Admin & Delegated Admin) */}
      {lockModalOpen && lockTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in duration-200">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Power className="w-5 h-5 text-rose-400" />
                <span>Lock User Account</span>
              </h3>
              <button
                onClick={() => {
                  setLockModalOpen(false);
                  setLockTarget(null);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmLockUser} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-rose-950/40 rounded-xl border border-rose-800/60 space-y-1.5 text-rose-200">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Account Target:</span>
                  <span className="font-bold text-white text-sm">{lockTarget.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Identifier / ID:</span>
                  <span className="font-mono text-emerald-400 font-bold bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/80">
                    {lockTarget.identifier}
                  </span>
                </div>
              </div>

              <div className="text-slate-300 space-y-1">
                <p>
                  Locking this account will immediately revoke login access for this user if they get stuck or are under administrative review.
                </p>
                <p className="text-slate-400 text-[11px]">
                  System Admin and Delegated Admin can unlock this user at any time with a single click.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-slate-300 font-semibold">Reason for Lock</label>
                <input
                  type="text"
                  required
                  value={lockReasonInput}
                  onChange={(e) => setLockReasonInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:border-rose-500"
                  placeholder="e.g. Account stuck / repeated attempts / security hold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setLockModalOpen(false);
                    setLockTarget(null);
                  }}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-semibold shadow flex items-center gap-1.5"
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>Confirm Lock User</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Configure System Default Password Modal (System Admin only) */}
      {showSysDefaultModal && currentUser?.role === 'SYSTEM_ADMIN' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in duration-200">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-400" />
                <span>Configure System Default Password</span>
              </h3>
              <button
                onClick={() => setShowSysDefaultModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateSystemDefaultPassword} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-slate-300 space-y-1">
                <div className="font-semibold text-emerald-400">System Admin Authority:</div>
                <p>
                  As System Admin ({currentUser.name}), you can set the default password for the entire society system.
                </p>
                <p className="text-[11px] text-slate-400">
                  When System Admin or Delegated Admin resets any user's password, it resets to this default password.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-slate-300 font-semibold">New System Default Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    minLength={6}
                    value={newSysDefaultInput}
                    onChange={(e) => setNewSysDefaultInput(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-xs focus:border-amber-500"
                    placeholder="e.g. 12345679 or Prottasha@2026"
                  />
                </div>
                <span className="text-[10px] text-slate-500">
                  Must be at least 6 characters long.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowSysDefaultModal(false)}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-lg shadow"
                >
                  Save System Default
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Periodic Password Modal */}
      {showPeriodicPasswordModal && currentUser?.role === 'SYSTEM_ADMIN' && (
        <PeriodicPasswordModal
          isOpen={showPeriodicPasswordModal}
          onClose={() => {
            setShowPeriodicPasswordModal(false);
            setSysDefaultPass(storageService.getSystemDefaultPassword());
            setPeriodicStatus(storageService.getPeriodicPasswordStatus());
          }}
          currentUser={currentUser}
          onSuccess={(msg) => {
            setSuccessBanner(msg);
            setSysDefaultPass(storageService.getSystemDefaultPassword());
            setPeriodicStatus(storageService.getPeriodicPasswordStatus());
            setTimeout(() => setSuccessBanner(''), 5000);
          }}
        />
      )}

      {/* Self Password Change Modal */}
      {showSelfPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="max-w-md w-full bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Change My Password</h3>
              </div>
              <button
                onClick={() => setShowSelfPasswordModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteSelfPasswordChange} className="p-6 space-y-4 text-xs">
              {selfPassError && (
                <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{selfPassError}</span>
                </div>
              )}

              {selfPassSuccess && (
                <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{selfPassSuccess}</span>
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-semibold mb-1">New Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type={showSelfPass ? 'text' : 'password'}
                    required
                    value={selfNewPass}
                    onChange={(e) => setSelfNewPass(e.target.value)}
                    placeholder="Enter at least 6 characters"
                    className="w-full pl-9 pr-10 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSelfPass(!showSelfPass)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                  >
                    {showSelfPass ? <X className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Cannot be default password (12345679).
                </span>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Confirm New Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type={showSelfPass ? 'text' : 'password'}
                    required
                    value={selfConfirmPass}
                    onChange={(e) => setSelfConfirmPass(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowSelfPasswordModal(false)}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold shadow flex items-center gap-1.5 cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Update Password</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2×2 Passport Photo Modal */}
      <PassportPhotoModal
        isOpen={showPassportModal}
        onClose={() => {
          setShowPassportModal(false);
          setPassportTargetMember(null);
          setPassportTargetOfficial(undefined);
        }}
        currentUser={currentUser}
        targetMember={passportTargetMember}
        targetOfficialUsername={passportTargetOfficial}
        onPhotoSaved={() => {
          setRequests(storageService.getProfileUpdateRequests());
          setPendingPhotos(storageService.getPendingPhotoAuthorizations());
          setOfficials(storageService.getOfficials());
        }}
      />

      {/* Reject Photo Modal */}
      {rejectingPhotoMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="max-w-md w-full bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-rose-400" />
                <h3 className="text-sm font-bold text-white">Reject 2×2 Passport Photo</h3>
              </div>
              <button
                onClick={() => setRejectingPhotoMember(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecutePhotoReject} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Shareholder:</span>
                  <span className="font-bold text-white">{rejectingPhotoMember.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Share#:</span>
                  <span className="font-mono text-emerald-400">#{rejectingPhotoMember.shareNumber} ({rejectingPhotoMember.id})</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Reason for Photo Rejection
                </label>
                <textarea
                  rows={3}
                  required
                  value={photoRejectReasonInput}
                  onChange={(e) => setPhotoRejectReasonInput(e.target.value)}
                  placeholder="e.g. Photo does not meet 2×2 passport specs (blurry, non-neutral background, face not centered)"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setRejectingPhotoMember(null)}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-semibold shadow flex items-center gap-1.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Confirm Rejection</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
