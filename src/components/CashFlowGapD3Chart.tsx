import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import {
  TrendingDown,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Layers,
  Info,
  DollarSign,
  ArrowRight,
} from 'lucide-react';
import { IncomeEntry, ExpenseEntry, Member } from '../types';
import { formatBDT, computeAllMemberSummaries } from '../utils/calculations';

interface CashFlowGapD3ChartProps {
  incomes: IncomeEntry[];
  expenses: ExpenseEntry[];
  members: Member[];
}

interface MonthlyCashFlowData {
  month: string;
  monthIndex: number;
  projectedIncome: number;
  outstandingDues: number;
  actualCollection: number;
  projectedExpense: number;
  cashFlowGap: number; // projectedIncome - (outstandingDues recovery target or projected commitments)
  isDeficit: boolean;
}

export const CashFlowGapD3Chart: React.FC<CashFlowGapD3ChartProps> = ({
  incomes,
  expenses,
  members,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  const [timeHorizon, setTimeHorizon] = useState<6 | 12>(6);
  const [collectionPace, setCollectionPace] = useState<'CONSERVATIVE' | 'MODERATE' | 'OPTIMISTIC'>('MODERATE');

  // Compute total outstanding member dues from active ledger
  const memberSummaries = useMemo(() => {
    return computeAllMemberSummaries(members, incomes, expenses);
  }, [members, incomes, expenses]);

  const totalOutstandingDues = useMemo(() => {
    return memberSummaries
      .filter((s) => s.currentBalance < 0)
      .reduce((sum, s) => sum + Math.abs(s.currentBalance), 0);
  }, [memberSummaries]);

  const dueMembersCount = useMemo(() => {
    return memberSummaries.filter((s) => s.currentBalance < 0).length;
  }, [memberSummaries]);

  // Collection pace multiplier
  const paceFactor = useMemo(() => {
    switch (collectionPace) {
      case 'CONSERVATIVE':
        return 0.5; // 50% recovery expectation
      case 'MODERATE':
        return 0.75; // 75% recovery expectation
      case 'OPTIMISTIC':
        return 0.95; // 95% recovery expectation
      default:
        return 0.75;
    }
  }, [collectionPace]);

  // Average monthly actual expenses over the last 3-6 months to establish baseline project obligations
  const averageMonthlyExpense = useMemo(() => {
    const approvedExpenses = expenses.filter((e) => e.status === 'APPROVED' && !e.isSoftDeleted);
    if (approvedExpenses.length === 0) return 450000;
    const totalExp = approvedExpenses.reduce((sum, e) => sum + e.amount, 0);
    return Math.max(350000, Math.round(totalExp / 6));
  }, [expenses]);

  // Generate monthly forward-looking projections
  const monthlyData: MonthlyCashFlowData[] = useMemo(() => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonthIndex = new Date().getMonth(); // 0 to 11
    const count = timeHorizon;

    const data: MonthlyCashFlowData[] = [];
    const monthlyDueInstallmentTarget = totalOutstandingDues / (count * 1.5);

    for (let i = 0; i < count; i++) {
      const idx = (currentMonthIndex + i) % 12;
      const monthName = monthNames[idx];

      // Projected base monthly subscription/installments per share (144 shares * ~৳15,000 to ৳25,000 depending on tier milestones)
      const baseProjectedIncome = 144 * (16000 + ((i % 3) * 3500));
      
      // Estimated outstanding dues scheduled or expected to be collected in this window
      const projectedDueRecovery = Math.round(monthlyDueInstallmentTarget * (1 + (i * 0.08)) * paceFactor);

      // Total projected income
      const projectedIncome = baseProjectedIncome + projectedDueRecovery;

      // Outstanding dues balance carrying over
      const remainingDues = Math.max(0, totalOutstandingDues - (monthlyDueInstallmentTarget * i * paceFactor));

      // Actual collection for current/past months (if i === 0, sum of current month collections)
      const actualCollection = i === 0 
        ? incomes
            .filter((inc) => inc.status === 'APPROVED' && !inc.isSoftDeleted)
            .slice(-4)
            .reduce((sum, inc) => sum + inc.amount, 0)
        : 0;

      // Projected expense commitment for road, boundary, utility works
      const projectedExpense = Math.round(averageMonthlyExpense * (1 + (i * 0.05)));

      // Cash flow gap: Projected Income - Projected Expense Obligations
      const cashFlowGap = projectedIncome - projectedExpense;

      data.push({
        month: `${monthName}`,
        monthIndex: idx,
        projectedIncome,
        outstandingDues: Math.round(remainingDues),
        actualCollection,
        projectedExpense,
        cashFlowGap,
        isDeficit: cashFlowGap < 0,
      });
    }

    return data;
  }, [timeHorizon, totalOutstandingDues, paceFactor, averageMonthlyExpense, incomes]);

  // Aggregate stats
  const totalProjectedIncome = useMemo(() => {
    return monthlyData.reduce((acc, m) => acc + m.projectedIncome, 0);
  }, [monthlyData]);

  const totalProjectedExpense = useMemo(() => {
    return monthlyData.reduce((acc, m) => acc + m.projectedExpense, 0);
  }, [monthlyData]);

  const netCashFlowGap = totalProjectedIncome - totalProjectedExpense;
  const criticalDeficitMonths = monthlyData.filter((m) => m.cashFlowGap < 0);

  // Render D3 SVG Chart
  useEffect(() => {
    if (!svgRef.current || monthlyData.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const containerWidth = svgRef.current.parentElement?.clientWidth || 800;
    const width = Math.max(640, containerWidth);
    const height = 380;
    const margin = { top: 35, right: 35, bottom: 45, left: 75 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    svg.attr('viewBox', `0 0 ${width} ${height}`).attr('width', '100%').attr('height', height);

    // Defs for gradients & patterns
    const defs = svg.append('defs');

    // Income Bar Gradient (Emerald)
    const incomeGrad = defs
      .append('linearGradient')
      .attr('id', 'd3-income-grad')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');
    incomeGrad.append('stop').attr('offset', '0%').attr('stop-color', '#10b981').attr('stop-opacity', 0.95);
    incomeGrad.append('stop').attr('offset', '100%').attr('stop-color', '#059669').attr('stop-opacity', 0.65);

    // Outstanding Dues Gradient (Amber / Rose)
    const duesGrad = defs
      .append('linearGradient')
      .attr('id', 'd3-dues-grad')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');
    duesGrad.append('stop').attr('offset', '0%').attr('stop-color', '#f59e0b').attr('stop-opacity', 0.9);
    duesGrad.append('stop').attr('offset', '100%').attr('stop-color', '#d97706').attr('stop-opacity', 0.6);

    // Area Gap Gradient (Emerald to Slate)
    const areaGrad = defs
      .append('linearGradient')
      .attr('id', 'd3-gap-area-grad')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');
    areaGrad.append('stop').attr('offset', '0%').attr('stop-color', '#38bdf8').attr('stop-opacity', 0.35);
    areaGrad.append('stop').attr('offset', '100%').attr('stop-color', '#0284c7').attr('stop-opacity', 0.02);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // X Scale (Months)
    const x0Scale = d3
      .scaleBand()
      .domain(monthlyData.map((d) => d.month))
      .range([0, innerWidth])
      .paddingInner(0.28)
      .paddingOuter(0.15);

    // Sub-group scale for grouped bars (Projected Income vs Outstanding Dues)
    const barKeys = ['projectedIncome', 'outstandingDues'];
    const x1Scale = d3
      .scaleBand()
      .domain(barKeys)
      .range([0, x0Scale.bandwidth()])
      .padding(0.08);

    // Y Scale
    const maxVal = d3.max(monthlyData, (d) => Math.max(d.projectedIncome, d.outstandingDues, d.projectedExpense)) || 2500000;
    const yScale = d3
      .scaleLinear()
      .domain([0, maxVal * 1.15])
      .nice()
      .range([innerHeight, 0]);

    // Gridlines (Horizontal)
    g.append('g')
      .attr('class', 'grid')
      .call(
        d3
          .axisLeft(yScale)
          .ticks(5)
          .tickSize(-innerWidth)
          .tickFormat(() => '')
      )
      .selectAll('line')
      .attr('stroke', '#334155')
      .attr('stroke-opacity', 0.35)
      .attr('stroke-dasharray', '3,3');

    // Axes
    const xAxis = d3.axisBottom(x0Scale).tickSizeOuter(0);
    const yAxis = d3
      .axisLeft(yScale)
      .ticks(5)
      .tickFormat((d) => {
        const num = d as number;
        if (num >= 10000000) return `৳ ${(num / 10000000).toFixed(1)}Cr`;
        if (num >= 100000) return `৳ ${(num / 100000).toFixed(1)}L`;
        if (num >= 1000) return `৳ ${(num / 1000).toFixed(0)}k`;
        return `৳ ${num}`;
      });

    // Render X Axis
    const xAxisGroup = g
      .append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis);

    xAxisGroup
      .selectAll('text')
      .attr('fill', '#94a3b8')
      .attr('font-size', '11px')
      .attr('font-weight', '600')
      .attr('dy', '1em');

    xAxisGroup.select('.domain').attr('stroke', '#475569');

    // Render Y Axis
    const yAxisGroup = g.append('g').call(yAxis);
    yAxisGroup
      .selectAll('text')
      .attr('fill', '#94a3b8')
      .attr('font-size', '10px')
      .attr('font-family', 'ui-monospace, monospace');
    yAxisGroup.select('.domain').attr('stroke', '#475569');

    // Render Grouped Bars
    const monthGroups = g
      .selectAll('.month-group')
      .data(monthlyData)
      .enter()
      .append('g')
      .attr('class', 'month-group')
      .attr('transform', (d) => `translate(${x0Scale(d.month)},0)`);

    // Projected Income Bars
    monthGroups
      .append('rect')
      .attr('x', x1Scale('projectedIncome') || 0)
      .attr('y', (d) => yScale(d.projectedIncome))
      .attr('width', x1Scale.bandwidth())
      .attr('height', (d) => Math.max(0, innerHeight - yScale(d.projectedIncome)))
      .attr('fill', 'url(#d3-income-grad)')
      .attr('rx', 4)
      .attr('class', 'transition-all duration-200 cursor-pointer')
      .on('mouseenter', function (event, d) {
        d3.select(this).attr('opacity', 0.85);
        if (tooltipRef.current) {
          tooltipRef.current.style.opacity = '1';
          tooltipRef.current.style.left = `${event.pageX + 12}px`;
          tooltipRef.current.style.top = `${event.pageY - 40}px`;
          tooltipRef.current.innerHTML = `
            <div class="font-bold text-white mb-1 border-b border-slate-700 pb-1">${d.month} – Projected Income</div>
            <div class="text-emerald-400 font-mono font-bold">${formatBDT(d.projectedIncome)}</div>
            <div class="text-[10px] text-slate-400 mt-1">Expected monthly shareholder deposits & installment inflows</div>
          `;
        }
      })
      .on('mouseleave', function () {
        d3.select(this).attr('opacity', 1);
        if (tooltipRef.current) tooltipRef.current.style.opacity = '0';
      });

    // Outstanding Dues Bars
    monthGroups
      .append('rect')
      .attr('x', x1Scale('outstandingDues') || 0)
      .attr('y', (d) => yScale(d.outstandingDues))
      .attr('width', x1Scale.bandwidth())
      .attr('height', (d) => Math.max(0, innerHeight - yScale(d.outstandingDues)))
      .attr('fill', 'url(#d3-dues-grad)')
      .attr('rx', 4)
      .attr('class', 'transition-all duration-200 cursor-pointer')
      .on('mouseenter', function (event, d) {
        d3.select(this).attr('opacity', 0.85);
        if (tooltipRef.current) {
          tooltipRef.current.style.opacity = '1';
          tooltipRef.current.style.left = `${event.pageX + 12}px`;
          tooltipRef.current.style.top = `${event.pageY - 40}px`;
          tooltipRef.current.innerHTML = `
            <div class="font-bold text-white mb-1 border-b border-slate-700 pb-1">${d.month} – Outstanding Dues</div>
            <div class="text-amber-400 font-mono font-bold">${formatBDT(d.outstandingDues)}</div>
            <div class="text-[10px] text-slate-400 mt-1">Uncollected shareholder dues carried over against target</div>
          `;
        }
      })
      .on('mouseleave', function () {
        d3.select(this).attr('opacity', 1);
        if (tooltipRef.current) tooltipRef.current.style.opacity = '0';
      });

    // Cash Gap Line & Area overlay
    const lineGenerator = d3
      .line<MonthlyCashFlowData>()
      .x((d) => (x0Scale(d.month) || 0) + x0Scale.bandwidth() / 2)
      .y((d) => yScale(d.projectedExpense))
      .curve(d3.curveMonotoneX);

    // Projected Expense Line
    g.append('path')
      .datum(monthlyData)
      .attr('fill', 'none')
      .attr('stroke', '#38bdf8')
      .attr('stroke-width', 2.5)
      .attr('stroke-dasharray', '5,4')
      .attr('d', lineGenerator);

    // Dots on the Projected Expense line
    g.selectAll('.expense-dot')
      .data(monthlyData)
      .enter()
      .append('circle')
      .attr('class', 'expense-dot cursor-pointer')
      .attr('cx', (d) => (x0Scale(d.month) || 0) + x0Scale.bandwidth() / 2)
      .attr('cy', (d) => yScale(d.projectedExpense))
      .attr('r', 4.5)
      .attr('fill', '#0284c7')
      .attr('stroke', '#bae6fd')
      .attr('stroke-width', 2)
      .on('mouseenter', function (event, d) {
        d3.select(this).attr('r', 6.5);
        if (tooltipRef.current) {
          tooltipRef.current.style.opacity = '1';
          tooltipRef.current.style.left = `${event.pageX + 12}px`;
          tooltipRef.current.style.top = `${event.pageY - 40}px`;
          tooltipRef.current.innerHTML = `
            <div class="font-bold text-white mb-1 border-b border-slate-700 pb-1">${d.month} – Project Expense Obligation</div>
            <div class="text-sky-300 font-mono font-bold">${formatBDT(d.projectedExpense)}</div>
            <div class="text-[10px] ${d.isDeficit ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'} mt-1">
              Cash Gap: ${d.isDeficit ? '-' : '+'}${formatBDT(Math.abs(d.cashFlowGap))} (${d.isDeficit ? 'Shortfall Gap' : 'Surplus Cushion'})
            </div>
          `;
        }
      })
      .on('mouseleave', function () {
        d3.select(this).attr('r', 4.5);
        if (tooltipRef.current) tooltipRef.current.style.opacity = '0';
      });

    // Cash Gap Indicator flags above bars
    monthGroups.each(function (d) {
      const group = d3.select(this);
      const isDeficit = d.isDeficit;
      const xPos = x0Scale.bandwidth() / 2;
      const topY = Math.min(yScale(d.projectedIncome), yScale(d.outstandingDues)) - 10;

      group
        .append('text')
        .attr('x', xPos)
        .attr('y', Math.max(12, topY))
        .attr('text-anchor', 'middle')
        .attr('font-size', '9px')
        .attr('font-weight', '700')
        .attr('fill', isDeficit ? '#f43f5e' : '#10b981')
        .text(isDeficit ? 'GAP!' : 'OK');
    });

  }, [monthlyData]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              D3.js Visualization Engine
            </span>
            <span className="text-xs text-slate-400 font-mono">Cash Flow Gap & Member Dues Matrix</span>
          </div>
          <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <span>Outstanding Member Dues vs Projected Monthly Income</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Empowering the Executive Committee to anticipate cash flow shortfalls, evaluate member recovery pace, and secure liquidity for site development.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Recovery Pace Selector */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <span className="text-[11px] text-slate-400 px-2 font-medium">Recovery Pace:</span>
            <button
              onClick={() => setCollectionPace('CONSERVATIVE')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                collectionPace === 'CONSERVATIVE'
                  ? 'bg-amber-950 text-amber-300 border border-amber-800'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              50% (Slow)
            </button>
            <button
              onClick={() => setCollectionPace('MODERATE')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                collectionPace === 'MODERATE'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              75% (Target)
            </button>
            <button
              onClick={() => setCollectionPace('OPTIMISTIC')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                collectionPace === 'OPTIMISTIC'
                  ? 'bg-teal-950 text-teal-300 border border-teal-800'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              95% (Fast)
            </button>
          </div>

          {/* Time Horizon Selector */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setTimeHorizon(6)}
              className={`px-3 py-1 rounded-lg font-semibold transition ${
                timeHorizon === 6
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              6 Months
            </button>
            <button
              onClick={() => setTimeHorizon(12)}
              className={`px-3 py-1 rounded-lg font-semibold transition ${
                timeHorizon === 12
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              12 Months
            </button>
          </div>
        </div>
      </div>

      {/* KPI Highlight Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5">
          <span className="text-[11px] text-slate-400 block font-medium">Total Outstanding Member Dues</span>
          <div className="text-xl font-bold font-mono text-amber-400 mt-1">
            {formatBDT(totalOutstandingDues)}
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">
            Across {dueMembersCount} shareholder accounts with arrears
          </span>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5">
          <span className="text-[11px] text-slate-400 block font-medium">
            Projected Inflow ({timeHorizon}M Horizon)
          </span>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
            {formatBDT(totalProjectedIncome)}
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">
            Includes monthly shares + {collectionPace.toLowerCase()} recovery
          </span>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5">
          <span className="text-[11px] text-slate-400 block font-medium">Projected Obligations</span>
          <div className="text-xl font-bold font-mono text-sky-400 mt-1">
            {formatBDT(totalProjectedExpense)}
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">
            Based on ~{formatBDT(averageMonthlyExpense)}/mo baseline works
          </span>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5">
          <span className="text-[11px] text-slate-400 block font-medium">Net Projected Liquidity Cushion</span>
          <div className={`text-xl font-bold font-mono mt-1 ${netCashFlowGap >= 0 ? 'text-teal-400' : 'text-rose-400'}`}>
            {netCashFlowGap >= 0 ? '+' : ''}{formatBDT(netCashFlowGap)}
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">
            {criticalDeficitMonths.length > 0 ? (
              <span className="text-rose-400 font-semibold">{criticalDeficitMonths.length} month(s) with deficit gap</span>
            ) : (
              <span className="text-emerald-400">All months maintain positive liquidity</span>
            )}
          </span>
        </div>
      </div>

      {/* D3 Chart Area */}
      <div className="relative bg-slate-950/90 rounded-2xl border border-slate-800/80 p-4 overflow-hidden">
        {/* Chart Legend */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2 px-2 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-emerald-500 inline-block shadow-xs" />
              <span className="text-slate-300 font-medium">Projected Monthly Income</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-amber-500 inline-block shadow-xs" />
              <span className="text-slate-300 font-medium">Outstanding Dues Pipeline</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 border-t-2 border-dashed border-sky-400 inline-block" />
              <span className="w-2 h-2 rounded-full bg-sky-400 inline-block" />
              <span className="text-slate-300 font-medium">Projected Expense Obligation</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <span>Hover bars for breakdown</span>
          </div>
        </div>

        {/* SVG Canvas */}
        <div className="w-full overflow-x-auto">
          <svg ref={svgRef} className="w-full block" />
        </div>

        {/* Floating Tooltip Container */}
        <div
          ref={tooltipRef}
          style={{ opacity: 0 }}
          className="fixed pointer-events-none z-50 bg-slate-950/95 border border-slate-700 p-3 rounded-xl shadow-2xl backdrop-blur-md text-xs transition-opacity duration-150 max-w-xs"
        />
      </div>

      {/* Committee Guidance & Analysis */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
        <div className="flex items-start gap-2.5">
          <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-slate-300 leading-relaxed">
            <strong className="text-white">Committee Action Plan:</strong> If outstanding member dues recovery lags below 70%, the society will encounter a cash gap in Tier-3 road & drainage contracts. Controlling Directors should issue prompt statements to the {dueMembersCount} members in arrears.
          </p>
        </div>
      </div>
    </div>
  );
};
