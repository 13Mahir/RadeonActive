// src/context/LanguageContext.tsx
import { createContext, useContext, useState, ReactNode } from 'react';

export type Language = 'en' | 'hi' | 'gu';

// Translation dictionary
const translations: Record<Language, Record<string, string>> = {
  en: {
    // Navigation
    'nav.intelligence_hub': 'Intelligence Hub',
    'nav.investigation_queue': 'Investigation Queue',
    'nav.scheme_verification': 'Scheme Verification',
    'nav.audit_ledger': 'Audit Ledger',
    'nav.leakage_analytics': 'Leakage Analytics',
    'nav.data_ingestion': 'Data Ingestion',
    'nav.user_management': 'User Management',
    'nav.settings': 'Settings',
    'nav.my_assignments': 'My Assignments',
    'nav.field_verification': 'Field Verification',
    'nav.audit_console': 'Audit Console',
    'nav.pattern_analysis': 'Pattern Analysis',
    'nav.analytics': 'Analytics',
    'nav.system_admin': 'System Admin',
    'nav.state_heatmap': 'State Heatmap',
    'nav.support': 'Support',
    'nav.archive': 'Archive',
    'nav.sign_out': 'Sign Out',

    // Dashboard
    'dashboard.title': 'System Governance Hub',
    'dashboard.subtitle': 'Real-time oversight of Gujarat DBT distribution and anomaly detection across 3 schemes.',
    'dashboard.heatmap_title': 'District Risk Heatmap',
    'dashboard.live_feed_title': 'Live Intelligence Feed',
    'dashboard.total_transactions': 'Total Transactions',
    'dashboard.flagged_anomalies': 'Flagged Anomalies',
    'dashboard.leakage_value': 'Est. Leakage Value',
    'dashboard.high_risk_cases': 'High Risk Cases',

    // Investigation
    'investigation.title': 'District Overview',
    'investigation.queue_title': 'Priority Investigation Queue',
    'investigation.assign': 'Assign Case',
    'investigation.escalate': 'Escalate',

    // Heatmap layers
    'heatmap.layer.scheme': 'By Scheme',
    'heatmap.layer.leakage_type': 'By Flag Reason',
    'heatmap.layer.risk_level': 'By Risk Level',
    'heatmap.layer.amount': 'By Amount',
    'heatmap.layer.deceased': 'Deceased Only',
    'heatmap.layer.unwithdrawn': 'Unclaimed Only',

    // Leakage types
    'leakage.DECEASED': 'Deceased Beneficiary',
    'leakage.DUPLICATE': 'Duplicate Identity',
    'leakage.UNWITHDRAWN': 'Unwithdrawn Funds',
    'leakage.CROSS_SCHEME': 'Cross-Scheme Duplication',

    // Status
    'status.Flagged': 'Flagged',
    'status.Reviewing': 'Reviewing',
    'status.Verified': 'Verified',
    'status.Fraud': 'Fraud Confirmed',
    'status.Cleared': 'Cleared',

    // Settings
    'settings.title': 'Settings',
    'settings.language': 'Language',
    'settings.profile': 'Your Profile',
    'settings.notifications': 'Notifications',
    'settings.default_district': 'Default District Filter',
    'settings.save': 'Save Preferences',
    'settings.saved': 'Preferences Saved',
  },

  hi: {
    // Navigation
    'nav.intelligence_hub': 'इंटेलिजेंस हब',
    'nav.investigation_queue': 'जांच सूची',
    'nav.scheme_verification': 'योजना सत्यापन',
    'nav.audit_ledger': 'ऑडिट लेजर',
    'nav.leakage_analytics': 'लीकेज विश्लेषण',
    'nav.data_ingestion': 'डेटा अपलोड',
    'nav.user_management': 'उपयोगकर्ता प्रबंधन',
    'nav.settings': 'सेटिंग्स',
    'nav.my_assignments': 'मेरे कार्य',
    'nav.field_verification': 'फील्ड सत्यापन',
    'nav.audit_console': 'ऑडिट कंसोल',
    'nav.pattern_analysis': 'पैटर्न विश्लेषण',
    'nav.analytics': 'विश्लेषण',
    'nav.system_admin': 'सिस्टम व्यवस्थापक',
    'nav.state_heatmap': 'राज्य हीटमैप',
    'nav.support': 'सहायता',
    'nav.archive': 'अभिलेख',
    'nav.sign_out': 'साइन आउट',

    // Dashboard
    'dashboard.title': 'शासन प्रणाली',
    'dashboard.subtitle': '3 योजनाओं में गुजरात DBT वितरण और विसंगति का वास्तविक समय निरीक्षण।',
    'dashboard.heatmap_title': 'जिला जोखिम हीटमैप',
    'dashboard.live_feed_title': 'लाइव इंटेलिजेंस फ़ीड',
    'dashboard.total_transactions': 'कुल लेनदेन',
    'dashboard.flagged_anomalies': 'चिह्नित विसंगतियां',
    'dashboard.leakage_value': 'अनुमानित रिसाव राशि',
    'dashboard.high_risk_cases': 'उच्च जोखिम मामले',

    // Investigation
    'investigation.title': 'जिला अवलोकन',
    'investigation.queue_title': 'प्राथमिकता जांच सूची',
    'investigation.assign': 'मामला सौंपें',
    'investigation.escalate': 'आगे बढ़ाएं',

    // Heatmap layers
    'heatmap.layer.scheme': 'योजना द्वारा',
    'heatmap.layer.leakage_type': 'कारण द्वारा',
    'heatmap.layer.risk_level': 'जोखिम स्तर द्वारा',
    'heatmap.layer.amount': 'राशि द्वारा',
    'heatmap.layer.deceased': 'केवल मृत',
    'heatmap.layer.unwithdrawn': 'केवल अदावा',

    // Leakage types
    'leakage.DECEASED': 'मृत लाभार्थी',
    'leakage.DUPLICATE': 'डुप्लिकेट पहचान',
    'leakage.UNWITHDRAWN': 'अनिकासित धनराशि',
    'leakage.CROSS_SCHEME': 'बहु-योजना दोहराव',

    // Status
    'status.Flagged': 'चिह्नित',
    'status.Reviewing': 'समीक्षाधीन',
    'status.Verified': 'सत्यापित',
    'status.Fraud': 'धोखाधड़ी पुष्टि',
    'status.Cleared': 'मंजूर',

    // Settings
    'settings.title': 'सेटिंग्स',
    'settings.language': 'भाषा',
    'settings.profile': 'आपकी प्रोफ़ाइल',
    'settings.notifications': 'सूचनाएं',
    'settings.default_district': 'डिफ़ॉल्ट जिला फ़िल्टर',
    'settings.save': 'प्राथमिकताएं सहेजें',
    'settings.saved': 'प्राथमिकताएं सहेजी गईं',
  },

  gu: {
    // Navigation
    'nav.intelligence_hub': 'ઇન્ટેલિજન્સ હબ',
    'nav.investigation_queue': 'તપાસ કતાર',
    'nav.scheme_verification': 'યોજના ચકાસણી',
    'nav.audit_ledger': 'ઓડિટ ખાતાવહી',
    'nav.leakage_analytics': 'લીકેજ વિશ્લેષણ',
    'nav.data_ingestion': 'ડેટા અપલોડ',
    'nav.user_management': 'વપરાશકર્તા સંચાલન',
    'nav.settings': 'સેટિંગ',
    'nav.my_assignments': 'મારા કાર્યો',
    'nav.field_verification': 'ફીલ્ડ ચકાસણી',
    'nav.audit_console': 'ઓડિટ કન્સોલ',
    'nav.pattern_analysis': 'પેટર્ન વિશ્લેષણ',
    'nav.analytics': 'વિશ્લેષણ',
    'nav.system_admin': 'સિસ્ટમ વ્યવસ્થાપક',
    'nav.state_heatmap': 'રાજ્ય હીટમેપ',
    'nav.support': 'સહાય',
    'nav.archive': 'આર્કાઇવ',
    'nav.sign_out': 'સાઇન આઉટ',

    // Dashboard
    'dashboard.title': 'શાસન પ્રણાલી',
    'dashboard.subtitle': '3 યોજનાઓ પાર ગુજરાત DBT વિતરણ અને વિસંગતિ શોધ.',
    'dashboard.heatmap_title': 'જિલ્લા જોખમ નકશો',
    'dashboard.live_feed_title': 'લાઇવ ઇન્ટેલિજન્સ ફીડ',
    'dashboard.total_transactions': 'કુલ વ્યવહારો',
    'dashboard.flagged_anomalies': 'ચિહ્નિત વિસંગતિઓ',
    'dashboard.leakage_value': 'અંદાજિત લીકેજ',
    'dashboard.high_risk_cases': 'ઉચ્ચ જોખમ કેસ',

    // Investigation
    'investigation.title': 'જિલ્લા અવલોકન',
    'investigation.queue_title': 'અગ્રતા તપાસ કતાર',
    'investigation.assign': 'કેસ સોંપો',
    'investigation.escalate': 'આગળ ધપાવો',

    // Heatmap layers
    'heatmap.layer.scheme': 'યોજના પ્રમાણે',
    'heatmap.layer.leakage_type': 'ધ્વજ કારણ પ્રમાણે',
    'heatmap.layer.risk_level': 'જોખમ સ્તર પ્રમાણે',
    'heatmap.layer.amount': 'રકમ પ્રમાણે',
    'heatmap.layer.deceased': 'ફક્ત મૃત',
    'heatmap.layer.unwithdrawn': 'ફક્ત અદાવા',

    // Leakage types
    'leakage.DECEASED': 'મૃત લાભાર્થી',
    'leakage.DUPLICATE': 'ડુપ્લિકેટ ઓળખ',
    'leakage.UNWITHDRAWN': 'ઉપાડ ન થયેલ નાણાં',
    'leakage.CROSS_SCHEME': 'ક્રોસ-સ્કીમ ડ્યુપ્લિકેશન',

    // Status
    'status.Flagged': 'ચિહ્નિત',
    'status.Reviewing': 'સમીક્ષા હેઠળ',
    'status.Verified': 'ચકાસવામાં આવ્યું',
    'status.Fraud': 'છેતરપિંડી પુષ્ટિ',
    'status.Cleared': 'મંજૂર',

    // Settings
    'settings.title': 'સેટિંગ',
    'settings.language': 'ભાષા',
    'settings.profile': 'તમારી પ્રોફાઇલ',
    'settings.notifications': 'સૂચનાઓ',
    'settings.default_district': 'ડિફોલ્ટ જિલ્લા ફિલ્ટર',
    'settings.save': 'પ્રાથમિકતાઓ સાચવો',
    'settings.saved': 'પ્રાથમિકતાઓ સાચવાઈ',
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (l: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key) => key
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('dbt_language') as Language) || 'en';
  });

  const setLanguage = (l: Language) => {
    setLanguageState(l);
    localStorage.setItem('dbt_language', l);
  };

  const t = (key: string): string => {
    return translations[language][key] || translations['en'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
