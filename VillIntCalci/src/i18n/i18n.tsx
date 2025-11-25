import React, { createContext, useContext, useMemo, useState } from 'react';

type Lang = 'en' | 'hi';

const translations: Record<Lang, Record<string, string>> = {
  en: {
    home_title: 'Village Interest Calculator',
    simple_interest: 'Simple Interest',
    compound_interest: 'Compound Interest',
    records: 'Records',
    settings: 'Settings',
    calculate: 'Calculate',
    save_record: 'Save Record',
    export_pdf: 'Export PDF',
    principal_label: 'Principal (₹)',
    rate_label: 'Rate (% per annum)',
    given_date: 'Given date',
    return_date: 'Return date',
    invalid_date: 'Invalid date',
    invalid_date_hint: 'Please use YYYY-MM-DD format.',
    invalid_range: 'Invalid range',
    invalid_range_hint: 'Return date must be after given date.',
    no_result: 'No result',
    no_result_hint: 'Please calculate before saving.',
    saved: 'Saved',
    saved_success: 'Record saved successfully',
    save_failed: 'Failed to save record',
    label_optional: 'Label (optional)',
    placeholder_label_bike: 'e.g. Loan for bike',
    interest_label: 'Interest:',
    total_label: 'Total:',
    period_label: 'Period:',
    days_label: 'Days:',
    cancel: 'CANCEL',
    ok: 'OK',
    compounds_per_year: 'Compounds per year',
    exempt_on: 'Exempt: ON',
    exempt_off: 'Exempt last partial year',
  },
  hi: {
    home_title: 'विलेज इंटरेस्ट कैल्कुलेटर',
    simple_interest: 'सरल ब्याज',
    compound_interest: 'चक्रवृद्धि ब्याज',
    records: 'रिकॉर्ड',
    settings: 'सेटिंग्स',
    calculate: 'गणना करें',
    save_record: 'रिकॉर्ड सहेजें',
    export_pdf: 'PDF एक्सपोर्ट',
    principal_label: 'मूलधन (₹)',
    rate_label: 'दर (% प्रति वर्ष)',
    given_date: 'दी गई तिथि',
    return_date: 'वापसी तिथि',
    invalid_date: 'अमान्य तिथि',
    invalid_date_hint: 'कृपया YYYY-MM-DD प्रारूप का उपयोग करें।',
    invalid_range: 'अमान्य सीमा',
    invalid_range_hint: 'वापसी तिथि, दी गई तिथि के बाद होनी चाहिए।',
    no_result: 'कोई परिणाम नहीं',
    no_result_hint: 'सहेजने से पहले गणना करें।',
    saved: 'सहेजा गया',
    saved_success: 'रिकॉर्ड सफलतापूर्वक सहेजा गया',
    save_failed: 'सहेजने में विफल',
    label_optional: 'लेबल (वैकल्पिक)',
    placeholder_label_bike: 'उदा. बाइक के लिए लोन',
    interest_label: 'ब्याज:',
    total_label: 'कुल:',
    period_label: 'अवधि:',
    days_label: 'दिन:',
    cancel: 'रद्द करें',
    ok: 'ठीक है',
    compounds_per_year: 'वर्ष में कम्पाउंड की संख्या',
    exempt_on: 'छूट: चालू',
    exempt_off: 'अंतिम आंशिक वर्ष को छूट दें',
  },
};

const I18nContext = createContext({
  lang: 'en' as Lang,
  setLang: (l: Lang) => {},
  t: (k: string) => k,
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>('en');
  const t = useMemo(
    () => (key: string) => translations[lang][key] ?? key,
    [lang],
  );

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  return useContext(I18nContext);
}

export default I18nContext;
