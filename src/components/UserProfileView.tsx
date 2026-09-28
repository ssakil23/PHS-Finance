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
} from 'lucide-react';
import { User, Member, ProfileUpdateRequest, OfficialUser } from '../types';
import { storageService } from '../services/storageService';
import { authService } from '../services/authService';

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

  // Password Reset State (System Admin & Delegated Admin)
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState<{
    id: string;
    name: string;
    identifier: string;
    role: string;
    isSakil: boolean;
  } | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('12345679');
  const [resetFeedback, setResetFeedback] = useState<{ error?: string; success?: string }>({});

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

  // Admin Direct Edit Member Modal
  const [directEditMember, setDirectEditMember] = useState<Member | null>(null);
  const [adminName, setAdminName] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminAddress, setAdminAddress] = useState('');
  const [adminStatus, setAdminStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');

  // Modify & Approve Modal
  const [modifyingRequest, setModifyingRequest] = useState<ProfileUpdateRequest | null>(null);
  const [modName, setModName] = useState('');
  const [modPhone, setModPhone] = useState('');
  const [modEmail, setModEmail] = useState('');
  const [modAddress, setModAddress] = useState('');

  // Notification banners
  const [successBanner, setSuccessBanner] = useState('');
  const [errorBanner, setErrorBanner] = useState('');

  const canApproveAndModify =
    currentUser?.role === 'SYSTEM_ADMIN' || currentUser?.role === 'DELEGATED_ADMIN';

  // Find member profile if currentUser is a member or has a linked memberId
  const myMemberId = currentUser?.memberId;
  const myMemberRecord = myMemberId ? members.find((m) => m.id === myMemberId) : null;

  // Initialize edit fields
  const handleOpenMyProfileEdit = () => {
    setEditName(currentUser?.name || myMemberRecord?.name || '');
    setEditPhone(currentUser?.phone || myMemberRecord?.phone || '');
    setEditEmail(currentUser?.email || myMemberRecord?.email || '');
    setEditAddress(myMemberRecord?.address || 'Plot #, Sector 14, Uttara, Dhaka');
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
            address: editAddress,
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
          address: editAddress,
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
    setAdminName(member.name);
    setAdminPhone(member.phone);
    setAdminEmail(member.email);
    setAdminAddress(member.address);
    setAdminStatus(member.status);
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
        address: adminAddress,
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
    setModName(req.proposedName);
    setModPhone(req.proposedPhone);
    setModEmail(req.proposedEmail);
    setModAddress(req.proposedAddress);
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
        address: modAddress,
      }
    );

    setRequests(storageService.getProfileUpdateRequests());
    setModifyingRequest(null);
    setSuccessBanner(`Approved and applied profile changes for Member ${modifyingRequest.memberId}.`);
    setTimeout(() => setSuccessBanner(''), 4000);
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
    const reason = window.prompt('Enter reason for rejecting profile change:') || 'Information verification failed';
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
    setNewPasswordInput('12345679');
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

  const pendingRequests = requests.filter((r) => r.status === 'PENDING');

  // Filter members list for directory
  const filteredMembers = members.filter((m) => {
    if (selectedDirectorFilter !== 'ALL' && m.controllingDirectorName !== selectedDirectorFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = m.name.toLowerCase().includes(q);
      const matchId = m.id.toLowerCase().includes(q);
      const matchPhone = m.phone.toLowerCase().includes(q);
      const matchEmail = m.email.toLowerCase().includes(q);
      return matchName || matchId || matchPhone || matchEmail;
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
              Manage personal credentials, request updates, and allow System Admin & Delegated Admin to Edit, Modify & Approve changes.
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
              <>
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

                <button
                  onClick={() => setActiveSubTab('DIRECTORY')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    activeSubTab === 'DIRECTORY'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Member Directory (144)
                </button>
              </>
            )}

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

      {/* -------------------- TAB 1: MY PROFILE -------------------- */}
      {activeSubTab === 'MY_PROFILE' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-4 pb-4 border-b border-slate-800">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                {currentUser?.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{currentUser?.name}</h3>
                <div className="text-xs text-emerald-400 font-mono mt-0.5">
                  Role: {currentUser?.role}
                </div>
                {currentUser?.ecDesignation && currentUser.ecDesignation !== 'None' && (
                  <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    {currentUser.ecDesignation} (EC)
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Username:</span>
                <span className="font-mono text-slate-200">{currentUser?.username}</span>
              </div>

              {currentUser?.memberId && (
                <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">Shareholder ID:</span>
                  <span className="font-mono font-bold text-emerald-400">{currentUser.memberId}</span>
                </div>
              )}

              {currentUser?.shareNumber && (
                <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">Share Allocation:</span>
                  <span className="font-mono text-slate-200">Share #{currentUser.shareNumber} of 144</span>
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
                <span className="text-slate-200">{currentUser?.phone || myMemberRecord?.phone || 'N/A'}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Email:</span>
                <span className="text-slate-200">{currentUser?.email || myMemberRecord?.email || 'N/A'}</span>
              </div>

              <div className="flex justify-between items-start py-1">
                <span className="text-slate-400">Address / Plot:</span>
                <span className="text-slate-300 text-right max-w-[60%]">
                  {myMemberRecord?.address || 'Sector 14, Uttara Model Town, Dhaka'}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800">
              <button
                onClick={handleOpenMyProfileEdit}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{canApproveAndModify ? 'Edit My Details (Admin Direct)' : 'Request Profile Update'}</span>
              </button>
            </div>
          </div>

          {/* Edit Form or Pending Request Status */}
          <div className="lg:col-span-2 space-y-4">
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
                <div className="grid grid-cols-2 gap-3 bg-slate-950/60 p-3 rounded-xl border border-amber-900/50 text-[11px]">
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
                    <span className="text-slate-400">Proposed Address:</span>
                    <div className="font-semibold text-white">{myMemberRecord.pendingUpdate.address}</div>
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
                    <label className="block text-[11px] text-slate-400 mb-1">Residential / Plot Address</label>
                    <input
                      type="text"
                      required
                      value={editAddress}
                      onChange={(e) => setEditAddress(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
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

      {/* -------------------- TAB 2: APPROVAL QUEUE (Admin & Delegated Admin) -------------------- */}
      {activeSubTab === 'APPROVAL_QUEUE' && canApproveAndModify && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl space-y-4 p-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-400" />
                <span>Pending Profile Change Requests ({pendingRequests.length})</span>
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

      {/* -------------------- TAB 3: MEMBER DIRECTORY & DIRECT EDIT (Admin Only) -------------------- */}
      {activeSubTab === 'DIRECTORY' && canApproveAndModify && (
        <div className="space-y-4">
          {/* Search & Director Filter */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-slate-400">Filter Director:</span>
              <select
                value={selectedDirectorFilter}
                onChange={(e) => setSelectedDirectorFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
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

            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search member, ID, phone, email..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Directory Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Member ID</th>
                    <th className="py-3 px-4">Share #</th>
                    <th className="py-3 px-4">Full Name</th>
                    <th className="py-3 px-4">Controlling Director</th>
                    <th className="py-3 px-4">Phone</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Admin Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredMembers.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-200">
                        {m.id}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-400">
                        #{m.shareNumber}
                      </td>
                      <td className="py-3 px-4 font-medium text-white">
                        <div className="flex items-center gap-1.5">
                          <span>{m.name}</span>
                          {m.pendingUpdate && (
                            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" title="Pending update request" />
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-emerald-400 font-semibold">
                        {m.controllingDirectorName}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {m.phone}
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {m.email}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          {m.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
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
                            className="px-2.5 py-1 bg-slate-800 hover:bg-emerald-600 text-slate-200 hover:text-white rounded text-[11px] font-semibold transition inline-flex items-center gap-1"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Edit / Modify</span>
                          </button>
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
                <button
                  onClick={() => setShowAddOfficialModal(true)}
                  className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold shadow flex items-center gap-1.5 transition self-start sm:self-auto"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Create New Official</span>
                </button>
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
                        <div className="flex items-center justify-end gap-2">
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
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in duration-200">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-emerald-400" />
                <span>Admin Direct Profile Edit: {directEditMember.id}</span>
              </h3>
              <button
                onClick={() => setDirectEditMember(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveDirectEdit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Member Full Name</label>
                <input
                  type="text"
                  required
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={adminPhone}
                    onChange={(e) => setAdminPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Member Status</label>
                  <select
                    value={adminStatus}
                    onChange={(e: any) => setAdminStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Plot / Residence Address</label>
                <textarea
                  rows={2}
                  required
                  value={adminAddress}
                  onChange={(e) => setAdminAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
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
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in duration-200">
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

            <form onSubmit={handleCommitApprovalWithModifications} className="p-6 space-y-4 text-xs">
              <p className="text-slate-300">
                You can adjust or verify the proposed information before committing the official approval.
              </p>

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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Approved Phone</label>
                  <input
                    type="text"
                    required
                    value={modPhone}
                    onChange={(e) => setModPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Approved Email</label>
                  <input
                    type="email"
                    required
                    value={modEmail}
                    onChange={(e) => setModEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Approved Address</label>
                <textarea
                  rows={2}
                  required
                  value={modAddress}
                  onChange={(e) => setModAddress(e.target.value)}
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
                  Authorized by <strong>{currentUser?.name}</strong> ({currentUser?.role === 'SYSTEM_ADMIN' ? 'System Admin' : 'Delegated Admin'}). Initial default system password is <strong className="text-white font-mono">12345679</strong>.
                </span>
              </div>

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
                    onClick={() => setNewPasswordInput('12345679')}
                    className="text-[11px] text-purple-400 hover:text-purple-300 font-mono transition"
                  >
                    Set Default: 12345679
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
                  User can log in immediately with this new password.
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
    </div>
  );
};
