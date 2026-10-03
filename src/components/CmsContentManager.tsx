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
  Building2,
  Sparkles,
  Video,
  Upload,
  Play,
  Eye,
  Palette,
  Image as ImageIcon
} from 'lucide-react';
import { DEFAULT_SITE_CONTENT, SiteContentConfig, SiteFaqItem, formatVideoEmbedUrl } from '../data/defaultSiteContent';

interface CmsContentManagerProps {
  initialSection?: 'branding' | 'video' | 'home' | 'about' | 'contact' | 'faqs' | 'inbox' | 'legal';
}

export const CmsContentManager: React.FC<CmsContentManagerProps> = ({
  initialSection = 'branding'
}) => {
  const [content, setContent] = useState<SiteContentConfig>(DEFAULT_SITE_CONTENT);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [saveError, setSaveError] = useState('');

  // Active sub-section in CMS
  const [cmsSection, setCmsSection] = useState<'branding' | 'video' | 'home' | 'about' | 'contact' | 'faqs' | 'inbox' | 'legal'>(initialSection);

  // Sync if initialSection changes from outside
  useEffect(() => {
    if (initialSection) {
      setCmsSection(initialSection);
    }
  }, [initialSection]);

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
          setContent({
            ...DEFAULT_SITE_CONTENT,
            ...d.content,
            branding: { ...DEFAULT_SITE_CONTENT.branding, ...(d.content.branding || {}) },
            home: { ...DEFAULT_SITE_CONTENT.home, ...(d.content.home || {}) },
            contact: { ...DEFAULT_SITE_CONTENT.contact, ...(d.content.contact || {}) },
            about: { ...DEFAULT_SITE_CONTENT.about, ...(d.content.about || {}) },
            faqs: Array.isArray(d.content.faqs) && d.content.faqs.length > 0 ? d.content.faqs : DEFAULT_SITE_CONTENT.faqs
          });
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
        setSaveSuccess('Website content, branding assets & promotional video published live!');
        
        // Dynamically apply Favicon and App Title in DOM
        if (content.branding?.favicon_url) {
          let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
          if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
          }
          link.href = content.branding.favicon_url;
        }
        if (content.branding?.app_name) {
          document.title = `${content.branding.app_name} - ${content.branding.tagline || 'Commercial Telemetry'}`;
        }

        // Broadcast to all open tabs
        try {
          const ch = new BroadcastChannel('fuelflow_tenants_sync');
          ch.postMessage({ type: 'CONTENT_UPDATED', content });
          ch.close();
        } catch (e) {}

        setTimeout(() => setSaveSuccess(''), 4500);
      } else {
        setSaveError(data.message || 'Failed to save changes.');
      }
    } catch (err: any) {
      setSaving(false);
      setSaveError(err?.message || 'Network error saving CMS content.');
    }
  };

  // Local Image Upload to Data URL (Logo or Favicon or Video Poster)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, targetField: 'logo' | 'favicon' | 'poster') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('File size exceeds 2MB limit. Please upload an optimized PNG, SVG, or JPG image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (targetField === 'logo') {
        setContent(prev => ({
          ...prev,
          branding: { ...prev.branding, logo_url: result }
        }));
      } else if (targetField === 'favicon') {
        setContent(prev => ({
          ...prev,
          branding: { ...prev.branding, favicon_url: result }
        }));
      } else if (targetField === 'poster') {
        setContent(prev => ({
          ...prev,
          home: { ...prev.home, video_poster_url: result }
        }));
      }
    };
    reader.readAsDataURL(file);
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

  const videoMeta = formatVideoEmbedUrl(content.home?.video_url);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Header Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#0c162d] border border-slate-200 dark:border-blue-900/40 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Globe className="w-5 h-5 text-amber-500" />
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              Website CMS & Brand Assets Control
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage public pages (Home, About, Contact, FAQs), promotional video links, App Logo & Favicon in one unified control panel.
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
          { id: 'branding', label: 'App Logo & Favicon', icon: Palette },
          { id: 'video', label: 'Promotional Video', icon: Video },
          { id: 'home', label: 'Home Page Hero & Copy', icon: Sparkles },
          { id: 'about', label: 'About Us & Mission', icon: Building2 },
          { id: 'contact', label: 'Contact Numbers & Info', icon: Phone },
          { id: 'faqs', label: `FAQs (${content.faqs?.length || 0})`, icon: HelpCircle },
          { id: 'inbox', label: `Inquiries Inbox (${messages.length})`, icon: MessageSquare },
          { id: 'legal', label: 'Privacy & Terms', icon: FileText }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = cmsSection === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setCmsSection(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'bg-white dark:bg-[#0c162d] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================= */}
      {/* 1. BRANDING & ASSETS (LOGO, FAVICON, APP TITLE) */}
      {/* ========================================================= */}
      {cmsSection === 'branding' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="p-6 rounded-2xl bg-white dark:bg-[#0c162d] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div>
              <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Palette className="w-4 h-4 text-amber-500" />
                <span>Application Identity & Visual Branding Assets</span>
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Customize the platform name, slogan, company logo, and browser favicon. These updates appear live across the landing page, headers, and browser tabs.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Application Brand Name
                </label>
                <input
                  type="text"
                  value={content.branding?.app_name || ''}
                  onChange={e => setContent(prev => ({
                    ...prev,
                    branding: { ...prev.branding, app_name: e.target.value }
                  }))}
                  placeholder="e.g. FuelNest"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060c18] text-xs font-bold text-slate-900 dark:text-white"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Displayed on browser title and top navigation bars.</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Brand Tagline & Slogan
                </label>
                <input
                  type="text"
                  value={content.branding?.tagline || ''}
                  onChange={e => setContent(prev => ({
                    ...prev,
                    branding: { ...prev.branding, tagline: e.target.value }
                  }))}
                  placeholder="e.g. Commercial Fleet & Heavy Equipment Fuel Telemetry Cloud"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060c18] text-xs font-bold text-slate-900 dark:text-white"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Used in SEO meta description and landing page header.</span>
              </div>
            </div>

            {/* Logo Upload & URL */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h5 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-amber-500" />
                    <span>Application Main Logo</span>
                  </h5>
                  <p className="text-[11px] text-slate-500">Provide an image URL or upload a PNG/SVG transparent logo.</p>
                </div>
                {content.branding?.logo_url && (
                  <div className="flex items-center gap-3 p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <img src={content.branding.logo_url} alt="App Logo" className="h-7 max-w-[120px] object-contain" />
                    <button
                      type="button"
                      onClick={() => setContent(prev => ({ ...prev, branding: { ...prev.branding, logo_url: '' } }))}
                      className="text-[10px] text-rose-500 hover:underline font-bold"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    value={content.branding?.logo_url || ''}
                    onChange={e => setContent(prev => ({
                      ...prev,
                      branding: { ...prev.branding, logo_url: e.target.value }
                    }))}
                    placeholder="https://example.com/logo.png or leave empty for default brand icon"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060c18] text-xs font-mono text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-dashed border-amber-500/50 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold cursor-pointer transition-all">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Logo File</span>
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/svg+xml, image/webp"
                      className="hidden"
                      onChange={e => handleFileUpload(e, 'logo')}
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Favicon Upload & URL */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h5 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-emerald-500" />
                    <span>Browser Tab Favicon</span>
                  </h5>
                  <p className="text-[11px] text-slate-500">The small icon displayed in the browser tab (recommended: 32x32 or 64x64 PNG/ICO).</p>
                </div>
                {content.branding?.favicon_url && (
                  <div className="flex items-center gap-3 p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <img src={content.branding.favicon_url} alt="Favicon" className="w-6 h-6 object-contain" />
                    <button
                      type="button"
                      onClick={() => setContent(prev => ({ ...prev, branding: { ...prev.branding, favicon_url: '' } }))}
                      className="text-[10px] text-rose-500 hover:underline font-bold"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    value={content.branding?.favicon_url || ''}
                    onChange={e => setContent(prev => ({
                      ...prev,
                      branding: { ...prev.branding, favicon_url: e.target.value }
                    }))}
                    placeholder="https://example.com/favicon.png or upload icon"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060c18] text-xs font-mono text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-dashed border-emerald-500/50 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold cursor-pointer transition-all">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Favicon</span>
                    <input
                      type="file"
                      accept="image/png, image/x-icon, image/svg+xml"
                      className="hidden"
                      onChange={e => handleFileUpload(e, 'favicon')}
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. PROMOTIONAL VIDEO MANAGEMENT */}
      {/* ========================================================= */}
      {cmsSection === 'video' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="p-6 rounded-2xl bg-white dark:bg-[#0c162d] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div>
              <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Video className="w-4 h-4 text-amber-500" />
                <span>Landing Page Promotional Video Configuration</span>
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Paste any YouTube, Vimeo, or direct MP4 video link. The video is rendered beautifully on the landing page with strict <strong>non-autoplay</strong> so visitors can click to play whenever they wish.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Video Source Link (Paste YouTube, Vimeo or MP4 URL) *</span>
                  <span className="text-[11px] font-mono text-amber-600 dark:text-amber-400">Strictly Non-Autoplay</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={content.home?.video_url || ''}
                    onChange={e => setContent(prev => ({
                      ...prev,
                      home: { ...prev.home, video_url: e.target.value }
                    }))}
                    placeholder="e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ or https://youtu.be/..."
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060c18] text-xs font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const clip = await navigator.clipboard.readText();
                        if (clip) {
                          setContent(prev => ({ ...prev, home: { ...prev.home, video_url: clip.trim() } }));
                        }
                      } catch (e) {}
                    }}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700"
                  >
                    Paste
                  </button>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Supported formats: Standard YouTube watch URLs, short youtu.be links, Vimeo URLs, and direct .mp4/.webm video links.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Promotional Video Title
                  </label>
                  <input
                    type="text"
                    value={content.home?.video_title || ''}
                    onChange={e => setContent(prev => ({
                      ...prev,
                      home: { ...prev.home, video_title: e.target.value }
                    }))}
                    placeholder="e.g. FuelNest Overview & Dual-Metric Telemetry Demo"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060c18] text-xs font-bold text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Badge / Tag Above Video
                  </label>
                  <input
                    type="text"
                    value={content.home?.video_badge || ''}
                    onChange={e => setContent(prev => ({
                      ...prev,
                      home: { ...prev.home, video_badge: e.target.value }
                    }))}
                    placeholder="e.g. FEATURED PRODUCT WALKTHROUGH"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060c18] text-xs font-bold text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Video Description / Caption
                </label>
                <textarea
                  rows={2}
                  value={content.home?.video_description || ''}
                  onChange={e => setContent(prev => ({
                    ...prev,
                    home: { ...prev.home, video_description: e.target.value }
                  }))}
                  placeholder="Short description summarizing what viewers will see in the demo video..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060c18] text-xs font-medium text-slate-900 dark:text-white"
                />
              </div>

              {/* Poster Image */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Video Thumbnail / Poster Image URL (Optional)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={content.home?.video_poster_url || ''}
                    onChange={e => setContent(prev => ({
                      ...prev,
                      home: { ...prev.home, video_poster_url: e.target.value }
                    }))}
                    placeholder="https://images.unsplash.com/... or upload poster"
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060c18] text-xs font-mono text-slate-900 dark:text-white"
                  />
                  <label className="px-3.5 py-2 rounded-xl border border-dashed border-amber-500/50 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Poster</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => handleFileUpload(e, 'poster')}
                    />
                  </label>
                </div>
              </div>

              {/* Live Video Preview Box */}
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 shadow-xl space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    <span>Live Preview (How Customers Will See It on Landing Page)</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                    Type: {videoMeta.type.toUpperCase()}
                  </span>
                </div>

                <div className="max-w-2xl mx-auto rounded-xl overflow-hidden border border-slate-800 shadow-2xl bg-black aspect-video flex items-center justify-center relative">
                  {videoMeta.type === 'youtube' || videoMeta.type === 'vimeo' ? (
                    <iframe
                      src={videoMeta.embedUrl}
                      title={content.home?.video_title || 'Promotional Video'}
                      className="w-full h-full"
                      allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : videoMeta.type === 'mp4' ? (
                    <video
                      controls
                      preload="metadata"
                      poster={content.home?.video_poster_url}
                      className="w-full h-full object-cover"
                    >
                      <source src={videoMeta.embedUrl} type="video/mp4" />
                      Your browser does not support HTML video.
                    </video>
                  ) : (
                    <div className="text-center p-6 text-slate-500">
                      <Play className="w-10 h-10 mx-auto mb-2 opacity-40 text-amber-500" />
                      <p className="text-xs">Paste a valid video URL above to preview.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. HOME PAGE HERO & COPYWRITING */}
      {/* ========================================================= */}
      {cmsSection === 'home' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="p-6 rounded-2xl bg-white dark:bg-[#0c162d] border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <div>
              <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Home Page Hero Section Copywriting</span>
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Edit main headlines, introductory paragraphs, and call-to-action button texts for the public landing page.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Top Pill / Announcement Badge
              </label>
              <input
                type="text"
                value={content.home?.hero_badge || ''}
                onChange={e => setContent(prev => ({
                  ...prev,
                  home: { ...prev.home, hero_badge: e.target.value }
                }))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060c18] text-xs font-bold text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Main Hero Headline
              </label>
              <textarea
                rows={2}
                value={content.home?.hero_title || ''}
                onChange={e => setContent(prev => ({
                  ...prev,
                  home: { ...prev.home, hero_title: e.target.value }
                }))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060c18] text-xs font-black text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Supporting Subtitle & Description
              </label>
              <textarea
                rows={3}
                value={content.home?.hero_subtitle || ''}
                onChange={e => setContent(prev => ({
                  ...prev,
                  home: { ...prev.home, hero_subtitle: e.target.value }
                }))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060c18] text-xs font-medium text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Primary Action Button Text
                </label>
                <input
                  type="text"
                  value={content.home?.cta_primary || 'Start 3-Day Free Trial'}
                  onChange={e => setContent(prev => ({
                    ...prev,
                    home: { ...prev.home, cta_primary: e.target.value }
                  }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060c18] text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Secondary Action Button Text
                </label>
                <input
                  type="text"
                  value={content.home?.cta_secondary || 'Explore Live Interactive Demo'}
                  onChange={e => setContent(prev => ({
                    ...prev,
                    home: { ...prev.home, cta_secondary: e.target.value }
                  }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060c18] text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. ABOUT US PAGE CONTENT */}
      {/* ========================================================= */}
      {cmsSection === 'about' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="p-6 rounded-2xl bg-white dark:bg-[#0c162d] border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <div>
              <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-amber-500" />
                <span>About Us Page Copywriting</span>
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Edit the company background story, corporate mission, vision, and core milestones shown on /about.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                About Page Title
              </label>
              <input
                type="text"
                value={content.about?.title || ''}
                onChange={e => setContent(prev => ({
                  ...prev,
                  about: { ...prev.about, title: e.target.value }
                }))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060c18] text-xs font-bold text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Subtitle
              </label>
              <input
                type="text"
                value={content.about?.subtitle || ''}
                onChange={e => setContent(prev => ({
                  ...prev,
                  about: { ...prev.about, subtitle: e.target.value }
                }))}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060c18] text-xs font-medium text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Story Paragraph 1 (Problem Context in Bangladesh)
                </label>
                <textarea
                  rows={4}
                  value={content.about?.story_p1 || ''}
                  onChange={e => setContent(prev => ({
                    ...prev,
                    about: { ...prev.about, story_p1: e.target.value }
                  }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060c18] text-xs font-medium text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Story Paragraph 2 (Dual-Metric Telemetry Solution)
                </label>
                <textarea
                  rows={4}
                  value={content.about?.story_p2 || ''}
                  onChange={e => setContent(prev => ({
                    ...prev,
                    about: { ...prev.about, story_p2: e.target.value }
                  }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060c18] text-xs font-medium text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Mission Statement
                </label>
                <textarea
                  rows={2}
                  value={content.about?.mission || ''}
                  onChange={e => setContent(prev => ({
                    ...prev,
                    about: { ...prev.about, mission: e.target.value }
                  }))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060c18] text-xs font-medium text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Vision Statement
                </label>
                <textarea
                  rows={2}
                  value={content.about?.vision || ''}
                  onChange={e => setContent(prev => ({
                    ...prev,
                    about: { ...prev.about, vision: e.target.value }
                  }))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060c18] text-xs font-medium text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. CONTACT NUMBERS & CHANNELS */}
      {/* ========================================================= */}
      {cmsSection === 'contact' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="p-6 rounded-2xl bg-white dark:bg-[#0c162d] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div>
              <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-500" />
                <span>Contact Details & Official Support Numbers</span>
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Edit numbers for bKash, Nagad, WhatsApp, and emergency fleet dispatch shown on /contact and subscription renewal modals.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Official Support Email *
                </label>
                <input
                  type="email"
                  value={content.contact?.email || 'admin.fuelnest@gmail.com'}
                  onChange={e => setContent(prev => ({
                    ...prev,
                    contact: { ...prev.contact, email: e.target.value }
                  }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060c18] text-xs font-mono font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  WhatsApp Support Number
                </label>
                <input
                  type="text"
                  value={content.contact?.whatsapp || ''}
                  onChange={e => setContent(prev => ({
                    ...prev,
                    contact: { ...prev.contact, whatsapp: e.target.value }
                  }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060c18] text-xs font-mono font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Primary Mobile / Nagad Account
                </label>
                <input
                  type="text"
                  value={content.contact?.phone || ''}
                  onChange={e => setContent(prev => ({
                    ...prev,
                    contact: { ...prev.contact, phone: e.target.value }
                  }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060c18] text-xs font-mono font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Alternative Mobile / bKash Account
                </label>
                <input
                  type="text"
                  value={content.contact?.alt_phone || ''}
                  onChange={e => setContent(prev => ({
                    ...prev,
                    contact: { ...prev.contact, alt_phone: e.target.value }
                  }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060c18] text-xs font-mono font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  City / Location
                </label>
                <input
                  type="text"
                  value={content.contact?.city || ''}
                  onChange={e => setContent(prev => ({
                    ...prev,
                    contact: { ...prev.contact, city: e.target.value }
                  }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060c18] text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Working Hours
                </label>
                <input
                  type="text"
                  value={content.contact?.working_hours || ''}
                  onChange={e => setContent(prev => ({
                    ...prev,
                    contact: { ...prev.contact, working_hours: e.target.value }
                  }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060c18] text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Physical Office Address
              </label>
              <input
                type="text"
                value={content.contact?.address || ''}
                onChange={e => setContent(prev => ({
                  ...prev,
                  contact: { ...prev.contact, address: e.target.value }
                }))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060c18] text-xs font-bold text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 6. FAQS MANAGEMENT (ADD / EDIT / DELETE) */}
      {/* ========================================================= */}
      {cmsSection === 'faqs' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="p-6 rounded-2xl bg-white dark:bg-[#0c162d] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-amber-500" />
                  <span>Frequently Asked Questions (FAQ) Manager</span>
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Add, edit, or delete customer inquiries shown on the public FAQ page.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddFaq(true)}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add New FAQ</span>
              </button>
            </div>

            {/* Add FAQ Form */}
            {showAddFaq && (
              <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-amber-600 dark:text-amber-400">Post New Question & Answer</span>
                  <button
                    type="button"
                    onClick={() => setShowAddFaq(false)}
                    className="text-xs text-slate-400 hover:text-slate-600"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Category</label>
                    <select
                      value={newFaqCategory}
                      onChange={e => setNewFaqCategory(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060c18]"
                    >
                      <option value="Metrics">Metrics (LPH / KMPL)</option>
                      <option value="Billing">Billing & MFS</option>
                      <option value="Security">Security & RBAC</option>
                      <option value="Hardware">Hardware & Sensors</option>
                      <option value="General">General</option>
                    </select>
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Question</label>
                    <input
                      type="text"
                      placeholder="e.g. Can we track generators and excavators in engine hours?"
                      value={newFaqQ}
                      onChange={e => setNewFaqQ(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060c18] font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Detailed Answer</label>
                  <textarea
                    rows={3}
                    placeholder="Provide a thorough, professional explanation..."
                    value={newFaqA}
                    onChange={e => setNewFaqA(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060c18]"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleAddFaq}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs cursor-pointer shadow-sm"
                  >
                    Save FAQ
                  </button>
                </div>
              </div>
            )}

            {/* Existing FAQs List */}
            <div className="space-y-3">
              {(content.faqs || []).map((faq, idx) => (
                <div
                  key={faq.id || idx}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex items-start justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400">
                        {faq.category}
                      </span>
                      <h5 className="text-xs font-black text-slate-900 dark:text-white">
                        {faq.question}
                      </h5>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteFaq(faq.id)}
                    className="p-2 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors"
                    title="Delete Question"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 7. CONTACT MESSAGES INBOX */}
      {/* ========================================================= */}
      {cmsSection === 'inbox' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="p-6 rounded-2xl bg-white dark:bg-[#0c162d] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-blue-500" />
                  <span>Public Contact Form Submissions ({messages.length})</span>
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Inquiries submitted through the public Contact page form. Automatically forwarded to admin.fuelnest@gmail.com.
                </p>
              </div>

              <button
                type="button"
                onClick={fetchMessages}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300"
              >
                Refresh Inbox
              </button>
            </div>

            {messages.length === 0 ? (
              <div className="p-8 text-center text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30 text-amber-500" />
                <p className="text-xs">No customer contact inquiries yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map(msg => (
                  <div
                    key={msg.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col sm:flex-row sm:items-start justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900 dark:text-white text-xs">{msg.name}</span>
                        <span className="text-[11px] text-slate-400">&bull; {msg.company_name || 'Individual'}</span>
                        <span className="text-[10px] text-slate-400 font-mono">({msg.created_at?.split('T')[0]})</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600 dark:text-slate-400">
                        <a href={`mailto:${msg.email}`} className="text-sky-500 font-medium hover:underline flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          <span>{msg.email}</span>
                        </a>
                        {msg.phone && (
                          <a href={`tel:${msg.phone}`} className="text-emerald-500 font-medium hover:underline flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            <span>{msg.phone}</span>
                          </a>
                        )}
                        <span className="font-bold text-slate-700 dark:text-slate-300">Subject: {msg.subject}</span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 mt-2 p-2.5 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/50">
                        {msg.message}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(msg.email)}&su=${encodeURIComponent('Re: ' + msg.subject)}&authuser=admin.fuelnest@gmail.com`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold flex items-center gap-1 shadow-xs"
                        title="Compose from admin.fuelnest@gmail.com"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>Reply Email</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => handleDeleteMessage(msg.id)}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 8. LEGAL & PRIVACY */}
      {/* ========================================================= */}
      {cmsSection === 'legal' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="p-6 rounded-2xl bg-white dark:bg-[#0c162d] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div>
              <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-500" />
                <span>Privacy Policy & Terms of Service</span>
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Customize data protection statements and terms displayed on /privacy and /terms.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Privacy Policy Intro Text
                </label>
                <textarea
                  rows={3}
                  value={content.privacy?.intro || ''}
                  onChange={e => setContent(prev => ({
                    ...prev,
                    privacy: { ...prev.privacy, intro: e.target.value }
                  }))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060c18] text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Terms of Service Intro Text
                </label>
                <textarea
                  rows={3}
                  value={content.terms?.intro || ''}
                  onChange={e => setContent(prev => ({
                    ...prev,
                    terms: { ...prev.terms, intro: e.target.value }
                  }))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#060c18] text-xs"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
