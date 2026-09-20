const fs = require('fs');

// 1. SaasOwnerPanel.tsx: replace ৳ with BDT
let saasContent = fs.readFileSync('src/components/SaasOwnerPanel.tsx', 'utf8');
saasContent = saasContent.split('৳ {stats.totalRevenue.toLocaleString()}').join('BDT {stats.totalRevenue.toLocaleString()}');
saasContent = saasContent.split('৳ {(sub?.price_bdt || 0).toLocaleString()}').join('BDT {(sub?.price_bdt || 0).toLocaleString()}');
fs.writeFileSync('src/components/SaasOwnerPanel.tsx', saasContent, 'utf8');

// 2. DatabaseStatusModal.tsx
let dbModal = fs.readFileSync('src/components/DatabaseStatusModal.tsx', 'utf8');
const dbReplacements = [
  ["return 'লোকাল স্টোরেজ মোড সক্রিয় রয়েছে। গিটহাবে নতুন ভার্সন পুশ করার পর Vercel স্বয়ংক্রিয়ভাবে সরাসরি TiDB ক্লাউডে কানেক্ট হবে।';", "return 'Safe Local Storage mode active. Once deployed or configured, FuelNest will automatically sync with TiDB Cloud MySQL.';"],
  ["error: `অ্যাপ্লিকেশনটি সুরক্ষিত লোকাল স্টোরেজ মোডে সক্রিয় রয়েছে। আপনার সকল নতুন সাবস্ক্রাইবার ও ডাটা নিরাপদে সংরক্ষিত আছে।`,", "error: 'Application is running safely in Local Storage mode. All newly created subscribers and records are preserved.',"],
  ["error: 'লোকাল স্টোরেজ মোড সক্রিয় রয়েছে। আপনার নতুন সাবস্ক্রাইবার ও সকল ডাটা ডিভাইসে সংরক্ষিত আছে।',", "error: 'Safe Local Storage mode active. All new subscribers and data are securely preserved on this device.',"],
  ["message: `লোকাল মোডে মোট ${allTenants.length} জন সাবস্ক্রাইবার, ${allUsers.length} জন ইউজার, এবং ${vehicles.length} টি গাড়ির তথ্য সংরক্ষিত আছে।`", "message: `Local storage contains ${allTenants.length} subscribers, ${allUsers.length} users, and ${vehicles.length} vehicles safely preserved.`"],
  ["message: `সফলভাবে মোট ${totalCount} টি রেকর্ড TiDB Cloud MySQL ডাটাবেসে সিঙ্ক সম্পন্ন হয়েছে!`", "message: `Successfully synchronized ${totalCount} records with TiDB Cloud MySQL Database!`"],
  ["const syncErrMsg = sanitizeErrorString(result.error) || sanitizeErrorString(result.message) || 'সিঙ্ক ব্যর্থ হয়েছে। ডাটাবেস সংযোগ পরীক্ষা করুন।';", "const syncErrMsg = sanitizeErrorString(result.error) || sanitizeErrorString(result.message) || 'Sync failed. Please check database connection.';"],
  [": (sanitizeErrorString(status.error) || 'আপনার নতুন তৈরি করা সাবস্ক্রাইবার ও সকল ডাটা নিরাপদে লোকাল স্টোরেজে সংরক্ষিত রয়েছে।')}", ": (sanitizeErrorString(status.error) || 'Your newly created subscribers and fleet records are safely preserved in storage.')}"],
  ["<span>TiDB Cloud ডাটাবেস সংযোগ বিবরণী</span>", "<span>TiDB Cloud Database Connection Details</span>"],
  ["💡 আপনার TiDB ক্লাস্টারের হোস্ট ও ইউজারনেম অ্যাপ্লিকেশনে কনফিগার করা রয়েছে। কোনো কারণে ক্লাউড সাময়িক অফলাইনে থাকলে বা Vercel স্ট্যাটিক মোডে চললে অ্যাপটি স্বয়ংক্রিয়ভাবে ব্রাউজারের লোকাল স্টোরেজ ব্যবহার করে যাতে কোনো ডাটা বা সাবস্ক্রাইবার না হারায়।", "💡 Your TiDB cluster host and username are configured in the application. If the cloud database is temporarily offline, the app automatically runs in local storage fallback mode so no subscriber data or fleet records are ever lost."],
  ["<span>ফ্রি লাইফটাইম MySQL ডাটাবেস ব্যবহারের সহজ নিয়ম (TiDB Cloud Serverless)</span>", "<span>Free Lifetime MySQL Database Setup Guide (TiDB Cloud Serverless)</span>"],
  ["Google AI Studio বা ক্লাউডে লাইফটাইম ফ্রিতে MySQL ডাটাবেস চালানোর জন্য সবচেয়ে সেরা অপশন হলো <strong>TiDB Cloud Serverless</strong>।", "The best option for running a lifetime free MySQL database is <strong>TiDB Cloud Serverless</strong>."],
  ["এতে কোনো ক্রেডিট কার্ড লাগে না, <strong>৫ জিবি ক্লাউড স্টোরেজ চিরদিনের জন্য সম্পূর্ণ ফ্রি</strong> এবং এটি ১০০% MySQL 8.0 কম্প্যাটিবল!", "No credit card required, <strong>5 GB Cloud Storage is 100% free forever</strong>, and it is fully MySQL 8.0 compatible!"],
  ["<span className=\"font-bold text-slate-900 dark:text-white\">TiDB Cloud একাউন্ট তৈরি করুন:</span>", "<span className=\"font-bold text-slate-900 dark:text-white\">Create TiDB Cloud Account:</span>"],
  ["</a> এ যান এবং আপনার Google Email দিয়ে ফ্রিতে সাইনআপ করুন।", "</a> and sign up for free with your Google Email."],
  ["<span className=\"font-bold text-slate-900 dark:text-white\">ফ্রি ক্লাস্টার তৈরি করুন:</span>", "<span className=\"font-bold text-slate-900 dark:text-white\">Create Free Cluster:</span>"],
  ["<strong>Create Cluster</strong> বাটনে ক্লিক করে <strong>Serverless (Free Tier)</strong> সিলেক্ট করুন। রিজিয়ন হিসেবে কাছাকাছি (যেমন: Singapore বা Mumbai) সিলেক্ট করে মাত্র ৫ সেকেন্ডে ক্লাস্টার রেডি হয়ে যাবে।", "Click <strong>Create Cluster</strong> and choose <strong>Serverless (Free Tier)</strong>. Select a nearby region (e.g. Singapore or Mumbai) and your cluster is ready in 5 seconds."],
  ["<span className=\"font-bold text-slate-900 dark:text-white\">ক্রেডেনশিয়াল সংগ্রহ করুন:</span>", "<span className=\"font-bold text-slate-900 dark:text-white\">Get Connection Credentials:</span>"],
  ["<strong>Connect</strong> বাটনে চাপ দিন এবং Host, User, Password সংগ্রহ করুন।", "Click <strong>Connect</strong> to copy the Host, User, and Password."],
  ["<span className=\"font-bold text-slate-900 dark:text-white\">Environment Secrets এ যুক্ত করুন:</span>", "<span className=\"font-bold text-slate-900 dark:text-white\">Add to Environment Secrets:</span>"],
  ["নিচের এনভায়রনমেন্ট ভেরিয়েবলগুলো আপনার AI Studio Secrets বা <code>.env</code> এ সেট করে দিন:", "Set these environment variables in your AI Studio Secrets or <code>.env</code>:"],
  ["<strong>অন্যান্য ফ্রি অপশন:</strong> আপনি চাইলে Aiven MySQL, Clever Cloud, FreeDB, অথবা আপনার নিজস্ব cPanel Web Hosting এর phpMyAdmin MySQL ডাটাবেসের হোস্ট ও ক্রেডেনশিয়াল ব্যবহার করেও লাইফটাইম চালাতে পারবেন।", "<strong>Other Free Options:</strong> You can also use Aiven MySQL, Clever Cloud, FreeDB, or your cPanel Web Hosting phpMyAdmin MySQL database."],
  ["নিচের সম্পূর্ণ SQL স্ক্রিপ্টটি TiDB SQL Editor বা phpMyAdmin এ রান করে টেবিল তৈরি করে নিতে পারেন।", "Run the complete SQL script below in TiDB SQL Editor or phpMyAdmin to initialize tables."]
];
for (const [from, to] of dbReplacements) {
  dbModal = dbModal.split(from).join(to);
}
fs.writeFileSync('src/components/DatabaseStatusModal.tsx', dbModal, 'utf8');
console.log('Processed DatabaseStatusModal.tsx');

