export interface SiteContactInfo {
  email: string;
  whatsapp: string;
  phone: string;
  alt_phone?: string;
  address: string;
  city: string;
  country: string;
  working_hours: string;
  support_note: string;
}

export interface SiteAboutContent {
  title: string;
  subtitle: string;
  story_p1: string;
  story_p2: string;
  mission: string;
  vision: string;
  stats: Array<{ label: string; value: string; desc: string }>;
  core_values: Array<{ title: string; desc: string }>;
}

export interface SiteLegalSection {
  id: string;
  title: string;
  content: string;
}

export interface SiteFaqItem {
  id: string;
  category: 'Metrics' | 'Billing' | 'Security' | 'Hardware' | 'General';
  question: string;
  answer: string;
}

export interface SiteContentConfig {
  contact: SiteContactInfo;
  about: SiteAboutContent;
  privacy: {
    title: string;
    last_updated: string;
    intro: string;
    sections: SiteLegalSection[];
  };
  terms: {
    title: string;
    last_updated: string;
    intro: string;
    sections: SiteLegalSection[];
  };
  faqs: SiteFaqItem[];
}

export const DEFAULT_SITE_CONTENT: SiteContentConfig = {
  contact: {
    email: 'admin.fuelnest@gmail.com',
    whatsapp: '+8801775316434',
    phone: '01775316434',
    alt_phone: '01903200907',
    address: 'Ruppur Mor, Paksey, Ishwardi, Pabna / Gulshan-2, Dhaka',
    city: 'Dhaka & Pabna',
    country: 'Bangladesh',
    working_hours: 'Saturday – Thursday: 8:00 AM – 9:00 PM (BST)',
    support_note: '24/7 Priority Emergency Support for Industrial Bowzer Depots & Active Mega-Project Fleets'
  },
  about: {
    title: 'Pioneering Commercial Fuel & Heavy Equipment Telemetry in Bangladesh',
    subtitle: 'Built specifically for construction contractors, logistics operators, bowzer depot owners, and industrial fleet managers.',
    story_p1: 'FuelNest was engineered in response to the massive financial leakages faced by heavy engineering and transport companies in Bangladesh. Construction sites, earthmoving projects, and long-haul logistics fleets routinely lose 15% to 28% of their fuel expenditure through unaccounted generator consumption, bowzer stock discrepancies, highway pump invoice manipulation, and fuel siphoning.',
    story_p2: 'Conventional GPS trackers only count kilometers — they fail miserably on hydraulic excavators, pile drivers, crawler cranes, and standby generators where the work metric is engine hours (Liters Per Hour - LPH). FuelNest bridges this critical gap by delivering true dual-metric analytics (LPH vs KMPL), site bowzer dip-chart reconciliation, pump credit ledgers, and automated statistical anomaly alerts.',
    mission: 'To empower fleet operators with 100% transparent, tamper-proof fuel telemetry and eliminate commercial leakages across heavy equipment and logistics operations.',
    vision: 'To become the premier industrial telemetry and fleet management platform across South Asia, driving economic efficiency and sustainable energy consumption.',
    stats: [
      { label: 'Fuel Saved Annually', value: '2.4M+ Liters', desc: 'Across partner fleets in infrastructure & logistics' },
      { label: 'Reconciliation Accuracy', value: '99.8%', desc: 'Site Bowzer vs Tanker Dip-Chart precision' },
      { label: 'Active Equipment Tracked', value: '500+ Assets', desc: 'Excavators, Bowzers, Dumpers & Prime Movers' },
      { label: 'Average ROI', value: '18 Days', desc: 'Recovered through pilferage elimination' }
    ],
    core_values: [
      {
        title: 'Precision Over Estimation',
        desc: 'We replace rough driver logbooks and paper chits with mathematically validated meter-to-meter consumption logs and real dip-chart calculations.'
      },
      {
        title: 'Dual-Engine Architecture',
        desc: 'Different equipment speaks different metrics. We treat stationary equipment (LPH) with the exact same commercial rigor as road vehicles (KMPL).'
      },
      {
        title: 'Operator Integrity & Audit Trail',
        desc: 'Every fuel issue, bowzer transfer, and pump payment is permanently cryptographically tied to the authorized operator with timestamp and slip image proof.'
      },
      {
        title: 'Local Context, Global Quality',
        desc: 'Tailored for Bangladesh operating conditions — supporting local MFS (bKash & Nagad), offline PWA logging on remote riverbank sites, and dual Bengali-English interfaces.'
      }
    ]
  },
  privacy: {
    title: 'FuelNest Telemetry & Workspace Privacy Policy',
    last_updated: 'October 1, 2026',
    intro: 'This Privacy Policy describes how FuelNest Technologies ("FuelNest", "we", "our") collects, secures, uses, and safeguards organizational telemetry, equipment data, and user information across our multi-tenant SaaS platform.',
    sections: [
      {
        id: 'data-collection',
        title: '1. Information We Collect',
        content: 'We collect information provided directly by tenant administrators (company name, administrator name, verified email, official contact phone) as well as operational telemetry entered or synced from fleet operations. This includes vehicle registration numbers, hour meter/odometer readings, fuel issue quantities, site bowzer stock levels, pump vendor ledger balances, and payment transaction receipts. We do not collect private personal browsing habits or unrelated personal data.'
      },
      {
        id: 'multi-tenant-isolation',
        title: '2. Multi-Tenant Cryptographic Isolation',
        content: 'FuelNest enforces strict multi-tenant data isolation. Every telemetry record, bowzer inventory log, vehicle benchmark, and fuel entry is scoped to the tenant unique identifier (tenant_id). No tenant can view, query, or infer data belonging to another workspace. Access tokens and session credentials are encrypted with industry-standard bcrypt and TLS 1.3 transport security.'
      },
      {
        id: 'data-usage',
        title: '3. How We Use Your Telemetry Data',
        content: 'Your operational data is used exclusively to provide workspace functionality: calculating consumption variances (LPH/KMPL), detecting fuel drainage anomalies, balancing bowzer stock levels, generating PDF audit reports, and notifying your assigned managers. We never sell, rent, commercialize, or aggregate your proprietary consumption data to third-party fuel suppliers or competitors.'
      },
      {
        id: 'contact-forms',
        title: '4. Contact Inquiries & Communication',
        content: 'When you submit inquiries through our contact forms or customer support channels (admin.fuelnest@gmail.com, WhatsApp +8801775316434), your contact details are utilized strictly to address your technical requirements, provide demo provisioning, or resolve support tickets. You may request deletion of support correspondence at any time.'
      },
      {
        id: 'security-compliance',
        title: '5. Data Security & Retention',
        content: 'All databases are hosted on enterprise-grade cloud infrastructure with automatic encrypted snapshots and audit logging. Tenant data is retained for the active duration of the subscription plan plus a 90-day grace period following plan expiration, after which data may be permanently scrubbed upon verified administrator request.'
      },
      {
        id: 'contact-dpo',
        title: '6. Privacy Officer Contact',
        content: 'For questions regarding data protection, workspace data export, or privacy rights, contact our Data Protection Officer directly at admin.fuelnest@gmail.com or via WhatsApp at +8801775316434.'
      }
    ]
  },
  terms: {
    title: 'FuelNest SaaS Service Agreement & Terms of Use',
    last_updated: 'October 1, 2026',
    intro: 'Please review these Terms of Service carefully before creating a workspace on the FuelNest Cloud Platform. By registering an account or initiating a Free Trial, you agree to be bound by these provisions.',
    sections: [
      {
        id: 'account-creation',
        title: '1. Account Registration & Master Approval',
        content: 'To prevent fraudulent deployments and safeguard platform resources, all workspace registration requests (including 3-Day Free Trial and Premium Plans) are subject to verification and approval by the FuelNest Master Control Administration. You agree to provide accurate company credentials and represent that you hold organizational authority to manage fleet telemetry.'
      },
      {
        id: 'free-trial',
        title: '2. 3-Day Free Trial Evaluation',
        content: 'Eligible companies receive a 3-Day Free Trial with complete access to heavy equipment tracking, bowzer stock logs, and anomaly detection. Upon conclusion of the trial period, workspace access will automatically suspend unless a commercial subscription plan (1 Month, 3 Months, 6 Months, or 1 Year) is activated.'
      },
      {
        id: 'billing-mfs',
        title: '3. Subscription Fees & Payment Methods',
        content: 'Subscription fees are billed in Bangladesh Taka (BDT) and payable via official Mobile Financial Services: bKash (01903200907) or Nagad (01775316434). When completing payment, administrators must submit their valid Transaction ID (TrxID) for instant automated or manual verification. Subscriptions are activated immediately upon transaction confirmation.'
      },
      {
        id: 'uptime-sla',
        title: '4. Service Availability & SLA',
        content: 'FuelNest strives to maintain 99.9% uptime for cloud workspace access. Scheduled maintenance will be announced with prior notice where practicable. The platform includes offline Progressive Web App (PWA) client caching to ensure operators on remote project sites can record fuel entries without interruption.'
      },
      {
        id: 'acceptable-use',
        title: '5. Acceptable Use & Account Security',
        content: 'Subscribers are strictly prohibited from attempting to compromise platform infrastructure, reverse engineering telemetry algorithms, or uploading malicious payloads. Subscribers are solely responsible for maintaining the confidentiality of their Super Admin and Manager credentials.'
      },
      {
        id: 'termination-refunds',
        title: '6. Cancellation & Data Export',
        content: 'Subscribers may cancel their plan at any time. Subscribers maintain full rights to export their complete historical fuel entries, vehicle registers, and audit ledgers in Excel / CSV / PDF formats prior to workspace decommission.'
      }
    ]
  },
  faqs: [
    {
      id: 'faq-1',
      category: 'Metrics',
      question: 'Why does FuelNest use Liters Per Hour (LPH) instead of KMPL for excavators?',
      answer: 'Heavy earthmoving equipment such as hydraulic excavators, motor graders, crawler cranes, and standby diesel generators do not register meaningful road distance. Measuring them by KM/L gives false data. FuelNest tracks engine hour-meter run intervals, giving an exact Liters Per Hour (LPH) burn rate benchmark. If an excavator burns 18 L/hr against a 13 L/hr standard, FuelNest instantly flags the anomaly.'
    },
    {
      id: 'faq-2',
      category: 'Metrics',
      question: 'Can I track highway transport trucks with KM/L in the same workspace?',
      answer: 'Yes! FuelNest is a true dual-engine platform. Stationary and earthmoving equipment are evaluated in LPH, while highway dump trucks, long-haul trailers, and pickups are evaluated in KMPL, all within one unified fleet dashboard.'
    },
    {
      id: 'faq-3',
      category: 'Hardware',
      question: 'Do I need expensive GPS or fuel tank sensors to use FuelNest?',
      answer: 'No! FuelNest is designed for immediate operational deployment without requiring expensive, breakable fuel tank sensors. Operators or site supervisors log fuel issues using our mobile-friendly interface (or QR code scan), entering the hour meter or odometer. FuelNest mathematical anomaly engine compares readings against benchmarks and historical trends to identify theft and meter tampering.'
    },
    {
      id: 'faq-4',
      category: 'Billing',
      question: 'How do I pay for my subscription in Bangladesh?',
      answer: 'You can pay instantly using bKash (01903200907) or Nagad (01775316434). Simply send the plan fee, copy the Transaction ID (TrxID), and enter it during checkout. Your workspace will be approved and activated promptly.'
    },
    {
      id: 'faq-5',
      category: 'Security',
      question: 'Can my project managers or pump operators view each other’s confidential data?',
      answer: 'FuelNest features role-based access control (RBAC). Super Admins have full control, Project Managers see operational analytics, and Pump / Bowzer Operators can only issue fuel and view their daily registers without access to company financial totals.'
    },
    {
      id: 'faq-6',
      category: 'General',
      question: 'What is the Bowzer Depot module?',
      answer: 'Site Bowzer Depot tracks on-site mobile fuel tankers and stationary diesel storage tanks. When bulk fuel is delivered by highway bowzers, you record dip levels. As machinery refuels from the bowzer, stocks deduct automatically, pinpointing site storage evaporation or theft.'
    }
  ]
};
