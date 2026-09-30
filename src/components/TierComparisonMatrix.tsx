import React, { useState, useMemo } from 'react';
import {
  Layers,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronUp,
  Building2,
  HardHat,
  Truck,
  Zap,
  ShieldCheck,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
} from 'lucide-react';
import { IncomeEntry, ExpenseEntry, TransactionTier } from '../types';
import { formatBDT } from '../utils/calculations';

interface TierComparisonMatrixProps {
  incomes: IncomeEntry[];
  expenses: ExpenseEntry[];
}

interface TierDetail {
  tier: TransactionTier;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  badgeClass: string;
  incomeTotal: number;
  incomeCount: number;
  expenseTotal: number;
  expenseCount: number;
  netBalance: number;
  burnRatePercent: number;
  status: 'SURPLUS' | 'DEFICIT' | 'BALANCED';
  topExpenseCategories: { name: string; amount: number }[];
  topIncomeCategories: { name: string; amount: number }[];
}

const TIER_METADATA: Record<
  TransactionTier,
  {
    title: string;
    subtitle: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    badgeClass: string;
  }
> = {
  'Tier-1': {
    title: 'Tier-1: Core Land & Primary Boundary',
    subtitle: 'Land Demarcation & Perimeter Wall',
    description: 'Land purchase consolidation, deed registration, pillar installation, and perimeter boundary wall foundation.',
    icon: Building2,
    color: '#10b981',
    badgeClass: 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60',
  },
  'Tier-2': {
    title: 'Tier-2: Earth Filling & Site Grading',
    subtitle: 'Sand Dredging & Soil Compaction',
    description: 'Lowland sand pumping, earth compaction, levelling, heavy machinery transport, and land topography elevation.',
    icon: Truck,
    color: '#0d9488',
    badgeClass: 'bg-teal-950/80 text-teal-300 border-teal-700/60',
  },
  'Tier-3': {
    title: 'Tier-3: Internal Roads & Drainage Culverts',
    subtitle: 'Road Infrastructure & Water Runoff',
    description: 'Internal sector brick soling, concrete road construction, primary storm drainage conduits, culverts, and curbs.',
    icon: HardHat,
    color: '#06b6d4',
    badgeClass: 'bg-cyan-950/80 text-cyan-300 border-cyan-700/60',
  },
  'Tier-4': {
    title: 'Tier-4: Utility Substations & Distribution',
    subtitle: 'Electricity Grid, Deep Tubewell & Water',
    description: 'Substation transformer placement, overhead power poles, deep tubewell drilling, pump house, and underground water supply lines.',
    icon: Zap,
    color: '#f59e0b',
    badgeClass: 'bg-amber-950/80 text-amber-300 border-amber-700/60',
  },
  'Tier-5': {
    title: 'Tier-5: Governance, Legal & Security Operations',
    subtitle: 'Administration, Society Staff & Guarding',
    description: 'Site security personnel, site supervisor salaries, legal consultancy, meeting honorarium, audit fees, and office compliance.',
    icon: ShieldCheck,
    color: '#8b5cf6',
    badgeClass: 'bg-purple-950/80 text-purple-300 border-purple-700/60',
  },
};

