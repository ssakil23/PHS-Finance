import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  Area,
  AreaChart,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  BarChart3,
  LineChart as LineChartIcon,
  Percent,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Layers,
  Activity,
  CheckCircle2,
  PieChart,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { IncomeEntry, ExpenseEntry } from '../types';
import { formatBDT } from '../utils/calculations';

interface MonthlyGrowthTrendsSectionProps {
  incomes: IncomeEntry[];
  expenses: ExpenseEntry[];
  currentFiscalYear?: number;
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export const MonthlyGrowthTrendsSection: React.FC<MonthlyGrowthTrendsSectionProps> = ({
  incomes,
  expenses,
  currentFiscalYear = 2026,
}) => {
  const [fiscalYear, setFiscalYear] = useState<number>(currentFiscalYear);
  const [chartMode, setChartMode] = useState<'VOLUME' | 'GROWTH_RATE' | 'CUMULATIVE'>('VOLUME');
  const [filterMode, setFilterMode] = useState<'YTD_ACTIVE' | 'FULL_YEAR'>('FULL_YEAR');
  const [showGrowthLineOverlay, setShowGrowthLineOverlay] = useState<boolean>(true);

  // Available Fiscal Years in transaction dataset
  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>();
    yearsSet.add(2026);
    incomes.forEach((i) => {
      if (i.date) {
        const y = new Date(i.date).getFullYear();
        if (!isNaN(y)) yearsSet.add(y);
      }
    });
    expenses.forEach((e) => {
      if (e.date) {
        const y = new Date(e.date).getFullYear();
        if (!isNaN(y)) yearsSet.add(y);
      }
    });
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [incomes, expenses]);

  // Aggregate monthly data for the selected fiscal year
  const monthlyMetrics = useMemo(() => {
    const months = MONTH_NAMES.map((name, index) => ({
      monthIndex: index,
      name,
      fullName: new Date(fiscalYear, index, 1).toLocaleString('en-US', { month: 'long' }),
      income: 0,
      generalDeposit: 0,
      salesDeposit: 0,
      incomeCount: 0,
      expense: 0,
      expenseCount: 0,
      netCashflow: 0,
      incomeMoMGrowth: 0, // % MoM
      expenseMoMGrowth: 0, // % MoM
      cumulativeIncome: 0,
      cumulativeExpense: 0,
      cumulativeReserve: 0,
      hasData: false,
    }));

    // Aggregate approved incomes
    incomes.forEach((inc) => {
      if (inc.status === 'APPROVED' && !inc.isSoftDeleted && inc.date) {
        const d = new Date(inc.date);
        if (d.getFullYear() === fiscalYear) {
          const m = d.getMonth();
          if (m >= 0 && m < 12) {
            months[m].income += Number(inc.amount) || 0;
            months[m].incomeCount += 1;
            months[m].hasData = true;
            if (inc.type === 'SALES_DEPOSIT') {
              months[m].salesDeposit += Number(inc.amount) || 0;
            } else {
              months[m].generalDeposit += Number(inc.amount) || 0;
            }
          }
        }
      }
    });

    // Aggregate approved expenses
    expenses.forEach((exp) => {
      if (exp.status === 'APPROVED' && !exp.isSoftDeleted && exp.date) {
        const d = new Date(exp.date);
        if (d.getFullYear() === fiscalYear) {
          const m = d.getMonth();
          if (m >= 0 && m < 12) {
            months[m].expense += Number(exp.amount) || 0;
            months[m].expenseCount += 1;
            months[m].hasData = true;
          }
        }
      }
    });

    // Compute Net Cashflow, Cumulative Totals, and MoM Growth Percentages
    let runIncome = 0;
    let runExpense = 0;
    let prevIncome: number | null = null;
    let prevExpense: number | null = null;

    months.forEach((m) => {
      m.netCashflow = m.income - m.expense;
      runIncome += m.income;
      runExpense += m.expense;
      m.cumulativeIncome = runIncome;
      m.cumulativeExpense = runExpense;
      m.cumulativeReserve = runIncome - runExpense;

      // Income MoM Growth Rate
      if (prevIncome !== null && prevIncome > 0) {
        m.incomeMoMGrowth = Math.round(((m.income - prevIncome) / prevIncome) * 1000) / 10;
      } else if (prevIncome === 0 && m.income > 0) {
        m.incomeMoMGrowth = 100;
      } else {
        m.incomeMoMGrowth = 0;
      }

      // Expense MoM Growth Rate
      if (prevExpense !== null && prevExpense > 0) {
        m.expenseMoMGrowth = Math.round(((m.expense - prevExpense) / prevExpense) * 1000) / 10;
      } else if (prevExpense === 0 && m.expense > 0) {
        m.expenseMoMGrowth = 100;
      } else {
        m.expenseMoMGrowth = 0;
      }

      // Track active baseline for MoM
      if (m.hasData) {
        prevIncome = m.income;
        prevExpense = m.expense;
      }
    });

    return months;
  }, [incomes, expenses, fiscalYear]);

