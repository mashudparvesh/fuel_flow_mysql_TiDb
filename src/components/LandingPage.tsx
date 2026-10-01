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
  Menu,
  X,
  ExternalLink,
  Sparkles,
  Sliders,
  DollarSign,
  Copy,
  Check,
  Smartphone,
  QrCode,
  Clock
} from 'lucide-react';
import { OFFICIAL_SUBSCRIPTION_PLANS, SubscriptionPlanId, SubscriptionPlanConfig } from '../types';

interface LandingPageProps {
  onNavigateToLogin: () => void;
  onNavigateToDashboard: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigateToLogin,
  onNavigateToDashboard
}) => {
  const { isAuthenticated, activeTenants, refreshTenantsFromServer } = useApp();

  // Registration Modal State
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<SubscriptionPlanId>('trial_3days');
  const [regCompanyName, setRegCompanyName] = useState('');
  const [regAdminName, setRegAdminName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState('');
  const [regSuccessResult, setRegSuccessResult] = useState<{
    companyName: string;
    adminName?: string;
    email: string;
    phone?: string;
    isTrial: boolean;
    planName: string;
    paymentMethod?: string;
    transactionId?: string;
    pendingApproval: boolean;
  } | null>(null);

  // Payment Gateway Popup Modal State (Problem 2)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [hasClickedPayNow, setHasClickedPayNow] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'bkash' | 'nagad' | 'rocket' | 'bank' | 'card'>('bkash');
  const [paymentTrxId, setPaymentTrxId] = useState('');
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null);
  const [copiedCreds, setCopiedCreds] = useState(false);

  // Custom Enterprise Modal State
  const [isEnterpriseModalOpen, setIsEnterpriseModalOpen] = useState(false);
  const [entCompanyName, setEntCompanyName] = useState('');
  const [entContactName, setEntContactName] = useState('');
  const [entEmail, setEntEmail] = useState('');
  const [entPhone, setEntPhone] = useState('');
  const [entFleetSize, setEntFleetSize] = useState('50');
  const [entSuccess, setEntSuccess] = useState(false);

  // Responsive Mobile Navigation Drawer State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
  const handleOpenRegister = (planId: SubscriptionPlanId = 'trial_3days') => {
    setSelectedPlanId(planId);
    setRegError('');
    setRegSuccessResult(null);
    setIsRegisterOpen(true);
  };

  // Submit Registration & Redirect to Payment or Activate Trial
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    if (!regCompanyName.trim() || !regAdminName.trim() || !regEmail.trim() || !regPhone.trim()) {
      setRegError('Please complete all required fields: Company Name, Admin Full Name, Email, and Phone Number.');
      return;
    }

    const activePlan = OFFICIAL_SUBSCRIPTION_PLANS.find(p => p.id === selectedPlanId) || OFFICIAL_SUBSCRIPTION_PLANS[0];

    // If it's a paid plan, open the Payment Gateway Popup Modal (DO NOT open new tab, DO NOT show email sent yet!)
    if (!activePlan.is_trial) {
      setIsRegisterOpen(false);
      setPaymentError('');
      setPaymentTrxId('');
      setHasClickedPayNow(false);
      setIsPaymentModalOpen(true);
      return;
    }

    // For Free Trial, submit registration request to Master Control for approval
    setRegLoading(true);

    try {
      const res = await fetch('/api/subscribers/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: regCompanyName.trim(),
          admin_name: regAdminName.trim(),
          email: regEmail.trim(),
          phone: regPhone.trim(),
          plan_id: selectedPlanId
        })
      });

      const data = await res.json();
      setRegLoading(false);

      if (!data.success) {
        setRegError(data.message || 'Unable to submit workspace registration. Please try again.');
        return;
      }

      // Broadcast new registration to Master Control across open windows
      try {
        const ch = new BroadcastChannel('fuelflow_tenants_sync');
        ch.postMessage({ type: 'NEW_REGISTRATION', company: regCompanyName.trim() });
        ch.postMessage({ type: 'REFRESH_TENANTS' });
        ch.postMessage({ type: 'REFRESH_USERS' });
        ch.close();
      } catch (e) {}

      // Show Thank You / Under Review confirmation popup (No passwords exposed)
      setRegSuccessResult({
        companyName: regCompanyName.trim(),
        adminName: regAdminName.trim(),
        email: regEmail.trim(),
        phone: regPhone.trim(),
        isTrial: true,
        planName: activePlan.name_en || activePlan.nameEn || activePlan.name_bn,
        paymentMethod: 'Free Trial',
        pendingApproval: true
      });

    } catch (err: any) {
      setRegLoading(false);
      setRegError(err?.message || 'Network connectivity error occurred. Please try again.');
    }
  };

  // Confirm Payment from In-App Payment Popup Modal
  const handlePaymentConfirm = async () => {
    setPaymentError('');
    setPaymentSubmitting(true);

    const activePlan = OFFICIAL_SUBSCRIPTION_PLANS.find(p => p.id === selectedPlanId) || OFFICIAL_SUBSCRIPTION_PLANS[0];

    try {
      const res = await fetch('/api/subscribers/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: regCompanyName.trim(),
          admin_name: regAdminName.trim(),
          email: regEmail.trim(),
          phone: regPhone.trim(),
          plan_id: selectedPlanId,
          payment_completed: true,
          payment_method: selectedPaymentMethod,
          transaction_id: paymentTrxId.trim() || `TRX_${Date.now()}`
        })
      });

      const data = await res.json();
      setPaymentSubmitting(false);

      if (!data.success) {
        setPaymentError(data.message || 'Payment submission failed. Please try again or contact support.');
        return;
      }

      // Close the payment popup
      setIsPaymentModalOpen(false);

      // Broadcast to Master Control
      try {
        const ch = new BroadcastChannel('fuelflow_tenants_sync');
        ch.postMessage({ type: 'NEW_REGISTRATION', company: regCompanyName.trim() });
        ch.postMessage({ type: 'REFRESH_TENANTS' });
        ch.postMessage({ type: 'REFRESH_USERS' });
        ch.close();
      } catch (e) {}

      // Show Under Review confirmation modal (No passwords exposed)
      setRegSuccessResult({
        companyName: regCompanyName.trim(),
        adminName: regAdminName.trim(),
        email: regEmail.trim(),
        phone: regPhone.trim(),
        isTrial: false,
        planName: activePlan.name_en || activePlan.nameEn || activePlan.name_bn,
        paymentMethod: selectedPaymentMethod,
        transactionId: paymentTrxId.trim() || 'Recorded',
        pendingApproval: true
      });
      setIsRegisterOpen(true);

    } catch (err: any) {
      setPaymentSubmitting(false);
      setPaymentError(err?.message || 'Network connectivity error occurred during payment processing.');
    }
  };

  const handleEnterpriseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEntSuccess(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-amber-500 selection:text-slate-950 flex flex-col font-sans overflow-x-hidden w-full max-w-full relative">
      {/* Background Ambience / Glows */}
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* TOP NAVBAR */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-slate-950/85 border-b border-slate-800/80 transition-all">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 ring-1 ring-amber-400/30 flex-shrink-0">
              <Fuel className="w-5 h-5 sm:w-6 sm:h-6 text-slate-950" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-lg sm:text-xl font-black tracking-tight text-white">FuelNest</span>
                <span className="hidden sm:inline-flex text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                  Enterprise Fleet
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Fleet & Fuel Commercial Intelligence
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-semibold text-slate-300">
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

          {/* Desktop Header Action Buttons */}
          <div className="hidden md:flex items-center gap-2.5">
            {isAuthenticated ? (
              <button
                onClick={onNavigateToDashboard}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs sm:text-sm font-black shadow-lg shadow-amber-500/20 transition-all transform active:scale-95 cursor-pointer"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => handleOpenRegister('trial_3days')}
                  className="flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs sm:text-sm font-black shadow-lg shadow-amber-500/20 transition-all transform active:scale-95 cursor-pointer"
                >
                  <Crown className="w-4 h-4" />
                  <span>Register</span>
                </button>
                <button
                  onClick={onNavigateToLogin}
                  className="flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 border border-amber-500/30 hover:border-amber-500/60 text-xs sm:text-sm font-black shadow-md transition-all transform active:scale-95 cursor-pointer"
                >
                  <User className="w-4 h-4" />
                  <span>Sign In</span>
                </button>
              </>
            )}
          </div>

          {/* Mobile Actions: Compact Quick Sign In + Hamburger Toggle */}
          <div className="flex md:hidden items-center gap-1.5 flex-shrink-0">
            {!isAuthenticated ? (
              <button
                type="button"
                onClick={onNavigateToLogin}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 text-amber-400 border border-amber-500/30 text-xs font-bold active:scale-95 transition-all cursor-pointer"
                title="Sign In"
              >
                <User className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onNavigateToDashboard}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500 text-slate-950 text-xs font-bold active:scale-95 transition-all cursor-pointer"
              >
                <span>Dashboard</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-1.5 rounded-lg bg-slate-900 text-slate-300 border border-slate-800 hover:text-white hover:border-slate-700 transition-colors cursor-pointer"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5 text-amber-400" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-slate-800 bg-slate-950/95 backdrop-blur-2xl px-4 py-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex flex-col space-y-1 text-sm font-semibold text-slate-300">
              <a
                href="#features"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-slate-900 hover:text-amber-400 transition-colors"
              >
                Features & Modules
              </a>
              <a
                href="#dual-metrics"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-slate-900 hover:text-amber-400 transition-colors"
              >
                Dual Metrics (LPH & KMPL)
              </a>
              <a
                href="#bowzer-depot"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-slate-900 hover:text-amber-400 transition-colors"
              >
                Site Bowzer Depot
              </a>
              <a
                href="#pricing"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-slate-900 hover:text-amber-400 transition-colors"
              >
                Subscription Pricing
              </a>
            </div>

            <div className="pt-3 border-t border-slate-800/80 space-y-2">
              {!isAuthenticated ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleOpenRegister('trial_3days');
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/20 active:scale-98 cursor-pointer"
                  >
                    <Crown className="w-4 h-4" />
                    <span>Register 3-Day Free Trial</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onNavigateToLogin();
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900 border border-slate-800 text-amber-400 font-bold text-sm hover:border-slate-700 active:scale-98 cursor-pointer"
                  >
                    <User className="w-4 h-4" />
                    <span>Sign In to Existing Workspace</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onNavigateToDashboard();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-amber-500 text-slate-950 font-black text-sm active:scale-98 cursor-pointer"
                >
                  <span>Go to Fleet Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Hero Left Copy */}
            <div className="lg:col-span-7 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-bold mb-6 animate-pulse">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>3-Day Free Trial Available &bull; Instant Cloud Provisioning</span>
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
                  onClick={() => handleOpenRegister('trial_3days')}
                  className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/25 transition-all transform active:scale-95 flex items-center justify-center gap-2.5 cursor-pointer"
                >
                  <span>Start 3-Day Free Trial</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <a
                  href="#pricing"
                  className="w-full sm:w-auto px-7 py-4 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-sm transition-all flex items-center justify-center gap-2"
                >
                  <Crown className="w-4 h-4 text-amber-400" />
                  <span>View All Plans & Pricing</span>
                </a>
              </div>

              {/* Social Proof Badges */}
              <div className="mt-10 pt-8 border-t border-slate-800/80 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Instant Payment Gateway (bKash/Nagad/Rocket/Bank)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>3-Day Free Trial (No Card Needed)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Full Options & Modules Included</span>
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
                    onClick={() => handleOpenRegister('plan_1month')}
                    className="text-xs font-bold text-amber-400 hover:text-amber-300 inline-flex items-center gap-1 cursor-pointer"
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
              Official Fleet Subscriptions & Plans
            </h2>
            <p className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Transparent Subscription Plans for Heavy Fleets
            </p>
            <p className="text-sm text-slate-400 mt-3 leading-relaxed">
              Every plan includes 100% unlocked modules, dual-metric tracking (LPH & KMPL), site bowzer management, and AI theft anomaly detection. Start with a 3-day unrestricted free trial without a card.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 items-stretch">
            {OFFICIAL_SUBSCRIPTION_PLANS.map((plan) => {
              const isTrial = plan.is_trial;
              const isFeatured = plan.id === 'plan_1month' || plan.id === 'plan_12months';

              return (
                <div
                  key={plan.id}
                  className={`rounded-3xl p-6 flex flex-col justify-between transition-all relative ${
                    isFeatured
                      ? 'bg-slate-900 border-2 border-amber-500/80 shadow-2xl shadow-amber-500/10 ring-1 ring-amber-500/20'
                      : 'bg-slate-900/80 border border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-[10px] uppercase tracking-wider shadow-md whitespace-nowrap z-10">
                      {plan.badge}
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between gap-1.5 mb-3">
                      <h3 className="text-sm sm:text-base font-bold text-white whitespace-nowrap truncate">
                        {plan.name_en || plan.nameEn || plan.name_bn}
                      </h3>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-800 text-amber-300 whitespace-nowrap shrink-0">
                        {plan.duration_days} Days
                      </span>
                    </div>

                    <div className="mb-5">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-white">
                          {plan.price_bdt === 0 ? 'Free' : plan.price_bdt.toLocaleString()}
                        </span>
                        {plan.price_bdt > 0 && (
                          <span className="text-xs font-bold text-slate-400">BDT</span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 whitespace-nowrap">
                        {isTrial ? '3-Day Unrestricted Trial' : 'All Modules Unlocked'}
                      </p>
                    </div>

                    <ul className="space-y-2 text-xs text-slate-300 mb-6 border-t border-slate-800/80 pt-4">
                      {plan.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                          <span className="text-[11px] leading-tight">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={() => handleOpenRegister(plan.id)}
                    className={`w-full py-3 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer transform active:scale-95 ${
                      isTrial
                        ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                        : isFeatured
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black shadow-md'
                        : 'bg-slate-800 hover:bg-slate-700 text-white'
                    }`}
                  >
                    <span className="whitespace-nowrap">{isTrial ? 'Start Free Trial' : 'Select Plan'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="w-full py-12 border-t border-slate-800 bg-slate-950 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Fuel className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-slate-200">FuelNest Fleet Intelligence Platform</span>
          </div>
          <p>&copy; {new Date().getFullYear()} FuelNest Technologies. All rights reserved.</p>
        </div>
      </footer>

      {/* REGISTRATION MODAL */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsRegisterOpen(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {!regSuccessResult ? (
              <>
                <div className="mb-6">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold mb-2">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>New Workspace Registration</span>
                  </div>
                  <h3 className="text-xl font-black text-white">
                    Workspace & Plan Setup
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Provide organization details to instantly provision your private tenant workspace.
                  </p>
                </div>

                {regError && (
                  <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{regError}</span>
                  </div>
                )}

                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Company / Fleet Name *
                    </label>
                    <input
                      type="text"
                      value={regCompanyName}
                      onChange={e => setRegCompanyName(e.target.value)}
                      placeholder="e.g., Summit Logistics & Infrastructure Ltd."
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
                        Work Email (Credentials will be sent here) *
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
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={regPhone}
                      onChange={e => setRegPhone(e.target.value)}
                      placeholder="+880 1700-000000"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                      required
                    />
                  </div>

                  {/* Plan Selector inside Modal */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-2">
                      Select Subscription Tier:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {OFFICIAL_SUBSCRIPTION_PLANS.map(p => {
                        const isSelected = selectedPlanId === p.id;
                        return (
                          <div
                            key={p.id}
                            onClick={() => setSelectedPlanId(p.id)}
                            className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                              isSelected
                                ? 'bg-amber-500/10 border-amber-500 text-white shadow-xs ring-1 ring-amber-500/30'
                                : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                                  isSelected ? 'border-amber-400 bg-amber-400' : 'border-slate-500'
                                }`}
                              >
                                {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                              </div>
                              <span className="font-bold">{p.name_en || p.nameEn || p.name_bn}</span>
                            </div>
                            <span className="font-black text-amber-400">
                              {p.price_bdt === 0 ? 'Free' : `${p.price_bdt} BDT`}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Selected Plan Summary */}
                  {(() => {
                    const currentPlan = OFFICIAL_SUBSCRIPTION_PLANS.find(p => p.id === selectedPlanId) || OFFICIAL_SUBSCRIPTION_PLANS[0];
                    return (
                      <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                        <div>
                          <span className="text-slate-400 block text-[11px]">Payable Amount:</span>
                          <span className="text-base font-black text-amber-400">
                            {currentPlan.price_bdt === 0 ? '0 BDT (Free Trial)' : `${currentPlan.price_bdt.toLocaleString()} BDT`}
                          </span>
                        </div>
                        <div className="text-right text-[11px] text-slate-400">
                          <span className="block font-bold text-slate-200">{currentPlan.name_en || currentPlan.nameEn || currentPlan.name_bn}</span>
                          <span className="text-emerald-400">All Modules & Analytics Unlocked</span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Submit Actions */}
                  <div className="pt-2">
                    {(() => {
                      const currentPlan = OFFICIAL_SUBSCRIPTION_PLANS.find(p => p.id === selectedPlanId) || OFFICIAL_SUBSCRIPTION_PLANS[0];
                      return (
                        <button
                          type="submit"
                          disabled={regLoading}
                          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                        >
                          <CreditCard className="w-4 h-4" />
                          <span>
                            {regLoading
                              ? 'Provisioning Workspace...'
                              : currentPlan.is_trial
                              ? 'Start 3-Day Free Trial'
                              : 'Proceed to Secure Payment'}
                          </span>
                        </button>
                      );
                    })()}
                  </div>
                </form>
              </>
            ) : (
              /* Success Confirmation Popup: Pending Master Admin Review & Approval */
              <div className="text-center py-4">
                <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto mb-3 shadow-lg shadow-amber-500/10">
                  <Clock className="w-8 h-8" />
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold mb-3">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Pending Administrator Review & Approval</span>
                </div>

                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-1">
                  {regSuccessResult.isTrial ? 'Free Trial Application Submitted Successfully!' : 'Payment & Subscription Application Submitted!'}
                </h3>

                <p className="text-xs font-semibold text-slate-400 mb-4">
                  {regSuccessResult.companyName} &bull; {regSuccessResult.planName}
                </p>

                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-5 text-left text-xs mb-5 space-y-3.5">
                  <div className="space-y-2">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Registration Application Summary:
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">Company Name</span>
                        <span className="text-white font-bold">{regSuccessResult.companyName}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">Contact Person</span>
                        <span className="text-white font-medium">{regSuccessResult.adminName || 'Admin'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">Email Address</span>
                        <span className="text-white font-mono break-all">{regSuccessResult.email}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">Phone Number</span>
                        <span className="text-white font-mono">{regSuccessResult.phone || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">Selected Plan</span>
                        <span className="text-amber-400 font-bold">{regSuccessResult.planName}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">Payment / Status</span>
                        <span className="text-emerald-400 font-bold">
                          {regSuccessResult.isTrial ? '3-Day Free Trial' : `${(regSuccessResult.paymentMethod || 'Online').toUpperCase()} (TrxID: ${regSuccessResult.transactionId})`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Informational Message about Manual Master Approval & Direct Email */}
                  <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-200 text-xs flex items-start gap-2.5">
                    <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <span className="font-bold text-white block">Approval & Activation Process (Next Steps)</span>
                      <p className="leading-relaxed text-slate-300">
                        Your registration has been submitted successfully to Master Control. Our system administrator will review your application{regSuccessResult.isTrial ? '' : ' and verify payment reference'} to activate your workspace.
                      </p>
                      <p className="leading-relaxed text-amber-300 font-medium">
                        👉 Once approved, your dedicated login portal link, super admin username, and secure password will be dispatched to your email (<span className="underline text-white font-mono">{regSuccessResult.email}</span>).
                      </p>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 text-center pt-1 border-t border-slate-800">
                    For onboarding assistance or expedited activation, contact: <span className="text-white font-semibold">+880 1700-000000</span> or <span className="text-amber-400 font-mono">admin@fuelnest.xyz</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsRegisterOpen(false);
                    setRegSuccessResult(null);
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Got it, Close Window</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PAYMENT GATEWAY POPUP MODAL (Problem 2 Fix: Modal Popup instead of New Tab) */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl relative max-h-[92vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={() => {
                if (!paymentSubmitting) setIsPaymentModalOpen(false);
              }}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-30"
              disabled={paymentSubmitting}
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="mb-5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold mb-2">
                <Lock className="w-3.5 h-3.5" />
                <span>Secure Commercial Checkout</span>
              </div>
              <h3 className="text-xl font-black text-white">Payment & Plan Activation</h3>
              <p className="text-xs text-slate-400 mt-1">
                Complete transaction to finalize setup and receive your Super Admin credentials.
              </p>
            </div>

            {/* Plan & Amount Summary Card */}
            {(() => {
              const currentPlan = OFFICIAL_SUBSCRIPTION_PLANS.find(p => p.id === selectedPlanId) || OFFICIAL_SUBSCRIPTION_PLANS[1];
              return (
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 mb-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-slate-400 block font-medium">Selected Tier:</span>
                      <span className="text-sm font-black text-white">{currentPlan.name_en || currentPlan.nameEn}</span>
                      <span className="text-[11px] text-slate-400 block mt-0.5 font-mono">
                        {regCompanyName || 'Fleet Organization'} &bull; {regAdminName}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-slate-400 block">Total Payable:</span>
                      <span className="text-xl font-black text-amber-400">
                        {currentPlan.price_bdt.toLocaleString()} BDT
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Payment Method Selector Tabs */}
            <div className="mb-5">
              <label className="block text-xs font-bold text-slate-300 mb-2">
                Choose Payment Method:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                {[
                  { id: 'bkash', name: 'bKash', isAvailable: true },
                  { id: 'nagad', name: 'Nagad', isAvailable: true },
                  { id: 'rocket', name: 'Rocket', isAvailable: false },
                  { id: 'card', name: 'Cards', isAvailable: false },
                  { id: 'bank', name: 'Bank', isAvailable: false }
                ].map(m => {
                  const isSelected = selectedPaymentMethod === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedPaymentMethod(m.id as any)}
                      className={`py-2 px-1.5 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                        isSelected
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-black'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                      }`}
                    >
                      <span>{m.name}</span>
                      {!m.isAvailable && (
                        <span className={`text-[9px] font-mono leading-none ${isSelected ? 'text-slate-950 font-bold' : 'text-slate-500'}`}>
                          Not Available
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dynamic Payment Details & Instructions */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 mb-5 space-y-3">
              {selectedPaymentMethod === 'bkash' && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-300">bKash Personal / Merchant:</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText('01903200907');
                        setCopiedNumber('bkash');
                        setTimeout(() => setCopiedNumber(null), 2000);
                      }}
                      className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-mono cursor-pointer"
                    >
                      {copiedNumber === 'bkash' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedNumber === 'bkash' ? 'Copied' : 'Copy Number'}</span>
                    </button>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs font-bold text-white flex items-center justify-between">
                    <span className="text-amber-400 text-sm">01903200907</span>
                    <span className="text-[10px] text-pink-400 font-sans font-medium">bKash Send Money / Payment</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                    1. Dial *247# or open the bKash App.<br />
                    2. Send the exact plan amount to <strong className="text-white font-mono">01903200907</strong>.<br />
                    3. Enter your Transaction ID (TrxID) below and click Confirm.
                  </p>
                </div>
              )}

              {selectedPaymentMethod === 'nagad' && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-300">Nagad Personal / Account:</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText('01775316434');
                        setCopiedNumber('nagad');
                        setTimeout(() => setCopiedNumber(null), 2000);
                      }}
                      className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-mono cursor-pointer"
                    >
                      {copiedNumber === 'nagad' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedNumber === 'nagad' ? 'Copied' : 'Copy Number'}</span>
                    </button>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs font-bold text-white flex items-center justify-between">
                    <span className="text-amber-400 text-sm">01775316434</span>
                    <span className="text-[10px] text-orange-400 font-sans font-medium">Nagad Send Money</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                    1. Dial *167# or open the Nagad App.<br />
                    2. Send the exact plan amount to <strong className="text-white font-mono">01775316434</strong>.<br />
                    3. Enter your Transaction ID (TrxID) below and click Confirm.
                  </p>
                </div>
              )}

              {selectedPaymentMethod === 'rocket' && (
                <div className="py-3 px-2 text-center space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-amber-400 text-xs font-bold">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Not Available</span>
                  </div>
                  <p className="text-xs text-slate-300 font-semibold">
                    DBBL Rocket is currently Not Available.
                  </p>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Please use{' '}
                    <button
                      type="button"
                      onClick={() => setSelectedPaymentMethod('bkash')}
                      className="text-pink-400 font-bold underline hover:text-pink-300 cursor-pointer"
                    >
                      bKash (01903200907)
                    </button>{' '}
                    or{' '}
                    <button
                      type="button"
                      onClick={() => setSelectedPaymentMethod('nagad')}
                      className="text-amber-400 font-bold underline hover:text-amber-300 cursor-pointer"
                    >
                      Nagad (01775316434)
                    </button>{' '}
                    to complete your subscription.
                  </p>
                </div>
              )}

              {selectedPaymentMethod === 'card' && (
                <div className="py-3 px-2 text-center space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-amber-400 text-xs font-bold">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Not Available</span>
                  </div>
                  <p className="text-xs text-slate-300 font-semibold">
                    Online Card payment is currently Not Available.
                  </p>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Please use{' '}
                    <button
                      type="button"
                      onClick={() => setSelectedPaymentMethod('bkash')}
                      className="text-pink-400 font-bold underline hover:text-pink-300 cursor-pointer"
                    >
                      bKash (01903200907)
                    </button>{' '}
                    or{' '}
                    <button
                      type="button"
                      onClick={() => setSelectedPaymentMethod('nagad')}
                      className="text-amber-400 font-bold underline hover:text-amber-300 cursor-pointer"
                    >
                      Nagad (01775316434)
                    </button>{' '}
                    to complete your subscription.
                  </p>
                </div>
              )}

              {selectedPaymentMethod === 'bank' && (
                <div className="py-3 px-2 text-center space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-amber-400 text-xs font-bold">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Not Available</span>
                  </div>
                  <p className="text-xs text-slate-300 font-semibold">
                    Direct Bank Transfer is currently Not Available.
                  </p>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Please use{' '}
                    <button
                      type="button"
                      onClick={() => setSelectedPaymentMethod('bkash')}
                      className="text-pink-400 font-bold underline hover:text-pink-300 cursor-pointer"
                    >
                      bKash (01903200907)
                    </button>{' '}
                    or{' '}
                    <button
                      type="button"
                      onClick={() => setSelectedPaymentMethod('nagad')}
                      className="text-amber-400 font-bold underline hover:text-amber-300 cursor-pointer"
                    >
                      Nagad (01775316434)
                    </button>{' '}
                    to complete your subscription.
                  </p>
                </div>
              )}

            </div>

            {/* Step A: Before clicking Pay Now (No TrxID, No Confirm button) */}
            {!hasClickedPayNow ? (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    const currentPlan = OFFICIAL_SUBSCRIPTION_PLANS.find(p => p.id === selectedPlanId) || OFFICIAL_SUBSCRIPTION_PLANS[1];
                    if (currentPlan.payment_url) {
                      window.open(currentPlan.payment_url, '_blank');
                    }
                    setHasClickedPayNow(true);
                  }}
                  className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer transform active:scale-[0.99]"
                >
                  <CreditCard className="w-4 h-4 text-slate-950" />
                  <span>Pay Now</span>
                  <ExternalLink className="w-3.5 h-3.5 ml-1" />
                </button>

                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="w-full py-2.5 text-center text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                >
                  Cancel and return
                </button>
              </div>
            ) : (
              /* Step B: After clicking Pay Now (Reveals TrxID input & Confirm button) */
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                {/* Gateway Launched Guidance Banner */}
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-white block">Payment Gateway Launched</span>
                      <span className="text-[11px] text-slate-300 leading-relaxed block mt-0.5">
                        Please finish your transaction. Then copy the Transaction ID (TrxID) and enter it below to activate your workspace.
                      </span>
                    </div>
                  </div>
                  {(() => {
                    const currentPlan = OFFICIAL_SUBSCRIPTION_PLANS.find(p => p.id === selectedPlanId) || OFFICIAL_SUBSCRIPTION_PLANS[1];
                    if (currentPlan.payment_url) {
                      return (
                        <button
                          type="button"
                          onClick={() => window.open(currentPlan.payment_url, '_blank')}
                          className="shrink-0 text-[11px] font-bold text-amber-400 hover:text-amber-300 underline cursor-pointer"
                        >
                          Re-open Link
                        </button>
                      );
                    }
                    return null;
                  })()}
                </div>

                {/* Transaction ID / Reference Input */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Transaction ID / Payment Reference (TrxID) *
                  </label>
                  <input
                    type="text"
                    value={paymentTrxId}
                    onChange={e => setPaymentTrxId(e.target.value)}
                    placeholder="e.g., 9J47AB12CD"
                    autoFocus
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                {/* Payment Error message */}
                {paymentError && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{paymentError}</span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handlePaymentConfirm}
                    disabled={paymentSubmitting}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {paymentSubmitting ? (
                      <span>Verifying Transaction & Provisioning...</span>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Confirm & Complete Payment</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsPaymentModalOpen(false)}
                    disabled={paymentSubmitting}
                    className="w-full py-2.5 text-center text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                  >
                    Cancel and return
                  </button>
                </div>
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
