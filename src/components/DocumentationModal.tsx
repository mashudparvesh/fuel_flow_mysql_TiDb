import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  BookOpen,
  X,
  Search,
  CheckCircle2,
  Truck,
  Fuel,
  CreditCard,
  AlertTriangle,
  FileSpreadsheet,
  Printer,
  ShieldCheck,
  Zap,
  ChevronRight,
  ExternalLink,
  Crown
} from 'lucide-react';

interface DocumentationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DocumentationModal: React.FC<DocumentationModalProps> = ({
  isOpen,
  onClose
}) => {
  const { language } = useApp();
  const [activeTab, setActiveTab] = useState<string>('getting_started');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const sections = [
    {
      id: 'getting_started',
      icon: Zap,
      title_bn: '১. শুরু করার নির্দেশিকা (Getting Started)',
      title_en: '1. Getting Started & First Login'
    },
    {
      id: 'vehicles_equipment',
      icon: Truck,
      title_bn: '২. যানবাহন ও যন্ত্রপাতি সংযোজন (Vehicles & Equipment)',
      title_en: '2. Vehicles & Heavy Equipment'
    },
    {
      id: 'fuel_entry',
      icon: Fuel,
      title_bn: '৩. ফুয়েল স্লিপ ও ওডোমিটার এন্ট্রি (Fuel Entry & Slips)',
      title_en: '3. Fuel Entry & Slip Logging'
    },
    {
      id: 'pumps_ledger',
      icon: CreditCard,
      title_bn: '৪. হাইওয়ে পাম্প ক্রেডিট ও বিলিং (Highway Pump Ledger)',
      title_en: '4. Highway Pump Credit Ledger'
    },
    {
      id: 'bowzer_tanker',
      icon: ShieldCheck,
      title_bn: '৫. বোজার ট্যাংকার ও ডিপস্টিক অডিট (Bowzer Tanker & Depots)',
      title_en: '5. Mobile Bowzer & Dip Stick Audit'
    },
    {
      id: 'anomaly_alerts',
      icon: AlertTriangle,
      title_bn: '৬. তেল চুরি ও অ্যানোমালি অ্যালার্ট (Theft & Anomaly AI)',
      title_en: '6. Theft & Anomaly Detection'
    },
    {
      id: 'bulk_import',
      icon: FileSpreadsheet,
      title_bn: '৭. এক্সেল ও সিএসভি বাল্ক ইমপোর্ট (Excel / CSV Bulk Import)',
      title_en: '7. Excel / CSV Bulk Data Ingestion'
    },
    {
      id: 'pdf_reports',
      icon: Printer,
      title_bn: '৮. লোগোযুক্ত অফিশিয়াল A4 রিপোর্ট (PDF Reports & Printing)',
      title_en: '8. PDF Reports with Company Logo'
    },
    {
      id: 'subscriptions',
      icon: Crown,
      title_bn: '৯. সাবস্ক্রিপশন প্ল্যান ও পেমেন্ট (Subscription & Plans)',
      title_en: '9. Subscription Plans & Payment'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-5xl h-[90vh] bg-white dark:bg-[#0b1222] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shadow-md">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                {language === 'bn' ? 'ফুয়েলনেস্ট ব্যবহার নির্দেশিকা' : 'FuelNest User Documentation'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'bn'
                  ? 'ধাপ অনুযায়ী সম্পূর্ণ ফ্লিট ও ফুয়েল সিস্টেম ব্যবহারের গাইড'
                  : 'Step-by-step master user manual for fleet & fuel operations'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Layout: Sidebar + Main Viewer */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Navigation Sidebar */}
          <div className="w-72 sm:w-80 border-r border-slate-200 dark:border-slate-800 p-3 overflow-y-auto bg-slate-50/50 dark:bg-slate-900/30 shrink-0">
            <div className="space-y-1">
              {sections.map(sec => {
                const Icon = sec.icon;
                const isSelected = activeTab === sec.id;
                return (
                  <button
                    key={sec.id}
                    onClick={() => setActiveTab(sec.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-slate-950' : 'text-amber-500'}`} />
                    <span className="truncate">
                      {language === 'bn' ? sec.title_bn : sec.title_en}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 p-6 sm:p-8 overflow-y-auto space-y-6 text-slate-800 dark:text-slate-200 leading-relaxed text-sm">
            {activeTab === 'getting_started' && (
              <div className="space-y-4">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">
                    ১. শুরু করার নির্দেশিকা (Getting Started & Initial Setup)
                  </h3>
                  <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
                    প্রাথমিক প্রস্তুতি ও প্রথম লগইন
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200">
                  <strong>টিপস:</strong> সাবস্ক্রিপশন সম্পন্ন করার পর আপনার ইমেইলে সুপার অ্যাডমিনের একটি ইউজারনেম ও সাময়িক পাসওয়ার্ড পাঠানো হয়।
                </div>

                <ol className="space-y-3 list-decimal list-inside text-xs sm:text-sm">
                  <li className="pl-1">
                    <strong>লগইন পেজে যান:</strong> ফুয়েলনেস্ট পোর্টালের টপ ন্যাভবারে <span className="font-bold text-amber-600 dark:text-amber-400">Sign In</span> বাটনে ক্লিক করুন।
                  </li>
                  <li className="pl-1">
                    <strong>কোম্পানি ড্রপডাউন সিলেক্ট করুন:</strong> ড্রপডাউন থেকে আপনার কোম্পানির নাম বাছাই করুন।
                  </li>
                  <li className="pl-1">
                    <strong>ইউজারনেম ও পাসওয়ার্ড দিন:</strong> আপনার ইমেইলে প্রাপ্ত ইউজারনেম ও সাময়িক পাসওয়ার্ড প্রবেশ করান।
                  </li>
                  <li className="pl-1">
                    <strong>বাধ্যতামূলক পাসওয়ার্ড পরিবর্তন:</strong> প্রথমবার লগইন করার সাথে সাথে একটি পপআপ আসবে যেখানে আপনার নিজস্ব নতুন ও নিরাপদ পাসওয়ার্ড সেট করতে হবে।
                  </li>
                  <li className="pl-1">
                    <strong>কোম্পানির লোগো আপলোড:</strong> হেডার সেকশনে আপনার কোম্পানির নামের ওপর ক্লিক করে আপনার কোম্পানির অফিশিয়াল লোগো আপলোড করে নিন, যা স্বয়ংক্রিয়ভাবে সকল A4 পিডিএফ রিপোর্টে প্রতিফলিত হবে।
                  </li>
                </ol>
              </div>
            )}

            {activeTab === 'vehicles_equipment' && (
              <div className="space-y-4">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">
                    ২. যানবাহন ও ভারী যন্ত্রপাতি সংযোজন (Vehicles & Machinery)
                  </h3>
                  <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
                    ডুয়াল মেট্রিক ট্র্যাকিং (KMPL ও LPH)
                  </span>
                </div>

                <p className="text-xs sm:text-sm">
                  ফুয়েলনেস্টে যেকোনো ধরনের ভেহিক্যাল (যেমন: ডাম্প ট্রাক, পিকআপ, কার) এবং ভারী যন্ত্রপাতি (যেমন: এক্সকাভেটর, জেনারেটর, লোডার) খুব সহজেই যুক্ত করা যায়:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <h4 className="font-bold text-amber-500 mb-1">কিলোমিটার প্রতি লিটার (KMPL)</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      ট্রাক, পিকআপ ও বাসের জন্য প্রযোজ্য। ওডোমিটারের দূরত্বের ভিত্তিতে মাইলেজ হিসেব হয় (যেমন: ৩.২ KMPL)।
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <h4 className="font-bold text-emerald-500 mb-1">ঘণ্টা প্রতি লিটার (LPH)</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      এক্সকাভেটর ও জেনারেটরের জন্য প্রযোজ্য। আওয়ার মিটারের ওপর ভিত্তি করে প্রতি ঘণ্টায় ডিজেল পোড়ার হার হিসেব হয় (যেমন: ১৪.০ LPH)।
                    </p>
                  </div>
                </div>

                <ol className="space-y-2 list-decimal list-inside text-xs sm:text-sm pt-2">
                  <li>সাইডবার থেকে <span className="font-bold text-amber-500">Vehicles</span> পেজে যান।</li>
                  <li><span className="font-bold text-amber-500">+ Add Vehicle</span> বাটনে ক্লিক করুন।</li>
                  <li>রেজিস্ট্রেশন নম্বর, ড্রাইভারের নাম, ক্যাটাগরি, ফুয়েল টাইপ এবং স্ট্যান্ডার্ড বেঞ্চমার্ক দিন।</li>
                  <li>সংরক্ষণ করলেই গাড়িটি তাৎক্ষণিক প্রস্তুত হয়ে যাবে।</li>
                </ol>
              </div>
            )}

            {activeTab === 'fuel_entry' && (
              <div className="space-y-4">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">
                    ৩. ফুয়েল স্লিপ ও ওডোমিটার এন্ট্রি (Fuel Slip Logging)
                  </h3>
                  <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
                    সঠিক হিসাব ও রিকনসিলিয়েশনের ভিত্তি
                  </span>
                </div>

                <p className="text-xs sm:text-sm">
                  প্রতিবার গাড়িতে তেল প্রবেশ করানোর পর একটি ফুয়েল এন্ট্রি তৈরি করুন:
                </p>

                <ul className="space-y-2 text-xs sm:text-sm list-disc list-inside">
                  <li><strong>তারিখ ও সময়:</strong> ফুয়েল নেওয়ার সঠিক সময় সিলেক্ট করুন।</li>
                  <li><strong>ভেহিক্যাল নম্বর:</strong> গাড়িটি সিলেক্ট করুন অথবা কিউআর কোড স্ক্যান করুন।</li>
                  <li><strong>সোর্স নির্বাচন:</strong> তেল কি <span className="text-amber-500 font-bold">হাইওয়ে পাম্প</span> থেকে নেওয়া হয়েছে নাকি নিজস্ব <span className="text-emerald-500 font-bold">মোবাইল বোজার</span> থেকে ডিসপেন্স করা হয়েছে তা বাছাই করুন।</li>
                  <li><strong>স্লিপ নম্বর:</strong> পাম্পের মেমো বা স্লিপ নম্বর দিন।</li>
                  <li><strong>ওডোমিটার / আওয়ার মিটার:</strong> মিটারের বর্তমান রিডিং দিন। সিস্টেম পূর্বের রিডিং থেকে স্বয়ংক্রিয়ভাবে দূরত্ব ও মাইলেজ বের করে নিবে।</li>
                  <li><strong>লিটার ও রেট:</strong> কত লিটার তেল নেওয়া হলো এবং প্রতি লিটারের মূল্য দিন।</li>
                </ul>
              </div>
            )}

            {activeTab === 'pumps_ledger' && (
              <div className="space-y-4">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">
                    ৪. হাইওয়ে পাম্প ক্রেডিট ও পেমেন্ট লেজার (Pump Credit & Ledger)
                  </h3>
                  <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
                    পাম্পের বাকির হিসাব ও পেমেন্ট সমন্বয়
                  </span>
                </div>

                <p className="text-xs sm:text-sm">
                  কন্ট্রাক্টর ও ফ্লিট ব্যবসায় পাম্প থেকে বাকিতে ডিজেল নেওয়া অত্যন্ত সাধারণ। ফুয়েলনেস্টে প্রতিটি পাম্পের সম্পূর্ণ হিসাব সংরক্ষিত থাকে:
                </p>

                <ol className="space-y-2 list-decimal list-inside text-xs sm:text-sm">
                  <li>সাইডবার থেকে <span className="font-bold text-amber-500">Pumps</span> পেজে প্রবেশ করুন।</li>
                  <li>এখানে প্রতিটি পাম্পের মোট তেল সরবরাহ, মোট বিল, পরিশোধিত টাকা এবং বকেয়া ব্যালেন্স দেখা যাবে।</li>
                  <li>পাম্পকে চেক বা ক্যাশে টাকা পরিশোধ করলে <span className="font-bold text-emerald-500">Record Payment</span> বাটনে ক্লিক করে ভাউচার এন্ট্রি দিন।</li>
                  <li><span className="font-bold text-blue-500">Print Statement</span> বাটনে ক্লিক করে পাম্পের সম্পূর্ণ রিকনসিলিয়েশন অডিট স্টেটমেন্ট প্রিন্ট বা পিডিএফ করুন।</li>
                </ol>
              </div>
            )}

            {activeTab === 'bowzer_tanker' && (
              <div className="space-y-4">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">
                    ৫. মোবাইল বোজার ট্যাংকার ও ডিপস্টিক অডিট (Bowzer Tanker & Depots)
                  </h3>
                  <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
                    সাইট মোবাইল রিফুয়েলিং ও ডিপস্টিক স্টক ভেরিফিকেশন
                  </span>
                </div>

                <p className="text-xs sm:text-sm">
                  কনস্ট্রাকশন সাইট বা মেগা প্রজেক্টে মোবাইল বোজার দিয়ে এক্সকাভেটর ও সাইট মেশিনে তেল সরবরাহ করা হয়। বোজারে তেলের চুরি রোধে বিশেষ ডিপস্টিক ক্যালিব্রেশন সুবিধা রয়েছে:
                </p>

                <ul className="space-y-2 text-xs sm:text-sm list-disc list-inside">
                  <li><strong>লোড এন্ট্রি:</strong> ডিপো থেকে বোজারে তেল লোড করার সময় ভলিউম ইনপুট দিন।</li>
                  <li><strong>সাইট ডিসপেনসেশন:</strong> সাইটে বিভিন্ন মেশিনে তেল দেওয়ার এন্ট্রি দিন।</li>
                  <li><strong>ফিজিক্যাল ডিপস্টিক লগ:</strong> দিন শেষে বা শিফট শেষে স্কেল ডিপস্টিক দিয়ে মেপে তেলের উচ্চতা (সেমি) দিন। সিস্টেম স্বয়ংক্রিয়ভাবে লিটারে রূপান্তর করে খতিয়ে দেখবে কোনো তেল ঘাটতি বা চুরি হয়েছে কিনা।</li>
                </ul>
              </div>
            )}

            {activeTab === 'anomaly_alerts' && (
              <div className="space-y-4">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">
                    ৬. তেল চুরি ও অ্যানোমালি অ্যালার্ট (AI Theft & Anomaly Detection)
                  </h3>
                  <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
                    স্বয়ংক্রিয় অপচয় ও চুরি শনাক্তকরণ ইঞ্জিন
                  </span>
                </div>

                <p className="text-xs sm:text-sm">
                  যখন কোনো গাড়ি বা মেশিনের প্রকৃত ফুয়েল খরচ তার স্ট্যান্ডার্ড বেঞ্চমার্ক থেকে ২০% এর বেশি বেড়ে যায় বা অস্বাভাবিক ওডোমিটার জাম্প দেখা যায়, তখন সিস্টেম তাৎক্ষণিকভাবে একটি <strong className="text-red-500">রেড অ্যানোমালি অ্যালার্ট</strong> তৈরি করে:
                </p>

                <ol className="space-y-2 list-decimal list-inside text-xs sm:text-sm">
                  <li>হেডারের লাল বেল আইকন বা সাইডবারের <span className="font-bold text-red-500">Anomalies</span> ট্যাবে যান।</li>
                  <li>অনিয়মযুক্ত স্লিপের বিস্তারিত তথ্য, ড্রাইভারের নাম ও পার্থক্যের শতাংশ দেখুন।</li>
                  <li>তদন্ত শেষে অডিট স্ট্যাটাস (Reviewed / Cleared / Suspect) পরিবর্তন করুন।</li>
                </ol>
              </div>
            )}

            {activeTab === 'bulk_import' && (
              <div className="space-y-4">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">
                    ৭. এক্সেল ও সিএসভি বাল্ক ইমপোর্ট (Excel / CSV Bulk Ingestion)
                  </h3>
                  <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
                    এক ক্লিকে শত শত এন্ট্রি আপলোড
                  </span>
                </div>

                <p className="text-xs sm:text-sm">
                  হাতে একটি একটি করে এন্ট্রি না দিয়ে আপনার এক্সেল ফাইল সরাসরি সিস্টেমে আপলোড করতে পারবেন:
                </p>

                <ol className="space-y-2 list-decimal list-inside text-xs sm:text-sm">
                  <li>সাইডবার বা হেডার থেকে <span className="font-bold text-amber-500">Bulk Import</span> খুলুন।</li>
                  <li>ড্রপডাউন থেকে ক্যাটাগরি সিলেক্ট করুন (যেমন: Vehicles, Fuel Slips, Pumps, Companies)।</li>
                  <li><span className="font-bold text-indigo-500">Download Template (.xlsx)</span> বাটনে ক্লিক করে স্যাম্পল এক্সেল ফাইল নামিয়ে নিন।</li>
                  <li>আপনার ডেটা সেই এক্সেলে পেস্ট করে ফাইলটি আপলোড করলেই সাথে সাথে সিস্টেমে সংরক্ষিত হয়ে যাবে।</li>
                </ol>
              </div>
            )}

            {activeTab === 'pdf_reports' && (
              <div className="space-y-4">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">
                    ৮. লোগোযুক্ত অফিশিয়াল A4 রিপোর্ট (Official PDF Reports)
                  </h3>
                  <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
                    টাইমস নিউ রোমান ফন্ট ও কোম্পানির অফিশিয়াল লেটারহেড
                  </span>
                </div>

                <p className="text-xs sm:text-sm">
                  ফুয়েলনেস্টের সকল রিপোর্ট আন্তর্জাতিক কর্পোরেট স্ট্যান্ডার্ড A4 সাইজ এবং Times New Roman ফন্টে ডিজাইন করা:
                </p>

                <ul className="space-y-2 text-xs sm:text-sm list-disc list-inside">
                  <li><strong>কোম্পানির লোগো:</strong> আপনার যুক্ত করা কোম্পানির লোগোটি স্বয়ংক্রিয়ভাবে রিপোর্টের শীর্ষে কোম্পানির নামের পাশে নিখুঁত অনুপাতে বসে যায়।</li>
                  <li><strong>রিপোর্টের ধরন:</strong> ভেহিক্যাল পারফরম্যান্স অডিট, কোম্পানি মাসিক স্টেটমেন্ট, দৈনিক বিতরণ স্টেটমেন্ট ইত্যাদি।</li>
                  <li><strong>ভেক্টর পিডিএফ ডাউনলোড:</strong> <span className="font-bold text-amber-500">Download PDF</span> বাটনে ক্লিক করে যে কোনো ডিভাইসে নিখুঁত প্রিন্ট উপযোগী পিডিএফ নামিয়ে নিন।</li>
                </ul>
              </div>
            )}

            {activeTab === 'subscriptions' && (
              <div className="space-y-4">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">
                    ৯. সাবস্ক্রিপশন প্ল্যান ও পেমেন্ট (Subscription & Renewal Guide)
                  </h3>
                  <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
                    স্বচ্ছ কমার্শিয়াল প্ল্যান ও নবায়ন নিয়মাবলী
                  </span>
                </div>

                <div className="space-y-3 text-xs sm:text-sm">
                  <p>
                    ফুয়েলনেস্টে সকল গ্রাহকের জন্য ৫টি অফিসিয়াল সাবস্ক্রিপশন প্যাকেজ রয়েছে:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <h4 className="font-bold text-slate-900 dark:text-white">১. ৩ দিনের ফ্রি ট্রায়াল (0 BDT)</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        সকল অপশন ও ফিচার সম্পূর্ণ সক্রিয় থাকে। স্ক্রিনের শীর্ষে সবসময় ট্রায়ালের নোটিফিকেশন প্রদর্শন করে।
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <h4 className="font-bold text-amber-500">২. ১ মাস প্ল্যান (749 BDT)</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        ৩০ দিনের মেয়াদ। সব ফিচার ও অপশন আনলকড।
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <h4 className="font-bold text-amber-500">৩. ৩ মাস প্ল্যান (2,199 BDT)</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        ৯০ দিনের ত্রৈমাসিক প্যাকেজ। ফুল অপশন ও সেভিংস।
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <h4 className="font-bold text-amber-500">৪. ৬ মাস প্ল্যান (3,999 BDT)</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        ১৮০ দিনের অর্ধ-বার্ষিক প্যাকেজ। ১১% সাশ্রয়ী।
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-amber-500/40 col-span-1 sm:col-span-2 bg-amber-500/5">
                      <h4 className="font-bold text-amber-600 dark:text-amber-400">৫. ১২ মাস (১ বছর) প্ল্যান (7,999 BDT)</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                        ৩৬৫ দিনের পূর্ণ বার্ষিক প্যাকেজ। সর্বোচ্চ সাশ্রয় ও অগ্রাধিকারভিত্তিক ২৪/৭ সহায়তা।
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 mt-4">
                    <h4 className="font-bold text-slate-900 dark:text-white">মেয়াদ উত্তীর্ণের সতর্কবার্তা:</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      যেকোনো প্রিমিয়াম প্ল্যানের মেয়াদ শেষ হওয়ার ৭ দিন আগে থেকে স্ক্রিনের ওপরে নোটিফিকেশন ব্যানার ভেসে উঠবে, যাতে বাকি দিন ও নবায়নের লিঙ্ক প্রদর্শিত হবে। পেমেন্ট সম্পন্ন হলে অ্যাডমিন ভেরিফিকেশন সাপেক্ষে অ্যাকাউন্ট নিরবচ্ছিন্ন থাকবে।
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900">
          <span>FuelNest Enterprise Fleet & Fuel Documentation</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold transition-colors cursor-pointer"
          >
            {language === 'bn' ? 'বন্ধ করুন' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
