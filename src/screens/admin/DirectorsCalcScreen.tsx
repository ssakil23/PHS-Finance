import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
} from 'react-native';
import {
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  ShieldAlert,
  Wallet,
  Receipt,
  Users,
  Award,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  RefreshCw,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  FileText,
  DollarSign,
  Briefcase,
  HardHat,
  Shield,
  HelpCircle,
  Settings,
} from 'lucide-react';
import { useDirectorsCalcStore } from '../../store/useDirectorsCalcStore';
import {
  OperationalExpenseCategory,
  CATEGORY_LABELS,
  FounderRatioConfig,
  DistributionInstallment,
} from '../../types/directorsCalc';
import { storageService } from '../../services/storageService';
import { authService } from '../../services/authService';
import { User, Member } from '../../types';

interface DirectorsCalcScreenProps {
  currentUser?: User | null;
  totalLiveProjectExpense?: number;
  onBack?: () => void;
}

export const DirectorsCalcScreen: React.FC<DirectorsCalcScreenProps> = ({
  currentUser: propUser,
  totalLiveProjectExpense: propExpense,
  onBack,
}) => {
  // Current authenticated user (fall back to authService if not passed)
  const [currentUser, setCurrentUser] = useState<User | null>(
    propUser || authService.getCurrentUser()
  );

  useEffect(() => {
    if (propUser) {
      setCurrentUser(propUser);
    } else {
      const unsub = authService.subscribe((u) => setCurrentUser(u));
      return () => unsub();
    }
  }, [propUser]);

  // Compute live project expense from approved project expenses if not provided
  const liveProjectExpense = useMemo(() => {
    if (typeof propExpense === 'number' && propExpense >= 0) {
      return propExpense;
    }
    try {
      const expList = storageService.getExpenses();
      return expList
        .filter((e) => e.status === 'APPROVED' && !e.isSoftDeleted)
        .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    } catch {
      return 15850000; // Realistic fallback default
    }
  }, [propExpense]);

  // Zustand Store state & actions
  const {
    overheadPercentage,
    foundersPoolPercentage,
    shareholdersPoolPercentage,
    founderRatios,
    expenses,
    distributionHistory,
    selectedShareholderIds,
    addOperationalExpense,
    deleteOperationalExpense,
    updateFounderRatios,
    setSelectedShareholderIds,
    calculateLiveReserveFund,
    triggerDistributionInstallment,
    resetToDefaults,
  } = useDirectorsCalcStore();

  // Role Checks
  const isSystemAdmin = currentUser?.role === 'SYSTEM_ADMIN';
  const isDelegatedAdmin = currentUser?.role === 'DELEGATED_ADMIN';
  const canAuthorizeDistribution = isSystemAdmin || isDelegatedAdmin;

  // Live Calculations from store
  const calc = useMemo(() => {
    return calculateLiveReserveFund(liveProjectExpense);
  }, [calculateLiveReserveFund, liveProjectExpense, expenses, distributionHistory]);

  // UI Local State
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'EXPENSES' | 'DISTRIBUTION' | 'RATIOS' | 'HISTORY'>('OVERVIEW');
  const [successBanner, setSuccessBanner] = useState<string>('');
  const [errorBanner, setErrorBanner] = useState<string>('');

  // Operational Expense Form State
  const [expCategory, setExpCategory] = useState<OperationalExpenseCategory>('GUARD_SALARY');
  const [expTitle, setExpTitle] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expDate, setExpDate] = useState(new Date().toISOString().split('T')[0]);
  const [expVoucher, setExpVoucher] = useState('');
  const [expNotes, setExpNotes] = useState('');
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);

  // Distribution Form State
  const [installmentPct, setInstallmentPct] = useState<number>(33);
  const [distributionRemarks, setDistributionRemarks] = useState('');
  const [isExecutingTranche, setIsExecutingTranche] = useState(false);
  const [selectedHistoricalDist, setSelectedHistoricalDist] = useState<DistributionInstallment | null>(null);

  // Founder Ratio Editing State (System Admin only)
  const [editableRatios, setEditableRatios] = useState<FounderRatioConfig[]>(founderRatios);
  const [ratioEditError, setRatioEditError] = useState<string>('');
  const [isEditingRatios, setIsEditingRatios] = useState(false);

  // Shareholder Selection Modal State (System Admin)
  const [showShareholderModal, setShowShareholderModal] = useState(false);
  const [allMembers, setAllMembers] = useState<Member[]>([]);

  useEffect(() => {
    try {
      setAllMembers(storageService.getMembers());
    } catch {}
  }, []);

  useEffect(() => {
    setEditableRatios(founderRatios);
  }, [founderRatios]);

  // Sum of editable ratios
  const editableRatiosSum = useMemo(() => {
    return editableRatios.reduce((sum, r) => sum + (Number(r.ratioPercentage) || 0), 0);
  }, [editableRatios]);

  const isRatiosSumValid = Math.abs(editableRatiosSum - 100) <= 0.05;

  // Handle Add Operational Expense
  const handleAddExpenseSubmit = () => {
    setErrorBanner('');
    if (!expTitle.trim()) {
      setErrorBanner('Please provide an operational expense title or description.');
      return;
    }
    const numAmount = parseFloat(expAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorBanner('Please enter a valid positive expense amount in BDT (৳).');
      return;
    }

    try {
      const created = addOperationalExpense({
        category: expCategory,
        title: expTitle.trim(),
        amountBDT: Math.round(numAmount),
        date: expDate || new Date().toISOString().split('T')[0],
        voucherRef: expVoucher.trim() || undefined,
        notes: expNotes.trim() || undefined,
        createdBy: currentUser?.username || currentUser?.id || 'admin',
        createdByName: currentUser?.name || 'Administrator',
      });

      setSuccessBanner(`Operational expense "${created.title}" (৳ ${created.amountBDT.toLocaleString()}) recorded successfully.`);
      setExpTitle('');
      setExpAmount('');
      setExpVoucher('');
      setExpNotes('');
      setShowAddExpenseModal(false);
      setTimeout(() => setSuccessBanner(''), 4000);
    } catch (err: any) {
      setErrorBanner(err.message || 'Failed to record operational expense.');
    }
  };

  // Handle Ratio Change for a Founder
  const handleRatioChange = (founderId: string, valStr: string) => {
    const val = parseFloat(valStr) || 0;
    setEditableRatios((prev) =>
      prev.map((r) => (r.founderId === founderId ? { ...r, ratioPercentage: val } : r))
    );
  };

  // Save Ratios
  const handleSaveRatios = () => {
    setRatioEditError('');
    if (!isRatiosSumValid) {
      setRatioEditError(`Sum of all 8 Founder ratios must equal exactly 100.00%. Current total is ${editableRatiosSum.toFixed(4)}%.`);
      return;
    }

    const res = updateFounderRatios(editableRatios);
    if (res.success) {
      setSuccessBanner('Founder distribution ratio matrix updated successfully.');
      setIsEditingRatios(false);
      setTimeout(() => setSuccessBanner(''), 4000);
    } else {
      setRatioEditError(res.error || 'Failed to save ratios.');
    }
  };

  // Live Payout Preview for current installment percentage
  const previewPayout = useMemo(() => {
    if (calc.availableReserveFund <= 0) {
      return { total: 0, founders: 0, shareholders: 0, breakdown: [] };
    }
    const safePct = Math.min(70, Math.max(20, installmentPct));
    const total = Math.round(calc.availableReserveFund * (safePct / 100));
    const founders = Math.round(total * 0.75);
    const shareholders = Math.round(total * 0.25);
    const breakdown = founderRatios.map((f) => ({
      ...f,
      amountBDT: Math.round(founders * (f.ratioPercentage / 100)),
    }));
    return { total, founders, shareholders, breakdown };
  }, [calc.availableReserveFund, installmentPct, founderRatios]);

  // Trigger Installment Payout
  const handleExecuteTranche = () => {
    setErrorBanner('');
    if (!canAuthorizeDistribution) {
      setErrorBanner('Unauthorized: Tranche distributions are restricted to System Admin and Delegated Admin.');
      return;
    }

    if (installmentPct < 20 || installmentPct > 70) {
      setErrorBanner('Installment percentage must be within the authorized band of 20% to 70%.');
      return;
    }

    if (calc.availableReserveFund <= 0) {
      setErrorBanner('Cannot execute distribution: Available Net Reserve Fund is ৳ 0.');
      return;
    }

    const confirmed = window.confirm(
      `AUTHORIZE TRANCHE DISTRIBUTION:\n\n` +
      `• Tranche Percentage: ${installmentPct}%\n` +
      `• Total Payout Amount: ৳ ${previewPayout.total.toLocaleString()}\n` +
      `• Founders Pool (75%): ৳ ${previewPayout.founders.toLocaleString()} (Across 8 Founders)\n` +
      `• Shareholders Pool (25%): ৳ ${previewPayout.shareholders.toLocaleString()} (Across selected shareowners)\n\n` +
      `Are you sure you want to execute this distribution tranche?`
    );

    if (!confirmed) return;

    setIsExecutingTranche(true);
    try {
      const res = triggerDistributionInstallment(
        installmentPct,
        currentUser?.id || 'admin',
        currentUser?.name || 'Administrator',
        currentUser?.role || 'SYSTEM_ADMIN',
        liveProjectExpense,
        distributionRemarks
      );

      if (res.success && res.installment) {
        setSuccessBanner(`Tranche payout of ৳ ${res.installment.payoutAmount.toLocaleString()} (${installmentPct}%) successfully executed and logged.`);
        setDistributionRemarks('');
        setActiveTab('HISTORY');
        setTimeout(() => setSuccessBanner(''), 5000);
      } else {
        setErrorBanner(res.error || 'Failed to execute distribution tranche.');
      }
    } catch (err: any) {
      setErrorBanner(err.message || 'Failed to trigger tranche distribution.');
    } finally {
      setIsExecutingTranche(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Top Navigation / Breadcrumbs */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          {onBack && (
            <TouchableOpacity style={styles.backBtn} onPress={onBack}>
              <Text style={styles.backBtnText}>← Back</Text>
            </TouchableOpacity>
          )}
          <View>
            <View style={styles.titleRow}>
              <Text style={styles.mainTitle}>Director's Calc</Text>
              <View style={styles.liveEngineBadge}>
                <Sparkles size={12} color="#10b981" />
                <Text style={styles.liveEngineText}>Isolated Financial Ledger</Text>
              </View>
            </View>
            <Text style={styles.subTitle}>
              Management Fee Gross Income (10%) • Overhead Deductions • Founders (75%) & Shareholders (25%) Tranches
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <View style={styles.roleBadge}>
            <ShieldCheck size={14} color="#a855f7" />
            <Text style={styles.roleBadgeText}>
              {currentUser?.role === 'SYSTEM_ADMIN' ? 'System Admin (Full Control)' : currentUser?.role === 'DELEGATED_ADMIN' ? 'Delegated Admin' : 'Viewer / Official'}
            </Text>
          </View>
          {isSystemAdmin && (
            <TouchableOpacity
              style={styles.resetBtn}
              onPress={() => {
                if (window.confirm('Reset Director\'s Calc store to default parameters and initial seed expenses?')) {
                  resetToDefaults();
                  setSuccessBanner('Director\'s Calc module reset to default configuration.');
                  setTimeout(() => setSuccessBanner(''), 3000);
                }
              }}
            >
              <RefreshCw size={12} color="#94a3b8" />
              <Text style={styles.resetBtnText}>Reset Demo</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Live Financial Sync Ribbon */}
      <View style={styles.liveSyncRibbon}>
        <View style={styles.liveSyncLeft}>
          <View style={styles.pulseDot} />
          <Text style={styles.liveSyncLabel}>Live Total Project Expense Base:</Text>
          <Text style={styles.liveSyncValue}>৳ {liveProjectExpense.toLocaleString()}</Text>
        </View>
        <Text style={styles.liveSyncFormula}>
          Formula: Module_Income = ৳ {liveProjectExpense.toLocaleString()} × 10% = ৳ {calc.moduleGrossIncome.toLocaleString()}
        </Text>
      </View>

      {/* Notifications */}
      {successBanner ? (
        <View style={styles.successBanner}>
          <CheckCircle2 size={16} color="#10b981" />
          <Text style={styles.successBannerText}>{successBanner}</Text>
        </View>
      ) : null}

      {errorBanner ? (
        <View style={styles.errorBanner}>
          <AlertCircle size={16} color="#f43f5e" />
          <Text style={styles.errorBannerText}>{errorBanner}</Text>
        </View>
      ) : null}

      {/* 4 Core Financial KPI Cards */}
      <View style={styles.kpiGrid}>
        {/* KPI 1: Live Module Gross Income */}
        <View style={[styles.kpiCard, styles.kpiCardIncome]}>
          <View style={styles.kpiTop}>
            <Text style={styles.kpiLabel}>Live Module Gross Income</Text>
            <View style={[styles.kpiIconWrap, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
              <TrendingUp size={18} color="#10b981" />
            </View>
          </View>
          <Text style={styles.kpiValue}>৳ {calc.moduleGrossIncome.toLocaleString()}</Text>
          <View style={styles.kpiFooter}>
            <Text style={styles.kpiFormulaBadge}>10% Live Project Outlay</Text>
            <Text style={styles.kpiSub}>৳ {liveProjectExpense.toLocaleString()} total</Text>
          </View>
        </View>

        {/* KPI 2: Total Operational Expenses */}
        <View style={[styles.kpiCard, styles.kpiCardExpense]}>
          <View style={styles.kpiTop}>
            <Text style={styles.kpiLabel}>Operational Expenses</Text>
            <View style={[styles.kpiIconWrap, { backgroundColor: 'rgba(244, 63, 94, 0.15)' }]}>
              <Receipt size={18} color="#f43f5e" />
            </View>
          </View>
          <Text style={[styles.kpiValue, { color: '#fb7185' }]}>৳ {calc.totalOperationalExpenses.toLocaleString()}</Text>
          <View style={styles.kpiFooter}>
            <Text style={[styles.kpiFormulaBadge, { backgroundColor: 'rgba(244, 63, 94, 0.2)', color: '#fda4af' }]}>
              {expenses.length} Overhead Items
            </Text>
            <Text style={styles.kpiSub}>Guard, Engineer, Admin, Mtgs</Text>
          </View>
        </View>

        {/* KPI 3: Net Reserve Fund */}
        <View style={[styles.kpiCard, styles.kpiCardReserve]}>
          <View style={styles.kpiTop}>
            <Text style={styles.kpiLabel}>Net Reserve Fund</Text>
            <View style={[styles.kpiIconWrap, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
              <DollarSign size={18} color="#3b82f6" />
            </View>
          </View>
          <Text style={[styles.kpiValue, { color: '#60a5fa' }]}>৳ {calc.netReserveFund.toLocaleString()}</Text>
          <View style={styles.kpiFooter}>
            <Text style={[styles.kpiFormulaBadge, { backgroundColor: 'rgba(59, 130, 246, 0.2)', color: '#93c5fd' }]}>
              Gross Income - Overhead
            </Text>
            <Text style={styles.kpiSub}>Cumulative Surplus</Text>
          </View>
        </View>

        {/* KPI 4: Remaining Available Fund */}
        <View style={[styles.kpiCard, styles.kpiCardAvailable]}>
          <View style={styles.kpiTop}>
            <Text style={styles.kpiLabel}>Available for Distribution</Text>
            <View style={[styles.kpiIconWrap, { backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}>
              <Wallet size={18} color="#a855f7" />
            </View>
          </View>
          <Text style={[styles.kpiValue, { color: '#c084fc' }]}>৳ {calc.availableReserveFund.toLocaleString()}</Text>
          <View style={styles.kpiFooter}>
            <Text style={[styles.kpiFormulaBadge, { backgroundColor: 'rgba(168, 85, 247, 0.2)', color: '#d8b4fe' }]}>
              20%–70% Tranche Band
            </Text>
            <Text style={styles.kpiSub}>৳ {calc.totalDistributedToDate.toLocaleString()} paid to date</Text>
          </View>
        </View>
      </View>

      {/* Allocation Pools: 75% Founders Pool vs 25% Shareholders Pool */}
      <View style={styles.poolsGrid}>
        {/* Founders Pool (75%) */}
        <View style={styles.poolCard}>
          <View style={styles.poolHeader}>
            <View style={styles.poolTitleRow}>
              <Award size={20} color="#f59e0b" />
              <View>
                <Text style={styles.poolTitle}>Founders Pool (75%)</Text>
                <Text style={styles.poolSub}>Reserved for the 8 official Founders based on configurable ratios</Text>
              </View>
            </View>
            <Text style={styles.poolPctBadge}>75.00%</Text>
          </View>

          <View style={styles.poolStatsRow}>
            <View style={styles.poolStatBox}>
              <Text style={styles.poolStatLabel}>Total Cumulative Pool</Text>
              <Text style={styles.poolStatValue}>৳ {calc.foundersPoolTotal.toLocaleString()}</Text>
            </View>
            <View style={styles.poolStatBox}>
              <Text style={styles.poolStatLabel}>Distributed to Date</Text>
              <Text style={[styles.poolStatValue, { color: '#94a3b8' }]}>
                ৳ {calc.foundersDistributedToDate.toLocaleString()}
              </Text>
            </View>
            <View style={styles.poolStatBox}>
              <Text style={styles.poolStatLabel}>Currently Available</Text>
              <Text style={[styles.poolStatValue, { color: '#fbbf24' }]}>
                ৳ {calc.availableFoundersPool.toLocaleString()}
              </Text>
            </View>
          </View>
        </View>

        {/* Shareholders Pool (25%) */}
        <View style={styles.poolCard}>
          <View style={styles.poolHeader}>
            <View style={styles.poolTitleRow}>
              <Users size={20} color="#38bdf8" />
              <View>
                <Text style={styles.poolTitle}>Shareholders Pool (25%)</Text>
                <Text style={styles.poolSub}>
                  Distribution for Share Owners (PHSM-001 to PHSM-144, Selected by System Admin)
                </Text>
              </View>
            </View>
            <Text style={[styles.poolPctBadge, { backgroundColor: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.4)' }]}>
              25.00%
            </Text>
          </View>

          <View style={styles.poolStatsRow}>
            <View style={styles.poolStatBox}>
              <Text style={styles.poolStatLabel}>Total Cumulative Pool</Text>
              <Text style={styles.poolStatValue}>৳ {calc.shareholdersPoolTotal.toLocaleString()}</Text>
            </View>
            <View style={styles.poolStatBox}>
              <Text style={styles.poolStatLabel}>Distributed to Date</Text>
              <Text style={[styles.poolStatValue, { color: '#94a3b8' }]}>
                ৳ {calc.shareholdersDistributedToDate.toLocaleString()}
              </Text>
            </View>
            <View style={styles.poolStatBox}>
              <Text style={styles.poolStatLabel}>Currently Available</Text>
              <Text style={[styles.poolStatValue, { color: '#38bdf8' }]}>
                ৳ {calc.availableShareholdersPool.toLocaleString()}
              </Text>
            </View>
          </View>

          {isSystemAdmin && (
            <TouchableOpacity
              style={styles.manageShareholdersBtn}
              onPress={() => setShowShareholderModal(true)}
            >
              <Settings size={13} color="#38bdf8" />
              <Text style={styles.manageShareholdersBtnText}>
                Manage Selected Share Owners ({selectedShareholderIds.length} of {allMembers.length || 144} active)
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Navigation Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'OVERVIEW' && styles.tabBtnActive]}
          onPress={() => setActiveTab('OVERVIEW')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'OVERVIEW' && styles.tabBtnTextActive]}>
            ⚡ Tranche Distribution
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'EXPENSES' && styles.tabBtnActive]}
          onPress={() => setActiveTab('EXPENSES')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'EXPENSES' && styles.tabBtnTextActive]}>
            📋 Overhead Expenses ({expenses.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'RATIOS' && styles.tabBtnActive]}
          onPress={() => setActiveTab('RATIOS')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'RATIOS' && styles.tabBtnTextActive]}>
            ⚖️ 8 Founder Ratios (100%)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'HISTORY' && styles.tabBtnActive]}
          onPress={() => setActiveTab('HISTORY')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'HISTORY' && styles.tabBtnTextActive]}>
            📜 Audit History ({distributionHistory.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* ----------------- TAB 1: TRANCHE DISTRIBUTION TRIGGER ----------------- */}
      {activeTab === 'OVERVIEW' && (
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Execute Controlled Tranche Distribution</Text>
              <Text style={styles.sectionSubtitle}>
                Enforces the mandatory 20% to 70% distribution tranche band from currently Available Reserve Fund (৳ {calc.availableReserveFund.toLocaleString()})
              </Text>
            </View>
            <View style={styles.authorizedBadge}>
              <ShieldAlert size={14} color="#f59e0b" />
              <Text style={styles.authorizedBadgeText}>Admin Authorization Required</Text>
            </View>
          </View>

          {canAuthorizeDistribution ? (
            <View style={styles.triggerPanel}>
              {/* Tranche Percentage Selector */}
              <View style={styles.inputGroup}>
                <View style={styles.inputLabelRow}>
                  <Text style={styles.inputLabel}>Tranche Payout Percentage (20% – 70%)</Text>
                  <Text style={styles.percentageDisplay}>{installmentPct}%</Text>
                </View>

                {/* Preset Band Buttons */}
                <View style={styles.presetButtonsRow}>
                  {[20, 25, 33, 40, 50, 60, 70].map((preset) => (
                    <TouchableOpacity
                      key={preset}
                      style={[
                        styles.presetBtn,
                        installmentPct === preset && styles.presetBtnActive,
                      ]}
                      onPress={() => setInstallmentPct(preset)}
                    >
                      <Text
                        style={[
                          styles.presetBtnText,
                          installmentPct === preset && styles.presetBtnTextActive,
                        ]}
                      >
                        {preset}%
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TextInput
                  style={styles.textInput}
                  keyboardType="numeric"
                  value={String(installmentPct)}
                  onChangeText={(val) => {
                    const num = parseInt(val, 10);
                    if (!isNaN(num)) setInstallmentPct(num);
                    else if (val === '') setInstallmentPct(0);
                  }}
                  placeholder="Enter percentage (20 to 70)"
                  placeholderTextColor="#64748b"
                />
                {installmentPct < 20 || installmentPct > 70 ? (
                  <Text style={styles.errorText}>
                    ⚠️ Installment percentage must be within the allowable 20% to 70% band.
                  </Text>
                ) : (
                  <Text style={styles.helperText}>
                    Authorized band: Payout will draw exactly {installmentPct}% of the available ৳ {calc.availableReserveFund.toLocaleString()} reserve fund.
                  </Text>
                )}
              </View>

              {/* Remarks Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Distribution Authorization Remarks / Memo</Text>
                <TextInput
                  style={[styles.textInput, { height: 60 }]}
                  multiline
                  value={distributionRemarks}
                  onChangeText={setDistributionRemarks}
                  placeholder="e.g. Q1 Founders & Shareholders interim payout approved by Steering Committee resolution #2026/04"
                  placeholderTextColor="#64748b"
                />
              </View>

              {/* Live Preview of Payout Breakdown */}
              <View style={styles.previewBox}>
                <Text style={styles.previewTitle}>Live Tranche Payout Preview ({installmentPct}%)</Text>
                <View style={styles.previewStatsGrid}>
                  <View style={styles.previewStat}>
                    <Text style={styles.previewStatLabel}>Total Tranche Payout</Text>
                    <Text style={[styles.previewStatValue, { color: '#c084fc' }]}>
                      ৳ {previewPayout.total.toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.previewStat}>
                    <Text style={styles.previewStatLabel}>Founders Tranche (75%)</Text>
                    <Text style={[styles.previewStatValue, { color: '#fbbf24' }]}>
                      ৳ {previewPayout.founders.toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.previewStat}>
                    <Text style={styles.previewStatLabel}>Shareholders Tranche (25%)</Text>
                    <Text style={[styles.previewStatValue, { color: '#38bdf8' }]}>
                      ৳ {previewPayout.shareholders.toLocaleString()}
                    </Text>
                  </View>
                </View>

                {/* 8 Founders Individual Payout Table Preview */}
                <Text style={styles.previewFounderHeader}>8 Founders Tranche Breakdown (Equal to 100% of 75% Pool):</Text>
                <View style={styles.tableWrapper}>
                  <View style={styles.tableHeaderRow}>
                    <Text style={[styles.thText, { flex: 2 }]}>Founder Name & Designation</Text>
                    <Text style={[styles.thText, { flex: 1, textAlign: 'center' }]}>Assigned Ratio</Text>
                    <Text style={[styles.thText, { flex: 1.5, textAlign: 'right' }]}>Tranche Payout (৳)</Text>
                  </View>
                  {previewPayout.breakdown.map((f, idx) => (
                    <View key={f.founderId} style={[styles.tableDataRow, idx % 2 === 1 && styles.tableDataRowAlt]}>
                      <View style={{ flex: 2 }}>
                        <Text style={styles.founderNameText}>{f.founderName}</Text>
                        <Text style={styles.founderIdText}>{f.founderId} • {f.designation}</Text>
                      </View>
                      <Text style={[styles.tdText, { flex: 1, textAlign: 'center', color: '#fbbf24', fontWeight: 'bold' }]}>
                        {f.ratioPercentage.toFixed(2)}%
                      </Text>
                      <Text style={[styles.tdText, { flex: 1.5, textAlign: 'right', color: '#10b981', fontWeight: 'bold' }]}>
                        ৳ {f.amountBDT.toLocaleString()}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Action Button */}
                <TouchableOpacity
                  style={[
                    styles.executeTrancheBtn,
                    (installmentPct < 20 || installmentPct > 70 || calc.availableReserveFund <= 0 || isExecutingTranche) && styles.btnDisabled,
                  ]}
                  disabled={installmentPct < 20 || installmentPct > 70 || calc.availableReserveFund <= 0 || isExecutingTranche}
                  onPress={handleExecuteTranche}
                >
                  <Award size={18} color="#ffffff" />
                  <Text style={styles.executeTrancheBtnText}>
                    {isExecutingTranche ? 'Processing Tranche Distribution...' : `Authorize & Release ৳ ${previewPayout.total.toLocaleString()} (${installmentPct}% Tranche)`}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.restrictedNotice}>
              <ShieldAlert size={24} color="#f59e0b" />
              <Text style={styles.restrictedNoticeTitle}>Administrative Access Restriction</Text>
              <Text style={styles.restrictedNoticeText}>
                Distribution tranche execution is restricted exclusively to System Admin and Delegated Admin roles.
                You can review current available balances, recorded expenses, and historical distribution audits.
              </Text>
            </View>
          )}
        </View>
      )}

      {/* ----------------- TAB 2: OVERHEAD EXPENSES ----------------- */}
      {activeTab === 'EXPENSES' && (
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Operational Expense Ledgers</Text>
              <Text style={styles.sectionSubtitle}>
                Operational overhead deducted directly from Management Fee Gross Income prior to pool allocation
              </Text>
            </View>
            <TouchableOpacity
              style={styles.addExpenseBtn}
              onPress={() => setShowAddExpenseModal(true)}
            >
              <Plus size={14} color="#ffffff" />
              <Text style={styles.addExpenseBtnText}>Record Operational Cost</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Category Summary Bar */}
          <View style={styles.categorySummaryRow}>
            {(['GUARD_SALARY', 'ENGINEER_SALARY', 'MEETING_COST', 'OFFICE_ADMIN', 'MISCELLANEOUS_COST'] as OperationalExpenseCategory[]).map((cat) => {
              const catTotal = expenses
                .filter((e) => e.category === cat)
                .reduce((sum, e) => sum + e.amountBDT, 0);
              return (
                <View key={cat} style={styles.catSummaryBox}>
                  <Text style={styles.catSummaryLabel}>{CATEGORY_LABELS[cat].label}</Text>
                  <Text style={styles.catSummaryValue}>৳ {catTotal.toLocaleString()}</Text>
                </View>
              );
            })}
          </View>

          {/* Expenses Table */}
          <View style={styles.tableWrapper}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.thText, { flex: 1.2 }]}>Date & ID</Text>
              <Text style={[styles.thText, { flex: 1.5 }]}>Category</Text>
              <Text style={[styles.thText, { flex: 2 }]}>Expense Title & Details</Text>
              <Text style={[styles.thText, { flex: 1.2, textAlign: 'right' }]}>Amount (৳)</Text>
              <Text style={[styles.thText, { flex: 1, textAlign: 'center' }]}>Action</Text>
            </View>

            {expenses.map((exp, idx) => (
              <View key={exp.id} style={[styles.tableDataRow, idx % 2 === 1 && styles.tableDataRowAlt]}>
                <View style={{ flex: 1.2 }}>
                  <Text style={styles.tdText}>{exp.date}</Text>
                  <Text style={styles.idSubText}>{exp.id}</Text>
                </View>

                <View style={{ flex: 1.5 }}>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText}>{CATEGORY_LABELS[exp.category]?.label || exp.category}</Text>
                  </View>
                  {exp.voucherRef && (
                    <Text style={styles.voucherSubText}>Ref: {exp.voucherRef}</Text>
                  )}
                </View>

                <View style={{ flex: 2 }}>
                  <Text style={styles.expenseTitleText}>{exp.title}</Text>
                  {exp.notes && <Text style={styles.expenseNotesText}>{exp.notes}</Text>}
                  <Text style={styles.expenseAuthorText}>By: {exp.createdByName || exp.createdBy}</Text>
                </View>

                <Text style={[styles.tdText, { flex: 1.2, textAlign: 'right', color: '#fb7185', fontWeight: 'bold' }]}>
                  ৳ {exp.amountBDT.toLocaleString()}
                </Text>

                <View style={{ flex: 1, alignItems: 'center' }}>
                  <TouchableOpacity
                    style={styles.deleteExpenseBtn}
                    onPress={() => {
                      if (window.confirm(`Delete operational expense "${exp.title}" (৳ ${exp.amountBDT.toLocaleString()})?`)) {
                        deleteOperationalExpense(exp.id);
                        setSuccessBanner('Expense entry removed.');
                        setTimeout(() => setSuccessBanner(''), 3000);
                      }
                    }}
                  >
                    <Trash2 size={13} color="#f43f5e" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* ----------------- TAB 3: FOUNDER RATIOS ----------------- */}
      {activeTab === 'RATIOS' && (
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>8 Founders Payout Distribution Ratios</Text>
              <Text style={styles.sectionSubtitle}>
                Governs the percentage breakdown of the Founders Pool (75% of Net Reserve Fund). Sum must equal exactly 100.00%.
              </Text>
            </View>

            {isSystemAdmin && !isEditingRatios && (
              <TouchableOpacity
                style={styles.editRatiosBtn}
                onPress={() => setIsEditingRatios(true)}
              >
                <Settings size={14} color="#ffffff" />
                <Text style={styles.editRatiosBtnText}>Configure Ratios</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Validation Status Banner */}
          <View style={[styles.ratioValidationBar, isRatiosSumValid ? styles.ratioValid : styles.ratioInvalid]}>
            <View style={styles.ratioValLeft}>
              {isRatiosSumValid ? (
                <CheckCircle2 size={16} color="#10b981" />
              ) : (
                <AlertCircle size={16} color="#f43f5e" />
              )}
              <Text style={styles.ratioValText}>
                Total Assigned Ratio: <Text style={{ fontWeight: 'bold' }}>{editableRatiosSum.toFixed(4)}%</Text>
              </Text>
            </View>
            <Text style={[styles.ratioValStatus, { color: isRatiosSumValid ? '#10b981' : '#f43f5e' }]}>
              {isRatiosSumValid ? 'Valid 100.00% Integrity' : 'MUST EQUAL EXACTLY 100.00%'}
            </Text>
          </View>

          {ratioEditError ? (
            <View style={styles.errorBanner}>
              <AlertCircle size={16} color="#f43f5e" />
              <Text style={styles.errorBannerText}>{ratioEditError}</Text>
            </View>
          ) : null}

          {/* Founder Ratios Table */}
          <View style={styles.tableWrapper}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.thText, { flex: 0.6 }]}>#</Text>
              <Text style={[styles.thText, { flex: 2 }]}>Founder Legal Name</Text>
              <Text style={[styles.thText, { flex: 1.5 }]}>Designation</Text>
              <Text style={[styles.thText, { flex: 1.5, textAlign: 'center' }]}>Ratio Share (%)</Text>
              <Text style={[styles.thText, { flex: 1.5, textAlign: 'right' }]}>Projected 100% Payout (৳)</Text>
            </View>

            {editableRatios.map((f, idx) => {
              const projectedAmount = Math.round(calc.availableFoundersPool * (f.ratioPercentage / 100));
              return (
                <View key={f.founderId} style={[styles.tableDataRow, idx % 2 === 1 && styles.tableDataRowAlt]}>
                  <Text style={[styles.tdText, { flex: 0.6, color: '#94a3b8' }]}>{idx + 1}</Text>
                  <View style={{ flex: 2 }}>
                    <Text style={styles.founderNameText}>{f.founderName}</Text>
                    <Text style={styles.founderIdText}>{f.founderId}</Text>
                  </View>
                  <Text style={[styles.tdText, { flex: 1.5, color: '#94a3b8' }]}>{f.designation || 'Founding Director'}</Text>

                  <View style={{ flex: 1.5, alignItems: 'center' }}>
                    {isEditingRatios ? (
                      <TextInput
                        style={styles.ratioInput}
                        keyboardType="decimal-pad"
                        value={String(f.ratioPercentage)}
                        onChangeText={(v) => handleRatioChange(f.founderId, v)}
                      />
                    ) : (
                      <Text style={[styles.tdText, { color: '#fbbf24', fontWeight: 'bold' }]}>
                        {f.ratioPercentage.toFixed(5)}%
                      </Text>
                    )}
                  </View>

                  <Text style={[styles.tdText, { flex: 1.5, textAlign: 'right', color: '#10b981', fontWeight: 'bold' }]}>
                    ৳ {projectedAmount.toLocaleString()}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Edit Actions */}
          {isEditingRatios && (
            <View style={styles.ratioActionsRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setEditableRatios(founderRatios);
                  setIsEditingRatios(false);
                  setRatioEditError('');
                }}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.resetRatiosBtn}
                onPress={() => {
                  setEditableRatios([
                    { founderId: 'FND-001', founderName: 'SAIF AHMED SAKIL', ratioPercentage: 25.0, designation: 'Root Founder & Project Lead' },
                    { founderId: 'FND-002', founderName: 'M MASUD SAWDAGOR', ratioPercentage: 25.0, designation: 'Co-Founder & Managing Director' },
                    { founderId: 'FND-003', founderName: 'M OMAR FARUQUE MOLLA', ratioPercentage: 11.66667, designation: 'Founding Director' },
                    { founderId: 'FND-004', founderName: 'M SHAHIN AHMED', ratioPercentage: 11.66667, designation: 'Founding Director' },
                    { founderId: 'FND-005', founderName: 'ABUL HASHIM', ratioPercentage: 6.66667, designation: 'Founding Director' },
                    { founderId: 'FND-006', founderName: 'SIRAJUL ISLAM', ratioPercentage: 6.66667, designation: 'Founding Director' },
                    { founderId: 'FND-007', founderName: 'M ABU YOUSUF', ratioPercentage: 6.66667, designation: 'Founding Director' },
                    { founderId: 'FND-008', founderName: 'FAIZAN AHMED', ratioPercentage: 6.66667, designation: 'Founding Director' },
                  ]);
                }}
              >
                <Text style={styles.resetRatiosBtnText}>Reset to Default (25/25/11.6/6.6%)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveRatiosBtn, !isRatiosSumValid && styles.btnDisabled]}
                disabled={!isRatiosSumValid}
                onPress={handleSaveRatios}
              >
                <Text style={styles.saveRatiosBtnText}>Save Ratio Configuration</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* ----------------- TAB 4: DISTRIBUTION AUDIT HISTORY ----------------- */}
      {activeTab === 'HISTORY' && (
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Distribution Audit & Tranche History</Text>
              <Text style={styles.sectionSubtitle}>
                Immutable record of all historical tranche distributions, authorizer credentials, and recipient breakdowns
              </Text>
            </View>
          </View>

          {distributionHistory.length === 0 ? (
            <View style={styles.emptyState}>
              <Clock size={36} color="#64748b" />
              <Text style={styles.emptyStateTitle}>No Tranche Distributions Executed Yet</Text>
              <Text style={styles.emptyStateSub}>
                Authorized administrators can execute distributions within the 20% to 70% allowable band from the "Tranche Distribution" tab.
              </Text>
            </View>
          ) : (
            <View style={styles.tableWrapper}>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.thText, { flex: 1.2 }]}>Timestamp & ID</Text>
                <Text style={[styles.thText, { flex: 1.2 }]}>Authorized By</Text>
                <Text style={[styles.thText, { flex: 0.8, textAlign: 'center' }]}>Tranche %</Text>
                <Text style={[styles.thText, { flex: 1.2, textAlign: 'right' }]}>Total Paid (৳)</Text>
                <Text style={[styles.thText, { flex: 1.2, textAlign: 'right' }]}>Founders (75%)</Text>
                <Text style={[styles.thText, { flex: 1.2, textAlign: 'right' }]}>Shareholders (25%)</Text>
                <Text style={[styles.thText, { flex: 1, textAlign: 'center' }]}>Action</Text>
              </View>

              {distributionHistory.map((item, idx) => (
                <View key={item.id} style={[styles.tableDataRow, idx % 2 === 1 && styles.tableDataRowAlt]}>
                  <View style={{ flex: 1.2 }}>
                    <Text style={styles.tdText}>
                      {new Date(item.timestamp).toLocaleDateString()} {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                    <Text style={styles.idSubText}>{item.id}</Text>
                  </View>

                  <View style={{ flex: 1.2 }}>
                    <Text style={styles.tdText}>{item.authorizedByName}</Text>
                    <Text style={styles.idSubText}>{item.authorizedRole}</Text>
                  </View>

                  <View style={{ flex: 0.8, alignItems: 'center' }}>
                    <View style={styles.trancheBadge}>
                      <Text style={styles.trancheBadgeText}>{item.installmentPercentage}%</Text>
                    </View>
                  </View>

                  <Text style={[styles.tdText, { flex: 1.2, textAlign: 'right', color: '#c084fc', fontWeight: 'bold' }]}>
                    ৳ {item.payoutAmount.toLocaleString()}
                  </Text>

                  <Text style={[styles.tdText, { flex: 1.2, textAlign: 'right', color: '#fbbf24', fontWeight: 'bold' }]}>
                    ৳ {item.foundersPoolTotal.toLocaleString()}
                  </Text>

                  <Text style={[styles.tdText, { flex: 1.2, textAlign: 'right', color: '#38bdf8', fontWeight: 'bold' }]}>
                    ৳ {item.shareholdersPoolTotal.toLocaleString()}
                  </Text>

                  <View style={{ flex: 1, alignItems: 'center' }}>
                    <TouchableOpacity
                      style={styles.viewBreakdownBtn}
                      onPress={() => setSelectedHistoricalDist(item)}
                    >
                      <Text style={styles.viewBreakdownBtnText}>Breakdown</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* ----------------- MODAL: ADD OPERATIONAL EXPENSE ----------------- */}
      {showAddExpenseModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Record Operational Expense</Text>
              <TouchableOpacity onPress={() => setShowAddExpenseModal(false)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Category</Text>
                <View style={styles.categoryPickerRow}>
                  {(['GUARD_SALARY', 'ENGINEER_SALARY', 'MEETING_COST', 'OFFICE_ADMIN', 'MISCELLANEOUS_COST'] as OperationalExpenseCategory[]).map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.categoryOption, expCategory === cat && styles.categoryOptionActive]}
                      onPress={() => setExpCategory(cat)}
                    >
                      <Text style={[styles.categoryOptionText, expCategory === cat && styles.categoryOptionTextActive]}>
                        {CATEGORY_LABELS[cat].label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Expense Title / Description *</Text>
                <TextInput
                  style={styles.textInput}
                  value={expTitle}
                  onChangeText={setExpTitle}
                  placeholder="e.g. Monthly Site Security Guard Salary"
                  placeholderTextColor="#64748b"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Amount in BDT (৳) *</Text>
                <TextInput
                  style={styles.textInput}
                  keyboardType="numeric"
                  value={expAmount}
                  onChangeText={setExpAmount}
                  placeholder="e.g. 45000"
                  placeholderTextColor="#64748b"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Expense Date (YYYY-MM-DD)</Text>
                <TextInput
                  style={styles.textInput}
                  value={expDate}
                  onChangeText={setExpDate}
                  placeholder="2026-03-25"
                  placeholderTextColor="#64748b"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Voucher / Reference # (Optional)</Text>
                <TextInput
                  style={styles.textInput}
                  value={expVoucher}
                  onChangeText={setExpVoucher}
                  placeholder="e.g. VCH-SEC-2026-03"
                  placeholderTextColor="#64748b"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Additional Notes</Text>
                <TextInput
                  style={[styles.textInput, { height: 60 }]}
                  multiline
                  value={expNotes}
                  onChangeText={setExpNotes}
                  placeholder="Operational context or memo"
                  placeholderTextColor="#64748b"
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowAddExpenseModal(false)}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleAddExpenseSubmit}
              >
                <Text style={styles.modalSubmitBtnText}>Submit Expense</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* ----------------- MODAL: HISTORICAL TRANCHE BREAKDOWN ----------------- */}
      {selectedHistoricalDist && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Tranche Payout Breakdown</Text>
                <Text style={styles.modalSub}>{selectedHistoricalDist.id} • {selectedHistoricalDist.installmentPercentage}% Payout</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedHistoricalDist(null)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.historyMetaCard}>
                <View style={styles.historyMetaRow}>
                  <Text style={styles.historyMetaLabel}>Authorized By:</Text>
                  <Text style={styles.historyMetaVal}>{selectedHistoricalDist.authorizedByName} ({selectedHistoricalDist.authorizedRole})</Text>
                </View>
                <View style={styles.historyMetaRow}>
                  <Text style={styles.historyMetaLabel}>Date & Time:</Text>
                  <Text style={styles.historyMetaVal}>{new Date(selectedHistoricalDist.timestamp).toLocaleString()}</Text>
                </View>
                <View style={styles.historyMetaRow}>
                  <Text style={styles.historyMetaLabel}>Total Tranche Payout:</Text>
                  <Text style={[styles.historyMetaVal, { color: '#c084fc', fontWeight: 'bold' }]}>৳ {selectedHistoricalDist.payoutAmount.toLocaleString()}</Text>
                </View>
                <View style={styles.historyMetaRow}>
                  <Text style={styles.historyMetaLabel}>Remarks / Memo:</Text>
                  <Text style={styles.historyMetaVal}>{selectedHistoricalDist.remarks}</Text>
                </View>
              </View>

              <Text style={styles.historySectionHeading}>8 Founders Individual Receipts (75% Pool: ৳ {selectedHistoricalDist.foundersPoolTotal.toLocaleString()}):</Text>
              <View style={styles.tableWrapper}>
                <View style={styles.tableHeaderRow}>
                  <Text style={[styles.thText, { flex: 2 }]}>Founder Name</Text>
                  <Text style={[styles.thText, { flex: 1, textAlign: 'center' }]}>Ratio</Text>
                  <Text style={[styles.thText, { flex: 1.5, textAlign: 'right' }]}>Disbursed (৳)</Text>
                </View>
                {selectedHistoricalDist.founderBreakdown.map((f, i) => (
                  <View key={f.founderId} style={[styles.tableDataRow, i % 2 === 1 && styles.tableDataRowAlt]}>
                    <View style={{ flex: 2 }}>
                      <Text style={styles.founderNameText}>{f.founderName}</Text>
                      <Text style={styles.founderIdText}>{f.founderId}</Text>
                    </View>
                    <Text style={[styles.tdText, { flex: 1, textAlign: 'center', color: '#fbbf24' }]}>
                      {f.ratioPercentage.toFixed(2)}%
                    </Text>
                    <Text style={[styles.tdText, { flex: 1.5, textAlign: 'right', color: '#10b981', fontWeight: 'bold' }]}>
                      ৳ {f.amountBDT.toLocaleString()}
                    </Text>
                  </View>
                ))}
              </View>

              <Text style={[styles.historySectionHeading, { marginTop: 16 }]}>
                Shareholders Pool Allocation (25% Pool: ৳ {selectedHistoricalDist.shareholdersPoolTotal.toLocaleString()}):
              </Text>
              <View style={styles.historyShareholderBox}>
                <Text style={styles.historyShareholderText}>
                  Reserved for eligible share owners (PHSM-001 to PHSM-144). Total allocated: ৳ {selectedHistoricalDist.shareholdersPoolTotal.toLocaleString()}.
                </Text>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setSelectedHistoricalDist(null)}
              >
                <Text style={styles.modalCancelBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* ----------------- MODAL: SELECT SHAREHOLDERS FOR 25% POOL ----------------- */}
      {showShareholderModal && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { maxHeight: '85%' }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Manage Eligible Share Owners (25% Pool)</Text>
                <Text style={styles.modalSub}>
                  Select which of the 144 shareowners participate in the 25% Shareholders Distribution Pool
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowShareholderModal(false)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.shareholderBulkRow}>
                <TouchableOpacity
                  style={styles.shareholderSelectAllBtn}
                  onPress={() => {
                    setSelectedShareholderIds(allMembers.map((m) => m.id));
                  }}
                >
                  <Text style={styles.shareholderSelectAllText}>Select All 144 Members</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.shareholderClearBtn}
                  onPress={() => {
                    setSelectedShareholderIds([]);
                  }}
                >
                  <Text style={styles.shareholderClearText}>Clear All</Text>
                </TouchableOpacity>

                <Text style={styles.shareholderCountLabel}>
                  Selected: <Text style={{ color: '#38bdf8', fontWeight: 'bold' }}>{selectedShareholderIds.length}</Text> Members
                </Text>
              </View>

              <ScrollView style={{ maxHeight: 350 }}>
                <View style={styles.shareholderCheckGrid}>
                  {allMembers.slice(0, 144).map((m) => {
                    const isSelected = selectedShareholderIds.includes(m.id);
                    return (
                      <TouchableOpacity
                        key={m.id}
                        style={[styles.shareholderChip, isSelected && styles.shareholderChipSelected]}
                        onPress={() => {
                          if (isSelected) {
                            setSelectedShareholderIds(selectedShareholderIds.filter((id) => id !== m.id));
                          } else {
                            setSelectedShareholderIds([...selectedShareholderIds, m.id]);
                          }
                        }}
                      >
                        <Text style={[styles.shareholderChipId, isSelected && { color: '#38bdf8' }]}>{m.id}</Text>
                        <Text style={[styles.shareholderChipName, isSelected && { color: '#ffffff' }]} numberOfLines={1}>
                          {m.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={() => {
                  setShowShareholderModal(false);
                  setSuccessBanner(`Updated active shareholders pool: ${selectedShareholderIds.length} members selected.`);
                  setTimeout(() => setSuccessBanner(''), 3000);
                }}
              >
                <Text style={styles.modalSubmitBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#0f172a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  backBtnText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mainTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  liveEngineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  liveEngineText: {
    color: '#34d399',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  subTitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1e1b4b',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4338ca',
  },
  roleBadgeText: {
    color: '#c7d2fe',
    fontSize: 11,
    fontWeight: '600',
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0f172a',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  resetBtnText: {
    color: '#94a3b8',
    fontSize: 11,
  },
  liveSyncRibbon: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    backgroundColor: '#091528',
    borderWidth: 1,
    borderColor: '#1e3a5f',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 16,
  },
  liveSyncLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },
  liveSyncLabel: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },
  liveSyncValue: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: 'bold',
  },
  liveSyncFormula: {
    color: '#64748b',
    fontSize: 11,
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: '#10b981',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  successBannerText: {
    color: '#6ee7b7',
    fontSize: 12,
    flex: 1,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    borderWidth: 1,
    borderColor: '#f43f5e',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  errorBannerText: {
    color: '#fda4af',
    fontSize: 12,
    flex: 1,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  kpiCard: {
    flex: 1,
    minWidth: 220,
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  kpiCardIncome: {
    borderColor: '#065f46',
  },
  kpiCardExpense: {
    borderColor: '#881337',
  },
  kpiCardReserve: {
    borderColor: '#1e3a8a',
  },
  kpiCardAvailable: {
    borderColor: '#581c87',
  },
  kpiTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kpiLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  kpiIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#34d399',
    marginVertical: 8,
  },
  kpiFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  kpiFormulaBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    color: '#6ee7b7',
    fontSize: 9,
    fontWeight: 'bold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  kpiSub: {
    fontSize: 10,
    color: '#64748b',
  },
  poolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  poolCard: {
    flex: 1,
    minWidth: 300,
    backgroundColor: '#0b1329',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  poolHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  poolTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  poolTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  poolSub: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  poolPctBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    color: '#fbbf24',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    fontSize: 11,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  poolStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 6,
  },
  poolStatBox: {
    flex: 1,
    backgroundColor: '#050c1e',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  poolStatLabel: {
    fontSize: 10,
    color: '#64748b',
    marginBottom: 4,
  },
  poolStatValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  manageShareholdersBtn: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#0284c7',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  manageShareholdersBtnText: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '600',
  },
  tabsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    paddingBottom: 8,
  },
  tabBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  tabBtnActive: {
    backgroundColor: '#1e1b4b',
    borderColor: '#6366f1',
  },
  tabBtnText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  tabBtnTextActive: {
    color: '#c7d2fe',
  },
  sectionCard: {
    backgroundColor: '#0b1329',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  sectionSubtitle: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  authorizedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  authorizedBadgeText: {
    color: '#fbbf24',
    fontSize: 10,
    fontWeight: 'bold',
  },
  triggerPanel: {
    gap: 14,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 12,
    color: '#cbd5e1',
    fontWeight: '600',
  },
  percentageDisplay: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#c084fc',
  },
  presetButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  presetBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
  },
  presetBtnActive: {
    backgroundColor: '#6b21a8',
    borderColor: '#c084fc',
  },
  presetBtnText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },
  presetBtnTextActive: {
    color: '#ffffff',
  },
  textInput: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#ffffff',
    fontSize: 12,
  },
  helperText: {
    fontSize: 11,
    color: '#64748b',
  },
  errorText: {
    fontSize: 11,
    color: '#f43f5e',
    fontWeight: '600',
  },
  previewBox: {
    backgroundColor: '#050c1e',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginTop: 8,
  },
  previewTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#e2e8f0',
    marginBottom: 10,
  },
  previewStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  previewStat: {
    flex: 1,
    minWidth: 140,
    backgroundColor: '#0a1024',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  previewStatLabel: {
    fontSize: 10,
    color: '#64748b',
  },
  previewStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
  },
  previewFounderHeader: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
    marginBottom: 8,
  },
  tableWrapper: {
    backgroundColor: '#020617',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 14,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  thText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  tableDataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#0f172a',
  },
  tableDataRowAlt: {
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
  },
  tdText: {
    color: '#e2e8f0',
    fontSize: 11,
  },
  founderNameText: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '600',
  },
  founderIdText: {
    color: '#64748b',
    fontSize: 10,
    marginTop: 1,
  },
  executeTrancheBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#7c3aed',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  executeTrancheBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  btnDisabled: {
    opacity: 0.4,
  },
  restrictedNotice: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#050c1e',
    borderRadius: 10,
    gap: 8,
  },
  restrictedNoticeTitle: {
    color: '#fbbf24',
    fontSize: 14,
    fontWeight: 'bold',
  },
  restrictedNoticeText: {
    color: '#94a3b8',
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 480,
    lineHeight: 18,
  },
  addExpenseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  addExpenseBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  categorySummaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  catSummaryBox: {
    flex: 1,
    minWidth: 120,
    backgroundColor: '#050c1e',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  catSummaryLabel: {
    fontSize: 9,
    color: '#64748b',
  },
  catSummaryValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fb7185',
    marginTop: 2,
  },
  idSubText: {
    color: '#64748b',
    fontSize: 9,
    marginTop: 2,
  },
  categoryBadge: {
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.3)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  categoryBadgeText: {
    color: '#fda4af',
    fontSize: 10,
    fontWeight: '600',
  },
  voucherSubText: {
    color: '#64748b',
    fontSize: 9,
    marginTop: 2,
  },
  expenseTitleText: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '500',
  },
  expenseNotesText: {
    color: '#94a3b8',
    fontSize: 10,
    marginTop: 2,
  },
  expenseAuthorText: {
    color: '#475569',
    fontSize: 9,
    marginTop: 2,
  },
  deleteExpenseBtn: {
    padding: 6,
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    borderRadius: 6,
  },
  editRatiosBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2563eb',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  editRatiosBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  ratioValidationBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    marginBottom: 14,
    borderWidth: 1,
  },
  ratioValid: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10b981',
  },
  ratioInvalid: {
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    borderColor: '#f43f5e',
  },
  ratioValLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratioValText: {
    color: '#e2e8f0',
    fontSize: 12,
  },
  ratioValStatus: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  ratioInput: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#6366f1',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    color: '#fbbf24',
    fontSize: 12,
    fontWeight: 'bold',
    width: 80,
    textAlign: 'center',
  },
  ratioActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  cancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#1e293b',
    borderRadius: 8,
  },
  cancelBtnText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  resetRatiosBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#334155',
    borderRadius: 8,
  },
  resetRatiosBtnText: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '600',
  },
  saveRatiosBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#10b981',
    borderRadius: 8,
  },
  saveRatiosBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    gap: 8,
  },
  emptyStateTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#94a3b8',
  },
  emptyStateSub: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
    maxWidth: 420,
    lineHeight: 16,
  },
  trancheBadge: {
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.4)',
  },
  trancheBadgeText: {
    color: '#c084fc',
    fontSize: 11,
    fontWeight: 'bold',
  },
  viewBreakdownBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#1e1b4b',
    borderWidth: 1,
    borderColor: '#4f46e5',
    borderRadius: 6,
  },
  viewBreakdownBtnText: {
    color: '#c7d2fe',
    fontSize: 10,
    fontWeight: '600',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    zIndex: 9999,
  },
  modalBox: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
    width: '100%',
    maxWidth: 600,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#020617',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  modalSub: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  modalCloseText: {
    color: '#94a3b8',
    fontSize: 16,
    fontWeight: 'bold',
    padding: 4,
  },
  modalBody: {
    padding: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    padding: 14,
    backgroundColor: '#020617',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  modalCancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#1e293b',
    borderRadius: 8,
  },
  modalCancelBtnText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  modalSubmitBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#059669',
    borderRadius: 8,
  },
  modalSubmitBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  categoryPickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  categoryOption: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#334155',
  },
  categoryOptionActive: {
    backgroundColor: '#881337',
    borderColor: '#f43f5e',
  },
  categoryOptionText: {
    color: '#94a3b8',
    fontSize: 11,
  },
  categoryOptionTextActive: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  historyMetaCard: {
    backgroundColor: '#020617',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 14,
    gap: 6,
  },
  historyMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyMetaLabel: {
    fontSize: 11,
    color: '#64748b',
  },
  historyMetaVal: {
    fontSize: 11,
    color: '#e2e8f0',
  },
  historySectionHeading: {
    fontSize: 12,
    color: '#cbd5e1',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  historyShareholderBox: {
    backgroundColor: '#020617',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  historyShareholderText: {
    color: '#94a3b8',
    fontSize: 11,
    lineHeight: 16,
  },
  shareholderBulkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  shareholderSelectAllBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#0369a1',
    borderRadius: 6,
  },
  shareholderSelectAllText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
  },
  shareholderClearBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#1e293b',
    borderRadius: 6,
  },
  shareholderClearText: {
    color: '#94a3b8',
    fontSize: 11,
  },
  shareholderCountLabel: {
    color: '#94a3b8',
    fontSize: 11,
    marginLeft: 'auto',
  },
  shareholderCheckGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  shareholderChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1e293b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    width: 130,
  },
  shareholderChipSelected: {
    backgroundColor: '#0c4a6e',
    borderColor: '#38bdf8',
  },
  shareholderChipId: {
    fontSize: 10,
    color: '#64748b',
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
    fontWeight: 'bold',
  },
  shareholderChipName: {
    fontSize: 10,
    color: '#94a3b8',
    flex: 1,
  },
});
