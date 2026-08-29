import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import SentenceQuizGame from '../components/SentenceQuizGame';
import SentenceBuilderGame from '../components/SentenceBuilderGame';
import WordSpellingGame from '../components/WordSpellingGame';

const INITIAL_GAMES_LIST = [
  {
    id: 'sentence-completion-quiz',
    type: 'sentence-quiz',
    category: 'vocab',
    age: '5-12 ans',
    starsToWin: 5,
    badge: 'Nouveau & Vedette ⭐',
    color: 'from-[#4221b6] to-[#5d35e0]',
    bgLight: 'bg-indigo-50',
    borderAccent: 'border-indigo-300',
    icon: 'psychology',
    img: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=400',
    title: {
      fr: 'Le Mot Manquant 🎯',
      ar: 'تحدي الكلمة الناقصة 🎯',
      en: 'Sentence Completion Quiz 🎯',
    },
    desc: {
      fr: 'Lis la phrase complète, trouve le mot manquant et gagne des points avec des effets festifs !',
      ar: 'اقرأ الجملة المرجعية الكاملة، واختر الكلمة الصحيحة لإكمال الجملة واجمع النقاط مع احتفال ممتع!',
      en: 'Read the sentence, find the missing word, win points, and enjoy celebratory confetti!',
    },
  },
  {
    id: 'sentence-builder-game',
    type: 'sentence-builder',
    category: 'vocab',
    age: '5-12 ans',
    starsToWin: 5,
    badge: 'Nouveau 🧩',
    color: 'from-amber-400 to-orange-500',
    bgLight: 'bg-amber-50',
    borderAccent: 'border-amber-300',
    icon: 'extension',
    img: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=400',
    title: {
      fr: 'Le Constructeur de Phrases 🧩',
      ar: 'تحدي تركيب الجمل 🧩',
      en: 'Sentence Builder Challenge 🧩',
    },
    desc: {
      fr: 'Regarde l\'image, réorganise les mots mélangés pour former la bonne phrase et gagne des points !',
      ar: 'شاهد الصورة، ورتّب الكلمات المبعثرة لتكوين الجملة الفرنسية الصحيحة واجمع النقاط!',
      en: 'Look at the image, reorder scrambled words to form the correct sentence and win points!',
    },
  },
  {
    id: 'word-spelling-game',
    type: 'word-spelling',
    category: 'vocab',
    age: '5-12 ans',
    starsToWin: 5,
    badge: 'Nouveau 🔤',
    color: 'from-emerald-400 to-teal-500',
    bgLight: 'bg-emerald-50',
    borderAccent: 'border-emerald-300',
    icon: 'font_download',
    img: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=400',
    title: {
      fr: 'Le Maître des Lettres 🔤',
      ar: 'تحدي تركيب الحروف 🔤',
      en: 'Letter Master Challenge 🔤',
    },
    desc: {
      fr: 'Observe l\'image, assemble les lettres mélangées pour former le bon mot en français et gagne des points !',
      ar: 'شاهد الصورة، ورتّب الحروف المبعثرة لتكوين الكلمة الفرنسية الصحيحة واجمع النقاط!',
      en: 'Look at the image, assemble scrambled letters to spell the target French word and win points!',
    },
  },
];



