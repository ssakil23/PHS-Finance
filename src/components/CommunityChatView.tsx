import React, { useState } from 'react';
import {
  MessageSquare,
  Send,
  ShieldAlert,
  Trash2,
  Filter,
  CheckCircle,
  Clock,
  User,
  Tag,
  AlertTriangle,
} from 'lucide-react';
import { ChatMessage, User as UserType } from '../types';
import { storageService } from '../services/storageService';

interface CommunityChatViewProps {
  currentUser: UserType | null;
}

const CATEGORIES: { key: ChatMessage['category']; label: string; bg: string }[] = [
  { key: 'GENERAL', label: 'General Society', bg: 'bg-slate-800 text-slate-200' },
  { key: 'FINANCE_QUERY', label: 'Finance & Deposit Query', bg: 'bg-emerald-950 text-emerald-300 border border-emerald-800' },
  { key: 'DEVELOPMENT_UPDATE', label: 'Site & Land Development', bg: 'bg-blue-950 text-blue-300 border border-blue-800' },
  { key: 'EC_NOTICE', label: 'Executive Committee Notice', bg: 'bg-amber-950 text-amber-300 border border-amber-800' },
];

export const CommunityChatView: React.FC<CommunityChatViewProps> = ({ currentUser }) => {
  const [messages, setMessages] = useState<ChatMessage[]>(storageService.getChatMessages());
  const [newText, setNewText] = useState('');
  const [category, setCategory] = useState<ChatMessage['category']>('GENERAL');
  const [activeFilter, setActiveFilter] = useState<string>('ALL');

  const canModerate =
    currentUser?.role === 'SYSTEM_ADMIN' ||
    currentUser?.role === 'DELEGATED_ADMIN' ||
    currentUser?.role === 'MANAGER';

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim() || !currentUser) return;

    storageService.addChatMessage(newText.trim(), category, currentUser);
    setMessages(storageService.getChatMessages());
    setNewText('');
  };

  const handleModerate = (id: string) => {
    if (!currentUser) return;
    if (window.confirm('Moderate/Remove this post from public view? (Action will be logged in audit trail)')) {
      storageService.moderateChatMessage(id, currentUser);
      setMessages(storageService.getChatMessages());
    }
  };

  const filteredMessages = messages.filter((m) => {
    if (activeFilter !== 'ALL' && m.category !== activeFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60">
                144 Member Forum
              </span>
              <span className="text-xs text-slate-400 font-mono">Society Central Discussion</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-emerald-400" />
              <span>Society Discussion & Community Board</span>
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Live communication channel for shareholders, directors, and operational management.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Filter Topic:</span>
            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Messages Feed */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 max-h-[550px] overflow-y-auto">
        {filteredMessages.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            No discussion posts in this category yet.
          </div>
        ) : (
          filteredMessages.map((msg) => {
            const isRemoved = msg.isRemovedByModerator;
            const categoryInfo = CATEGORIES.find((c) => c.key === msg.category) || CATEGORIES[0];
            const isOwn = msg.senderId === currentUser?.id;

            return (
              <div
                key={msg.id}
                className={`p-4 rounded-xl border transition ${
                  isRemoved
                    ? 'bg-rose-950/20 border-rose-900/40 text-slate-400'
                    : isOwn
                    ? 'bg-slate-800/80 border-slate-700'
                    : 'bg-slate-950/60 border-slate-800/80'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-white">{msg.senderName}</span>
                    {msg.senderMemberId && (
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-1.5 py-0.2 rounded border border-emerald-800">
                        {msg.senderMemberId}
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400 font-mono">
                      ({msg.senderRole})
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${categoryInfo.bg}`}>
                      {categoryInfo.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-slate-500">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>

                    {/* Moderation button */}
                    {canModerate && !isRemoved && (
                      <button
                        onClick={() => handleModerate(msg.id)}
                        title="Moderate post (Remove from public feed)"
                        className="text-slate-500 hover:text-rose-400 p-1 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {isRemoved ? (
                  <div className="text-xs text-rose-400 italic flex items-center gap-1.5 pt-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>[Post moderated and archived by {msg.moderatedBy || 'Administrator'}]</span>
                  </div>
                ) : (
                  <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {msg.message}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Input Message Form */}
      <form onSubmit={handleSendMessage} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Post Category:</span>
            <select
              value={category}
              onChange={(e: any) => setCategory(e.target.value)}
              className="px-2.5 py-1 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              {CATEGORIES.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div className="text-[11px] text-slate-400">
            Posting as: <strong className="text-emerald-400">{currentUser?.name}</strong> {currentUser?.memberId ? `(${currentUser?.memberId})` : ''}
          </div>
        </div>

        <div className="flex gap-2">
          <textarea
            rows={2}
            required
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="Type your question, development view, or society note..."
            className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
          <button
            type="submit"
            className="px-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow flex items-center justify-center gap-1.5 transition self-end h-10"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Publish</span>
          </button>
        </div>
      </form>
    </div>
  );
};
