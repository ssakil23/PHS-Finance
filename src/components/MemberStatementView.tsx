import React, { useState, useEffect, useMemo } from 'react';
import {
  User,
  Wallet,
  Building,
  CheckCircle,
  AlertCircle,
  Printer,
  Download,
  Calendar,
  CreditCard,
  Lock,
  ArrowRight,
  ShieldCheck,
  Search,
  FileText,
  FileSpreadsheet,
  BellRing,
  Send,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Clock,
  ExternalLink,
  ShieldAlert,
  Users,
  Check,
  X,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Layers,
  PieChart,
  Tag,
  Filter,
  Info,
} from 'lucide-react';
import {
  IncomeEntry,
  ExpenseEntry,
  Member,
  User as UserType,
  OverduePaymentAlert,
} from '../types';
import {
  computeMemberSummary,
  computeProjectFinancials,
  computeAllMemberSummaries,
  computeProjectExpenseCategoryBreakdown,
  getExpenseSubCategory,
  ProjectExpenseDetailedAnalysis,
  ExpenseCategoryBreakdown,
  ExpenseSubCategoryBreakdown,
  formatBDT,
  MemberFinancialSummary,
} from '../utils/calculations';
import { storageService } from '../services/storageService';
import { formatMemberId, TOTAL_SHARES } from '../utils/directors';
import { BoardPresentationPDFModal } from './BoardPresentationPDFModal';

interface MemberStatementViewProps {
  incomes: IncomeEntry[];
  expenses: ExpenseEntry[];
  members: Member[];
  currentUser: UserType | null;
  initialMemberId?: string;
  onPrintStatement?: (summary: MemberFinancialSummary, deposits: IncomeEntry[]) => void;
  onNavigateTab?: (tab: string) => void;
}

