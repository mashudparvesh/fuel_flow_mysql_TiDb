import React, { useState, useEffect } from 'react';
import {
  Database,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Download,
  ExternalLink,
  ShieldCheck,
  Server,
  CloudLightning,
  Copy,
  Check,
  HelpCircle,
  Table,
  Zap,
  HardDrive
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface DatabaseStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface DBStatusData {
  success: boolean;
  configured: boolean;
  connected: boolean;
  provider: string;
  host?: string;
  port?: number;
  database?: string;
  pingMs?: number;
  tableCounts?: Record<string, number>;
  error?: string | null;
  lastChecked: string;
}

export const DatabaseStatusModal: React.FC<DatabaseStatusModalProps> = ({ isOpen, onClose }) => {
  const {
    allTenants,
    allUsers,
    vehicles,
    fuelEntries,
    pumps,
    payments
  } = useApp();

  const [status, setStatus] = useState<DBStatusData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedEnv, setCopiedEnv] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [activeTab, setActiveTab] = useState<'status' | 'free_guide' | 'schema'>('status');

  const fetchStatus = async (forceRetry: boolean = false) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/database/status${forceRetry ? '?retry=true' : ''}`);
      const data = await res.json();
      setStatus(data);
    } catch (err: any) {
      setStatus({
        success: false,
        configured: false,
        connected: false,
        provider: 'Connection Error',
        error: err?.message || 'Could not reach server',
        lastChecked: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus(false);
      setSyncResult(null);
    }
  }, [isOpen]);

  const handleSyncToMySQL = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    try {
      const payload = {
        tenants: allTenants,
        users: allUsers,
        vehicles,
        fuelEntries,
        pumps,
        payments
      };

      const res = await fetch('/api/database/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (result.success) {
        setSyncResult({
          success: true,
          message: `Successfully synchronized ${Object.values(result.synced || {}).reduce((a: any, b: any) => a + b, 0)} records to MySQL!`
        });
        await fetchStatus();
      } else {
        setSyncResult({
          success: false,
          message: result.error || 'Sync failed. Ensure MySQL credentials are set and database is accessible.'
        });
      }
    } catch (err: any) {
      setSyncResult({
        success: false,
        message: err?.message || 'Network error during sync'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDownloadSchema = () => {
    window.open('/api/database/schema-sql', '_blank');
  };

  const copyEnvSample = () => {
    const envText = `# MySQL Connection Settings (TiDB Cloud fuelflow cluster)
MYSQL_HOST=gateway01.ap-southeast-1.prod.aws.tidbcloud.com
MYSQL_PORT=4000
MYSQL_USER=3vs45pD8HohQ35M.root
MYSQL_PASSWORD=FaiamIkyLcN3kABc
MYSQL_DATABASE=test
MYSQL_SSL=true`;
    navigator.clipboard.writeText(envText);
    setCopiedEnv(true);
    setTimeout(() => setCopiedEnv(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-[#0d162f] border border-slate-200 dark:border-blue-900/60 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-blue-900/50 bg-slate-50 dark:bg-[#091024]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  MySQL Database & Cloud Sync
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  v7 MySQL Engine
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                MySQL 5.7+ / 8.0+ / TiDB Cloud Serverless / phpMyAdmin Integration
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-blue-900/40 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-200 dark:border-blue-900/40 bg-white dark:bg-[#0d162f]">
          <button
            onClick={() => setActiveTab('status')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'status'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Connection Status & Tables
          </button>
          <button
            onClick={() => setActiveTab('free_guide')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'free_guide'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            Lifetime Free MySQL Guide (TiDB Cloud)
          </button>
          <button
            onClick={() => setActiveTab('schema')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'schema'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            SQL Schema (.sql)
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* TAB 1: STATUS */}
          {activeTab === 'status' && (
            <div className="space-y-5">
              {/* Primary Status Banner */}
              <div className={`p-4 rounded-xl border flex items-start justify-between gap-4 ${
                status?.connected
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-200'
                  : status?.configured
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-950 dark:text-amber-200'
                  : 'bg-blue-500/10 border-blue-500/20 text-slate-800 dark:text-slate-200'
              }`}>
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg mt-0.5 ${
                    status?.connected ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
                  }`}>
                    {status?.connected ? <CheckCircle2 className="w-5 h-5" /> : <HardDrive className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm">
                        {status?.connected
                          ? `Connected to ${status.provider || 'MySQL Database'}`
                          : status?.configured
                          ? 'MySQL Configured but Not Reachable'
                          : 'Running in Local File Storage Mode (Active)'}
                      </h3>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        status?.connected
                          ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}>
                        {status?.connected ? 'Live' : 'Fallback File Mode'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      {status?.connected
                        ? `Host: ${status.host || 'localhost'} | Database: ${status.database || 'fuelflow'} | Latency: ${status.pingMs || 0}ms`
                        : status?.error
                        ? status.error
                        : 'Your data is safely stored in local files. Connect any free MySQL (like TiDB Cloud) to store data permanently in the cloud.'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => fetchStatus(true)}
                  disabled={isLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-blue-800 hover:bg-white dark:hover:bg-blue-900/40 text-xs font-semibold shrink-0 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>Test Connection</span>
                </button>
              </div>

              {/* Special Diagnostic Box for TiDB Cloud or Unresolved Hosts */}
              {!status?.connected && (
                <div className="p-4 rounded-xl border border-amber-300 dark:border-amber-500/40 bg-amber-50/80 dark:bg-amber-950/20 text-xs space-y-2">
                  <div className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>TiDB Cloud ক্লাস্টার কনফিগারেশন আপডেট</span>
                  </div>
                  {status?.host?.includes('tidbcloud') ? (
                    <div className="space-y-1.5 text-slate-700 dark:text-slate-300">
                      <p>
                        আপনার TiDB ক্লাস্টার হোস্ট (<code>gateway01.ap-southeast-1.prod.aws.tidbcloud.com:4000</code>) এবং ইউজারনেম (<code>3vs45pD8HohQ35M.root</code>) অ্যাপ্লিকেশনে সক্রিয় করা হয়েছে।
                      </p>
                      <p className="font-semibold text-amber-800 dark:text-amber-200">
                        🔑 শেষ ধাপ: আপনার TiDB স্ক্রিনশটে থাকা <strong>[Generate Password]</strong> বাটনে ক্লিক করে পাসওয়ার্ডটি তৈরি করুন এবং Settings &gt; Secrets-এ <code>MYSQL_PASSWORD</code> হিসেবে দিন।
                      </p>
                    </div>
                  ) : (
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                      আপনার ডাটা সুরক্ষার জন্য অ্যাপটি এখন স্বয়ংক্রিয় নিরাপদ লোকাল স্টোরেজে চলছে। ক্লাউডে পার্মানেন্ট স্টোরেজ পেতে TiDB Cloud ব্যবহার করুন।
                    </p>
                  )}
                  <div className="pt-1">
                    <button
                      onClick={() => setActiveTab('free_guide')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition-colors"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>TiDB Cloud গাইড ও কনফিগ কপি করুন</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Live Table Counts Grid */}
              <div>
                <h4 className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider mb-2 flex items-center gap-1.5">
                  <Table className="w-3.5 h-3.5" />
                  Database Tables & Row Counts
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-blue-900/40 bg-slate-50/50 dark:bg-[#0a1226]">
                    <div className="text-[10px] text-slate-500 font-medium">tenants</div>
                    <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                      {status?.tableCounts?.tenants ?? allTenants.length}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-blue-900/40 bg-slate-50/50 dark:bg-[#0a1226]">
                    <div className="text-[10px] text-slate-500 font-medium">users</div>
                    <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                      {status?.tableCounts?.users ?? allUsers.length}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-blue-900/40 bg-slate-50/50 dark:bg-[#0a1226]">
                    <div className="text-[10px] text-slate-500 font-medium">vehicles</div>
                    <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                      {status?.tableCounts?.vehicles ?? vehicles.length}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-blue-900/40 bg-slate-50/50 dark:bg-[#0a1226]">
                    <div className="text-[10px] text-slate-500 font-medium">fuel_entries</div>
                    <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                      {status?.tableCounts?.fuel_entries ?? fuelEntries.length}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-blue-900/40 bg-slate-50/50 dark:bg-[#0a1226]">
                    <div className="text-[10px] text-slate-500 font-medium">fuel_pumps</div>
                    <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                      {status?.tableCounts?.fuel_pumps ?? pumps.length}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-blue-900/40 bg-slate-50/50 dark:bg-[#0a1226]">
                    <div className="text-[10px] text-slate-500 font-medium">pump_payments</div>
                    <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                      {status?.tableCounts?.pump_payments ?? payments.length}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sync Status Banner if any */}
              {syncResult && (
                <div className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                  syncResult.success
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                    : 'bg-red-500/10 border-red-500/30 text-red-800 dark:text-red-300'
                }`}>
                  {syncResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
                  <span>{syncResult.message}</span>
                </div>
              )}

              {/* Actions Section */}
              <div className="pt-2 flex flex-wrap gap-2.5">
                <button
                  onClick={handleSyncToMySQL}
                  disabled={isSyncing}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/20 transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Syncing...' : 'Sync All Data to MySQL'}</span>
                </button>

                <button
                  onClick={handleDownloadSchema}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-blue-900/60 hover:bg-slate-100 dark:hover:bg-blue-900/30 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors"
                >
                  <Download className="w-4 h-4 text-blue-500" />
                  <span>Download SQL Schema (.sql)</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: FREE LIFETIME MYSQL GUIDE */}
          {activeTab === 'free_guide' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-sm">
                  <Zap className="w-4 h-4" />
                  <span>ফ্রি লাইফটাইম MySQL ডাটাবেস ব্যবহারের সহজ নিয়ম (TiDB Cloud Serverless)</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  Google AI Studio বা ক্লাউডে লাইফটাইম ফ্রিতে MySQL ডাটাবেস চালানোর জন্য সবচেয়ে সেরা অপশন হলো <strong>TiDB Cloud Serverless</strong>।
                  এতে কোনো ক্রেডিট কার্ড লাগে না, <strong>৫ জিবি ক্লাউড স্টোরেজ চিরদিনের জন্য সম্পূর্ণ ফ্রি</strong> এবং এটি ১০০% MySQL 8.0 কম্প্যাটিবল!
                </p>
              </div>

              {/* Steps List */}
              <div className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                <div className="p-3 rounded-xl border border-slate-200 dark:border-blue-900/40 bg-slate-50/50 dark:bg-[#0a1226] flex items-start gap-3">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-white font-bold text-[10px] shrink-0">1</span>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">TiDB Cloud একাউন্ট তৈরি করুন:</span>
                    <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                      <a href="https://tidbcloud.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline inline-flex items-center gap-1 font-medium">
                        tidbcloud.com <ExternalLink className="w-3 h-3" />
                      </a> এ যান এবং আপনার Google Email দিয়ে ফ্রিতে সাইনআপ করুন।
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 dark:border-blue-900/40 bg-slate-50/50 dark:bg-[#0a1226] flex items-start gap-3">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-white font-bold text-[10px] shrink-0">2</span>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">ফ্রি ক্লাস্টার তৈরি করুন:</span>
                    <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                      <strong>Create Cluster</strong> বাটনে ক্লিক করে <strong>Serverless (Free Tier)</strong> সিলেক্ট করুন। রিজিয়ন হিসেবে কাছাকাছি (যেমন: Singapore বা Mumbai) সিলেক্ট করে মাত্র ৫ সেকেন্ডে ক্লাস্টার রেডি হয়ে যাবে।
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 dark:border-blue-900/40 bg-slate-50/50 dark:bg-[#0a1226] flex items-start gap-3">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-white font-bold text-[10px] shrink-0">3</span>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">কানেকশন ইনফরমেশন কপি করুন:</span>
                    <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                      <strong>Connect</strong> বাটনে চাপ দিন এবং Host, User, Password সংগ্রহ করুন।
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 dark:border-blue-900/40 bg-slate-50/50 dark:bg-[#0a1226] flex items-start gap-3">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-white font-bold text-[10px] shrink-0">4</span>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">Environment Secrets এ যুক্ত করুন:</span>
                    <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                      নিচের এনভায়রনমেন্ট ভেরিয়েবলগুলো আপনার AI Studio Secrets বা <code>.env</code> এ সেট করে দিন:
                    </p>
                  </div>
                </div>
              </div>

              {/* Sample ENV block */}
              <div className="relative rounded-xl bg-slate-900 text-slate-200 p-3.5 text-xs font-mono border border-slate-800">
                <button
                  onClick={copyEnvSample}
                  className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-amber-400 border border-slate-700"
                >
                  {copiedEnv ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedEnv ? 'Copied!' : 'Copy'}</span>
                </button>
                <pre className="overflow-x-auto text-[11px] leading-relaxed">
{`MYSQL_HOST=gateway01.ap-southeast-1.prod.aws.tidbcloud.com
MYSQL_PORT=4000
MYSQL_USER=3vs45pD8HohQ35M.root
MYSQL_PASSWORD=FaiamIkyLcN3kABc
MYSQL_DATABASE=test
MYSQL_SSL=true`}
                </pre>
              </div>

              {/* Other Options */}
              <div className="text-xs text-slate-500 dark:text-slate-400">
                <strong>অন্যান্য ফ্রি অপশন:</strong> আপনি চাইলে Aiven MySQL, Clever Cloud, FreeDB, অথবা আপনার নিজস্ব cPanel Web Hosting এর phpMyAdmin MySQL ডাটাবেসের হোস্ট ও ক্রেডেনশিয়াল ব্যবহার করেও লাইফটাইম চালাতে পারবেন।
              </div>
            </div>
          )}

          {/* TAB 3: SCHEMA */}
          {activeTab === 'schema' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  নিচের SQL স্ক্রিপ্টটি phpMyAdmin বা MySQL Workbench বা TiDB SQL Editor এ রান করে সরাসরি টেবিল তৈরি করে নিতে পারেন।
                </p>
                <button
                  onClick={handleDownloadSchema}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .sql</span>
                </button>
              </div>

              <div className="rounded-xl bg-slate-900 p-4 border border-slate-800 text-slate-200 font-mono text-[11px] max-h-72 overflow-y-auto">
                <pre>{`-- FuelNest Database Schema (fuelnest.xyz / TiDB Cloud)
CREATE TABLE IF NOT EXISTS tenants (...);
CREATE TABLE IF NOT EXISTS users (...);
CREATE TABLE IF NOT EXISTS vehicles (...);
CREATE TABLE IF NOT EXISTS fuel_entries (...);
CREATE TABLE IF NOT EXISTS fuel_pumps (...);
CREATE TABLE IF NOT EXISTS pump_payments (...);
CREATE TABLE IF NOT EXISTS tanker_inventories (...);
CREATE TABLE IF NOT EXISTS tanker_logs (...);
-- Fully UTF8MB4 compliant`}</pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-blue-900/50 bg-slate-50 dark:bg-[#091024] flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Dual-Mode Architecture: MySQL Cloud + Offline Fallback Protection</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-blue-900/60 hover:bg-slate-800 text-white font-bold text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
