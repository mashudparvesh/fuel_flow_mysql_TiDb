import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Fuel,
  ShieldCheck,
  Truck,
  Gauge,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Zap,
  Building2,
  Crown,
  CreditCard,
  Phone,
  Mail,
  User,
  Lock,
  ChevronRight,
  Calculator,
  Server,
  X,
  ExternalLink,
  Sparkles,
  Sliders,
  DollarSign
} from 'lucide-react';

interface LandingPageProps {
  onNavigateToLogin: () => void;
  onNavigateToDashboard: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigateToLogin,
  onNavigateToDashboard
}) => {
  const { isAuthenticated, activeTenants } = useApp();

  // Registration Modal State
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'pro'>('starter');
  const [regCompanyName, setRegCompanyName] = useState('');
  const [regAdminName, setRegAdminName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState('');
  const [regSuccessResult, setRegSuccessResult] = useState<{
    companyName: string;
    username: string;
    tempPassword: string;
  } | null>(null);

  // Custom Enterprise Modal State
  const [isEnterpriseModalOpen, setIsEnterpriseModalOpen] = useState(false);
  const [entCompanyName, setEntCompanyName] = useState('');
  const [entContactName, setEntContactName] = useState('');
  const [entEmail, setEntEmail] = useState('');
  const [entPhone, setEntPhone] = useState('');
  const [entFleetSize, setEntFleetSize] = useState('50');
  const [entSuccess, setEntSuccess] = useState(false);

  // Interactive Live Demo Simulator State
  const [simEquipmentType, setSimEquipmentType] = useState<'excavator' | 'truck'>('excavator');
  const [simUsage, setSimUsage] = useState(10); // 10 hours or 100 km
  const [simLiters, setSimLiters] = useState(140); // Liters filled

  // Calculations for Simulator
  const isLph = simEquipmentType === 'excavator';
  const benchmark = isLph ? 14.0 : 3.2; // 14 L/hr vs 3.2 km/L
  const actualMetric = isLph
    ? simUsage > 0 ? Math.round((simLiters / simUsage) * 10) / 10 : 0
    : simLiters > 0 ? Math.round((simUsage / simLiters) * 10) / 10 : 0;

  const variancePercent = isLph
    ? Math.round(((actualMetric - benchmark) / benchmark) * 100)
    : Math.round(((actualMetric - benchmark) / benchmark) * 100);

  const isAnomaly = isLph ? variancePercent > 20 : variancePercent < -20;

  // Open Registration modal for plan
  const handleOpenRegister = (plan: 'starter' | 'pro') => {
    setSelectedPlan(plan);
    setRegError('');
    setRegSuccessResult(null);
    setIsRegisterOpen(true);
  };

  // Submit Registration & Automated Provisioning
  const handleRegisterSubmit = async (e: React.FormEvent, simulatePayment = false) => {
    e.preventDefault();
    setRegError('');

    if (!regCompanyName.trim() || !regAdminName.trim() || !regEmail.trim()) {
      setRegError('Please provide Company Name, Admin Name, and Email.');
      return;
    }

    setRegLoading(true);

    try {
      if (simulatePayment) {
        // Direct simulation for instant credentials
        const res = await fetch('/api/payment/simulate-success', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            company_name: regCompanyName.trim(),
            admin_name: regAdminName.trim(),
            email: regEmail.trim(),
            phone: regPhone.trim(),
            plan_id: selectedPlan,
            max_vehicles: selectedPlan === 'starter' ? 5 : 20,
            custom_price: selectedPlan === 'starter' ? 1500 : 3500
          })
        });

        const data = await res.json();
        setRegLoading(false);

        if (data.success) {
          setRegSuccessResult({
            companyName: data.tenant.name,
            username: data.super_admin_username,
            tempPassword: data.temporary_password
          });
        } else {
          setRegError(data.message || 'Provisioning failed. Please try again.');
        }
      } else {
        // Call checkout
        const res = await fetch('/api/payment/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            full_name: regAdminName.trim(),
            email: regEmail.trim(),
            phone: regPhone.trim(),
            amount: selectedPlan === 'starter' ? 1500 : 3500,
            metadata: {
              company_name: regCompanyName.trim(),
              plan_id: selectedPlan,
              max_vehicles: selectedPlan === 'starter' ? 5 : 20,
              phone: regPhone.trim()
            }
          })
        });

        const data = await res.json();
        setRegLoading(false);

        if (data.success && data.payment_url) {
          if (data.is_sandbox) {
            // In sandbox simulation mode, complete immediately
            const simRes = await fetch('/api/payment/simulate-success', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                company_name: regCompanyName.trim(),
                admin_name: regAdminName.trim(),
                email: regEmail.trim(),
                phone: regPhone.trim(),
                plan_id: selectedPlan,
                max_vehicles: selectedPlan === 'starter' ? 5 : 20,
                custom_price: selectedPlan === 'starter' ? 1500 : 3500
              })
            });
            const simData = await simRes.json();
            if (simData.success) {
              setRegSuccessResult({
                companyName: simData.tenant.name,
                username: simData.super_admin_username,
                tempPassword: simData.temporary_password
              });
              return;
            }
          }
          window.location.href = data.payment_url;
        } else {
          setRegError(data.message || 'Unable to initiate payment.');
        }
      }
    } catch (err: any) {
      setRegLoading(false);
      setRegError(err?.message || 'Connection error. Please try again.');
    }
  };

  const handleEnterpriseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEntSuccess(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-amber-500 selection:text-slate-950 flex flex-col font-sans">
      {/* Background Ambience / Glows */}
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* TOP NAVBAR */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-slate-950/80 border-b border-slate-800/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 ring-1 ring-amber-400/30">
              <Fuel className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-white">FuelNest</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                  fuelnest.xyz
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Fleet & Fuel Commercial Intelligence
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-300">
            <a href="#features" className="hover:text-amber-400 transition-colors">
              Features
            </a>
            <a href="#dual-metrics" className="hover:text-amber-400 transition-colors">
              Dual Metrics (LPH/KMPL)
            </a>
            <a href="#bowzer-depot" className="hover:text-amber-400 transition-colors">
              Bowzer Depot
            </a>
            <a href="#pricing" className="hover:text-amber-400 transition-colors">
              Pricing
            </a>
          </nav>

          {/* Header Action Button */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <button
                onClick={onNavigateToDashboard}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs sm:text-sm font-black shadow-lg shadow-amber-500/20 transition-all transform active:scale-95"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={onNavigateToLogin}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 border border-amber-500/30 hover:border-amber-500/60 text-xs sm:text-sm font-black shadow-md transition-all transform active:scale-95"
              >
                <User className="w-4 h-4" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Hero Left Copy */}
            <div className="lg:col-span-7 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-bold mb-6 animate-pulse">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Automated Commercial SaaS &bull; Instant Provisioning</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15]">
                Fleet & Fuel Control Built for{' '}
                <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 bg-clip-text text-transparent">
                  Heavy Equipment
                </span>{' '}
                Logistics.
              </h1>

              <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Eliminate fuel theft and reconciliation guesswork. FuelNest delivers dual metric tracking (LPH for excavators and generators, KMPL for transport trucks), site bowzer depot stock logs, highway pump credit ledgers, and automated AI anomaly detection.
              </p>

              {/* Action Buttons */}
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <button
                  onClick={() => handleOpenRegister('starter')}
                  className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/25 transition-all transform active:scale-95 flex items-center justify-center gap-2.5"
                >
                  <span>Start Workspace Now</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <a
                  href="#interactive-demo"
                  className="w-full sm:w-auto px-7 py-4 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-sm transition-all flex items-center justify-center gap-2"
                >
                  <Calculator className="w-4 h-4 text-amber-400" />
                  <span>Try Live Simulator</span>
                </a>
              </div>

              {/* Social Proof Badges */}
              <div className="mt-10 pt-8 border-t border-slate-800/80 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Instant Baniq Pay Setup (bKash/Nagad/Rocket)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Zero Infrastructure Configuration</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{activeTenants.length}+ Active Subscribers</span>
                </div>
              </div>
            </div>

            {/* Hero Right Visual: Live Interactive Simulator */}
            <div id="interactive-demo" className="lg:col-span-5">
              <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 sm:p-7 shadow-2xl backdrop-blur-xl relative overflow-hidden">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-black uppercase tracking-wider text-white">
                      Live Fuel Metric Engine
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    REAL-TIME AI
                  </span>
                </div>

                {/* Equipment Type Toggle */}
                <div className="mt-5 grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setSimEquipmentType('excavator');
                      setSimUsage(10);
                      setSimLiters(140);
                    }}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      simEquipmentType === 'excavator'
                        ? 'bg-amber-500 text-slate-950 shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Gauge className="w-3.5 h-3.5" />
                    <span>Excavator (LPH)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSimEquipmentType('truck');
                      setSimUsage(320);
                      setSimLiters(100);
                    }}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      simEquipmentType === 'truck'
                        ? 'bg-amber-500 text-slate-950 shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Dump Truck (KMPL)</span>
                  </button>
                </div>

                {/* Sliders */}
                <div className="mt-5 space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                      <span className="text-slate-400">
                        {isLph ? 'Engine Hours Worked' : 'Distance Traveled (Km)'}
                      </span>
                      <span className="text-white font-mono">
                        {simUsage} {isLph ? 'Hours' : 'Km'}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={isLph ? 1 : 50}
                      max={isLph ? 24 : 800}
                      value={simUsage}
                      onChange={e => setSimUsage(Number(e.target.value))}
                      className="w-full accent-amber-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                      <span className="text-slate-400">Diesel Filled (Liters)</span>
                      <span className="text-white font-mono">{simLiters} Liters</span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={isLph ? 400 : 300}
                      value={simLiters}
                      onChange={e => setSimLiters(Number(e.target.value))}
                      className="w-full accent-amber-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>

                {/* Metric Output Display */}
                <div className="mt-6 p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-400 block font-medium">
                      Calculated {isLph ? 'Consumption' : 'Mileage'}
                    </span>
                    <div className="text-2xl font-black text-white font-mono flex items-baseline gap-1.5 mt-0.5">
                      <span>{actualMetric}</span>
                      <span className="text-xs text-amber-400 font-sans font-bold">
                        {isLph ? 'Liters/Hour' : 'Km/Liter'}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-1">
                      Benchmark: {benchmark} {isLph ? 'LPH' : 'KMPL'}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 block font-medium">
                      Variance Status
                    </span>
                    <div
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mt-1 ${
                        isAnomaly
                          ? 'bg-red-500/15 text-red-400 border border-red-500/30 animate-pulse'
                          : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {isAnomaly ? (
                        <>
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Theft / Leak Alert ({variancePercent}%)</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Optimal Efficiency</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 text-center">
                  <button
                    onClick={() => handleOpenRegister('pro')}
                    className="text-xs font-bold text-amber-400 hover:text-amber-300 inline-flex items-center gap-1"
                  >
                    <span>Deploy this anomaly AI for your fleet &rarr;</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CORE CAPABILITIES GRID */}
      <section id="features" className="py-20 bg-slate-900/50 border-t border-slate-800/80 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-2">
              End-to-End Fuel Operations
            </h2>
            <p className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Four Pillars of Heavy Equipment Fleet Governance
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div id="dual-metrics" className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-amber-500/40 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-5 group-hover:scale-105 transition-transform">
                <Gauge className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">
                Dual Metrics: LPH vs KMPL
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Standard telematics treat all machinery like highway trucks. FuelNest natively separates stationary equipment (Excavators, Cranes, Piling Rigs, Generators) into Liters Per Hour while tracking transport haulers in Kilometers Per Liter.
              </p>
            </div>

            {/* Feature 2 */}
            <div id="bowzer-depot" className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-amber-500/40 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-5 group-hover:scale-105 transition-transform">
                <Fuel className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">
                Mobile Bowzer Depot Stock
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Maintain accurate internal stock for on-site mobile bowzers and container storage tanks. Log physical dip measurements, dispense transactions directly into machinery, and pinpoint distribution variance.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-amber-500/40 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-5 group-hover:scale-105 transition-transform">
                <CreditCard className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">
                Highway Pump Credit Ledger
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Manage credit balances across external commercial filling stations. Track fuel slip numbers, payment bank transfers, cheques, and credit limit exhaustion warnings in real time.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-amber-500/40 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-5 group-hover:scale-105 transition-transform">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">
                Fuel Theft & Anomaly AI
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Automatically detects abnormal meter increments, consumption spikes exceeding 20% from baseline, and duplicate slip submissions. Flag suspicious entries instantly before reconciliation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING PLANS SECTION */}
      <section id="pricing" className="py-24 bg-slate-950 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-2">
              Transparent Commercial Subscriptions
            </h2>
            <p className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Automated Workspace Provisioning in Seconds
            </p>
            <p className="text-sm text-slate-400 mt-3">
              Pay seamlessly using personal or merchant bKash, Nagad, Rocket, or Bank via Baniq Pay.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            {/* PLAN 1: STARTER */}
            <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-8 flex flex-col justify-between hover:border-slate-700 transition-all relative">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white">Starter Plan</h3>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    Small Fleet
                  </span>
                </div>
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-white">1,500</span>
                    <span className="text-base font-bold text-slate-400">BDT</span>
                    <span className="text-xs text-slate-400">/ month</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    Ideal for local contractors & small logistics teams.
                  </p>
                </div>

                <ul className="space-y-3.5 text-xs text-slate-300 mb-8 border-t border-slate-800/80 pt-6">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Up to <strong>5 Vehicles / Heavy Machines</strong></span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Dual Metric Engine (LPH & KMPL)</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Highway Pump Credit & Balance Ledger</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Up to 3 Users (Super Admin & Operators)</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Fuel Slip Reconciliation & CSV Export</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => handleOpenRegister('starter')}
                className="w-full py-3.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all flex items-center justify-center gap-2"
              >
                <span>Select Starter Plan</span>
                <ChevronRight className="w-4 h-4 text-amber-400" />
              </button>
            </div>

            {/* PLAN 2: PRO (FEATURED) */}
            <div className="rounded-3xl bg-slate-900 border-2 border-amber-500/80 p-8 flex flex-col justify-between relative shadow-2xl shadow-amber-500/10">
              {/* Popular Badge */}
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-[11px] shadow-lg uppercase tracking-wider">
                Most Popular for Construction
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white">Professional Plan</h3>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Full Features
                  </span>
                </div>
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-white">3,500</span>
                    <span className="text-base font-bold text-slate-400">BDT</span>
                    <span className="text-xs text-slate-400">/ month</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    For construction sites, mega projects, and haulage fleets.
                  </p>
                </div>

                <ul className="space-y-3.5 text-xs text-slate-300 mb-8 border-t border-slate-800/80 pt-6">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Up to <strong>20 Vehicles / Excavators / Generators</strong></span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <span><strong>Mobile Bowzer Tanker Depot Module</strong></span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Physical Dip Stick & Dispense Reconciliation</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>AI Theft & Siphoning Variance Alerts</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Up to 10 Users with Role-Based Permissions</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Full Reports & Monthly Audit Logs</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => handleOpenRegister('pro')}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 transform active:scale-95"
              >
                <span>Select Pro Plan</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* PLAN 3: ENTERPRISE */}
            <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-8 flex flex-col justify-between hover:border-slate-700 transition-all relative">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white">Enterprise Plan</h3>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    Custom Scale
                  </span>
                </div>
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-white">Custom</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    For multi-site infrastructure groups with 50+ machines.
                  </p>
                </div>

                <ul className="space-y-3.5 text-xs text-slate-300 mb-8 border-t border-slate-800/80 pt-6">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <span><strong>Unlimited Machinery & Trucks</strong></span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Multi-Depot & Bowzer Network Integration</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Custom ERP / Accounting API Integration</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Dedicated Account Manager & Training</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>SLA 99.9% High Availability</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => {
                  setEntSuccess(false);
                  setIsEnterpriseModalOpen(true);
                }}
                className="w-full py-3.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all flex items-center justify-center gap-2"
              >
                <span>Contact Enterprise Team</span>
                <ChevronRight className="w-4 h-4 text-amber-400" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="w-full py-12 border-t border-slate-800 bg-slate-950 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Fuel className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-slate-200">FuelNest SaaS Platform &bull; fuelnest.xyz</span>
          </div>
          <p>&copy; {new Date().getFullYear()} FuelNest Technologies. All rights reserved.</p>
        </div>
      </footer>

      {/* REGISTRATION & BANIQ PAY MODAL */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setIsRegisterOpen(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            {!regSuccessResult ? (
              <>
                <div className="mb-6">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold mb-2">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Instant Commercial Workspace Setup</span>
                  </div>
                  <h3 className="text-xl font-black text-white">
                    Register for {selectedPlan === 'starter' ? 'Starter Plan' : 'Pro Plan'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Your company fleet workspace and Super Admin account will be automatically generated upon payment.
                  </p>
                </div>

                {regError && (
                  <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{regError}</span>
                  </div>
                )}

                <form onSubmit={e => handleRegisterSubmit(e, false)} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Company / Fleet Name *
                    </label>
                    <input
                      type="text"
                      value={regCompanyName}
                      onChange={e => setRegCompanyName(e.target.value)}
                      placeholder="e.g., Padma Multipurpose Fleet"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Admin Full Name *
                      </label>
                      <input
                        type="text"
                        value={regAdminName}
                        onChange={e => setRegAdminName(e.target.value)}
                        placeholder="e.g., M. A. Rahman"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        value={regEmail}
                        onChange={e => setRegEmail(e.target.value)}
                        placeholder="admin@yourcompany.com"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Phone Number (for bKash / Nagad / Rocket) *
                    </label>
                    <input
                      type="tel"
                      value={regPhone}
                      onChange={e => setRegPhone(e.target.value)}
                      placeholder="+880 1700-000000"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Plan Price Summary */}
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-400 block">Total Due Today:</span>
                      <span className="text-base font-black text-amber-400">
                        {selectedPlan === 'starter' ? '1,500 BDT' : '3,500 BDT'}
                      </span>
                    </div>
                    <div className="text-right text-[10px] text-slate-400">
                      <span>Gateway: Baniq Pay</span>
                      <span className="block text-emerald-400 font-semibold">
                        Automated bKash, Nagad, Rocket
                      </span>
                    </div>
                  </div>

                  {/* Submit Actions */}
                  <div className="pt-2 space-y-2">
                    <button
                      type="submit"
                      disabled={regLoading}
                      className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>
                        {regLoading ? 'Initiating Gateway...' : 'Proceed to Baniq Pay Gateway'}
                      </span>
                    </button>

                    <button
                      type="button"
                      disabled={regLoading}
                      onClick={e => handleRegisterSubmit(e, true)}
                      className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all flex items-center justify-center gap-2"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>Instant Simulation (Test Mode Credentials)</span>
                    </button>
                  </div>
                </form>
              </>
            ) : (
              /* Success Result Card */
              <div className="text-center py-4">
                <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-white">
                  Workspace Provisioned Successfully!
                </h3>
                <p className="text-xs text-slate-300 mt-1 mb-6">
                  Your dedicated fleet database has been created for{' '}
                  <strong>{regSuccessResult.companyName}</strong>.
                </p>

                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-left text-xs mb-6 space-y-2">
                  <div className="flex justify-between py-1 border-b border-slate-900">
                    <span className="text-slate-400">Super Admin Username:</span>
                    <span className="font-mono font-bold text-amber-400">
                      {regSuccessResult.username}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-900">
                    <span className="text-slate-400">Temporary Password:</span>
                    <span className="font-mono font-bold text-amber-400">
                      {regSuccessResult.tempPassword}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 pt-1">
                    * A welcome email with these credentials has been dispatched. You will be prompted to change your temporary password upon first login.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setIsRegisterOpen(false);
                    onNavigateToLogin();
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <span>Sign In with New Credentials &rarr;</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ENTERPRISE CONTACT MODAL */}
      {isEnterpriseModalOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setIsEnterpriseModalOpen(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            {!entSuccess ? (
              <>
                <div className="mb-6">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold mb-2">
                    <Crown className="w-3.5 h-3.5" />
                    <span>Enterprise Consultation</span>
                  </div>
                  <h3 className="text-xl font-black text-white">Custom Fleet Plan Inquiry</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Let us tailor a high-volume fuel monitoring system for your heavy machinery network.
                  </p>
                </div>

                <form onSubmit={handleEnterpriseSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      value={entCompanyName}
                      onChange={e => setEntCompanyName(e.target.value)}
                      placeholder="e.g., Summit Infrastructure Ltd"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Contact Person *
                      </label>
                      <input
                        type="text"
                        value={entContactName}
                        onChange={e => setEntContactName(e.target.value)}
                        placeholder="e.g., Project Director"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Estimated Fleet Size *
                      </label>
                      <input
                        type="number"
                        value={entFleetSize}
                        onChange={e => setEntFleetSize(e.target.value)}
                        placeholder="50"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Work Email *
                      </label>
                      <input
                        type="email"
                        value={entEmail}
                        onChange={e => setEntEmail(e.target.value)}
                        placeholder="director@company.com"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        value={entPhone}
                        onChange={e => setEntPhone(e.target.value)}
                        placeholder="+880 17..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-lg transition-all"
                    >
                      Submit Enterprise Inquiry
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="text-center py-6">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                <h4 className="text-lg font-bold text-white mb-2">Inquiry Received</h4>
                <p className="text-xs text-slate-300 mb-6">
                  Thank you, our senior fleet solutions engineering team will contact you within 2 hours.
                </p>
                <button
                  onClick={() => setIsEnterpriseModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
