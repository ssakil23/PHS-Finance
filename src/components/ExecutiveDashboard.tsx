import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Users,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  Building,
} from 'lucide-react';
import { IncomeEntry, ExpenseEntry, User, Member } from '../types';
import {
  computeProjectFinancials,
  computeDirectorSummaries,
  formatBDT,
} from '../utils/calculations';
import { TOTAL_SHARES } from '../utils/directors';
import { storageService } from '../services/storageService';
import { FinancialTrendChart } from './FinancialTrendChart';
import { CashFlowGapD3Chart } from './CashFlowGapD3Chart';
import { TierComparisonMatrix } from './TierComparisonMatrix';

interface ExecutiveDashboardProps {
  incomes: IncomeEntry[];
  expenses: ExpenseEntry[];
  currentUser: User | null;
  onNavigateTab: (tab: string) => void;
  members?: Member[];
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({
  incomes,
  expenses,
  currentUser,
  onNavigateTab,
  members: propMembers,
}) => {
  const financials = computeProjectFinancials(incomes, expenses);
  const directorSummaries = computeDirectorSummaries(incomes, expenses);
  const members = propMembers || storageService.getMembers();

  const canApprove =
    currentUser?.role === 'SYSTEM_ADMIN' || currentUser?.role === 'DELEGATED_ADMIN';

  return (
    <div className="space-y-6">
      {/* Welcome & Role Strip */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-emerald-500/5 -skew-x-12 pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60">
                Central Financial Command
              </span>
              <span className="text-xs text-slate-400 font-mono">144 Shares Capital Registry</span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Prottasha Housing Society - Financial Overview
            </h2>
            <p className="text-sm text-slate-300 mt-1">
              Welcome back, <strong className="text-emerald-400">{currentUser?.name}</strong>. Real-time balance calculations, Director share obligations, and central escrow audit.
            </p>
          </div>

          {/* Central Society Status Indicators */}
          <div className="flex items-center gap-3">
            <div className="bg-slate-800/80 px-3.5 py-2 rounded-xl border border-slate-700/80 text-right hidden sm:block">
              <div className="text-[11px] text-slate-400">Total Authorized Shares</div>
              <div className="text-sm font-bold font-mono text-emerald-400">144 Allocated</div>
            </div>
            <div className="bg-slate-800/80 px-3.5 py-2 rounded-xl border border-slate-700/80 text-right hidden sm:block">
              <div className="text-[11px] text-slate-400">Audit Status</div>
              <div className="text-sm font-bold text-emerald-300 flex items-center gap-1.5 justify-end">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Escrow Reconciled</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Collection */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-3">
            <span>Total Approved Collections</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white font-mono tracking-tight">
            {formatBDT(financials.totalCollection)}
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-2">
            <span>General: {formatBDT(financials.totalGeneralDeposits)}</span>
            <span className="text-emerald-400">Sales: {formatBDT(financials.totalSalesDeposits)}</span>
          </div>
        </div>

        {/* Total Project Expense */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-3">
            <span>Total Approved Expenses</span>
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white font-mono tracking-tight">
            {formatBDT(financials.totalProjectExpense)}
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-2">
            <span>Per-Share (1/144):</span>
            <span className="font-mono text-slate-200">{formatBDT(financials.perShareExpense)}</span>
          </div>
        </div>

        {/* Net Society Balance */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-3">
            <span>Net Society Reserve (Liquid)</span>
            <div className={`p-2 rounded-lg ${financials.netSocietyBalance >= 0 ? 'bg-teal-500/10 text-teal-400' : 'bg-rose-500/10 text-rose-400'}`}>
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl font-bold font-mono tracking-tight ${financials.netSocietyBalance >= 0 ? 'text-teal-400' : 'text-rose-400'}`}>
            {formatBDT(financials.netSocietyBalance)}
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-2">
            <span>Total Registered Shares:</span>
            <span className="font-mono text-emerald-400 font-semibold">{TOTAL_SHARES} Shares</span>
          </div>
        </div>

        {/* Pending Verification Tracker */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-3">
            <span>Pending Verifications</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-400 font-mono tracking-tight">
            {financials.pendingIncomeCount + financials.pendingExpenseCount} Items
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-2">
            <span>Incomes: {financials.pendingIncomeCount} ({formatBDT(financials.totalPendingIncomeAmount)})</span>
            <span>Expenses: {financials.pendingExpenseCount}</span>
          </div>
        </div>
      </div>

      {/* Pending Items Banner if canApprove */}
      {canApprove && (financials.pendingIncomeCount > 0 || financials.pendingExpenseCount > 0) && (
        <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-200 text-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Action Required:</strong> You have {financials.pendingIncomeCount} pending deposits and {financials.pendingExpenseCount} pending expenses submitted by managers awaiting your approval.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {financials.pendingIncomeCount > 0 && (
              <button
                onClick={() => onNavigateTab('incomes')}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-[11px] font-semibold transition"
              >
                Review Deposits
              </button>
            )}
            {financials.pendingExpenseCount > 0 && (
              <button
                onClick={() => onNavigateTab('expenses')}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-200 border border-amber-700 rounded text-[11px] font-semibold transition"
              >
                Review Expenses
              </button>
            )}
          </div>
        </div>
      )}

      {/* Recharts Monthly Trend Analysis Growth Component */}
      <FinancialTrendChart incomes={incomes} expenses={expenses} />

      {/* D3.js Chart: Outstanding Member Dues vs Projected Monthly Income (Cash Flow Gap Visualization) */}
      <CashFlowGapD3Chart
        incomes={incomes}
        expenses={expenses}
        members={members}
      />

      {/* Tier wise INCOME Vs EXPENSE comparison (Integrated before Director Share Allocation & Balance Matrix) */}
      <TierComparisonMatrix
        incomes={incomes}
        expenses={expenses}
      />

      {/* Director Summary Dashboard Calculations (Formula: (Total Project Expense * Shares) / 144) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <PieChart className="w-5 h-5 text-emerald-400" />
              <span>Director Share Allocation & Balance Matrix</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Strict Mathematical Formula: <code className="text-emerald-400 font-mono">Expense = (Total Expense × Shares) / 144</code> | <code className="text-emerald-400 font-mono">Balance = Collection − Expense</code>
            </p>
          </div>

          <div className="text-xs text-slate-400 font-mono">
            Total Expense Basis: <strong className="text-white">{formatBDT(financials.totalProjectExpense)}</strong>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Director / Unit</th>
                <th className="py-3 px-3 text-center">Share Range</th>
                <th className="py-3 px-3 text-center">Controlled Shares</th>
                <th className="py-3 px-3 text-center">Share %</th>
                <th className="py-3 px-4 text-right">Director Total Expense</th>
                <th className="py-3 px-4 text-right">Director Total Collection</th>
                <th className="py-3 px-4 text-right">Current Balance</th>
                <th className="py-3 px-3 text-center">Financial Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {directorSummaries.map((ds) => {
                const is4thUnit = ds.director.isUnit;
                const isSurplus = ds.currentBalance >= 0;

                return (
                  <tr
                    key={ds.director.key}
                    className={`hover:bg-slate-800/40 transition ${
                      is4thUnit ? 'bg-indigo-950/15' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-200 flex items-center gap-2">
                        {is4thUnit ? (
                          <Building className="w-4 h-4 text-indigo-400" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-emerald-400">
                            {ds.director.name[0]}
                          </div>
                        )}
                        <span>{ds.director.name}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {ds.director.phone || 'N/A'}
                      </div>
                    </td>

                    <td className="py-3.5 px-3 text-center font-mono text-slate-300">
                      {ds.director.startShare} – {ds.director.endShare}
                    </td>

                    <td className="py-3.5 px-3 text-center font-bold font-mono text-slate-200">
                      {ds.controlledShares}
                    </td>

                    <td className="py-3.5 px-3 text-center font-mono text-slate-400">
                      {ds.sharePercentage.toFixed(2)}%
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono text-slate-300 font-medium">
                      {formatBDT(ds.totalExpense)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono text-emerald-400 font-semibold">
                      {formatBDT(ds.totalCollection)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold">
                      <span className={isSurplus ? 'text-teal-400' : 'text-rose-400'}>
                        {formatBDT(ds.currentBalance)}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          ds.status === 'SURPLUS'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : ds.status === 'BALANCED'
                            ? 'bg-slate-700/50 text-slate-300 border border-slate-600'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {ds.status === 'SURPLUS' ? 'Surplus Advance' : ds.status === 'BALANCED' ? 'Settled' : 'Deficit Dues'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-slate-950 font-semibold text-slate-200 border-t-2 border-slate-700 text-xs">
              <tr>
                <td className="py-3 px-4 font-bold">Total (144 Shares)</td>
                <td className="py-3 px-3 text-center font-mono">1 – 144</td>
                <td className="py-3 px-3 text-center font-mono font-bold text-emerald-400">144</td>
                <td className="py-3 px-3 text-center font-mono">100.00%</td>
                <td className="py-3 px-4 text-right font-mono font-bold">
                  {formatBDT(financials.totalProjectExpense)}
                </td>
                <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                  {formatBDT(financials.totalGeneralDeposits)}
                </td>
                <td className="py-3 px-4 text-right font-mono font-bold">
                  <span className={financials.totalGeneralDeposits - financials.totalProjectExpense >= 0 ? 'text-teal-400' : 'text-rose-400'}>
                    {formatBDT(financials.totalGeneralDeposits - financials.totalProjectExpense)}
                  </span>
                </td>
                <td className="py-3 px-3 text-center text-slate-400 text-[10px]">
                  + Sales {formatBDT(financials.totalSalesDeposits)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Society Context and 4th Unit Note */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Building className="w-4 h-4 text-emerald-400" />
            <span>Prottasha Housing Society Structure</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            The society capital structure comprises <strong>144 shares</strong> allocated across 8 designated directors and the <strong>4th Unit (General Reserve)</strong> holding 36 shares.
          </p>
          <div className="text-xs text-slate-400 space-y-1">
            <div>• <strong>System Administrator:</strong> Saif Ahmed Sakil (ISRT, DU)</div>
            <div>• <strong>Total Share Owners:</strong> 144 Members (PHSM-001 to PHSM-144)</div>
            <div>• <strong>Central Currency:</strong> Bangladeshi Taka (BDT / ৳)</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Audit & Verification Rules</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Managers input daily operational deposits and expenditures. All transactions remain in <strong>Pending</strong> status until verified by the System Admin or Delegated Admin.
          </p>
          <div className="text-xs text-slate-400 space-y-1">
            <div>• <strong>Delegated Admins:</strong> Can approve, edit, soft-delete with audit logs.</div>
            <div>• <strong>System Admin:</strong> Full root privileges, hard-delete, EC nominations.</div>
            <div>• <strong>General Members:</strong> Strict financial statement data isolation.</div>
          </div>
        </div>
      </div>
    </div>
  );
};
