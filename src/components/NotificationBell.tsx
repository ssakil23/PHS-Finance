import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  CheckCircle2,
  TrendingUp,
  FileText,
  AlertCircle,
  ShieldAlert,
  UserCheck,
  CheckCheck,
  Trash2,
  ExternalLink,
  Clock,
  Sparkles,
} from 'lucide-react';
import { User, MemberNotification, NotificationType } from '../types';
import { storageService } from '../services/storageService';

interface NotificationBellProps {
  currentUser: User | null;
  onNavigateTab: (tab: string) => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  currentUser,
  onNavigateTab,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'UNREAD' | 'DEPOSITS' | 'STATEMENTS'>('ALL');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Determine target member ID for filtering
  const targetMemberId = currentUser?.memberId || (currentUser?.role === 'MEMBER' ? currentUser.username : undefined);

  // State of notifications
  const [notifications, setNotifications] = useState<MemberNotification[]>(() =>
    storageService.getNotifications(targetMemberId)
  );

  // Subscribe to real-time storage updates
  useEffect(() => {
    const unsub = storageService.subscribe(() => {
      setNotifications(storageService.getNotifications(targetMemberId));
    });
    return unsub;
  }, [targetMemberId]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'UNREAD') return !n.isRead;
    if (filter === 'DEPOSITS') {
      return (
        n.type === 'DEPOSIT_APPROVED' ||
        n.type === 'DEPOSIT_RECORDED' ||
        n.type === 'DEPOSIT_REJECTED'
      );
    }
    if (filter === 'STATEMENTS') return n.type === 'STATEMENT_UPDATED';
    return true;
  });

  const handleMarkAllRead = () => {
    storageService.markAllNotificationsAsRead(targetMemberId);
    setNotifications(storageService.getNotifications(targetMemberId));
  };

  const handleNotificationClick = (notif: MemberNotification) => {
    if (!notif.isRead) {
      storageService.markNotificationAsRead(notif.id);
      setNotifications(storageService.getNotifications(targetMemberId));
    }
    if (notif.linkTab) {
      onNavigateTab(notif.linkTab);
      setIsOpen(false);
    }
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'DEPOSIT_APPROVED':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'DEPOSIT_RECORDED':
        return <TrendingUp className="w-4 h-4 text-teal-400" />;
      case 'DEPOSIT_REJECTED':
        return <AlertCircle className="w-4 h-4 text-rose-400" />;
      case 'STATEMENT_UPDATED':
        return <FileText className="w-4 h-4 text-cyan-400" />;
      case 'PROFILE_UPDATED':
        return <UserCheck className="w-4 h-4 text-indigo-400" />;
      case 'SYSTEM_ALERT':
      default:
        return <ShieldAlert className="w-4 h-4 text-amber-400" />;
    }
  };

  const formatRelativeTime = (isoString: string): string => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHours = Math.floor(diffMin / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffSec < 60) return 'Just now';
      if (diffMin < 60) return `${diffMin}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      return `${diffDays}d ago`;
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title="In-App Financial Alerts & Notifications"
        className="relative p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 text-slate-300 hover:text-white transition shadow flex items-center justify-center cursor-pointer"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-slate-950 shadow-md animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown Drawer */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150 backdrop-blur-md">
          {/* Header */}
          <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white tracking-tight flex items-center gap-1.5">
                  <span>Financial Alerts & Ledger Updates</span>
                </h4>
                <p className="text-[10px] text-slate-400">
                  {unreadCount > 0 ? `${unreadCount} unread automated notification(s)` : 'All caught up'}
                </p>
              </div>
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 transition"
                title="Mark all notifications as read"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark read</span>
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="px-3 py-2 bg-slate-950/40 border-b border-slate-800 flex items-center gap-1.5 text-xs overflow-x-auto">
            {(['ALL', 'UNREAD', 'DEPOSITS', 'STATEMENTS'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setFilter(mode)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition shrink-0 ${
                  filter === mode
                    ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {mode === 'ALL' && 'All'}
                {mode === 'UNREAD' && `Unread (${unreadCount})`}
                {mode === 'DEPOSITS' && 'Deposits'}
                {mode === 'STATEMENTS' && 'Statements'}
              </button>
            ))}
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-slate-800/80 flex items-center justify-center text-slate-500 mx-auto">
                  <Bell className="w-5 h-5" />
                </div>
                <p className="text-xs text-slate-400 font-medium">No alerts found</p>
                <p className="text-[11px] text-slate-500">
                  You will receive real-time alerts whenever a deposit is recorded or statements update.
                </p>
              </div>
            ) : (
              filteredNotifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-3.5 hover:bg-slate-800/60 transition cursor-pointer flex items-start gap-3 relative group ${
                    !notif.isRead ? 'bg-slate-950/40' : ''
                  }`}
                >
                  {/* Unread indicator bar */}
                  {!notif.isRead && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500" />
                  )}

                  <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 shrink-0 mt-0.5">
                    {getNotificationIcon(notif.type)}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-white truncate">
                        {notif.title}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono shrink-0 flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        <span>{formatRelativeTime(notif.createdAt)}</span>
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                      {notif.message}
                    </p>

                    <div className="flex items-center justify-between pt-0.5">
                      {notif.amountBDT && (
                        <span className="text-[11px] font-mono font-bold text-emerald-400">
                          ৳ {notif.amountBDT.toLocaleString()}
                        </span>
                      )}
                      {notif.linkTab && (
                        <span className="text-[10px] text-indigo-400 group-hover:text-indigo-300 font-semibold flex items-center gap-1 ml-auto">
                          <span>View Details</span>
                          <ExternalLink className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-slate-950 text-center border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500 px-4">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>Real-Time Society Ledger Dispatch</span>
            </span>
            <span>Target: {targetMemberId || 'All Accounts'}</span>
          </div>
        </div>
      )}
    </div>
  );
};
