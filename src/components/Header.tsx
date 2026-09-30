import React, { useState, useEffect, useRef } from 'react';
import {
  Building2,
  Wifi,
  WifiOff,
  UserCheck,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Layers,
  Menu,
  X,
  ChevronDown,
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  FileSpreadsheet,
  Users,
  MessageSquare,
  ShieldAlert,
  Vote,
  Cloud,
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
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const menuRef = useRef<HTMLDivElement | null>(null);

  // Auto-fold menu on click outside or Escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
        setMobileMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen]);

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

  // Navigation Items according to RBAC with Info & Communication placed after Member Ledger
  const navItems = isMember
    ? [
        { id: 'member_statement', label: 'My Financial Statement', desc: 'Personal share ledger & payment receipts' },
        { id: 'community_chat', label: 'Info & Communication', desc: 'Documents, Discussions, & Query Window' },
        { id: 'user_profile', label: 'User Profile', desc: 'Personal profile & security credentials' },
        { id: 'ec_voting', label: 'EC Election & Voting', desc: 'Executive committee voting & resolutions' },
      ]
    : [
        { id: 'dashboard', label: 'Executive Dashboard', desc: 'Central financial command & cash flow gap' },
        { id: 'incomes', label: 'Income & Deposits', desc: 'General & sales collection entries' },
        { id: 'expenses', label: 'Expense Ledger', desc: 'Site development expenses across Tiers 1-5' },
        { id: 'directors', label: 'Director Share Matrix', desc: '6 Directors share allocation & equity' },
        { id: 'member_statement', label: 'Member Ledger (144)', desc: '144 individual shareowner financial ledgers' },
        { id: 'community_chat', label: 'Info & Communication', desc: 'Documentations, Discussion Group & Query Window' },
        { id: 'user_profile', label: 'User Profiles & Approvals', desc: '144 shareholder registry & KYC verification' },
        { id: 'ec_voting', label: 'EC Governance & Votes', desc: 'Committee elections & policy ballots' },
        { id: 'audit_logs', label: 'Audit Logs', desc: 'Chronological immutable system audit trail' },
        { id: 'backup_sync', label: 'Backup & Cloud', desc: 'Real-time database sync & snapshot' },
      ];

  const currentNavItem = navItems.find((n) => n.id === activeTab) || navItems[0];

  const getNavIcon = (id: string) => {
    switch (id) {
      case 'dashboard':
        return LayoutDashboard;
      case 'incomes':
        return TrendingUp;
      case 'expenses':
        return TrendingDown;
      case 'directors':
        return FileSpreadsheet;
      case 'member_statement':
        return Users;
      case 'community_chat':
        return MessageSquare;
      case 'user_profile':
        return UserCheck;
      case 'ec_voting':
        return Vote;
      case 'audit_logs':
        return ShieldAlert;
      case 'backup_sync':
        return Cloud;
      default:
        return Layers;
    }
  };

  const handleSelectTab = (tabId: string) => {
    setActiveTab(tabId);
    setIsMenuOpen(false); // Auto-folds immediately upon selection!
    setMobileMenuOpen(false);
  };

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
          {/* Left-Top Corner: Auto-folding Menu & Brand Identity */}
          <div className="flex items-center gap-3">
            {/* Auto-folding Menu on Left-Top Corner */}
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-expanded={isMenuOpen}
                aria-label="Toggle navigation menu"
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 border select-none ${
                  isMenuOpen
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-950/60 ring-2 ring-emerald-400/30'
                    : 'bg-slate-800 hover:bg-slate-700/80 text-slate-200 border-slate-700 hover:border-slate-600 shadow-sm'
                }`}
                title="Auto-folding Navigation Menu (Auto-folds on selection or click outside)"
              >
                {isMenuOpen ? (
                  <X className="w-4 h-4 text-white" />
                ) : (
                  <Menu className="w-4 h-4 text-emerald-400" />
                )}
                <span className="font-semibold tracking-wide">Menu</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                    isMenuOpen ? 'rotate-180 text-white' : ''
                  }`}
                />
              </button>

              {/* Auto-folding Menu Dropdown Panel (Anchored to Left-Top Corner) */}
              {isMenuOpen && (
                <div
                  className="absolute left-0 top-full mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden divide-y divide-slate-800 animate-in fade-in slide-in-from-top-2 duration-150"
                  style={{ maxHeight: 'calc(100vh - 85px)', overflowY: 'auto' }}
                >
                  {/* Top Bar of Dropdown */}
                  <div className="p-3 bg-slate-950/90 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-emerald-600/30 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                        <Building2 className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-bold text-white tracking-wide">
                        Society System Modules
                      </span>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/40">
                      Auto-folding
                    </span>
                  </div>

                  {/* Nav Items List */}
                  <div className="p-2 space-y-1">
                    {navItems.map((item) => {
                      const Icon = getNavIcon(item.id);
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSelectTab(item.id)}
                          className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all ${
                            isActive
                              ? 'bg-emerald-600 text-white shadow font-semibold'
                              : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`p-2 rounded-lg shrink-0 ${
                                isActive
                                  ? 'bg-emerald-700/80 text-white'
                                  : 'bg-slate-800 text-emerald-400 border border-slate-700/60'
                              }`}
                            >
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="truncate">
                              <div className="text-xs font-semibold truncate flex items-center gap-1.5">
                                <span>{item.label}</span>
                                {item.id === 'community_chat' && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono">
                                    Docs & Chat
                                  </span>
                                )}
                              </div>
                              <div
                                className={`text-[10px] truncate ${
                                  isActive ? 'text-emerald-100' : 'text-slate-400'
                                }`}
                              >
                                {item.desc || 'Module workspace'}
                              </div>
                            </div>
                          </div>
                          {isActive && (
                            <span className="w-2 h-2 rounded-full bg-white shrink-0 shadow-sm ml-2" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Footer note in dropdown */}
                  <div className="px-3 py-2 bg-slate-950/80 text-[10px] text-slate-500 flex items-center justify-between">
                    <span>Selects tab & auto-folds immediately</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 font-mono text-[9px]">
                      ESC
                    </kbd>
                  </div>
                </div>
              )}
            </div>

            {/* Brand Identity */}
            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => setActiveTab(isMember ? 'member_statement' : 'dashboard')}
            >
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

            {/* Active Module Indicator */}
            <div className="hidden md:flex items-center gap-2 pl-3 border-l border-slate-800 text-xs">
              <span className="text-slate-500">Active:</span>
              <span className="font-semibold text-emerald-300 bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-800/40 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>{currentNavItem.label}</span>
              </span>
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
