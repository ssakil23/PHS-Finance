import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Calendar, BarChart3, LineChart as LineChartIcon } from 'lucide-react';
import { IncomeEntry, ExpenseEntry } from '../types';
import { formatBDT } from '../utils/calculations';

interface FinancialTrendChartProps {
  incomes: IncomeEntry[];
  expenses: ExpenseEntry[];
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export const FinancialTrendChart: React.FC<FinancialTrendChartProps> = ({ incomes, expenses }) => {
  const [chartMode, setChartMode] = useState<'BAR_LINE' | 'CUMULATIVE_AREA'>('BAR_LINE');
  const [fiscalYear, setFiscalYear] = useState<number>(2026);

  // Process data for the 12 months of the fiscal year
  const monthlyData = useMemo(() => {
    const months = MONTH_NAMES.map((name, index) => ({
      monthIndex: index,
      name,
      income: 0,
      generalDeposit: 0,
      salesDeposit: 0,
      expense: 0,
      netCashflow: 0,
      cumulativeReserve: 0,
    }));

    // Approved incomes
    incomes.forEach((inc) => {
      if (inc.status === 'APPROVED' && !inc.isSoftDeleted) {
        const d = new Date(inc.date);
        const y = d.getFullYear();
        if (y === fiscalYear) {
          const m = d.getMonth();
          if (m >= 0 && m < 12) {
            months[m].income += inc.amount;
            if (inc.type === 'SALES_DEPOSIT') {
              months[m].salesDeposit += inc.amount;
            } else {
              months[m].generalDeposit += inc.amount;
            }
          }
        }
      }
    });

    // Approved expenses
    expenses.forEach((exp) => {
      if (exp.status === 'APPROVED' && !exp.isSoftDeleted) {
        const d = new Date(exp.date);
        const y = d.getFullYear();
        if (y === fiscalYear) {
          const m = d.getMonth();
          if (m >= 0 && m < 12) {
            months[m].expense += exp.amount;
          }
        }
      }
    });

    // Calculate Net and Cumulative Running Total
    let runningCumulative = 0;
    months.forEach((m) => {
      m.netCashflow = m.income - m.expense;
      runningCumulative += m.netCashflow;
      m.cumulativeReserve = runningCumulative;
    });

    return months;
  }, [incomes, expenses, fiscalYear]);

  // Aggregate highlights
  const totalYearIncome = monthlyData.reduce((acc, m) => acc + m.income, 0);
  const totalYearExpense = monthlyData.reduce((acc, m) => acc + m.expense, 0);
  const netYearReserve = totalYearIncome - totalYearExpense;

  // Custom Dark Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-950/95 border border-slate-700 p-3.5 rounded-xl shadow-2xl backdrop-blur-md text-xs space-y-1.5 min-w-[200px]">
          <div className="font-bold text-white border-b border-slate-800 pb-1 flex items-center justify-between">
            <span>{label} {fiscalYear}</span>
            <span className="text-[10px] text-slate-400 font-mono">Fiscal Year</span>
          </div>
          {payload.map((entry: any, idx: number) => (
            <div key={idx} className="flex justify-between items-center text-xs">
              <span className="flex items-center gap-1.5 text-slate-400">
                <span
                  className="w-2 h-2 rounded-full inline-block"
                  style={{ backgroundColor: entry.color }}
                />
                <span>{entry.name}:</span>
              </span>
              <span className="font-mono font-bold text-white">
                {formatBDT(entry.value)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60">
              Recharts Analytics
            </span>
            <span className="text-xs text-slate-400 font-mono">Monthly Cashflow & Growth</span>
          </div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <span>Fiscal Year Financial Trend Analysis ({fiscalYear})</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Comparative visualization of monthly member/sales collections vs project development disbursements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Chart Mode Toggle */}
          <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              onClick={() => setChartMode('BAR_LINE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                chartMode === 'BAR_LINE'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Income vs Expense</span>
            </button>

            <button
              onClick={() => setChartMode('CUMULATIVE_AREA')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                chartMode === 'CUMULATIVE_AREA'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LineChartIcon className="w-3.5 h-3.5" />
              <span>Cumulative Reserve</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mini Performance Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-400">Total Year Collections</div>
            <div className="text-base font-bold font-mono text-emerald-400">{formatBDT(totalYearIncome)}</div>
          </div>
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-400">Total Year Expenditures</div>
            <div className="text-base font-bold font-mono text-rose-400">{formatBDT(totalYearExpense)}</div>
          </div>
          <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
            <TrendingDown className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-400">Net Year Operating Surplus</div>
            <div className={`text-base font-bold font-mono ${netYearReserve >= 0 ? 'text-teal-400' : 'text-rose-400'}`}>
              {formatBDT(netYearReserve)}
            </div>
          </div>
          <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Main Chart Area */}
      <div className="h-80 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          {chartMode === 'BAR_LINE' ? (
            <ComposedChart data={monthlyData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#059669" stopOpacity={0.7} />
                </linearGradient>
                <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#e11d48" stopOpacity={0.7} />
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
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                tickFormatter={(value) => `৳${(value / 1000).toFixed(0)}k`}
                axisLine={{ stroke: '#334155' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: '10px', fontSize: '11px' }}
                formatter={(value) => <span className="text-slate-300 font-medium">{value}</span>}
              />

              <Bar
                dataKey="income"
                name="Monthly Collection (BDT)"
                fill="url(#incomeGradient)"
                radius={[4, 4, 0, 0]}
                barSize={20}
              />
              <Bar
                dataKey="expense"
                name="Monthly Expense (BDT)"
                fill="url(#expenseGradient)"
                radius={[4, 4, 0, 0]}
                barSize={20}
              />
              <Line
                type="monotone"
                dataKey="netCashflow"
                name="Net Monthly Margin"
                stroke="#2dd4bf"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#2dd4bf' }}
              />
            </ComposedChart>
          ) : (
            <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="reserveGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
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
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                tickFormatter={(value) => `৳${(value / 1000).toFixed(0)}k`}
                axisLine={{ stroke: '#334155' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: '10px', fontSize: '11px' }}
                formatter={(value) => <span className="text-slate-300 font-medium">{value}</span>}
              />

              <Area
                type="monotone"
                dataKey="cumulativeReserve"
                name="Cumulative Society Reserve (BDT)"
                stroke="#10b981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#reserveGradient)"
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>

      <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800">
        <span>Fiscal Cycle: January 01 – December 31, {fiscalYear}</span>
        <span>Values calibrated with verified society bank escrow accounts</span>
      </div>
    </div>
  );
};
