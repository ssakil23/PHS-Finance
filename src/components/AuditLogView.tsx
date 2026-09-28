import React, { useState } from 'react';
import {
  FileText,
  Search,
  Filter,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  Clock,
  User,
  Activity,
  Download,
} from 'lucide-react';
import { AuditLog } from '../types';
import { storageService } from '../services/storageService';

export const AuditLogView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>(storageService.getAuditLogs());
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  const filteredLogs = logs.filter((log) => {
    if (actionFilter !== 'ALL' && log.action !== actionFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchUser = log.userName.toLowerCase().includes(q);
      const matchDetails = log.details.toLowerCase().includes(q);
      const matchEntity = log.entity.toLowerCase().includes(q);
      const matchEntityId = log.entityId.toLowerCase().includes(q);
      return matchUser || matchDetails || matchEntity || matchEntityId;
    }
    return true;
  });

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'APPROVE':
        return 'bg-emerald-950 text-emerald-300 border-emerald-800';
      case 'REJECT':
      case 'HARD_DELETE':
        return 'bg-rose-950 text-rose-300 border-rose-800';
      case 'SOFT_DELETE':
        return 'bg-amber-950 text-amber-300 border-amber-800';
      case 'CREATE':
        return 'bg-blue-950 text-blue-300 border-blue-800';
      case 'UPDATE':
      case 'HONORARIUM_UPDATE':
        return 'bg-indigo-950 text-indigo-300 border-indigo-800';
      case 'EXPORT_BACKUP':
      case 'RESTORE_BACKUP':
        return 'bg-purple-950 text-purple-300 border-purple-800';
      case 'EC_VOTE':
        return 'bg-teal-950 text-teal-300 border-teal-800';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const handleExportLogs = () => {
    const headers = ['Log ID', 'Timestamp', 'User', 'Role', 'Action', 'Entity', 'Entity ID', 'Details'];
    const rows = filteredLogs.map((l) => [
      l.id,
      l.timestamp,
      `"${l.userName}"`,
      l.userRole,
      l.action,
      l.entity,
      l.entityId,
      `"${l.details.replace(/"/g, '""')}"`,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `PHS_Audit_Trail_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            <span>Automated Audit Logs & Activity Trail</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Immutable, time-stamped logs of all transaction submissions, approvals, soft-deletes, and elections.
          </p>
        </div>

        <button
          onClick={handleExportLogs}
          className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5 text-emerald-400" />
          <span>Export Audit Trail CSV</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-400">Action:</span>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Actions</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="APPROVE">APPROVE</option>
            <option value="REJECT">REJECT</option>
            <option value="SOFT_DELETE">SOFT_DELETE</option>
            <option value="HARD_DELETE">HARD_DELETE</option>
            <option value="EC_VOTE">EC_VOTE</option>
            <option value="HONORARIUM_UPDATE">HONORARIUM_UPDATE</option>
            <option value="EXPORT_BACKUP">EXPORT_BACKUP</option>
            <option value="RESTORE_BACKUP">RESTORE_BACKUP</option>
            <option value="LOGIN">LOGIN</option>
          </select>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by user, entity ID, memo..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase text-[11px]">
              <tr>
                <th className="py-3 px-4">Log ID</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Actor / User</th>
                <th className="py-3 px-3 text-center">Action</th>
                <th className="py-3 px-4">Target Entity</th>
                <th className="py-3 px-6">Event Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 text-xs">
                    No audit records found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-400">
                      {log.id}
                    </td>

                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-200">{log.userName}</div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {log.userRole}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getActionBadge(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-300">
                      <div>{log.entity}</div>
                      <span className="text-[10px] text-emerald-400 font-semibold">
                        {log.entityId}
                      </span>
                    </td>

                    <td className="py-3 px-6 text-slate-300 leading-relaxed max-w-md">
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot className="bg-slate-950 text-slate-400 border-t border-slate-800 text-xs">
              <tr>
                <td colSpan={6} className="py-3 px-4 text-right">
                  {filteredLogs.length} total event logs displayed
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
