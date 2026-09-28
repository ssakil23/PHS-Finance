import React, { useState } from 'react';
import {
  PieChart,
  Users,
  Wallet,
  TrendingUp,
  TrendingDown,
  Building,
  CheckCircle,
  AlertCircle,
  Download,
  Phone,
  Mail,
  ChevronRight,
} from 'lucide-react';
import { IncomeEntry, ExpenseEntry, Member } from '../types';
import {
  computeDirectorSummaries,
  computeProjectFinancials,
  formatBDT,
  DirectorFinancialSummary,
} from '../utils/calculations';
import { DIRECTORS, TOTAL_SHARES, formatMemberId } from '../utils/directors';

interface DirectorSummaryViewProps {
  incomes: IncomeEntry[];
  expenses: ExpenseEntry[];
  members: Member[];
  onSelectMemberStatement?: (memberId: string) => void;
}

export const DirectorSummaryView: React.FC<DirectorSummaryViewProps> = ({
  incomes,
  expenses,
  members,
  onSelectMemberStatement,
}) => {
  const summaries = computeDirectorSummaries(incomes, expenses);
  const financials = computeProjectFinancials(incomes, expenses);

  const [selectedDirectorKey, setSelectedDirectorKey] = useState<string>(summaries[0]?.director.key || 'SAIF_AHMED_SAKIL');

  const selectedSummary = summaries.find((s) => s.director.key === selectedDirectorKey) || summaries[0];

  // Get members under this director
  const directorMembers = members.filter(
    (m) =>
      m.shareNumber >= selectedSummary.director.startShare &&
      m.shareNumber <= selectedSummary.director.endShare
  );

  // Calculate each member's personal collection within this director's pool
  const memberCollections = directorMembers.map((m) => {
    const memberDeposits = incomes
      .filter(
        (inc) =>
          inc.status === 'APPROVED' &&
          !inc.isSoftDeleted &&
          inc.type === 'GENERAL_DEPOSIT' &&
          (inc.shareOwnerId === m.id || inc.shareNumber === m.shareNumber)
      )
      .reduce((sum, inc) => sum + inc.amount, 0);

    const shareExpense = financials.perShareExpense;
    const balance = memberDeposits - shareExpense;

    return {
      member: m,
      deposits: memberDeposits,
      shareExpense,
      balance,
    };
  });

  const handleExportDirectorCSV = () => {
    const headers = [
      'Director Name',
      'Share Range',
      'Controlled Shares',
      'Share %',
      'Director Quota Expense (BDT)',
      'Total Collections (BDT)',
      'Current Balance (BDT)',
      'Status',
    ];

    const rows = summaries.map((s) => [
      `"${s.director.name}"`,
      `"${s.director.startShare} - ${s.director.endShare}"`,
      s.controlledShares,
      `${s.sharePercentage.toFixed(2)}%`,
      s.totalExpense,
      s.totalCollection,
      s.currentBalance,
      s.status,
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `PHS_Director_Matrix_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <PieChart className="w-5 h-5 text-emerald-400" />
            <span>Director Share Allocation & Balance Matrix</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Individual audit and share quotas across 8 designated directors and 4th Unit reserve.
          </p>
        </div>

        <button
          onClick={handleExportDirectorCSV}
          className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5 text-emerald-400" />
          <span>Export Director Matrix CSV</span>
        </button>
      </div>

      {/* Director Selection Grid / Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {summaries.map((s) => {
          const isSelected = s.director.key === selectedDirectorKey;
          const isSurplus = s.currentBalance >= 0;

          return (
            <button
              key={s.director.key}
              onClick={() => setSelectedDirectorKey(s.director.key)}
              className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                isSelected
                  ? 'bg-slate-800 border-emerald-500 ring-1 ring-emerald-500 shadow-md'
                  : 'bg-slate-900/80 hover:bg-slate-800 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                  <span>Shares {s.director.startShare}–{s.director.endShare}</span>
                  <span className="font-bold text-slate-200">{s.controlledShares} sh.</span>
                </div>
                <div className="font-bold text-xs text-white line-clamp-1">
                  {s.director.name}
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Balance:</span>
                <span className={`font-mono font-bold ${isSurplus ? 'text-teal-400' : 'text-rose-400'}`}>
                  {formatBDT(s.currentBalance)}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Director Detailed Card */}
      {selectedSummary && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  Director Portfolio
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Shares: {selectedSummary.director.startShare} to {selectedSummary.director.endShare} ({selectedSummary.controlledShares} Shares Total)
                </span>
              </div>
              <h3 className="text-xl font-bold text-white">
                {selectedSummary.director.name}
              </h3>
              <div className="flex items-center gap-4 text-xs text-slate-400 mt-1">
                {selectedSummary.director.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-500" />
                    <span>{selectedSummary.director.phone}</span>
                  </span>
                )}
                {selectedSummary.director.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3 h-3 text-slate-500" />
                    <span>{selectedSummary.director.email}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Quick Status Tag */}
            <div className="text-right">
              <div className="text-xs text-slate-400">Share Ratio</div>
              <div className="text-lg font-bold text-white font-mono">
                {selectedSummary.sharePercentage.toFixed(2)}% of 144
              </div>
              <span
                className={`inline-block mt-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                  selectedSummary.status === 'SURPLUS'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : selectedSummary.status === 'BALANCED'
                    ? 'bg-slate-800 text-slate-300 border-slate-700'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                }`}
              >
                {selectedSummary.status === 'SURPLUS'
                  ? 'Net Surplus Advance'
                  : selectedSummary.status === 'BALANCED'
                  ? 'Balanced Zero'
                  : 'Outstanding Share Dues'}
              </span>
            </div>
          </div>

          {/* Three Main Financial Metrics for Director */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-xs text-slate-400 mb-1">
                Director Total Expense Obligation
              </div>
              <div className="text-xl font-bold text-white font-mono">
                {formatBDT(selectedSummary.totalExpense)}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Formula: ({formatBDT(financials.totalProjectExpense)} × {selectedSummary.controlledShares}) / 144
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-xs text-slate-400 mb-1">
                Total Collections from Controlled Shares
              </div>
              <div className="text-xl font-bold text-emerald-400 font-mono">
                {formatBDT(selectedSummary.totalCollection)}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Sum of approved deposits across {selectedSummary.controlledShares} registered shares
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-xs text-slate-400 mb-1">
                Current Net Balance (Collection − Expense)
              </div>
              <div
                className={`text-xl font-bold font-mono ${
                  selectedSummary.currentBalance >= 0 ? 'text-teal-400' : 'text-rose-400'
                }`}
              >
                {formatBDT(selectedSummary.currentBalance)}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {selectedSummary.currentBalance >= 0
                  ? 'Surplus advance available in society capital'
                  : 'Total pending dues payable to society escrow'}
              </div>
            </div>
          </div>

          {/* Member Roster under this Director */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-400" />
                <span>Associated Share Owners ({directorMembers.length} Members)</span>
              </h4>
              <span className="text-[11px] text-slate-400">
                Click any member to inspect personal statement
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase text-[11px]">
                  <tr>
                    <th className="py-2.5 px-4">Member ID</th>
                    <th className="py-2.5 px-4">Share #</th>
                    <th className="py-2.5 px-4">Member Name</th>
                    <th className="py-2.5 px-4">Contact Phone</th>
                    <th className="py-2.5 px-4 text-right">Personal Deposits</th>
                    <th className="py-2.5 px-4 text-right">Share Expense (1/144)</th>
                    <th className="py-2.5 px-4 text-right">Net Balance</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 bg-slate-900/50">
                  {memberCollections.map((item) => {
                    const isDue = item.balance < 0;

                    return (
                      <tr key={item.member.id} className="hover:bg-slate-800/60 transition">
                        <td className="py-3 px-4 font-mono font-bold text-slate-200">
                          {item.member.id}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-400">
                          #{item.member.shareNumber}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-200">
                          {item.member.name}
                        </td>
                        <td className="py-3 px-4 text-slate-400">
                          {item.member.phone}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-400">
                          {formatBDT(item.deposits)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-300">
                          {formatBDT(item.shareExpense)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold">
                          <span className={isDue ? 'text-rose-400' : 'text-teal-400'}>
                            {formatBDT(item.balance)}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              !isDue
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                            }`}
                          >
                            {isDue ? 'Dues' : 'Advance'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => onSelectMemberStatement && onSelectMemberStatement(item.member.id)}
                            className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold"
                          >
                            <span>Statement</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
