import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { OFFICIAL_SUBSCRIPTION_PLANS, SubscriptionPlanConfig } from '../types';
import { X, CheckCircle2, ShieldCheck, ArrowRight, CreditCard, Sparkles, ExternalLink } from 'lucide-react';

interface SubscriptionRenewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SubscriptionRenewModal: React.FC<SubscriptionRenewModalProps> = ({
  isOpen,
  onClose
}) => {
  const { currentTenant, language } = useApp();
  const [selectedPlanId, setSelectedPlanId] = useState<string>('plan_1month');
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const paidPlans = OFFICIAL_SUBSCRIPTION_PLANS.filter(p => !p.is_trial);
  const currentPlan = OFFICIAL_SUBSCRIPTION_PLANS.find(p => p.id === selectedPlanId) || paidPlans[0];

  const handleProceedPayment = () => {
    if (currentPlan.payment_url) {
      window.open(currentPlan.payment_url, '_blank');
    }
    setIsSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-2xl bg-white dark:bg-[#0c1324] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {!isSubmitted ? (
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                  Renew or Upgrade Subscription
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {currentTenant?.name} &bull; Full Options & Features Unlocked
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 mt-3 mb-5">
              Select your preferred subscription plan and proceed to secure payment. Your workspace validity will be updated immediately upon confirmation.
            </p>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {paidPlans.map(plan => {
                const isSelected = plan.id === selectedPlanId;
                return (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={`cursor-pointer rounded-2xl p-4 border transition-all relative ${
                      isSelected
                        ? 'border-amber-500 bg-amber-500/5 dark:bg-amber-500/10 shadow-md ring-2 ring-amber-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50'
                    }`}
                  >
                    {plan.badge && (
                      <span className="absolute top-3 right-3 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 whitespace-nowrap shadow-xs">
                        {plan.badge}
                      </span>
                    )}

                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected ? 'border-amber-500 bg-amber-500' : 'border-slate-400'
                        }`}
                      >
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {plan.name_en || plan.nameEn || plan.id}
                      </h4>
                    </div>

                    <div className="flex items-baseline gap-1 my-2">
                      <span className="text-2xl font-black text-slate-900 dark:text-amber-400">
                        {plan.price_bdt.toLocaleString()}
                      </span>
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        BDT
                      </span>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500">
                        / {plan.duration_days} days
                      </span>
                    </div>

                    <ul className="space-y-1.5 text-[11px] text-slate-600 dark:text-slate-300 mt-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                      {plan.features.slice(0, 3).map((feat, idx) => (
                        <li key={idx} className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>

            {/* Payment Call to Action */}
            <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                  Total Amount Due:
                </span>
                <span className="text-lg font-black text-slate-900 dark:text-amber-400">
                  {currentPlan.price_bdt.toLocaleString()} BDT
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 ml-1.5">
                  ({currentPlan.name_en || currentPlan.nameEn || 'Subscription Plan'})
                </span>
              </div>

              <button
                onClick={handleProceedPayment}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <CreditCard className="w-4 h-4" />
                <span>Proceed to Payment</span>
                <ExternalLink className="w-3.5 h-3.5 ml-1" />
              </button>
            </div>
          </div>
        ) : (
          /* Thank You Screen */
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500 mx-auto mb-4">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">
              Thank You! Request Received
            </h3>

            <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto mb-6 leading-relaxed">
              The secure payment link has been opened. Once your payment is complete, our team will verify and update your subscription validity.
            </p>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left text-xs space-y-2 mb-6 max-w-md mx-auto">
              <div className="flex justify-between">
                <span className="text-slate-500">Company:</span>
                <span className="font-bold text-slate-900 dark:text-white">{currentTenant?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Plan:</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">{currentPlan.name_en || currentPlan.nameEn}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Amount:</span>
                <span className="font-bold text-slate-900 dark:text-white">{currentPlan.price_bdt} BDT</span>
              </div>
            </div>

            <button
              onClick={() => {
                setIsSubmitted(false);
                onClose();
              }}
              className="px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 text-white font-bold text-xs hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
            >
              Close Window
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
