import React, { useState } from 'react';
import {
  X,
  Printer,
  Download,
  Building,
  TrendingUp,
  TrendingDown,
  Wallet,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  FileText,
  Users,
  PieChart,
  BarChart3,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  IncomeEntry,
  ExpenseEntry,
  Member,
  User,
  AnnualBudget,
} from '../types';
import {
  computeProjectFinancials,
  computeDirectorSummaries,
  computeAllMemberSummaries,
  formatBDT,
} from '../utils/calculations';
import { TOTAL_SHARES } from '../utils/directors';
import { storageService } from '../services/storageService';
import { downloadSocietySummaryPDF } from '../utils/generateSocietySummaryPDF';

interface BoardPresentationPDFModalProps {
  isOpen: boolean;
  onClose: () => void;
  incomes: IncomeEntry[];
  expenses: ExpenseEntry[];
  members: Member[];
  currentUser: User | null;
  initialFiscalYear?: string;
}

export const BoardPresentationPDFModal: React.FC<BoardPresentationPDFModalProps> = ({
  isOpen,
  onClose,
  incomes,
  expenses,
  members,
  currentUser,
  initialFiscalYear = '2025-2026',
}) => {
  const [selectedFiscalYear, setSelectedFiscalYear] = useState<string>(initialFiscalYear);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'BUDGET_VARIANCE' | 'SHARE_LEDGER' | 'DIRECTOR_PORTFOLIOS' | 'RECOMMENDATIONS'>('OVERVIEW');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  if (!isOpen) return null;

  const financials = computeProjectFinancials(incomes, expenses);
  const directorSummaries = computeDirectorSummaries(incomes, expenses);
  const memberSummaries = computeAllMemberSummaries(members, incomes, expenses);
  const varianceReport = storageService.computeBudgetVarianceReport(selectedFiscalYear);

  const advanceMembers = memberSummaries.filter((m) => m.currentBalance > 0.01);
  const overdueMembers = memberSummaries.filter((m) => m.currentBalance < -0.01);
  const balancedMembers = memberSummaries.filter(
    (m) => Math.abs(m.currentBalance) <= 0.01
  );

  const totalOverdueReceivable = overdueMembers.reduce(
    (sum, m) => sum + Math.abs(m.currentBalance),
    0
  );
  const totalAdvanceSurplus = advanceMembers.reduce(
    (sum, m) => sum + m.currentBalance,
    0
  );
  const complianceRate =
    TOTAL_SHARES > 0
      ? ((advanceMembers.length + balancedMembers.length) / TOTAL_SHARES) * 100
      : 0;

  const handleDownloadPDF = () => {
    try {
      setIsGeneratingPDF(true);
      downloadSocietySummaryPDF({
        fiscalYear: selectedFiscalYear,
        incomes,
        expenses,
        members,
        currentUser,
      });
      setTimeout(() => setIsGeneratingPDF(false), 1000);
    } catch (err) {
      console.error('PDF Generation failed:', err);
      setIsGeneratingPDF(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-5xl w-full shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Top Control Bar */}
        <div className="px-6 py-3.5 border-b border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-wide">
                  Society Board Presentation & Annual Summary Report
                </h3>
                <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  FY {selectedFiscalYear}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Consolidated income, expenditure, budget variance, and 144-share ledger health report.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedFiscalYear}
              onChange={(e) => setSelectedFiscalYear(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-emerald-400 focus:outline-none"
            >
              <option value="2025-2026">FY 2025-2026</option>
              <option value="2026-2027">FY 2026-2027</option>
            </select>

            <button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow transition"
              title="Generate and download printable PDF document with official letterhead"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isGeneratingPDF ? 'Generating...' : 'Download Board PDF'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
              title="Print document or save using browser dialog"
            >
              <Printer className="w-3.5 h-3.5 text-slate-300" />
              <span>Print</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Sub-Navigation */}
        <div className="px-6 py-2 bg-slate-950/80 border-b border-slate-800 flex items-center gap-2 overflow-x-auto shrink-0 print:hidden text-xs">
          <button
            onClick={() => setActiveTab('OVERVIEW')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              activeTab === 'OVERVIEW'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Executive Summary
          </button>
          <button
            onClick={() => setActiveTab('BUDGET_VARIANCE')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              activeTab === 'BUDGET_VARIANCE'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Annual Budget & Variance
          </button>
          <button
            onClick={() => setActiveTab('SHARE_LEDGER')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              activeTab === 'SHARE_LEDGER'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            144-Share Ledger Health
          </button>
          <button
            onClick={() => setActiveTab('DIRECTOR_PORTFOLIOS')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              activeTab === 'DIRECTOR_PORTFOLIOS'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Director Portfolios
          </button>
          <button
            onClick={() => setActiveTab('RECOMMENDATIONS')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              activeTab === 'RECOMMENDATIONS'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Board Resolutions & Sign-Offs
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-100">
          {/* Letterhead Header Banner */}
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                  Certified Society Presentation Dossier
                </span>
              </div>
              <h2 className="text-xl font-black text-white uppercase tracking-tight">
                Prottasha Housing Society Ltd.
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Central Registry Office: Sector 14, Uttara Model Town, Dhaka-1230 • 144 Authorized Shares Capital
              </p>
            </div>

            <div className="flex flex-col items-start md:items-end text-xs text-slate-400">
              <span className="font-mono text-emerald-400 font-bold">
                Audit Scope: FY {selectedFiscalYear}
              </span>
              <span>Compiled by: <strong>Saif Ahmed Sakil</strong> (ISRT, DU)</span>
              <span className="text-[11px] text-slate-500">
                Official Board Stamp: {new Date().toLocaleDateString('en-GB')}
              </span>
            </div>
          </div>

          {/* 4 Core Macro Indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
              <div className="text-[11px] text-slate-400 font-medium">Total Society Revenue (Joma)</div>
              <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
                {formatBDT(financials.totalCollection)}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                General: {formatBDT(financials.totalGeneralDeposits)}
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
              <div className="text-[11px] text-slate-400 font-medium">Total Project Expenses (Khorch)</div>
              <div className="text-xl font-bold font-mono text-rose-400 mt-1">
                {formatBDT(financials.totalProjectExpense)}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                Approved vouchers & procurement
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
              <div className="text-[11px] text-slate-400 font-medium">Net Society Balance</div>
              <div
                className={`text-xl font-bold font-mono mt-1 ${
                  financials.netSocietyBalance >= 0 ? 'text-teal-400' : 'text-rose-400'
                }`}
              >
                {formatBDT(financials.netSocietyBalance)}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                {financials.netSocietyBalance >= 0 ? 'Surplus liquid reserve' : 'Deficit / Share calls needed'}
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
              <div className="text-[11px] text-slate-400 font-medium">Per-Share Quota (1/144)</div>
              <div className="text-xl font-bold font-mono text-white mt-1">
                {formatBDT(financials.perShareExpense)}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                Equal member allocation formula
              </div>
            </div>
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-6">
              {/* Share Ledger Health Highlights */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-400" />
                    <span>144-Share Ledger Health Summary</span>
                  </h4>
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    Compliance: {complianceRate.toFixed(1)}%
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-3.5 rounded-lg bg-emerald-950/40 border border-emerald-800/40">
                    <div className="text-emerald-400 font-semibold mb-1">Surplus / Advance Accounts</div>
                    <div className="text-2xl font-bold font-mono text-emerald-300">
                      {advanceMembers.length} <span className="text-xs font-normal text-slate-400">/ 144 shares</span>
                    </div>
                    <div className="text-slate-400 mt-1">
                      Total Advance Capital: <strong>{formatBDT(totalAdvanceSurplus)}</strong>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-lg bg-rose-950/40 border border-rose-800/40">
                    <div className="text-rose-400 font-semibold mb-1">Overdue / Deficit Accounts</div>
                    <div className="text-2xl font-bold font-mono text-rose-300">
                      {overdueMembers.length} <span className="text-xs font-normal text-slate-400">/ 144 shares</span>
                    </div>
                    <div className="text-slate-400 mt-1">
                      Total Overdue Dues: <strong>{formatBDT(totalOverdueReceivable)}</strong>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-slate-300 font-semibold mb-1">Equilibrium Accounts</div>
                    <div className="text-2xl font-bold font-mono text-slate-200">
                      {balancedMembers.length} <span className="text-xs font-normal text-slate-400">/ 144 shares</span>
                    </div>
                    <div className="text-slate-400 mt-1">
                      Zero balance / exactly matched
                    </div>
                  </div>
                </div>
              </div>

              {/* Annual Budget Snapshot */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-emerald-400" />
                    <span>Annual Budget Target vs Expenditures (FY {selectedFiscalYear})</span>
                  </h4>
                  <div className="text-xs font-mono text-slate-400">
                    Utilization: <strong className="text-emerald-400">{varianceReport.overallUtilizationRate.toFixed(1)}%</strong>
                  </div>
                </div>

                <div className="space-y-3">
                  {varianceReport.items.slice(0, 5).map((item) => (
                    <div key={item.category} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-slate-300">{item.category}</span>
                        <span className="font-mono text-slate-400">
                          {formatBDT(item.actualExpenseBDT)} / {formatBDT(item.targetAmountBDT)} ({item.utilizationRate.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            item.utilizationRate > 100
                              ? 'bg-rose-500'
                              : item.utilizationRate > 80
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(item.utilizationRate, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BUDGET & VARIANCE */}
          {activeTab === 'BUDGET_VARIANCE' && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
                <h4 className="text-sm font-bold text-white">Itemized Budget Variance Ledger</h4>
                <div className="text-xs text-slate-400">
                  Target: <strong className="text-white">{formatBDT(varianceReport.totalBudgetTargetBDT)}</strong>
                  <span className="mx-2">|</span>
                  Actual: <strong className="text-emerald-400">{formatBDT(varianceReport.totalActualExpenseBDT)}</strong>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-slate-400 uppercase font-semibold border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-4">Expense Category</th>
                      <th className="py-2.5 px-4 text-right">Annual Target (BDT)</th>
                      <th className="py-2.5 px-4 text-right">Actual Spent (BDT)</th>
                      <th className="py-2.5 px-4 text-right">Variance (BDT)</th>
                      <th className="py-2.5 px-3 text-center">Utilization</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {varianceReport.items.map((item) => (
                      <tr key={item.category} className="hover:bg-slate-900/40">
                        <td className="py-3 px-4 font-semibold text-slate-200">{item.category}</td>
                        <td className="py-3 px-4 text-right font-mono text-slate-300">
                          {formatBDT(item.targetAmountBDT)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-emerald-400 font-bold">
                          {formatBDT(item.actualExpenseBDT)}
                        </td>
                        <td
                          className={`py-3 px-4 text-right font-mono font-bold ${
                            item.varianceBDT >= 0 ? 'text-teal-400' : 'text-rose-400'
                          }`}
                        >
                          {item.varianceBDT >= 0 ? '+' : ''}
                          {formatBDT(item.varianceBDT)}
                        </td>
                        <td className="py-3 px-3 text-center font-mono">
                          {item.utilizationRate.toFixed(1)}%
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              item.status === 'UNDER_BUDGET'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : item.status === 'ON_TRACK'
                                ? 'bg-blue-950 text-blue-400 border border-blue-800'
                                : 'bg-rose-950 text-rose-400 border border-rose-800'
                            }`}
                          >
                            {item.status.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: SHARE LEDGER */}
          {activeTab === 'SHARE_LEDGER' && (
            <div className="space-y-4">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">Overdue Shareholder Accounts ({overdueMembers.length})</h4>
                  <p className="text-xs text-slate-400">Shareholders with personal deposits below their 1/144th quota.</p>
                </div>
                <div className="text-xs font-mono font-bold text-rose-400">
                  Total Overdue: {formatBDT(totalOverdueReceivable)}
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 text-slate-400 uppercase font-semibold border-b border-slate-800">
                      <tr>
                        <th className="py-2.5 px-4">Member ID</th>
                        <th className="py-2.5 px-4">Shareholder</th>
                        <th className="py-2.5 px-4">Director</th>
                        <th className="py-2.5 px-4 text-right">Personal Deposit</th>
                        <th className="py-2.5 px-4 text-right">Share Quota</th>
                        <th className="py-2.5 px-4 text-right">Overdue Deficit</th>
                        <th className="py-2.5 px-3 text-center">Action Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {overdueMembers.slice(0, 15).map((om) => (
                        <tr key={om.memberId} className="hover:bg-slate-900/40">
                          <td className="py-2.5 px-4 font-mono font-bold text-emerald-400">{om.memberId}</td>
                          <td className="py-2.5 px-4 font-semibold text-slate-200">
                            {om.member.name} (Share #{om.shareNumber})
                          </td>
                          <td className="py-2.5 px-4 text-slate-300">{om.controllingDirector.name}</td>
                          <td className="py-2.5 px-4 text-right font-mono text-slate-300">
                            {formatBDT(om.memberPersonalDeposit)}
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono text-slate-400">
                            {formatBDT(om.memberShareExpense)}
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono font-bold text-rose-400">
                            {formatBDT(Math.abs(om.currentBalance))}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                              Alert Active
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: DIRECTOR PORTFOLIOS */}
          {activeTab === 'DIRECTOR_PORTFOLIOS' && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-slate-800 bg-slate-900/60">
                <h4 className="text-sm font-bold text-white">8 Controlling Director Portfolios (144 Shares)</h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-slate-400 uppercase font-semibold border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-4">Controlling Director</th>
                      <th className="py-2.5 px-4">Share Range</th>
                      <th className="py-2.5 px-4 text-right">Collections (BDT)</th>
                      <th className="py-2.5 px-4 text-right">Expense Quota (BDT)</th>
                      <th className="py-2.5 px-4 text-right">Net Balance (BDT)</th>
                      <th className="py-2.5 px-3 text-center">Recovery %</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {directorSummaries.map((ds) => (
                      <tr key={ds.director.key} className="hover:bg-slate-900/40">
                        <td className="py-3 px-4 font-bold text-white">{ds.director.name}</td>
                        <td className="py-3 px-4 font-mono text-slate-300">
                          {ds.director.shareCount} Shares (#{ds.director.startShare}-{ds.director.endShare})
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-emerald-400 font-bold">
                          {formatBDT(ds.totalCollection)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-300">
                          {formatBDT(ds.totalExpense)}
                        </td>
                        <td
                          className={`py-3 px-4 text-right font-mono font-bold ${
                            ds.currentBalance >= 0 ? 'text-teal-400' : 'text-rose-400'
                          }`}
                        >
                          {ds.currentBalance >= 0 ? '+' : ''}
                          {formatBDT(ds.currentBalance)}
                        </td>
                        <td className="py-3 px-3 text-center font-mono">
                          {ds.collectionPercentage.toFixed(1)}%
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              ds.status === 'SURPLUS'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : ds.status === 'DEFICIT'
                                ? 'bg-rose-950 text-rose-400 border border-rose-800'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {ds.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: RECOMMENDATIONS */}
          {activeTab === 'RECOMMENDATIONS' && (
            <div className="space-y-6">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Executive Board Presentation Findings & Action Directives</span>
                </h4>
                <ul className="space-y-2 text-xs text-slate-300 list-disc list-inside">
                  <li>
                    <strong>Liquidity Preservation:</strong> Net treasury reserves of {formatBDT(financials.netSocietyBalance)} are available in bank escrow to service current Phase-1 site grading contracts.
                  </li>
                  <li>
                    <strong>Share Capital Call & Overdue Recovery:</strong> {overdueMembers.length} shareholders with overdue deficit totaling {formatBDT(totalOverdueReceivable)} have been dispatched automated payment demand alerts via the InfoCommunicationView.
                  </li>
                  <li>
                    <strong>Budget Compliance:</strong> FY {selectedFiscalYear} expenditures are maintained within approved ceiling of {formatBDT(varianceReport.totalBudgetTargetBDT)}.
                  </li>
                  <li>
                    <strong>Shareholder Roster & Plot Allotments:</strong> All 144 shares remain fully allocated and registered in Sector 14, Uttara.
                  </li>
                </ul>
              </div>

              {/* Sign-off Block */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-5">
                <div className="text-xs font-bold uppercase text-slate-400 mb-4">Official Executive Sign-Offs</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                  <div className="border-t-2 border-slate-700 pt-2">
                    <div className="font-bold text-white">Saif Ahmed Sakil</div>
                    <div className="text-slate-400">President & Root System Admin</div>
                    <div className="text-[11px] text-slate-500">ISRT, University of Dhaka</div>
                  </div>

                  <div className="border-t-2 border-slate-700 pt-2">
                    <div className="font-bold text-white">Engr. Rashedul Islam</div>
                    <div className="text-slate-400">Director - Technical & Planning</div>
                    <div className="text-[11px] text-slate-500">Executive Committee</div>
                  </div>

                  <div className="border-t-2 border-slate-700 pt-2">
                    <div className="font-bold text-white">Dr. Farhana Chowdhury</div>
                    <div className="text-slate-400">Director - Finance & Internal Audit</div>
                    <div className="text-[11px] text-slate-500">Executive Committee</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
