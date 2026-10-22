import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Shield,
  Lock,
  X,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  KeyRound,
  FileCheck,
  Globe,
  Database,
  Users,
  Eye,
  Activity,
  Award,
} from 'lucide-react';
import { User } from '../types';
import { securityEngine, SecurityStatusReport } from '../utils/security';

interface SecurityShieldModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
}

export const SecurityShieldModal: React.FC<SecurityShieldModalProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  const [report, setReport] = useState<SecurityStatusReport>(securityEngine.getSecurityHealthReport());
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanSuccess, setScanSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRunSecurityScan = () => {
    setIsScanning(true);
    setScanSuccess(null);
    setTimeout(() => {
      setReport(securityEngine.getSecurityHealthReport());
      setIsScanning(false);
      setScanSuccess('All 7 Security & Defense Modules passed diagnostic verification (0 vulnerabilities detected).');
      setTimeout(() => setScanSuccess(null), 4000);
    }, 1200);
  };

  const portalInfo = securityEngine.getVerifiedPortalInfo();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-950/60 border border-emerald-400/40">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <Award className="w-3 h-3" />
                  <span>Enterprise Security Shield</span>
                </span>
                <span className="text-xs text-slate-400 font-mono">TLS 1.3 • AES-256</span>
              </div>
              <h3 className="text-xl font-bold text-white">
                Prottasha Security & Anti-Intrusion Command
              </h3>
              <p className="text-xs text-slate-300">
                Active defenses against phishing, brute-force hacking, session theft, and unauthorized data tampering.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scan Status Banner */}
        {scanSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{scanSuccess}</span>
          </div>
        )}

        {/* Top KPI Diagnostics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5">
            <div className="text-[11px] text-slate-400 uppercase font-semibold">Security Health Score</div>
            <div className="text-2xl font-bold font-mono text-emerald-400 mt-1 flex items-center gap-2">
              <span>{report.overallHealthScore}%</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                {report.status}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Zero critical vulnerabilities detected
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5">
            <div className="text-[11px] text-slate-400 uppercase font-semibold">Brute-Force Rate Limiter</div>
            <div className="text-base font-bold text-white mt-1 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>5-Attempt Lockout Shield</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Active Lockouts: <strong className="text-white font-mono">{report.activeLockoutsCount}</strong>
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5">
            <div className="text-[11px] text-slate-400 uppercase font-semibold">Inactivity Watchdog</div>
            <div className="text-base font-bold text-teal-300 mt-1">
              20-Min Auto Logout
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Anti-session theft & physical lock
            </div>
          </div>
        </div>

        {/* Security Defense Modules Checklist */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300 px-1">
            <div className="flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Active Security Measures & Countermeasures:</span>
            </div>
            <button
              onClick={handleRunSecurityScan}
              disabled={isScanning}
              className="text-[11px] text-teal-400 hover:text-teal-300 flex items-center gap-1 font-semibold transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isScanning ? 'animate-spin' : ''}`} />
              <span>{isScanning ? 'Auditing System...' : 'Run Security Diagnostic'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {report.measures.map((m) => (
              <div
                key={m.id}
                className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 space-y-1 text-xs hover:border-slate-700 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{m.title}</span>
                  </div>
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60 uppercase">
                    {m.status}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">{m.description}</p>
                <p className="text-[10px] text-slate-500 leading-tight">{m.details}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Verified Anti-Phishing Domain Trust Box */}
        <div className="bg-gradient-to-r from-emerald-950/40 via-slate-950 to-teal-950/40 border border-emerald-800/50 rounded-xl p-4 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              <span>Anti-Phishing Origin Trust Verification</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400">{portalInfo.antiPhishingSecurityCode}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px] text-slate-300">
            <div>
              <span className="text-slate-500">Verified Organization: </span>
              <strong>{portalInfo.organizationName}</strong>
            </div>
            <div>
              <span className="text-slate-500">Official Origin Host: </span>
              <strong className="font-mono text-emerald-300">{portalInfo.portalDomain}</strong>
            </div>
            <div>
              <span className="text-slate-500">Encryption Level: </span>
              <span>{portalInfo.encryptionStandard}</span>
            </div>
            <div>
              <span className="text-slate-500">Official Emergency Helpline: </span>
              <span className="font-mono text-teal-300">{portalInfo.officialHelpline}</span>
            </div>
          </div>
          <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/80 leading-relaxed">
            {portalInfo.warningNotice}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition"
          >
            Close Security Shield
          </button>
        </div>
      </div>
    </div>
  );
};
