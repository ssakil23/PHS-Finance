import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  Download,
  CheckCircle,
  XCircle,
  Trash2,
  FileText,
  User,
  Building,
  DollarSign,
  AlertCircle,
  Clock,
  Printer,
  FolderTree,
} from 'lucide-react';
import { IncomeEntry, IncomeType, PaymentMethod, UserRole, User as UserType, TransactionTier } from '../types';
import { formatBDT } from '../utils/calculations';
import { storageService } from '../services/storageService';
import {
  parseShareNumberFromMemberId,
  getDirectorForShareNumber,
  formatMemberId,
  TOTAL_SHARES,
} from '../utils/directors';
import { CategoryManagerModal } from './CategoryManagerModal';

interface IncomeModuleProps {
  incomes: IncomeEntry[];
  currentUser: UserType | null;
  onPrintVoucher?: (entry: IncomeEntry) => void;
}

const DEPOSIT_TIERS: TransactionTier[] = ['Tier-1', 'Tier-2', 'Tier-3', 'Tier-4', 'Tier-5'];

const GENERAL_CATEGORIES = [
  'Development Fee - Phase 1',
  'Member Monthly Contribution',
  'Land Filing & Boundary Share',
  'Drainage & Road Infrastructure',
  'Electrical Substation Fund',
  'Plot Installment',
  'Share Transfer Fee',
  'Membership Security Deposit',
  'Other Contribution',
];

const PAYMENT_METHODS: PaymentMethod[] = [
  'Bank Transfer',
  'Cheque',
  'Cash',
  'bKash / Nagad',
  'Pay Order',
];

