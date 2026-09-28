import React, { useState, useEffect } from 'react';
import {
  Building2,
  Wifi,
  WifiOff,
  UserCheck,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Layers,
} from 'lucide-react';
import { User } from '../types';
import { authService } from '../services/authService';
import { storageService } from '../services/storageService';

interface HeaderProps {
  currentUser: User | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  activeTab,
  setActiveTab,
}) => {
  const [isOnline, setIsOnline] = useState<boolean>(storageService.getOnlineStatus());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSync, setLastSync] = useState<string>(storageService.getLastSyncTime());
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = storageService.subscribe(() => {
      setIsOnline(storageService.getOnlineStatus());
      setLastSync(storageService.getLastSyncTime());
    });
    return () => unsubscribe();
  }, []);

  const handleManualSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      storageService.updateLastSyncTime();
      setIsSyncing(false);
    }, 600);
  };

  const isMember = currentUser?.role === 'MEMBER';

  // Navigation Items according to RBAC
  const navItems = isMember
    ? [
        { id: 'member_statement', label: 'My Financial Statement' },
        { id: 'user_profile', label: 'User Profile' },
        { id: 'ec_voting', label: 'EC Election & Voting' },
        { id: 'community_chat', label: 'Society Forum' },
      ]
    : [
        { id: 'dashboard', label: 'Executive Dashboard' },
        { id: 'incomes', label: 'Income & Deposits' },
        { id: 'expenses', label: 'Expense Ledger' },
        { id: 'directors', label: 'Director Share Matrix' },
        { id: 'member_statement', label: 'Member Ledger (144)' },
        { id: 'user_profile', label: 'User Profiles & Approvals' },
        { id: 'ec_voting', label: 'EC Governance & Votes' },
        { id: 'community_chat', label: 'Discussion Board' },
        { id: 'audit_logs', label: 'Audit Logs' },
        { id: 'backup_sync', label: 'Backup & Cloud' },
      ];

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'SYSTEM_ADMIN':
        return { label: 'Root Admin', bg: 'bg-emerald-950/80 text-emerald-300 border-emerald-700/50' };
      case 'DELEGATED_ADMIN':
        return { label: 'Director / Del. Admin', bg: 'bg-blue-950/80 text-blue-300 border-blue-700/50' };
      case 'MANAGER':
        return { label: 'Manager Accounts', bg: 'bg-amber-950/80 text-amber-300 border-amber-700/50' };
      case 'MEMBER':
        return { label: 'Share Owner', bg: 'bg-indigo-950/80 text-indigo-300 border-indigo-700/50' };
      default:
        return { label: 'Guest', bg: 'bg-slate-800 text-slate-300 border-slate-700' };
    }
  };

  const badge = getRoleBadge(currentUser?.role);

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-slate-100 shadow-md">
      {/* Top Banner / Status Strip */}
      <div className="bg-slate-950/80 px-4 py-1.5 border-b border-slate-800/60 text-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-slate-400">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-medium text-slate-200">Prottasha Housing Society Ltd.</span>
          <span className="hidden sm:inline text-slate-600">|</span>
          <span className="hidden sm:inline text-slate-400">144 Allocated Share Registry & Central Accounts</span>
        </div>

        <div className="flex items-center gap-4">
          {/* Online/Offline status */}
          <div className="flex items-center gap-1.5">
            {isOnline ? (
              <span className="inline-flex items-center gap-1 text-emerald-400 text-[11px] font-medium">
                <Wifi className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Online (Sync Active)</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-amber-400 text-[11px] font-medium">
                <WifiOff className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Offline (Cached Mode)</span>
              </span>
            )}
            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              title="Trigger central database sync"
              className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded transition-colors"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
          </div>

          <div className="hidden lg:flex items-center gap-2 text-[11px] text-slate-400">
            <span>Currency: <strong className="text-emerald-400 font-mono">BDT (৳)</strong></span>
          </div>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Identity */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab(isMember ? 'member_statement' : 'dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-900/30 border border-emerald-400/20">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                  <span>PHS-Finance</span>
                </h1>
                <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  v1.0 SRSS
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Prottasha Housing Society Financial & Director Ledger
              </p>
            </div>
          </div>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-3">
            {currentUser && (
              <div className="flex items-center gap-2.5 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/80">
                <button
                  onClick={() => setActiveTab('user_profile')}
                  title="View & Edit User Profile"
                  className="flex items-center gap-2.5 text-left hover:opacity-90 transition"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600 flex items-center justify-center text-xs font-bold text-emerald-300">
                    {currentUser.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="text-left hidden md:block">
                    <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                      <span>{currentUser.name}</span>
                      {currentUser.memberId && (
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-1 rounded">
                          {currentUser.memberId}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`text-[10px] font-medium px-1.5 py-0.2 rounded border ${badge.bg}`}>
                        {badge.label}
                      </span>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => authService.logout()}
                  title="Sign out"
                  className="ml-1 p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-700/60 rounded transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
            >
              <Layers className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <nav className="hidden lg:block border-t border-slate-800 bg-slate-900/90 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-1 overflow-x-auto py-2 scrollbar-thin">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`px-3.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all duration-150 ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-800 bg-slate-950 p-4 space-y-1 shadow-2xl">
          <div className="pb-2 mb-2 border-b border-slate-800 flex justify-between items-center text-xs text-slate-400">
            <span>Navigation Menu</span>
            <span className="text-emerald-400 font-mono">144 Shares Portal</span>
          </div>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === item.id
                  ? 'bg-emerald-600 text-white font-semibold'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
};
