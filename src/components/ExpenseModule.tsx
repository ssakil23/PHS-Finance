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
  DollarSign,
  AlertCircle,
  Receipt,
  Printer,
  ShieldCheck,
  FolderTree,
  Upload,
  Paperclip,
  X,
} from 'lucide-react';
import { ExpenseEntry, User as UserType, TransactionTier, EntryAttachment } from '../types';
import { formatBDT } from '../utils/calculations';
import { storageService } from '../services/storageService';
import { CategoryManagerModal } from './CategoryManagerModal';
import { ExpenseCSVImportModal } from './ExpenseCSVImportModal';
import { EntryAttachmentModal } from './EntryAttachmentModal';

interface ExpenseModuleProps {
  expenses: ExpenseEntry[];
  currentUser: UserType | null;
  onPrintVoucher?: (entry: ExpenseEntry) => void;
}

const EXPENSE_TIERS: TransactionTier[] = ['Tier-1', 'Tier-2', 'Tier-3', 'Tier-4', 'Tier-5'];

const EXPENSE_CATEGORIES: ExpenseEntry['category'][] = [
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

export const ExpenseModule: React.FC<ExpenseModuleProps> = ({
  expenses,
  currentUser,
  onPrintVoucher,
}) => {
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'APPROVED' | 'PENDING' | 'REJECTED'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [tierFilter, setTierFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCSVImportModal, setShowCSVImportModal] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string>('');

  // Dynamic Categories & Modal
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [expenseCategories, setExpenseCategories] = useState<string[]>(() => storageService.getExpenseCategories());

  useEffect(() => {
    const unsub = storageService.subscribe(() => {
      setExpenseCategories(storageService.getExpenseCategories());
    });
    return unsub;
  }, []);

  // Form State
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<string>(() => storageService.getExpenseCategories()[0] || 'Site Development');
  const [expenseTier, setExpenseTier] = useState<TransactionTier>('Tier-1');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [billRecipient, setBillRecipient] = useState<string>('');
  const [voucherNumber, setVoucherNumber] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');
  const [formError, setFormError] = useState<string>('');

  // Attachment Management States
  const [selectedAttachmentEntry, setSelectedAttachmentEntry] = useState<ExpenseEntry | null>(null);
  const [formAttachments, setFormAttachments] = useState<Omit<EntryAttachment, 'id' | 'uploadedAt'>[]>([]);
  const [formAttachmentType, setFormAttachmentType] = useState<EntryAttachment['documentType']>('Voucher');
  const [formAttachmentNote, setFormAttachmentNote] = useState<string>('');
  const formAttachmentInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleFormFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setFormError(`Attachment exceeds 5MB limit (${(file.size / (1024 * 1024)).toFixed(1)} MB).`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setFormAttachments((prev) => [
          ...prev,
          {
            name: file.name,
            size: file.size,
            type: file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
            dataUrl,
            uploadedBy: currentUser?.username || currentUser?.id || 'staff',
            uploadedByName: currentUser?.name || 'Staff User',
            documentType: formAttachmentType,
            note: formAttachmentNote.trim() || undefined,
          },
        ]);
        setFormAttachmentNote('');
        if (formAttachmentInputRef.current) formAttachmentInputRef.current.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  const removeFormAttachment = (index: number) => {
    setFormAttachments((prev) => prev.filter((_, idx) => idx !== index));
  };

  const canApprove =
    currentUser?.role === 'SYSTEM_ADMIN' || currentUser?.role === 'DELEGATED_ADMIN';
  const canHardDelete = currentUser?.role === 'SYSTEM_ADMIN';
  const canMakeEntry = storageService.isUserEmpoweredForEntry(currentUser);

  const getExpenseTierBadge = (tier?: string) => {
    switch (tier) {
      case 'Tier-1': return 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60';
      case 'Tier-2': return 'bg-teal-950/80 text-teal-300 border-teal-700/60';
      case 'Tier-3': return 'bg-cyan-950/80 text-cyan-300 border-cyan-700/60';
      case 'Tier-4': return 'bg-amber-950/80 text-amber-300 border-amber-700/60';
      case 'Tier-5': return 'bg-purple-950/80 text-purple-300 border-purple-700/60';
      default: return 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60';
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setFormError('Please enter a valid positive expense amount.');
      return;
    }

    if (!billRecipient.trim()) {
      setFormError('Bill Recipient / Payee Name is required.');
      return;
    }

    if (!currentUser) {
      setFormError('No authenticated user session found.');
      return;
    }

    const initialStatus = (currentUser.role === 'MANAGER') ? 'PENDING' : 'APPROVED';

    storageService.addExpense(
      {
        tier: expenseTier,
        amount: numericAmount,
        category,
        date,
        submitterId: currentUser.id,
        submitterName: currentUser.name,
        submitterRole: currentUser.role,
        billRecipient,
        voucherNumber: voucherNumber || `VCH-${new Date().getFullYear()}-${String(expenses.length + 1).padStart(2, '0')}`,
        remarks,
        status: initialStatus,
        approvedBy: initialStatus === 'APPROVED' ? currentUser.id : undefined,
        approvedByName: initialStatus === 'APPROVED' ? currentUser.name : undefined,
        approvedAt: initialStatus === 'APPROVED' ? new Date().toISOString() : undefined,
        attachments: formAttachments.map((fa, i) => ({
          ...fa,
          id: `ATT-EXP-${Date.now()}-${i}`,
          uploadedAt: new Date().toISOString(),
        })),
      },
      currentUser
    );

    // Reset Form
    setShowAddModal(false);
    setAmount('');
    setExpenseTier('Tier-1');
    setBillRecipient('');
    setVoucherNumber('');
    setRemarks('');
    setFormAttachments([]);
    setFormAttachmentNote('');
  };

  const handleApprove = (id: string) => {
    if (!currentUser) return;
    storageService.setExpenseStatus(id, 'APPROVED', currentUser);
  };

  const handleReject = (id: string) => {
    if (!currentUser) return;
    let reason = 'Audit discrepancy or documentation missing';
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
    storageService.setExpenseStatus(id, 'REJECTED', currentUser, reason);
  };

  const handleSoftDelete = (id: string) => {
    if (!currentUser) return;
    try {
      if (!window.confirm('Are you sure you want to soft-delete this expense record?')) {
        return;
      }
    } catch {
      // Sandbox fallback
    }
    storageService.softDeleteExpense(id, currentUser);
  };

  const handleHardDelete = (id: string) => {
    if (!currentUser) return;
    try {
      if (!window.confirm('ROOT WARNING: Permanently purge this expense record from database?')) {
        return;
      }
    } catch {
      // Sandbox fallback
    }
    storageService.hardDeleteExpense(id, currentUser);
  };

  const handleExportCSV = () => {
    const csvContent = storageService.exportExpensesCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `PHS_Expense_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter list
  const filteredExpenses = expenses.filter((item) => {
    if (item.isSoftDeleted) return false;
    if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
    if (categoryFilter !== 'ALL' && item.category !== categoryFilter) return false;
    if (tierFilter !== 'ALL' && (item.tier || 'Tier-1') !== tierFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = item.id.toLowerCase().includes(q);
      const matchPayee = item.billRecipient.toLowerCase().includes(q);
      const matchSubmitter = item.submitterName.toLowerCase().includes(q);
      const matchVoucher = item.voucherNumber?.toLowerCase().includes(q);
      const matchRemarks = item.remarks?.toLowerCase().includes(q);
      return matchId || matchPayee || matchSubmitter || matchVoucher || matchRemarks;
    }

    return true;
  });

  const totalFilteredExpense = filteredExpenses
    .filter((e) => e.status === 'APPROVED')
    .reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Project Expense Ledger</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Operational, Development, Utility & Administrative society disbursements
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {currentUser?.role === 'SYSTEM_ADMIN' && (
            <button
              onClick={() => setShowCategoryModal(true)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow"
              title="System Admin: Edit / Modify Income & Expense Categories"
            >
              <FolderTree className="w-3.5 h-3.5 text-rose-400" />
              <span>Expense Categories</span>
            </button>
          )}
          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Download className="w-3.5 h-3.5 text-rose-400" />
            <span>Export CSV</span>
          </button>
          {canMakeEntry && (
            <button
              onClick={() => setShowCSVImportModal(true)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-rose-300 hover:text-white border border-rose-800/60 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow"
              title="Bulk import operational expenses from CSV using predefined template"
            >
              <Upload className="w-3.5 h-3.5 text-rose-400" />
              <span>Import CSV</span>
            </button>
          )}
          {canMakeEntry ? (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-3.5 py-1.5 bg-rose-700 hover:bg-rose-600 text-white rounded-lg text-xs font-semibold shadow flex items-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Record New Expense</span>
            </button>
          ) : (
            <div
              title="Entry Access Restricted: Only empowered Officials (authorized by System Admin) can record Expense entries"
              className="px-3 py-1.5 bg-slate-800/80 border border-slate-700/80 rounded-lg text-xs text-slate-400 font-medium flex items-center gap-1.5 cursor-not-allowed"
            >
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>Entry Restricted (Empowered Officials Only)</span>
            </div>
          )}
        </div>
      </div>

      {/* Success Notification Banner */}
      {successBanner && (
        <div className="p-3.5 bg-emerald-950/60 border border-emerald-800/80 rounded-xl text-xs text-emerald-300 flex items-center gap-2 shadow-lg animate-in fade-in duration-150">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successBanner}</span>
        </div>
      )}

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
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-rose-500"
          >
            <option value="ALL">All Categories</option>
            {expenseCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Expense Tier Dropdown */}
          <select
            value={tierFilter}
            onChange={(e: any) => setTierFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-rose-500 font-semibold"
          >
            <option value="ALL">All Expense Tiers</option>
            {EXPENSE_TIERS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          {/* Status Dropdown */}
          <select
            value={statusFilter}
            onChange={(e: any) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-rose-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="APPROVED">Approved Only</option>
            <option value="PENDING">Pending Approval</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search payee, voucher, ID, submitter..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
          />
        </div>
      </div>

      {/* Expense Ledger Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Expense ID</th>
                <th className="py-3 px-3 text-center">Expense Tier</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Bill Recipient / Payee</th>
                <th className="py-3 px-4">Voucher No</th>
                <th className="py-3 px-4">Submitter</th>
                <th className="py-3 px-3 text-center">Docs</th>
                <th className="py-3 px-4 text-right">Amount (BDT)</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-500 text-xs">
                    No expense records match your criteria.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((item) => {
                  const isApproved = item.status === 'APPROVED';
                  const isPending = item.status === 'PENDING';
                  const isRejected = item.status === 'REJECTED';
                  const attachmentCount = item.attachments?.length || 0;

                  return (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-200">
                        {item.id}
                      </td>

                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${getExpenseTierBadge(item.tier)}`}>
                          {item.tier || 'Tier-1'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                        {item.date}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-medium text-slate-200">{item.category}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-200">{item.billRecipient}</div>
                        {item.remarks && (
                          <div className="text-[11px] text-slate-400 truncate max-w-xs">
                            {item.remarks}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-400">
                        {item.voucherNumber || 'N/A'}
                      </td>

                      <td className="py-3.5 px-4 text-slate-400">
                        <div>{item.submitterName}</div>
                        <span className="text-[10px] text-slate-500 font-mono">
                          ID: {item.submitterId}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedAttachmentEntry(item)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border transition ${
                            attachmentCount > 0
                              ? 'bg-rose-950/80 text-rose-300 border-rose-700/80 hover:bg-rose-900 shadow-xs'
                              : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-slate-200 hover:border-slate-600'
                          }`}
                          title={
                            attachmentCount > 0
                              ? `${attachmentCount} voucher/receipt document(s) attached. Click to view/manage.`
                              : 'No documents attached. Click to attach voucher or invoice.'
                          }
                        >
                          <Paperclip className="w-3 h-3" />
                          <span>{attachmentCount}</span>
                        </button>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-rose-400">
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
                          {/* Attachments / Supporting Documents Modal Button */}
                          <button
                            onClick={() => setSelectedAttachmentEntry(item)}
                            title="Supporting Documents, Vouchers & Bills"
                            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-rose-300 rounded transition"
                          >
                            <Paperclip className="w-3.5 h-3.5" />
                          </button>

                          {/* Print Voucher */}
                          {onPrintVoucher && (
                            <button
                              onClick={() => onPrintVoucher(item)}
                              title="Print Payment Voucher"
                              className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Approval Actions */}
                          {canApprove && isPending && (
                            <>
                              <button
                                onClick={() => handleApprove(item.id)}
                                title="Approve Expense"
                                className="p-1 hover:bg-emerald-950/80 text-emerald-400 rounded transition"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleReject(item.id)}
                                title="Reject Expense"
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
                              title="Hard Purge (System Admin root only)"
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
                <td colSpan={7} className="py-3 px-4 font-bold text-slate-300">
                  Approved Total Filtered Expenses
                </td>
                <td className="py-3 px-4 text-right font-mono font-bold text-rose-400">
                  {formatBDT(totalFilteredExpense)}
                </td>
                <td colSpan={2} className="py-3 px-4 text-right text-slate-500 text-[11px]">
                  {filteredExpenses.length} records shown
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in duration-200">
            <div className="px-5 sm:px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950 shrink-0">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-rose-400" />
                <span>Record New Project Expense</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
              {formError && (
                <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* ID & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    Expense ID (Auto-Generated)
                  </label>
                  <input
                    type="text"
                    disabled
                    value={`EXP-${new Date().getFullYear()}-${String(expenses.length + 1).padStart(3, '0')}`}
                    className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-lg text-xs font-mono text-rose-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Date & Time</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              {/* Expense Tier Selection */}
              <div>
                <label className="block text-[11px] text-slate-400 mb-1 font-semibold">
                  Expense Tier (Tier-1 to Tier-5)
                </label>
                <select
                  value={expenseTier}
                  onChange={(e: any) => setExpenseTier(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-semibold text-white focus:outline-none focus:border-rose-500"
                >
                  {EXPENSE_TIERS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category & Amount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] text-slate-400">Expense Category</label>
                    {currentUser?.role === 'SYSTEM_ADMIN' && (
                      <button
                        type="button"
                        onClick={() => setShowCategoryModal(true)}
                        className="text-[10px] text-rose-400 hover:underline flex items-center gap-0.5"
                      >
                        <FolderTree className="w-3 h-3" />
                        <span>Edit Categories</span>
                      </button>
                    )}
                  </div>
                  <select
                    value={category}
                    onChange={(e: any) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-rose-500"
                  >
                    {expenseCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Amount (BDT ৳)</label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g. 75000"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono font-bold text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              {/* Payee / Bill Recipient */}
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Bill Recipient / Payee Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={billRecipient}
                  onChange={(e) => setBillRecipient(e.target.value)}
                  placeholder="e.g. Desh Builders, DESCO, Site Labor Syndicate, Staff Payroll"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              {/* Voucher Number & Remarks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Voucher Number / Ref</label>
                  <input
                    type="text"
                    value={voucherNumber}
                    onChange={(e) => setVoucherNumber(e.target.value)}
                    placeholder="e.g. VCH-2026-09"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Remarks & Details</label>
                  <input
                    type="text"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Itemized memo, work order ref"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              {/* Supporting Document Attachment Upload */}
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-rose-400" />
                    <span>Attach Supporting Documents (Vouchers / Invoices / Memos)</span>
                  </label>
                  <span className="text-[10px] text-slate-500">Optional</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <select
                      value={formAttachmentType}
                      onChange={(e) => setFormAttachmentType(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-rose-500"
                    >
                      <option value="Voucher">Expense Voucher</option>
                      <option value="Invoice">Bill / Supplier Invoice</option>
                      <option value="Memo">Cash Memo</option>
                      <option value="Receipt">Payment Receipt</option>
                      <option value="Other">Other Supporting Document</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      value={formAttachmentNote}
                      onChange={(e) => setFormAttachmentNote(e.target.value)}
                      placeholder="Doc note (e.g. Bill #, Vendor Stamp, Receipt No)"
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <input
                    ref={formAttachmentInputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={handleFormFileSelect}
                  />
                  <button
                    type="button"
                    onClick={() => formAttachmentInputRef.current?.click()}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-rose-300 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Choose File / Snap Voucher</span>
                  </button>
                  <span className="text-[11px] text-slate-500">
                    JPG, PNG, PDF up to 5MB
                  </span>
                </div>

                {/* Attached files chips */}
                {formAttachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {formAttachments.map((fa, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200"
                      >
                        <Paperclip className="w-3 h-3 text-rose-400" />
                        <span className="font-medium truncate max-w-[150px]">{fa.name}</span>
                        <span className="text-[10px] text-slate-400">({(fa.size / 1024).toFixed(0)} KB)</span>
                        <button
                          type="button"
                          onClick={() => removeFormAttachment(idx)}
                          className="text-slate-400 hover:text-rose-400 ml-1"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submitter ID Auto-filled */}
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                <div>
                  <span>Submitter: </span>
                  <strong className="text-slate-200">{currentUser?.name}</strong>
                  <span className="text-slate-500 font-mono ml-1">({currentUser?.id})</span>
                </div>
                <span className="text-rose-400">
                  {currentUser?.role === 'MANAGER' ? 'Status: Pending Verification' : 'Status: Direct Approval'}
                </span>
              </div>

              {/* Actions */}
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
                  className="px-4 py-2 bg-rose-700 hover:bg-rose-600 text-white rounded-lg text-xs font-semibold shadow transition"
                >
                  Post Expense Entry
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
          setExpenseCategories(storageService.getExpenseCategories());
        }}
        currentUser={currentUser}
        initialTab="EXPENSE"
        incomes={storageService.getIncomes()}
        expenses={expenses}
      />

      {/* Bulk Expense CSV Import Modal */}
      {showCSVImportModal && (
        <ExpenseCSVImportModal
          currentUser={currentUser}
          isOpen={showCSVImportModal}
          onClose={() => setShowCSVImportModal(false)}
          onSuccess={(count, total) => {
            setSuccessBanner(`Successfully bulk imported ${count} operational expense vouchers totaling ${formatBDT(total)}.`);
            setTimeout(() => setSuccessBanner(''), 5000);
          }}
        />
      )}

      {/* Entry Attachment Preview & Management Modal */}
      {selectedAttachmentEntry && (
        <EntryAttachmentModal
          isOpen={!!selectedAttachmentEntry}
          onClose={() => setSelectedAttachmentEntry(null)}
          entryType="EXPENSE"
          entryId={selectedAttachmentEntry.id}
          entryTitle={`${selectedAttachmentEntry.id} - ${selectedAttachmentEntry.category}`}
          entryAmount={selectedAttachmentEntry.amount}
          entryDate={selectedAttachmentEntry.date}
          recipientOrMember={selectedAttachmentEntry.billRecipient || 'Payee'}
          attachments={selectedAttachmentEntry.attachments || []}
          currentUser={currentUser}
          onAttachmentChanged={() => {
            const updated = storageService.getExpenses().find((e) => e.id === selectedAttachmentEntry.id);
            if (updated) setSelectedAttachmentEntry(updated);
          }}
        />
      )}
    </div>
  );
};