export const IncomeModule: React.FC<IncomeModuleProps> = ({
  incomes,
  currentUser,
  onPrintVoucher,
}) => {
  const [activeTab, setActiveTab] = useState<'ALL' | 'GENERAL_DEPOSIT' | 'SALES_DEPOSIT'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'APPROVED' | 'PENDING' | 'REJECTED'>('ALL');
  const [tierFilter, setTierFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalType, setModalType] = useState<IncomeType>('GENERAL_DEPOSIT');

  // Categories & Modal State
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [incomeCategories, setIncomeCategories] = useState<string[]>(() => storageService.getIncomeCategories());

  useEffect(() => {
    const unsub = storageService.subscribe(() => {
      setIncomeCategories(storageService.getIncomeCategories());
    });
    return unsub;
  }, []);

  // Form State
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<string>(() => storageService.getIncomeCategories()[0] || 'Development Fee - Phase 1');
  const [depositTier, setDepositTier] = useState<TransactionTier>('Tier-1');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [shareOwnerId, setShareOwnerId] = useState<string>('PHSM-001');
  const [memberName, setMemberName] = useState<string>('Saif Ahmed Sakil');
  const [controllingDirector, setControllingDirector] = useState<string>('SAIF AHMED SAKIL');
  const [salesDescription, setSalesDescription] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Bank Transfer');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');
  const [formError, setFormError] = useState<string>('');

  const canApprove =
    currentUser?.role === 'SYSTEM_ADMIN' || currentUser?.role === 'DELEGATED_ADMIN';
  const canHardDelete = currentUser?.role === 'SYSTEM_ADMIN';
  const canMakeEntry = storageService.isUserEmpoweredForEntry(currentUser);

  // Handle Share Owner change to auto-fetch member name & director
  const handleMemberIdChange = (id: string) => {
    setShareOwnerId(id);
    const member = storageService.getMemberById(id);
    if (member) {
      setMemberName(member.name);
      setControllingDirector(member.controllingDirectorName);
    } else {
      const shareNum = parseShareNumberFromMemberId(id);
      const director = getDirectorForShareNumber(shareNum);
      setControllingDirector(director.name);
      setMemberName(`Member ${id}`);
    }
  };

  // Form Submission
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setFormError('Please enter a valid positive amount.');
      return;
    }

    if (!currentUser) {
      setFormError('No authenticated user session found.');
      return;
    }

    const shareNum = modalType === 'GENERAL_DEPOSIT' ? parseShareNumberFromMemberId(shareOwnerId) : undefined;

    // Managers submit as PENDING; Admins can submit directly as APPROVED
    const initialStatus = (currentUser.role === 'MANAGER') ? 'PENDING' : 'APPROVED';

    storageService.addIncome(
      {
        type: modalType,
        amount: numericAmount,
        category: modalType === 'SALES_DEPOSIT' ? 'Sales' : category,
        tier: depositTier,
        date,
        shareOwnerId: modalType === 'GENERAL_DEPOSIT' ? shareOwnerId : undefined,
        memberName: modalType === 'GENERAL_DEPOSIT' ? memberName : undefined,
        controllingDirector: modalType === 'GENERAL_DEPOSIT' ? controllingDirector : undefined,
        shareNumber: shareNum,
        salesDescription: modalType === 'SALES_DEPOSIT' ? salesDescription : undefined,
        paymentMethod,
        referenceNumber,
        remarks,
        submitterId: currentUser.id,
        submitterName: currentUser.name,
        submitterRole: currentUser.role,
        status: initialStatus,
        approvedBy: initialStatus === 'APPROVED' ? currentUser.id : undefined,
        approvedByName: initialStatus === 'APPROVED' ? currentUser.name : undefined,
        approvedAt: initialStatus === 'APPROVED' ? new Date().toISOString() : undefined,
      },
      currentUser
    );

    // Reset Form
    setShowAddModal(false);
    setAmount('');
    setDepositTier('Tier-1');
    setReferenceNumber('');
    setRemarks('');
    setSalesDescription('');
  };

  // Actions
  const handleApprove = (id: string) => {
    if (!currentUser) return;
    storageService.setIncomeStatus(id, 'APPROVED', currentUser);
  };

  const handleReject = (id: string) => {
    if (!currentUser) return;
    let reason = 'Documentation incomplete or audit discrepancy';
    try {
      const input = window.prompt('Please enter the reason for rejection:');
      if (input !== null && input.trim()) {
        reason = input.trim();
      } else if (input === null) {
        return; // User clicked Cancel
      }
    } catch {
      // Sandbox fallback
    }
    storageService.setIncomeStatus(id, 'REJECTED', currentUser, reason);
  };

  const handleSoftDelete = (id: string) => {
    if (!currentUser) return;
    try {
      if (!window.confirm('Are you sure you want to soft-delete this income record?')) {
        return;
      }
    } catch {
      // Sandbox fallback
    }
    storageService.softDeleteIncome(id, currentUser);
  };

  const handleHardDelete = (id: string) => {
    if (!currentUser) return;
    try {
      if (!window.confirm('ROOT WARNING: Are you sure you want to permanently delete this record from the database? This cannot be undone.')) {
        return;
      }
    } catch {
      // Sandbox fallback
    }
    storageService.hardDeleteIncome(id, currentUser);
  };

  const handleExportCSV = () => {
    const csvContent = storageService.exportIncomesCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `PHS_Income_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getDepositTierBadge = (tier?: string) => {
    switch (tier) {
      case 'Tier-1': return 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60';
      case 'Tier-2': return 'bg-teal-950/80 text-teal-300 border-teal-700/60';
      case 'Tier-3': return 'bg-cyan-950/80 text-cyan-300 border-cyan-700/60';
      case 'Tier-4': return 'bg-amber-950/80 text-amber-300 border-amber-700/60';
      case 'Tier-5': return 'bg-purple-950/80 text-purple-300 border-purple-700/60';
      default: return 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60';
    }
  };

  // Filtered List
  const filteredIncomes = incomes.filter((item) => {
    if (item.isSoftDeleted) return false;
    if (activeTab !== 'ALL' && item.type !== activeTab) return false;
    if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
    if (tierFilter !== 'ALL' && (item.tier || 'Tier-1') !== tierFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = item.id.toLowerCase().includes(q);
      const matchMember = item.memberName?.toLowerCase().includes(q);
      const matchMemberId = item.shareOwnerId?.toLowerCase().includes(q);
      const matchDirector = item.controllingDirector?.toLowerCase().includes(q);
      const matchDesc = item.salesDescription?.toLowerCase().includes(q);
      const matchRef = item.referenceNumber?.toLowerCase().includes(q);
      return matchId || matchMember || matchMemberId || matchDirector || matchDesc || matchRef;
    }

    return true;
  });

  const totalFilteredAmount = filteredIncomes
    .filter((i) => i.status === 'APPROVED')
    .reduce((sum, i) => sum + i.amount, 0);

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Income & Collections Ledger</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            General Deposits (144 Share Owners) & Sales Deposits into Society Central Accounts
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {currentUser?.role === 'SYSTEM_ADMIN' && (
            <button
              onClick={() => setShowCategoryModal(true)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow"
              title="System Admin: Edit / Modify Income & Expense Categories"
            >
              <FolderTree className="w-3.5 h-3.5 text-emerald-400" />
              <span>Income Categories</span>
            </button>
          )}
          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>
          {canMakeEntry ? (
            <>
              <button
                onClick={() => {
                  setModalType('GENERAL_DEPOSIT');
                  setShowAddModal(true);
                }}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow flex items-center gap-1.5 transition"
              >
                <Plus className="w-4 h-4" />
                <span>New General Deposit</span>
              </button>
              <button
                onClick={() => {
                  setModalType('SALES_DEPOSIT');
                  setShowAddModal(true);
                }}
                className="px-3.5 py-1.5 bg-teal-700 hover:bg-teal-600 text-white rounded-lg text-xs font-semibold shadow flex items-center gap-1.5 transition"
              >
                <Plus className="w-4 h-4" />
                <span>New Sales Deposit</span>
              </button>
            </>
          ) : (
            <div
              title="Entry Access Restricted: Only empowered Officials (authorized by System Admin) can make entries"
              className="px-3 py-1.5 bg-slate-800/80 border border-slate-700/80 rounded-lg text-xs text-slate-400 font-medium flex items-center gap-1.5 cursor-not-allowed"
            >
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>Entry Restricted (Empowered Officials Only)</span>
            </div>
          )}
        </div>
      </div>

      {!canMakeEntry && (
        <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-300 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Entry Policy:</strong> Official User & Only System Admin can put Entry Data (Record Income, Record Expense). System Admin & Delegated Admin can Authorise Entries made by Officials.
            </span>
          </div>
          <span className="text-[11px] text-amber-400/80 font-mono shrink-0">Official / System Admin Entry Only</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Type Tabs */}
        <div className="flex items-center space-x-1 w-full md:w-auto overflow-x-auto">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTab === 'ALL'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Incomes
          </button>
          <button
            onClick={() => setActiveTab('GENERAL_DEPOSIT')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTab === 'GENERAL_DEPOSIT'
                ? 'bg-emerald-900/60 text-emerald-300 font-semibold border border-emerald-700/60'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            General Deposits (144 Shares)
          </button>
          <button
            onClick={() => setActiveTab('SALES_DEPOSIT')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTab === 'SALES_DEPOSIT'
                ? 'bg-teal-900/60 text-teal-300 font-semibold border border-teal-700/60'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sales Deposits
          </button>
        </div>

        {/* Status & Tier Filter & Search Input */}
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e: any) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="APPROVED">Approved Only</option>
            <option value="PENDING">Pending Verification</option>
            <option value="REJECTED">Rejected</option>
          </select>

          <select
            value={tierFilter}
            onChange={(e: any) => setTierFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-emerald-500 font-semibold"
          >
            <option value="ALL">All Deposit Tiers</option>
            {DEPOSIT_TIERS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search member, ID, director, ref..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Deposit ID</th>
                <th className="py-3 px-3 text-center">Deposit Tier</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Type & Category</th>
                <th className="py-3 px-4">Member / Source</th>
                <th className="py-3 px-4">Controlling Director</th>
                <th className="py-3 px-4">Payment Method & Ref</th>
                <th className="py-3 px-4 text-right">Amount (BDT)</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredIncomes.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-500 text-xs">
                    No income records match your filters.
                  </td>
                </tr>
              ) : (
                filteredIncomes.map((item) => {
                  const isSales = item.type === 'SALES_DEPOSIT';
                  const isApproved = item.status === 'APPROVED';
                  const isPending = item.status === 'PENDING';
                  const isRejected = item.status === 'REJECTED';

                  return (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-200">
                        {item.id}
                      </td>

                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${getDepositTierBadge(item.tier)}`}>
                          {item.tier || 'Tier-1'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                        {item.date}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-200">{item.category}</div>
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.2 rounded inline-block mt-0.5 ${
                            isSales
                              ? 'bg-teal-950 text-teal-300 border border-teal-800'
                              : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          }`}
                        >
                          {isSales ? 'Sales Deposit' : 'General Share Deposit'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {isSales ? (
                          <div className="text-slate-300 italic">{item.salesDescription || 'Sales Item'}</div>
                        ) : (
                          <div>
                            <div className="font-semibold text-slate-200">{item.memberName}</div>
                            <div className="text-[11px] text-emerald-400 font-mono">
                              {item.shareOwnerId} (Share #{item.shareNumber})
                            </div>
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-300">
                        {item.controllingDirector || 'N/A'}
                      </td>

                      <td className="py-3.5 px-4 text-slate-400">
                        <div className="text-slate-200 font-medium">{item.paymentMethod}</div>
                        {item.referenceNumber && (
                          <div className="text-[10px] font-mono text-slate-400">
                            Ref: {item.referenceNumber}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400">
                        {formatBDT(item.amount)}
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            isApproved
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : isPending
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Print Slip */}
                          {onPrintVoucher && (
                            <button
                              onClick={() => onPrintVoucher(item)}
                              title="Print Deposit Voucher Receipt"
                              className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Approval Actions for Admin/Delegated Admin */}
                          {canApprove && isPending && (
                            <>
                              <button
                                onClick={() => handleApprove(item.id)}
                                title="Approve Deposit"
                                className="p-1 hover:bg-emerald-950/80 text-emerald-400 rounded transition"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleReject(item.id)}
                                title="Reject Deposit"
                                className="p-1 hover:bg-rose-950/80 text-rose-400 rounded transition"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}

                          {/* Soft Delete */}
                          {canApprove && (
                            <button
                              onClick={() => handleSoftDelete(item.id)}
                              title="Soft Delete (Archive)"
                              className="p-1 hover:bg-slate-800 text-slate-500 hover:text-amber-400 rounded transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Hard Delete Root only */}
                          {canHardDelete && (
                            <button
                              onClick={() => handleHardDelete(item.id)}
                              title="Hard Purge (System Admin only)"
                              className="p-1 hover:bg-rose-950/80 text-slate-600 hover:text-rose-500 rounded transition"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            <tfoot className="bg-slate-950 font-semibold text-slate-200 border-t border-slate-800 text-xs">
              <tr>
                <td colSpan={6} className="py-3 px-4 font-bold text-slate-300">
                  Approved Total Filtered
                </td>
                <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                  {formatBDT(totalFilteredAmount)}
                </td>
                <td colSpan={2} className="py-3 px-4 text-right text-slate-500 text-[11px]">
                  {filteredIncomes.length} records shown
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Add Income Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden animate-in fade-in duration-200">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Record New {modalType === 'SALES_DEPOSIT' ? 'Sales Deposit' : 'General Deposit'}</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Type Switcher in Modal */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalType('GENERAL_DEPOSIT')}
                  className={`py-1.5 rounded text-xs font-semibold transition ${
                    modalType === 'GENERAL_DEPOSIT'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  General Member Deposit (144 Shares)
                </button>
                <button
                  type="button"
                  onClick={() => setModalType('SALES_DEPOSIT')}
                  className={`py-1.5 rounded text-xs font-semibold transition ${
                    modalType === 'SALES_DEPOSIT'
                      ? 'bg-teal-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Sales Deposit (Land/Asset)
                </button>
              </div>

              {/* Deposit ID & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    Deposit ID (Auto-Generated)
                  </label>
                  <input
                    type="text"
                    disabled
                    value={`DEP-${new Date().getFullYear()}-${String(incomes.length + 1).padStart(3, '0')}`}
                    className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-lg text-xs font-mono text-emerald-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Date & Time</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* General Deposit: Member ID & Auto-fetch fields */}
              {modalType === 'GENERAL_DEPOSIT' ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">
                        Share Owner ID (PHSM-001 to PHSM-144)
                      </label>
                      <select
                        value={shareOwnerId}
                        onChange={(e) => handleMemberIdChange(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                      >
                        {Array.from({ length: TOTAL_SHARES }, (_, i) => formatMemberId(i + 1)).map((id) => (
                          <option key={id} value={id}>
                            {id}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">
                        Member Name (Auto-Fetched)
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={memberName}
                        className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-lg text-xs text-slate-200"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      Controlling Director (Auto-Selected based on reference share range)
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={controllingDirector}
                      className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-lg text-xs font-semibold text-emerald-400"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] text-slate-400">Category</label>
                      {currentUser?.role === 'SYSTEM_ADMIN' && (
                        <button
                          type="button"
                          onClick={() => setShowCategoryModal(true)}
                          className="text-[10px] text-emerald-400 hover:underline flex items-center gap-0.5"
                        >
                          <FolderTree className="w-3 h-3" />
                          <span>Edit Categories</span>
                        </button>
                      )}
                    </div>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                      {incomeCategories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              ) : (
                /* Sales Deposit fields */
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Description of Sale</label>
                  <textarea
                    rows={2}
                    required
                    value={salesDescription}
                    onChange={(e) => setSalesDescription(e.target.value)}
                    placeholder="e.g. Sale of Commercial Corner Plot #04 Booking Advance, or Scrap Materials"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              {/* Deposit Tier Selection */}
              <div>
                <label className="block text-[11px] text-slate-400 mb-1 font-semibold">
                  Deposit Tier (Tier-1 to Tier-5)
                </label>
                <select
                  value={depositTier}
                  onChange={(e: any) => setDepositTier(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-semibold text-white focus:outline-none focus:border-emerald-500"
                >
                  {DEPOSIT_TIERS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount (BDT) & Payment Method */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Amount (BDT ৳)</label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g. 150000"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e: any) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    {PAYMENT_METHODS.map((pm) => (
                      <option key={pm} value={pm}>
                        {pm}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Reference Number & Remarks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    Reference / Cheque / Trx No
                  </label>
                  <input
                    type="text"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    placeholder="e.g. DBBL-TRX-102948"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Remarks</label>
                  <input
                    type="text"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Optional notes or receipt notes"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Submitter Note */}
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                <span>
                  Submitter: <strong className="text-slate-200">{currentUser?.name}</strong> ({currentUser?.role})
                </span>
                <span className="text-emerald-400">
                  {currentUser?.role === 'MANAGER' ? 'Status: Pending Verification' : 'Status: Approved'}
                </span>
              </div>

              {/* Form Buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow transition"
                >
                  Commit Deposit Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Category Manager Modal for System Admin */}
      <CategoryManagerModal
        isOpen={showCategoryModal}
        onClose={() => {
          setShowCategoryModal(false);
          setIncomeCategories(storageService.getIncomeCategories());
        }}
        currentUser={currentUser}
        initialTab="INCOME"
        incomes={incomes}
        expenses={storageService.getExpenses()}
      />
    </div>
  );
};