// 3. ErrorBoundary.tsx
let eb = fs.readFileSync('src/components/ErrorBoundary.tsx', 'utf8');
eb = eb.split('<h1 className="text-xl font-bold text-white">FuelNest ইন্টারফেস রিলোড প্রয়োজন</h1>').join('<h1 className="text-xl font-bold text-white">FuelNest Interface Reload Required</h1>');
eb = eb.split('ব্রাউজারের কোনো উপাদানে সাময়িক ত্রুটি ঘটেছে। আপনার সমস্ত সাবস্ক্রাইবার ও ডাটাবেস রেকর্ড নিরাপদে সংরক্ষিত রয়েছে।').join('An unexpected browser component error occurred. All your subscribers and database records remain safely preserved.');
eb = eb.split('<span>পৃষ্ঠাটি রিলোড করুন (Reload)</span>').join('<span>Reload Application</span>');
eb = eb.split('<span>অ্যাপ রিস্টোর করুন</span>').join('<span>Restore App State</span>');
fs.writeFileSync('src/components/ErrorBoundary.tsx', eb, 'utf8');
console.log('Processed ErrorBoundary.tsx');

// 4. FuelEntryForm.tsx: line with অগ্রিম:
let fef = fs.readFileSync('src/components/FuelEntryForm.tsx', 'utf8');
fef = fef.split('`অগ্রিম: ${Math.abs(bal).toLocaleString()} ৳`').join('`Advance: BDT ${Math.abs(bal).toLocaleString()}`');
fs.writeFileSync('src/components/FuelEntryForm.tsx', fef, 'utf8');
console.log('Processed FuelEntryForm.tsx');

