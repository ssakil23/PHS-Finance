import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  BarChart3,
  TrendingDown,
  PieChart as PieChartIcon,
  Calendar,
  Layers,
  Table as TableIcon,
  Filter,
  Download,
  Flame,
  CheckSquare,
  Square,
  Building,
  Zap,
  Wrench,
  Users,
  Shield,
  Briefcase,
  FileCheck,
  ShoppingBag,
} from 'lucide-react';
import { ExpenseEntry } from '../types';
import { formatBDT } from '../utils/calculations';

interface MonthlyExpenseCategoryChartProps {
  expenses: ExpenseEntry[];
  currentFiscalYear?: string;
  availableYears?: string[];
  onFiscalYearChange?: (year: string) => void;
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export interface CategoryConfig {
  key: string;
  label: string;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
  matcher: (cat: string) => boolean;
}

export const EXPENSE_CATEGORIES_CONFIG: CategoryConfig[] = [
  {
    key: 'siteDev',
    label: 'Site Dev & Construction',
    color: '#10b981', // emerald-500
    icon: Building,
    matcher: (cat: string) =>
      cat.toLowerCase().includes('site') ||
      cat.toLowerCase().includes('construction') ||
      cat.toLowerCase().includes('development'),
  },
  {
    key: 'utilities',
    label: 'Utilities (Water & Power)',
    color: '#f59e0b', // amber-500
    icon: Zap,
    matcher: (cat: string) =>
      cat.toLowerCase().includes('electric') ||
      cat.toLowerCase().includes('water') ||
      cat.toLowerCase().includes('utility'),
  },
  {
    key: 'maintenance',
    label: 'Maintenance & Repairs',
    color: '#06b6d4', // cyan-500
    icon: Wrench,
    matcher: (cat: string) => cat.toLowerCase().includes('maintenance') || cat.toLowerCase().includes('repair'),
  },
  {
    key: 'labor',
    label: 'Labor & Field Work',
    color: '#8b5cf6', // purple-500
    icon: Briefcase,
    matcher: (cat: string) => cat.toLowerCase().includes('labor') || cat.toLowerCase().includes('daily worker'),
  },
  {
    key: 'salaries',
    label: 'Salaries & Honorarium',
    color: '#6366f1', // indigo-500
    icon: Users,
    matcher: (cat: string) => cat.toLowerCase().includes('salary') || cat.toLowerCase().includes('honorarium'),
  },
  {
    key: 'purchase',
    label: 'Purchase & Materials',
    color: '#f97316', // orange-500
    icon: ShoppingBag,
    matcher: (cat: string) => cat.toLowerCase().includes('purchase') || cat.toLowerCase().includes('procurement'),
  },
  {
    key: 'security',
    label: 'Security & Surveillance',
    color: '#ec4899', // pink-500
    icon: Shield,
    matcher: (cat: string) => cat.toLowerCase().includes('security') || cat.toLowerCase().includes('guard'),
  },
  {
    key: 'legalAdmin',
    label: 'Legal, Audit & Admin',
    color: '#94a3b8', // slate-400
    icon: FileCheck,
    matcher: (cat: string) =>
      cat.toLowerCase().includes('legal') ||
      cat.toLowerCase().includes('audit') ||
      cat.toLowerCase().includes('meeting') ||
      cat.toLowerCase().includes('compliance') ||
      cat.toLowerCase().includes('other'),
  },
];

export const MonthlyExpenseCategoryChart: React.FC<MonthlyExpenseCategoryChartProps> = ({
  expenses,
  currentFiscalYear = '2026',
  availableYears,
  onFiscalYearChange,
}) => {
  const [selectedYear, setSelectedYear] = useState<string>(currentFiscalYear);
  const [viewMode, setViewMode] = useState<'STACKED' | 'GROUPED' | 'LINE' | 'DISTRIBUTION' | 'TABLE'>('STACKED');
  
  // Selected category keys for filtering
  const [activeCategoryKeys, setActiveCategoryKeys] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    EXPENSE_CATEGORIES_CONFIG.forEach((c) => {
      initial[c.key] = true;
    });
    return initial;
  });

  const years = useMemo(() => {
    if (availableYears && availableYears.length > 0) return availableYears;
    const set = new Set<string>();
    expenses.forEach((e) => {
      if (e.date && e.date.length >= 4) {
        set.add(e.date.substring(0, 4));
      }
    });
    set.add('2026');
    set.add('2025');
    set.add('2024');
    return Array.from(set).sort().reverse();
  }, [availableYears, expenses]);

  const handleYearChange = (year: string) => {
    setSelectedYear(year);
    if (onFiscalYearChange) onFiscalYearChange(year);
  };

  const toggleCategory = (key: string) => {
    setActiveCategoryKeys((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const selectAllCategories = (select: boolean) => {
    const updated: Record<string, boolean> = {};
    EXPENSE_CATEGORIES_CONFIG.forEach((c) => {
      updated[c.key] = select;
    });
    setActiveCategoryKeys(updated);
  };

  // Classify expense into one of the canonical categories
  const classifyCategory = (categoryName: string): string => {
    for (const config of EXPENSE_CATEGORIES_CONFIG) {
      if (config.matcher(categoryName)) {
        return config.key;
      }
    }
    return 'legalAdmin'; // Default fallback
  };

  // Filter expenses by selected fiscal year
  const filteredYearExpenses = useMemo(() => {
    return expenses.filter((e) => {
      if (e.isSoftDeleted || e.status !== 'APPROVED') return false;
      if (selectedYear === 'ALL') return true;
      return e.date && e.date.startsWith(selectedYear);
    });
  }, [expenses, selectedYear]);

  // Aggregate data month by month for the 12 months
  const monthlyData = useMemo(() => {
    const months = MONTH_NAMES.map((name, index) => {
      const monthObj: Record<string, any> = {
        name,
        monthIndex: index,
        total: 0,
      };
      EXPENSE_CATEGORIES_CONFIG.forEach((c) => {
        monthObj[c.key] = 0;
      });
      return monthObj;
    });

    filteredYearExpenses.forEach((exp) => {
      try {
        const d = new Date(exp.date);
        const m = d.getMonth();
        if (m >= 0 && m < 12) {
          const catKey = classifyCategory(exp.category);
          months[m][catKey] = (months[m][catKey] || 0) + exp.amount;
          months[m].total += exp.amount;
        }
      } catch (err) {
        console.error('Failed to parse expense date:', exp);
      }
    });

    return months;
  }, [filteredYearExpenses]);

  // Category totals for the year
  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    EXPENSE_CATEGORIES_CONFIG.forEach((c) => {
      totals[c.key] = 0;
    });

    filteredYearExpenses.forEach((exp) => {
      const catKey = classifyCategory(exp.category);
      totals[catKey] = (totals[catKey] || 0) + exp.amount;
    });

    return totals;
  }, [filteredYearExpenses]);

  const totalFiscalYearExpense = useMemo(() => {
    return Object.values(categoryTotals).reduce((sum, v) => sum + v, 0);
  }, [categoryTotals]);

  // Summary Metrics
  const summaryMetrics = useMemo(() => {
    // Top category
    let topCatKey = 'siteDev';
    let topCatAmount = 0;
    Object.entries(categoryTotals).forEach(([key, amt]) => {
      if (amt > topCatAmount) {
        topCatAmount = amt;
        topCatKey = key;
      }
    });
    const topCategoryConfig = EXPENSE_CATEGORIES_CONFIG.find((c) => c.key === topCatKey);

    // Peak month
    let peakMonth = 'Jan';
    let peakMonthAmount = 0;
    monthlyData.forEach((m) => {
      if (m.total > peakMonthAmount) {
        peakMonthAmount = m.total;
        peakMonth = m.name;
      }
    });

    // Average burn rate (over active months)
    const activeMonths = monthlyData.filter((m) => m.total > 0).length || 1;
    const avgMonthlyExpense = totalFiscalYearExpense / activeMonths;

    // Utility + Maintenance share
    const utilMaintTotal = (categoryTotals['utilities'] || 0) + (categoryTotals['maintenance'] || 0);
    const utilMaintPercentage = totalFiscalYearExpense > 0 ? (utilMaintTotal / totalFiscalYearExpense) * 100 : 0;

    return {
      topCategoryName: topCategoryConfig?.label || 'Site Development',
      topCategoryColor: topCategoryConfig?.color || '#10b981',
      topCategoryAmount: topCatAmount,
      topCategoryPercentage: totalFiscalYearExpense > 0 ? (topCatAmount / totalFiscalYearExpense) * 100 : 0,
      peakMonth,
      peakMonthAmount,
      avgMonthlyExpense,
      utilMaintTotal,
      utilMaintPercentage,
    };
  }, [categoryTotals, monthlyData, totalFiscalYearExpense]);

  // Data for distribution pie chart
  const pieChartData = useMemo(() => {
    return EXPENSE_CATEGORIES_CONFIG.map((c) => ({
      name: c.label,
      key: c.key,
      value: categoryTotals[c.key] || 0,
      color: c.color,
    })).filter((item) => item.value > 0);
  }, [categoryTotals]);

  // Export Table as CSV
  const handleExportCSV = () => {
    const headers = ['Month', ...EXPENSE_CATEGORIES_CONFIG.map((c) => `"${c.label}"`), 'Total Expense (BDT)'];
    const rows = monthlyData.map((m) => {
      const catValues = EXPENSE_CATEGORIES_CONFIG.map((c) => m[c.key] || 0);
      return [m.name, ...catValues, m.total];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [
        `"Prottasha Housing Society - Monthly Expense Category Breakdown (${selectedYear})"`,
        headers.join(','),
        ...rows.map((e) => e.join(',')),
        [
          '"TOTAL"',
          ...EXPENSE_CATEGORIES_CONFIG.map((c) => categoryTotals[c.key] || 0),
          totalFiscalYearExpense,
        ].join(','),
      ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `PHS_Monthly_Expense_Breakdown_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const monthTotal = payload.reduce((sum: number, entry: any) => sum + (Number(entry.value) || 0), 0);
      return (
        <div className="bg-slate-900/95 border border-slate-700/90 rounded-xl p-3.5 shadow-2xl backdrop-blur-md text-xs min-w-[220px]">
          <div className="flex items-center justify-between border-b border-slate-700/70 pb-2 mb-2">
            <span className="font-bold text-white uppercase tracking-wider">{label} {selectedYear}</span>
            <span className="font-mono text-emerald-400 font-bold">{formatBDT(monthTotal)}</span>
          </div>
          <div className="space-y-1.5 max-h-56 overflow-y-auto">
            {payload
              .filter((entry: any) => entry.value > 0)
              .sort((a: any, b: any) => b.value - a.value)
              .map((entry: any, index: number) => {
                const config = EXPENSE_CATEGORIES_CONFIG.find((c) => c.key === entry.dataKey);
                const percent = monthTotal > 0 ? ((entry.value / monthTotal) * 100).toFixed(1) : '0';
                return (
                  <div key={`tip-${index}`} className="flex items-center justify-between gap-2 text-[11px]">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                      <span className="text-slate-300 truncate">{config?.label || entry.name}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-mono text-white font-medium">{formatBDT(entry.value)}</span>
                      <span className="text-slate-400 text-[10px] ml-1.5 font-mono">({percent}%)</span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-xl space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-teal-400 bg-teal-950/80 px-2.5 py-0.5 rounded border border-teal-800/60 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              <span>Category Expense Breakdown</span>
            </span>
            <span className="text-xs text-slate-400 font-mono">Recharts Visual Intelligence</span>
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Monthly Category Expenditure Visualization</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Track and audit monthly resource allocations across Site Development, Utilities, Maintenance, Labor, and Operations.
          </p>
        </div>

        {/* View Mode & Fiscal Year Toggles */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Fiscal Year Switcher */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1">
            <span className="text-xs text-slate-400 px-2 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400" />
              <span>FY:</span>
            </span>
            {years.map((yr) => (
              <button
                key={yr}
                onClick={() => handleYearChange(yr)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition ${
                  selectedYear === yr
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                {yr}
              </button>
            ))}
            <button
              onClick={() => handleYearChange('ALL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition ${
                selectedYear === 'ALL'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              All
            </button>
          </div>

          {/* Visualization Modes */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1">
            <button
              onClick={() => setViewMode('STACKED')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                viewMode === 'STACKED'
                  ? 'bg-teal-600 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Stacked Bar Chart - View category portions of monthly total"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Stacked</span>
            </button>

            <button
              onClick={() => setViewMode('GROUPED')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                viewMode === 'GROUPED'
                  ? 'bg-teal-600 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Grouped Bar Chart - Compare category amounts side-by-side"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Grouped</span>
            </button>

            <button
              onClick={() => setViewMode('LINE')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                viewMode === 'LINE'
                  ? 'bg-teal-600 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Multi-Line Trend Chart - Category spending curves"
            >
              <TrendingDown className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Trends</span>
            </button>

            <button
              onClick={() => setViewMode('DISTRIBUTION')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                viewMode === 'DISTRIBUTION'
                  ? 'bg-teal-600 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Category Distribution Donut"
            >
              <PieChartIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Share</span>
            </button>

            <button
              onClick={() => setViewMode('TABLE')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                viewMode === 'TABLE'
                  ? 'bg-teal-600 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Detailed Tabular Matrix"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Matrix</span>
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-medium transition cursor-pointer"
            title="Export Monthly Expense Breakdown to CSV"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 relative overflow-hidden">
          <div className="text-[11px] text-slate-400 uppercase font-semibold">Total FY {selectedYear} Expense</div>
          <div className="text-xl font-bold font-mono text-rose-400 mt-1">
            {formatBDT(totalFiscalYearExpense)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Sum of 12-month approved vouchers
          </div>
        </div>

        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 relative overflow-hidden">
          <div className="text-[11px] text-slate-400 uppercase font-semibold">Dominant Category</div>
          <div className="text-base font-bold text-white mt-1 flex items-center gap-2 truncate">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: summaryMetrics.topCategoryColor }} />
            <span className="truncate">{summaryMetrics.topCategoryName}</span>
          </div>
          <div className="text-[11px] text-slate-300 mt-0.5 font-mono">
            {formatBDT(summaryMetrics.topCategoryAmount)}{' '}
            <span className="text-teal-400">({summaryMetrics.topCategoryPercentage.toFixed(1)}%)</span>
          </div>
        </div>

        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 relative overflow-hidden">
          <div className="text-[11px] text-slate-400 uppercase font-semibold flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Peak Spending Month</span>
          </div>
          <div className="text-base font-bold text-amber-300 mt-1 flex items-center gap-2">
            <span>{summaryMetrics.peakMonth} {selectedYear}</span>
          </div>
          <div className="text-[11px] font-mono text-slate-300 mt-0.5">
            Peak Outflow: <strong>{formatBDT(summaryMetrics.peakMonthAmount)}</strong>
          </div>
        </div>

        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 relative overflow-hidden">
          <div className="text-[11px] text-slate-400 uppercase font-semibold flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span>Utilities & Maintenance</span>
          </div>
          <div className="text-base font-bold text-cyan-300 mt-1 font-mono">
            {formatBDT(summaryMetrics.utilMaintTotal)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Accounts for <strong className="text-cyan-400">{summaryMetrics.utilMaintPercentage.toFixed(1)}%</strong> of outflow
          </div>
        </div>
      </div>

      {/* Interactive Category Selector Filter Bar */}
      <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5 text-xs">
          <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
            <Filter className="w-3.5 h-3.5 text-teal-400" />
            <span>Filter Active Categories in Visualization:</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => selectAllCategories(true)}
              className="text-[11px] text-teal-400 hover:text-teal-300 flex items-center gap-1 transition"
            >
              <CheckSquare className="w-3 h-3" />
              <span>Select All</span>
            </button>
            <span className="text-slate-600">|</span>
            <button
              onClick={() => selectAllCategories(false)}
              className="text-[11px] text-slate-400 hover:text-slate-300 flex items-center gap-1 transition"
            >
              <Square className="w-3 h-3" />
              <span>Deselect All</span>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {EXPENSE_CATEGORIES_CONFIG.map((config) => {
            const Icon = config.icon;
            const isSelected = activeCategoryKeys[config.key];
            const amount = categoryTotals[config.key] || 0;
            return (
              <button
                key={config.key}
                onClick={() => toggleCategory(config.key)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer ${
                  isSelected
                    ? 'bg-slate-800 border-slate-700 text-white shadow-sm'
                    : 'bg-slate-900/60 border-slate-800/60 text-slate-500 opacity-60 hover:opacity-80'
                }`}
                style={isSelected ? { borderLeftColor: config.color, borderLeftWidth: '3px' } : {}}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: isSelected ? config.color : '#475569' }}
                />
                <Icon className="w-3.5 h-3.5 shrink-0 opacity-80" />
                <span>{config.label}</span>
                <span className="text-[10px] font-mono text-slate-400 ml-1">
                  ({formatBDT(amount)})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Visualization Canvas */}
      <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 min-h-[380px] flex flex-col justify-center">
        {totalFiscalYearExpense === 0 ? (
          <div className="text-center py-16 text-slate-500 space-y-2">
            <Layers className="w-10 h-10 mx-auto text-slate-600 animate-pulse" />
            <p className="text-sm font-medium">No approved expense records found for Fiscal Year {selectedYear}.</p>
            <p className="text-xs text-slate-500">Add or approve expense vouchers in the Expense Module to visualize trends.</p>
          </div>
        ) : viewMode === 'STACKED' ? (
          <div className="h-[380px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 20, right: 20, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis
                  dataKey="name"
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickFormatter={(val) => `৳${(val / 1000).toFixed(0)}k`}
                  width={65}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ paddingBottom: '12px', fontSize: '11px' }}
                />
                {EXPENSE_CATEGORIES_CONFIG.map((config) => {
                  if (!activeCategoryKeys[config.key]) return null;
                  return (
                    <Bar
                      key={config.key}
                      dataKey={config.key}
                      name={config.label}
                      fill={config.color}
                      stackId="a"
                      radius={[2, 2, 0, 0]}
                    />
                  );
                })}
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : viewMode === 'GROUPED' ? (
          <div className="h-[380px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 20, right: 20, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickFormatter={(val) => `৳${(val / 1000).toFixed(0)}k`}
                  width={65}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '12px', fontSize: '11px' }} />
                {EXPENSE_CATEGORIES_CONFIG.map((config) => {
                  if (!activeCategoryKeys[config.key]) return null;
                  return (
                    <Bar
                      key={config.key}
                      dataKey={config.key}
                      name={config.label}
                      fill={config.color}
                      radius={[3, 3, 0, 0]}
                    />
                  );
                })}
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : viewMode === 'LINE' ? (
          <div className="h-[380px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData} margin={{ top: 20, right: 20, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickFormatter={(val) => `৳${(val / 1000).toFixed(0)}k`}
                  width={65}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '12px', fontSize: '11px' }} />
                {EXPENSE_CATEGORIES_CONFIG.map((config) => {
                  if (!activeCategoryKeys[config.key]) return null;
                  return (
                    <Line
                      key={config.key}
                      type="monotone"
                      dataKey={config.key}
                      name={config.label}
                      stroke={config.color}
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: config.color }}
                      activeDot={{ r: 5 }}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : viewMode === 'DISTRIBUTION' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="h-[340px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={115}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => [formatBDT(Number(value)), 'Expense Amount']}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '0.75rem',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Fiscal Year {selectedYear} Category Allocations
              </h4>
              <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-2">
                {pieChartData.map((item) => {
                  const percent = totalFiscalYearExpense > 0 ? ((item.value / totalFiscalYearExpense) * 100).toFixed(1) : '0';
                  return (
                    <div
                      key={item.key}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="text-slate-200 font-medium">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-white font-bold">{formatBDT(item.value)}</span>
                        <span className="text-[10px] text-teal-400 font-mono ml-2">({percent}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* Tabular Monthly Matrix */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[760px]">
              <thead className="bg-slate-900 text-slate-400 uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Month</th>
                  {EXPENSE_CATEGORIES_CONFIG.map((c) => (
                    <th key={c.key} className="py-2.5 px-2 text-right">
                      <span className="truncate block max-w-[100px] ml-auto" title={c.label}>
                        {c.label.split(' ')[0]}
                      </span>
                    </th>
                  ))}
                  <th className="py-2.5 px-3 text-right text-emerald-400 font-bold">Month Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {monthlyData.map((m) => (
                  <tr key={m.name} className="hover:bg-slate-900/60 transition">
                    <td className="py-2 px-3 font-sans font-bold text-slate-200">{m.name}</td>
                    {EXPENSE_CATEGORIES_CONFIG.map((c) => (
                      <td key={c.key} className="py-2 px-2 text-right text-slate-300">
                        {m[c.key] > 0 ? (
                          <span className="text-slate-200">{formatBDT(m[c.key])}</span>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                    ))}
                    <td className="py-2 px-3 text-right font-bold text-rose-400 bg-rose-950/20">
                      {formatBDT(m.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-slate-700 bg-slate-900 font-mono font-bold">
                <tr>
                  <td className="py-2.5 px-3 font-sans text-white uppercase">Year Total</td>
                  {EXPENSE_CATEGORIES_CONFIG.map((c) => (
                    <td key={c.key} className="py-2.5 px-2 text-right text-white">
                      {formatBDT(categoryTotals[c.key] || 0)}
                    </td>
                  ))}
                  <td className="py-2.5 px-3 text-right text-rose-400 bg-rose-950/40 text-sm">
                    {formatBDT(totalFiscalYearExpense)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
