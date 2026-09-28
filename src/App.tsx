/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, IncomeEntry, ExpenseEntry, Member } from './types';
import { authService } from './services/authService';
import { storageService } from './services/storageService';
import { Header } from './components/Header';
import { LoginScreen } from './components/LoginScreen';
import { ExecutiveDashboard } from './components/ExecutiveDashboard';
import { IncomeModule } from './components/IncomeModule';
import { ExpenseModule } from './components/ExpenseModule';
import { DirectorSummaryView } from './components/DirectorSummaryView';
import { MemberStatementView } from './components/MemberStatementView';
import { ECGovernanceView } from './components/ECGovernanceView';
import { CommunityChatView } from './components/CommunityChatView';
import { AuditLogView } from './components/AuditLogView';
import { BackupSyncView } from './components/BackupSyncView';
import { UserProfileView } from './components/UserProfileView';
import { PrintStatementModal } from './components/PrintStatementModal';
import { MemberFinancialSummary } from './utils/calculations';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(authService.getCurrentUser());
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Core Data State
  const [incomes, setIncomes] = useState<IncomeEntry[]>(storageService.getIncomes());
  const [expenses, setExpenses] = useState<ExpenseEntry[]>(storageService.getExpenses());
  const [members, setMembers] = useState<Member[]>(storageService.getMembers());

  // Print Modal State
  const [printModalOpen, setPrintModalOpen] = useState<boolean>(false);
  const [printType, setPrintType] = useState<'MEMBER_STATEMENT' | 'INCOME_VOUCHER' | 'EXPENSE_VOUCHER'>('MEMBER_STATEMENT');
  const [printMemberSummary, setPrintMemberSummary] = useState<MemberFinancialSummary | undefined>();
  const [printMemberDeposits, setPrintMemberDeposits] = useState<IncomeEntry[]>([]);
  const [printIncomeEntry, setPrintIncomeEntry] = useState<IncomeEntry | undefined>();
  const [printExpenseEntry, setPrintExpenseEntry] = useState<ExpenseEntry | undefined>();

  // Track initial member drilldown when navigating from Director matrix
  const [drilldownMemberId, setDrilldownMemberId] = useState<string | undefined>();

  useEffect(() => {
    const unsubAuth = authService.subscribe((user) => {
      setCurrentUser(user);
      if (user?.role === 'MEMBER') {
        setActiveTab((prev) => 
          prev === 'user_profile' || prev === 'ec_voting' || prev === 'community_chat' ? prev : 'member_statement'
        );
      } else {
        // If coming from member to admin, default to dashboard if on isolated view
        setActiveTab((prev) => (prev === 'member_statement' && !drilldownMemberId ? 'dashboard' : prev));
      }
    });

    const unsubStorage = storageService.subscribe(() => {
      setIncomes(storageService.getIncomes());
      setExpenses(storageService.getExpenses());
      setMembers(storageService.getMembers());
    });

    return () => {
      unsubAuth();
      unsubStorage();
    };
  }, [drilldownMemberId]);

  // Handler for Member drilldown from Director view
  const handleSelectMemberStatement = (memberId: string) => {
    setDrilldownMemberId(memberId);
    setActiveTab('member_statement');
  };

  // Handler for printing member statement
  const handlePrintMemberStatement = (summary: MemberFinancialSummary, deposits: IncomeEntry[]) => {
    setPrintType('MEMBER_STATEMENT');
    setPrintMemberSummary(summary);
    setPrintMemberDeposits(deposits);
    setPrintModalOpen(true);
  };

  // Handler for printing income deposit voucher
  const handlePrintIncomeVoucher = (entry: IncomeEntry) => {
    setPrintType('INCOME_VOUCHER');
    setPrintIncomeEntry(entry);
    setPrintModalOpen(true);
  };

  // Handler for printing expense voucher
  const handlePrintExpenseVoucher = (entry: ExpenseEntry) => {
    setPrintType('EXPENSE_VOUCHER');
    setPrintExpenseEntry(entry);
    setPrintModalOpen(true);
  };

  if (!currentUser) {
    return <LoginScreen />;
  }

  const isMember = currentUser.role === 'MEMBER';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Application Header */}
      <Header
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Render Tab based on RBAC */}
        {activeTab === 'dashboard' && !isMember && (
          <ExecutiveDashboard
            incomes={incomes}
            expenses={expenses}
            currentUser={currentUser}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'incomes' && !isMember && (
          <IncomeModule
            incomes={incomes}
            currentUser={currentUser}
            onPrintVoucher={handlePrintIncomeVoucher}
          />
        )}

        {activeTab === 'expenses' && !isMember && (
          <ExpenseModule
            expenses={expenses}
            currentUser={currentUser}
            onPrintVoucher={handlePrintExpenseVoucher}
          />
        )}

        {activeTab === 'directors' && !isMember && (
          <DirectorSummaryView
            incomes={incomes}
            expenses={expenses}
            members={members}
            onSelectMemberStatement={handleSelectMemberStatement}
          />
        )}

        {activeTab === 'member_statement' && (
          <MemberStatementView
            incomes={incomes}
            expenses={expenses}
            members={members}
            currentUser={currentUser}
            initialMemberId={drilldownMemberId}
            onPrintStatement={handlePrintMemberStatement}
          />
        )}

        {activeTab === 'user_profile' && (
          <UserProfileView
            currentUser={currentUser}
            members={members}
          />
        )}

        {activeTab === 'ec_voting' && (
          <ECGovernanceView
            currentUser={currentUser}
            members={members}
          />
        )}

        {activeTab === 'community_chat' && (
          <CommunityChatView
            currentUser={currentUser}
          />
        )}

        {activeTab === 'audit_logs' && !isMember && (
          <AuditLogView />
        )}

        {activeTab === 'backup_sync' && !isMember && (
          <BackupSyncView
            currentUser={currentUser}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 py-6 text-xs text-slate-500 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">PHS-Finance</span>
            <span>•</span>
            <span>Prottasha Housing Society Ltd. (144 Shares Capital Structure)</span>
          </div>

          <div className="text-center md:text-right">
            <div>
              System Admin: <strong className="text-slate-300">SAIF AHMED SAKIL</strong> (Applied Statistics, ISRT, DU | +8801611447765 | saif049@gmail.com)
            </div>
            <div className="text-[11px] text-slate-600 mt-0.5">
              Currency: Bangladeshi Taka (BDT / ৳) • Offline-First Real-time Sync Engine
            </div>
          </div>
        </div>
      </footer>

      {/* Print Statement & Voucher Modal */}
      <PrintStatementModal
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        type={printType}
        memberSummary={printMemberSummary}
        memberDeposits={printMemberDeposits}
        incomeEntry={printIncomeEntry}
        expenseEntry={printExpenseEntry}
      />
    </div>
  );
}
