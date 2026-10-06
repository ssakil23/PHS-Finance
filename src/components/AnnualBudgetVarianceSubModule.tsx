import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Calendar,
  Download,
  Printer,
  Edit3,
  CheckCircle,
  AlertTriangle,
  Clock,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Filter,
  PlusCircle,
  Sparkles,
  Info,
  DollarSign,
  Layers,
  FileSpreadsheet,
} from 'lucide-react';
import {
  AnnualBudget,
  AnnualBudgetVarianceReport,
  BudgetVarianceItem,
  ExpenseEntry,
  User,
} from '../types';
import { storageService } from '../services/storageService';
import { formatBDT } from '../utils/calculations';

interface AnnualBudgetVarianceSubModuleProps {
  expenses: ExpenseEntry[];
  currentUser: User | null;
}

export const AnnualBudgetVarianceSubModule: React.FC<AnnualBudgetVarianceSubModuleProps> = ({
  expenses,
  currentUser,
}) => {
  const [selectedFiscalYear, setSelectedFiscalYear] = useState<string>('2025-2026');
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UNDER_BUDGET' | 'ON_TRACK' | 'OVER_BUDGET'>('ALL');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ error?: string; success?: string }>({});

  const canEditBudget =
    currentUser?.role === 'SYSTEM_ADMIN' || currentUser?.role === 'DELEGATED_ADMIN';

  // Fetch all available budgets
  const budgets = useMemo(() => storageService.getAnnualBudgets(), []);

  // Compute variance report for active fiscal year
  const varianceReport: AnnualBudgetVarianceReport = useMemo(() => {
    return storageService.computeBudgetVarianceReport(selectedFiscalYear);
  }, [selectedFiscalYear, expenses]);

  const activeBudget = useMemo(() => {
    return (
      budgets.find((b) => b.fiscalYear === selectedFiscalYear) ||
      budgets[0]
    );
  }, [budgets, selectedFiscalYear]);

  // Form state for editing budget targets
  const [editingFiscalYear, setEditingFiscalYear] = useState(selectedFiscalYear);
  const [editingTitle, setEditingTitle] = useState(activeBudget?.title || '');
  const [editingNotes, setEditingNotes] = useState(activeBudget?.notes || '');
  const [editingTargets, setEditingTargets] = useState<Record<string, number>>({});

  const handleOpenConfigModal = () => {
    const targetMap: Record<string, number> = {};
    activeBudget?.categoryTargets.forEach((ct) => {
      targetMap[ct.category] = ct.targetAmountBDT;
    });
    setEditingFiscalYear(activeBudget?.fiscalYear || selectedFiscalYear);
    setEditingTitle(activeBudget?.title || `PHS Annual Operating Budget (${selectedFiscalYear})`);
    setEditingNotes(activeBudget?.notes || '');
    setEditingTargets(targetMap);
    setFeedbackMsg({});
    setShowConfigModal(true);
  };

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !canEditBudget) return;

    try {
      const categoryTargets = Object.entries(editingTargets).map(([category, targetAmountBDT]) => ({
        category,
        targetAmountBDT: Number(targetAmountBDT) || 0,
      }));

      const newBudget: AnnualBudget = {
        id: activeBudget?.id || `BUDGET-FY-${editingFiscalYear}`,
        fiscalYear: editingFiscalYear,
        title: editingTitle.trim() || `PHS Annual Budget FY ${editingFiscalYear}`,
        totalBudgetTargetBDT: categoryTargets.reduce((sum, c) => sum + c.targetAmountBDT, 0),
        categoryTargets,
        status: activeBudget?.status || 'ACTIVE',
        approvedByBoard: true,
        approvedBy: currentUser.id,
        approvedByName: `${currentUser.name} (${currentUser.role === 'SYSTEM_ADMIN' ? 'President & Root Admin' : 'Director / Delegated Admin'})`,
        approvedAt: new Date().toISOString(),
        createdAt: activeBudget?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        notes: editingNotes.trim(),
      };

      const res = storageService.saveAnnualBudget(newBudget, currentUser);
      setFeedbackMsg({ success: res.message });
      setTimeout(() => {
        setShowConfigModal(false);
        setFeedbackMsg({});
      }, 1500);
    } catch (err: any) {
      setFeedbackMsg({ error: err.message || 'Failed to update annual budget targets.' });
    }
  };

  const handleExportCSV = () => {
    const csvContent = storageService.exportBudgetVarianceCSV(selectedFiscalYear);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `PHS_Annual_Budget_Variance_Report_FY_${selectedFiscalYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  // Filtered Items
  const filteredItems = useMemo(() => {
    if (statusFilter === 'ALL') return varianceReport.items;
    return varianceReport.items.filter((i) => i.status === statusFilter);
  }, [varianceReport.items, statusFilter]);

  // Matching expenses for drilldown
  const getExpensesForCategory = (category: string) => {
    return expenses
      .filter((e) => !e.isSoftDeleted && e.status === 'APPROVED' && (e.category || 'Others') === category)
      .slice(0, 10);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Ribbon */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60">
                Board Financial Control
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Annual Budget Tracking & Variance Analysis
              </span>
              <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Board Approved</span>
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>Annual Expenditure Budget vs. Actual Variance</span>
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Track approved society expenditures against the annual budget target set by the Board of Directors. Monitor favorable surpluses, over-budget anomalies, and fiscal utilization in real time.
            </p>
          </div>

          {/* Action Buttons & Fiscal Year Selector */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Fiscal Year Switcher */}
            <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-400 font-medium">Fiscal Year:</span>
              <select
                value={selectedFiscalYear}
                onChange={(e) => setSelectedFiscalYear(e.target.value)}
                className="bg-transparent text-white font-mono font-bold focus:outline-none cursor-pointer"
              >
                {budgets.map((b) => (
                  <option key={b.fiscalYear} value={b.fiscalYear} className="bg-slate-900 text-white">
                    FY {b.fiscalYear} ({b.status})
                  </option>
                ))}
              </select>
            </div>

            {/* Set Budget Targets (Board privilege) */}
            {canEditBudget && (
              <button
                onClick={handleOpenConfigModal}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md flex items-center gap-1.5 transition"
                title="Board privilege: Configure category annual budget targets"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Set Budget Targets</span>
              </button>
            )}

            {/* Export CSV */}
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow"
              title="Download Variance Analysis CSV for board audit or external accounting"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export CSV</span>
            </button>

            {/* Print Board Report */}
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
              title="Print Variance Report"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Annual Budget Allocation */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-3">
            <span>Total Annual Budget Target</span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white font-mono tracking-tight">
            {formatBDT(varianceReport.totalBudgetTargetBDT)}
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-2">
            <span>Fiscal Year: FY {selectedFiscalYear}</span>
            <span className="text-indigo-400 font-semibold">{varianceReport.items.length} Categories</span>
          </div>
        </div>

        {/* Total Actual Expenditure */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-3">
            <span>Actual Approved Expenditures</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-300 font-mono tracking-tight">
            {formatBDT(varianceReport.totalActualExpenseBDT)}
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-2">
            <span>Approved Vouchers:</span>
            <span className="font-mono text-slate-200">
              {expenses.filter((e) => !e.isSoftDeleted && e.status === 'APPROVED').length} entries
            </span>
          </div>
        </div>

        {/* Net Budget Variance */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-3">
            <span>Net Variance (Budget − Actual)</span>
            <div
              className={`p-2 rounded-lg ${
                varianceReport.netVarianceBDT >= 0
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'bg-rose-500/10 text-rose-400'
              }`}
            >
              {varianceReport.netVarianceBDT >= 0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <AlertTriangle className="w-4 h-4" />
              )}
            </div>
          </div>
          <div
            className={`text-2xl font-bold font-mono tracking-tight ${
              varianceReport.netVarianceBDT >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {formatBDT(varianceReport.netVarianceBDT)}
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-2">
            <span>Status:</span>
            <span
              className={`font-semibold ${
                varianceReport.netVarianceBDT >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {varianceReport.netVarianceBDT >= 0 ? 'Favorable Surplus' : 'Unfavorable Deficit'}
            </span>
          </div>
        </div>

        {/* Overall Utilization Rate */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-3">
            <span>Overall Budget Utilization</span>
            <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-2xl font-bold font-mono tracking-tight ${
                varianceReport.overallUtilizationRate > 100
                  ? 'text-rose-400'
                  : varianceReport.overallUtilizationRate >= 80
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {varianceReport.overallUtilizationRate.toFixed(1)}%
            </span>
            <span className="text-xs text-slate-400 font-medium">Consumed</span>
          </div>

          {/* Visual Progress Bar */}
          <div className="mt-3 w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                varianceReport.overallUtilizationRate > 100
                  ? 'bg-rose-500'
                  : varianceReport.overallUtilizationRate >= 80
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(varianceReport.overallUtilizationRate, 100)}%` }}
            />
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
            <span className="text-emerald-400">{varianceReport.favorableCategoriesCount} Under Budget</span>
            <span className="text-rose-400">{varianceReport.unfavorableCategoriesCount} Over Budget</span>
          </div>
        </div>
      </div>

      {/* Variance Analysis Report Table Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        {/* Table Header Strip & Filters */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
              <span>Category Variance Analysis Report (FY {selectedFiscalYear})</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Variance = Annual Target − Actual Expenses. Positive figures indicate surplus capital remaining under the board limit.
            </p>
          </div>

          {/* Status Filter Buttons */}
          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                statusFilter === 'ALL'
                  ? 'bg-emerald-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({varianceReport.items.length})
            </button>
            <button
              onClick={() => setStatusFilter('UNDER_BUDGET')}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                statusFilter === 'UNDER_BUDGET'
                  ? 'bg-emerald-950/80 text-emerald-300 font-semibold border border-emerald-800/80'
                  : 'text-slate-400 hover:text-emerald-300'
              }`}
            >
              Under Budget ({varianceReport.favorableCategoriesCount})
            </button>
            <button
              onClick={() => setStatusFilter('OVER_BUDGET')}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                statusFilter === 'OVER_BUDGET'
                  ? 'bg-rose-950/80 text-rose-300 font-semibold border border-rose-800/80'
                  : 'text-slate-400 hover:text-rose-300'
              }`}
            >
              Over Budget ({varianceReport.unfavorableCategoriesCount})
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Expense Category</th>
                <th className="py-3.5 px-4 text-right">Budget Target (BDT)</th>
                <th className="py-3.5 px-4 text-right">Actual Expense (BDT)</th>
                <th className="py-3.5 px-4 text-right">Variance Amount (BDT)</th>
                <th className="py-3.5 px-4 text-center">Utilization Rate</th>
                <th className="py-3.5 px-3 text-center">Audit Status</th>
                <th className="py-3.5 px-3 text-center">Vouchers</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredItems.map((item) => {
                const isUnder = item.status === 'UNDER_BUDGET';
                const isOver = item.status === 'OVER_BUDGET';
                const isExpanded = expandedCategory === item.category;
                const catExpenses = getExpensesForCategory(item.category);

                return (
                  <React.Fragment key={item.category}>
                    <tr
                      className={`hover:bg-slate-800/40 transition cursor-pointer ${
                        isOver ? 'bg-rose-950/10' : ''
                      }`}
                      onClick={() => setExpandedCategory(isExpanded ? null : item.category)}
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-200 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-400" />
                          <span>{item.category}</span>
                        </div>
                        {activeBudget.categoryTargets.find((ct) => ct.category === item.category)?.notes && (
                          <div className="text-[11px] text-slate-400 mt-0.5 italic">
                            {activeBudget.categoryTargets.find((ct) => ct.category === item.category)?.notes}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-200">
                        {formatBDT(item.budgetTargetBDT)}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-amber-300">
                        {formatBDT(item.actualExpenseBDT)}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold">
                        <span
                          className={`inline-flex items-center gap-1 ${
                            item.varianceBDT >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {item.varianceBDT >= 0 ? '+' : ''}
                          {formatBDT(item.varianceBDT)}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex flex-col items-center">
                          <span
                            className={`font-mono font-bold text-xs ${
                              isOver
                                ? 'text-rose-400'
                                : item.utilizationRate >= 80
                                ? 'text-amber-400'
                                : 'text-emerald-400'
                            }`}
                          >
                            {item.utilizationRate.toFixed(1)}%
                          </span>
                          <div className="w-24 bg-slate-800 rounded-full h-1.5 mt-1 overflow-hidden">
                            <div
                              className={`h-1.5 rounded-full ${
                                isOver
                                  ? 'bg-rose-500'
                                  : item.utilizationRate >= 80
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.min(item.utilizationRate, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            isOver
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                              : item.status === 'ON_TRACK'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {isOver
                            ? 'Over Budget'
                            : item.status === 'ON_TRACK'
                            ? 'Near Limit (80-100%)'
                            : 'Under Budget (Surplus)'}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <button
                          type="button"
                          className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white"
                          title="View category expense transactions"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                    </tr>

                    {/* Drilldown details on click */}
                    {isExpanded && (
                      <tr className="bg-slate-950/90 border-y border-slate-800">
                        <td colSpan={7} className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-slate-300">
                                Recent Approved Expense Vouchers for "{item.category}":
                              </span>
                              <span className="text-[11px] text-slate-400 font-mono">
                                Total {catExpenses.length} transactions recorded
                              </span>
                            </div>

                            {catExpenses.length === 0 ? (
                              <div className="text-slate-500 italic text-xs py-2">
                                No approved expenditures recorded yet in this category for this period.
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                                {catExpenses.map((exp) => (
                                  <div
                                    key={exp.id}
                                    className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-between"
                                  >
                                    <div>
                                      <div className="font-mono text-emerald-400 font-semibold">
                                        {exp.id} • {exp.date}
                                      </div>
                                      <div className="text-slate-300 text-[11px] mt-0.5">
                                        Payee: <strong>{exp.billRecipient}</strong>
                                      </div>
                                      {exp.remarks && (
                                        <div className="text-slate-400 text-[10px] truncate max-w-xs mt-0.5">
                                          {exp.remarks}
                                        </div>
                                      )}
                                    </div>
                                    <div className="text-right">
                                      <div className="font-mono font-bold text-amber-300">
                                        {formatBDT(exp.amount)}
                                      </div>
                                      <span className="text-[9px] uppercase px-1.5 py-0.2 bg-emerald-950 text-emerald-400 rounded border border-emerald-800 font-semibold">
                                        Approved
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>

            {/* Table Summary Footer */}
            <tfoot className="bg-slate-950 font-semibold text-slate-200 border-t-2 border-slate-700 text-xs">
              <tr>
                <td className="py-4 px-4 font-bold text-white">
                  TOTAL (FY {varianceReport.fiscalYear} Annual Budget)
                </td>
                <td className="py-4 px-4 text-right font-mono font-bold text-indigo-400">
                  {formatBDT(varianceReport.totalBudgetTargetBDT)}
                </td>
                <td className="py-4 px-4 text-right font-mono font-bold text-amber-300">
                  {formatBDT(varianceReport.totalActualExpenseBDT)}
                </td>
                <td className="py-4 px-4 text-right font-mono font-bold">
                  <span
                    className={
                      varianceReport.netVarianceBDT >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }
                  >
                    {varianceReport.netVarianceBDT >= 0 ? '+' : ''}
                    {formatBDT(varianceReport.netVarianceBDT)}
                  </span>
                </td>
                <td className="py-4 px-4 text-center font-mono font-bold">
                  <span
                    className={
                      varianceReport.overallUtilizationRate > 100
                        ? 'text-rose-400'
                        : varianceReport.overallUtilizationRate >= 80
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }
                  >
                    {varianceReport.overallUtilizationRate.toFixed(1)}% Consumed
                  </span>
                </td>
                <td className="py-4 px-3 text-center">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      varianceReport.netVarianceBDT >= 0
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {varianceReport.netVarianceBDT >= 0 ? 'Favorable Surplus' : 'Deficit Exceeded'}
                  </span>
                </td>
                <td className="py-4 px-3 text-center text-slate-400 text-[10px]">
                  Board Verified
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Board Target Configuration Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in fade-in duration-200">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-emerald-400" />
                <span>Configure Annual Budget Targets (Board of Directors)</span>
              </h3>
              <button
                onClick={() => setShowConfigModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBudget} className="p-6 space-y-4 text-xs">
              {/* Header Description */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-slate-300">
                <span className="font-semibold text-emerald-400">Board Authority:</span> As a Board member (
                {currentUser?.name}), you have authorization to set or adjust the annual budget ceilings for each expenditure line item.
              </div>

              {/* Feedback banners */}
              {feedbackMsg.error && (
                <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{feedbackMsg.error}</span>
                </div>
              )}

              {feedbackMsg.success && (
                <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>{feedbackMsg.success}</span>
                </div>
              )}

              {/* Fiscal Year & Title */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-slate-300 font-semibold">Fiscal Year</label>
                  <input
                    type="text"
                    required
                    value={editingFiscalYear}
                    onChange={(e) => setEditingFiscalYear(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-xs focus:border-emerald-500"
                    placeholder="e.g. 2025-2026"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-300 font-semibold">Budget Title</label>
                  <input
                    type="text"
                    required
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:border-emerald-500"
                    placeholder="e.g. PHS Annual Operating Budget"
                  />
                </div>
              </div>

              {/* Category Targets Grid */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-slate-300 font-semibold">
                    Category Expenditure Targets (BDT)
                  </label>
                  <span className="text-[11px] font-mono text-emerald-400 font-bold">
                    Total: {formatBDT(Object.values(editingTargets).reduce((a, b) => a + (Number(b) || 0), 0))}
                  </span>
                </div>

                <div className="max-h-60 overflow-y-auto pr-1 space-y-2">
                  {Object.keys(editingTargets).map((cat) => (
                    <div
                      key={cat}
                      className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between gap-3"
                    >
                      <span className="font-semibold text-slate-300">{cat}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500 font-mono">৳</span>
                        <input
                          type="number"
                          min="0"
                          step="1000"
                          value={editingTargets[cat]}
                          onChange={(e) =>
                            setEditingTargets({
                              ...editingTargets,
                              [cat]: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-36 px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-right text-white font-mono text-xs focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Strategic Notes */}
              <div className="space-y-1">
                <label className="block text-slate-300 font-semibold">
                  Board Remarks & Statutory Justification
                </label>
                <textarea
                  rows={2}
                  value={editingNotes}
                  onChange={(e) => setEditingNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:border-emerald-500"
                  placeholder="e.g. Approved at Board meeting on 01 July. Priority given to earth leveling and road development."
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold shadow"
                >
                  Commit & Save Targets
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