export const MemberStatementView: React.FC<MemberStatementViewProps> = ({
  incomes,
  expenses,
  members,
  currentUser,
  initialMemberId,
  onPrintStatement,
  onNavigateTab,
}) => {
  const isMember = currentUser?.role === 'MEMBER';
  const loggedMemberId = currentUser?.memberId || 'PHSM-001';

  // Admin / Director authorization to issue alerts and view collective monitor
  const canManageAlerts =
    currentUser?.role === 'SYSTEM_ADMIN' ||
    currentUser?.role === 'DELEGATED_ADMIN' ||
    currentUser?.role === 'MANAGER' ||
    !!currentUser?.officialDesignation;

  // Selected Member State
  const [selectedMemberId, setSelectedMemberId] = useState<string>(
    isMember ? loggedMemberId : initialMemberId || 'PHSM-001'
  );

  // Modals & Panels State
  const [showBoardPDFModal, setShowBoardPDFModal] = useState(false);
  const [showOverdueMonitorModal, setShowOverdueMonitorModal] = useState(false);
  const [showSingleAlertModal, setShowSingleAlertModal] = useState(false);
  const [customAlertNote, setCustomAlertNote] = useState('');
  const [isDispatching, setIsDispatching] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ success?: string; error?: string } | null>(null);

  // Overdue Monitor Search & Filter State
  const [monitorSearchQuery, setMonitorSearchQuery] = useState('');
  const [monitorDirectorFilter, setMonitorDirectorFilter] = useState('ALL');

  useEffect(() => {
    if (!isMember && initialMemberId) {
      setSelectedMemberId(initialMemberId);
    }
  }, [initialMemberId, isMember]);

  const activeId = isMember ? loggedMemberId : selectedMemberId;
  const currentMember = members.find((m) => m.id === activeId) || members[0];

  const summary = computeMemberSummary(currentMember, incomes, expenses);
  const financials = computeProjectFinancials(incomes, expenses);

  // All deposits for this member
  const memberDeposits = incomes.filter(
    (inc) =>
      !inc.isSoftDeleted &&
      inc.type === 'GENERAL_DEPOSIT' &&
      (inc.shareOwnerId === currentMember.id || inc.shareNumber === currentMember.shareNumber)
  );

  const isAdvance = summary.currentBalance >= -0.01;
  const isOverdue = summary.currentBalance < -0.01;
  const overdueAmount = Math.abs(summary.currentBalance);

  // Overdue alerts history for active member
  const memberAlerts = useMemo(() => {
    return storageService.getOverdueAlertsForMember(currentMember.id);
  }, [currentMember.id, actionFeedback]);

  const latestAlert = memberAlerts[0];

  // Scan all 144 shares for collective Overdue Monitor
  const allSummaries = useMemo(() => {
    return computeAllMemberSummaries(members, incomes, expenses);
  }, [members, incomes, expenses]);

  const allOverdueAccounts = useMemo(() => {
    return allSummaries
      .filter((s) => s.currentBalance < -0.01)
      .sort((a, b) => a.currentBalance - b.currentBalance);
  }, [allSummaries]);

  const totalOverdueCapital = useMemo(() => {
    return allOverdueAccounts.reduce((sum, a) => sum + Math.abs(a.currentBalance), 0);
  }, [allOverdueAccounts]);

  // Filtered accounts inside Overdue Monitor modal
  const filteredOverdueAccounts = useMemo(() => {
    return allOverdueAccounts.filter((acc) => {
      if (monitorDirectorFilter !== 'ALL' && acc.controllingDirector.name !== monitorDirectorFilter) {
        return false;
      }
      if (monitorSearchQuery.trim()) {
        const q = monitorSearchQuery.toLowerCase();
        const matchId = acc.memberId.toLowerCase().includes(q);
        const matchName = acc.member.name.toLowerCase().includes(q);
        const matchShare = acc.shareNumber.toString().includes(q);
        if (!matchId && !matchName && !matchShare) return false;
      }
      return true;
    });
  }, [allOverdueAccounts, monitorDirectorFilter, monitorSearchQuery]);

  // --- Project Expense Category & Sub-Category Breakdown State ---
  const [expenseActiveTab, setExpenseActiveTab] = useState<'CATEGORIES' | 'ALL_VOUCHERS'>('CATEGORIES');
  const [expandedExpenseCategories, setExpandedExpenseCategories] = useState<Record<string, boolean>>({
    'Site Development': true,
    'Labor': true,
  });
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState<string>('ALL');
  const [expenseSearchQuery, setExpenseSearchQuery] = useState<string>('');

  const expenseAnalysis: ProjectExpenseDetailedAnalysis = useMemo(() => {
    return computeProjectExpenseCategoryBreakdown(expenses);
  }, [expenses]);

  const toggleCategoryExpand = (cat: string) => {
    setExpandedExpenseCategories((prev) => ({
      ...prev,
      [cat]: !prev[cat],
    }));
  };

  const handleExpandAllCategories = () => {
    const allExpanded: Record<string, boolean> = {};
    expenseAnalysis.categories.forEach((c) => {
      allExpanded[c.category] = true;
    });
    setExpandedExpenseCategories(allExpanded);
  };

  const handleCollapseAllCategories = () => {
    setExpandedExpenseCategories({});
  };

  // Filtered categories based on filter & search
  const filteredExpenseCategories = useMemo(() => {
    return expenseAnalysis.categories.filter((cat) => {
      if (expenseCategoryFilter !== 'ALL' && cat.category !== expenseCategoryFilter) {
        return false;
      }
      if (expenseSearchQuery.trim()) {
        const q = expenseSearchQuery.toLowerCase();
        const matchCategory = cat.category.toLowerCase().includes(q);
        const matchSubCategory = cat.subCategories.some((sc) => sc.name.toLowerCase().includes(q));
        const matchItems = cat.items.some(
          (item) =>
            item.billRecipient.toLowerCase().includes(q) ||
            item.remarks.toLowerCase().includes(q) ||
            (item.voucherNumber && item.voucherNumber.toLowerCase().includes(q))
        );
        if (!matchCategory && !matchSubCategory && !matchItems) return false;
      }
      return true;
    });
  }, [expenseAnalysis, expenseCategoryFilter, expenseSearchQuery]);

  // All approved vouchers filtered
  const filteredAllApprovedExpenses = useMemo(() => {
    const approved = expenses.filter((e) => e.status === 'APPROVED' && !e.isSoftDeleted);
    return approved.filter((e) => {
      if (expenseCategoryFilter !== 'ALL' && e.category !== expenseCategoryFilter) {
        return false;
      }
      if (expenseSearchQuery.trim()) {
        const q = expenseSearchQuery.toLowerCase();
        const subCat = getExpenseSubCategory(e).toLowerCase();
        const matchId = e.id.toLowerCase().includes(q);
        const matchCat = (e.category || '').toLowerCase().includes(q);
        const matchSub = subCat.includes(q);
        const matchPayee = (e.billRecipient || '').toLowerCase().includes(q);
        const matchRemarks = (e.remarks || '').toLowerCase().includes(q);
        const matchVoucher = (e.voucherNumber || '').toLowerCase().includes(q);
        if (!matchId && !matchCat && !matchSub && !matchPayee && !matchRemarks && !matchVoucher) {
          return false;
        }
      }
      return true;
    });
  }, [expenses, expenseCategoryFilter, expenseSearchQuery]);

  const handleExportProjectExpensesCSV = () => {
    const approvedExpenses = expenses.filter((e) => e.status === 'APPROVED' && !e.isSoftDeleted);
    const headers = [
      'Voucher ID',
      'Date',
      'Main Category',
      'Sub-Category',
      'Payee / Contractor / Authority',
      'Voucher Number',
      'Total Project Expense (BDT)',
      '1/144 Share Quota Cost (BDT)',
      'Approved By',
      'Scope of Work / Remarks',
    ];
    const rows = approvedExpenses.map((e) => [
      `"${e.id}"`,
      `"${e.date}"`,
      `"${(e.category || '').replace(/"/g, '""')}"`,
      `"${getExpenseSubCategory(e).replace(/"/g, '""')}"`,
      `"${(e.billRecipient || '').replace(/"/g, '""')}"`,
      `"${(e.voucherNumber || '').replace(/"/g, '""')}"`,
      e.amount,
      (e.amount / 144).toFixed(2),
      `"${(e.approvedByName || e.approvedBy || '').replace(/"/g, '""')}"`,
      `"${(e.remarks || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `PHS_Project_Expenses_Category_Subcategory_Breakdown_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV Export
  const handleExportCSV = () => {
    const lines = [
      `"PROTTASHA HOUSING SOCIETY LTD. - SHAREHOLDER FINANCIAL STATEMENT"`,
      `"Statement Generated: ${new Date().toLocaleDateString('en-GB')}"`,
      `"Member ID:","${currentMember.id}"`,
      `"Member Name:","${currentMember.name}"`,
      `"Share Allocation:","Share #${currentMember.shareNumber} of 144"`,
      `"Controlling Director:","${currentMember.controllingDirectorName}"`,
      `"Contact Phone:","${currentMember.phone}"`,
      `"Contact Email:","${currentMember.email}"`,
      `"Assigned Plot:","${currentMember.address}"`,
      ``,
      `"--- FINANCIAL SUMMARY MATRIX (BDT ৳) ---"`,
      `"Total Personal Deposits (Joma):","${summary.memberPersonalDeposit}"`,
      `"Share Expense Quota (Khorch 1/144):","${summary.memberShareExpense}"`,
      `"Current Net Balance:","${summary.currentBalance}"`,
      `"Balance Status:","${isAdvance ? 'SURPLUS ADVANCE' : 'OVERDUE DUES PAYABLE'}"`,
      ``,
      `"--- ITEMIZED DEPOSIT TRANSACTIONS (JOMA) ---"`,
      `"Deposit ID","Date","Category","Payment Method","Reference Number","Amount (BDT)","Status","Remarks"`,
    ];

    memberDeposits.forEach((dep) => {
      lines.push(
        `"${dep.id}","${dep.date}","${(dep.category || '').replace(/"/g, '""')}","${dep.paymentMethod}","${dep.referenceNumber || 'N/A'}","${dep.amount}","${dep.status}","${(dep.remarks || '').replace(/"/g, '""')}"`
      );
    });

    lines.push(``);
    lines.push(`"Total Verified Deposits Credited","","","","","${summary.memberPersonalDeposit}","",""`);

    const csvContent = lines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `PHS_Financial_Statement_${currentMember.id}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintOrPDF = () => {
    if (onPrintStatement) {
      onPrintStatement(summary, memberDeposits);
    } else {
      window.print();
    }
  };

  // Dispatch Automated Alert for Active Member
  const handleSendSingleAlert = () => {
    if (!currentUser || !canManageAlerts) return;
    setIsDispatching(true);
    setActionFeedback(null);

    try {
      const alert = storageService.sendOverduePaymentAlert(
        currentMember,
        overdueAmount,
        summary.memberPersonalDeposit,
        summary.memberShareExpense,
        currentUser,
        customAlertNote.trim() || undefined
      );

      setActionFeedback({
        success: `Automated overdue payment alert successfully dispatched to ${currentMember.name} (${currentMember.id}) via InfoCommunicationView! Ticket Ref: ${alert.queryId}`,
      });
      setShowSingleAlertModal(false);
      setCustomAlertNote('');
    } catch (err: any) {
      setActionFeedback({
        error: err.message || 'Failed to dispatch automated overdue alert.',
      });
    } finally {
      setIsDispatching(false);
    }
  };

  // Dispatch Batch Alerts to All Overdue Members
  const handleSendBatchAlerts = () => {
    if (!currentUser || !canManageAlerts) return;
    if (allOverdueAccounts.length === 0) return;

    const confirmed = window.confirm(
      `Confirm dispatching automated overdue notices to all ${allOverdueAccounts.length} shareholders with pending balances? Each member will receive a formal demand notice in InfoCommunicationView.`
    );
    if (!confirmed) return;

    setIsDispatching(true);
    setActionFeedback(null);

    try {
      const payload = allOverdueAccounts.map((item) => ({
        member: item.member,
        overdueAmount: Math.abs(item.currentBalance),
        personalDeposit: item.memberPersonalDeposit,
        shareExpense: item.memberShareExpense,
      }));

      const res = storageService.sendBatchOverduePaymentAlerts(
        payload,
        currentUser,
        'Executive Batch Overdue Capital Call'
      );

      setActionFeedback({
        success: `Successfully dispatched automated overdue demand alerts to all ${res.dispatchedCount} shareholders via InfoCommunicationView!`,
      });
    } catch (err: any) {
      setActionFeedback({
        error: err.message || 'Failed to dispatch batch overdue alerts.',
      });
    } finally {
      setIsDispatching(false);
    }
  };

  // Dispatch alert for an individual account from the monitor table
  const handleSendAlertFromTable = (acc: MemberFinancialSummary) => {
    if (!currentUser || !canManageAlerts) return;

    try {
      const alert = storageService.sendOverduePaymentAlert(
        acc.member,
        Math.abs(acc.currentBalance),
        acc.memberPersonalDeposit,
        acc.memberShareExpense,
        currentUser
      );

      setActionFeedback({
        success: `Automated alert dispatched to ${acc.member.name} (${acc.memberId}) via InfoCommunicationView. (Ticket: ${alert.queryId})`,
      });
    } catch (err: any) {
      setActionFeedback({
        error: err.message || 'Failed to dispatch alert.',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Feedback Banner */}
      {actionFeedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs animate-in fade-in ${
            actionFeedback.success
              ? 'bg-emerald-950/80 border-emerald-700 text-emerald-200'
              : 'bg-rose-950/80 border-rose-700 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionFeedback.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{actionFeedback.success || actionFeedback.error}</span>
          </div>
          <button
            onClick={() => setActionFeedback(null)}
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Banner & Member Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60">
                Official Shareholder Ledger
              </span>
              {isMember ? (
                <span className="inline-flex items-center gap-1 text-[11px] text-indigo-300 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800/60">
                  <Lock className="w-3 h-3 text-indigo-400" />
                  <span>Strict Data Isolation Active</span>
                </span>
              ) : (
                <button
                  onClick={() => setShowOverdueMonitorModal(true)}
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-300 bg-amber-950/80 hover:bg-amber-900/80 px-2.5 py-0.5 rounded border border-amber-800/70 transition"
                  title="View all 144 shares and identify overdue accounts"
                >
                  <AlertTriangle className="w-3 h-3 text-amber-400 animate-pulse" />
                  <span>Overdue Accounts Monitor ({allOverdueAccounts.length})</span>
                </button>
              )}
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>Financial Statement (Joma & Khorch)</span>
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Personal deposit ledger vs equal project expense quota (1/144th share allocation).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* If Admin/Manager, show Dropdown Filter to inspect any of the 144 members */}
            {!isMember ? (
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-400 whitespace-nowrap">Select Member:</label>
                <select
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-emerald-400 focus:outline-none focus:border-emerald-500"
                >
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.id} - {m.name} (Share #{m.shareNumber})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-emerald-400">
                Your Share ID: <strong>{currentMember.id}</strong> (Share #{currentMember.shareNumber})
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              {/* Board Summary PDF Report */}
              <button
                onClick={() => setShowBoardPDFModal(true)}
                title="Generate comprehensive summary PDF report for board presentation"
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow transition"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Board Summary PDF</span>
              </button>

              <button
                onClick={handleExportCSV}
                title="Export detailed statement to formatted CSV"
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Export to CSV</span>
              </button>

              <button
                onClick={handlePrintOrPDF}
                title="Export to formatted individual statement PDF"
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow flex items-center gap-1.5 transition"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Statement</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* OVERDUE PAYMENT IDENTIFICATION & AUTOMATED ALERT CARD */}
      {isOverdue && (
        <div className="bg-gradient-to-r from-rose-950/80 via-slate-900 to-rose-950/80 border-2 border-rose-600/70 rounded-2xl p-5 shadow-xl space-y-4 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-rose-800/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-600/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white tracking-wide">
                    Overdue Payment Identified: Deficit of {formatBDT(overdueAmount)}
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-900 text-rose-200 border border-rose-700 uppercase">
                    Deficit Arrears
                  </span>
                </div>
                <p className="text-xs text-rose-200/80 mt-0.5">
                  Shareholder personal deposits ({formatBDT(summary.memberPersonalDeposit)}) are less than the required 1/144th share quota ({formatBDT(summary.memberShareExpense)}).
                </p>
              </div>
            </div>

            {/* Action Triggers */}
            <div className="flex items-center gap-2">
              {canManageAlerts && (
                <button
                  onClick={() => setShowSingleAlertModal(true)}
                  disabled={isDispatching}
                  className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-lg flex items-center gap-2 transition"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Automated Overdue Alert via InfoCommunicationView</span>
                </button>
              )}

              {isMember && onNavigateTab && (
                <button
                  onClick={() => onNavigateTab('info_communication')}
                  className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow flex items-center gap-2 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>View Demand Notice in InfoCommunication</span>
                </button>
              )}
            </div>
          </div>

          {/* Overdue Audit & Dispatch History Strip */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-slate-950/70 p-3 rounded-xl border border-rose-900/40">
            <div className="flex items-center gap-2 text-slate-300">
              <Clock className="w-3.5 h-3.5 text-rose-400" />
              <span>
                {latestAlert ? (
                  <span>
                    Last Alert Dispatched: <strong className="text-rose-300">{new Date(latestAlert.sentAt).toLocaleString()}</strong> by {latestAlert.sentBy} ({latestAlert.sentByRole})
                  </span>
                ) : (
                  <span className="text-amber-300 font-medium">
                    No automated alert dispatched yet for this billing cycle.
                  </span>
                )}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {latestAlert?.queryId && onNavigateTab && (
                <button
                  onClick={() => onNavigateTab('info_communication')}
                  className="text-xs text-rose-300 hover:text-white underline flex items-center gap-1 font-mono"
                >
                  <span>Query Ticket: {latestAlert.queryId}</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Member Profile & High Level Financial Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Member Dossier */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold text-base shadow">
              {currentMember.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="font-bold text-white text-base">{currentMember.name}</h3>
              <div className="text-xs font-mono text-emerald-400">
                Member ID: {currentMember.id}
              </div>
            </div>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Registered Share Number:</span>
              <span className="font-mono font-bold text-white">Share #{currentMember.shareNumber} of 144</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Controlling Director:</span>
              <span className="font-semibold text-emerald-400">{currentMember.controllingDirectorName}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Contact Mobile:</span>
              <span className="text-slate-200">{currentMember.phone}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Email Address:</span>
              <span className="text-slate-200">{currentMember.email}</span>
            </div>
            <div className="flex justify-between items-start py-1">
              <span className="text-slate-400">Assigned Plot Address:</span>
              <span className="text-slate-300 text-right max-w-[60%]">{currentMember.address}</span>
            </div>
          </div>

          <div className="pt-2">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Certified Shareholder of Prottasha Housing Society.</span>
            </div>
          </div>
        </div>

        {/* Middle & Right: The 4 Core Financial Metrics */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Metric 1: Member Personal Deposit */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
              <div className="text-xs text-slate-400 font-medium mb-1">
                Total Personal Deposits (Joma)
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-400">
                {formatBDT(summary.memberPersonalDeposit)}
              </div>
              <div className="text-[11px] text-slate-500 mt-2">
                Total approved funds deposited against {currentMember.id}
              </div>
            </div>

            {/* Metric 2: Member Share Expense */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
              <div className="text-xs text-slate-400 font-medium mb-1">
                Share Expense Quota (Khorch)
              </div>
              <div className="text-2xl font-bold font-mono text-slate-200">
                {formatBDT(summary.memberShareExpense)}
              </div>
              <div className="text-[11px] text-slate-500 mt-2">
                Strict formula: Total Project Expense / 144
              </div>
            </div>

            {/* Metric 3: Current Net Balance */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
              <div className="text-xs text-slate-400 font-medium mb-1">
                Current Net Balance (Joma − Khorch)
              </div>
              <div
                className={`text-2xl font-bold font-mono ${
                  isAdvance ? 'text-teal-400' : 'text-rose-400'
                }`}
              >
                {formatBDT(summary.currentBalance)}
              </div>
              <div className="mt-2">
                <span
                  className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    isAdvance
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                  }`}
                >
                  {isAdvance ? 'Surplus Advance' : 'Pending Dues Payable'}
                </span>
              </div>
            </div>
          </div>

          {/* Macro Project Reference Strip */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-slate-400">Global Reference: </span>
              <span>Total Project Expense: <strong className="text-white font-mono">{formatBDT(financials.totalProjectExpense)}</strong></span>
              <span className="text-slate-500 mx-2">|</span>
              <span>Divided by: <strong className="text-emerald-400 font-mono">144 Shares</strong></span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              Share Quota = {formatBDT(financials.perShareExpense)}
            </div>
          </div>
        </div>
      </div>

      {/* Member Personal Deposit History (Joma Breakdown) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-400" />
              <span>Personal Deposit Transactions ({currentMember.id})</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Verified payment receipts credited towards Share #{currentMember.shareNumber}.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs text-slate-400">
              Total Deposits: <strong className="text-emerald-400 font-mono">{formatBDT(summary.memberPersonalDeposit)}</strong>
            </div>
            <button
              onClick={handleExportCSV}
              title="Download personal transaction history and summaries to CSV"
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export to CSV</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Deposit ID</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4">Reference / Trx No</th>
                <th className="py-3 px-4 text-right">Amount (BDT)</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {memberDeposits.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 text-xs">
                    No deposit records found for Member {currentMember.id}.
                  </td>
                </tr>
              ) : (
                memberDeposits.map((dep) => (
                  <tr key={dep.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-200">
                      {dep.id}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                      {dep.date}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-200">
                      {dep.category}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {dep.paymentMethod}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">
                      {dep.referenceNumber || 'N/A'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400">
                      {formatBDT(dep.amount)}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          dep.status === 'APPROVED'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {dep.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {dep.remarks || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot className="bg-slate-950 font-semibold text-slate-200 border-t border-slate-800 text-xs">
              <tr>
                <td colSpan={5} className="py-3 px-4 font-bold text-slate-300">
                  Total Approved Personal Deposits
                </td>
                <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                  {formatBDT(summary.memberPersonalDeposit)}
                </td>
                <td colSpan={2} className="py-3 px-4 text-right text-slate-500 text-[11px]">
                  Net Status: {isAdvance ? 'Advance Surplus' : 'Dues Payable'}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION: TOTAL PROJECT EXPENSE & CATEGORY / SUB-CATEGORY DETAILED BREAKDOWN */}
      {/* AVAILABLE TO ALL USERS (SHARE OWNERS 001-144, DIRECTORS, ADMINS)          */}
      {/* ========================================================================= */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl space-y-4 p-6">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800/60 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                <span>Society Project Expenses (Khorch)</span>
              </span>
              <span className="text-[11px] text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
                1/144 Share Quota Allocation
              </span>
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span>Total Project Expense & Category / Sub-Category Breakdown</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Itemized project expenses with Date, Payee, Main Category, Sub-Category, and Member's individual 1/144th share liability ({currentMember.id}).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Tab Toggle: Category View vs Chronological Voucher List */}
            <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setExpenseActiveTab('CATEGORIES')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 ${
                  expenseActiveTab === 'CATEGORIES'
                    ? 'bg-rose-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <PieChart className="w-3.5 h-3.5" />
                <span>Category Breakdown</span>
              </button>
              <button
                type="button"
                onClick={() => setExpenseActiveTab('ALL_VOUCHERS')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 ${
                  expenseActiveTab === 'ALL_VOUCHERS'
                    ? 'bg-rose-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>All Vouchers ({filteredAllApprovedExpenses.length})</span>
              </button>
            </div>

            {/* Export CSV Button */}
            <button
              type="button"
              onClick={handleExportProjectExpensesCSV}
              title="Download full project expense breakdown with category & subcategory"
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold shadow flex items-center gap-1.5 transition"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-rose-400" />
              <span>Export Expense CSV</span>
            </button>
          </div>
        </div>

        {/* Macro KPI Cards for Total Project Expense & 1/144 Share Quota */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
            <div className="text-slate-400 flex items-center justify-between">
              <span>Total Project Expense</span>
              <Building className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-lg sm:text-xl font-bold font-mono text-rose-400 mt-1">
              {formatBDT(expenseAnalysis.totalProjectExpense)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Verified Society Disbursements across {expenseAnalysis.approvedCount} vouchers
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
            <div className="text-slate-400 flex items-center justify-between">
              <span>Your Share Quota (1/144)</span>
              <Wallet className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-lg sm:text-xl font-bold font-mono text-amber-400 mt-1">
              {formatBDT(expenseAnalysis.perShareExpense)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {currentMember.id} (Share #{currentMember.shareNumber}) equal liability
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
            <div className="text-slate-400 flex items-center justify-between">
              <span>Your Verified Deposit (Joma)</span>
              <CreditCard className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-lg sm:text-xl font-bold font-mono text-emerald-400 mt-1">
              {formatBDT(summary.memberPersonalDeposit)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Credited towards Share #{currentMember.shareNumber}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
            <div className="text-slate-400 flex items-center justify-between">
              <span>Current Net Balance</span>
              <ShieldCheck className="w-4 h-4 text-sky-400" />
            </div>
            <div
              className={`text-lg sm:text-xl font-bold font-mono mt-1 ${
                isAdvance ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {formatBDT(summary.currentBalance)}
            </div>
            <div className="text-[11px] font-semibold mt-0.5">
              {isAdvance ? (
                <span className="text-emerald-400">Surplus Advance Paid</span>
              ) : (
                <span className="text-rose-400">Dues Payable to Society</span>
              )}
            </div>
          </div>
        </div>

        {/* Informative Explanation Strip */}
        <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-[11px] text-slate-300 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>
            <strong>Transparency Principle:</strong> Under Prottasha Housing Society's 144 equal-share constitution, all infrastructure, site development, land leveling, and operational expenses are divided equally among all 144 shares (<code className="text-amber-300">Total Expense ÷ 144</code>). Your personal deposit of <strong>{formatBDT(summary.memberPersonalDeposit)}</strong> is offset against your 1/144th quota of <strong>{formatBDT(expenseAnalysis.perShareExpense)}</strong> to determine your net balance.
          </span>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-slate-950/80 rounded-xl border border-slate-800">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <label className="text-slate-400">Filter Category:</label>
              <select
                value={expenseCategoryFilter}
                onChange={(e) => setExpenseCategoryFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:border-rose-500"
              >
                <option value="ALL">All Categories ({expenseAnalysis.categories.length})</option>
                {expenseAnalysis.categories.map((c) => (
                  <option key={c.category} value={c.category}>
                    {c.category} ({formatBDT(c.totalAmount)})
                  </option>
                ))}
              </select>
            </div>

            {expenseActiveTab === 'CATEGORIES' && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleExpandAllCategories}
                  className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded text-[11px] transition"
                >
                  Expand All
                </button>
                <button
                  type="button"
                  onClick={handleCollapseAllCategories}
                  className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded text-[11px] transition"
                >
                  Collapse All
                </button>
              </div>
            )}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={expenseSearchQuery}
              onChange={(e) => setExpenseSearchQuery(e.target.value)}
              placeholder="Search by payee, sub-category, voucher #..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:border-rose-500"
            />
          </div>
        </div>

        {/* TAB 1: CATEGORY & SUB-CATEGORY DETAILED BREAKDOWN ACCORDION */}
        {expenseActiveTab === 'CATEGORIES' && (
          <div className="space-y-4">
            {filteredExpenseCategories.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs bg-slate-950/40 rounded-xl border border-slate-800">
                No expense categories matched your filter criteria.
              </div>
            ) : (
              filteredExpenseCategories.map((cat) => {
                const isExpanded = !!expandedExpenseCategories[cat.category];
                return (
                  <div
                    key={cat.category}
                    className="bg-slate-950/70 border border-slate-800 rounded-xl overflow-hidden transition"
                  >
                    {/* Category Header Card */}
                    <div
                      onClick={() => toggleCategoryExpand(cat.category)}
                      className="p-4 bg-slate-900/60 hover:bg-slate-900 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800/80 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                          <Tag className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-white">{cat.category}</h4>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold border border-slate-700">
                              {cat.transactionCount} vouchers
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-950/80 text-rose-300 font-mono border border-rose-800/60">
                              {cat.percentageOfTotal.toFixed(1)}% of total
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Sub-categories: {cat.subCategories.map((s) => s.name).join(' • ')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between md:justify-end gap-6 text-xs">
                        <div className="text-right">
                          <div className="text-[10px] text-slate-400">Total Category Expense</div>
                          <div className="text-sm font-bold font-mono text-rose-400">
                            {formatBDT(cat.totalAmount)}
                          </div>
                        </div>

                        <div className="text-right pl-4 border-l border-slate-800">
                          <div className="text-[10px] text-slate-400">1/144 Share Quota</div>
                          <div className="text-sm font-bold font-mono text-amber-400">
                            {formatBDT(cat.perShareAmount)}
                          </div>
                        </div>

                        <button
                          type="button"
                          className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                        >
                          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    {/* Sub-Category Pills & Vouchers Table (When Expanded) */}
                    {isExpanded && (
                      <div className="p-4 space-y-4">
                        {/* Sub-Category Summary Badges */}
                        <div>
                          <div className="text-[11px] font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                            Sub-Category Wise Allocation:
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                            {cat.subCategories.map((sub) => (
                              <div
                                key={sub.name}
                                className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between"
                              >
                                <div>
                                  <div className="text-xs font-semibold text-slate-200">{sub.name}</div>
                                  <div className="text-[10px] text-slate-400 mt-0.5">
                                    {sub.transactionCount} vouchers ({sub.percentageOfCategory.toFixed(1)}% of category)
                                  </div>
                                </div>
                                <div className="text-right font-mono">
                                  <div className="text-xs font-bold text-rose-300">{formatBDT(sub.totalAmount)}</div>
                                  <div className="text-[10px] text-amber-300">
                                    1/144: {formatBDT(sub.perShareAmount)}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Itemized Vouchers with Date, Subcategory, Payee, 1/144 share */}
                        <div className="overflow-x-auto rounded-lg border border-slate-800">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                              <tr>
                                <th className="py-2.5 px-3">Date</th>
                                <th className="py-2.5 px-3">Voucher #</th>
                                <th className="py-2.5 px-3">Sub-Category</th>
                                <th className="py-2.5 px-3">Payee / Contractor</th>
                                <th className="py-2.5 px-3">Scope / Remarks</th>
                                <th className="py-2.5 px-3 text-right">Total Expense</th>
                                <th className="py-2.5 px-3 text-right">1/144 Share Cost</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60">
                              {cat.items.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-900/50">
                                  <td className="py-2 px-3 text-slate-300 font-mono whitespace-nowrap">
                                    {item.date}
                                  </td>
                                  <td className="py-2 px-3 font-mono text-slate-400">
                                    {item.voucherNumber || item.id}
                                  </td>
                                  <td className="py-2 px-3">
                                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-medium border border-slate-700">
                                      {getExpenseSubCategory(item)}
                                    </span>
                                  </td>
                                  <td className="py-2 px-3 text-white font-medium">
                                    {item.billRecipient}
                                  </td>
                                  <td className="py-2 px-3 text-slate-400 text-[11px] max-w-xs truncate">
                                    {item.remarks || '—'}
                                  </td>
                                  <td className="py-2 px-3 text-right font-mono font-bold text-rose-400">
                                    {formatBDT(item.amount)}
                                  </td>
                                  <td className="py-2 px-3 text-right font-mono text-amber-300">
                                    {formatBDT(item.amount / 144)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 2: CHRONOLOGICAL EXPENSE VOUCHER LEDGER (ALL VOUCHERS WITH DATE) */}
        {expenseActiveTab === 'ALL_VOUCHERS' && (
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Voucher #</th>
                  <th className="py-3 px-4">Main Category</th>
                  <th className="py-3 px-4">Sub-Category</th>
                  <th className="py-3 px-4">Payee / Recipient</th>
                  <th className="py-3 px-4 text-right">Total Amount (BDT)</th>
                  <th className="py-3 px-4 text-right">1/144 Share Quota (BDT)</th>
                  <th className="py-3 px-4">Scope of Work / Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {filteredAllApprovedExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500">
                      No expense records found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredAllApprovedExpenses.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-3 font-mono text-slate-300 whitespace-nowrap">
                        {e.date}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-400">
                        {e.voucherNumber || e.id}
                      </td>
                      <td className="py-3 px-4 font-semibold text-white">
                        {e.category}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-medium border border-slate-700">
                          {getExpenseSubCategory(e)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-200">
                        {e.billRecipient}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-rose-400">
                        {formatBDT(e.amount)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-amber-400">
                        {formatBDT(e.amount / 144)}
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-[11px]">
                        {e.remarks || '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot className="bg-slate-950 font-semibold text-slate-200 border-t border-slate-800 text-xs">
                <tr>
                  <td colSpan={5} className="py-3 px-4 font-bold text-slate-300">
                    Total Project Expense ({filteredAllApprovedExpenses.length} Vouchers)
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-rose-400">
                    {formatBDT(filteredAllApprovedExpenses.reduce((sum, e) => sum + e.amount, 0))}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-amber-400">
                    {formatBDT(filteredAllApprovedExpenses.reduce((sum, e) => sum + e.amount, 0) / 144)}
                  </td>
                  <td className="py-3 px-4 text-slate-500 text-[11px]">
                    Equal 1/144 Share Quota
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: SEND SINGLE OVERDUE ALERT VIA INFOCOMMUNICATIONVIEW             */}
      {/* ========================================================================= */}
      {showSingleAlertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xs animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BellRing className="w-5 h-5 text-rose-400" />
                <h3 className="text-base font-bold text-white">
                  Send Automated Overdue Alert
                </h3>
              </div>
              <button
                onClick={() => setShowSingleAlertModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Target Shareholder:</span>
                  <span className="font-bold text-white">
                    {currentMember.name} ({currentMember.id})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Share Allocation:</span>
                  <span className="font-mono text-emerald-400">Share #{currentMember.shareNumber} of 144</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Controlling Director:</span>
                  <span className="text-slate-200">{currentMember.controllingDirectorName}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-800 font-bold">
                  <span className="text-rose-400">Overdue Deficit to Demand:</span>
                  <span className="text-rose-400 font-mono text-sm">{formatBDT(overdueAmount)}</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Optional Executive Note / Memo (will appear in demand letter)
                </label>
                <textarea
                  rows={3}
                  value={customAlertNote}
                  onChange={(e) => setCustomAlertNote(e.target.value)}
                  placeholder="e.g. Please clear this overdue share quota balance prior to upcoming Phase-1 road compaction."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-[11px] text-emerald-300 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  This automated alert will instantly generate an official <strong>Finance & Deposit Query Demand Ticket</strong> and attach a certified demand letter in <strong>InfoCommunicationView</strong> for this shareholder.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSingleAlertModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendSingleAlert}
                  disabled={isDispatching}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold shadow flex items-center gap-1.5 transition"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isDispatching ? 'Dispatching...' : 'Dispatch Alert to Portal'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: OVERDUE ACCOUNTS MONITOR & BATCH ALERTS HUB                     */}
      {/* ========================================================================= */}
      {showOverdueMonitorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-xs animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    144-Share Overdue Accounts Monitor & Automated Alert Center
                  </h3>
                  <p className="text-xs text-slate-400">
                    Real-time audit across all 144 shares for deficit balances and automated notice issuance.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSendBatchAlerts}
                  disabled={isDispatching || allOverdueAccounts.length === 0}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow flex items-center gap-1.5 transition"
                  title="Send automated demand alert to all overdue members simultaneously"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>⚡ Batch Alert All {allOverdueAccounts.length} Overdue Accounts</span>
                </button>

                <button
                  onClick={() => setShowOverdueMonitorModal(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick KPI Strip */}
            <div className="px-6 py-3 bg-slate-950/60 border-b border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-3 shrink-0 text-xs">
              <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                <span className="text-slate-400">Total Scanned:</span>{' '}
                <strong className="text-white font-mono">144 Shares</strong>
              </div>
              <div className="p-2.5 bg-rose-950/40 rounded-lg border border-rose-800/40">
                <span className="text-rose-300">Overdue Deficits:</span>{' '}
                <strong className="text-rose-400 font-mono font-bold">{allOverdueAccounts.length} Accounts</strong>
              </div>
              <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                <span className="text-slate-400">Total Overdue Sum:</span>{' '}
                <strong className="text-rose-400 font-mono font-bold">{formatBDT(totalOverdueCapital)}</strong>
              </div>
              <div className="p-2.5 bg-emerald-950/40 rounded-lg border border-emerald-800/40">
                <span className="text-emerald-300">Advance / Equilibrium:</span>{' '}
                <strong className="text-emerald-400 font-mono">{144 - allOverdueAccounts.length} Shares</strong>
              </div>
            </div>

            {/* Controls Filter Bar */}
            <div className="px-6 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2 text-xs">
                <label className="text-slate-400">Controlling Director:</label>
                <select
                  value={monitorDirectorFilter}
                  onChange={(e) => setMonitorDirectorFilter(e.target.value)}
                  className="px-2.5 py-1 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                >
                  <option value="ALL">All Directors</option>
                  {Array.from(new Set(members.map((m) => m.controllingDirectorName))).map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative w-72 text-xs">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={monitorSearchQuery}
                  onChange={(e) => setMonitorSearchQuery(e.target.value)}
                  placeholder="Search by ID, name, share #..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs placeholder-slate-500"
                />
              </div>
            </div>

            {/* Overdue Table */}
            <div className="p-6 overflow-y-auto flex-1">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800 text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3">Member ID</th>
                    <th className="py-2.5 px-3">Shareholder</th>
                    <th className="py-2.5 px-3">Controlling Director</th>
                    <th className="py-2.5 px-3 text-right">Deposited (BDT)</th>
                    <th className="py-2.5 px-3 text-right">Share Khorch (BDT)</th>
                    <th className="py-2.5 px-3 text-right">Overdue Deficit</th>
                    <th className="py-2.5 px-3 text-center">Alert Status</th>
                    <th className="py-2.5 px-3 text-right">Quick Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredOverdueAccounts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500">
                        No overdue accounts match your filter.
                      </td>
                    </tr>
                  ) : (
                    filteredOverdueAccounts.map((acc) => {
                      const existingAlerts = storageService.getOverdueAlertsForMember(acc.memberId);
                      const hasAlert = existingAlerts.length > 0;

                      return (
                        <tr key={acc.memberId} className="hover:bg-slate-800/40">
                          <td className="py-2.5 px-3 font-mono font-bold text-emerald-400">
                            <button
                              onClick={() => {
                                setSelectedMemberId(acc.memberId);
                                setShowOverdueMonitorModal(false);
                              }}
                              className="hover:underline text-left"
                              title="Click to inspect member statement"
                            >
                              {acc.memberId}
                            </button>
                          </td>
                          <td className="py-2.5 px-3 font-medium text-slate-200">
                            {acc.member.name} (Share #{acc.shareNumber})
                          </td>
                          <td className="py-2.5 px-3 text-slate-300">
                            {acc.controllingDirector.name}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                            {formatBDT(acc.memberPersonalDeposit)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                            {formatBDT(acc.memberShareExpense)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-400">
                            {formatBDT(Math.abs(acc.currentBalance))}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {hasAlert ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                                Dispatched
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                                Pending
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              onClick={() => handleSendAlertFromTable(acc)}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-rose-600 text-slate-200 hover:text-white rounded text-[11px] font-semibold transition"
                            >
                              Send Alert
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: BOARD PRESENTATION SUMMARY PDF MODAL                             */}
      {/* ========================================================================= */}
      <BoardPresentationPDFModal
        isOpen={showBoardPDFModal}
        onClose={() => setShowBoardPDFModal(false)}
        incomes={incomes}
        expenses={expenses}
        members={members}
        currentUser={currentUser}
      />
    </div>
  );
};
