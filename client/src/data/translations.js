export const translations = {
  fr: {
    brand: "La clé des langues",
    nav: {
      home: "Accueil",
      dashboard: "Espace Élève",
      parent: "Espace Parent",
      games: "Jeux",
      calendar: "Calendrier",
      admin: "Admin",
      learn: "Apprendre",
      progress: "Progrès",
      login: "Connexion",
      signup: "S'inscrire"
    },
    hero: {
      tag: "Apprendre. Progresser. S'épanouir.",
      title: "Bienvenue chez Les clés des langues",
      subtitle: "Notre plateforme accompagne les enfants et adolescents dans l'apprentissage de l'arabe et du français grâce à des cours en ligne interactifs, personnalisés et bienveillants.",
      features: [
        { icon: "school", text: "Cours en ligne interactifs", bg: "bg-[#EAF5EA]", color: "text-[#3B5E35]" },
        { icon: "person", text: "Maîtresses expérimentées", bg: "bg-[#FFF4E5]", color: "text-[#D97706]" },
        { icon: "trending_up", text: "Suivi personnalisé et progressif", bg: "bg-[#FCE8E6]", color: "text-[#E53E3E]" }
      ],
      tutorsTitle: "Nos maîtresses",
      tutors: [
        { name: "Olfa", desc: "Enseignante d'arabe avec plus de 15 ans d'expérience.", img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400" },
        { name: "Feten", desc: "Spécialiste en FLE, passionnée par l'enseignement et la pédagogie.", img: "https://images.unsplash.com/photo-1580894732413-801648a37947?auto=format&fit=crop&q=80&w=400" }
      ]
    },
    howItWorks: {
      title: "Comment ça marche ?",
      subtitle: "Un parcours simple pour commencer à apprendre.",
      steps: [
        {
          stepNum: "1",
          title: "Inscription",
          desc: "Créez un compte parent en quelques clics.",
          icon: "grid_view",
          bgIcon: "bg-[#FFEBEE]",
          iconColor: "text-[#D32F2F]"
        },
        {
          stepNum: "2",
          title: "Réservation",
          desc: "Choisissez l'horaire idéal pour votre enfant.",
          icon: "event_available",
          bgIcon: "bg-[#FFF9C4]",
          iconColor: "text-[#F57F17]"
        },
        {
          stepNum: "3",
          title: "Apprendre",
          desc: "Pratiquez avec nos jeux interactifs.",
          icon: "menu_book",
          bgIcon: "bg-[#E1F5FE]",
          iconColor: "text-[#0288D1]"
        },
        {
          stepNum: "4",
          title: "Session Live",
          desc: "Rencontrez nos tuteurs certifiés en direct.",
          icon: "record_voice_over",
          bgIcon: "bg-[#FFEBEE]",
          iconColor: "text-[#C62828]"
        }
      ]
    },
    Testimonials: {
      title: "Ce que disent les parents",
      list: [
        {
          id: 1,
          stars: 5,
          quote: '"Mes enfants adorent ! Ils attendent leur session du mercredi avec impatience."',
          author: "- Sophie, Maman de Léo (7 ans)"
        },
        {
          id: 2,
          stars: 5,
          quote: '"Une méthode vraiment ludique. L\'apprentissage de l\'arabe est devenu un jeu pour ma fille."',
          author: "- Karim, Papa de Lina (5 ans)"
        },
        {
          id: 3,
          stars: 4,
          quote: '"Les tuteurs sont très patients et la plateforme est super sécurisée. Je recommande !"',
          author: "- Marie, Maman de Thomas (9 ans)"
        }
      ]
    },
    trustBar: [
      { icon: "health_and_safety", label: "Plateforme Sécurisée", color: "text-[#C62828]" },
      { icon: "verified", label: "Tuteurs Certifiés", color: "text-[#558B2F]" },
      { icon: "shield_person", label: "Contrôle Parental", color: "text-[#37474F]" }
    ],
    authPage: {
      loginTab: "Connexion",
      signupTab: "S'inscrire",
      welcomeLoginTitle: "Ravi de vous revoir !",
      welcomeLoginSub: "Accédez à votre espace parent et suivez les progrès de vos enfants.",
      welcomeSignupTitle: " apprenons ensemble !",
      welcomeSignupSub: "Créez votre compte en 1 minute et offrez à votre enfant un apprentissage ludique.",
      feature1: "Des cours en direct avec des maîtresses certifiées.",
      feature2: "Des cours sur mesure, conçus pour accompagner chaque élève selon son niveau et son propre rythme.",
      feature3: "Des jeux éducatifs.",
      emailLabel: "Adresse e-mail",
      emailPlaceholder: "exemple@parent.com",
      passwordLabel: "Mot de passe",
      passwordPlaceholder: "••••••••",
      forgotPassword: "Mot de passe oublié ?",
      parentNameLabel: "Nom complet du parent",
      parentNamePlaceholder: "Ex: Sarah Martin",
      childNameLabel: "Prénom de l'enfant",
      childNamePlaceholder: "Ex: Léo",
      childAgeLabel: "Âge de l'enfant",
      ageOptions: ["3 - 5 ans (Maternelle)", "6 - 8 ans (Primaire)", "9 - 12 ans (Avancé)"],
      acceptTerms: "J'accepte les conditions d'utilisation et la politique de confidentialité",
      submitLogin: "Se connecter",
      submitSignup: "Créer mon compte gratuit",
      googleAuth: "Continuer avec Google",
      noAccountText: "Vous n'avez pas encore de compte ?",
      hasAccountText: "Vous avez déjà un compte ?",
      switchToSignup: "S'inscrire gratuitement",
      switchToLogin: "Se connecter"
    },
    notificationsPopover: {
      title: "Notifications",
      markAllRead: "Tout marquer comme lu",
      viewAll: "Voir toutes les notifications",
      unreadBadge: "2 nouvelles",
      items: [
        {
          id: 1,
          title: "Prochaine session à 16:30",
          desc: "Ta session de français avec Marie commence dans 15 minutes !",
          time: "Il y a 10 min",
          unread: true,
          icon: "videocam",
          iconBg: "bg-[#E1F5FE]",
          iconColor: "text-[#0288D1]"
        },
        {
          id: 2,
          title: "+15 Étoiles gagnées !",
          desc: "Bravo Léo ! Tu as réussi le niveau 2 dans Mots Magiques.",
          time: "Il y a 1 heure",
          unread: true,
          icon: "star",
          iconBg: "bg-[#FFFDE7]",
          iconColor: "text-[#F57F17]"
        },
        {
          id: 3,
          title: "Réservation confirmée",
          desc: "Votre réservation pour Mercredi à 14:00 a été validée.",
          time: "Il y a 3 heures",
          unread: false,
          icon: "event_available",
          iconBg: "bg-[#E8F5E9]",
          iconColor: "text-[#2E7D32]"
        }
      ]
    },
    dashboardPage: {
      welcome: "Salut Léo !",
      welcomeSub: "Prêt pour de nouvelles aventures aujourd'hui ?",
      starsLabel: "Étoiles",
      daysLabel: "Jours",
      nextSession: "Ta prochaine session",
      today: "AUJOURD'HUI",
      time: "16:30 - 17:00",
      teacher: "Avec Marie",
      countdown: "15:00",
      countdownSub: "avant le début",
      joinButton: "Rejoindre la session",
      favGames: "Tes jeux préférés",
      seeAllGames: "Voir tous les jeux",
      game1: "Mémory des Animaux",
      game2: "Bulles de Calcul",
      game3: "Mots Magiques",
      dailyGoal: "Objectif du jour",
      dailyGoalSub: "Gagne 20 étoiles pour débloquer une surprise !",
      reminderTag: "Rappel",
      reminderText: "Prépare tes crayons pour la session de demain !"
    },
    parentPage: {
      title: "Tableau de bord de Léo",
      subtitle: "Bienvenue dans l'espace parent. Suivez les progrès et gérez les sessions.",
      accountType: "Compte Parent",
      accountBadge: "Premium",
      globalProgress: "Progrès Globaux",
      french: "Français",
      frenchLevel: "Niveau 3 - 75%",
      frenchNext: "Prochaine étape: Vocabulaire des animaux",
      arabic: "Arabe",
      arabicLevel: "Niveau 1 - 40%",
      arabicNext: "En cours: L'alphabet (lettres de base)",
      historyTitle: "Historique des Sessions",
      seeAll: "Voir tout",
      thDate: "Date & Heure",
      thSubject: "Matière",
      thTutor: "Maîtresse",
      thStatus: "Statut",
      statusCompleted: "Complété",
      statusCancelled: "Annulé",
      upcomingTitle: "À Venir",
      todayTag: "Aujourd'hui",
      joinVideo: "Rejoindre la session",
      manageBtn: "Gérer",
      planNew: "Planifier une nouvelle session"
    },
    gamesCatalogPage: {
      heroTitle: "Prêt à t'amuser ?",
      heroSub: "Découvre de nouveaux mots en jouant !",
      heroSubAr: "أكتشف كلمات جديدة أثناء اللعب!",
      playBtn: "Jouer",
      lockedTag: "Bloqué",
      lockedMsg: "Termine le niveau 1 pour débloquer",
      list: [
        {
          id: 1,
          titleFr: "Mots Magiques",
          titleAr: "الكلمات السحرية",
          stars: 2,
          icon: "forum",
          bgClass: "bg-[#E3F2FD]",
          borderClass: "border-[#8c90f6]"
        },
        {
          id: 2,
          titleFr: "Puzzle des Animaux",
          titleAr: "لغز الحيوانات",
          stars: 1,
          icon: "extension",
          bgClass: "bg-[#E8F5E9]",
          borderClass: "border-[#8c90f6]"
        },
        {
          id: 3,
          titleFr: "Mémo Rapide",
          titleAr: "ذاكرة سريعة",
          stars: 3,
          icon: "memory",
          bgClass: "bg-[#FFFDE7]",
          borderClass: "border-[#8c90f6]"
        },
        {
          id: 4,
          titleFr: "Couleurs Vives",
          titleAr: "ألوان زاهية",
          stars: 1,
          icon: "palette",
          bgClass: "bg-[#F3E5F5]",
          borderClass: "border-[#8c90f6]"
        },
        {
          id: 5,
          titleFr: "Nombres Fous",
          titleAr: "أرقام مجنونة",
          stars: 2,
          icon: "calculate",
          bgClass: "bg-surface",
          borderClass: "border-[#8c90f6]",
          locked: true
        }
      ]
    },
    adminPage: {
      badge: "Admin Dashboard",
      title: "Session Requests",
      subtitle: "Manage upcoming tutoring sessions and add meeting links.",
      searchPlaceholder: "Search child...",
      filterBtn: "Filter",
      thChild: "Child Name",
      thDateTime: "Date & Time",
      thSubject: "Subject",
      thStatus: "Status",
      thActions: "Actions",
      addMeetBtn: "Ajouter lien Meet",
      viewNotesBtn: "View Notes",
      pendingStatus: "Pending",
      meetAddedStatus: "Meet Link Added",
      doneStatus: "Done",
      showingEntries: "Showing 1 to 3 of 12 entries",
      modalTitle: "Ajouter lien Meet",
      modalSessionFor: "Session for",
      modalLabel: "Google Meet Link",
      cancelBtn: "Annuler",
      saveBtn: "Sauvegarder"
    },
    calendarPage: {
      title: "Á VOS AGENDAS",
      subtitle: "Choisis ton jour et ton heure pour commencer à apprendre avec tes nouveaux amis.",
      packOffer: {
        badge: "OFFRE SPÉCIALE 4+1",
        freeTag: "1 Séance offerte !",
        title: "Pack Découverte : 4 Sessions + 1 Offerte 🎁",
        subtitle: "Réservez vos 4 premières leçons et obtenez 1 séance d'essai entièrement gratuite pour votre enfant !",
        features: [
          "5 séances au prix de 4",
          "Tuteur dédié & certifié",
          "1ère séance 100% offerte"
        ],
        selectBtn: "Activer le Pack 4 + 1 Gratuit",
        activeTag: "Pack 4+1 Activé !"
      },
      step1Title: "Choisis un jour",
      daysOfWeek: ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"],
      step2Title: "À quelle heure ?",
      timeSlots: ["10:00", "14:00", "16:30"],
      step3Title: "Mode de paiement",
      paymentMethods: [
        { id: 'card', name: 'Carte Bancaire / CIB', desc: 'Visa, Mastercard, E-Dinar (Cryptage 100% sécurisé)', icon: 'credit_card', badge: 'Recommandé' },
        { id: 'fawran', name: 'Payement virement ou Fawran (فوراً)', desc: 'Paiement immédiat par virement bancaire ou via le service Fawran', icon: 'bolt', badge: 'Rapide' }
      ],
      confirmButton: "Confirmer la réservation",
      eagerText: "On a hâte de te voir !",
      successTitle: "Super !",
      successMsg: "Ta réservation est confirmée pour le {day} à {time}.",
      backHome: "Retour à l'accueil"
    },
    gamesSection: {
      title: "Essaie un jeu !",
      subtitle: "Découvre nos mini-jeux éducatifs.",
      seeAll: "Voir tout",
      games: [
        {
          id: 1,
          title: "Le petit détective",
          desc: "Trouve les objets cachés et apprends leurs noms.",
          stars: 2,
          icon: "search",
          bg: "bg-[#f0f9ff]",
          border: "border-[#8c90f6]",
          iconColor: "text-primary-container"
        },
        {
          id: 2,
          title: "Mots Magiques",
          desc: "Relie les lettres pour former des sorts magiques.",
          stars: 3,
          icon: "auto_awesome",
          bg: "bg-[#fdf4ff]",
          border: "border-[#8c90f6]",
          iconColor: "text-[#d946ef]"
        },
        {
          id: 3,
          title: "Ferme aux Animaux",
          desc: "Apprends le cri des animaux de la ferme.",
          stars: 1,
          icon: "cruelty_free",
          bg: "bg-[#f0fdf4]",
          border: "border-[#8c90f6]",
          iconColor: "text-[#22c55e]"
        },
        {
          id: 4,
          title: "Couleurs Folles",
          desc: "Mélange les couleurs pour peindre le ciel.",
          stars: 3,
          icon: "palette",
          bg: "bg-[#fffbeb]",
          border: "border-[#8c90f6]",
          iconColor: "text-[#f59e0b]"
        }
      ]
    },
    homePage: {
      videoTag: "Démonstration vidéo",
      videoTitle: "Découvrez notre méthode en vidéo",
      videoDesc: "Regardez comment nos maîtresses certifiées accompagnent vos enfants vers le succès."
    },
    mobileNav: {
      home: "Accueil",
      lessons: "Leçons",
      calendar: "Calendrier",
      profile: "Profil"
    },
    footer: {
      copy: "© 2026 La clé des langues - Apprendre en s'amusant",
      parents: "Parents",
      help: "Aide",
      privacy: "Confidentialité"
    }
  },
  ar: {
    brand: "La clé des langues",
    nav: {
      home: "الرئيسية",
      dashboard: "لوحة الطالب",
      parent: "فضاء الوليّ",
      games: "الألعاب",
      calendar: "التقويم",
      admin: "الإدارة",
      learn: "تعلم",
      progress: "تقدم",
      login: "تسجيل الدخول",
      signup: "إنشاء حساب"
    },
    hero: {
      tag: "تعلم. تقدم. ازدهر.",
      title: "مرحباً بكم في منصة مفاتيح اللغات",
      subtitle: "منصتنا ترافق الأطفال والشباب في تعلم اللغة العربية والفرنسية من خلال دروس تفاعلية، مخصصة وممتعة عبر الإنترنت.",
      features: [
        { icon: "school", text: "دروس تفاعلية عبر الإنترنت", bg: "bg-[#EAF5EA]", color: "text-[#3B5E35]" },
        { icon: "person", text: "معلمات خبيرات ومتميزات", bg: "bg-[#FFF4E5]", color: "text-[#D97706]" },
        { icon: "trending_up", text: "متابعة فردية ومستمرة", bg: "bg-[#FCE8E6]", color: "text-[#E53E3E]" }
      ],
      tutorsTitle: "معلماتنا المتميزات",
      tutors: [
        { name: "ألفة", desc: "أستاذة لغة عربية بخبرة تتجاوز 15 عاماً في التدريس.", img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400" },
        { name: "فاتن", desc: "مختصة في اللغة الفرنسية وشغوفة بالتعليم والبيداغوجيا الحديثة.", img: "https://images.unsplash.com/photo-1580894732413-801648a37947?auto=format&fit=crop&q=80&w=400" }
      ]
    },
    howItWorks: {
      title: "كيف تعمل المنصة؟",
      subtitle: "مسار بسيط وممتع للبدء في رحلة التعلم.",
      steps: [
        {
          stepNum: "1",
          title: "التسجيل",
          desc: "أنشئ حساب ولي أمر في بضع خطوات بسيطة.",
          icon: "grid_view",
          bgIcon: "bg-[#FFEBEE]",
          iconColor: "text-[#D32F2F]"
        },
        {
          stepNum: "2",
          title: "الحجز",
          desc: "اختر التوقيت والموعد المثالي لطفلك.",
          icon: "event_available",
          bgIcon: "bg-[#FFF9C4]",
          iconColor: "text-[#F57F17]"
        },
        {
          stepNum: "3",
          title: "التعلم والمرح",
          desc: "تدرب واستمتع بألعابنا التعليمية التفاعلية.",
          icon: "menu_book",
          bgIcon: "bg-[#E1F5FE]",
          iconColor: "text-[#0288D1]"
        },
        {
          stepNum: "4",
          title: "جلسة مباشرة",
          desc: "التقِ بمعلمينا المعتمدين والمتميزين في بث مباشر.",
          icon: "record_voice_over",
          bgIcon: "bg-[#FFEBEE]",
          iconColor: "text-[#C62828]"
        }
      ]
    },
    Testimonials: {
      title: "ما يقوله أولياء الأمور",
      list: [
        {
          id: 1,
          stars: 5,
          quote: '"أطفالي يعشقون هذه المنصة! ينتظرون جلسة يوم الأربعاء بشغف وحماس كبير."',
          author: "- صوفي، والدة ليو (7 سنوات)"
        },
        {
          id: 2,
          stars: 5,
          quote: '"أسلوب ممتع ومبتكر. أصبح تعلم اللغة العربية بمثابة لعبة مسلية لابنتي."',
          author: "- كريم، والد لينا (5 سنوات)"
        },
        {
          id: 3,
          stars: 4,
          quote: '"المعلمون صبورون ومتميزون جداً، والمنصة آمنة ومحمية للغاية. أوصي بها بشدة!"',
          author: "- ماري، والدة توماس (9 سنوات)"
        }
      ]
    },
    trustBar: [
      { icon: "health_and_safety", label: "منصة آمنة ومحمية 100%", color: "text-[#C62828]" },
      { icon: "verified", label: "معلمون معتمدون ومتميزون", color: "text-[#558B2F]" },
      { icon: "shield_person", label: "رقابة عائلية وحماية كاملة", color: "text-[#37474F]" }
    ],
    authPage: {
      loginTab: "تسجيل الدخول",
      signupTab: "إنشاء حساب جديد",
      welcomeLoginTitle: "أهلاً بك مجدداً!",
      welcomeLoginSub: "سجّل دخولك لمتابعة تقدم أطفالك وجدولة جلساتهم بكل سهولة.",
      welcomeSignupTitle: "انضم إلى مغامرتنا الممتعة!",
      welcomeSignupSub: "أنشئ حسابك في دقيقة واحدة وامنح طفلك تجربة تعلم استثنائية.",
      feature1: "دروس مباشرة مع أفضل المعلمين المعتمدين",
      feature2: "ألعاب تعليمية ممتعة وتفاعلية",
      feature3: "متابعة دقيقة ومستمرة لمستوى طفلك",
      emailLabel: "البريد الإلكتروني",
      emailPlaceholder: "example@parent.com",
      passwordLabel: "كلمة المرور",
      passwordPlaceholder: "••••••••",
      forgotPassword: "نسيت كلمة المرور؟",
      parentNameLabel: "الاسم الكامل لولي الأمر",
      parentNamePlaceholder: "مثال: سارة أحمد",
      childNameLabel: "اسم الطفل",
      childNamePlaceholder: "مثال: ليو / يوسف",
      childAgeLabel: "عمر الطفل",
      ageOptions: ["3 - 5 سنوات (الروضة)", "6 - 8 سنوات (ابتدائي)", "9 - 12 سنة (متقدم)"],
      acceptTerms: "أوافق على شروط الاستخدام وسياسة الخصوصية",
      submitLogin: "تسجيل الدخول",
      submitSignup: "إنشاء حسابي المجاني",
      googleAuth: "المتابعة باستخدام Google",
      noAccountText: "ليس لديك حساب حتى الآن؟",
      hasAccountText: "لديك حساب بالفعل؟",
      switchToSignup: "إنشاء حساب مجاني",
      switchToLogin: "تسجيل الدخول"
    },
    notificationsPopover: {
      title: "الإشعارات",
      markAllRead: "تحديد الكل كمقروء",
      viewAll: "عرض كافة الإشعارات",
      unreadBadge: "2 جديدة",
      items: [
        {
          id: 1,
          title: "جلستك القادمة الساعة 16:30",
          desc: "تبدأ جلسة اللغة الفرنسية مع الأستاذة ماري خلال 15 دقيقة!",
          time: "منذ 10 دقائق",
          unread: true,
          icon: "videocam",
          iconBg: "bg-[#E1F5FE]",
          iconColor: "text-[#0288D1]"
        },
        {
          id: 2,
          title: "+15 نجمة جديدة!",
          desc: "أحسنت ليو! لقد تجاوزت المستوى 2 في لعبة الكلمات السحرية.",
          time: "منذ ساعة",
          unread: true,
          icon: "star",
          iconBg: "bg-[#FFFDE7]",
          iconColor: "text-[#F57F17]"
        },
        {
          id: 3,
          title: "تأكيد الحجز",
          desc: "تم تأكيد حجز جلسة طفلك ليوم الأربعاء الساعة 14:00 بنجاح.",
          time: "منذ 3 ساعات",
          unread: false,
          icon: "event_available",
          iconBg: "bg-[#E8F5E9]",
          iconColor: "text-[#2E7D32]"
        }
      ]
    },
    dashboardPage: {
      welcome: "مرحباً ليو!",
      welcomeSub: "هل أنت مستعد لمغامرات لغوية جديدة اليوم؟",
      starsLabel: "نجوم",
      daysLabel: "أيام متتالية",
      nextSession: "جلستك القادمة",
      today: "اليوم",
      time: "16:30 - 17:00",
      teacher: "مع الأستاذة ماري",
      countdown: "15:00",
      countdownSub: "قبل البداية",
      joinButton: "الانضمام إلى الجلسة",
      favGames: "ألعابك المفضلة",
      seeAllGames: "عرض كل الألعاب",
      game1: "ذاكرة الحيوانات",
      game2: "فقاعات الحساب",
      game3: "الكلمات السحرية",
      dailyGoal: "هدف اليوم",
      dailyGoalSub: "احصل على 20 نجمة لفتح مفاجأة مميزة!",
      reminderTag: "تذكير هام",
      reminderText: "جهّز أقلامك الملونة لجلسة الغد الممتعة!"
    },
    parentPage: {
      title: "لوحة متابعة ليو",
      subtitle: "أهلاً بك في فضاء أولياء الأمور. تابع تقدم طفلك وقم بإدارة الجلسات بكل سهولة.",
      accountType: "حساب ولي الأمر",
      accountBadge: "بريميوم",
      globalProgress: "التقدم العام",
      french: "اللغة الفرنسية",
      frenchLevel: "المستوى 3 - 75%",
      frenchNext: "المرحلة القادمة: مفردات الحيوانات",
      arabic: "اللغة العربية",
      arabicLevel: "المستوى 1 - 40%",
      arabicNext: "قيد الإنجاز: الحروف الهجائية الأساسية",
      historyTitle: "سجل الجلسات السابقة",
      seeAll: "عرض الكل",
      thDate: "التاريخ والوقت",
      thSubject: "المادة",
      thTutor: "المعلم / المعلمة",
      thStatus: "الحالة",
      statusCompleted: "مكتملة",
      statusCancelled: "ملغاة",
      upcomingTitle: "الجلسات القادمة",
      todayTag: "اليوم",
      joinVideo: "الانضمام إلى الجلسة",
      manageBtn: "إدارة الجلسة",
      planNew: "جدولة جلسة جديدة"
    },
    gamesCatalogPage: {
      heroTitle: "هل أنت مستعد للمرح؟",
      heroSub: "أكتشف كلمات جديدة أثناء اللعب!",
      heroSubAr: "Découvre de nouveaux mots en jouant !",
      playBtn: "العب الآن",
      lockedTag: "مغلقة",
      lockedMsg: "أكمل المستوى 1 لفتح هذه اللعبة",
      list: [
        {
          id: 1,
          titleFr: "Mots Magiques",
          titleAr: "الكلمات السحرية",
          stars: 2,
          icon: "forum",
          bgClass: "bg-[#E3F2FD]",
          borderClass: "border-[#8c90f6]"
        },
        {
          id: 2,
          titleFr: "Puzzle des Animaux",
          titleAr: "لغز الحيوانات",
          stars: 1,
          icon: "extension",
          bgClass: "bg-[#E8F5E9]",
          borderClass: "border-[#8c90f6]"
        },
        {
          id: 3,
          titleFr: "Mémo Rapide",
          titleAr: "ذاكرة سريعة",
          stars: 3,
          icon: "memory",
          bgClass: "bg-[#FFFDE7]",
          borderClass: "border-[#8c90f6]"
        },
        {
          id: 4,
          titleFr: "Couleurs Vives",
          titleAr: "ألوان زاهية",
          stars: 1,
          icon: "palette",
          bgClass: "bg-[#F3E5F5]",
          borderClass: "border-[#8c90f6]"
        },
        {
          id: 5,
          titleFr: "Nombres Fous",
          titleAr: "أرقام مجنونة",
          stars: 2,
          icon: "calculate",
          bgClass: "bg-surface",
          borderClass: "border-[#8c90f6]",
          locked: true
        }
      ]
    },
    adminPage: {
      badge: "لوحة التحكم للإدارة",
      title: "طلبات الجلسات",
      subtitle: "إدارة الجلسات التعليمية القادمة وإضافة روابط اللقاء عبر Google Meet.",
      searchPlaceholder: "بحث باسم الطفل...",
      filterBtn: "تصفية",
      thChild: "اسم الطفل",
      thDateTime: "التاريخ والوقت",
      thSubject: "المادة",
      thStatus: "الحالة",
      thActions: "الإجراءات",
      addMeetBtn: "إضافة رابط Meet",
      viewNotesBtn: "عرض الملاحظات",
      pendingStatus: "قيد الانتظار",
      meetAddedStatus: "تم إضافة الرابط",
      doneStatus: "مكتملة",
      showingEntries: "عرض 1 إلى 3 من 12 جلسة",
      modalTitle: "إضافة رابط Google Meet",
      modalSessionFor: "جلسة الطفل:",
      modalLabel: "رابط اجتماع Google Meet",
      cancelBtn: "إلغاء",
      saveBtn: "حفظ الرابط"
    },
    calendarPage: {
      title: "هل أنت مستعد للمغامرة؟",
      subtitle: "اختر اليوم والوقت المناسبين لتبدأ التعلم الممتع مع أصدقائك الجدد.",
      packOffer: {
        badge: "عرض خاص 4+1",
        freeTag: "حصة تجريبية مجاناً!",
        title: "حزمة الإكتشاف: 4 حصص + 1 مجاناً 🎁",
        subtitle: "احجز 4 حصص تعليمية واحصل فوراً على حصة تجريبية إضافية مجانية بالكامل لترغيب طفلك!",
        features: [
          "5 حصص بسعر 4 فقط",
          "معلمون معتمدون وصبورون",
          "الحصة الأولى 100% مجاناً"
        ],
        selectBtn: "تفعيل حزمة 4 + 1 مجاناً",
        activeTag: "تم تفعيل حزمة 4+1!"
      },
      step1Title: "اختر يوماً",
      daysOfWeek: ["الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت", "الأحد"],
      step2Title: "في أي وقت؟",
      timeSlots: ["10:00", "14:00", "16:30"],
      step3Title: "طريقة الدفع",
      paymentMethods: [
        { id: 'card', name: 'البطاقة البنكية (Carte Bancaire / CIB)', desc: 'فيزا، ماستركارد، أو الدينار الإلكتروني (دفع آمن 100%)', icon: 'credit_card', badge: 'موصى به' },
        { id: 'fawran', name: 'دفع عبر التحويل أو فوراً (Payement virement ou Fawran)', desc: 'دفع فوري عبر التحويل البنكي أو تطبيق فوراً السريع', icon: 'bolt', badge: 'فوري' }
      ],
      confirmButton: "تأكيد الحجز",
      eagerText: "نحن متأملون لرؤيتك قريباً!",
      successTitle: "رائع جداً!",
      successMsg: "تم تأكيد حجزك بنجاح ليوم {day} الساعة {time}.",
      backHome: "العودة إلى الرئيسية"
    },
    gamesSection: {
      title: "جرب لعبة!",
      subtitle: "اكتشف ألعابنا التعليمية المصغرة والممتعة.",
      seeAll: "عرض الكل",
      games: [
        {
          id: 1,
          title: "المحقق الصغير",
          desc: "اعثر على الأشياء المخفية وتعلم أسماءها.",
          stars: 2,
          icon: "search",
          bg: "bg-[#f0f9ff]",
          border: "border-[#8c90f6]",
          iconColor: "text-primary-container"
        },
        {
          id: 2,
          title: "الكلمات السحرية",
          desc: "صل الحروف لتشكيل كلمات وتعويذات سحرية.",
          stars: 3,
          icon: "auto_awesome",
          bg: "bg-[#fdf4ff]",
          border: "border-[#8c90f6]",
          iconColor: "text-[#d946ef]"
        },
        {
          id: 3,
          title: "مزرعة الحيوانات",
          desc: "تعرف على أصوات حيوانات المزرعة الكيوت.",
          stars: 1,
          icon: "cruelty_free",
          bg: "bg-[#f0fdf4]",
          border: "border-[#8c90f6]",
          iconColor: "text-[#22c55e]"
        },
        {
          id: 4,
          title: "الألوان العجيبة",
          desc: "امزج الألوان المبهجة لتلوين السماء.",
          stars: 3,
          icon: "palette",
          bg: "bg-[#fffbeb]",
          border: "border-[#8c90f6]",
          iconColor: "text-[#f59e0b]"
        }
      ]
    },
    homePage: {
      videoTag: "عرض توضيحي",
      videoTitle: "اكتشف أسلوبنا التعلمي بالفيديو",
      videoDesc: "شاهد كيف ترافق معلماتنا المتميزات أطفالكم نحو النجاح والتألق."
    },
    mobileNav: {
      home: "الرئيسية",
      lessons: "الدروس",
      calendar: "التقويم",
      profile: "الملف الشخصي"
    },
    footer: {
      copy: "© 2026 La clé des langues - التعلم بمرح وشغف",
      parents: "أولياء الأمور",
      help: "المساعدة",
      privacy: "الخصوصية"
    }
  }
};
