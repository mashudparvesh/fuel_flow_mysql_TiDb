import React, { useState, useEffect } from 'react';
import {
  Globe,
  Phone,
  Mail,
  MapPin,
  Clock,
  MessageSquare,
  HelpCircle,
  FileText,
  Lock,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  AlertTriangle,
  User,
  Building2
} from 'lucide-react';
import { DEFAULT_SITE_CONTENT, SiteContentConfig, SiteFaqItem } from '../data/defaultSiteContent';

export const CmsContentManager: React.FC = () => {
  const [content, setContent] = useState<SiteContentConfig>(DEFAULT_SITE_CONTENT);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [saveError, setSaveError] = useState('');

  // Active sub-section in CMS
  const [cmsSection, setCmsSection] = useState<'contact' | 'inbox' | 'about' | 'faqs' | 'legal'>('contact');

  // Contact Messages Inbox
  const [messages, setMessages] = useState<any[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  // New FAQ Form State
  const [newFaqCategory, setNewFaqCategory] = useState<'Metrics' | 'Billing' | 'Security' | 'Hardware' | 'General'>('Metrics');
  const [newFaqQ, setNewFaqQ] = useState('');
  const [newFaqA, setNewFaqA] = useState('');
  const [showAddFaq, setShowAddFaq] = useState(false);

  // Fetch current content from server
  const fetchContent = () => {
    setLoading(true);
    fetch('/api/public/content')
      .then(r => r.json())
      .then(d => {
        if (d.success && d.content) {
          setContent(d.content);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  // Fetch contact messages
  const fetchMessages = () => {
    setMessagesLoading(true);
    fetch('/api/owner/contact-messages')
      .then(r => r.json())
      .then(d => {
        if (d.success && Array.isArray(d.messages)) {
          setMessages(d.messages);
        }
      })
      .catch(() => {})
      .finally(() => setMessagesLoading(false));
  };

  useEffect(() => {
    fetchContent();
    fetchMessages();
  }, []);

  const handleSaveAll = async () => {
    setSaving(true);
    setSaveSuccess('');
    setSaveError('');
    try {
      const res = await fetch('/api/owner/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });
      const data = await res.json();
      setSaving(false);
      if (data.success) {
        setSaveSuccess('Public website content and copywriting updated live!');
        setTimeout(() => setSaveSuccess(''), 4000);
      } else {
        setSaveError(data.message || 'Failed to save changes.');
      }
    } catch (err: any) {
      setSaving(false);
      setSaveError(err?.message || 'Network error saving CMS content.');
    }
  };

  const handleDeleteMessage = async (id: string) => {
    if (!confirm('Are you sure you want to remove this contact message?')) return;
    try {
      await fetch(`/api/owner/contact-messages/${id}`, { method: 'DELETE' });
      setMessages(prev => prev.filter(m => m.id !== id));
    } catch (e) {}
  };

  const handleAddFaq = () => {
    if (!newFaqQ.trim() || !newFaqA.trim()) return;
    const newItem: SiteFaqItem = {
      id: `faq_${Date.now()}`,
      category: newFaqCategory,
      question: newFaqQ.trim(),
      answer: newFaqA.trim()
    };
    setContent(prev => ({
      ...prev,
      faqs: [...prev.faqs, newItem]
    }));
    setNewFaqQ('');
    setNewFaqA('');
    setShowAddFaq(false);
  };

  const handleDeleteFaq = (id: string) => {
    setContent(prev => ({
      ...prev,
      faqs: prev.faqs.filter(f => f.id !== id)
    }));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Header Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#0c162d] border border-slate-200 dark:border-blue-900/40 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Globe className="w-5 h-5 text-amber-500" />
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              Website Pages & Dynamic CMS Control
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage public copywriting, emergency contact numbers (bKash/Nagad/WhatsApp), and view incoming contact inquiries.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchContent}
            className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Publishing Changes...' : 'Save & Publish Live'}</span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {saveError && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        {[
          { id: 'contact', label: 'Contact Numbers & Info', icon: Phone },
          { id: 'inbox', label: `Contact Inquiries Inbox (${messages.length})`, icon: MessageSquare },
          { id: 'about', label: 'About Us & Mission', icon: Building2 },
          { id: 'faqs', label: `FAQs Management (${content.faqs.length})`, icon: HelpCircle },
          { id: 'legal', label: 'Privacy Policy & Terms', icon: FileText }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = cmsSection === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setCmsSection(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'bg-white dark:bg-[#0c162d] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* SECTION 1: CONTACT INFO */}
      {cmsSection === 'contact' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-[#0c162d] border border-slate-200 dark:border-blue-900/40 shadow-sm space-y-6">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
            <h4 className="text-sm font-black text-slate-900 dark:text-white">
              Public Contact & Emergency Support Configuration
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              These details appear on the Contact Us page, Landing Page footer, and email notification headers.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Official Administration Email *
              </label>
              <input
                type="email"
                value={content.contact.email}
                onChange={e => setContent(prev => ({
                  ...prev,
                  contact: { ...prev.contact, email: e.target.value }
                }))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#080e1e] text-slate-900 dark:text-white font-mono"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                All subscriber registration and contact form alerts are dispatched to this email.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                WhatsApp Support Hotline *
              </label>
              <input
                type="text"
                value={content.contact.whatsapp}
                onChange={e => setContent(prev => ({
                  ...prev,
                  contact: { ...prev.contact, whatsapp: e.target.value }
                }))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#080e1e] text-slate-900 dark:text-white font-mono"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Format: +8801775316434 (used for direct Click-to-Chat WhatsApp links)
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Primary Phone Number (Nagad) *
              </label>
              <input
                type="text"
                value={content.contact.phone}
                onChange={e => setContent(prev => ({
                  ...prev,
                  contact: { ...prev.contact, phone: e.target.value }
                }))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#080e1e] text-slate-900 dark:text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Alternative Phone / bKash Hotline
              </label>
              <input
                type="text"
                value={content.contact.alt_phone || ''}
                onChange={e => setContent(prev => ({
                  ...prev,
                  contact: { ...prev.contact, alt_phone: e.target.value }
                }))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#080e1e] text-slate-900 dark:text-white font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Headquarters & Operations Center Address
              </label>
              <input
                type="text"
                value={content.contact.address}
                onChange={e => setContent(prev => ({
                  ...prev,
                  contact: { ...prev.contact, address: e.target.value }
                }))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#080e1e] text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Working Hours
              </label>
              <input
                type="text"
                value={content.contact.working_hours}
                onChange={e => setContent(prev => ({
                  ...prev,
                  contact: { ...prev.contact, working_hours: e.target.value }
                }))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#080e1e] text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Emergency Telemetry Note
              </label>
              <input
                type="text"
                value={content.contact.support_note}
                onChange={e => setContent(prev => ({
                  ...prev,
                  contact: { ...prev.contact, support_note: e.target.value }
                }))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#080e1e] text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: INBOX */}
      {cmsSection === 'inbox' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-[#0c162d] border border-slate-200 dark:border-blue-900/40 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h4 className="text-sm font-black text-slate-900 dark:text-white">
                Website Contact Inquiries Inbox
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Messages submitted through the public Contact page form. Automatically forwarded to admin.fuelnest@gmail.com.
              </p>
            </div>
            <button
              type="button"
              onClick={fetchMessages}
              className="text-xs font-semibold text-amber-500 hover:text-amber-400 flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${messagesLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Messages</span>
            </button>
          </div>

          {messages.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>No contact inquiries received yet. They will appear here immediately upon submission.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#080e1e] space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800/80 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                        {msg.name}
                      </span>
                      {msg.company_name && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {msg.company_name}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(msg.created_at).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={`mailto:${msg.email}?subject=${encodeURIComponent('Re: ' + msg.subject)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-xs font-bold hover:bg-blue-500/20 transition-colors flex items-center gap-1"
                      >
                        <Mail className="w-3 h-3" />
                        <span>Reply Email</span>
                      </a>
                      {msg.phone && (
                        <a
                          href={`https://wa.me/${String(msg.phone).replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold hover:bg-emerald-500/20 transition-colors flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3" />
                          <span>WhatsApp</span>
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteMessage(msg.id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                        title="Delete message"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 dark:text-slate-300 font-semibold">
                    Subject: <span className="text-amber-500">{msg.subject}</span> &bull; Email: <span className="font-mono text-blue-500">{msg.email}</span> {msg.phone ? `• Phone: ${msg.phone}` : ''}
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed bg-white dark:bg-slate-900/60 p-3 rounded-lg border border-slate-200 dark:border-slate-800/60">
                    {msg.message}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SECTION 3: ABOUT US */}
      {cmsSection === 'about' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-[#0c162d] border border-slate-200 dark:border-blue-900/40 shadow-sm space-y-6">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
            <h4 className="text-sm font-black text-slate-900 dark:text-white">
              About Us Page Content & Mission
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Edit the story, mission statement, vision, and key metrics shown on the public About Us page.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Main Headline *
              </label>
              <input
                type="text"
                value={content.about.title}
                onChange={e => setContent(prev => ({
                  ...prev,
                  about: { ...prev.about, title: e.target.value }
                }))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#080e1e] text-slate-900 dark:text-white font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Subtitle Description
              </label>
              <textarea
                rows={2}
                value={content.about.subtitle}
                onChange={e => setContent(prev => ({
                  ...prev,
                  about: { ...prev.about, subtitle: e.target.value }
                }))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#080e1e] text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Why We Built FuelNest (Paragraph 1)
                </label>
                <textarea
                  rows={4}
                  value={content.about.story_p1}
                  onChange={e => setContent(prev => ({
                    ...prev,
                    about: { ...prev.about, story_p1: e.target.value }
                  }))}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#080e1e] text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Dual-Engine Architecture (Paragraph 2)
                </label>
                <textarea
                  rows={4}
                  value={content.about.story_p2}
                  onChange={e => setContent(prev => ({
                    ...prev,
                    about: { ...prev.about, story_p2: e.target.value }
                  }))}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#080e1e] text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Mission Statement
                </label>
                <textarea
                  rows={3}
                  value={content.about.mission}
                  onChange={e => setContent(prev => ({
                    ...prev,
                    about: { ...prev.about, mission: e.target.value }
                  }))}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#080e1e] text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Vision Statement
                </label>
                <textarea
                  rows={3}
                  value={content.about.vision}
                  onChange={e => setContent(prev => ({
                    ...prev,
                    about: { ...prev.about, vision: e.target.value }
                  }))}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#080e1e] text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: FAQS */}
      {cmsSection === 'faqs' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-[#0c162d] border border-slate-200 dark:border-blue-900/40 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h4 className="text-sm font-black text-slate-900 dark:text-white">
                Frequently Asked Questions (FAQ)
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Add, edit, or delete questions displayed on the public FAQ page.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddFaq(true)}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New FAQ</span>
            </button>
          </div>

          {/* Add FAQ Modal / Form */}
          {showAddFaq && (
            <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-3">
              <h5 className="text-xs font-bold text-amber-500 uppercase tracking-wider">
                Create New FAQ Entry
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={newFaqCategory}
                    onChange={e => setNewFaqCategory(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  >
                    <option value="Metrics">Metrics (LPH / KMPL)</option>
                    <option value="Billing">Billing & MFS</option>
                    <option value="Hardware">Hardware & Sensors</option>
                    <option value="Security">Security & RBAC</option>
                    <option value="General">General Questions</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Question
                  </label>
                  <input
                    type="text"
                    value={newFaqQ}
                    onChange={e => setNewFaqQ(e.target.value)}
                    placeholder="e.g. How does the bowzer dip chart work?"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Answer
                </label>
                <textarea
                  rows={3}
                  value={newFaqA}
                  onChange={e => setNewFaqA(e.target.value)}
                  placeholder="Provide a detailed, helpful answer..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddFaq(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddFaq}
                  className="px-4 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs"
                >
                  Save Entry
                </button>
              </div>
            </div>
          )}

          {/* List of Existing FAQs */}
          <div className="space-y-3">
            {content.faqs.map(faq => (
              <div
                key={faq.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#080e1e] space-y-2"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 font-bold">
                      {faq.category}
                    </span>
                    <h5 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      {faq.question}
                    </h5>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteFaq(faq.id)}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                    title="Delete FAQ"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pl-1">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 5: LEGAL (PRIVACY & TERMS) */}
      {cmsSection === 'legal' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-[#0c162d] border border-slate-200 dark:border-blue-900/40 shadow-sm space-y-8">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
            <h4 className="text-sm font-black text-slate-900 dark:text-white">
              Privacy Policy & Terms of Service Copywriting
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Review and update the legal sections for data protection and subscription rules.
            </p>
          </div>

          {/* Privacy Policy */}
          <div className="space-y-4">
            <h5 className="text-xs font-bold text-blue-500 uppercase tracking-wider flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              <span>Privacy Policy Content</span>
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Policy Title
                </label>
                <input
                  type="text"
                  value={content.privacy.title}
                  onChange={e => setContent(prev => ({
                    ...prev,
                    privacy: { ...prev.privacy, title: e.target.value }
                  }))}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#080e1e] text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Last Updated Date
                </label>
                <input
                  type="text"
                  value={content.privacy.last_updated}
                  onChange={e => setContent(prev => ({
                    ...prev,
                    privacy: { ...prev.privacy, last_updated: e.target.value }
                  }))}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#080e1e] text-slate-900 dark:text-white font-mono"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Intro Statement
              </label>
              <textarea
                rows={2}
                value={content.privacy.intro}
                onChange={e => setContent(prev => ({
                  ...prev,
                  privacy: { ...prev.privacy, intro: e.target.value }
                }))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#080e1e] text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Terms of Service */}
          <div className="space-y-4 pt-6 border-t border-slate-200 dark:border-slate-800">
            <h5 className="text-xs font-bold text-purple-500 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              <span>Terms of Service Content</span>
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Terms Title
                </label>
                <input
                  type="text"
                  value={content.terms.title}
                  onChange={e => setContent(prev => ({
                    ...prev,
                    terms: { ...prev.terms, title: e.target.value }
                  }))}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#080e1e] text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Last Updated Date
                </label>
                <input
                  type="text"
                  value={content.terms.last_updated}
                  onChange={e => setContent(prev => ({
                    ...prev,
                    terms: { ...prev.terms, last_updated: e.target.value }
                  }))}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#080e1e] text-slate-900 dark:text-white font-mono"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Intro Statement
              </label>
              <textarea
                rows={2}
                value={content.terms.intro}
                onChange={e => setContent(prev => ({
                  ...prev,
                  terms: { ...prev.terms, intro: e.target.value }
                }))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#080e1e] text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