export default function GamesPage() {
  const { lang, isRtl } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Check if role contains 'admin' (e.g. 'admin', 'superadmin', 'admin_tutor', or role array)
  const isAdmin = (() => {
    if (!user) return false;
    if (user.isAdmin === true) return true;
    const r = user.role || user.roles;
    if (!r) return false;
    if (typeof r === 'string') return r.toLowerCase().includes('admin');
    if (Array.isArray(r)) return r.some((item) => String(item).toLowerCase().includes('admin'));
    return false;
  })();

  // Games state from localStorage merged with INITIAL_GAMES_LIST so all games are always available
  const [games, setGames] = useState(() => {
    try {
      const saved = localStorage.getItem('custom_games_list');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge saved customized attributes with INITIAL_GAMES_LIST so all games are always present
          const merged = INITIAL_GAMES_LIST.map((defaultGame) => {
            const custom = parsed.find((g) => g && g.id === defaultGame.id);
            return custom ? { ...defaultGame, ...custom } : defaultGame;
          });
          // Also include any extra custom games that might have been added
          const extraGames = parsed.filter(
            (p) => p && p.id && !INITIAL_GAMES_LIST.some((d) => d.id === p.id)
          );
          return [...merged, ...extraGames];
        }
      }
      return INITIAL_GAMES_LIST;
    } catch {
      return INITIAL_GAMES_LIST;
    }
  });

  // Ensure localStorage is updated with all games
  useEffect(() => {
    try {
      localStorage.setItem('custom_games_list', JSON.stringify(games));
    } catch {}
  }, [games]);



  const [activeCategory, setActiveCategory] = useState('all');
  const [activeAge, setActiveAge] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeGameModal, setActiveGameModal] = useState(null);

  // Admin Card Editing State
  const [editingGameCard, setEditingGameCard] = useState(null);

  const [totalStars, setTotalStars] = useState(() => {
    try {
      const saved = localStorage.getItem('child_stars_count');
      return saved ? parseInt(saved, 10) : 18;
    } catch {
      return 18;
    }
  });

  // Sound effects generator using Web Audio API
  const playChime = (type = 'success') => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === 'success') {
        osc.frequency.setValueAtTime(523.25, audioCtx.currentTime);
        osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1);
        osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.2);
        osc.frequency.setValueAtTime(1046.5, audioCtx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.6);
      } else if (type === 'flip') {
        osc.frequency.setValueAtTime(440, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
      } else if (type === 'wrong') {
        osc.frequency.setValueAtTime(220, audioCtx.currentTime);
        osc.frequency.setValueAtTime(180, audioCtx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
      }
    } catch (e) {}
  };

  const addStars = (count) => {
    const next = totalStars + count;
    setTotalStars(next);
    localStorage.setItem('child_stars_count', String(next));
  };

  // Categories definitions
  const categories = [
    { id: 'all', icon: 'apps', fr: 'Tous les jeux', ar: 'كل الألعاب', en: 'All Games' },
    { id: 'vocab', icon: 'menu_book', fr: 'Vocabulaire', ar: 'مفردات ولغة', en: 'Vocabulary' },
    { id: 'memory', icon: 'psychology', fr: 'Mémoire & Logique', ar: 'ذاكرة وتركيز', en: 'Memory & Logic' },
    { id: 'math', icon: 'calculate', fr: 'Calcul & Chiffres', ar: 'حساب وأرقام', en: 'Math & Numbers' },
    { id: 'alphabet', icon: 'font_download', fr: 'Alphabet & Sons', ar: 'حروف وأصوات', en: 'Alphabet & Phonics' },
  ];

  // Filtering
  const filteredGames = games.filter((g) => {
    const matchCategory = activeCategory === 'all' || g.category === activeCategory;
    const matchAge = activeAge === 'all' || g.age.includes(activeAge);
    const titleText = (g.title[lang] || g.title.fr || '').toLowerCase();
    const descText = (g.desc[lang] || g.desc.fr || '').toLowerCase();
    const matchSearch = !searchQuery || titleText.includes(searchQuery.toLowerCase()) || descText.includes(searchQuery.toLowerCase());
    return matchCategory && matchAge && matchSearch;
  });

  // Admin Save Card Handler
  const handleSaveCardEdits = (e) => {
    e.preventDefault();
    if (!editingGameCard) return;

    const updated = games.map((g) => (g.id === editingGameCard.id ? editingGameCard : g));
    setGames(updated);
    try {
      localStorage.setItem('custom_games_list', JSON.stringify(updated));
    } catch {}

    setEditingGameCard(null);
    playChime('success');
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8 md:py-12 flex flex-col gap-8 relative z-10 pb-32">
      
      {/* 1. Hero Mascot Banner */}
      <section className="bg-gradient-to-r from-[#4221b6] via-[#5d35e0] to-[#2563eb] rounded-3xl p-6 sm:p-8 md:p-10 text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 border-2 border-white/20">
        
        {/* Background decorative glowing circles */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-[#78fd7d]/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-[#f43f5e]/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="space-y-4 max-w-2xl text-left rtl:text-right relative z-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3.5 py-1 rounded-full bg-[#78fd7d] text-[#064e3b] text-xs font-black uppercase tracking-wider shadow-sm inline-flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">sports_esports</span>
              {lang === 'ar' ? 'ألعاب تعليمية 100% تفاعلية' : 'Jeux Éducatifs Interactifs'}
            </span>
            <span className="px-3.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-bold shadow-sm inline-flex items-center gap-1">
              <span className="material-symbols-outlined text-sm text-yellow-300">star</span>
              {totalStars} {lang === 'ar' ? 'نجمة مجمعة' : 'Étoiles gagnées'}
            </span>
            {isAdmin && (
              <span className="px-3 py-1 rounded-full bg-amber-400 text-slate-900 text-xs font-black shadow-sm flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">admin_panel_settings</span>
                <span>وضع التعديل للمسؤول مفعّل</span>
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
            {lang === 'ar' ? '🎮 عالم الألعاب والمغامرات التعليمية' : '🎮 Le Monde des Jeux Éducatifs'}
          </h1>
          <p className="text-sm sm:text-base text-white/90 font-medium leading-relaxed">
            {lang === 'ar'
              ? 'تعلّم المفردات، درّب ذاكرتك، وحل التحديات الممتعة باللغتين الفرنسية والعربية واجمع النجوم الذهبية!'
              : 'Découvre des mini-jeux captivants pour enrichir ton vocabulaire, stimuler ta mémoire et apprendre en t\'amusant !'}
          </p>
        </div>

        {/* Mascot Card */}
        <div className="relative z-10 shrink-0 bg-white/10 backdrop-blur-lg p-5 rounded-3xl border border-white/25 shadow-xl flex flex-col items-center text-center gap-2 w-full sm:w-60">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#78fd7d] to-[#b0fdb5] flex items-center justify-center text-4xl shadow-inner animate-bounce">
            🦊
          </div>
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold text-white/80 uppercase tracking-wider">
              {lang === 'ar' ? 'رصيد النجوم' : 'Score Total'}
            </span>
            <div className="text-2xl font-black text-[#78fd7d] flex items-center justify-center gap-1">
              <span>{totalStars}</span>
              <span className="material-symbols-outlined text-yellow-300 text-2xl">star</span>
            </div>
          </div>
          <p className="text-[11px] text-white/80 font-medium">
            {lang === 'ar' ? 'كل لعبة تمنحك +3 نجوم!' : 'Chaque jeu te donne +3 étoiles !'}
          </p>
        </div>
      </section>

      {/* 3. Games Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {games.map((game) => (

          <div
            key={game.id}
            className="bg-white rounded-3xl overflow-hidden border-2 border-slate-200/90 shadow-md hover:shadow-2xl hover:border-[#8c90f6] transition-all duration-300 flex flex-col group hover:-translate-y-1 relative"
          >
            {/* Thumbnail banner */}
            <div className="relative h-44 overflow-hidden bg-slate-100">
              <img
                src={game.img}
                alt={game.title[lang] || game.title.fr}
                className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>

              {/* Top Badges */}
              <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-[#1c0576] font-black text-[11px] shadow-sm">
                  {game.badge}
                </span>

                <div className="flex items-center gap-1.5">
                  {/* ADMIN EDIT GAME CARD BUTTON */}
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingGameCard({ ...game });
                      }}
                      className="px-2.5 py-1 rounded-full bg-amber-400 hover:bg-amber-500 text-slate-900 font-black text-[11px] shadow-md flex items-center gap-1 transition cursor-pointer"
                      title="تعديل اسم وصورة اللعبة (مسؤول)"
                    >
                      <span className="material-symbols-outlined text-xs">edit</span>
                      <span>تعديل الكارت</span>
                    </button>
                  )}

                  <span className="px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md text-white font-bold text-[11px] flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs text-yellow-300">child_care</span>
                    <span>{game.age}</span>
                  </span>
                </div>
              </div>

              {/* Bottom game title in image */}
              <div className="absolute bottom-3 left-3 right-3 text-white flex items-center justify-between">
                <h3 className="font-extrabold text-base leading-tight text-white drop-shadow">
                  {game.title[lang] || game.title.fr}
                </h3>
                <span className="flex items-center text-yellow-300 text-xs font-black bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-sm">
                  ★ {game.starsToWin}
                </span>
              </div>
            </div>

            {/* Body */}
            <div className="p-5 flex-1 flex flex-col justify-between gap-4">
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                {game.desc[lang] || game.desc.fr}
              </p>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                <div className="flex items-center gap-1 text-yellow-400">
                  {[...Array(game.starsToWin)].map((_, i) => (
                    <span key={i} className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                      star
                    </span>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    playChime('flip');
                    setActiveGameModal(game);
                  }}
                  className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#4221b6] to-[#5d35e0] text-white font-black text-xs shadow-md hover:shadow-indigo-200 hover:scale-105 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">play_arrow</span>
                  <span>{lang === 'ar' ? 'العب الآن' : 'Jouer'}</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* ADMIN EDIT GAME CARD MODAL */}
      {editingGameCard && (
        <div className="fixed inset-0 z-[999999] bg-black/80 backdrop-blur-md p-4 flex items-center justify-center overflow-y-auto">
          <form
            onSubmit={handleSaveCardEdits}
            className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl border-4 border-amber-400 animate-in zoom-in-95 duration-200"
            dir={isRtl ? 'rtl' : 'ltr'}
          >
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <div className="flex items-center gap-2 text-amber-600 font-black text-base">
                <span className="material-symbols-outlined">edit</span>
                <span>تعديل اللعبة: {editingGameCard.title.ar || editingGameCard.title.fr}</span>
              </div>
              <button
                type="button"
                onClick={() => setEditingGameCard(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            {/* Image URL & Preview */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-700 block">رابط الصورة (URL):</label>
              <div className="flex gap-3 items-center">
                <input
                  type="text"
                  value={editingGameCard.img}
                  onChange={(e) => setEditingGameCard({ ...editingGameCard, img: e.target.value })}
                  className="flex-1 px-3.5 py-2 text-xs font-bold border-2 border-slate-200 rounded-xl focus:border-amber-500 outline-none bg-slate-50"
                  required
                />
                <img
                  src={editingGameCard.img}
                  alt="معاينة"
                  className="w-12 h-12 rounded-xl object-cover border-2 border-slate-200 shrink-0"
                />
              </div>
            </div>

            {/* Age Range Field */}
            <div className="space-y-1.5 pt-1 border-t border-slate-100">
              <label className="text-xs font-black text-slate-700 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm text-amber-500">child_care</span>
                <span>الفئة العمرية المناسبة (Âge approprié) :</span>
              </label>
              <input
                type="text"
                value={editingGameCard.age || ''}
                onChange={(e) => setEditingGameCard({ ...editingGameCard, age: e.target.value })}
                className="w-full px-3.5 py-2 text-xs font-bold border-2 border-slate-200 rounded-xl focus:border-amber-500 outline-none bg-slate-50"
                placeholder="مثال: 5-12 ans أو 4-8 سنوات"
                required
              />
            </div>


            {/* Title in 3 languages */}
            <div className="space-y-2 pt-1 border-t border-slate-100">
              <label className="text-xs font-black text-slate-700 block">عنوان اللعبة باللغات الثلاث:</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <span className="text-[10px] font-extrabold text-slate-500 block mb-0.5">بالفرنسية (FR):</span>
                  <input
                    type="text"
                    value={editingGameCard.title.fr || ''}
                    onChange={(e) =>
                      setEditingGameCard({
                        ...editingGameCard,
                        title: { ...editingGameCard.title, fr: e.target.value },
                      })
                    }
                    className="w-full px-3 py-1.5 text-xs font-bold border border-slate-200 rounded-xl focus:border-amber-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-slate-500 block mb-0.5">بالعربية (AR):</span>
                  <input
                    type="text"
                    value={editingGameCard.title.ar || ''}
                    onChange={(e) =>
                      setEditingGameCard({
                        ...editingGameCard,
                        title: { ...editingGameCard.title, ar: e.target.value },
                      })
                    }
                    className="w-full px-3 py-1.5 text-xs font-bold border border-slate-200 rounded-xl focus:border-amber-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-slate-500 block mb-0.5">بالإنجليزية (EN):</span>
                  <input
                    type="text"
                    value={editingGameCard.title.en || ''}
                    onChange={(e) =>
                      setEditingGameCard({
                        ...editingGameCard,
                        title: { ...editingGameCard.title, en: e.target.value },
                      })
                    }
                    className="w-full px-3 py-1.5 text-xs font-bold border border-slate-200 rounded-xl focus:border-amber-500 outline-none"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Description in 3 languages */}
            <div className="space-y-2 pt-1 border-t border-slate-100">
              <label className="text-xs font-black text-slate-700 block">وصف اللعبة باللغات الثلاث:</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <span className="text-[10px] font-extrabold text-slate-500 block mb-0.5">الوصف بالفرنسية (FR):</span>
                  <textarea
                    rows={2}
                    value={editingGameCard.desc.fr || ''}
                    onChange={(e) =>
                      setEditingGameCard({
                        ...editingGameCard,
                        desc: { ...editingGameCard.desc, fr: e.target.value },
                      })
                    }
                    className="w-full px-3 py-1.5 text-xs font-bold border border-slate-200 rounded-xl focus:border-amber-500 outline-none resize-none"
                    required
                  />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-slate-500 block mb-0.5">الوصف بالعربية (AR):</span>
                  <textarea
                    rows={2}
                    value={editingGameCard.desc.ar || ''}
                    onChange={(e) =>
                      setEditingGameCard({
                        ...editingGameCard,
                        desc: { ...editingGameCard.desc, ar: e.target.value },
                      })
                    }
                    className="w-full px-3 py-1.5 text-xs font-bold border border-slate-200 rounded-xl focus:border-amber-500 outline-none resize-none"
                    required
                  />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-slate-500 block mb-0.5">الوصف بالإنجليزية (EN):</span>
                  <textarea
                    rows={2}
                    value={editingGameCard.desc.en || ''}
                    onChange={(e) =>
                      setEditingGameCard({
                        ...editingGameCard,
                        desc: { ...editingGameCard.desc, en: e.target.value },
                      })
                    }
                    className="w-full px-3 py-1.5 text-xs font-bold border border-slate-200 rounded-xl focus:border-amber-500 outline-none resize-none"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingGameCard(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs hover:bg-slate-200"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs shadow-md transition"
              >
                حفظ التغييرات ✓
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 4. Interactive In-Browser Game Play Modal */}
      {activeGameModal && (
        activeGameModal.id === 'sentence-completion-quiz' ? (
          <SentenceQuizGame
            lang={lang}
            isRtl={isRtl}
            onClose={() => setActiveGameModal(null)}
            onWinStars={(count) => {
              playChime('success');
              addStars(count);
            }}
          />
        ) : activeGameModal.id === 'sentence-builder-game' ? (
          <SentenceBuilderGame
            lang={lang}
            isRtl={isRtl}
            onClose={() => setActiveGameModal(null)}
            onWinStars={(count) => {
              playChime('success');
              addStars(count);
            }}
          />
        ) : activeGameModal.id === 'word-spelling-game' ? (
          <WordSpellingGame
            lang={lang}
            isRtl={isRtl}
            onClose={() => setActiveGameModal(null)}
            onWinStars={(count) => {
              playChime('success');
              addStars(count);
            }}
          />
        ) : (
          <InteractiveGamePlayer
            game={activeGameModal}
            lang={lang}
            isRtl={isRtl}
            onClose={() => setActiveGameModal(null)}
            onWinStars={(count) => {
              playChime('success');
              addStars(count);
            }}
            playChime={playChime}
          />
        )
      )}

    </div>
  );
}

/* =========================================================
   Interactive In-Browser Playable Mini-Games Component
========================================================= */
function InteractiveGamePlayer({ game, lang, isRtl, onClose, onWinStars, playChime }) {
  const [gameState, setGameState] = useState('playing');
  const [wonStarsCount, setWonStarsCount] = useState(0);

  const memoryItems = [
    { id: 1, nameFr: 'Le Chat 🐱', nameAr: 'القط 🐱', key: 'cat' },
    { id: 2, nameFr: 'Le Chien 🐶', nameAr: 'الكلب 🐶', key: 'dog' },
    { id: 3, nameFr: 'Le Lapin 🐰', nameAr: 'الأرنب 🐰', key: 'rabbit' },
    { id: 4, nameFr: 'L\'Oiseau 🐦', nameAr: 'العصفور 🐦', key: 'bird' },
  ];

  const [cards, setCards] = useState(() => {
    const duplicated = [...memoryItems, ...memoryItems].map((item, index) => ({
      ...item,
      uniqueId: index,
      isFlipped: false,
      isMatched: false,
    }));
    return duplicated.sort(() => Math.random() - 0.5);
  });

  const [flippedCards, setFlippedCards] = useState([]);
  const [moves, setMoves] = useState(0);

  const quizQuestions = [
    {
      qFr: 'Comment dit-on "شمس" en Français ?',
      qAr: 'ما معنى كلمة "شمس" بالفرنسية؟',
      options: ['Le Soleil ☀️', 'La Lune 🌙', 'L\'Étoile ⭐'],
      correct: 0,
    },
    {
      qFr: 'Quelle est la couleur de la pomme ?',
      qAr: 'ما هو لون التفاحة في الصورة؟',
      options: ['Rouge 🍎', 'Bleu 🌊', 'Jaune 🍌'],
      correct: 0,
    },
    {
      qFr: 'Combien font 3 + 4 ?',
      qAr: 'كم يساوي 3 + 4 ؟',
      options: ['6', '7', '8'],
      correct: 1,
    },
  ];
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);

  const handleCardClick = (card) => {
    if (card.isFlipped || card.isMatched || flippedCards.length === 2) return;
    playChime('flip');

    const newCards = cards.map((c) =>
      c.uniqueId === card.uniqueId ? { ...c, isFlipped: true } : c
    );
    setCards(newCards);

    const newFlipped = [...flippedCards, card];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      setMoves((m) => m + 1);
      if (newFlipped[0].key === newFlipped[1].key) {
        playChime('success');
        setTimeout(() => {
          setCards((prev) => {
            const updated = prev.map((c) =>
              c.key === newFlipped[0].key ? { ...c, isMatched: true } : c
            );
            if (updated.every((c) => c.isMatched)) {
              setGameState('won');
              setWonStarsCount(3);
              onWinStars(3);
            }
            return updated;
          });
          setFlippedCards([]);
        }, 500);
      } else {
        playChime('wrong');
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) =>
              c.uniqueId === newFlipped[0].uniqueId || c.uniqueId === newFlipped[1].uniqueId
                ? { ...c, isFlipped: false }
                : c
            )
          );
          setFlippedCards([]);
        }, 900);
      }
    }
  };

  const handleQuizAnswer = (optionIdx) => {
    setSelectedOption(optionIdx);
    const currQ = quizQuestions[quizIdx];
    if (optionIdx === currQ.correct) {
      playChime('success');
      setQuizScore((s) => s + 1);
    } else {
      playChime('wrong');
    }

    setTimeout(() => {
      setSelectedOption(null);
      if (quizIdx + 1 < quizQuestions.length) {
        setQuizIdx((i) => i + 1);
      } else {
        setGameState('won');
        const stars = quizScore + 1;
        setWonStarsCount(stars);
        onWinStars(stars);
      }
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-[999999] bg-black/75 backdrop-blur-md p-4 flex items-center justify-center">
      <div
        className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 flex flex-col gap-6 shadow-2xl border-2 border-[#4221b6] relative animate-in zoom-in-95 duration-200 overflow-hidden"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#78fd7d] to-[#b0fdb5] flex items-center justify-center text-xl shadow-sm">
              🎮
            </span>
            <div>
              <h3 className="font-black text-base text-[#1c0576]">
                {game.title[lang] || game.title.fr}
              </h3>
              <p className="text-[11px] text-slate-500 font-bold">
                {lang === 'ar' ? 'العب واجمع النجوم!' : 'Joue et gagne des étoiles !'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-red-100 text-slate-600 hover:text-red-600 flex items-center justify-center transition cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {gameState === 'won' ? (
          <div className="text-center space-y-5 py-6 animate-in zoom-in duration-300">
            <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-tr from-[#78fd7d] to-[#b0fdb5] flex items-center justify-center text-5xl shadow-xl animate-bounce">
              🏆
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl sm:text-3xl font-black text-[#1c0576]">
                {lang === 'ar' ? '🎉 أحسنت صنعاً يا بطل!' : '🎉 Bravo, c\'est gagné !'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 font-bold">
                {lang === 'ar'
                  ? `لقد ربحت +${wonStarsCount} نجوم ذهبية وأضفتها إلى رصيدك!`
                  : `Tu as remporté +${wonStarsCount} étoiles d'or pour ton score !`}
              </p>
            </div>

            <div className="flex justify-center gap-2 text-yellow-400 py-2">
              {[...Array(wonStarsCount)].map((_, i) => (
                <span key={i} className="material-symbols-outlined text-4xl animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>
                  star
                </span>
              ))}
            </div>

            <button
              onClick={onClose}
              className="w-full py-3.5 rounded-2xl bg-[#059669] hover:bg-[#047857] text-white font-black text-sm shadow-lg transition-transform hover:scale-102 cursor-pointer flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">check_circle</span>
              <span>{lang === 'ar' ? 'متابعة الألعاب' : 'Continuer à jouer'}</span>
            </button>
          </div>
        ) : game.type === 'memory' ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-bold text-slate-600 bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
              <span>{lang === 'ar' ? `المحاولات: ${moves}` : `Coups : ${moves}`}</span>
              <span className="text-emerald-700">
                {lang === 'ar'
                  ? `المتطابقة: ${cards.filter((c) => c.isMatched).length / 2} / 4`
                  : `Trouvés : ${cards.filter((c) => c.isMatched).length / 2} / 4`}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-3">
              {cards.map((card) => (
                <button
                  key={card.uniqueId}
                  type="button"
                  onClick={() => handleCardClick(card)}
                  className={`h-24 sm:h-28 rounded-2xl font-black text-xs transition-all duration-300 flex flex-col items-center justify-center p-2 text-center shadow-sm cursor-pointer border-2 ${
                    card.isFlipped || card.isMatched
                      ? 'bg-gradient-to-tr from-[#EEF2FF] to-[#E0D7FF] text-[#4221b6] border-[#4221b6] scale-102'
                      : 'bg-gradient-to-br from-[#4221b6] to-[#5d35e0] text-white border-white/20 hover:scale-105'
                  }`}
                >
                  {card.isFlipped || card.isMatched ? (
                    <span className="text-xs font-black leading-tight">
                      {lang === 'ar' ? card.nameAr : card.nameFr}
                    </span>
                  ) : (
                    <span className="text-2xl">❓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500">
              <span>
                {lang === 'ar'
                  ? `السؤال ${quizIdx + 1} من ${quizQuestions.length}`
                  : `Question ${quizIdx + 1} sur ${quizQuestions.length}`}
              </span>
              <span className="text-emerald-600">
                {lang === 'ar' ? `النقاط: ${quizScore}` : `Score : ${quizScore}`}
              </span>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
              <h4 className="text-base font-black text-[#1c0576]">
                {lang === 'ar' ? quizQuestions[quizIdx].qAr : quizQuestions[quizIdx].qFr}
              </h4>
            </div>

            <div className="flex flex-col gap-2.5">
              {quizQuestions[quizIdx].options.map((opt, optIdx) => {
                const isSelected = selectedOption === optIdx;
                const isCorrect = optIdx === quizQuestions[quizIdx].correct;
                return (
                  <button
                    key={optIdx}
                    type="button"
                    onClick={() => handleQuizAnswer(optIdx)}
                    disabled={selectedOption !== null}
                    className={`w-full py-3.5 px-4 rounded-2xl font-black text-xs sm:text-sm transition-all border-2 cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? isCorrect
                          ? 'bg-emerald-600 text-white border-emerald-600 scale-102 shadow-md'
                          : 'bg-red-600 text-white border-red-600 scale-102 shadow-md'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-[#4221b6] hover:bg-[#EEF2FF]'
                    }`}
                  >
                    <span>{opt}</span>
                    <span className="material-symbols-outlined text-sm">
                      {isSelected ? (isCorrect ? 'check' : 'close') : 'radio_button_unchecked'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
