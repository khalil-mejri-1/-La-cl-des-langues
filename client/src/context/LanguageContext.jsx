import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../data/translations';
import { API_BASE_URL } from '../config';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('app_lang') || 'fr';
  });

  const [customNav, setCustomNav] = useState(() => {
    const saved = localStorage.getItem('app_custom_nav');
    return saved ? JSON.parse(saved) : null;
  });

  const [customSections, setCustomSections] = useState(() => {
    const saved = localStorage.getItem('app_custom_sections');
    return saved ? JSON.parse(saved) : {};
  });

  // Fetch custom nav and section settings from MongoDB Atlas on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const [navRes, secRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/settings/nav`),
          fetch(`${API_BASE_URL}/api/settings/sections`)
        ]);

        if (navRes.ok) {
          const navData = await navRes.json();
          if (navData.nav) {
            setCustomNav(navData.nav);
            localStorage.setItem('app_custom_nav', JSON.stringify(navData.nav));
          }
        }

        if (secRes.ok) {
          const secData = await secRes.json();
          if (secData.sections) {
            setCustomSections(secData.sections);
            localStorage.setItem('app_custom_sections', JSON.stringify(secData.sections));
          }
        }
      } catch (err) {
        console.log('Erreur chargement settings MongoDB:', err);
      }
    };
    fetchSettings();
  }, []);

  const updateNavTitles = async (newNavTitles) => {
    setCustomNav(newNavTitles);
    localStorage.setItem('app_custom_nav', JSON.stringify(newNavTitles));
    try {
      const res = await fetch(`${API_BASE_URL}/api/settings/nav`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nav: newNavTitles }),
      });
      return res.ok;
    } catch (err) {
      console.error('Erreur sauvegarde nav titles MongoDB:', err);
      return false;
    }
  };

  const updateSectionData = async (sectionKey, newSectionData) => {
    const updatedSections = {
      ...customSections,
      [sectionKey]: newSectionData,
    };
    setCustomSections(updatedSections);
    localStorage.setItem('app_custom_sections', JSON.stringify(updatedSections));

    try {
      const res = await fetch(`${API_BASE_URL}/api/settings/sections`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections: updatedSections }),
      });
      return res.ok;
    } catch (err) {
      console.error('Erreur sauvegarde section MongoDB:', err);
      return false;
    }
  };

  const baseTranslations = translations[lang] || translations.fr;
  
  const currentNav = customNav && customNav[lang]
    ? { ...baseTranslations.nav, ...customNav[lang] }
    : baseTranslations.nav;

  // Hero Section Customizations
  let heroSection = customSections?.hero?.[lang]
    ? { ...baseTranslations.hero, ...customSections.hero[lang] }
    : { ...baseTranslations.hero };

  // Custom Features Cards Array
  if (customSections?.hero?.features && Array.isArray(customSections.hero.features)) {
    const bgColors = ['bg-[#EAF5EA]', 'bg-[#FFF4E5]', 'bg-[#FCE8E6]', 'bg-[#E1F5FE]', 'bg-[#F3E5F5]'];
    const textColors = ['text-[#3B5E35]', 'text-[#D97706]', 'text-[#E53E3E]', 'text-[#0288D1]', 'text-[#6A1B9A]'];
    heroSection.features = customSections.hero.features.map((feat, i) => ({
      icon: feat.icon || 'star',
      text: feat[lang]?.text || feat.text || feat.fr?.text || '',
      bg: bgColors[i % bgColors.length],
      color: textColors[i % textColors.length],
    }));
  }

  // Custom Tutors Cards Array
  if (customSections?.hero?.tutors && Array.isArray(customSections.hero.tutors)) {
    heroSection.tutors = customSections.hero.tutors.map((tut) => ({
      name: tut[lang]?.name || tut.name || tut.fr?.name || '',
      desc: tut[lang]?.desc || tut.desc || tut.fr?.desc || '',
      img: tut.img || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400',
    }));
  }

  // Video Demo Customizations
  let homePageSection = customSections?.videoSection?.[lang]
    ? { ...baseTranslations.homePage, ...customSections.videoSection[lang] }
    : { ...baseTranslations.homePage };

  if (customSections?.hero?.[lang]?.videoTitle) {
    homePageSection.videoTag = customSections.hero[lang].videoTag || homePageSection.videoTag;
    homePageSection.videoTitle = customSections.hero[lang].videoTitle || homePageSection.videoTitle;
    homePageSection.videoDesc = customSections.hero[lang].videoDesc || homePageSection.videoDesc;
  }
  if (customSections?.hero?.videoUrl || customSections?.hero?.[lang]?.videoUrl) {
    homePageSection.videoUrl = customSections.hero.videoUrl || customSections.hero[lang]?.videoUrl;
  }

  const howItWorksSection = customSections?.howItWorks?.[lang]
    ? { ...baseTranslations.howItWorks, ...customSections.howItWorks[lang] }
    : baseTranslations.howItWorks;

  const testimonialsSection = customSections?.testimonials?.[lang]
    ? { ...baseTranslations.Testimonials, ...customSections.testimonials[lang] }
    : baseTranslations.Testimonials;

  const trustBarSection = customSections?.trustBar?.[lang]
    ? customSections.trustBar[lang]
    : baseTranslations.trustBar;

  // Dashboard Page Customizations
  const dashboardPageSection = {
    ...baseTranslations.dashboardPage,
    ...(customSections?.dashboardHeader?.[lang] || {}),
    ...(customSections?.nextSession?.[lang] || {}),
    ...(customSections?.favGames?.[lang] || {}),
    ...(customSections?.reminderBanner?.[lang] || {}),
  };

  // Parent Page Customizations
  const parentPageSection = {
    ...baseTranslations.parentPage,
    ...(customSections?.parentHeader?.[lang] || {}),
    ...(customSections?.parentHistory?.[lang] || {}),
    ...(customSections?.parentUpcoming?.[lang] || {}),
  };

  // Calendar Page Customizations
  const calendarPageSection = {
    ...baseTranslations.calendarPage,
    ...(customSections?.calendarHeader?.[lang] || {}),
    ...(customSections?.calendarStep1?.[lang] || {}),
    ...(customSections?.calendarStep2?.[lang] || {}),
    ...(customSections?.calendarStep3?.[lang] || {}),
    packOffer: {
      ...baseTranslations.calendarPage?.packOffer,
      ...(customSections?.calendarPack?.[lang] || {}),
    },
  };

  // Footer Customizations
  const footerSection = {
    ...baseTranslations.footer,
    ...(customSections?.footerSection?.[lang] || {}),
  };

  const t = {
    ...baseTranslations,
    nav: currentNav,
    hero: heroSection,
    homePage: homePageSection,
    howItWorks: howItWorksSection,
    Testimonials: testimonialsSection,
    trustBar: trustBarSection,
    dashboardPage: dashboardPageSection,
    parentPage: parentPageSection,
    calendarPage: calendarPageSection,
    footer: footerSection,
  };

  const isRtl = lang === 'ar';

  useEffect(() => {
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    localStorage.setItem('app_lang', lang);
  }, [lang, isRtl]);

  const toggleLang = (newLang) => {
    setLang(newLang);
  };

  return (
    <LanguageContext.Provider value={{ 
      lang, 
      setLang: toggleLang, 
      t, 
      isRtl, 
      customNav, 
      customSections, 
      updateNavTitles, 
      updateSectionData 
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
