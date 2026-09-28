import React, { useState } from 'react';
import {
  Vote,
  Award,
  DollarSign,
  ShieldCheck,
  CheckCircle2,
  Users,
  Calendar,
  AlertCircle,
  FileCheck,
  Building,
  Edit2,
  Save,
  UserPlus,
  Trash2,
  Lock,
  Unlock,
} from 'lucide-react';
import { ExecutiveCommittee, ElectionPoll, User, Member, PromotedECMember } from '../types';
import { formatBDT } from '../utils/calculations';
import { storageService } from '../services/storageService';
import { TOTAL_SHARES } from '../utils/directors';

interface ECGovernanceViewProps {
  currentUser: User | null;
  members: Member[];
}

export const ECGovernanceView: React.FC<ECGovernanceViewProps> = ({
  currentUser,
  members,
}) => {
  const [ec, setEc] = useState<ExecutiveCommittee>(storageService.getExecutiveCommittee());
  const [poll, setPoll] = useState<ElectionPoll>(storageService.getElectionPoll());

  // Editing honorariums (Admin only)
  const [isEditingHonorariums, setIsEditingHonorariums] = useState(false);
  const [presidentHon, setPresidentHon] = useState(ec.president.honorariumBDT.toString());
  const [vpHon, setVpHon] = useState((ec.vicePresident?.honorariumBDT || 25000).toString());
  const [gsHon, setGsHon] = useState(ec.generalSecretary.honorariumBDT.toString());
  const [treasurerHon, setTreasurerHon] = useState(ec.treasurer.honorariumBDT.toString());

  // Promote Member Modal state (System Admin only)
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [promoteMemberId, setPromoteMemberId] = useState('PHSM-002');
  const [promoteDesignation, setPromoteDesignation] = useState('Joint Secretary');
  const [promoteHonorarium, setPromoteHonorarium] = useState('18000');

  const [saveSuccess, setSaveSuccess] = useState('');
  const [voteSuccess, setVoteSuccess] = useState('');
  const [voteError, setVoteError] = useState('');

  const isSystemAdmin = currentUser?.role === 'SYSTEM_ADMIN';
  const canManageEC = currentUser?.role === 'SYSTEM_ADMIN' || currentUser?.role === 'DELEGATED_ADMIN';
  const memberId = currentUser?.memberId;
  const hasVoted = memberId ? Boolean(poll.voters[memberId]) : false;
  const votedCandidateId = memberId ? poll.voters[memberId] : null;

  const totalVotesCast = Object.keys(poll.voters).length;
  const voterTurnoutPct = (totalVotesCast / TOTAL_SHARES) * 100;

  const handleSaveHonorariums = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !canManageEC) return;

    const updated: ExecutiveCommittee = {
      ...ec,
      president: { ...ec.president, honorariumBDT: parseFloat(presidentHon) || 0 },
      vicePresident: ec.vicePresident
        ? { ...ec.vicePresident, honorariumBDT: parseFloat(vpHon) || 0 }
        : { name: 'M Omar Faruque Molla', memberId: 'PHSM-049', honorariumBDT: parseFloat(vpHon) || 25000, phone: '+8801811334455', designation: 'VICE PRESIDENT (VP)' },
      generalSecretary: { ...ec.generalSecretary, honorariumBDT: parseFloat(gsHon) || 0 },
      treasurer: { ...ec.treasurer, honorariumBDT: parseFloat(treasurerHon) || 0 },
      lastUpdated: new Date().toISOString(),
    };

    storageService.updateExecutiveCommittee(updated, currentUser);
    setEc(updated);
    setIsEditingHonorariums(false);
    setSaveSuccess('Executive honorarium schedule updated and logged in system audit.');
    setTimeout(() => setSaveSuccess(''), 3000);
  };

  const handleToggleElectionActivation = () => {
    if (!currentUser || !isSystemAdmin) return;
    setVoteError('');
    setVoteSuccess('');

    if (poll.isActivatedByAdmin) {
      storageService.deactivateElection(currentUser);
      setPoll(storageService.getElectionPoll());
      setSaveSuccess('Election module paused/deactivated by System Admin. Voting is now CLOSED.');
    } else {
      storageService.activateElection(currentUser);
      setPoll(storageService.getElectionPoll());
      setSaveSuccess('Election module successfully activated by System Admin! Voting is now OPEN to all 144 shareholders.');
    }
    setTimeout(() => setSaveSuccess(''), 4000);
  };

  const handlePromoteMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !isSystemAdmin) return;
    setVoteError('');
    setVoteSuccess('');

    try {
      storageService.promoteMemberToEC(
        promoteMemberId,
        promoteDesignation,
        parseFloat(promoteHonorarium) || 0,
        currentUser
      );
      setEc(storageService.getExecutiveCommittee());
      setShowPromoteModal(false);
      setSaveSuccess(`Member ${promoteMemberId} successfully appointed as ${promoteDesignation} with monthly honorarium ৳ ${parseFloat(promoteHonorarium || '0').toLocaleString()}.`);
      setTimeout(() => setSaveSuccess(''), 4000);
    } catch (err: any) {
      setVoteError(err.message);
      setTimeout(() => setVoteError(''), 4000);
    }
  };

  const handleRemovePromotion = (promotionId: string) => {
    if (!currentUser || !isSystemAdmin) return;
    if (window.confirm('Are you sure you want to remove this appointed EC member?')) {
      storageService.removePromotedECMember(promotionId, currentUser);
      setEc(storageService.getExecutiveCommittee());
      setSaveSuccess('Appointed EC member removed from committee.');
      setTimeout(() => setSaveSuccess(''), 3000);
    }
  };

  const handleCastVote = (candidateId: string) => {
    if (!currentUser) return;
    setVoteError('');
    setVoteSuccess('');

    if (!poll.isActivatedByAdmin || poll.status !== 'ACTIVE') {
      setVoteError('Voting is currently inactive. No Voting Until Election Module activated by System Admin.');
      return;
    }

    if (!memberId) {
      setVoteError('Only registered share owners with valid Member ID (PHSM-001 to PHSM-144) can cast election ballots.');
      return;
    }

    if (hasVoted) {
      setVoteError('You have already cast your official vote in this election.');
      return;
    }

    const success = storageService.castVote(candidateId, memberId, currentUser);
    if (success) {
      setPoll(storageService.getElectionPoll());
      setVoteSuccess(`Ballot cast successfully! Verified against Share ID ${memberId}.`);
      setTimeout(() => setVoteSuccess(''), 4000);
    } else {
      setVoteError('Unable to cast ballot. Either already voted or election is closed.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60">
                Democratic Governance & Executive Authority
              </span>
              <span className="text-xs text-slate-400 font-mono">Term: {ec.termYear}</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-400" />
              <span>Executive Committee (EC) Governance & Election</span>
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Honorarium administration, democratic elections, and official appointments for 144 registered shareholders.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isSystemAdmin && (
              <button
                onClick={() => setShowPromoteModal(true)}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Promote Member as EC Member</span>
              </button>
            )}

            {canManageEC && (
              <button
                onClick={() => setIsEditingHonorariums(!isEditingHonorariums)}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Edit2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isEditingHonorariums ? 'Cancel Edit' : 'Edit EC Honorariums'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {/* EC Leadership Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* President */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
              President
            </span>
            <span className="text-xs font-mono text-slate-400">{ec.president.memberId}</span>
          </div>
          <h3 className="text-base font-bold text-white">{ec.president.name}</h3>
          <p className="text-[11px] text-slate-400 mt-1">Applied Statistics, ISRT, DU | Root System Admin</p>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">Monthly Honorarium:</span>
            <span className="font-mono font-bold text-emerald-400">
              {formatBDT(ec.president.honorariumBDT)}
            </span>
          </div>
        </div>

        {/* Vice President (VP) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
              VICE PRESIDENT (VP)
            </span>
            <span className="text-xs font-mono text-slate-400">{ec.vicePresident?.memberId || 'PHSM-049'}</span>
          </div>
          <h3 className="text-base font-bold text-white">{ec.vicePresident?.name || 'M Omar Faruque Molla'}</h3>
          <p className="text-[11px] text-slate-400 mt-1">Executive Leadership & Strategic Policy | Designated Director</p>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">Monthly Honorarium:</span>
            <span className="font-mono font-bold text-emerald-400">
              {formatBDT(ec.vicePresident?.honorariumBDT ?? 25000)}
            </span>
          </div>
        </div>

        {/* General Secretary */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
              General Secretary
            </span>
            <span className="text-xs font-mono text-slate-400">{ec.generalSecretary.memberId}</span>
          </div>
          <h3 className="text-base font-bold text-white">{ec.generalSecretary.name}</h3>
          <p className="text-[11px] text-slate-400 mt-1">Executive Management & Society Operations | Designated Director</p>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">Monthly Honorarium:</span>
            <span className="font-mono font-bold text-emerald-400">
              {formatBDT(ec.generalSecretary.honorariumBDT)}
            </span>
          </div>
        </div>

        {/* Treasurer */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
              TREASURER
            </span>
            <span className="text-xs font-mono text-slate-400">{ec.treasurer.memberId}</span>
          </div>
          <h3 className="text-base font-bold text-white">{ec.treasurer.name}</h3>
          <p className="text-[11px] text-slate-400 mt-1">Audit, Escrow & Financial Compliance | Designated Director</p>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">Monthly Honorarium:</span>
            <span className="font-mono font-bold text-emerald-400">
              {formatBDT(ec.treasurer.honorariumBDT)}
            </span>
          </div>
        </div>
      </div>

      {/* Promoted EC Members Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              <span>Additional Promoted EC Members (System Admin Appointed)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Only System Admin has root authority to promote any General Member to an official EC designation.
            </p>
          </div>
          {isSystemAdmin ? (
            <button
              onClick={() => setShowPromoteModal(true)}
              className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Promote New Member</span>
            </button>
          ) : (
            <span className="text-[11px] text-slate-500 italic">
              Promotion managed exclusively by System Admin
            </span>
          )}
        </div>

        {ec.additionalECMembers && ec.additionalECMembers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ec.additionalECMembers.map((member) => (
              <div
                key={member.id}
                className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                      {member.designation}
                    </span>
                    <span className="text-xs font-mono text-emerald-400 bg-slate-900 px-1.5 py-0.5 rounded">
                      {member.memberId}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white">{member.name}</h4>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Phone: {member.phone}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Appointed: {new Date(member.appointedAt).toLocaleDateString('en-GB')} by {member.appointedBy}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Monthly Honorarium:</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {formatBDT(member.honorariumBDT)}
                    </span>
                  </div>

                  {isSystemAdmin && (
                    <button
                      onClick={() => handleRemovePromotion(member.id)}
                      title="Remove EC Appointment"
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-xs text-slate-500">
            No additional EC members promoted yet. System Admin can appoint members as needed.
          </div>
        )}
      </div>

      {/* Honorarium Editor (When toggled by Admin) */}
      {isEditingHonorariums && (
        <form onSubmit={handleSaveHonorariums} className="bg-slate-900 border border-emerald-800/80 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span>Update Monthly Honorariums Schedule (BDT ৳)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">President Honorarium (BDT)</label>
              <input
                type="number"
                min="0"
                value={presidentHon}
                onChange={(e) => setPresidentHon(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Vice President (VP) (BDT)</label>
              <input
                type="number"
                min="0"
                value={vpHon}
                onChange={(e) => setVpHon(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">General Secretary Honorarium (BDT)</label>
              <input
                type="number"
                min="0"
                value={gsHon}
                onChange={(e) => setGsHon(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Treasurer Honorarium (BDT)</label>
              <input
                type="number"
                min="0"
                value={treasurerHon}
                onChange={(e) => setTreasurerHon(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsEditingHonorariums(false)}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save & Publish Changes</span>
            </button>
          </div>
        </form>
      )}

      {/* Live EC Ballot Election Station */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Official Ballot
              </span>
              <span className="text-xs text-slate-400 font-mono">1 Share = 1 Official Vote</span>

              {/* Activation status badge */}
              {poll.isActivatedByAdmin ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700">
                  <Unlock className="w-3 h-3 text-emerald-400" />
                  <span>Voting Open</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-700">
                  <Lock className="w-3 h-3 text-amber-400" />
                  <span>Module Inactive (No Voting)</span>
                </span>
              )}
            </div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Vote className="w-5 h-5 text-emerald-400" />
              <span>{poll.title}</span>
            </h3>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">{poll.description}</p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:border-l sm:border-slate-800 sm:pl-6">
            {/* System Admin Activation Toggle Button */}
            {isSystemAdmin && (
              <button
                onClick={handleToggleElectionActivation}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow ${
                  poll.isActivatedByAdmin
                    ? 'bg-rose-900/80 hover:bg-rose-800 text-rose-200 border border-rose-700'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900'
                }`}
              >
                {poll.isActivatedByAdmin ? (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>Deactivate / Pause Election</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Activate Election Module</span>
                  </>
                )}
              </button>
            )}

            {/* Turnout metrics */}
            <div className="text-right">
              <div className="text-xs text-slate-400">Total Voter Turnout</div>
              <div className="text-xl font-bold text-white font-mono">
                {totalVotesCast} / {TOTAL_SHARES} Shares
              </div>
              <div className="text-[11px] text-emerald-400 font-semibold">
                {voterTurnoutPct.toFixed(1)}% Participation
              </div>
            </div>
          </div>
        </div>

        {/* STRICT BANNER: No Voting Until Election Module activated by System Admin */}
        {!poll.isActivatedByAdmin && (
          <div className="p-4 rounded-xl bg-amber-950/50 border border-amber-800/80 text-amber-200 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <span className="font-bold text-amber-300 block">
                  Voting Inactive: No Voting Until Election Module activated by System Admin.
                </span>
                <span className="text-[11px] text-amber-300/80 mt-0.5 block">
                  Ballot casting is strictly locked. The System Admin must activate this election station before votes can be registered.
                </span>
              </div>
            </div>
            {isSystemAdmin && (
              <button
                onClick={handleToggleElectionActivation}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-lg text-xs shrink-0 transition"
              >
                Activate Now
              </button>
            )}
          </div>
        )}

        {voteSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{voteSuccess}</span>
          </div>
        )}

        {voteError && (
          <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{voteError}</span>
          </div>
        )}

        {/* Candidates List with Vote Buttons and Progress Bars */}
        <div className="space-y-4">
          {poll.candidates.map((cand) => {
            const candVotePct = totalVotesCast > 0 ? (cand.votes / totalVotesCast) * 100 : 0;
            const isMyVotedCandidate = votedCandidateId === cand.id;

            return (
              <div
                key={cand.id}
                className={`p-5 rounded-xl border transition-all ${
                  isMyVotedCandidate
                    ? 'bg-emerald-950/30 border-emerald-500 shadow-md ring-1 ring-emerald-500/50'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-bold text-white">{cand.name}</h4>
                      <span className="text-xs font-mono text-emerald-400 bg-emerald-950 px-1.5 py-0.2 rounded border border-emerald-800">
                        {cand.memberId}
                      </span>
                      {isMyVotedCandidate && (
                        <span className="text-[10px] font-bold bg-emerald-500 text-slate-950 px-2 py-0.5 rounded-full uppercase">
                          Your Cast Vote ✓
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 mt-1 italic leading-relaxed">
                      "{cand.manifesto}"
                    </p>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <div className="text-lg font-bold font-mono text-white">{cand.votes} Votes</div>
                      <div className="text-[11px] text-slate-400">{candVotePct.toFixed(1)}% of ballots</div>
                    </div>

                    <button
                      onClick={() => handleCastVote(cand.id)}
                      disabled={!poll.isActivatedByAdmin || hasVoted}
                      title={!poll.isActivatedByAdmin ? 'Voting locked until activated by System Admin' : undefined}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition shadow ${
                        isMyVotedCandidate
                          ? 'bg-emerald-600 text-white cursor-default'
                          : !poll.isActivatedByAdmin
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                          : hasVoted
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950'
                      }`}
                    >
                      {isMyVotedCandidate
                        ? 'Voted'
                        : !poll.isActivatedByAdmin
                        ? 'Voting Inactive'
                        : hasVoted
                        ? 'Ballot Cast'
                        : 'Vote Candidate'}
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      isMyVotedCandidate ? 'bg-emerald-400' : 'bg-slate-400'
                    }`}
                    style={{ width: `${Math.max(2, candVotePct)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Member voter status badge */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
          <div>
            <span>Active Voter ID: </span>
            <strong className="text-white font-mono">
              {currentUser?.memberId || `${currentUser?.name} (${currentUser?.role})`}
            </strong>
            <span className="text-slate-500 mx-2">|</span>
            <span>Election Status: <strong className={poll.isActivatedByAdmin ? 'text-emerald-400' : 'text-amber-400'}>{poll.isActivatedByAdmin ? 'ACTIVE (VOTING OPEN)' : 'INACTIVE (LOCKED)'}</strong></span>
          </div>

          <div>
            {hasVoted ? (
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Secret ballot recorded in system audit log</span>
              </span>
            ) : !poll.isActivatedByAdmin ? (
              <span className="text-amber-400 font-medium">
                Voting closed. Awaiting System Admin activation.
              </span>
            ) : memberId ? (
              <span className="text-amber-400 font-medium">
                You have not cast your ballot yet. Select your candidate above.
              </span>
            ) : (
              <span className="text-slate-400">
                Log in as a member (e.g. PHSM-007) to cast a vote.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* System Admin Promotion Modal */}
      {showPromoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in duration-200">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-400" />
                <span>Promote Member to EC (Root Admin)</span>
              </h3>
              <button
                onClick={() => setShowPromoteModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePromoteMemberSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Select General Member (144 Registry)</label>
                <select
                  value={promoteMemberId}
                  onChange={(e) => setPromoteMemberId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono"
                >
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.id} - {m.name} (Share #{m.shareNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Executive Committee Designation</label>
                <select
                  value={promoteDesignation}
                  onChange={(e) => setPromoteDesignation(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                >
                  <option value="Vice President">Vice President</option>
                  <option value="Joint Secretary">Joint Secretary</option>
                  <option value="Organizing Secretary">Organizing Secretary</option>
                  <option value="Finance Secretary">Finance Secretary</option>
                  <option value="Planning & Development Secretary">Planning & Development Secretary</option>
                  <option value="Publicity Secretary">Publicity Secretary</option>
                  <option value="Executive Committee Member">Executive Committee Member</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Monthly Honorarium (BDT ৳)</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={promoteHonorarium}
                  onChange={(e) => setPromoteHonorarium(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono"
                  placeholder="e.g. 20000"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400">
                Rule Check: Only System Admin has authority to nominate and promote any member as an EC Member.
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPromoteModal(false)}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold shadow"
                >
                  Confirm Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
