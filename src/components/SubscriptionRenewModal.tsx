import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { OFFICIAL_SUBSCRIPTION_PLANS } from '../types';
import {
  X,
  CheckCircle2,
  Copy,
  Check,
  CreditCard,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building2,
  Smartphone,
  Calendar,
  DollarSign,
  AlertCircle
} from 'lucide-react';

interface SubscriptionRenewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SubscriptionRenewModal: React.FC<SubscriptionRenewModalProps> = ({
  isOpen,
  onClose
}) => {
  const { currentTenant, currentUser, submitSubscriptionPayment } = useApp();
  const [selectedPlanId, setSelectedPlanId] = useState<string>('plan_1month');
  const [paymentMethod, setPaymentMethod] = useState<'bkash' | 'nagad' | 'rocket' | 'bank'>('bkash');
  const [senderNumber, setSenderNumber] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedDetails, setSubmittedDetails] = useState<any>(null);

  if (!isOpen) return null;

  const paidPlans = OFFICIAL_SUBSCRIPTION_PLANS.filter(p => !p.is_trial);
  const currentPlan = OFFICIAL_SUBSCRIPTION_PLANS.find(p => p.id === selectedPlanId) || paidPlans[0];

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transactionId.trim() || !senderNumber.trim()) {
      setSubmitError('Please provide your sender account number and Transaction ID (TrxID).');
      return;
    }
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const res = await submitSubscriptionPayment({
        tenant_id: currentTenant.id,
        tenant_name: currentTenant.name,
        user_id: currentUser.id,
        user_name: currentUser.name,
        user_email: currentUser.email || currentTenant.email || '',
        user_phone: currentTenant.phone || '',
        plan_id: currentPlan.id,
        plan_name: currentPlan.name_en || currentPlan.nameEn || 'Subscription Plan',
        plan_days: currentPlan.duration_days,
        amount_bdt: currentPlan.price_bdt,
        payment_method: paymentMethod,
        sender_number: senderNumber.trim(),
        transaction_id: transactionId.trim().toUpperCase(),
        payment_date: paymentDate,
        notes: notes.trim()
      });

      setIsSubmitting(false);
      if (res.success) {
        setSubmittedDetails({
          trxId: transactionId.trim().toUpperCase(),
          method: paymentMethod,
          amount: currentPlan.price_bdt,
          plan: currentPlan.name_en || currentPlan.nameEn,
          days: currentPlan.duration_days
        });
        setIsSubmitted(true);
      } else {
        setSubmitError(res.message || 'Payment submission failed.');
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setSubmitError(err?.message || 'Error submitting payment.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-2xl bg-white dark:bg-[#0c1324] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl relative max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {!isSubmitted ? (
          <div>
            {/* Header */}
            <div className="flex items-center gap-2.5 mb-2">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                  Renew or Upgrade Subscription
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {currentTenant?.name} &bull; Valid Until: <strong className="text-amber-600 dark:text-amber-400">{currentTenant?.subscription?.end_date || 'N/A'}</strong>
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 mb-4">
              Select your package, transfer payment via bKash, Nagad, Rocket or Bank, then submit your transaction ID. Master Control will match and extend your validity immediately.
            </p>

            {/* Step 1: Select Plan */}
            <div className="mb-4">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
                1. Select Subscription Package:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {paidPlans.map(plan => {
                  const isSelected = plan.id === selectedPlanId;
                  return (
                    <div
                      key={plan.id}
                      onClick={() => setSelectedPlanId(plan.id)}
                      className={`cursor-pointer rounded-xl p-3 border text-center transition-all relative ${
                        isSelected
                          ? 'border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/30 shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50'
                      }`}
                    >
                      {plan.badge && (
                        <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] font-black px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 shadow-xs whitespace-nowrap">
                          {plan.badge}
                        </span>
                      )}
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-1">
                        {plan.duration_days} Days
                      </h4>
                      <div className="text-sm font-black text-amber-600 dark:text-amber-400 my-0.5">
                        {plan.price_bdt.toLocaleString()} BDT
                      </div>
                      <span className="text-[10px] text-slate-400 block truncate">
                        {plan.name_en || plan.nameEn}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Choose Payment Method & Official Numbers */}
            <div className="mb-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  2. FuelNest Official Payment Accounts (Send Money / Transfer):
                </span>
                <span className="text-xs font-black text-amber-600 dark:text-amber-400">
                  Total: {currentPlan.price_bdt.toLocaleString()} BDT
                </span>
              </div>

              {/* Payment Channel Pills */}
              <div className="grid grid-cols-4 gap-2 mb-3">
                {[
                  { id: 'bkash', name: 'bKash', color: 'bg-pink-600 text-white' },
                  { id: 'nagad', name: 'Nagad', color: 'bg-orange-600 text-white' },
                  { id: 'rocket', name: 'Rocket', color: 'bg-purple-600 text-white' },
                  { id: 'bank', name: 'Bank Transfer', color: 'bg-emerald-600 text-white' }
                ].map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id as any)}
                    className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      paymentMethod === m.id
                        ? `${m.color} border-transparent shadow-sm ring-2 ring-offset-1 ring-amber-500`
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {m.name}
                  </button>
                ))}
              </div>

              {/* Selected Account Instruction Card */}
              {paymentMethod === 'bkash' && (
                <div className="p-3 rounded-xl bg-pink-50 dark:bg-pink-950/30 border border-pink-200 dark:border-pink-900/50 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-pink-700 dark:text-pink-400 block">
                      bKash Personal (Send Money)
                    </span>
                    <span className="font-mono font-black text-sm text-slate-900 dark:text-white">
                      01712-345678
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Send exactly <strong>{currentPlan.price_bdt} BDT</strong> and save the TrxID.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy('01712345678', 'bkash')}
                    className="px-2.5 py-1.5 rounded-lg bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0 shadow-xs"
                  >
                    {copiedKey === 'bkash' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'bkash' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              )}

              {paymentMethod === 'nagad' && (
                <div className="p-3 rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/50 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-orange-700 dark:text-orange-400 block">
                      Nagad Personal (Send Money)
                    </span>
                    <span className="font-mono font-black text-sm text-slate-900 dark:text-white">
                      01812-345678
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Send <strong>{currentPlan.price_bdt} BDT</strong> via Nagad Send Money.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy('01812345678', 'nagad')}
                    className="px-2.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0 shadow-xs"
                  >
                    {copiedKey === 'nagad' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'nagad' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              )}

              {paymentMethod === 'rocket' && (
                <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-purple-700 dark:text-purple-400 block">
                      Rocket Personal (Send Money)
                    </span>
                    <span className="font-mono font-black text-sm text-slate-900 dark:text-white">
                      01912-345678-9
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Send <strong>{currentPlan.price_bdt} BDT</strong> to our Rocket account.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy('019123456789', 'rocket')}
                    className="px-2.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0 shadow-xs"
                  >
                    {copiedKey === 'rocket' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'rocket' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              )}

              {paymentMethod === 'bank' && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 block">
                      Islami Bank Bangladesh Ltd (IBBL / NPSB / BEFTN)
                    </span>
                    <span className="font-mono font-black text-sm text-slate-900 dark:text-white block">
                      A/C: 205021234567890
                    </span>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300">
                      Title: <strong>FuelNest Fleet Technologies</strong> | Branch: <strong>Gulshan, Dhaka</strong> | Routing: <strong>125271890</strong>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy('205021234567890', 'bank')}
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0 shadow-xs"
                  >
                    {copiedKey === 'bank' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'bank' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Step 3: Payment Verification Submission Form */}
            <form onSubmit={handleSubmitPayment} className="space-y-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                3. Enter Payment Verification Details:
              </span>

              {submitError && (
                <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-300 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Sender Account / Mobile Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 017XXXXXXXX"
                    value={senderNumber}
                    onChange={e => setSenderNumber(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono font-bold focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Transaction ID (TrxID) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BL8910XY9Z"
                    value={transactionId}
                    onChange={e => setTransactionId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-amber-400 dark:border-amber-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono uppercase font-black focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Amount Paid (BDT)
                  </label>
                  <input
                    type="number"
                    readOnly
                    value={currentPlan.price_bdt}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-black"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Payment Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={e => setPaymentDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Reference Note (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Upgraded from 3-day trial / Renewal slip"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>
                    {isSubmitting
                      ? 'Submitting Verification...'
                      : `Submit Payment Verification (${currentPlan.price_bdt} BDT)`}
                  </span>
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Confirmation Screen */
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500 mx-auto mb-4">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">
              Payment Verification Submitted!
            </h3>

            <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto mb-5 leading-relaxed">
              Your manual payment verification has been submitted to Master Control. Once matched with the account statement, your validity will be extended by <strong>+{submittedDetails?.days} days</strong>.
            </p>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left text-xs space-y-2 mb-6 max-w-md mx-auto">
              <div className="flex justify-between">
                <span className="text-slate-500">Company:</span>
                <span className="font-bold text-slate-900 dark:text-white">{currentTenant?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Requested Plan:</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">{submittedDetails?.plan}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Channel:</span>
                <span className="font-bold uppercase text-slate-900 dark:text-white">{submittedDetails?.method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Transaction ID (TrxID):</span>
                <span className="font-mono font-black text-amber-600 dark:text-amber-400">{submittedDetails?.trxId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Amount Paid:</span>
                <span className="font-bold text-slate-900 dark:text-white">{submittedDetails?.amount} BDT</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                <span className="text-slate-500">Verification Status:</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400 animate-pulse">
                  ⏳ Awaiting Master Control Approval
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setIsSubmitted(false);
                onClose();
              }}
              className="px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 text-white font-bold text-xs hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Done & Close Window
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
