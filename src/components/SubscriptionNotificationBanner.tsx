import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, AlertTriangle, Clock, ArrowRight, ShieldCheck, X } from 'lucide-react';
import { OFFICIAL_SUBSCRIPTION_PLANS } from '../types';

interface SubscriptionNotificationBannerProps {
  onOpenRenewModal: () => void;
}

export const SubscriptionNotificationBanner: React.FC<SubscriptionNotificationBannerProps> = ({
  onOpenRenewModal
}) => {
  const { currentTenant, activeAuthRole, language } = useApp();
  const [isDismissed, setIsDismissed] = useState(false);

  // Do not show subscription banner for SaaS Owner or SaaS Moderator in control mode
  if (activeAuthRole === 'saas_owner' || activeAuthRole === 'saas_moderator') {
    return null;
  }

  const subscription = currentTenant?.subscription;
  if (!subscription) return null;

  const planId = (subscription.plan || '').toLowerCase();
  const isTrial = planId.includes('trial');
  
  // Calculate days remaining
  let daysRemaining = 0;
  let isExpired = false;
  
  if (subscription.end_date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(subscription.end_date);
    end.setHours(0, 0, 0, 0);
    const diffTime = end.getTime() - today.getTime();
    daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (daysRemaining < 0) {
      isExpired = true;
    }
  }

  // 1. Trial Plan: ALWAYS show notification
  if (isTrial) {
    return (
      <aside aria-label="Trial Plan Alert" className="w-full bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent border-y border-amber-500/30 px-3 sm:px-6 py-2 transition-all">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-medium">
            <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            <span>
              <strong className="font-bold">Trial Plan Active:</strong> You are currently on a 3-Day Free Trial.
              {isExpired ? (
                <span className="text-red-500 dark:text-red-400 font-bold ml-1"> (Trial Expired)</span>
              ) : (
                <span className="text-amber-700 dark:text-amber-400 ml-1">
                  (<strong className="font-bold">{daysRemaining}</strong> days left)
                </span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenRenewModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-xs transition-all transform active:scale-95 cursor-pointer"
            >
              <span>Upgrade to Premium</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>
    );
  }

  // 2. Premium Paid Plan: Show warning starting 7 days before expiration
  // If more than 7 days left and not dismissed, do not render banner
  if (daysRemaining > 7 && !isExpired) {
    return null;
  }

  // If dismissed by user in this session, do not render unless expired
  if (isDismissed && !isExpired) {
    return null;
  }

  return (
    <aside aria-label="Subscription Expiry Alert" className="w-full bg-gradient-to-r from-red-500/15 via-amber-500/15 to-transparent border-y border-amber-500/40 px-3 sm:px-6 py-2 transition-all">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2.5 text-xs">
        <div className="flex items-center gap-2 text-slate-900 dark:text-amber-200 font-medium">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 animate-bounce" />
          <span>
            <strong className="font-bold text-red-600 dark:text-red-400">Subscription Notice:</strong> Your subscription plan{' '}
            {isExpired ? (
              <strong className="text-red-600 dark:text-red-400">has expired!</strong>
            ) : (
              <>
                has only <strong className="text-amber-600 dark:text-amber-400 font-bold text-sm underline">{daysRemaining} days</strong> remaining.
              </>
            )}{' '}
            Please update or renew your plan to avoid disruption.
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenRenewModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-xs transition-all transform active:scale-95 cursor-pointer"
          >
            <span>Renew Subscription</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          {!isExpired && (
            <button
              onClick={() => setIsDismissed(true)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              title="Dismiss for now"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