// 5. CsvExportMenu.tsx
let csvMenu = fs.readFileSync('src/components/CsvExportMenu.tsx', 'utf8');
csvMenu = csvMenu.split('Export CSV / সিএসভি ডাউনলোড').join('Export CSV');
csvMenu = csvMenu.split('Current View (বর্তমান পেজ)').join('Current View (Current Page)');
csvMenu = csvMenu.split('Whole List (সম্পূর্ণ তালিকা)').join('Complete Dataset (All Records)');
fs.writeFileSync('src/components/CsvExportMenu.tsx', csvMenu, 'utf8');
console.log('Processed CsvExportMenu.tsx');

// 6. PumpCreditView.tsx
let pcv = fs.readFileSync('src/components/PumpCreditView.tsx', 'utf8');
// replace ternary language === 'bn' in PumpCreditView
pcv = pcv.replace(/language === 'bn' \? '([^']+)' : '([^']+)'/g, "'$2'");
pcv = pcv.replace(/language === 'bn'\s*\?\s*'([^']+)'\s*:\s*'([^']+)'/g, "'$2'");
pcv = pcv.replace(/language === 'bn' \? `([^`]+)` : `([^`]+)`/g, "`$2`");
pcv = pcv.replace(/language === 'bn'\s*\?\s*`([^`]+)`\s*:\s*`([^`]+)`/g, "`$2`");

const pcvReplacements = [
  ["{t.preparedBy} (প্রস্তুতকারী)", "{t.preparedBy}"],
  ["{t.verifiedBy} (যাচাইকারী)", "{t.verifiedBy}"],
  ["{t.pumpAuthority} (পাম্প প্রতিনিধি)", "{t.pumpAuthority}"],
  ["? `বকেয়া: ৳${item.dueAmount.toLocaleString()}`", "? `Due: BDT ${item.dueAmount.toLocaleString()}`"],
  ["? `অগ্রিম: ৳${item.advanceAmount.toLocaleString()}`", "? `Advance: BDT ${item.advanceAmount.toLocaleString()}`"],
  [": 'পরিশোধিত'}", ": 'Settled'}"],
  ["placeholder=\"e.g. রূপালী ব্যাংক চেকের মাধ্যমে সেপ্টেম্বর মাসের বিল পরিশোধ\"", "placeholder=\"e.g. Bank Cheque / Wire transfer payment for monthly fuel settlement\""]
];
for (const [from, to] of pcvReplacements) {
  pcv = pcv.split(from).join(to);
}
fs.writeFileSync('src/components/PumpCreditView.tsx', pcv, 'utf8');
console.log('Processed PumpCreditView.tsx');
