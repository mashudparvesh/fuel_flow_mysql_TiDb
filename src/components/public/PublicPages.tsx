import React, { useState, useEffect } from 'react';
import {
  Fuel,
  Mail,
  Phone,
  MessageSquare,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Send,
  Sparkles,
  HelpCircle,
  FileText,
  Lock,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  ExternalLink,
  Crown,
  User,
  Menu,
  X
} from 'lucide-react';
import { DEFAULT_SITE_CONTENT, SiteContentConfig } from '../../data/defaultSiteContent';

interface PublicPagesProps {
  currentView: 'about' | 'contact' | 'privacy' | 'terms' | 'faq';
  onNavigate: (view: 'landing' | 'about' | 'contact' | 'privacy' | 'terms' | 'faq' | 'login') => void;
  onOpenRegister?: () => void;
}

export const PublicPages: React.FC<PublicPagesProps> = ({
  currentView,
  onNavigate,
  onOpenRegister
}) => {
  const [content, setContent] = useState<SiteContentConfig>(DEFAULT_SITE_CONTENT);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Contact Form State
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formCompany, setFormCompany] = useState('');
  const [formSubject, setFormSubject] = useState('General Inquiry');
  const [formMessage, setFormMessage] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState('');
  const [formError, setFormError] = useState('');

  // FAQ Accordion State
  const [openFaqId, setOpenFaqId] = useState<string | null>('faq-1');
  const [faqCategory, setFaqCategory] = useState<string>('All');

  // Load dynamic content from server
  useEffect(() => {
    fetch('/api/public/content')
      .then(r => r.json())
      .then(d => {
        if (d.success && d.content) {
          setContent(d.content);
        }
      })
      .catch(() => {});
  }, []);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!formName.trim() || !formEmail.trim() || !formMessage.trim()) {
      setFormError('Please fill in your name, email, and message.');
      return;
    }

    setFormSubmitting(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName.trim(),
          email: formEmail.trim(),
          phone: formPhone.trim(),
          company_name: formCompany.trim(),
          subject: formSubject.trim(),
          message: formMessage.trim()
        })
      });
      const data = await res.json();
      setFormSubmitting(false);

      if (data.success) {
        setFormSuccess(data.message || 'Your message has been sent to admin.fuelnest@gmail.com! We will reply promptly.');
        setFormName('');
        setFormEmail('');
        setFormPhone('');
        setFormCompany('');
        setFormMessage('');
      } else {
        setFormError(data.message || 'Failed to submit contact form. Please try again.');
      }
    } catch (err: any) {
      setFormSubmitting(false);
      setFormError(err?.message || 'Network error submitting contact request.');
    }
  };

  const navLinks: Array<{ id: 'about' | 'contact' | 'faq' | 'privacy' | 'terms'; label: string }> = [
    { id: 'about', label: 'About Us' },
    { id: 'contact', label: 'Contact Us' },
    { id: 'faq', label: 'FAQ' },
    { id: 'privacy', label: 'Privacy Policy' },
    { id: 'terms', label: 'Terms of Service' }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans overflow-x-hidden w-full max-w-full relative selection:bg-amber-500 selection:text-slate-950">
      {/* Background Ambience / Glows */}
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* TOP NAVBAR */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-slate-950/85 border-b border-slate-800/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          {/* Logo & Brand (Click to Home) */}
          <button
            type="button"
            onClick={() => onNavigate('landing')}
            className="flex items-center gap-2.5 sm:gap-3.5 text-left cursor-pointer group"
          >
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 ring-1 ring-amber-400/30 group-hover:scale-105 transition-transform flex-shrink-0">
              <Fuel className="w-5 h-5 sm:w-6 sm:h-6 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-lg sm:text-xl font-black tracking-tight text-white group-hover:text-amber-400 transition-colors">FuelNest</span>
                <span className="hidden sm:inline-flex text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                  Enterprise Fleet
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 hidden sm:block">
                Fleet & Fuel Commercial Intelligence
              </p>
            </div>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-semibold text-slate-300">
            <button
              onClick={() => onNavigate('landing')}
              className="hover:text-amber-400 transition-colors cursor-pointer"
            >
              Home
            </button>
            {navLinks.map(link => (
              <button
                key={link.id}
                onClick={() => onNavigate(link.id)}
                className={`transition-colors cursor-pointer ${
                  currentView === link.id
                    ? 'text-amber-400 font-bold underline underline-offset-4 decoration-amber-400'
                    : 'hover:text-amber-400'
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Desktop Action Buttons */}
          <div className="hidden md:flex items-center gap-2.5">
            <button
              onClick={() => onOpenRegister ? onOpenRegister() : onNavigate('landing')}
              className="flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs sm:text-sm font-black shadow-lg shadow-amber-500/20 transition-all transform active:scale-95 cursor-pointer"
            >
              <Crown className="w-4 h-4" />
              <span>3-Day Free Trial</span>
            </button>
            <button
              onClick={() => onNavigate('login')}
              className="flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 border border-amber-500/30 hover:border-amber-500/60 text-xs sm:text-sm font-black shadow-md transition-all transform active:scale-95 cursor-pointer"
            >
              <User className="w-4 h-4" />
              <span>Sign In</span>
            </button>
          </div>

          {/* Mobile Right Controls */}
          <div className="flex md:hidden items-center gap-1.5 flex-shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('login')}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 text-amber-400 border border-amber-500/30 text-xs font-bold active:scale-95 transition-all cursor-pointer"
            >
              <User className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>

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
          <div className="md:hidden border-t border-slate-800 bg-slate-950/95 backdrop-blur-2xl px-4 py-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex flex-col space-y-1 text-sm font-semibold text-slate-300">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onNavigate('landing');
                }}
                className="text-left px-3 py-2 rounded-lg hover:bg-slate-900 hover:text-amber-400 transition-colors"
              >
                Home
              </button>
              {navLinks.map(link => (
                <button
                  key={link.id}
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onNavigate(link.id);
                  }}
                  className={`text-left px-3 py-2 rounded-lg hover:bg-slate-900 hover:text-amber-400 transition-colors ${
                    currentView === link.id ? 'text-amber-400 font-bold bg-slate-900' : ''
                  }`}
                >
                  {link.label}
                </button>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-800/80 space-y-2">
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  if (onOpenRegister) onOpenRegister();
                  else onNavigate('landing');
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
                  onNavigate('login');
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900 border border-slate-800 text-amber-400 font-bold text-sm hover:border-slate-700 active:scale-98 cursor-pointer"
              >
                <User className="w-4 h-4" />
                <span>Sign In to Existing Workspace</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 w-full">
        {/* =========================================================================
            1. ABOUT US VIEW
           ========================================================================= */}
        {currentView === 'about' && (
          <div className="space-y-16 animate-in fade-in duration-300">
            {/* Header */}
            <div className="text-center max-w-3xl mx-auto space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>About FuelNest Technologies</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                {content.about.title}
              </h1>
              <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
                {content.about.subtitle}
              </p>
            </div>

            {/* Story & Problem Statement */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-slate-900/60 border border-slate-800 p-6 sm:p-10 rounded-3xl backdrop-blur-sm">
              <div className="space-y-4">
                <h2 className="text-xl sm:text-2xl font-black text-white">Why We Built FuelNest</h2>
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                  {content.about.story_p1}
                </p>
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                  {content.about.story_p2}
                </p>
              </div>

              <div className="bg-slate-950/80 border border-amber-500/20 p-6 rounded-2xl space-y-6">
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400 font-mono">Our Mission</span>
                  <p className="text-sm sm:text-base text-white font-semibold leading-relaxed">
                    "{content.about.mission}"
                  </p>
                </div>
                <div className="space-y-2 pt-4 border-t border-slate-800">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-400 font-mono">Our Vision</span>
                  <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                    {content.about.vision}
                  </p>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {content.about.stats.map((s, idx) => (
                <div key={idx} className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 text-center space-y-1">
                  <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">{s.value}</div>
                  <div className="text-xs font-bold text-white">{s.label}</div>
                  <div className="text-[11px] text-slate-400">{s.desc}</div>
                </div>
              ))}
            </div>

            {/* Core Values */}
            <div className="space-y-8">
              <div className="text-center max-w-2xl mx-auto space-y-2">
                <h3 className="text-2xl font-black text-white">Our Engineering Principles</h3>
                <p className="text-sm text-slate-400">Built to withstand the toughest industrial and remote infrastructure environments.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {content.about.core_values.map((v, idx) => (
                  <div key={idx} className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-amber-500/40 transition-all space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-amber-400" />
                      <h4 className="text-base font-bold text-white">{v.title}</h4>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pl-7">{v.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-950 border border-amber-500/30 text-center space-y-5">
              <h3 className="text-2xl sm:text-3xl font-black text-white">Ready to Secure Your Commercial Fleet?</h3>
              <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto">
                Join infrastructure contractors and transport fleets across Bangladesh cutting fuel theft and boosting equipment availability.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => onOpenRegister ? onOpenRegister() : onNavigate('landing')}
                  className="px-6 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  <Crown className="w-4 h-4" />
                  <span>Start 3-Day Free Trial</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('contact')}
                  className="px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm border border-slate-700 flex items-center gap-2 cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4 text-amber-400" />
                  <span>Contact Our Engineers</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            2. CONTACT US VIEW
           ========================================================================= */}
        {currentView === 'contact' && (
          <div className="space-y-12 animate-in fade-in duration-300">
            {/* Header */}
            <div className="text-center max-w-3xl mx-auto space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Direct Support & Inquiries</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                Contact FuelNest Operations
              </h1>
              <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
                Have questions about custom multi-depot deployment, equipment calibration, or enterprise pricing? Reach our dedicated support engineers directly.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Contact Info Cards (Left) */}
              <div className="lg:col-span-5 space-y-4">
                {/* 1. Official Email */}
                <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block font-medium">Official Administration Email</span>
                      <a
                        href={`mailto:${content.contact.email}`}
                        className="text-sm sm:text-base font-bold text-white hover:text-amber-400 transition-colors font-mono"
                      >
                        {content.contact.email}
                      </a>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 pl-13">
                    Inquiries are monitored 24/7. Average response time: under 2 hours.
                  </p>
                </div>

                {/* 2. WhatsApp Direct Chat */}
                <div className="p-5 rounded-2xl bg-slate-900/70 border border-emerald-500/30 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block font-medium">WhatsApp Support & Billing</span>
                      <div className="text-sm sm:text-base font-bold text-emerald-400 font-mono">
                        {content.contact.whatsapp}
                      </div>
                    </div>
                  </div>
                  <a
                    href={`https://wa.me/${content.contact.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Hello FuelNest Team, I would like to inquire about fleet workspace deployment.')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Open WhatsApp Chat Directly</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* 3. Direct Phone Hotlines */}
                <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block font-medium">Direct Telephone Lines</span>
                      <div className="text-sm font-bold text-white font-mono flex flex-wrap gap-2">
                        <a href={`tel:${content.contact.phone}`} className="hover:text-amber-400">
                          {content.contact.phone}
                        </a>
                        {content.contact.alt_phone && (
                          <>
                            <span className="text-slate-600">&bull;</span>
                            <a href={`tel:${content.contact.alt_phone}`} className="hover:text-amber-400">
                              {content.contact.alt_phone}
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Headquarters Address */}
                <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block font-medium">Operations Center</span>
                      <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                        {content.contact.address}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 5. Support Hours */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 text-xs text-slate-400 space-y-1">
                  <div className="flex items-center gap-2 text-slate-300 font-semibold">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Operating Hours</span>
                  </div>
                  <p>{content.contact.working_hours}</p>
                  <p className="text-[11px] text-amber-400/90 pt-1 font-medium">{content.contact.support_note}</p>
                </div>
              </div>

              {/* Interactive Contact Form (Right) */}
              <div className="lg:col-span-7 bg-slate-900/70 border border-slate-800 p-6 sm:p-8 rounded-3xl backdrop-blur-sm">
                <div className="mb-6 space-y-1">
                  <h3 className="text-xl font-black text-white">Send Us a Direct Message</h3>
                  <p className="text-xs sm:text-sm text-slate-400">
                    Submissions are dispatched directly to <strong className="text-amber-400">admin.fuelnest@gmail.com</strong>.
                  </p>
                </div>

                {formSuccess && (
                  <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm mb-6 flex items-start gap-3 animate-in fade-in">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <p className="leading-relaxed">{formSuccess}</p>
                  </div>
                )}

                {formError && (
                  <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs sm:text-sm mb-6 flex items-start gap-3 animate-in fade-in">
                    <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    <p className="leading-relaxed">{formError}</p>
                  </div>
                )}

                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">
                        Your Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formName}
                        onChange={e => setFormName(e.target.value)}
                        placeholder="e.g. Engr. Babul Hossain"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-amber-400 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={formEmail}
                        onChange={e => setFormEmail(e.target.value)}
                        placeholder="e.g. babul@company.com"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-amber-400 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">
                        Phone / WhatsApp
                      </label>
                      <input
                        type="tel"
                        value={formPhone}
                        onChange={e => setFormPhone(e.target.value)}
                        placeholder="e.g. 01775316434"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-amber-400 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">
                        Company / Project Name
                      </label>
                      <input
                        type="text"
                        value={formCompany}
                        onChange={e => setFormCompany(e.target.value)}
                        placeholder="e.g. Prema Logistics & Heavy Construction"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-amber-400 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Subject
                    </label>
                    <select
                      value={formSubject}
                      onChange={e => setFormSubject(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs sm:text-sm focus:outline-none focus:border-amber-400 transition-colors"
                    >
                      <option value="General Inquiry">General Inquiries & Demo</option>
                      <option value="New Subscription Activation">Subscription Activation Assistance</option>
                      <option value="Bowzer Depot Calibration">Site Bowzer Depot Setup</option>
                      <option value="Enterprise Multi-Depot Fleet">Enterprise 50+ Heavy Machinery Fleet</option>
                      <option value="Billing & bKash/Nagad">Billing & MFS Payment Verification</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Your Message *
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={formMessage}
                      onChange={e => setFormMessage(e.target.value)}
                      placeholder="Please describe your fleet size, equipment types, and any specific fuel tracking requirements..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-amber-400 transition-colors resize-y"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={formSubmitting}
                    className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {formSubmitting ? (
                      <span>Sending Message to Admin...</span>
                    ) : (
                      <>
                        <Send className="w-4 h-4 text-slate-950" />
                        <span>Send Message to admin.fuelnest@gmail.com</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            3. FAQ VIEW
           ========================================================================= */}
        {currentView === 'faq' && (
          <div className="space-y-12 animate-in fade-in duration-300">
            {/* Header */}
            <div className="text-center max-w-3xl mx-auto space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Frequently Asked Questions</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                Answers to Common Inquiries
              </h1>
              <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
                Everything you need to know about heavy equipment LPH tracking, bowzer dip reconciliations, and workspace billing.
              </p>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              {['All', 'Metrics', 'Billing', 'Hardware', 'Security', 'General'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setFaqCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    faqCategory === cat
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-black'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* FAQ Accordion List */}
            <div className="max-w-4xl mx-auto space-y-3">
              {content.faqs
                .filter(item => faqCategory === 'All' || item.category === faqCategory)
                .map(item => {
                  const isOpen = openFaqId === item.id;
                  return (
                    <div
                      key={item.id}
                      className="border border-slate-800 bg-slate-900/60 rounded-2xl overflow-hidden transition-all"
                    >
                      <button
                        type="button"
                        onClick={() => setOpenFaqId(isOpen ? null : item.id)}
                        className="w-full p-5 text-left flex items-center justify-between gap-4 hover:bg-slate-800/40 transition-colors cursor-pointer"
                      >
                        <span className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                          {item.question}
                        </span>
                        {isOpen ? (
                          <ChevronUp className="w-5 h-5 text-amber-400 shrink-0" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
                        )}
                      </button>
                      {isOpen && (
                        <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-800/60 bg-slate-950/40">
                          {item.answer}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>

            {/* Still have questions? */}
            <div className="text-center p-8 rounded-2xl bg-slate-900/40 border border-slate-800 max-w-xl mx-auto space-y-3">
              <h4 className="text-base font-bold text-white">Have a specific equipment setup question?</h4>
              <p className="text-xs text-slate-400">
                Our support team is ready on WhatsApp to assist with dip charts or custom equipment rates.
              </p>
              <button
                type="button"
                onClick={() => onNavigate('contact')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs cursor-pointer shadow-md"
              >
                <span>Contact Operations Team</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            4. PRIVACY POLICY VIEW
           ========================================================================= */}
        {currentView === 'privacy' && (
          <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-300">
            {/* Header */}
            <div className="space-y-3 border-b border-slate-800 pb-8">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold">
                <Lock className="w-3.5 h-3.5" />
                <span>Security & Compliance</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                {content.privacy.title}
              </h1>
              <p className="text-xs text-slate-400">
                Last Updated: <strong className="text-slate-300">{content.privacy.last_updated}</strong>
              </p>
              <p className="text-sm text-slate-300 leading-relaxed pt-2">
                {content.privacy.intro}
              </p>
            </div>

            {/* Sections */}
            <div className="space-y-8">
              {content.privacy.sections.map(sec => (
                <div key={sec.id} className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-2">
                  <h3 className="text-base sm:text-lg font-black text-white">{sec.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{sec.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =========================================================================
            5. TERMS OF SERVICE VIEW
           ========================================================================= */}
        {currentView === 'terms' && (
          <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-300">
            {/* Header */}
            <div className="space-y-3 border-b border-slate-800 pb-8">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-bold">
                <FileText className="w-3.5 h-3.5" />
                <span>Legal Agreement</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                {content.terms.title}
              </h1>
              <p className="text-xs text-slate-400">
                Last Updated: <strong className="text-slate-300">{content.terms.last_updated}</strong>
              </p>
              <p className="text-sm text-slate-300 leading-relaxed pt-2">
                {content.terms.intro}
              </p>
            </div>

            {/* Sections */}
            <div className="space-y-8">
              {content.terms.sections.map(sec => (
                <div key={sec.id} className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-2">
                  <h3 className="text-base sm:text-lg font-black text-white">{sec.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{sec.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="w-full border-t border-slate-800/80 bg-slate-950 py-10 px-4 sm:px-6 lg:px-8 mt-auto">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 text-xs text-slate-400">
          {/* Brand Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-black">
                <Fuel className="w-4 h-4" />
              </div>
              <span className="text-base font-black text-white">FuelNest</span>
            </div>
            <p className="leading-relaxed">
              Industrial heavy equipment and transport fuel commercial intelligence. Engineered for construction, logistics, and bowzer operations in Bangladesh.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-2">
            <span className="font-bold text-white uppercase tracking-wider block text-[11px] mb-2 font-mono">Platform</span>
            <div><button onClick={() => onNavigate('landing')} className="hover:text-amber-400 cursor-pointer">Home & Features</button></div>
            <div><button onClick={() => onNavigate('about')} className="hover:text-amber-400 cursor-pointer">About Us</button></div>
            <div><button onClick={() => onNavigate('faq')} className="hover:text-amber-400 cursor-pointer">Frequently Asked Questions</button></div>
            <div><button onClick={() => onNavigate('contact')} className="hover:text-amber-400 cursor-pointer">Contact & Support</button></div>
          </div>

          {/* Legal Links */}
          <div className="space-y-2">
            <span className="font-bold text-white uppercase tracking-wider block text-[11px] mb-2 font-mono">Legal & Privacy</span>
            <div><button onClick={() => onNavigate('privacy')} className="hover:text-amber-400 cursor-pointer">Privacy Policy</button></div>
            <div><button onClick={() => onNavigate('terms')} className="hover:text-amber-400 cursor-pointer">Terms of Service</button></div>
            <div><a href="mailto:admin.fuelnest@gmail.com" className="hover:text-amber-400">admin.fuelnest@gmail.com</a></div>
            <div><span className="text-slate-500">MFS: bKash (01903200907) & Nagad</span></div>
          </div>

          {/* WhatsApp Direct */}
          <div className="space-y-3">
            <span className="font-bold text-white uppercase tracking-wider block text-[11px] font-mono">Emergency Hotline</span>
            <p className="leading-relaxed">
              WhatsApp Support: <strong className="text-emerald-400 font-mono">+8801775316434</strong>
            </p>
            <a
              href="https://wa.me/8801775316434"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 font-bold hover:bg-emerald-600/30 transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Chat WhatsApp Now</span>
            </a>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-6 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
          <div>
            &copy; {new Date().getFullYear()} FuelNest Technologies. All rights reserved.
          </div>
          <div className="flex items-center gap-3">
            <span>Enterprise Multi-Tenant Cloud</span>
            <span>&bull;</span>
            <button onClick={() => onNavigate('login')} className="hover:text-amber-400 cursor-pointer">
              Workspace Login
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
