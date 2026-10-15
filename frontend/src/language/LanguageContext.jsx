import { useEffect, useMemo, useState } from 'react'
import { LanguageContext } from './useLanguage.js'

const translations = {
  en: {
    upload: 'Upload & Analyze', dashboard: 'Dashboard', rules: 'Rules Library', demo: 'Demo Mode',
    languages: 'Language', labelTitle: 'Upload Label Image', analyze: 'Analyze label',
    rerun: 'Re-run checks', reset: 'Reset', food: 'Food product', selectImage: 'Drag & drop a label image or browse',
    textLabel: 'Label text', extracted: 'Extracted fields', checklist: 'Rule checklist', rawText: 'Label text',
    passed: 'Passed', failed: 'Failed', review: 'Review', all: 'All', noText: 'No text found, try a clearer photo.',
    disclaimer: 'Decision-support tool for preliminary checks. Final verification rests with authorised officials.',
    copySummary: 'Copy summary', downloadPdf: 'Download PDF report', downloadJson: 'Download JSON report',
    history: 'Session history', clearHistory: 'Clear history', batch: 'Batch mode', exportCsv: 'Export CSV',
    compliant: 'Compliant', nonCompliant: 'Non-compliant', needsReview: 'Needs review',
    result: '2. Result',
  },
  hi: {
    upload: 'अपलोड और जांचें', dashboard: 'डैशबोर्ड', rules: 'नियम सूची', demo: 'डेमो मोड',
    languages: 'भाषा', labelTitle: 'लेबल छवि अपलोड करें', analyze: 'लेबल जांचें',
    rerun: 'नियम फिर जांचें', reset: 'रीसेट', food: 'खाद्य उत्पाद', selectImage: 'लेबल छवि यहां छोड़ें या चुनें',
    textLabel: 'लेबल टेक्स्ट', extracted: 'निकाले गए फ़ील्ड', checklist: 'नियम जांच सूची', rawText: 'लेबल टेक्स्ट',
    passed: 'पास', failed: 'असफल', review: 'समीक्षा', all: 'सभी', noText: 'टेक्स्ट नहीं मिला, साफ़ फोटो आज़माएं।',
    disclaimer: 'प्रारंभिक जांच के लिए निर्णय-सहायता उपकरण। अंतिम सत्यापन अधिकृत अधिकारियों द्वारा किया जाएगा।',
    copySummary: 'सारांश कॉपी करें', downloadPdf: 'PDF रिपोर्ट डाउनलोड करें', downloadJson: 'JSON रिपोर्ट डाउनलोड करें',
    history: 'सत्र इतिहास', clearHistory: 'इतिहास साफ़ करें', batch: 'बैच मोड', exportCsv: 'CSV निर्यात करें',
    compliant: 'अनुपालक', nonCompliant: 'गैर-अनुपालक', needsReview: 'समीक्षा आवश्यक',
    result: '2. परिणाम',
  },
  mr: {
    upload: 'अपलोड आणि तपासा', dashboard: 'डॅशबोर्ड', rules: 'नियम सूची', demo: 'डेमो मोड',
    languages: 'भाषा', labelTitle: 'लेबल प्रतिमा अपलोड करा', analyze: 'लेबल तपासा',
    rerun: 'नियम पुन्हा तपासा', reset: 'रीसेट', food: 'अन्न उत्पादन', selectImage: 'लेबल प्रतिमा येथे टाका किंवा निवडा',
    textLabel: 'लेबल मजकूर', extracted: 'काढलेली माहिती', checklist: 'नियम तपासणी', rawText: 'लेबल मजकूर',
    passed: 'उत्तीर्ण', failed: 'अयशस्वी', review: 'पुनरावलोकन', all: 'सर्व', noText: 'मजकूर सापडला नाही, अधिक स्पष्ट फोटो वापरा.',
    disclaimer: 'प्राथमिक तपासणीसाठी निर्णय-सहाय्य साधन. अंतिम पडताळणी अधिकृत अधिकाऱ्यांकडून केली जाईल.',
    copySummary: 'सारांश कॉपी करा', downloadPdf: 'PDF अहवाल डाउनलोड करा', downloadJson: 'JSON अहवाल डाउनलोड करा',
    history: 'सत्र इतिहास', clearHistory: 'इतिहास साफ करा', batch: 'बॅच मोड', exportCsv: 'CSV निर्यात करा',
    compliant: 'अनुपालक', nonCompliant: 'अनुपालक नाही', needsReview: 'पुनरावलोकन आवश्यक',
    result: '2. निकाल',
  },
}

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => localStorage.getItem('ca-language') || 'en')
  useEffect(() => {
    document.documentElement.lang = language === 'hi' ? 'hi' : language === 'mr' ? 'mr' : 'en'
  }, [language])
  const updateLanguage = value => {
    localStorage.setItem('ca-language', value)
    document.documentElement.lang = value === 'hi' ? 'hi' : value === 'mr' ? 'mr' : 'en'
    setLanguage(value)
  }
  const value = useMemo(() => ({
    language,
    setLanguage: updateLanguage,
    t: key => translations[language]?.[key] || translations.en[key] || key,
  }), [language])
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}