export const TierComparisonMatrix: React.FC<TierComparisonMatrixProps> = ({
  incomes,
  expenses,
}) => {
  const [expandedTier, setExpandedTier] = useState<TransactionTier | null>(null);

  // Compute tier-wise aggregates
  const tierSummaries: TierDetail[] = useMemo(() => {
    const tiers: TransactionTier[] = ['Tier-1', 'Tier-2', 'Tier-3', 'Tier-4', 'Tier-5'];

    // Filter approved entries only
    const approvedIncomes = incomes.filter((i) => i.status === 'APPROVED' && !i.isSoftDeleted);
    const approvedExpenses = expenses.filter((e) => e.status === 'APPROVED' && !e.isSoftDeleted);

    return tiers.map((tierKey) => {
      const meta = TIER_METADATA[tierKey];

      // Incomes matching this tier (or assigned by priority if untagged)
      const tierIncomes = approvedIncomes.filter((i) => {
        if (i.tier) return i.tier === tierKey;
        // Default assignment heuristics for legacy seed records
        if (tierKey === 'Tier-1') return i.category?.includes('Phase 1') || i.category?.includes('Boundary');
        if (tierKey === 'Tier-2') return i.category?.includes('Filing');
        if (tierKey === 'Tier-3') return i.category?.includes('Road') || i.category?.includes('Drainage');
        if (tierKey === 'Tier-4') return i.category?.includes('Substation') || i.category?.includes('Electrical');
        if (tierKey === 'Tier-5') return i.category?.includes('Contribution') || i.category?.includes('Security') || i.type === 'SALES_DEPOSIT';
        return false;
      });

      // Expenses matching this tier
      const tierExpenses = approvedExpenses.filter((e) => {
        if (e.tier) return e.tier === tierKey;
        // Default heuristics for legacy untagged entries
        if (tierKey === 'Tier-1') return e.category === 'Purchase' || e.category === 'Site Development';
        if (tierKey === 'Tier-2') return e.category === 'Labor';
        if (tierKey === 'Tier-3') return e.category === 'Maintenance';
        if (tierKey === 'Tier-4') return e.category === 'Water Bill' || e.category === 'Electricity Bill';
        if (tierKey === 'Tier-5') return e.category === 'Salary' || e.category === 'EC Honorarium' || e.category === 'Legal & Registration' || e.category === 'Security' || e.category === 'Meeting Expense' || e.category === 'Audit & Compliance';
        return false;
      });

      const incomeTotal = tierIncomes.reduce((acc, i) => acc + i.amount, 0);
      const expenseTotal = tierExpenses.reduce((acc, e) => acc + e.amount, 0);
      const netBalance = incomeTotal - expenseTotal;
      const burnRatePercent = incomeTotal > 0 ? (expenseTotal / incomeTotal) * 100 : expenseTotal > 0 ? 100 : 0;

      let status: 'SURPLUS' | 'DEFICIT' | 'BALANCED' = 'BALANCED';
      if (netBalance > 0.01) status = 'SURPLUS';
      else if (netBalance < -0.01) status = 'DEFICIT';

      // Aggregate top expense categories
      const expCatMap = new Map<string, number>();
      tierExpenses.forEach((e) => {
        expCatMap.set(e.category, (expCatMap.get(e.category) || 0) + e.amount);
      });
      const topExpenseCategories = Array.from(expCatMap.entries())
        .map(([name, amount]) => ({ name, amount }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 4);

      // Aggregate top income categories
      const incCatMap = new Map<string, number>();
      tierIncomes.forEach((i) => {
        incCatMap.set(i.category, (incCatMap.get(i.category) || 0) + i.amount);
      });
      const topIncomeCategories = Array.from(incCatMap.entries())
        .map(([name, amount]) => ({ name, amount }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 4);

      return {
        tier: tierKey,
        ...meta,
        incomeTotal,
        incomeCount: tierIncomes.length,
        expenseTotal,
        expenseCount: tierExpenses.length,
        netBalance,
        burnRatePercent,
        status,
        topExpenseCategories,
        topIncomeCategories,
      };
    });
  }, [incomes, expenses]);

  // Overall Totals
  const totalTierIncome = tierSummaries.reduce((sum, t) => sum + t.incomeTotal, 0);
  const totalTierExpense = tierSummaries.reduce((sum, t) => sum + t.expenseTotal, 0);
  const overallNet = totalTierIncome - totalTierExpense;

  const toggleExpand = (tier: TransactionTier) => {
    setExpandedTier(expandedTier === tier ? null : tier);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl space-y-0">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-teal-400 bg-teal-950/80 px-2 py-0.5 rounded border border-teal-800/60 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              Tiered Capital Allocations
            </span>
            <span className="text-xs text-slate-400 font-mono">Tiers 1 to 5 Infrastructure Matrix</span>
          </div>
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <span>Tier-wise Income vs Expense Comparison Matrix</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Comparative performance across development milestones: Land, Earth Filling, Road Drainage, Utilities, and Operations.
          </p>
        </div>

        {/* Global Net Indicator */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block uppercase font-semibold">Tier Net Allocation</span>
            <span className={`text-base font-mono font-bold ${overallNet >= 0 ? 'text-teal-400' : 'text-rose-400'}`}>
              {formatBDT(overallNet)}
            </span>
          </div>
        </div>
      </div>

      {/* Main Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/90 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3.5 px-5">Tier Milestone</th>
              <th className="py-3.5 px-4 text-right">Income Collected</th>
              <th className="py-3.5 px-4 text-right">Expense Incurred</th>
              <th className="py-3.5 px-4 text-right">Net Balance</th>
              <th className="py-3.5 px-5 text-center">Expense Absorption Rate</th>
              <th className="py-3.5 px-4 text-center">Milestone Status</th>
              <th className="py-3.5 px-4 text-center">Drilldown</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {tierSummaries.map((ts) => {
              const Icon = ts.icon;
              const isExpanded = expandedTier === ts.tier;
              const isSurplus = ts.status === 'SURPLUS';

              return (
                <React.Fragment key={ts.tier}>
                  <tr
                    onClick={() => toggleExpand(ts.tier)}
                    className="hover:bg-slate-800/40 transition cursor-pointer group"
                  >
                    {/* Tier Column */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-start gap-3">
                        <div
                          className="p-2 rounded-xl border mt-0.5"
                          style={{
                            backgroundColor: `${ts.color}15`,
                            borderColor: `${ts.color}40`,
                            color: ts.color,
                          }}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-white text-xs group-hover:text-emerald-400 transition-colors flex items-center gap-2">
                            <span>{ts.title}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">{ts.subtitle}</div>
                        </div>
                      </div>
                    </td>

                    {/* Income Column */}
                    <td className="py-3.5 px-4 text-right font-mono">
                      <div className="font-bold text-emerald-400 text-xs">
                        {formatBDT(ts.incomeTotal)}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {ts.incomeCount} transaction{ts.incomeCount === 1 ? '' : 's'}
                      </div>
                    </td>

                    {/* Expense Column */}
                    <td className="py-3.5 px-4 text-right font-mono">
                      <div className="font-bold text-rose-400 text-xs">
                        {formatBDT(ts.expenseTotal)}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {ts.expenseCount} voucher{ts.expenseCount === 1 ? '' : 's'}
                      </div>
                    </td>

                    {/* Net Balance Column */}
                    <td className="py-3.5 px-4 text-right font-mono">
                      <div className={`font-bold text-xs ${isSurplus ? 'text-teal-400' : 'text-rose-400'}`}>
                        {isSurplus ? '+' : ''}{formatBDT(ts.netBalance)}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {isSurplus ? 'Reserve Surplus' : 'Deficit Shortfall'}
                      </div>
                    </td>

                    {/* Absorption Rate / Progress Bar */}
                    <td className="py-3.5 px-5">
                      <div className="w-full max-w-[160px] mx-auto space-y-1">
                        <div className="flex justify-between text-[10px] font-mono">
                          <span className="text-slate-400">Burn:</span>
                          <span className={ts.burnRatePercent > 100 ? 'text-rose-400 font-bold' : 'text-slate-200'}>
                            {ts.burnRatePercent.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              ts.burnRatePercent > 100
                                ? 'bg-rose-500'
                                : ts.burnRatePercent > 75
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, ts.burnRatePercent)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                          ts.status === 'SURPLUS'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : ts.status === 'BALANCED'
                            ? 'bg-slate-700/50 text-slate-300 border-slate-600'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        }`}
                      >
                        {ts.status === 'SURPLUS' && <ArrowUpRight className="w-3 h-3" />}
                        {ts.status === 'DEFICIT' && <ArrowDownRight className="w-3 h-3" />}
                        <span>{ts.status === 'SURPLUS' ? 'Surplus' : ts.status === 'BALANCED' ? 'Balanced' : 'Deficit'}</span>
                      </span>
                    </td>

                    {/* Drilldown Arrow */}
                    <td className="py-3.5 px-4 text-center text-slate-400">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpand(ts.tier);
                        }}
                        className="p-1 rounded-lg hover:bg-slate-800 hover:text-white transition"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </td>
                  </tr>

                  {/* Expanded Breakdown Accordion */}
                  {isExpanded && (
                    <tr className="bg-slate-950/70 border-b border-slate-800/90">
                      <td colSpan={7} className="p-4 sm:p-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          {/* Top Incomes */}
                          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-2">
                            <div className="text-[11px] font-bold text-emerald-400 flex items-center justify-between border-b border-slate-800 pb-1.5">
                              <span className="flex items-center gap-1.5">
                                <TrendingUp className="w-3.5 h-3.5" />
                                <span>Top Income Collections ({ts.tier})</span>
                              </span>
                              <span className="font-mono text-slate-400 text-[10px]">
                                {ts.incomeCount} Total
                              </span>
                            </div>
                            {ts.topIncomeCategories.length === 0 ? (
                              <div className="py-4 text-center text-slate-500 text-[11px]">
                                No specific income vouchers allocated to this tier yet.
                              </div>
                            ) : (
                              <div className="space-y-1.5">
                                {ts.topIncomeCategories.map((c, i) => (
                                  <div key={i} className="flex justify-between items-center py-1 border-b border-slate-800/50">
                                    <span className="text-slate-300">{c.name}</span>
                                    <span className="font-mono font-bold text-emerald-400">{formatBDT(c.amount)}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Top Expenses */}
                          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-2">
                            <div className="text-[11px] font-bold text-rose-400 flex items-center justify-between border-b border-slate-800 pb-1.5">
                              <span className="flex items-center gap-1.5">
                                <TrendingDown className="w-3.5 h-3.5" />
                                <span>Top Expense Expenditures ({ts.tier})</span>
                              </span>
                              <span className="font-mono text-slate-400 text-[10px]">
                                {ts.expenseCount} Total
                              </span>
                            </div>
                            {ts.topExpenseCategories.length === 0 ? (
                              <div className="py-4 text-center text-slate-500 text-[11px]">
                                No approved expenses recorded under this tier yet.
                              </div>
                            ) : (
                              <div className="space-y-1.5">
                                {ts.topExpenseCategories.map((c, i) => (
                                  <div key={i} className="flex justify-between items-center py-1 border-b border-slate-800/50">
                                    <span className="text-slate-300">{c.name}</span>
                                    <span className="font-mono font-bold text-rose-400">{formatBDT(c.amount)}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="mt-3 text-[11px] text-slate-400 flex items-center justify-between px-1">
                          <span>
                            <strong>Scope Summary:</strong> {ts.description}
                          </span>
                          <span className="font-mono text-[10px] text-slate-500">
                            Milestone Target Rate: {ts.burnRatePercent.toFixed(1)}% absorbed
                          </span>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
          {/* Table Footer */}
          <tfoot className="bg-slate-950 font-semibold text-slate-200 border-t-2 border-slate-700 text-xs">
            <tr>
              <td className="py-3.5 px-5 font-bold">Total (All 5 Tiers Consolidated)</td>
              <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400">
                {formatBDT(totalTierIncome)}
              </td>
              <td className="py-3.5 px-4 text-right font-mono font-bold text-rose-400">
                {formatBDT(totalTierExpense)}
              </td>
              <td className="py-3.5 px-4 text-right font-mono font-bold">
                <span className={overallNet >= 0 ? 'text-teal-400' : 'text-rose-400'}>
                  {overallNet >= 0 ? '+' : ''}{formatBDT(overallNet)}
                </span>
              </td>
              <td className="py-3.5 px-5 text-center font-mono text-[11px]">
                {totalTierIncome > 0 ? ((totalTierExpense / totalTierIncome) * 100).toFixed(1) : 0}% Total Burn
              </td>
              <td className="py-3.5 px-4 text-center">
                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  overallNet >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                }`}>
                  {overallNet >= 0 ? 'Liquid Reserve' : 'Deficit Gap'}
                </span>
              </td>
              <td className="py-3.5 px-4 text-center text-slate-500 text-[10px]">
                144 Shares
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