  // Filtered dataset for display
  const displayData = useMemo(() => {
    if (filterMode === 'YTD_ACTIVE') {
      // Find the last month with data
      const lastIndex = [...monthlyMetrics].reverse().findIndex((m) => m.hasData);
      if (lastIndex === -1) return monthlyMetrics.slice(0, 3);
      const cutoff = 11 - lastIndex;
      return monthlyMetrics.slice(0, Math.max(cutoff + 1, 3));
    }
    return monthlyMetrics;
  }, [monthlyMetrics, filterMode]);

  // Overall Financial Growth Analytics & Highlights
  const growthStats = useMemo(() => {
    const activeMonths = monthlyMetrics.filter((m) => m.hasData);
    const activeCount = Math.max(1, activeMonths.length);

    const totalIncome = monthlyMetrics.reduce((sum, m) => sum + m.income, 0);
    const totalExpense = monthlyMetrics.reduce((sum, m) => sum + m.expense, 0);
    const netSurplus = totalIncome - totalExpense;

    const avgMonthlyIncome = Math.round(totalIncome / activeCount);
    const avgMonthlyExpense = Math.round(totalExpense / activeCount);
    const avgMonthlyMargin = Math.round(netSurplus / activeCount);

    // Peak Income and Peak Outlay Months
    const peakIncomeMonth = [...monthlyMetrics].sort((a, b) => b.income - a.income)[0];
    const peakExpenseMonth = [...monthlyMetrics].sort((a, b) => b.expense - a.expense)[0];

    // Net Fiscal Growth Velocity (Initial active month to latest active month)
    let netIncomeGrowthVelocity = 0;
    let netExpenseGrowthVelocity = 0;
    if (activeMonths.length >= 2) {
      const first = activeMonths[0];
      const last = activeMonths[activeMonths.length - 1];
      if (first.income > 0) {
        netIncomeGrowthVelocity = Math.round(((last.income - first.income) / first.income) * 1000) / 10;
      }
      if (first.expense > 0) {
        netExpenseGrowthVelocity = Math.round(((last.expense - first.expense) / first.expense) * 1000) / 10;
      }
    }

    // Capital Coverage Ratio (Collections / Outlay)
    const coverageRatio = totalExpense > 0 ? (totalIncome / totalExpense).toFixed(2) : 'N/A';

    return {
      totalIncome,
      totalExpense,
      netSurplus,
      activeCount,
      avgMonthlyIncome,
      avgMonthlyExpense,
      avgMonthlyMargin,
      peakIncomeMonth,
      peakExpenseMonth,
      netIncomeGrowthVelocity,
      netExpenseGrowthVelocity,
      coverageRatio,
    };
  }, [monthlyMetrics]);

  // Custom Glassmorphic Tooltip
  const CustomTrendsTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const currentMonthData = monthlyMetrics.find((m) => m.name === label);

