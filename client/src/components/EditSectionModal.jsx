import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function EditSectionModal({ sectionKey, sectionTitle, onClose }) {
  const { lang, isRtl, customSections, updateSectionData } = useLanguage();
  const [activeTab, setActiveTab] = useState(lang); // 'fr' | 'ar' | 'en'
  const [activeSubTab, setActiveSubTab] = useState('general'); // 'general' | 'features' | 'tutors' | 'video'
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Initial state logic for sectionKey
  const getInitialData = () => {
    const existing = customSections?.[sectionKey] || {};
    
    if (sectionKey === 'hero') {
      const defaultFeatures = [
        {
          icon: 'school',
          fr: { text: 'Cours en ligne interactifs' },
          ar: { text: 'دروس تفاعلية عبر الإنترنت' },
          en: { text: 'Interactive online classes' },
        },
        {
          icon: 'person',
          fr: { text: 'Maîtresses expérimentées' },
          ar: { text: 'معلمات خبيرات ومتميزات' },
          en: { text: 'Experienced teachers' },
        },
        {
          icon: 'trending_up',
          fr: { text: 'Suivi personnalisé et progressif' },
          ar: { text: 'متابعة فردية ومستمرة' },
          en: { text: 'Personalized progress tracking' },
        },
      ];

      const defaultTutors = [
        {
          img: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400',
          fr: { name: 'Olfa', desc: "Enseignante d'arabe avec plus de 15 ans d'expérience." },
          ar: { name: 'ألفة', desc: 'أستاذة لغة عربية بخبرة تتجاوز 15 عاماً في التدريس.' },
          en: { name: 'Olfa', desc: 'Arabic language teacher with over 15 years of experience.' },
        },
        {
          img: 'https://images.unsplash.com/photo-1580894732413-801648a37947?auto=format&fit=crop&q=80&w=400',
          fr: { name: 'Feten', desc: "Spécialiste en FLE, passionnée par l'enseignement et la pédagogie." },
          ar: { name: 'فاتن', desc: 'مختصة في اللغة الفرنسية وشغوفة بالتعليم والبيداغوجيا الحديثة.' },
          en: { name: 'Feten', desc: 'Specialist in French as a Foreign Language, passionate about modern pedagogy.' },
        },
      ];

      return {
        fr: {
          tag: existing.fr?.tag || "Apprendre. Progresser. S'épanouir.",
          title: existing.fr?.title || "Bienvenue chez Les clés des langues",
          subtitle: existing.fr?.subtitle || "Notre plateforme accompagne les enfants et adolescents dans l'apprentissage de l'arabe et du français grâce à des cours en ligne interactifs, personnalisés et bienveillants.",
          tutorsTitle: existing.fr?.tutorsTitle || "Nos maîtresses",
          videoTag: existing.fr?.videoTag || "Démonstration vidéo",
          videoTitle: existing.fr?.videoTitle || "Découvrez notre méthode en vidéo",
          videoDesc: existing.fr?.videoDesc || "Regardez comment nos maîtresses certifiées accompagnent vos enfants vers le succès.",
          videoBtn: existing.fr?.videoBtn || "Regarder maintenant",
          welcomePrefix: existing.fr?.welcomePrefix || "Bienvenue, ",
          childSpacePrefix: existing.fr?.childSpacePrefix || "Espace de votre enfant: ",
          welcomeBtn: existing.fr?.welcomeBtn || "Espace Parent",
          welcomeEmoji: existing.fr?.welcomeEmoji || "👨‍👩‍👧",
        },
        ar: {
          tag: existing.ar?.tag || "تعلم. تقدم. ازدهر.",
          title: existing.ar?.title || "مرحباً بكم في منصة مفاتيح اللغات",
          subtitle: existing.ar?.subtitle || "منصتنا ترافق الأطفال والشباب في تعلم اللغة العربية والفرنسية من خلال دروس تفاعلية، مخصصة وممتعة عبر الإنترنت.",
          tutorsTitle: existing.ar?.tutorsTitle || "معلماتنا المتميزات",
          videoTag: existing.ar?.videoTag || "عرض توضيحي",
          videoTitle: existing.ar?.videoTitle || "اكتشف أسلوبنا التعلمي بالفيديو",
          videoDesc: existing.ar?.videoDesc || "شاهد كيف ترافق معلماتنا المتميزات أطفالكم نحو النجاح والتألق.",
          videoBtn: existing.ar?.videoBtn || "شاهد الفيديو الآن",
          welcomePrefix: existing.ar?.welcomePrefix || "مرحباً بك، ",
          childSpacePrefix: existing.ar?.childSpacePrefix || "حساب طفلك: ",
          welcomeBtn: existing.ar?.welcomeBtn || "فضاء الولي",
          welcomeEmoji: existing.ar?.welcomeEmoji || "👨‍👩‍👧",
        },
        en: {
          tag: existing.en?.tag || "Learn. Progress. Succeed.",
          title: existing.en?.title || "Welcome to La clé des langues",
          subtitle: existing.en?.subtitle || "Our platform accompanies children and teenagers in learning Arabic and French through interactive, personalized, and engaging online lessons.",
          tutorsTitle: existing.en?.tutorsTitle || "Our Teachers",
          videoTag: existing.en?.videoTag || "Video Demo",
          videoTitle: existing.en?.videoTitle || "Discover our learning method in video",
          videoDesc: existing.en?.videoDesc || "Watch how our certified teachers accompany your children towards success.",
          videoBtn: existing.en?.videoBtn || "Watch now",
          welcomePrefix: existing.en?.welcomePrefix || "Welcome, ",
          childSpacePrefix: existing.en?.childSpacePrefix || "Child's space: ",
          welcomeBtn: existing.en?.welcomeBtn || "Parent Area",
          welcomeEmoji: existing.en?.welcomeEmoji || "👨‍👩‍👧",
        },
        features: existing.features || defaultFeatures,
        tutors: existing.tutors || defaultTutors,
        videoUrl: existing.videoUrl || 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      };
    }

    if (sectionKey === 'videoSection') {
      return {
        fr: {
          videoTag: existing.fr?.videoTag || "Démonstration vidéo",
          videoTitle: existing.fr?.videoTitle || "Découvrez notre méthode en vidéo",
          videoDesc: existing.fr?.videoDesc || "Regardez comment nos maîtresses certifiées accompagnent vos enfants vers le succès.",
          videoBtn: existing.fr?.videoBtn || "Regarder maintenant",
        },
        ar: {
          videoTag: existing.ar?.videoTag || "عرض توضيحي",
          videoTitle: existing.ar?.videoTitle || "اكتشف أسلوبنا التعلمي بالفيديو",
          videoDesc: existing.ar?.videoDesc || "شاهد كيف ترافق معلماتنا المتميزات أطفالكم نحو النجاح والتألق.",
          videoBtn: existing.ar?.videoBtn || "شاهد الفيديو الآن",
        },
        en: {
          videoTag: existing.en?.videoTag || "Video Demo",
          videoTitle: existing.en?.videoTitle || "Discover our method in video",
          videoDesc: existing.en?.videoDesc || "Watch how our certified teachers guide your children to success.",
          videoBtn: existing.en?.videoBtn || "Watch now",
        },
        videoUrl: existing.videoUrl || 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      };
    }

    if (sectionKey === 'calendarHeader') {
      return {
        fr: {
          title: existing.fr?.title || "Réserver une session",
          subtitle: existing.fr?.subtitle || "Choisissez une date et un créneau qui conviennent à votre emploi du temps.",
        },
        ar: {
          title: existing.ar?.title || "حجز جلسة جديدة",
          subtitle: existing.ar?.subtitle || "اختر اليوم والوقت المناسب لجدولك الدراسي بكل سهولة.",
        },
        en: {
          title: existing.en?.title || "Book a Session",
          subtitle: existing.en?.subtitle || "Choose a date and time slot that fits your schedule.",
        },
      };
    }

    if (sectionKey === 'calendarPack') {
      return {
        fr: {
          badge: existing.fr?.badge || "OFFRE SANS ENGAGEMENT",
          freeTag: existing.fr?.freeTag || "100% Gratuite !",
          title: existing.fr?.title || "Réservez votre séance d'essai gratuite 🎁",
          subtitle: existing.fr?.subtitle || "Offrez à votre enfant une première leçon individuelle d'essai sans aucun engagement pour découvrir notre méthode d'apprentissage ludique !",
          selectBtn: existing.fr?.selectBtn || "Réserver ma séance d'essai gratuite",
          activeTag: existing.fr?.activeTag || "Séance d'essai sélectionnée ✓",
        },
        ar: {
          badge: existing.ar?.badge || "عرض التّجربة بدون التزام",
          freeTag: existing.ar?.freeTag || "100% مجانية!",
          title: existing.ar?.title || "احجز جلستك التجريبية المجانية 🎁",
          subtitle: existing.ar?.subtitle || "امنح طفلك فرصة اكتشاف أسلوبنا التعلمي التفاعلي والممتع من خلال درس تجريبي فردي ومجاني بالكامل بدون أي التزام!",
          selectBtn: existing.ar?.selectBtn || "احجز جلستك التجريبية المجانية",
          activeTag: existing.ar?.activeTag || "تم اختيار الجلسة التجريبية ✓",
        },
        en: {
          badge: existing.en?.badge || "NO COMMITMENT OFFER",
          freeTag: existing.en?.freeTag || "100% Free!",
          title: existing.en?.title || "Book Your Free Trial Session 🎁",
          subtitle: existing.en?.subtitle || "Give your child a first individual trial lesson with zero commitment to discover our fun learning method!",
          selectBtn: existing.en?.selectBtn || "Book My Free Trial Session",
          activeTag: existing.en?.activeTag || "Free Trial Selected ✓",
        },
      };
    }

    if (sectionKey === 'calendarStep1') {
      return {
        fr: { step1Title: existing.fr?.step1Title || "Choisissez un jour" },
        ar: { step1Title: existing.ar?.step1Title || "اختر اليوم المناسب" },
        en: { step1Title: existing.en?.step1Title || "Select a Day" },
        ...(existing.availableDays ? { availableDays: existing.availableDays } : {}),
      };
    }

    if (sectionKey === 'calendarStep2') {
      return {
        fr: { step2Title: existing.fr?.step2Title || "Choisissez l'heure" },
        ar: { step2Title: existing.ar?.step2Title || "اختر التوقيت المناسب" },
        en: { step2Title: existing.en?.step2Title || "Select Time Slot" },
        ...(existing.timeSlots ? { timeSlots: existing.timeSlots } : {}),
      };
    }

    if (sectionKey === 'calendarStep3') {
      return {
        fr: {
          step3Title: existing.fr?.step3Title || "Mode de paiement",
          confirmButton: existing.fr?.confirmButton || "Confirmer la réservation",
        },
        ar: {
          step3Title: existing.ar?.step3Title || "طريقة الدفع المؤمّنة",
          confirmButton: existing.ar?.confirmButton || "تأكيد وتثبيت الحجز",
        },
        en: {
          step3Title: existing.en?.step3Title || "Payment Method",
          confirmButton: existing.en?.confirmButton || "Confirm Booking",
        },
      };
    }

    if (sectionKey === 'footerSection') {
      return {
        fr: {
          copy: existing.fr?.copy || "© 2026 Les clés des langues. Tous droits réservés.",
          parents: existing.fr?.parents || "Espace Parents",
          help: existing.fr?.help || "Aide & FAQ",
          privacy: existing.fr?.privacy || "Confidentialité",
        },
        ar: {
          copy: existing.ar?.copy || "© 2026 مفاتيح اللغات. جميع الحقوق محفوظة.",
          parents: existing.ar?.parents || "فضاء الأولياء",
          help: existing.ar?.help || "المساعدة والأسئلة",
          privacy: existing.ar?.privacy || "سياسة الخصوصية",
        },
        en: {
          copy: existing.en?.copy || "© 2026 La clé des langues. All rights reserved.",
          parents: existing.en?.parents || "Parents Area",
          help: existing.en?.help || "Help & FAQ",
          privacy: existing.en?.privacy || "Privacy Policy",
        },
      };
    }

    if (sectionKey === 'dashboardHeader') {
      return {
        fr: {
          welcome: existing.fr?.welcome || "Salut Léo !",
          welcomeSub: existing.fr?.welcomeSub || "Prêt pour de nouvelles aventures aujourd'hui ?",
          starsLabel: existing.fr?.starsLabel || "Étoiles",
          daysLabel: existing.fr?.daysLabel || "Jours",
        },
        ar: {
          welcome: existing.ar?.welcome || "مرحباً ليو!",
          welcomeSub: existing.ar?.welcomeSub || "هل أنت مستعد لمغامرات لغوية جديدة اليوم؟",
          starsLabel: existing.ar?.starsLabel || "نجوم",
          daysLabel: existing.ar?.daysLabel || "أيام متتالية",
        },
        en: {
          welcome: existing.en?.welcome || "Hi Leo!",
          welcomeSub: existing.en?.welcomeSub || "Ready for new adventures today?",
          starsLabel: existing.en?.starsLabel || "Stars",
          daysLabel: existing.en?.daysLabel || "Days",
        },
      };
    }

    if (sectionKey === 'nextSession') {
      return {
        fr: {
          nextSession: existing.fr?.nextSession || "Ta prochaine session",
          today: existing.fr?.today || "AUJOURD'HUI",
          time: existing.fr?.time || "16:30 - 17:00",
          teacher: existing.fr?.teacher || "Avec Marie",
          countdown: existing.fr?.countdown || "15:00",
          countdownSub: existing.fr?.countdownSub || "avant le début",
          joinButton: existing.fr?.joinButton || "Rejoindre la session",
        },
        ar: {
          nextSession: existing.ar?.nextSession || "جلستك القادمة",
          today: existing.ar?.today || "اليوم",
          time: existing.ar?.time || "16:30 - 17:00",
          teacher: existing.ar?.teacher || "مع الأستاذة ماري",
          countdown: existing.ar?.countdown || "15:00",
          countdownSub: existing.ar?.countdownSub || "قبل البداية",
          joinButton: existing.ar?.joinButton || "الانضمام إلى الجلسة",
        },
        en: {
          nextSession: existing.en?.nextSession || "Your Next Session",
          today: existing.en?.today || "TODAY",
          time: existing.en?.time || "16:30 - 17:00",
          teacher: existing.en?.teacher || "With Marie",
          countdown: existing.en?.countdown || "15:00",
          countdownSub: existing.en?.countdownSub || "before start",
          joinButton: existing.en?.joinButton || "Join Session",
        },
      };
    }

    if (sectionKey === 'favGames') {
      return {
        fr: {
          favGames: existing.fr?.favGames || "Tes jeux préférés",
          game1: existing.fr?.game1 || "Mémory des Animaux",
          game2: existing.fr?.game2 || "Bulles de Calcul",
          game3: existing.fr?.game3 || "Mots Magiques",
        },
        ar: {
          favGames: existing.ar?.favGames || "ألعابك المفضلة",
          game1: existing.ar?.game1 || "ذاكرة الحيوانات",
          game2: existing.ar?.game2 || "فقاعات الحساب",
          game3: existing.ar?.game3 || "الكلمات السحرية",
        },
        en: {
          favGames: existing.en?.favGames || "Your Favorite Games",
          game1: existing.en?.game1 || "Animal Memory",
          game2: existing.en?.game2 || "Math Bubbles",
          game3: existing.en?.game3 || "Magic Words",
        },
      };
    }

    if (sectionKey === 'reminderBanner') {
      return {
        fr: {
          reminderTag: existing.fr?.reminderTag || "Rappel",
          reminderText: existing.fr?.reminderText || "Prépare tes crayons pour la session de demain !",
        },
        ar: {
          reminderTag: existing.ar?.reminderTag || "تذكير هام",
          reminderText: existing.ar?.reminderText || "جهّز أقلامك الملونة لجلسة الغد الممتعة!",
        },
        en: {
          reminderTag: existing.en?.reminderTag || "Reminder",
          reminderText: existing.en?.reminderText || "Get your pencils ready for tomorrow's session!",
        },
      };
    }

    if (sectionKey === 'parentHeader') {
      return {
        fr: {
          title: existing.fr?.title || "Tableau de bord de Léo",
          subtitle: existing.fr?.subtitle || "Bienvenue dans l'espace parent. Suivez les progrès et gérez les sessions.",
          accountType: existing.fr?.accountType || "Compte Parent",
          accountBadge: existing.fr?.accountBadge || "Premium",
        },
        ar: {
          title: existing.ar?.title || "لوحة متابعة ليو",
          subtitle: existing.ar?.subtitle || "أهلاً بك في فضاء أولياء الأمور. تابع تقدم طفلك وقم بإدارة الجلسات بكل سهولة.",
          accountType: existing.ar?.accountType || "حساب ولي الأمر",
          accountBadge: existing.ar?.accountBadge || "بريميوم",
        },
        en: {
          title: existing.en?.title || "Leo's Dashboard",
          subtitle: existing.en?.subtitle || "Welcome to the parent area. Track progress and manage sessions easily.",
          accountType: existing.en?.accountType || "Parent Account",
          accountBadge: existing.en?.accountBadge || "Premium",
        },
      };
    }

    if (sectionKey === 'parentHistory') {
      return {
        fr: {
          historyTitle: existing.fr?.historyTitle || "Historique des Sessions",
          seeAll: existing.fr?.seeAll || "Voir tout",
          thDate: existing.fr?.thDate || "Date & Heure",
          thSubject: existing.fr?.thSubject || "Matière",
          thTutor: existing.fr?.thTutor || "Maîtresse",
          thStatus: existing.fr?.thStatus || "Statut",
          statusCompleted: existing.fr?.statusCompleted || "Complété",
          statusCancelled: existing.fr?.statusCancelled || "Annulé",
        },
        ar: {
          historyTitle: existing.ar?.historyTitle || "سجل الجلسات السابقة",
          seeAll: existing.ar?.seeAll || "عرض الكل",
          thDate: existing.ar?.thDate || "التاريخ والوقت",
          thSubject: existing.ar?.thSubject || "المادة",
          thTutor: existing.ar?.thTutor || "المعلم / المعلمة",
          thStatus: existing.ar?.thStatus || "الحالة",
          statusCompleted: existing.ar?.statusCompleted || "مكتملة",
          statusCancelled: existing.ar?.statusCancelled || "ملغاة",
        },
        en: {
          historyTitle: existing.en?.historyTitle || "Session History",
          seeAll: existing.en?.seeAll || "See All",
          thDate: existing.en?.thDate || "Date & Time",
          thSubject: existing.en?.thSubject || "Subject",
          thTutor: existing.en?.thTutor || "Teacher",
          thStatus: existing.en?.thStatus || "Status",
          statusCompleted: existing.en?.statusCompleted || "Completed",
          statusCancelled: existing.en?.statusCancelled || "Cancelled",
        },
      };
    }

    if (sectionKey === 'parentUpcoming') {
      return {
        fr: {
          upcomingTitle: existing.fr?.upcomingTitle || "À Venir",
          todayTag: existing.fr?.todayTag || "Aujourd'hui",
          joinVideo: existing.fr?.joinVideo || "Rejoindre la session",
          manageBtn: existing.fr?.manageBtn || "Gérer",
          planNew: existing.fr?.planNew || "Planifier une nouvelle session",
        },
        ar: {
          upcomingTitle: existing.ar?.upcomingTitle || "الجلسات القادمة",
          todayTag: existing.ar?.todayTag || "اليوم",
          joinVideo: existing.ar?.joinVideo || "الانضمام إلى الجلسة",
          manageBtn: existing.ar?.manageBtn || "إدارة الجلسة",
          planNew: existing.ar?.planNew || "جدولة جلسة جديدة",
        },
        en: {
          upcomingTitle: existing.en?.upcomingTitle || "Upcoming Sessions",
          todayTag: existing.en?.todayTag || "Today",
          joinVideo: existing.en?.joinVideo || "Join Session",
          manageBtn: existing.en?.manageBtn || "Manage",
          planNew: existing.en?.planNew || "Schedule New Session",
        },
      };
    }

    if (sectionKey === 'videoSection') {
      return {
        fr: {
          videoTag: existing.fr?.videoTag || "Démonstration vidéo",
          videoTitle: existing.fr?.videoTitle || "Découvrez notre méthode en vidéo",
          videoDesc: existing.fr?.videoDesc || "Regardez comment nos maîtresses certifiées accompagnent vos enfants vers le succès.",
        },
        ar: {
          videoTag: existing.ar?.videoTag || "عرض توضيحي",
          videoTitle: existing.ar?.videoTitle || "اكتشف أسلوبنا التعلمي بالفيديو",
          videoDesc: existing.ar?.videoDesc || "شاهد كيف ترافق معلماتنا المتميزات أطفالكم نحو النجاح والتألق.",
        },
        en: {
          videoTag: existing.en?.videoTag || "Video Demo",
          videoTitle: existing.en?.videoTitle || "Discover our method in video",
          videoDesc: existing.en?.videoDesc || "Watch how our certified teachers guide your children to success.",
        },
        videoUrl: existing.videoUrl || 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      };
    }

    if (sectionKey === 'howItWorks') {
      const defaultSteps = [
        {
          id: '1',
          icon: 'grid_view',
          fr: { stepNum: '1', title: 'Inscription', desc: 'Créez un compte parent en quelques clics.' },
          ar: { stepNum: '1', title: 'التسجيل', desc: 'أنشئ حساب الولي في بضع خطوات سهلة.' },
          en: { stepNum: '1', title: 'Sign Up', desc: 'Create a parent account in a few clicks.' },
        },
        {
          id: '2',
          icon: 'event_available',
          fr: { stepNum: '2', title: 'Réservation', desc: "Choisissez l'horaire idéal pour votre enfant." },
          ar: { stepNum: '2', title: 'الحجز', desc: 'اختر الوقت المناسب لطفلك.' },
          en: { stepNum: '2', title: 'Book', desc: 'Choose the ideal schedule for your child.' },
        },
        {
          id: '3',
          icon: 'menu_book',
          fr: { stepNum: '3', title: 'Apprendre', desc: 'Pratiquez avec nos jeux interactifs.' },
          ar: { stepNum: '3', title: 'تعلم', desc: 'تدرب مع ألعابنا التفاعلية الممتعة.' },
          en: { stepNum: '3', title: 'Learn', desc: 'Practice with our interactive games.' },
        },
        {
          id: '4',
          icon: 'record_voice_over',
          fr: { stepNum: '4', title: 'Session Live', desc: 'Rencontrez nos tuteurs certifiés en direct.' },
          ar: { stepNum: '4', title: 'حصة مباشرة', desc: 'التق بمدرسينا المعتمدين في جلسة مباشرة.' },
          en: { stepNum: '4', title: 'Live Session', desc: 'Meet our certified teachers live.' },
        },
      ];

      return {
        fr: {
          title: existing.fr?.title || "Comment ça marche ?",
          subtitle: existing.fr?.subtitle || "Un parcours simple pour commencer à apprendre.",
        },
        ar: {
          title: existing.ar?.title || "كيف تعمل المنصة؟",
          subtitle: existing.ar?.subtitle || "مسار بسيط وممتع للبدء في رحلة التعلم.",
        },
        en: {
          title: existing.en?.title || "How it works?",
          subtitle: existing.en?.subtitle || "A simple path to start learning.",
        },
        steps: existing.steps || defaultSteps,
      };
    }


    if (sectionKey === 'testimonials') {
      const defaultList = [
        {
          id: '1',
          stars: 5,
          fr: { quote: '"Mes enfants adorent ! Ils attendent leur session du mercredi avec impatience."', author: "- Sophie, Maman de Léo (7 ans)" },
          ar: { quote: '"أطفالي يعشقون هذه المنصة! ينتظرون جلسة يوم الأربعاء بشغف وحماس كبير."', author: "- صوفي، والدة ليو (7 سنوات)" },
          en: { quote: '"My children love it! They look forward to their Wednesday session with great enthusiasm."', author: "- Sophie, Leo's Mom (7 years old)" },
        },
        {
          id: '2',
          stars: 5,
          fr: { quote: '"Une méthode vraiment ludique. L\'apprentissage de l\'arabe est devenu un jeu pour ma fille."', author: "- Karim, Papa de Lina (5 ans)" },
          ar: { quote: '"أسلوب ممتع ومبتكر. أصبح تعلم اللغة العربية بمثابة لعبة مسلية لابنتي."', author: "- كريم، والد لينا (5 سنوات)" },
          en: { quote: '"A truly fun methodology. Learning Arabic became a game for my daughter."', author: "- Karim, Lina's Dad (5 years old)" },
        },
        {
          id: '3',
          stars: 4,
          fr: { quote: '"Les tuteurs sont très patients et la plateforme est super sécurisée. Je recommande !"', author: "- Marie, Maman de Thomas (9 ans)" },
          ar: { quote: '"المعلمون صبورون ومتميزون جداً، والمنصة آمنة ومحمية للغاية. أوصي بها بشدة!"', author: "- ماري، والدة توماس (9 سنوات)" },
          en: { quote: '"The tutors are very patient and the platform is super secure. Highly recommended!"', author: "- Marie, Thomas's Mom (9 years old)" },
        },
      ];

      return {
        fr: { title: existing.fr?.title || "Ce que disent les parents" },
        ar: { title: existing.ar?.title || "ما يقوله أولياء الأمور" },
        en: { title: existing.en?.title || "What parents say" },
        list: existing.list || defaultList,
      };
    }


    return {
      fr: existing.fr || {},
      ar: existing.ar || {},
      en: existing.en || {},
    };
  };

  const [formData, setFormData] = useState(getInitialData);

  const handleChange = (language, field, value) => {
    setFormData(prev => ({
      ...prev,
      [language]: {
        ...prev[language],
        [field]: value,
      },
    }));
  };

  // Features Card Handlers
  const handleFeatureChange = (index, langKey, value) => {
    setFormData(prev => {
      const updatedFeatures = [...(prev.features || [])];
      updatedFeatures[index] = {
        ...updatedFeatures[index],
        [langKey]: { text: value },
      };
      return { ...prev, features: updatedFeatures };
    });
  };

  const handleFeatureIconChange = (index, iconValue) => {
    setFormData(prev => {
      const updatedFeatures = [...(prev.features || [])];
      updatedFeatures[index] = {
        ...updatedFeatures[index],
        icon: iconValue,
      };
      return { ...prev, features: updatedFeatures };
    });
  };

  const addFeatureCard = () => {
    setFormData(prev => ({
      ...prev,
      features: [
        ...(prev.features || []),
        {
          icon: 'star',
          fr: { text: 'Nouvelle fonctionnalité' },
          ar: { text: 'خاصية جديدة' },
          en: { text: 'New Feature' },
        },
      ],
    }));
  };

  const removeFeatureCard = (index) => {
    setFormData(prev => ({
      ...prev,
      features: (prev.features || []).filter((_, i) => i !== index),
    }));
  };

  // Tutors Card Handlers
  const handleTutorChange = (index, langKey, field, value) => {
    setFormData(prev => {
      const updatedTutors = [...(prev.tutors || [])];
      updatedTutors[index] = {
        ...updatedTutors[index],
        [langKey]: {
          ...(updatedTutors[index][langKey] || {}),
          [field]: value,
        },
      };
      return { ...prev, tutors: updatedTutors };
    });
  };

  const handleTutorImgChange = (index, imgValue) => {
    setFormData(prev => {
      const updatedTutors = [...(prev.tutors || [])];
      updatedTutors[index] = {
        ...updatedTutors[index],
        img: imgValue,
      };
      return { ...prev, tutors: updatedTutors };
    });
  };

  const addTutorCard = () => {
    setFormData(prev => ({
      ...prev,
      tutors: [
        ...(prev.tutors || []),
        {
          img: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400',
          fr: { name: 'Nouvelle Maîtresse', desc: 'Description de la nouvelle maîtresse...' },
          ar: { name: 'معلمة جديدة', desc: 'وصف المعلمة الجديدة...' },
          en: { name: 'New Teacher', desc: 'Description of the new teacher...' },
        },
      ],
    }));
  };

  const removeTutorCard = (index) => {
    setFormData(prev => ({
      ...prev,
      tutors: (prev.tutors || []).filter((_, i) => i !== index),
    }));
  };

  // Available Days Handlers for calendarStep1
  const handleDayChange = (index, langKey, value) => {
    setFormData(prev => {
      const updatedDays = [...(prev.availableDays || [])];
      if (typeof updatedDays[index] === 'string') {
        updatedDays[index] = {
          id: String(index + 1),
          fr: updatedDays[index],
          ar: updatedDays[index],
          en: updatedDays[index],
          [langKey]: value,
        };
      } else {
        updatedDays[index] = {
          ...updatedDays[index],
          [langKey]: value,
        };
      }
      return { ...prev, availableDays: updatedDays };
    });
  };

  const addDayItem = () => {
    setFormData(prev => ({
      ...prev,
      availableDays: [
        ...(prev.availableDays || []),
        { id: String(Date.now()), fr: 'Nouveau jour', ar: 'يوم جديد', en: 'New day' },
      ],
    }));
  };

  const removeDayItem = (index) => {
    setFormData(prev => ({
      ...prev,
      availableDays: (prev.availableDays || []).filter((_, i) => i !== index),
    }));
  };

  // Time Slots Handlers for calendarStep2
  const handleTimeSlotChange = (index, langKey, value) => {
    setFormData(prev => {
      const updatedSlots = [...(prev.timeSlots || [])];
      if (typeof updatedSlots[index] === 'string') {
        updatedSlots[index] = {
          id: String(index + 1),
          fr: updatedSlots[index],
          ar: updatedSlots[index],
          en: updatedSlots[index],
          [langKey]: value,
        };
      } else {
        updatedSlots[index] = {
          ...updatedSlots[index],
          [langKey]: value,
        };
      }
      return { ...prev, timeSlots: updatedSlots };
    });
  };

  const addTimeSlotItem = () => {
    setFormData(prev => ({
      ...prev,
      timeSlots: [
        ...(prev.timeSlots || []),
        { id: String(Date.now()), fr: '18:00', ar: '18:00', en: '18:00' },
      ],
    }));
  };

  const removeTimeSlotItem = (index) => {
    setFormData(prev => ({
      ...prev,
      timeSlots: (prev.timeSlots || []).filter((_, i) => i !== index),
    }));
  };

  // Step Handlers for howItWorks
  const handleStepChange = (index, langKey, field, value) => {
    setFormData(prev => {
      const updatedSteps = [...(prev.steps || [])];
      updatedSteps[index] = {
        ...updatedSteps[index],
        [langKey]: {
          ...updatedSteps[index]?.[langKey],
          [field]: value,
        },
      };
      return { ...prev, steps: updatedSteps };
    });
  };

  const handleStepIconChange = (index, value) => {
    setFormData(prev => {
      const updatedSteps = [...(prev.steps || [])];
      updatedSteps[index] = { ...updatedSteps[index], icon: value };
      return { ...prev, steps: updatedSteps };
    });
  };

  const addStepItem = () => {
    setFormData(prev => {
      const nextNum = String((prev.steps || []).length + 1);
      return {
        ...prev,
        steps: [
          ...(prev.steps || []),
          {
            id: String(Date.now()),
            icon: 'star',
            fr: { stepNum: nextNum, title: 'Nouvelle étape', desc: 'Description de cette étape.' },
            ar: { stepNum: nextNum, title: 'خطوة جديدة', desc: 'وصف هذه الخطوة.' },
            en: { stepNum: nextNum, title: 'New step', desc: 'Description of this step.' },
          },
        ],
      };
    });
  };

  const removeStepItem = (index) => {
    setFormData(prev => ({
      ...prev,
      steps: (prev.steps || []).filter((_, i) => i !== index),
    }));
  };

  // Testimonials Handlers
  const handleTestimonialChange = (index, langKey, field, value) => {
    setFormData(prev => {
      const updatedList = [...(prev.list || [])];
      updatedList[index] = {
        ...updatedList[index],
        [langKey]: {
          ...updatedList[index]?.[langKey],
          [field]: value,
        },
      };
      return { ...prev, list: updatedList };
    });
  };

  const handleTestimonialStarsChange = (index, value) => {
    setFormData(prev => {
      const updatedList = [...(prev.list || [])];
      updatedList[index] = {
        ...updatedList[index],
        stars: Number(value) || 5,
      };
      return { ...prev, list: updatedList };
    });
  };

  const addTestimonialItem = () => {
    setFormData(prev => {
      const nextId = String(Date.now());
      return {
        ...prev,
        list: [
          ...(prev.list || []),
          {
            id: nextId,
            stars: 5,
            fr: { quote: '"Nouveau commentaire de parent."', author: "- Parent, Maman / Papa" },
            ar: { quote: '"تعليق جديد من أحد الأولياء."', author: "- ولي أمر، أم / أب" },
            en: { quote: '"New parent review."', author: "- Parent, Mom / Dad" },
          },
        ],
      };
    });
  };

  const removeTestimonialItem = (index) => {
    setFormData(prev => ({
      ...prev,
      list: (prev.list || []).filter((_, i) => i !== index),
    }));
  };

  const handleSave = async (e) => {


    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    const success = await updateSectionData(sectionKey, formData);
    setSaving(false);
    if (success !== false) {
      setSuccessMsg(
        lang === 'ar'
          ? 'تم حفظ التعديلات بنجاح في قاعدة البيانات!'
          : 'Enregistrement réussi dans MongoDB !'
      );
      setTimeout(() => {
        onClose();
      }, 1200);
    }
  };

  return (
    <div className="fixed inset-0 z-[999999] bg-black/65 backdrop-blur-sm overflow-y-auto p-4 sm:p-6 flex items-center justify-center min-h-screen">
      <div
        className="relative bg-white rounded-3xl max-w-2xl w-full flex flex-col max-h-[88vh] border-2 border-[#4221b6] shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in duration-200"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        {/* Fixed Header */}
        <div className="p-5 px-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#4221b6] text-white flex items-center justify-center font-bold shadow-md shrink-0">
              <span className="material-symbols-outlined text-2xl">edit_attributes</span>
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-[#1c0576] leading-tight">
                {lang === 'ar' ? `تعديل ${sectionTitle || 'قسم الصفحة'}` : `Modifier ${sectionTitle || 'la section'}`}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {lang === 'ar' ? 'تحديث النواص، الكاردات، والرابط في MongoDB' : 'Mise à jour des textes en 3 langues dans MongoDB'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-transform hover:scale-105 cursor-pointer shrink-0"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Banner Notification */}
        {successMsg && (
          <div className="mx-6 mt-4 p-3 bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs rounded-2xl font-bold flex items-center gap-2 justify-center shrink-0">
            <span className="material-symbols-outlined text-lg">check_circle</span>
            <span>{successMsg}</span>
          </div>
        )}

        {/* Scrollable Body */}
        <div className="p-5 px-6 overflow-y-auto space-y-5 flex-1">
          {/* Top Language Bar */}
          <div className="flex items-center gap-2 bg-[#f4f1ea] p-1.5 rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab('fr')}
              className={`flex-1 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'fr'
                  ? 'bg-[#4221b6] text-white shadow-md scale-[1.02]'
                  : 'text-slate-700 hover:text-[#4221b6]'
              }`}
            >
              <span>🇫🇷 Français</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ar')}
              className={`flex-1 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'ar'
                  ? 'bg-[#4221b6] text-white shadow-md scale-[1.02]'
                  : 'text-slate-700 hover:text-[#4221b6]'
              }`}
            >
              <span>🇹🇳 العربية</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('en')}
              className={`flex-1 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'en'
                  ? 'bg-[#4221b6] text-white shadow-md scale-[1.02]'
                  : 'text-slate-700 hover:text-[#4221b6]'
              }`}
            >
              <span>🇬🇧 English</span>
            </button>
          </div>

          {/* Form Content area */}
          <div className="space-y-4 bg-[#faf9f5] p-5 rounded-2xl border border-slate-200/80">

            {/* Section 1: Hero Form */}
            {sectionKey === 'hero' && (
              <div className="space-y-4">
                {/* Sub-Tabs Navigation */}
                <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => setActiveSubTab('general')}
                    className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                      activeSubTab === 'general'
                        ? 'bg-[#4221b6] text-white shadow'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">article</span>
                    <span>{activeTab === 'ar' ? 'نصوص عامة' : 'Textes Généraux'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveSubTab('features')}
                    className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                      activeSubTab === 'features'
                        ? 'bg-[#4221b6] text-white shadow'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">star</span>
                    <span>{activeTab === 'ar' ? 'مميزات المنصة' : 'Caractéristiques'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveSubTab('tutors')}
                    className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                      activeSubTab === 'tutors'
                        ? 'bg-[#4221b6] text-white shadow'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">group</span>
                    <span>{activeTab === 'ar' ? 'المعلمات' : 'Maîtresses'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveSubTab('video')}
                    className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                      activeSubTab === 'video'
                        ? 'bg-[#4221b6] text-white shadow'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">play_circle</span>
                    <span>{activeTab === 'ar' ? 'الفيديو التوضيحي' : 'Vidéo Démo'}</span>
                  </button>
                </div>

                {/* Sub-tab 1: General Texts */}
                {activeSubTab === 'general' && (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">
                        {activeTab === 'ar' ? 'وسم البداية (Tag Pill):' : 'Badge Tag :'}
                      </label>
                      <input
                        type="text"
                        required
                        value={formData[activeTab]?.tag || ''}
                        onChange={(e) => handleChange(activeTab, 'tag', e.target.value)}
                        className="w-full h-10 px-3.5 rounded-xl border-2 border-slate-200 bg-white focus:border-[#4221b6] outline-none font-bold text-xs shadow-sm"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">
                        {activeTab === 'ar' ? 'العنوان الرئيسي:' : 'Titre principal :'}
                      </label>
                      <input
                        type="text"
                        required
                        value={formData[activeTab]?.title || ''}
                        onChange={(e) => handleChange(activeTab, 'title', e.target.value)}
                        className="w-full h-10 px-3.5 rounded-xl border-2 border-slate-200 bg-white focus:border-[#4221b6] outline-none font-bold text-xs shadow-sm"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">
                        {activeTab === 'ar' ? 'الوصف الفرعي:' : 'Sous-titre :'}
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={formData[activeTab]?.subtitle || ''}
                        onChange={(e) => handleChange(activeTab, 'subtitle', e.target.value)}
                        className="w-full p-3 rounded-xl border-2 border-slate-200 bg-white focus:border-[#4221b6] outline-none font-medium text-xs shadow-sm leading-relaxed"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">
                        {activeTab === 'ar' ? 'عنوان قسم المعلمات:' : 'Titre de la section Maîtresses :'}
                      </label>
                      <input
                        type="text"
                        required
                        value={formData[activeTab]?.tutorsTitle || ''}
                        onChange={(e) => handleChange(activeTab, 'tutorsTitle', e.target.value)}
                        className="w-full h-10 px-3.5 rounded-xl border-2 border-slate-200 bg-white focus:border-[#4221b6] outline-none font-bold text-xs shadow-sm"
                      />
                    </div>

                    {/* Welcome Banner Card Settings */}
                    <div className="pt-3 border-t border-slate-200/80 space-y-3 bg-indigo-50/50 p-4 rounded-2xl border-2 border-indigo-100/80 shadow-inner">
                      <div className="flex items-center gap-2 text-xs font-extrabold text-[#1c0576]">
                        <span className="text-base">👨‍👩‍👧</span>
                        <span>{activeTab === 'ar' ? 'بنر الترحيب وفضاء الولي (عند تسجيل الدخول):' : 'Bannière de bienvenue (Une fois connecté) :'}</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-700 block">
                            {activeTab === 'ar' ? 'عبارة الترحيب بالوالد:' : 'Message de bienvenue parent :'}
                          </label>
                          <input
                            type="text"
                            value={formData[activeTab]?.welcomePrefix || ''}
                            onChange={(e) => handleChange(activeTab, 'welcomePrefix', e.target.value)}
                            className="w-full h-9 px-3 rounded-xl border border-slate-300 bg-white focus:border-[#4221b6] outline-none font-bold text-xs shadow-sm"
                            placeholder="Bienvenue, "
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-700 block">
                            {activeTab === 'ar' ? 'عبارة مساحة الطفل:' : 'Texte espace enfant :'}
                          </label>
                          <input
                            type="text"
                            value={formData[activeTab]?.childSpacePrefix || ''}
                            onChange={(e) => handleChange(activeTab, 'childSpacePrefix', e.target.value)}
                            className="w-full h-9 px-3 rounded-xl border border-slate-300 bg-white focus:border-[#4221b6] outline-none font-bold text-xs shadow-sm"
                            placeholder="Espace de votre enfant: "
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-700 block">
                            {activeTab === 'ar' ? 'نص زر الانتقال (CTA):' : 'Texte du bouton Espace Parent :'}
                          </label>
                          <input
                            type="text"
                            value={formData[activeTab]?.welcomeBtn || ''}
                            onChange={(e) => handleChange(activeTab, 'welcomeBtn', e.target.value)}
                            className="w-full h-9 px-3 rounded-xl border border-slate-300 bg-white focus:border-[#4221b6] outline-none font-bold text-xs shadow-sm"
                            placeholder="Espace Parent"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-700 block">
                            {activeTab === 'ar' ? 'الأيقونة التعبيرية (Emoji):' : 'Icône émoji :'}
                          </label>
                          <input
                            type="text"
                            value={formData[activeTab]?.welcomeEmoji || ''}
                            onChange={(e) => handleChange(activeTab, 'welcomeEmoji', e.target.value)}
                            className="w-full h-9 px-3 rounded-xl border border-slate-300 bg-white focus:border-[#4221b6] outline-none font-bold text-xs shadow-sm"
                            placeholder="👨‍👩‍👧"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}


                {/* Sub-tab 2: Features List */}
                {activeSubTab === 'features' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-[#1c0576]">
                        {activeTab === 'ar' ? 'كروت مميزات المنصة:' : 'Cartes des caractéristiques :'}
                      </h4>
                      <button
                        type="button"
                        onClick={addFeatureCard}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors flex items-center gap-1 shadow-sm cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-base">add</span>
                        <span>{activeTab === 'ar' ? 'إضافة خاصية' : 'Ajouter une carte'}</span>
                      </button>
                    </div>

                    {(formData.features || []).map((feat, idx) => (
                      <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3 relative">
                        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                          <span className="text-xs font-bold text-slate-500">
                            {activeTab === 'ar' ? `خاصية #${idx + 1}` : `Caractéristique #${idx + 1}`}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeFeatureCard(idx)}
                            className="text-red-500 hover:text-red-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-base">delete</span>
                            <span>{activeTab === 'ar' ? 'حذف' : 'Supprimer'}</span>
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-700">
                              {activeTab === 'ar' ? 'الأيقونة (Material Symbol):' : 'Icône (Material Symbol) :'}
                            </label>
                            <input
                              type="text"
                              value={feat.icon || 'star'}
                              onChange={(e) => handleFeatureIconChange(idx, e.target.value)}
                              placeholder="school, person, etc."
                              className="w-full h-9 px-3 rounded-xl border border-slate-300 font-medium text-xs focus:border-[#4221b6] outline-none"
                            />
                          </div>
                          <div className="sm:col-span-2 space-y-1">
                            <label className="text-[11px] font-bold text-slate-700">
                              {activeTab === 'ar' ? `النص (${activeTab.toUpperCase()}):` : `Texte (${activeTab.toUpperCase()}) :`}
                            </label>
                            <input
                              type="text"
                              value={feat[activeTab]?.text || feat.text || ''}
                              onChange={(e) => handleFeatureChange(idx, activeTab, e.target.value)}
                              className="w-full h-9 px-3 rounded-xl border border-slate-300 font-bold text-xs focus:border-[#4221b6] outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Sub-tab 3: Tutors List */}
                {activeSubTab === 'tutors' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-[#1c0576]">
                        {activeTab === 'ar' ? 'كروت المعلمات:' : 'Cartes des maîtresses :'}
                      </h4>
                      <button
                        type="button"
                        onClick={addTutorCard}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors flex items-center gap-1 shadow-sm cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-base">add</span>
                        <span>{activeTab === 'ar' ? 'إضافة معلمة' : 'Ajouter une maîtresse'}</span>
                      </button>
                    </div>

                    {(formData.tutors || []).map((tutor, idx) => (
                      <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3 relative">
                        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                          <div className="flex items-center gap-2">
                            {tutor.img && (
                              <img src={tutor.img} alt="" className="w-8 h-8 rounded-lg object-cover border border-slate-200" />
                            )}
                            <span className="text-xs font-bold text-slate-700">
                              {tutor[activeTab]?.name || tutor.name || `Maîtresse #${idx + 1}`}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeTutorCard(idx)}
                            className="text-red-500 hover:text-red-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-base">delete</span>
                            <span>{activeTab === 'ar' ? 'حذف' : 'Supprimer'}</span>
                          </button>
                        </div>
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-700">
                              {activeTab === 'ar' ? 'رابط صورة المعلمة (URL):' : 'Lien photo (URL) :'}
                            </label>
                            <input
                              type="text"
                              value={tutor.img || ''}
                              onChange={(e) => handleTutorImgChange(idx, e.target.value)}
                              className="w-full h-9 px-3 rounded-xl border border-slate-300 font-medium text-xs focus:border-[#4221b6] outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-700">
                              {activeTab === 'ar' ? `اسم المعلمة (${activeTab.toUpperCase()}):` : `Nom de la maîtresse (${activeTab.toUpperCase()}) :`}
                            </label>
                            <input
                              type="text"
                              value={tutor[activeTab]?.name || ''}
                              onChange={(e) => handleTutorChange(idx, activeTab, 'name', e.target.value)}
                              className="w-full h-9 px-3 rounded-xl border border-slate-300 font-bold text-xs focus:border-[#4221b6] outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-700">
                              {activeTab === 'ar' ? `وصف المعلمة (${activeTab.toUpperCase()}):` : `Description (${activeTab.toUpperCase()}) :`}
                            </label>
                            <textarea
                              rows={2}
                              value={tutor[activeTab]?.desc || ''}
                              onChange={(e) => handleTutorChange(idx, activeTab, 'desc', e.target.value)}
                              className="w-full p-2.5 rounded-xl border border-slate-300 font-medium text-xs focus:border-[#4221b6] outline-none leading-relaxed"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Sub-tab 4: Video Demo Texts & URL */}
                {activeSubTab === 'video' && (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">
                        {activeTab === 'ar' ? 'وسم الفيديو (Tag):' : 'Tag de la vidéo :'}
                      </label>
                      <input
                        type="text"
                        value={formData[activeTab]?.videoTag || ''}
                        onChange={(e) => handleChange(activeTab, 'videoTag', e.target.value)}
                        className="w-full h-10 px-3.5 rounded-xl border-2 border-slate-200 bg-white focus:border-[#4221b6] outline-none font-bold text-xs shadow-sm"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">
                        {activeTab === 'ar' ? 'عنوان قسم الفيديو:' : 'Titre de la vidéo :'}
                      </label>
                      <input
                        type="text"
                        value={formData[activeTab]?.videoTitle || ''}
                        onChange={(e) => handleChange(activeTab, 'videoTitle', e.target.value)}
                        className="w-full h-10 px-3.5 rounded-xl border-2 border-slate-200 bg-white focus:border-[#4221b6] outline-none font-bold text-xs shadow-sm"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">
                        {activeTab === 'ar' ? 'وصف الفيديو:' : 'Description de la vidéo :'}
                      </label>
                      <textarea
                        rows={2}
                        value={formData[activeTab]?.videoDesc || ''}
                        onChange={(e) => handleChange(activeTab, 'videoDesc', e.target.value)}
                        className="w-full p-3 rounded-xl border-2 border-slate-200 bg-white focus:border-[#4221b6] outline-none font-medium text-xs shadow-sm leading-relaxed"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">
                        {activeTab === 'ar' ? 'نص زر تشغيل الفيديو (CTA):' : 'Texte du bouton vidéo (CTA) :'}
                      </label>
                      <input
                        type="text"
                        value={formData[activeTab]?.videoBtn || ''}
                        onChange={(e) => handleChange(activeTab, 'videoBtn', e.target.value)}
                        placeholder="Regarder maintenant"
                        className="w-full h-10 px-3.5 rounded-xl border-2 border-slate-200 bg-white focus:border-[#4221b6] outline-none font-bold text-xs shadow-sm"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">
                        {activeTab === 'ar' ? 'رابط فيديو يوتيوب (URL):' : 'Lien vidéo YouTube :'}
                      </label>
                      <input
                        type="text"
                        value={formData.videoUrl || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, videoUrl: e.target.value }))}
                        placeholder="https://www.youtube.com/watch?v=..."
                        className="w-full h-10 px-3.5 rounded-xl border-2 border-slate-200 bg-white focus:border-[#4221b6] outline-none font-bold text-xs shadow-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Section 2: Video Section Form */}
            {sectionKey === 'videoSection' && (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    {activeTab === 'ar' ? 'وسم الفيديو (Tag):' : 'Tag de la vidéo :'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData[activeTab]?.videoTag || ''}
                    onChange={(e) => handleChange(activeTab, 'videoTag', e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl border-2 border-slate-200 bg-white focus:border-[#4221b6] outline-none font-bold text-xs shadow-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    {activeTab === 'ar' ? 'عنوان قسم الفيديو:' : 'Titre de la vidéo :'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData[activeTab]?.videoTitle || ''}
                    onChange={(e) => handleChange(activeTab, 'videoTitle', e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl border-2 border-slate-200 bg-white focus:border-[#4221b6] outline-none font-bold text-xs shadow-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    {activeTab === 'ar' ? 'وصف الفيديو:' : 'Description de la vidéo :'}
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={formData[activeTab]?.videoDesc || ''}
                    onChange={(e) => handleChange(activeTab, 'videoDesc', e.target.value)}
                    className="w-full p-3 rounded-xl border-2 border-slate-200 bg-white focus:border-[#4221b6] outline-none font-medium text-xs shadow-sm leading-relaxed"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    {activeTab === 'ar' ? 'نص زر تشغيل الفيديو (CTA):' : 'Texte du bouton vidéo (CTA) :'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData[activeTab]?.videoBtn || ''}
                    onChange={(e) => handleChange(activeTab, 'videoBtn', e.target.value)}
                    placeholder="Regarder maintenant"
                    className="w-full h-10 px-3.5 rounded-xl border-2 border-slate-200 bg-white focus:border-[#4221b6] outline-none font-bold text-xs shadow-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    {activeTab === 'ar' ? 'رابط فيديو يوتيوب (URL):' : 'Lien vidéo YouTube :'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.videoUrl || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, videoUrl: e.target.value }))}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full h-10 px-3.5 rounded-xl border-2 border-slate-200 bg-white focus:border-[#4221b6] outline-none font-bold text-xs shadow-sm"
                  />
                </div>
              </>
            )}


            {/* Section 3: How It Works Form */}
            {sectionKey === 'howItWorks' && (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    {activeTab === 'ar' ? 'عنوان قسم (كيف تعمل المنصة):' : 'Titre principal :'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData[activeTab]?.title || ''}
                    onChange={(e) => handleChange(activeTab, 'title', e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl border-2 border-slate-200 bg-white focus:border-[#4221b6] outline-none font-bold text-xs shadow-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    {activeTab === 'ar' ? 'الوصف الفرعي:' : 'Sous-titre :'}
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={formData[activeTab]?.subtitle || ''}
                    onChange={(e) => handleChange(activeTab, 'subtitle', e.target.value)}
                    className="w-full p-3 rounded-xl border-2 border-slate-200 bg-white focus:border-[#4221b6] outline-none font-medium text-xs shadow-sm leading-relaxed"
                  />
                </div>

                {/* Step Cards Management */}
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                      {activeTab === 'ar' ? '🃏 بطاقات الخطوات' : '🃏 Cartes des étapes'}
                    </h4>
                    <button
                      type="button"
                      onClick={addStepItem}
                      className="flex items-center gap-1.5 bg-[#4221b6] hover:bg-[#3318a0] text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all shadow"
                    >
                      <span className="material-symbols-outlined text-sm">add</span>
                      {activeTab === 'ar' ? 'إضافة خطوة' : 'Ajouter une étape'}
                    </button>
                  </div>

                  {(formData.steps || []).map((step, idx) => (
                    <div key={step.id || idx} className="border-2 border-slate-200 rounded-xl p-4 space-y-3 bg-white shadow-sm">
                      {/* Header: step number + delete */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-[#4221b6] uppercase tracking-wider">
                          {activeTab === 'ar' ? `خطوة ${idx + 1}` : `Étape ${idx + 1}`}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeStepItem(idx)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>

                      {/* Icon field */}
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-600">
                          {activeTab === 'ar' ? 'أيقونة (Material Icon):' : 'Icône (Material Icon) :'}
                        </label>
                        <input
                          type="text"
                          value={step.icon || ''}
                          onChange={(e) => handleStepIconChange(idx, e.target.value)}
                          placeholder="star, menu_book, event_available..."
                          className="w-full h-9 px-3 rounded-lg border-2 border-slate-200 bg-white focus:border-[#4221b6] outline-none text-xs font-mono shadow-sm"
                        />
                        {step.icon && (
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="material-symbols-outlined text-[#4221b6] text-base">{step.icon}</span>
                            <span className="text-[10px] text-slate-500">{step.icon}</span>
                          </div>
                        )}
                      </div>

                      {/* Title */}
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-600">
                          {activeTab === 'ar' ? 'العنوان:' : 'Titre :'}
                        </label>
                        <input
                          type="text"
                          value={step[activeTab]?.title || ''}
                          onChange={(e) => handleStepChange(idx, activeTab, 'title', e.target.value)}
                          className="w-full h-9 px-3 rounded-lg border-2 border-slate-200 bg-white focus:border-[#4221b6] outline-none text-xs font-bold shadow-sm"
                        />
                      </div>

                      {/* Description */}
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-600">
                          {activeTab === 'ar' ? 'الوصف:' : 'Description :'}
                        </label>
                        <textarea
                          rows={2}
                          value={step[activeTab]?.desc || ''}
                          onChange={(e) => handleStepChange(idx, activeTab, 'desc', e.target.value)}
                          className="w-full p-2.5 rounded-lg border-2 border-slate-200 bg-white focus:border-[#4221b6] outline-none text-xs font-medium shadow-sm leading-relaxed"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}


            {/* Section 4: Testimonials Form */}
            {sectionKey === 'testimonials' && (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    {activeTab === 'ar' ? 'عنوان قسم آراء الأولياء:' : 'Titre de la section :'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData[activeTab]?.title || ''}
                    onChange={(e) => handleChange(activeTab, 'title', e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl border-2 border-slate-200 bg-white focus:border-[#4221b6] outline-none font-bold text-xs shadow-sm"
                  />
                </div>

                {/* Testimonial Cards Management */}
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                      <span>💬</span>
                      <span>{activeTab === 'ar' ? 'بطاقات آراء الأولياء والتعليقات' : 'Cartes des témoignages'}</span>
                    </h4>
                    <button
                      type="button"
                      onClick={addTestimonialItem}
                      className="flex items-center gap-1.5 bg-[#4221b6] hover:bg-[#3318a0] text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all shadow"
                    >
                      <span className="material-symbols-outlined text-sm">add</span>
                      {activeTab === 'ar' ? 'إضافة تعليق' : 'Ajouter un avis'}
                    </button>
                  </div>

                  {(formData.list || []).map((item, idx) => (
                    <div key={item.id || idx} className="border-2 border-slate-200 rounded-xl p-4 space-y-3 bg-white shadow-sm">
                      {/* Header: Item index + delete */}
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="text-xs font-black text-[#4221b6] uppercase tracking-wider">
                          {activeTab === 'ar' ? `رأي ${idx + 1}` : `Avis ${idx + 1}`}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeTestimonialItem(idx)}
                          className="text-red-500 hover:text-red-700 transition-colors p-1 rounded hover:bg-red-50"
                          title={activeTab === 'ar' ? 'حذف هذا الرأي' : 'Supprimer cet avis'}
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>

                      {/* Stars selection */}
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-600">
                          {activeTab === 'ar' ? 'التقييم (النجوم):' : 'Évaluation (Étoiles) :'}
                        </label>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
                            {[1, 2, 3, 4, 5].map((starVal) => (
                              <button
                                key={starVal}
                                type="button"
                                onClick={() => handleTestimonialStarsChange(idx, starVal)}
                                className="cursor-pointer transition-transform hover:scale-125 focus:outline-none"
                              >
                                <span
                                  className={`material-symbols-outlined text-lg ${
                                    starVal <= (item.stars || 5) ? 'text-amber-500' : 'text-slate-300'
                                  }`}
                                  style={{ fontVariationSettings: "'FILL' 1" }}
                                >
                                  star
                                </span>
                              </button>
                            ))}
                          </div>
                          <span className="text-xs font-bold text-amber-600">{item.stars || 5} / 5</span>
                        </div>
                      </div>

                      {/* Quote */}
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-600">
                          {activeTab === 'ar' ? 'نص التعليق / الرأي:' : 'Citation / Commentaire :'}
                        </label>
                        <textarea
                          rows={2}
                          value={item[activeTab]?.quote || ''}
                          onChange={(e) => handleTestimonialChange(idx, activeTab, 'quote', e.target.value)}
                          placeholder={activeTab === 'ar' ? 'اكتب رأي الولي هنا...' : 'Écrivez le commentaire du parent ici...'}
                          className="w-full p-2.5 rounded-lg border-2 border-slate-200 bg-white focus:border-[#4221b6] outline-none text-xs font-medium shadow-sm leading-relaxed"
                        />
                      </div>

                      {/* Author */}
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-600">
                          {activeTab === 'ar' ? 'صاحب التعليق (الاسم والصفة):' : 'Auteur (Nom et rôle) :'}
                        </label>
                        <input
                          type="text"
                          value={item[activeTab]?.author || ''}
                          onChange={(e) => handleTestimonialChange(idx, activeTab, 'author', e.target.value)}
                          placeholder={activeTab === 'ar' ? '- سارة، والدة كريم (6 سنوات)' : '- Sophie, Maman de Léo (7 ans)'}
                          className="w-full h-9 px-3 rounded-lg border-2 border-slate-200 bg-white focus:border-[#4221b6] outline-none text-xs font-bold shadow-sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}


            {/* Section 5: Next Session Form */}
            {sectionKey === 'nextSession' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      {activeTab === 'ar' ? 'عنوان الجلسة القادمة:' : 'Titre prochaine session :'}
                    </label>
                    <input
                      type="text"
                      required
                      value={formData[activeTab]?.nextSession || ''}
                      onChange={(e) => handleChange(activeTab, 'nextSession', e.target.value)}
                      className="w-full h-10 px-3.5 rounded-xl border-2 border-slate-200 bg-white focus:border-[#4221b6] outline-none font-bold text-xs shadow-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      {activeTab === 'ar' ? 'وسم اليوم (AUJOURD\'HUI):' : 'Tag Aujourd\'hui :'}
                    </label>
                    <input
                      type="text"
                      required
                      value={formData[activeTab]?.today || ''}
                      onChange={(e) => handleChange(activeTab, 'today', e.target.value)}
                      className="w-full h-10 px-3.5 rounded-xl border-2 border-slate-200 bg-white focus:border-[#4221b6] outline-none font-bold text-xs shadow-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      {activeTab === 'ar' ? 'توقيت الجلسة:' : 'Horaire :'}
                    </label>
                    <input
                      type="text"
                      required
                      value={formData[activeTab]?.time || ''}
                      onChange={(e) => handleChange(activeTab, 'time', e.target.value)}
                      className="w-full h-10 px-3.5 rounded-xl border-2 border-slate-200 bg-white focus:border-[#4221b6] outline-none font-bold text-xs shadow-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      {activeTab === 'ar' ? 'اسم المعلمة:' : 'Enseignante :'}
                    </label>
                    <input
                      type="text"
                      required
                      value={formData[activeTab]?.teacher || ''}
                      onChange={(e) => handleChange(activeTab, 'teacher', e.target.value)}
                      className="w-full h-10 px-3.5 rounded-xl border-2 border-slate-200 bg-white focus:border-[#4221b6] outline-none font-bold text-xs shadow-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      {activeTab === 'ar' ? 'العداد التنازلي:' : 'Décompte :'}
                    </label>
                    <input
                      type="text"
                      required
                      value={formData[activeTab]?.countdown || ''}
                      onChange={(e) => handleChange(activeTab, 'countdown', e.target.value)}
                      className="w-full h-10 px-3.5 rounded-xl border-2 border-slate-200 bg-white focus:border-[#4221b6] outline-none font-bold text-xs shadow-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      {activeTab === 'ar' ? 'الوصف الفرعي للعداد:' : 'Sous-texte décompte :'}
                    </label>
                    <input
                      type="text"
                      required
                      value={formData[activeTab]?.countdownSub || ''}
                      onChange={(e) => handleChange(activeTab, 'countdownSub', e.target.value)}
                      className="w-full h-10 px-3.5 rounded-xl border-2 border-slate-200 bg-white focus:border-[#4221b6] outline-none font-bold text-xs shadow-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    {activeTab === 'ar' ? 'زر الانضمام للجلسة:' : 'Bouton Rejoindre :'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData[activeTab]?.joinButton || ''}
                    onChange={(e) => handleChange(activeTab, 'joinButton', e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl border-2 border-slate-200 bg-white focus:border-[#4221b6] outline-none font-bold text-xs shadow-sm"
                  />
                </div>
              </>
            )}

            {/* Section 6: Favorite Games Form */}
            {sectionKey === 'favGames' && (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    {activeTab === 'ar' ? 'عنوان قسم الألعاب المفضلة:' : 'Titre principal :'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData[activeTab]?.favGames || ''}
                    onChange={(e) => handleChange(activeTab, 'favGames', e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl border-2 border-slate-200 bg-white focus:border-[#4221b6] outline-none font-bold text-xs shadow-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    {activeTab === 'ar' ? 'اسم اللعبة الأولى:' : 'Jeu 1 :'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData[activeTab]?.game1 || ''}
                    onChange={(e) => handleChange(activeTab, 'game1', e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl border-2 border-slate-200 bg-white focus:border-[#4221b6] outline-none font-bold text-xs shadow-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    {activeTab === 'ar' ? 'اسم اللعبة الثانية:' : 'Jeu 2 :'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData[activeTab]?.game2 || ''}
                    onChange={(e) => handleChange(activeTab, 'game2', e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl border-2 border-slate-200 bg-white focus:border-[#4221b6] outline-none font-bold text-xs shadow-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    {activeTab === 'ar' ? 'اسم اللعبة الثالثة:' : 'Jeu 3 :'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData[activeTab]?.game3 || ''}
                    onChange={(e) => handleChange(activeTab, 'game3', e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl border-2 border-slate-200 bg-white focus:border-[#4221b6] outline-none font-bold text-xs shadow-sm"
                  />
                </div>
              </>
            )}

            {/* Section 7: Reminder Banner Form */}
            {sectionKey === 'reminderBanner' && (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    {activeTab === 'ar' ? 'وسم التذكير:' : 'Tag du rappel :'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData[activeTab]?.reminderTag || ''}
                    onChange={(e) => handleChange(activeTab, 'reminderTag', e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl border-2 border-slate-200 bg-white focus:border-[#4221b6] outline-none font-bold text-xs shadow-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    {activeTab === 'ar' ? 'نص التذكير:' : 'Texte du rappel :'}
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={formData[activeTab]?.reminderText || ''}
                    onChange={(e) => handleChange(activeTab, 'reminderText', e.target.value)}
                    className="w-full p-3 rounded-xl border-2 border-slate-200 bg-white focus:border-[#4221b6] outline-none font-medium text-xs shadow-sm leading-relaxed"
                  />
                </div>
              </>
            )}
            
            {/* Calendar Header Form */}
            {sectionKey === 'calendarHeader' && (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    {activeTab === 'ar' ? 'عنوان صفحة الحجز:' : 'Titre principal :'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData[activeTab]?.title || ''}
                    onChange={(e) => handleChange(activeTab, 'title', e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl border-2 border-slate-200 bg-white focus:border-[#4221b6] outline-none font-bold text-xs shadow-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    {activeTab === 'ar' ? 'الوصف الفرعي لصفحة الحجز:' : 'Sous-titre :'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData[activeTab]?.subtitle || ''}
                    onChange={(e) => handleChange(activeTab, 'subtitle', e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl border-2 border-slate-200 bg-white focus:border-[#4221b6] outline-none font-bold text-xs shadow-sm"
                  />
                </div>
              </>
            )}

            {/* Calendar Pack Offer Form */}
            {sectionKey === 'calendarPack' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      {activeTab === 'ar' ? 'وسم العرض (Badge):' : 'Badge de l\'offre :'}
                    </label>
                    <input
                      type="text"
                      required
                      value={formData[activeTab]?.badge || ''}
                      onChange={(e) => handleChange(activeTab, 'badge', e.target.value)}
                      className="w-full h-10 px-3.5 rounded-xl border-2 border-slate-200 bg-white focus:border-[#4221b6] outline-none font-bold text-xs shadow-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      {activeTab === 'ar' ? 'وسم المجان (Free Tag):' : 'Tag gratuit :'}
                    </label>
                    <input
                      type="text"
                      required
                      value={formData[activeTab]?.freeTag || ''}
                      onChange={(e) => handleChange(activeTab, 'freeTag', e.target.value)}
                      className="w-full h-10 px-3.5 rounded-xl border-2 border-slate-200 bg-white focus:border-[#4221b6] outline-none font-bold text-xs shadow-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    {activeTab === 'ar' ? 'عنوان العرض الخاص:' : 'Titre de l\'offre :'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData[activeTab]?.title || ''}
                    onChange={(e) => handleChange(activeTab, 'title', e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl border-2 border-slate-200 bg-white focus:border-[#4221b6] outline-none font-bold text-xs shadow-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    {activeTab === 'ar' ? 'وصف العرض الخاص:' : 'Description de l\'offre :'}
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={formData[activeTab]?.subtitle || ''}
                    onChange={(e) => handleChange(activeTab, 'subtitle', e.target.value)}
                    className="w-full p-3 rounded-xl border-2 border-slate-200 bg-white focus:border-[#4221b6] outline-none font-medium text-xs shadow-sm leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      {activeTab === 'ar' ? 'نص زر الاختيار:' : 'Bouton sélectionner :'}
                    </label>
                    <input
                      type="text"
                      required
                      value={formData[activeTab]?.selectBtn || ''}
                      onChange={(e) => handleChange(activeTab, 'selectBtn', e.target.value)}
                      className="w-full h-10 px-3.5 rounded-xl border-2 border-slate-200 bg-white focus:border-[#4221b6] outline-none font-bold text-xs shadow-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      {activeTab === 'ar' ? 'نص الزر عند التفعيل:' : 'Bouton sélectionné :'}
                    </label>
                    <input
                      type="text"
                      required
                      value={formData[activeTab]?.activeTag || ''}
                      onChange={(e) => handleChange(activeTab, 'activeTag', e.target.value)}
                      className="w-full h-10 px-3.5 rounded-xl border-2 border-slate-200 bg-white focus:border-[#4221b6] outline-none font-bold text-xs shadow-sm"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Calendar Step 1 Form */}
            {sectionKey === 'calendarStep1' && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    {activeTab === 'ar' ? 'عنوان الخطوة الأولى (اختيار اليوم):' : 'Titre Étape 1 (Jour) :'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData[activeTab]?.step1Title || ''}
                    onChange={(e) => handleChange(activeTab, 'step1Title', e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl border-2 border-slate-200 bg-white focus:border-[#4221b6] outline-none font-bold text-xs shadow-sm"
                  />
                </div>
              </div>
            )}

            {/* Calendar Step 2 Form */}
            {sectionKey === 'calendarStep2' && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    {activeTab === 'ar' ? 'عنوان الخطوة الثانية (اختيار الوقت):' : 'Titre Étape 2 (Heure) :'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData[activeTab]?.step2Title || ''}
                    onChange={(e) => handleChange(activeTab, 'step2Title', e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl border-2 border-slate-200 bg-white focus:border-[#4221b6] outline-none font-bold text-xs shadow-sm"
                  />
                </div>
              </div>
            )}

            {/* Calendar Step 3 Form */}
            {sectionKey === 'calendarStep3' && (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    {activeTab === 'ar' ? 'عنوان الخطوة الثالثة (طريقة الدفع):' : 'Titre Étape 3 (Paiement) :'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData[activeTab]?.step3Title || ''}
                    onChange={(e) => handleChange(activeTab, 'step3Title', e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl border-2 border-slate-200 bg-white focus:border-[#4221b6] outline-none font-bold text-xs shadow-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    {activeTab === 'ar' ? 'نص زر تأكيد الحجز:' : 'Bouton confirmer réservation :'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData[activeTab]?.confirmButton || ''}
                    onChange={(e) => handleChange(activeTab, 'confirmButton', e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl border-2 border-slate-200 bg-white focus:border-[#4221b6] outline-none font-bold text-xs shadow-sm"
                  />
                </div>
              </>
            )}

            {/* Footer Section Form */}
            {sectionKey === 'footerSection' && (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    {activeTab === 'ar' ? 'نص حقوق النشر (Copyright):' : 'Texte Copyright :'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData[activeTab]?.copy || ''}
                    onChange={(e) => handleChange(activeTab, 'copy', e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl border-2 border-slate-200 bg-white focus:border-[#4221b6] outline-none font-bold text-xs shadow-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      {activeTab === 'ar' ? 'رابط الأولياء:' : 'Lien Parents :'}
                    </label>
                    <input
                      type="text"
                      required
                      value={formData[activeTab]?.parents || ''}
                      onChange={(e) => handleChange(activeTab, 'parents', e.target.value)}
                      className="w-full h-10 px-3.5 rounded-xl border-2 border-slate-200 bg-white focus:border-[#4221b6] outline-none font-bold text-xs shadow-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      {activeTab === 'ar' ? 'رابط المساعدة:' : 'Lien Aide :'}
                    </label>
                    <input
                      type="text"
                      required
                      value={formData[activeTab]?.help || ''}
                      onChange={(e) => handleChange(activeTab, 'help', e.target.value)}
                      className="w-full h-10 px-3.5 rounded-xl border-2 border-slate-200 bg-white focus:border-[#4221b6] outline-none font-bold text-xs shadow-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      {activeTab === 'ar' ? 'رابط الخصوصية:' : 'Lien Confidentialité :'}
                    </label>
                    <input
                      type="text"
                      required
                      value={formData[activeTab]?.privacy || ''}
                      onChange={(e) => handleChange(activeTab, 'privacy', e.target.value)}
                      className="w-full h-10 px-3.5 rounded-xl border-2 border-slate-200 bg-white focus:border-[#4221b6] outline-none font-bold text-xs shadow-sm"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Parent Header Form */}
            {sectionKey === 'parentHeader' && (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    {activeTab === 'ar' ? 'عنوان الصفحة الرئيسية:' : 'Titre principal :'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData[activeTab]?.title || ''}
                    onChange={(e) => handleChange(activeTab, 'title', e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl border-2 border-slate-200 bg-white focus:border-[#4221b6] outline-none font-bold text-xs shadow-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    {activeTab === 'ar' ? 'الوصف الفرعي:' : 'Sous-titre :'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData[activeTab]?.subtitle || ''}
                    onChange={(e) => handleChange(activeTab, 'subtitle', e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl border-2 border-slate-200 bg-white focus:border-[#4221b6] outline-none font-bold text-xs shadow-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      {activeTab === 'ar' ? 'نوع الحساب (Account Type):' : 'Type de compte :'}
                    </label>
                    <input
                      type="text"
                      required
                      value={formData[activeTab]?.accountType || ''}
                      onChange={(e) => handleChange(activeTab, 'accountType', e.target.value)}
                      className="w-full h-10 px-3.5 rounded-xl border-2 border-slate-200 bg-white focus:border-[#4221b6] outline-none font-bold text-xs shadow-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      {activeTab === 'ar' ? 'وسم الحساب (Badge):' : 'Badge :'}
                    </label>
                    <input
                      type="text"
                      required
                      value={formData[activeTab]?.accountBadge || ''}
                      onChange={(e) => handleChange(activeTab, 'accountBadge', e.target.value)}
                      className="w-full h-10 px-3.5 rounded-xl border-2 border-slate-200 bg-white focus:border-[#4221b6] outline-none font-bold text-xs shadow-sm"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Parent History Form */}
            {sectionKey === 'parentHistory' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      {activeTab === 'ar' ? 'عنوان قسم السجل:' : 'Titre de l\'historique :'}
                    </label>
                    <input
                      type="text"
                      required
                      value={formData[activeTab]?.historyTitle || ''}
                      onChange={(e) => handleChange(activeTab, 'historyTitle', e.target.value)}
                      className="w-full h-10 px-3.5 rounded-xl border-2 border-slate-200 bg-white focus:border-[#4221b6] outline-none font-bold text-xs shadow-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      {activeTab === 'ar' ? 'زر عرض الكل:' : 'Bouton Voir tout :'}
                    </label>
                    <input
                      type="text"
                      required
                      value={formData[activeTab]?.seeAll || ''}
                      onChange={(e) => handleChange(activeTab, 'seeAll', e.target.value)}
                      className="w-full h-10 px-3.5 rounded-xl border-2 border-slate-200 bg-white focus:border-[#4221b6] outline-none font-bold text-xs shadow-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      {activeTab === 'ar' ? 'عنوان عمود التاريخ:' : 'En-tête Date & Heure :'}
                    </label>
                    <input
                      type="text"
                      required
                      value={formData[activeTab]?.thDate || ''}
                      onChange={(e) => handleChange(activeTab, 'thDate', e.target.value)}
                      className="w-full h-10 px-3.5 rounded-xl border-2 border-slate-200 bg-white focus:border-[#4221b6] outline-none font-bold text-xs shadow-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      {activeTab === 'ar' ? 'عنوان عمود المادة:' : 'En-tête Matière :'}
                    </label>
                    <input
                      type="text"
                      required
                      value={formData[activeTab]?.thSubject || ''}
                      onChange={(e) => handleChange(activeTab, 'thSubject', e.target.value)}
                      className="w-full h-10 px-3.5 rounded-xl border-2 border-slate-200 bg-white focus:border-[#4221b6] outline-none font-bold text-xs shadow-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      {activeTab === 'ar' ? 'عنوان عمود المعلم:' : 'En-tête Maître / Maîtresse :'}
                    </label>
                    <input
                      type="text"
                      required
                      value={formData[activeTab]?.thTutor || ''}
                      onChange={(e) => handleChange(activeTab, 'thTutor', e.target.value)}
                      className="w-full h-10 px-3.5 rounded-xl border-2 border-slate-200 bg-white focus:border-[#4221b6] outline-none font-bold text-xs shadow-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      {activeTab === 'ar' ? 'عنوان عمود الحالة:' : 'En-tête Statut :'}
                    </label>
                    <input
                      type="text"
                      required
                      value={formData[activeTab]?.thStatus || ''}
                      onChange={(e) => handleChange(activeTab, 'thStatus', e.target.value)}
                      className="w-full h-10 px-3.5 rounded-xl border-2 border-slate-200 bg-white focus:border-[#4221b6] outline-none font-bold text-xs shadow-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      {activeTab === 'ar' ? 'وسم حالة مكتملة:' : 'Statut Complété :'}
                    </label>
                    <input
                      type="text"
                      required
                      value={formData[activeTab]?.statusCompleted || ''}
                      onChange={(e) => handleChange(activeTab, 'statusCompleted', e.target.value)}
                      className="w-full h-10 px-3.5 rounded-xl border-2 border-slate-200 bg-white focus:border-[#4221b6] outline-none font-bold text-xs shadow-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      {activeTab === 'ar' ? 'وسم حالة ملغاة:' : 'Statut Annulé :'}
                    </label>
                    <input
                      type="text"
                      required
                      value={formData[activeTab]?.statusCancelled || ''}
                      onChange={(e) => handleChange(activeTab, 'statusCancelled', e.target.value)}
                      className="w-full h-10 px-3.5 rounded-xl border-2 border-slate-200 bg-white focus:border-[#4221b6] outline-none font-bold text-xs shadow-sm"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Parent Upcoming Form */}
            {sectionKey === 'parentUpcoming' && (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    {activeTab === 'ar' ? 'عنوان قسم الجلسات القادمة:' : 'Titre "À Venir" :'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData[activeTab]?.upcomingTitle || ''}
                    onChange={(e) => handleChange(activeTab, 'upcomingTitle', e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl border-2 border-slate-200 bg-white focus:border-[#4221b6] outline-none font-bold text-xs shadow-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      {activeTab === 'ar' ? 'وسم اليوم (Today Tag):' : 'Tag Aujourd\'hui :'}
                    </label>
                    <input
                      type="text"
                      required
                      value={formData[activeTab]?.todayTag || ''}
                      onChange={(e) => handleChange(activeTab, 'todayTag', e.target.value)}
                      className="w-full h-10 px-3.5 rounded-xl border-2 border-slate-200 bg-white focus:border-[#4221b6] outline-none font-bold text-xs shadow-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      {activeTab === 'ar' ? 'زر الانضمام للجلسة:' : 'Bouton Rejoindre la session :'}
                    </label>
                    <input
                      type="text"
                      required
                      value={formData[activeTab]?.joinVideo || ''}
                      onChange={(e) => handleChange(activeTab, 'joinVideo', e.target.value)}
                      className="w-full h-10 px-3.5 rounded-xl border-2 border-slate-200 bg-white focus:border-[#4221b6] outline-none font-bold text-xs shadow-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      {activeTab === 'ar' ? 'زر إدارة الجلسة:' : 'Bouton Gérer :'}
                    </label>
                    <input
                      type="text"
                      required
                      value={formData[activeTab]?.manageBtn || ''}
                      onChange={(e) => handleChange(activeTab, 'manageBtn', e.target.value)}
                      className="w-full h-10 px-3.5 rounded-xl border-2 border-slate-200 bg-white focus:border-[#4221b6] outline-none font-bold text-xs shadow-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      {activeTab === 'ar' ? 'زر جدولة جلسة جديدة:' : 'Bouton Planifier une nouvelle session :'}
                    </label>
                    <input
                      type="text"
                      required
                      value={formData[activeTab]?.planNew || ''}
                      onChange={(e) => handleChange(activeTab, 'planNew', e.target.value)}
                      className="w-full h-10 px-3.5 rounded-xl border-2 border-slate-200 bg-white focus:border-[#4221b6] outline-none font-bold text-xs shadow-sm"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Dashboard Header Form */}
            {sectionKey === 'dashboardHeader' && (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    {activeTab === 'ar' ? 'عنوان الترحيب:' : 'Titre de bienvenue :'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData[activeTab]?.welcome || ''}
                    onChange={(e) => handleChange(activeTab, 'welcome', e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl border-2 border-slate-200 bg-white focus:border-[#4221b6] outline-none font-bold text-xs shadow-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    {activeTab === 'ar' ? 'الوصف الفرعي للترحيب:' : 'Sous-titre de bienvenue :'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData[activeTab]?.welcomeSub || ''}
                    onChange={(e) => handleChange(activeTab, 'welcomeSub', e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl border-2 border-slate-200 bg-white focus:border-[#4221b6] outline-none font-bold text-xs shadow-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      {activeTab === 'ar' ? 'وسم النجوم (Stars Label):' : 'Label Étoiles :'}
                    </label>
                    <input
                      type="text"
                      required
                      value={formData[activeTab]?.starsLabel || ''}
                      onChange={(e) => handleChange(activeTab, 'starsLabel', e.target.value)}
                      className="w-full h-10 px-3.5 rounded-xl border-2 border-slate-200 bg-white focus:border-[#4221b6] outline-none font-bold text-xs shadow-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      {activeTab === 'ar' ? 'وسم الأيام المتتالية (Days Label):' : 'Label Jours :'}
                    </label>
                    <input
                      type="text"
                      required
                      value={formData[activeTab]?.daysLabel || ''}
                      onChange={(e) => handleChange(activeTab, 'daysLabel', e.target.value)}
                      className="w-full h-10 px-3.5 rounded-xl border-2 border-slate-200 bg-white focus:border-[#4221b6] outline-none font-bold text-xs shadow-sm"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Dynamic Fallback for any unknown/custom sectionKey */}
            {!['hero', 'videoSection', 'howItWorks', 'testimonials', 'calendarHeader', 'calendarPack', 'calendarStep1', 'calendarStep2', 'calendarStep3', 'footerSection', 'parentHeader', 'parentHistory', 'parentUpcoming', 'dashboardHeader', 'nextSession', 'favGames', 'reminderBanner'].includes(sectionKey) && (
              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-500 mb-2">
                  {activeTab === 'ar' ? 'حقول هذا القسم:' : 'Champs de cette section :'}
                </p>
                {Object.keys(formData[activeTab] || {}).map((fieldKey) => (
                  <div key={fieldKey} className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 capitalize">
                      {fieldKey} :
                    </label>
                    <input
                      type="text"
                      value={formData[activeTab][fieldKey] || ''}
                      onChange={(e) => handleChange(activeTab, fieldKey, e.target.value)}
                      className="w-full h-10 px-3.5 rounded-xl border-2 border-slate-200 bg-white focus:border-[#4221b6] outline-none font-bold text-xs shadow-sm"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="p-4 px-6 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-6 py-2.5 rounded-full border border-slate-300 bg-white text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
          >
            {lang === 'ar' ? 'إلغاء' : 'Annuler'}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 rounded-full bg-[#4221b6] hover:bg-[#341a99] text-white font-black text-xs shadow-md transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
          >
            <span>
              {saving
                ? 'Sauvegarde...'
                : lang === 'ar'
                ? 'حفظ في قاعدة البيانات'
                : 'Enregistrer dans la BD'}
            </span>
            <span className="material-symbols-outlined text-sm">cloud_upload</span>
          </button>
        </div>
      </div>
    </div>
  );
}
