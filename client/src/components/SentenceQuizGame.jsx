import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

// Web Audio API helper for sound effects
const playSoundEffect = (type) => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (type === 'correct') {
      const freqs = [523.25, 659.25, 783.99, 1046.5];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
        gain.gain.setValueAtTime(0.2, ctx.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.08);
        osc.stop(ctx.currentTime + idx * 0.08 + 0.3);
      });
    } else if (type === 'wrong') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.setValueAtTime(175, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } else if (type === 'click') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } else if (type === 'fanfare') {
      const notes = [
        { f: 523.25, t: 0, d: 0.12 },
        { f: 659.25, t: 0.12, d: 0.12 },
        { f: 783.99, t: 0.24, d: 0.12 },
        { f: 1046.5, t: 0.36, d: 0.4 },
      ];
      notes.forEach((n) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(n.f, ctx.currentTime + n.t);
        gain.gain.setValueAtTime(0.15, ctx.currentTime + n.t);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + n.t + n.d);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + n.t);
        osc.stop(ctx.currentTime + n.t + n.d);
      });
    }
  } catch (e) {
    // Audio fallback
  }
};

// Canvas Confetti Component
function ConfettiCanvas({ active }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const width = (canvas.width = canvas.parentElement.clientWidth);
    const height = (canvas.height = canvas.parentElement.clientHeight);

    const colors = ['#f43f5e', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#78fd7d'];
    const particles = Array.from({ length: 60 }).map(() => ({
      x: width * 0.5 + (Math.random() - 0.5) * 80,
      y: height * 0.4,
      vx: (Math.random() - 0.5) * 10,
      vy: (Math.random() - 1) * 12 - 2,
      size: Math.random() * 7 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      rSpeed: (Math.random() - 0.5) * 8,
      opacity: 1,
      shape: Math.random() > 0.4 ? 'circle' : 'rect',
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      let alive = 0;

      particles.forEach((p) => {
        if (p.opacity <= 0) return;
        alive++;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.32;
        p.vx *= 0.98;
        p.opacity -= 0.014;
        p.rotation += p.rSpeed;

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;

        if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        }

        ctx.restore();
      });

      if (alive > 0) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [active]);

  if (!active) return null;
  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-50 w-full h-full"
    />
  );
}

// Database of Sentence Quiz Questions
const DEFAULT_QUIZ_QUESTIONS = [
  {
    id: 1,
    category: 'Animaux',
    emoji: '🐱',
    referenceFr: 'Le chat dort sur le tapis.',
    incompleteFr: 'Le [ _____ ] dort sur le tapis.',
    arabicTranslation: 'القط ينام على السجادة.',
    options: ['chat', 'chien', 'poisson', 'oiseau'],
    correct: 'chat',
    hintFr: 'Un animal qui fait "Miaou" !',
    hintAr: 'حيوان يصدر صوت مواء!',
  },
  {
    id: 2,
    category: 'Actions',
    emoji: '🍎',
    referenceFr: 'La fille mange une pomme rouge.',
    incompleteFr: 'La fille [ _____ ] une pomme rouge.',
    arabicTranslation: 'البنت تأكل تفاحة حمراء.',
    options: ['mange', 'boit', 'dort', 'joue'],
    correct: 'mange',
    hintFr: 'Action d\'avaler de la nourriture.',
    hintAr: 'تتناول الطعام بالأكل!',
  },
  {
    id: 3,
    category: 'Nature',
    emoji: '☁️',
    referenceFr: 'L\'oiseau vole dans le ciel.',
    incompleteFr: 'L\'oiseau vole dans le [ _____ ].',
    arabicTranslation: 'العصفور يطير في السماء.',
    options: ['ciel', 'jardin', 'lit', 'stylo'],
    correct: 'ciel',
    hintFr: 'Là où brillent le soleil et les nuages.',
    hintAr: 'المكان الأزرق المرتفع حيث الغيوم!',
  },
  {
    id: 4,
    category: 'Sports',
    emoji: '⚽',
    referenceFr: 'Le garçon joue au football.',
    incompleteFr: 'Le garçon [ _____ ] au football.',
    arabicTranslation: 'الولد يلعب كرة القدم.',
    options: ['joue', 'lit', 'mange', 'dort'],
    correct: 'joue',
    hintFr: 'Pratiquer un jeu ou un sport.',
    hintAr: 'يمارس رياضة أو لعبة ممتعة!',
  },
  {
    id: 5,
    category: 'École',
    emoji: '✏️',
    referenceFr: 'L\'élève écrit la leçon avec un stylo.',
    incompleteFr: 'L\'élève [ _____ ] la leçon avec un stylo.',
    arabicTranslation: 'التلميذ يكتب الدرس بالقلم.',
    options: ['écrit', 'saute', 'chante', 'nage'],
    correct: 'écrit',
    hintFr: 'Tracer des mots sur un cahier.',
    hintAr: 'يرسم الحروف والكلمات على الكراس!',
  },
  {
    id: 6,
    category: 'Transports',
    emoji: '🚗',
    referenceFr: 'La voiture roule sur la route.',
    incompleteFr: 'La [ _____ ] roule sur la route.',
    arabicTranslation: 'السيارة تسير على الطريق.',
    options: ['voiture', 'maison', 'table', 'fleur'],
    correct: 'voiture',
    hintFr: 'Véhicule avec quatre roues.',
    hintAr: 'وسيلة نقل بأربع عجلات!',
  },
  {
    id: 7,
    category: 'Nature',
    emoji: '☀️',
    referenceFr: 'Le soleil brille dans le ciel bleu.',
    incompleteFr: 'Le soleil [ _____ ] dans le ciel bleu.',
    arabicTranslation: 'الشمس تشرق وتضيء في السماء الزرقاء.',
    options: ['brille', 'tombe', 'parle', 'danse'],
    correct: 'brille',
    hintFr: 'Émettre de la lumière éclatante.',
    hintAr: 'تنشر الضوء والدفء!',
  },
  {
    id: 8,
    category: 'Boisson',
    emoji: '🥛',
    referenceFr: 'Je bois un grand verre de lait.',
    incompleteFr: 'Je [ _____ ] un grand verre de lait.',
    arabicTranslation: 'أنا أشرب كأساً كبيراً من الحليب.',
    options: ['bois', 'mange', 'cours', 'regarde'],
    correct: 'bois',
    hintFr: 'Avaler un liquide.',
    hintAr: 'تناول السوائل كالمائ أو الحليب!',
  },
  {
    id: 9,
    category: 'École',
    emoji: '👩‍🏫',
    referenceFr: 'La maîtresse explique la leçon.',
    incompleteFr: 'La maîtresse [ _____ ] la leçon.',
    arabicTranslation: 'المعلمة تشرح الدرس.',
    options: ['explique', 'mange', 'dort', 'saute'],
    correct: 'explique',
    hintFr: 'Faire comprendre un sujet aux élèves.',
    hintAr: 'توضيح وفهم المعاني للطلاب!',
  },
  {
    id: 10,
    category: 'Animaux',
    emoji: '🥕',
    referenceFr: 'Le petit lapin mange une carotte.',
    incompleteFr: 'Le petit lapin mange une [ _____ ].',
    arabicTranslation: 'الأرنب الصغير يأكل جزرة.',
    options: ['carotte', 'banane', 'soupe', 'glace'],
    correct: 'carotte',
    hintFr: 'Légume orange adoré par les lapins.',
    hintAr: 'خضار برتقالي مفضل لدى الأرانب!',
  },
  {
    id: 11,
    category: 'Temps',
    emoji: '🌙',
    referenceFr: 'Les étoiles brillent pendant la nuit.',
    incompleteFr: 'Les étoiles brillent pendant la [ _____ ].',
    arabicTranslation: 'النجوم تلمع خلال الليل.',
    options: ['nuit', 'journée', 'table', 'porte'],
    correct: 'nuit',
    hintFr: 'Le moment où il fait sombre et qu\'on dort.',
    hintAr: 'الوقت المظلم الذي تظهر فيه القمر والنجوم!',
  },
  {
    id: 12,
    category: 'Animaux',
    emoji: '🦁',
    referenceFr: 'Le lion est le roi de la savane.',
    incompleteFr: 'Le [ _____ ] est le roi de la savane.',
    arabicTranslation: 'الأسد هو ملك الغابة والسهول.',
    options: ['lion', 'singe', 'chat', 'canard'],
    correct: 'lion',
    hintFr: 'Le grand félin appelé le roi des animaux.',
    hintAr: 'الحيوان المفترس القوي ملك الغابة!',
  },
];

export default function SentenceQuizGame({ lang = 'ar', isRtl = true, onClose, onWinStars }) {
  const { user } = useAuth();
  
  // Check if role contains 'admin'
  const isAdmin = (() => {
    if (!user) return false;
    if (user.isAdmin === true) return true;
    const r = user.role || user.roles;
    if (!r) return false;
    if (typeof r === 'string') return r.toLowerCase().includes('admin');
    if (Array.isArray(r)) return r.some((item) => String(item).toLowerCase().includes('admin'));
    return false;
  })();

  const [questionsList, setQuestionsList] = useState(() => {
    try {
      const saved = localStorage.getItem('custom_quiz_questions');
      return saved ? JSON.parse(saved) : DEFAULT_QUIZ_QUESTIONS;
    } catch {
      return DEFAULT_QUIZ_QUESTIONS;
    }
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [selectedWord, setSelectedWord] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [floatingScore, setFloatingScore] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isGameFinished, setIsGameFinished] = useState(false);
  const [confettiActive, setConfettiActive] = useState(false);

  // Admin Question Edit, Add & Delete Confirmation State
  const [isEditingQuestion, setIsEditingQuestion] = useState(false);
  const [editFormData, setEditFormData] = useState(null);

  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [addFormData, setAddFormData] = useState({
    incompleteFr: 'Le [ _____ ] vole dans le ciel.',
    referenceFr: 'Le papillon vole dans le ciel.',
    arabicTranslation: 'الفراشة تطير في السماء.',
    options: ['papillon', 'chat', 'poisson', 'chien'],
    correct: 'papillon',
    category: 'Nature',
    emoji: '🦋',
  });

  const currentQ = questionsList[currentIndex] || DEFAULT_QUIZ_QUESTIONS[0];

  // Speech Synthesis Pronunciation
  const speakSentence = (text) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fr-FR';
    utterance.rate = 0.88;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    setSelectedWord(null);
    setIsCorrect(null);
    setShowCelebration(false);
    setShowHint(false);
  }, [currentIndex]);

  const handleOptionClick = (option) => {
    if (selectedWord !== null || isGameFinished) return;

    setSelectedWord(option);
    const correct = option === currentQ.correct;
    setIsCorrect(correct);

    if (correct) {
      playSoundEffect('correct');
      const newScore = score + 1;
      const newCombo = combo + 1;
      setScore(newScore);
      setCombo(newCombo);

      setFloatingScore({ text: '+1', type: 'plus', id: Date.now() });
      setConfettiActive(true);
      setShowCelebration(true);

      if (newCombo % 3 === 0) {
        setTimeout(() => playSoundEffect('fanfare'), 150);
      }

      setTimeout(() => {
        setConfettiActive(false);
        if (currentIndex + 1 < questionsList.length) {
          setCurrentIndex((prev) => prev + 1);
        } else {
          setIsGameFinished(true);
          playSoundEffect('fanfare');
          if (onWinStars) {
            const starsWon = Math.min(5, Math.max(2, Math.floor(newScore / 3)));
            onWinStars(starsWon);
          }
        }
      }, 1500);
    } else {
      playSoundEffect('wrong');
      const newScore = Math.max(0, score - 1);
      setScore(newScore);
      setCombo(0);

      setFloatingScore({ text: '-1', type: 'minus', id: Date.now() });

      setTimeout(() => {
        setSelectedWord(null);
        setIsCorrect(null);
      }, 900);
    }
  };

  const handleRestart = () => {
    playSoundEffect('click');
    setCurrentIndex(0);
    setScore(0);
    setCombo(0);
    setSelectedWord(null);
    setIsCorrect(null);
    setIsGameFinished(false);
    setShowCelebration(false);
    setConfettiActive(false);
  };

  // Admin Question Edit Handlers
  const handleOpenEditQuestion = () => {
    setEditFormData({
      incompleteFr: currentQ.incompleteFr,
      referenceFr: currentQ.referenceFr || '',
      arabicTranslation: currentQ.arabicTranslation || '',
      options: [...currentQ.options],
      correct: currentQ.correct,
    });
    setIsEditingQuestion(true);
  };

  const handleSaveEditedQuestion = (e) => {
    e.preventDefault();
    const updatedQuestions = questionsList.map((q, idx) => {
      if (idx === currentIndex) {
        return {
          ...q,
          incompleteFr: editFormData.incompleteFr,
          referenceFr: editFormData.referenceFr,
          arabicTranslation: editFormData.arabicTranslation,
          options: editFormData.options,
          correct: editFormData.correct,
        };
      }
      return q;
    });

    setQuestionsList(updatedQuestions);
    try {
      localStorage.setItem('custom_quiz_questions', JSON.stringify(updatedQuestions));
    } catch {}

    setIsEditingQuestion(false);
    setSelectedWord(null);
    setIsCorrect(null);
    playSoundEffect('click');
  };

  // Admin Add Question Handler
  const handleSaveNewQuestion = (e) => {
    e.preventDefault();
    const newQuestion = {
      id: Date.now(),
      category: addFormData.category || 'Nouveau',
      emoji: addFormData.emoji || '⭐',
      incompleteFr: addFormData.incompleteFr,
      referenceFr: addFormData.referenceFr,
      arabicTranslation: addFormData.arabicTranslation,
      options: addFormData.options,
      correct: addFormData.correct,
    };

    const updated = [...questionsList, newQuestion];
    setQuestionsList(updated);
    try {
      localStorage.setItem('custom_quiz_questions', JSON.stringify(updated));
    } catch {}

    setIsAddingQuestion(false);
    setCurrentIndex(updated.length - 1);
    setSelectedWord(null);
    setIsCorrect(null);
    playSoundEffect('fanfare');
  };

  // Admin Confirm Delete Handler
  const handleConfirmDeleteQuestion = () => {
    if (questionsList.length <= 1) return;

    const updated = questionsList.filter((_, idx) => idx !== currentIndex);
    setQuestionsList(updated);
    try {
      localStorage.setItem('custom_quiz_questions', JSON.stringify(updated));
    } catch {}

    setCurrentIndex((prev) => Math.max(0, prev - 1));
    setSelectedWord(null);
    setIsCorrect(null);
    playSoundEffect('click');
  };

  const renderSentenceWithBlank = () => {
    const parts = currentQ.incompleteFr.split('[ _____ ]');
    return (
      <div className="flex flex-wrap items-center justify-center gap-1.5 text-lg sm:text-xl font-black text-slate-800 tracking-wide text-center leading-relaxed">
        <span>{parts[0]}</span>
        <span
          className={`inline-flex items-center justify-center min-w-[85px] sm:min-w-[105px] px-3 py-1 rounded-xl border-2 font-black transition-all duration-300 transform shadow-sm ${
            selectedWord === null
              ? 'bg-amber-100/90 border-dashed border-amber-400 text-amber-700 animate-pulse'
              : isCorrect
              ? 'bg-emerald-500 text-white border-emerald-600 scale-105 shadow-emerald-200 ring-2 ring-emerald-300'
              : 'bg-rose-500 text-white border-rose-600 animate-shake shadow-rose-200'
          }`}
        >
          {selectedWord !== null ? selectedWord : '...'}
        </span>
        <span>{parts[1] || ''}</span>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-slate-950/75 backdrop-blur-md p-3 sm:p-4 flex items-center justify-center overflow-y-auto">
      <ConfettiCanvas active={confettiActive} />

      {/* Main Game Card */}
      <div
        className="bg-white rounded-3xl max-w-[480px] w-full p-4 sm:p-5 flex flex-col gap-3.5 shadow-2xl border-2 border-[#4221b6]/25 relative overflow-hidden my-auto animate-in zoom-in-95 duration-200"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>

        {/* Compact Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 relative z-10">
          <div className="flex items-center gap-2.5">
            <span className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#4221b6] to-[#5d35e0] text-white flex items-center justify-center text-xl shadow-md shadow-indigo-200 shrink-0">
              🎯
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="font-black text-base text-[#1c0576]">
                  {lang === 'ar' ? 'تحدي الكلمة الناقصة' : 'Le Mot Manquant'}
                </h2>
              </div>
              <p className="text-[11px] text-slate-400 font-bold">
                {lang === 'ar'
                  ? `السؤال ${currentIndex + 1} من ${questionsList.length}`
                  : `Question ${currentIndex + 1} sur ${questionsList.length}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Score Pill */}
            <div className="relative bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 font-black px-3 py-1 rounded-xl shadow-sm flex items-center gap-1 border border-amber-300 text-sm">
              <span className="material-symbols-outlined text-base text-yellow-100">star</span>
              <span>{score}</span>
              <span className="text-[11px] font-bold opacity-90">{lang === 'ar' ? 'نقطة' : 'pts'}</span>

              {floatingScore && (
                <span
                  key={floatingScore.id}
                  className={`absolute -top-5 right-1 font-black text-xs px-1.5 py-0.5 rounded-full shadow animate-bounce ${
                    floatingScore.type === 'plus'
                      ? 'bg-emerald-500 text-white ring-2 ring-emerald-300'
                      : 'bg-rose-600 text-white ring-2 ring-rose-300'
                  }`}
                >
                  {floatingScore.text}
                </span>
              )}
            </div>

            {/* Close Button */}
            <button
              onClick={() => {
                playSoundEffect('click');
                onClose();
              }}
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-600 flex items-center justify-center transition cursor-pointer border border-slate-200 shrink-0"
              title={lang === 'ar' ? 'إغلاق اللعبة' : 'Fermer'}
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5 relative z-10">
          <div className="flex items-center justify-between text-[11px] font-black">
            <span className="text-[#4221b6] flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">bolt</span>
              <span>{lang === 'ar' ? `السؤال ${currentIndex + 1} من ${questionsList.length}` : `Question ${currentIndex + 1}/${questionsList.length}`}</span>
            </span>
            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shadow-2xs font-extrabold">
              {Math.round(((currentIndex + 1) / questionsList.length) * 100)}%
            </span>
          </div>

          <div className="w-full h-3.5 bg-slate-100/90 rounded-full p-0.5 border border-slate-200 shadow-inner relative">
            <div
              className="h-full bg-gradient-to-r from-[#4221b6] via-indigo-500 to-[#10b981] rounded-full transition-all duration-500 shadow-sm relative striped-progress"
              style={{ width: `${((currentIndex + 1) / questionsList.length) * 100}%` }}
            >
              <span className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white shadow-md border-2 border-[#4221b6] flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
              </span>
            </div>
          </div>
        </div>

        {/* QUESTION CONTENT */}
        {!isGameFinished ? (
          <div className="space-y-3.5 relative z-10">
            {/* Incomplete Sentence Slot */}
            <div className="bg-slate-50 border border-indigo-100 rounded-2xl p-4 sm:p-5 text-center shadow-inner space-y-3 relative">
              <div className="flex items-center justify-between gap-2 border-b border-indigo-100/60 pb-2">
                <span className="text-[11px] font-black text-indigo-600 uppercase tracking-wider flex items-center gap-1">
                  <span>{currentQ.emoji}</span>
                  <span>{lang === 'ar' ? 'اختر الكلمة المناسبة لإكمال الجملة:' : 'Choisis le mot manquant :'}</span>
                </span>

                <div className="flex items-center gap-1">
                  {/* ADMIN ADD & EDIT & DELETE CONTROLS */}
                  {isAdmin && (
                    <>
                      <button
                        type="button"
                        onClick={() => setIsAddingQuestion(true)}
                        className="px-2 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] flex items-center gap-0.5 shadow-sm transition cursor-pointer"
                        title="إضافة سؤال جديد (مسؤول)"
                      >
                        <span className="material-symbols-outlined text-xs">add_circle</span>
                        <span>إضافة</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleOpenEditQuestion}
                        className="px-2 py-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-[11px] flex items-center gap-0.5 shadow-sm transition cursor-pointer"
                        title="تعديل السؤال والإجابات (مسؤول)"
                      >
                        <span className="material-symbols-outlined text-xs">edit</span>
                        <span>تعديل</span>
                      </button>

                      {questionsList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setShowDeleteConfirm(true)}
                          className="w-7 h-7 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-700 font-black text-xs flex items-center justify-center transition cursor-pointer"
                          title="حذف السؤال الحالي (مسؤول)"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      )}
                    </>
                  )}

                  {/* Audio Speaker Button */}
                  <button
                    type="button"
                    onClick={() => speakSentence(currentQ.referenceFr || currentQ.incompleteFr.replace('[ _____ ]', currentQ.correct))}
                    className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-sm border ${
                      isSpeaking
                        ? 'bg-amber-400 text-slate-900 border-amber-300 scale-110 animate-bounce'
                        : 'bg-white hover:bg-indigo-50 text-indigo-600 border-slate-200'
                    }`}
                    title={lang === 'ar' ? 'استمع لنطق الجملة بالفرنسية' : 'Écouter la prononciation'}
                  >
                    <span className="material-symbols-outlined text-sm">
                      {isSpeaking ? 'volume_up' : 'campaign'}
                    </span>
                  </button>
                </div>
              </div>

              {renderSentenceWithBlank()}

              <div className="pt-1 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    playSoundEffect('click');
                    setShowHint(!showHint);
                  }}
                  className="text-[11px] font-black text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 px-3 py-1 rounded-lg transition border border-amber-200 flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">lightbulb</span>
                  <span>{lang === 'ar' ? (showHint ? 'إخفاء التلميح' : 'تلميح؟') : (showHint ? 'Masquer l\'indice' : 'Besoin d\'un indice ?')}</span>
                </button>
              </div>

              {showHint && (
                <div className="p-2 rounded-xl bg-amber-100/90 text-amber-900 font-bold text-xs animate-in fade-in duration-200 border border-amber-300 max-w-xs mx-auto" dir="rtl">
                  💡 {lang === 'ar' ? currentQ.hintAr : currentQ.hintFr}
                </div>
              )}
            </div>

            {/* Word Options Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              {currentQ.options.map((option, idx) => {
                const isSelected = selectedWord === option;
                const isCorrectOption = option === currentQ.correct;

                let btnStyle = 'bg-white text-slate-800 border-slate-200 hover:border-[#4221b6] hover:bg-indigo-50/50 hover:shadow-md';

                if (isSelected) {
                  if (isCorrect) {
                    btnStyle = 'bg-emerald-500 text-white border-emerald-600 shadow-md scale-102 ring-2 ring-emerald-200';
                  } else {
                    btnStyle = 'bg-rose-500 text-white border-rose-600 shadow-md scale-102 ring-2 ring-rose-200 animate-shake';
                  }
                } else if (selectedWord !== null && isCorrectOption && isCorrect) {
                  btnStyle = 'bg-emerald-100 text-emerald-800 border-emerald-300 opacity-90';
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={selectedWord !== null}
                    onClick={() => handleOptionClick(option)}
                    className={`h-12 sm:h-13 rounded-xl border-2 font-extrabold text-sm sm:text-base transition-all duration-200 flex items-center justify-between px-3.5 shadow-sm cursor-pointer ${btnStyle}`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-600 font-black text-[11px] flex items-center justify-center border border-slate-200 shrink-0">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span>{option}</span>
                    </span>

                    <span className="material-symbols-outlined text-lg shrink-0">
                      {isSelected
                        ? isCorrect
                          ? 'check_circle'
                          : 'cancel'
                        : 'radio_button_unchecked'}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* CELEBRATION MODAL OVERLAY */}
            {showCelebration && (
              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm rounded-3xl flex items-center justify-center p-4 z-40 animate-in zoom-in-95 duration-200">
                <div className="bg-white rounded-2xl p-5 text-center max-w-xs w-full shadow-2xl border-2 border-emerald-400 space-y-3 relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-400 via-teal-400 to-indigo-500"></div>

                  <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-emerald-400 to-teal-300 flex items-center justify-center text-3xl shadow-lg animate-bounce">
                    🎉
                  </div>

                  <div className="space-y-0.5">
                    <h3 className="text-xl font-black text-emerald-600">
                      {lang === 'ar' ? 'ممتاز يا بطل! 🌟' : 'Bravo, c\'est exact ! 🌟'}
                    </h3>
                    <p className="text-xs font-bold text-slate-600">
                      {lang === 'ar'
                        ? 'إجابة صحيحة! حصلت على +1 نقطة'
                        : 'Bonne réponse ! Tu gagnes +1 point.'}
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-1.5 text-amber-400 text-xl font-black">
                    <span>★</span>
                    <span className="text-slate-800 text-base">+1 {lang === 'ar' ? 'نقطة' : 'pt'}</span>
                    <span>★</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* FINAL SUMMARY VIEW */
          <div className="text-center space-y-5 py-4 animate-in zoom-in duration-300 relative z-10">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-tr from-amber-400 via-orange-500 to-rose-500 flex items-center justify-center text-4xl shadow-xl animate-bounce border-2 border-white">
              🏆
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-black text-[#1c0576]">
                {lang === 'ar' ? '🎉 إنجاز رائع! أكملت التحدي!' : '🎉 Félicitations ! Quiz Terminé !'}
              </h2>
              <p className="text-xs text-slate-600 font-bold max-w-xs mx-auto">
                {lang === 'ar'
                  ? `لقد جمعت ${score} نقطة من أصل ${questionsList.length} في لعبة الكلمة الناقصة!`
                  : `Tu as obtenu ${score} points sur ${questionsList.length} au quiz du mot manquant !`}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <div className="p-2 bg-white rounded-xl border border-slate-100 text-center space-y-0.5">
                <span className="text-[10px] font-bold text-slate-400 block">{lang === 'ar' ? 'النقاط' : 'Score'}</span>
                <span className="text-base font-black text-indigo-600">{score}</span>
              </div>
              <div className="p-2 bg-white rounded-xl border border-slate-100 text-center space-y-0.5">
                <span className="text-[10px] font-bold text-slate-400 block">{lang === 'ar' ? 'الأسئلة' : 'Questions'}</span>
                <span className="text-base font-black text-slate-800">{questionsList.length}</span>
              </div>
              <div className="p-2 bg-white rounded-xl border border-slate-100 text-center space-y-0.5">
                <span className="text-[10px] font-bold text-slate-400 block">{lang === 'ar' ? 'التقييم' : 'Note'}</span>
                <span className="text-base font-black text-amber-500">
                  {score >= 10 ? '⭐⭐⭐' : score >= 6 ? '⭐⭐' : '⭐'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2.5 pt-1 max-w-xs mx-auto">
              <button
                type="button"
                onClick={handleRestart}
                className="w-1/2 py-2.5 rounded-xl bg-gradient-to-r from-[#4221b6] to-[#5d35e0] text-white font-black text-xs shadow-md hover:scale-102 transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">replay</span>
                <span>{lang === 'ar' ? 'إعادة اللعب' : 'Rejouer'}</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-1/2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md hover:scale-102 transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">check_circle</span>
                <span>{lang === 'ar' ? 'متابعة' : 'Continuer'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ADMIN EDIT QUESTION MODAL */}
      {isEditingQuestion && editFormData && (
        <div className="fixed inset-0 z-[100000] bg-black/80 backdrop-blur-md p-4 flex items-center justify-center overflow-y-auto">
          <form
            onSubmit={handleSaveEditedQuestion}
            className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border-4 border-amber-400 animate-in zoom-in-95 duration-200"
            dir={isRtl ? 'rtl' : 'ltr'}
          >
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <div className="flex items-center gap-2 text-amber-600 font-black text-base">
                <span className="material-symbols-outlined">edit_note</span>
                <span>تعديل السؤال رقم {currentIndex + 1} (لوحة المسؤول)</span>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingQuestion(false)}
                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-black text-slate-700 block">
                نص الجملة الناقصة (استخدم <code className="bg-amber-100 px-1 rounded text-amber-800">[ _____ ]</code> لمكان الفراغ):
              </label>
              <input
                type="text"
                value={editFormData.incompleteFr}
                onChange={(e) => setEditFormData({ ...editFormData, incompleteFr: e.target.value })}
                className="w-full px-3 py-2 text-sm font-bold border-2 border-slate-200 rounded-xl focus:border-amber-500 outline-none bg-slate-50"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-black text-slate-700 block">الجملة الفرنسية الكاملة للصوت:</label>
              <input
                type="text"
                value={editFormData.referenceFr}
                onChange={(e) => setEditFormData({ ...editFormData, referenceFr: e.target.value })}
                className="w-full px-3 py-2 text-sm font-bold border-2 border-slate-200 rounded-xl focus:border-amber-500 outline-none bg-slate-50"
              />
            </div>

            <div className="space-y-2 pt-1">
              <label className="text-xs font-black text-slate-700 block">
                الخيارات الأربعة (حدد الإجابة الصحيحة بالضغط على الخيار):
              </label>
              <div className="grid grid-cols-2 gap-2">
                {editFormData.options.map((opt, optIdx) => {
                  const isSelectedCorrect = editFormData.correct === opt;
                  return (
                    <div
                      key={optIdx}
                      className={`p-2.5 rounded-xl border-2 transition flex items-center gap-2 ${
                        isSelectedCorrect
                          ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-300'
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setEditFormData({ ...editFormData, correct: opt })}
                        className={`w-6 h-6 rounded-full font-black text-xs flex items-center justify-center shrink-0 border ${
                          isSelectedCorrect
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-slate-100 text-slate-500 border-slate-300 hover:bg-emerald-100'
                        }`}
                        title="انقر لتحديدها كإجابة صحيحة"
                      >
                        {isSelectedCorrect ? '✓' : String.fromCharCode(65 + optIdx)}
                      </button>

                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const newOpts = [...editFormData.options];
                          const oldVal = newOpts[optIdx];
                          newOpts[optIdx] = e.target.value;
                          const newCorrect = editFormData.correct === oldVal ? e.target.value : editFormData.correct;
                          setEditFormData({ ...editFormData, options: newOpts, correct: newCorrect });
                        }}
                        className="w-full text-xs font-bold bg-transparent outline-none border-b border-transparent focus:border-amber-400"
                        placeholder={`الخيار ${optIdx + 1}`}
                        required
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsEditingQuestion(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs hover:bg-slate-200"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs shadow-md transition"
              >
                حفظ التعديلات ✓
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ADMIN ADD NEW QUESTION MODAL */}
      {isAddingQuestion && (
        <div className="fixed inset-0 z-[100000] bg-black/80 backdrop-blur-md p-4 flex items-center justify-center overflow-y-auto">
          <form
            onSubmit={handleSaveNewQuestion}
            className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border-4 border-emerald-500 animate-in zoom-in-95 duration-200"
            dir={isRtl ? 'rtl' : 'ltr'}
          >
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <div className="flex items-center gap-2 text-emerald-600 font-black text-base">
                <span className="material-symbols-outlined">add_circle</span>
                <span>إضافة مهمة / سؤال جديد (لوحة المسؤول)</span>
              </div>
              <button
                type="button"
                onClick={() => setIsAddingQuestion(false)}
                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-black text-slate-700 block">
                نص الجملة الناقصة (استخدم <code className="bg-emerald-100 px-1 rounded text-emerald-800">[ _____ ]</code> لمكان الفراغ):
              </label>
              <input
                type="text"
                value={addFormData.incompleteFr}
                onChange={(e) => setAddFormData({ ...addFormData, incompleteFr: e.target.value })}
                className="w-full px-3 py-2 text-sm font-bold border-2 border-slate-200 rounded-xl focus:border-emerald-500 outline-none bg-slate-50"
                placeholder="مثال: Le [ _____ ] vole dans le ciel."
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-black text-slate-700 block">الجملة الفرنسية الكاملة للصوت:</label>
              <input
                type="text"
                value={addFormData.referenceFr}
                onChange={(e) => setAddFormData({ ...addFormData, referenceFr: e.target.value })}
                className="w-full px-3 py-2 text-sm font-bold border-2 border-slate-200 rounded-xl focus:border-emerald-500 outline-none bg-slate-50"
                placeholder="مثال: Le papillon vole dans le ciel."
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-black text-slate-700 block">الترجمة التوضيحية بالعربية:</label>
              <input
                type="text"
                value={addFormData.arabicTranslation}
                onChange={(e) => setAddFormData({ ...addFormData, arabicTranslation: e.target.value })}
                className="w-full px-3 py-2 text-xs font-bold border-2 border-slate-200 rounded-xl focus:border-emerald-500 outline-none bg-slate-50"
                placeholder="مثال: الفراشة تطير في السماء."
              />
            </div>

            <div className="space-y-2 pt-1">
              <label className="text-xs font-black text-slate-700 block">
                الخيارات الأربعة (حدد الإجابة الصحيحة بالنقر على الزر الدائري):
              </label>
              <div className="grid grid-cols-2 gap-2">
                {addFormData.options.map((opt, optIdx) => {
                  const isSelectedCorrect = addFormData.correct === opt;
                  return (
                    <div
                      key={optIdx}
                      className={`p-2.5 rounded-xl border-2 transition flex items-center gap-2 ${
                        isSelectedCorrect
                          ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-300'
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setAddFormData({ ...addFormData, correct: opt })}
                        className={`w-6 h-6 rounded-full font-black text-xs flex items-center justify-center shrink-0 border ${
                          isSelectedCorrect
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-slate-100 text-slate-500 border-slate-300 hover:bg-emerald-100'
                        }`}
                        title="انقر لتحديدها كإجابة صحيحة"
                      >
                        {isSelectedCorrect ? '✓' : String.fromCharCode(65 + optIdx)}
                      </button>

                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const newOpts = [...addFormData.options];
                          const oldVal = newOpts[optIdx];
                          newOpts[optIdx] = e.target.value;
                          const newCorrect = addFormData.correct === oldVal ? e.target.value : addFormData.correct;
                          setAddFormData({ ...addFormData, options: newOpts, correct: newCorrect });
                        }}
                        className="w-full text-xs font-bold bg-transparent outline-none border-b border-transparent focus:border-emerald-400"
                        placeholder={`الخيار ${optIdx + 1}`}
                        required
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddingQuestion(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs hover:bg-slate-200"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition"
              >
                إضافة السؤال الجديد ✓
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CUSTOM PROFESSIONAL DELETE CONFIRMATION MODAL */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100001] bg-slate-950/80 backdrop-blur-md p-4 flex items-center justify-center animate-in zoom-in-95 duration-200">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border-4 border-rose-500 space-y-4 relative overflow-hidden" dir={isRtl ? 'rtl' : 'ltr'}>
            <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center text-3xl shadow-sm border border-rose-200 animate-bounce">
              🗑️
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-slate-800">
                {lang === 'ar' ? 'تأكيد حذف السؤال ⚠️' : 'Confirmation de suppression ⚠️'}
              </h3>
              <p className="text-xs text-slate-500 font-bold leading-relaxed">
                {lang === 'ar'
                  ? 'هل أنت متاكد من اختيارك لحذف هذا السؤال من اللعبة؟ لا يمكن التراجع عن هذه الخطوة.'
                  : 'Es-tu sûr de vouloir supprimer cette question ? Cette action est irréversible.'}
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="w-1/2 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs transition cursor-pointer border border-slate-200"
              >
                {lang === 'ar' ? 'إلغاء' : 'Annuler'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  handleConfirmDeleteQuestion();
                }}
                className="w-1/2 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-black text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">delete</span>
                <span>{lang === 'ar' ? 'نعم، تأكيد الحذف' : 'Oui, Supprimer'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