      return (
        <div className="bg-slate-950/95 border border-slate-700/90 p-4 rounded-2xl shadow-2xl backdrop-blur-xl text-xs space-y-2.5 min-w-[240px]">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div>
              <span className="font-bold text-white text-sm">{currentMonthData?.fullName || label} {fiscalYear}</span>
              <div className="text-[10px] text-slate-400">Fiscal Performance Ledger</div>
            </div>
            {currentMonthData?.hasData ? (
              <span className="px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-700/60 text-emerald-300 font-semibold text-[10px]">
                Active Records
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-500 text-[10px]">
                Projected
              </span>
            )}
          </div>

          <div className="space-y-1.5">
            {payload.map((entry: any, idx: number) => {
              const isGrowth = entry.dataKey.includes('Growth') || entry.unit === '%';
              return (
                <div key={idx} className="flex justify-between items-center text-xs">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <span
                      className="w-2.5 h-2.5 rounded-full inline-block"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span>{entry.name}:</span>
                  </span>
                  <span className="font-mono font-bold text-white">
                    {isGrowth
                      ? `${entry.value > 0 ? '+' : ''}${entry.value}%`
                      : formatBDT(entry.value)}
                  </span>
                </div>
              );
            })}
          </div>

          {currentMonthData && (
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Net Operating Margin:</span>
              <span
                className={`font-mono font-bold ${
                  currentMonthData.netCashflow >= 0 ? 'text-teal-400' : 'text-rose-400'
                }`}
              >
                {formatBDT(currentMonthData.netCashflow)}
              </span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <section id="trends-section" className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6">
      {/* Trends Section Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-950/90 px-2.5 py-0.5 rounded-md border border-emerald-800/70 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span>Trends Engine</span>
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Recharts Financial Architecture • Fiscal Year {fiscalYear}
            </span>
            <span className="text-xs text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/50 hidden sm:inline-block">
              Capital Coverage {growthStats.coverageRatio}x
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <span>Monthly Income vs. Expense Growth Analysis</span>
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl">
            Live monthly trajectory charting member capital inflows against site development disbursements across Fiscal Year {fiscalYear}, tracking Month-over-Month (MoM) expansion rates and cumulative cash reserves.
          </p>
        </div>

        {/* View Controls & Toggles */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* Fiscal Year Selector */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-400 font-medium">FY:</span>
            <select
              value={fiscalYear}
              onChange={(e) => setFiscalYear(Number(e.target.value))}
              className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
            >
              {availableYears.map((yr) => (
                <option key={yr} value={yr} className="bg-slate-900 text-white">
                  {yr} {yr === currentFiscalYear ? '(Current FY)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Timeframe Scope Filter */}
          <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              onClick={() => setFilterMode('FULL_YEAR')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                filterMode === 'FULL_YEAR'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Show entire 12-month fiscal calendar"
            >
              12 Months
            </button>
            <button
              onClick={() => setFilterMode('YTD_ACTIVE')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                filterMode === 'YTD_ACTIVE'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Focus on Year-to-Date active months with transaction data"
            >
              Active YTD
            </button>
          </div>

          {/* Visualization Mode Pill */}
          <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              onClick={() => setChartMode('VOLUME')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                chartMode === 'VOLUME'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Monthly Income vs Expense in BDT (৳) with Net Margin Spline"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Volume (৳)</span>
            </button>

            <button
              onClick={() => setChartMode('GROWTH_RATE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                chartMode === 'GROWTH_RATE'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Month-over-Month (MoM) Growth Percentage comparison"
            >
              <Percent className="w-3.5 h-3.5" />
              <span>MoM %</span>
            </button>

            <button
              onClick={() => setChartMode('CUMULATIVE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                chartMode === 'CUMULATIVE'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Cumulative fiscal cashflow trajectory and growing society reserve"
            >
              <LineChartIcon className="w-3.5 h-3.5" />
              <span>Cumulative</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Financial Growth Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: FY Total Income & Monthly Average */}
        <div className="bg-slate-950/80 border border-slate-800/90 rounded-2xl p-4.5 hover:border-slate-700/80 transition relative overflow-hidden group">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-medium">Total Fiscal Inflow</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400 tracking-tight">
            {formatBDT(growthStats.totalIncome)}
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400">Monthly Avg:</span>
            <span className="font-mono font-semibold text-slate-200">
              {formatBDT(growthStats.avgMonthlyIncome)}/mo
            </span>
          </div>
          <div className="mt-1 text-[11px] text-emerald-400/80 flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" />
            <span>Peak: {growthStats.peakIncomeMonth?.name} ({formatBDT(growthStats.peakIncomeMonth?.income)})</span>
          </div>
        </div>

        {/* Card 2: FY Total Expense & Burn Rate */}
        <div className="bg-slate-950/80 border border-slate-800/90 rounded-2xl p-4.5 hover:border-slate-700/80 transition relative overflow-hidden group">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-medium">Total Fiscal Outlay</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-rose-400 tracking-tight">
            {formatBDT(growthStats.totalExpense)}
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400">Monthly Burn:</span>
            <span className="font-mono font-semibold text-slate-200">
              {formatBDT(growthStats.avgMonthlyExpense)}/mo
            </span>
          </div>
          <div className="mt-1 text-[11px] text-rose-400/80 flex items-center gap-1">
            <ArrowDownRight className="w-3 h-3" />
            <span>Peak: {growthStats.peakExpenseMonth?.name} ({formatBDT(growthStats.peakExpenseMonth?.expense)})</span>
          </div>
        </div>

        {/* Card 3: Net Operating Surplus & Margin */}
        <div className="bg-slate-950/80 border border-slate-800/90 rounded-2xl p-4.5 hover:border-slate-700/80 transition relative overflow-hidden group">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-medium">Net Operating Surplus</span>
            <div className={`p-2 rounded-xl ${growthStats.netSurplus >= 0 ? 'bg-teal-500/10 text-teal-400' : 'bg-rose-500/10 text-rose-400'}`}>
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl font-bold font-mono tracking-tight ${growthStats.netSurplus >= 0 ? 'text-teal-400' : 'text-rose-400'}`}>
            {formatBDT(growthStats.netSurplus)}
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400">Avg Net Margin:</span>
            <span className={`font-mono font-semibold ${growthStats.avgMonthlyMargin >= 0 ? 'text-teal-400' : 'text-rose-400'}`}>
              {formatBDT(growthStats.avgMonthlyMargin)}/mo
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-teal-400" />
            <span>{growthStats.netSurplus >= 0 ? 'Positive Liquidity Buffer' : 'Deficit Financed via Escrow'}</span>
          </div>
        </div>

        {/* Card 4: MoM Growth Velocity Status */}
        <div className="bg-slate-950/80 border border-slate-800/90 rounded-2xl p-4.5 hover:border-slate-700/80 transition relative overflow-hidden group">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-medium">Fiscal Growth Velocity</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-bold font-mono ${growthStats.netIncomeGrowthVelocity >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {growthStats.netIncomeGrowthVelocity > 0 ? '+' : ''}{growthStats.netIncomeGrowthVelocity}%
            </span>
            <span className="text-[11px] text-slate-400">Income Velocity</span>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400">Expense Velocity:</span>
            <span className={`font-mono font-semibold ${growthStats.netExpenseGrowthVelocity <= growthStats.netIncomeGrowthVelocity ? 'text-emerald-400' : 'text-rose-400'}`}>
              {growthStats.netExpenseGrowthVelocity > 0 ? '+' : ''}{growthStats.netExpenseGrowthVelocity}%
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            {growthStats.netIncomeGrowthVelocity >= growthStats.netExpenseGrowthVelocity ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3" /> Income outgrowing project burn
              </span>
            ) : (
              <span className="text-amber-400 flex items-center gap-1">
                <Activity className="w-3 h-3" /> Project burn pace accelerated
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Interactive Recharts Canvas */}
      <div className="bg-slate-950/70 border border-slate-800/90 rounded-2xl p-5 shadow-inner space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white">
              {chartMode === 'VOLUME' && 'Monthly Volume Comparison & Net Cashflow'}
              {chartMode === 'GROWTH_RATE' && 'Month-over-Month (MoM) Growth Velocity (%)'}
              {chartMode === 'CUMULATIVE' && 'Cumulative Fiscal Cashflow Trajectory'}
            </span>
            <span className="text-slate-500 font-mono">• {displayData.length} Months Plotted</span>
          </div>

          {chartMode === 'VOLUME' && (
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-400 hover:text-slate-200 select-none">
                <input
                  type="checkbox"
                  checked={showGrowthLineOverlay}
                  onChange={(e) => setShowGrowthLineOverlay(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500/20"
                />
                <span>Overlay Net Margin Spline</span>
              </label>
            </div>
          )}
        </div>

        {/* Chart Rendering Container */}
        <div className="h-96 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            {chartMode === 'VOLUME' ? (
              <ComposedChart
                data={displayData}
                margin={{ top: 15, right: 15, left: 10, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="trendsIncomeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="#047857" stopOpacity={0.75} />
                  </linearGradient>
                  <linearGradient id="trendsExpenseGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="#be123c" stopOpacity={0.75} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#64748b"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  axisLine={{ stroke: '#334155' }}
                />
                <YAxis
                  stroke="#64748b"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  tickFormatter={(val) => `৳${(val / 1000).toFixed(0)}k`}
                  axisLine={{ stroke: '#334155' }}
                />
                <Tooltip content={<CustomTrendsTooltip />} />
                <Legend
                  wrapperStyle={{ paddingTop: '15px', fontSize: '11px' }}
                  formatter={(val) => <span className="text-slate-300 font-medium">{val}</span>}
                />

                <Bar
                  dataKey="income"
                  name="Monthly Collection (BDT)"
                  fill="url(#trendsIncomeGradient)"
                  radius={[6, 6, 0, 0]}
                  barSize={24}
                />
                <Bar
                  dataKey="expense"
                  name="Monthly Expense (BDT)"
                  fill="url(#trendsExpenseGradient)"
                  radius={[6, 6, 0, 0]}
                  barSize={24}
                />

                {showGrowthLineOverlay && (
                  <Line
                    type="monotone"
                    dataKey="netCashflow"
                    name="Net Operating Margin (BDT)"
                    stroke="#2dd4bf"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#0f766e', stroke: '#2dd4bf', strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: '#2dd4bf', stroke: '#ffffff', strokeWidth: 2 }}
                  />
                )}
              </ComposedChart>
            ) : chartMode === 'GROWTH_RATE' ? (
              <LineChart
                data={displayData}
                margin={{ top: 15, right: 15, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#64748b"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  axisLine={{ stroke: '#334155' }}
                />
                <YAxis
                  stroke="#64748b"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  tickFormatter={(val) => `${val}%`}
                  axisLine={{ stroke: '#334155' }}
                />
                <ReferenceLine y={0} stroke="#64748b" strokeDasharray="4 4" label={{ value: '0% Baseline', fill: '#64748b', fontSize: 10 }} />
                <Tooltip content={<CustomTrendsTooltip />} />
                <Legend
                  wrapperStyle={{ paddingTop: '15px', fontSize: '11px' }}
                  formatter={(val) => <span className="text-slate-300 font-medium">{val}</span>}
                />

                <Line
                  type="monotone"
                  dataKey="incomeMoMGrowth"
                  name="Income MoM Growth (%)"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#047857', stroke: '#10b981', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: '#10b981', stroke: '#ffffff', strokeWidth: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="expenseMoMGrowth"
                  name="Expense MoM Growth (%)"
                  stroke="#f43f5e"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#be123c', stroke: '#f43f5e', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: '#f43f5e', stroke: '#ffffff', strokeWidth: 2 }}
                />
              </LineChart>
            ) : (
              <AreaChart
                data={displayData}
                margin={{ top: 15, right: 15, left: 10, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="cumIncomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="cumExpenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="cumReserveGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0.02} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#64748b"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  axisLine={{ stroke: '#334155' }}
                />
                <YAxis
                  stroke="#64748b"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  tickFormatter={(val) => `৳${(val / 1000).toFixed(0)}k`}
                  axisLine={{ stroke: '#334155' }}
                />
                <Tooltip content={<CustomTrendsTooltip />} />
                <Legend
                  wrapperStyle={{ paddingTop: '15px', fontSize: '11px' }}
                  formatter={(val) => <span className="text-slate-300 font-medium">{val}</span>}
                />

                <Area
                  type="monotone"
                  dataKey="cumulativeIncome"
                  name="Cumulative Collections (BDT)"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#cumIncomeGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="cumulativeExpense"
                  name="Cumulative Disbursements (BDT)"
                  stroke="#f43f5e"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#cumExpenseGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="cumulativeReserve"
                  name="Cumulative Net Reserve (BDT)"
                  stroke="#2dd4bf"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#cumReserveGrad)"
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Growth Breakdown Data Table */}
      <div className="bg-slate-950/70 border border-slate-800/90 rounded-2xl overflow-hidden shadow-inner">
        <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-200">
              Monthly Fiscal Ledger & Growth Rates Table ({fiscalYear})
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              (12 Months Full Breakdown)
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            All monetary figures verified with central banking vouchers
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-4">Month</th>
                <th className="py-2.5 px-4 text-right">Collections (BDT)</th>
                <th className="py-2.5 px-4 text-right">Income MoM</th>
                <th className="py-2.5 px-4 text-right">Disbursements (BDT)</th>
                <th className="py-2.5 px-4 text-right">Expense MoM</th>
                <th className="py-2.5 px-4 text-right">Net Margin (BDT)</th>
                <th className="py-2.5 px-4 text-right">Cumulative Reserve</th>
                <th className="py-2.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {monthlyMetrics.map((m) => {
                const isSurplus = m.netCashflow >= 0;
                return (
                  <tr
                    key={m.monthIndex}
                    className={`hover:bg-slate-900/50 transition ${
                      m.hasData ? '' : 'opacity-40'
                    }`}
                  >
                    <td className="py-2.5 px-4 font-sans font-medium text-white flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: m.hasData ? '#10b981' : '#475569' }} />
                      <span>{m.fullName}</span>
                      {!m.hasData && <span className="text-[10px] text-slate-500 font-sans">(Projected)</span>}
                    </td>

                    <td className="py-2.5 px-4 text-right text-emerald-400 font-semibold">
                      {formatBDT(m.income)}
                    </td>

                    <td className="py-2.5 px-4 text-right font-sans">
                      {m.incomeMoMGrowth !== 0 ? (
                        <span
                          className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${
                            m.incomeMoMGrowth > 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {m.incomeMoMGrowth > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          {m.incomeMoMGrowth > 0 ? '+' : ''}{m.incomeMoMGrowth}%
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[11px]">0.0%</span>
                      )}
                    </td>

                    <td className="py-2.5 px-4 text-right text-rose-400 font-semibold">
                      {formatBDT(m.expense)}
                    </td>

                    <td className="py-2.5 px-4 text-right font-sans">
                      {m.expenseMoMGrowth !== 0 ? (
                        <span
                          className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${
                            m.expenseMoMGrowth < 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {m.expenseMoMGrowth > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          {m.expenseMoMGrowth > 0 ? '+' : ''}{m.expenseMoMGrowth}%
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[11px]">0.0%</span>
                      )}
                    </td>

                    <td
                      className={`py-2.5 px-4 text-right font-bold ${
                        isSurplus ? 'text-teal-400' : 'text-rose-400'
                      }`}
                    >
                      {formatBDT(m.netCashflow)}
                    </td>

                    <td className="py-2.5 px-4 text-right text-slate-200">
                      {formatBDT(m.cumulativeReserve)}
                    </td>

                    <td className="py-2.5 px-4 text-center font-sans">
                      {m.hasData ? (
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            isSurplus
                              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60'
                              : 'bg-rose-950/80 text-rose-300 border-rose-700/60'
                          }`}
                        >
                          {isSurplus ? 'Surplus' : 'Deficit'}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500">Scheduled</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-slate-900/90 text-slate-200 font-bold border-t border-slate-700 font-mono">
              <tr>
                <td className="py-3 px-4 font-sans">FY {fiscalYear} Total / Net</td>
                <td className="py-3 px-4 text-right text-emerald-400">
                  {formatBDT(growthStats.totalIncome)}
                </td>
                <td className="py-3 px-4 text-right font-sans text-xs text-emerald-300">
                  {growthStats.netIncomeGrowthVelocity > 0 ? '+' : ''}{growthStats.netIncomeGrowthVelocity}%
                </td>
                <td className="py-3 px-4 text-right text-rose-400">
                  {formatBDT(growthStats.totalExpense)}
                </td>
                <td className="py-3 px-4 text-right font-sans text-xs text-rose-300">
                  {growthStats.netExpenseGrowthVelocity > 0 ? '+' : ''}{growthStats.netExpenseGrowthVelocity}%
                </td>
                <td
                  className={`py-3 px-4 text-right ${
                    growthStats.netSurplus >= 0 ? 'text-teal-400' : 'text-rose-400'
                  }`}
                >
                  {formatBDT(growthStats.netSurplus)}
                </td>
                <td className="py-3 px-4 text-right text-white">
                  {formatBDT(growthStats.netSurplus)}
                </td>
                <td className="py-3 px-4 text-center font-sans">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-900/60 text-emerald-200 border border-emerald-600/60 text-[10px]">
                    Audited
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </section>
  );
};
