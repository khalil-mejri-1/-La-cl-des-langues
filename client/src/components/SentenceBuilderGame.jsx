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
    const particles = Array.from({ length: 65 }).map(() => ({
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

// Database of Default Sentence Builder Questions
const DEFAULT_BUILDER_QUESTIONS = [
  {
    id: 1,
    category: 'Animaux',
    img: 'https://images.unsplash.com/photo-1535268647677-300dbf3d78d1?auto=format&fit=crop&q=80&w=400',
    correctSentence: 'Le chat dort sur le tapis.',
    arabicTranslation: 'القط ينام على السجادة.',
    words: ['Le', 'chat', 'dort', 'sur', 'le', 'tapis.'],
  },
  {
    id: 2,
    category: 'Actions',
    img: 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?auto=format&fit=crop&q=80&w=400',
    correctSentence: 'La fille mange une pomme rouge.',
    arabicTranslation: 'البنت تأكل تفاحة حمراء.',
    words: ['La', 'fille', 'mange', 'une', 'pomme', 'rouge.'],
  },
  {
    id: 3,
    category: 'Nature',
    img: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=400',
    correctSentence: "L'oiseau vole dans le ciel.",
    arabicTranslation: 'العصفور يطير في السماء.',
    words: ["L'oiseau", 'vole', 'dans', 'le', 'ciel.'],
  },
  {
    id: 4,
    category: 'Sports',
    img: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&q=80&w=400',
    correctSentence: 'Le garçon joue au football.',
    arabicTranslation: 'الولد يلعب كرة القدم.',
    words: ['Le', 'garçon', 'joue', 'au', 'football.'],
  },
  {
    id: 5,
    category: 'École',
    img: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&q=80&w=400',
    correctSentence: "L'élève lit un grand livre.",
    arabicTranslation: 'التلميذ يقرأ كتاباً كبيراً.',
    words: ["L'élève", 'lit', 'un', 'grand', 'livre.'],
  },
];

export default function SentenceBuilderGame({ lang = 'ar', isRtl = true, onClose, onWinStars }) {
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
      const saved = localStorage.getItem('custom_builder_questions');
      return saved ? JSON.parse(saved) : DEFAULT_BUILDER_QUESTIONS;
    } catch {
      return DEFAULT_BUILDER_QUESTIONS;
    }
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);

  const currentQ = questionsList[currentIndex] || DEFAULT_BUILDER_QUESTIONS[0];

  const [availableWords, setAvailableWords] = useState([]);
  const [selectedWords, setSelectedWords] = useState([]);
  const [isCorrect, setIsCorrect] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [floatingScore, setFloatingScore] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isGameFinished, setIsGameFinished] = useState(false);
  const [confettiActive, setConfettiActive] = useState(false);

  // Admin Question Edit, Add & Delete Confirmation State
  const [isEditingQuestion, setIsEditingQuestion] = useState(false);
  const [editFormData, setEditFormData] = useState(null);

  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [addFormData, setAddFormData] = useState({
    img: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=400',
    correctSentence: "Le poisson nage dans l'eau.",
    arabicTranslation: 'السمكة تسبح في الماء.',
    wordsString: "Le poisson nage dans l'eau.",
    category: 'Animaux',
  });

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

  // Prepare and shuffle words on question change
  useEffect(() => {
    if (!currentQ) return;
    setSelectedWords([]);
    setIsCorrect(null);
    setShowCelebration(false);

    const wordsArr = currentQ.words || currentQ.correctSentence.split(' ');
    const shuffled = [...wordsArr]
      .map((w, i) => ({ id: `${i}-${w}-${Math.random()}`, text: w }))
      .sort(() => Math.random() - 0.5);

    setAvailableWords(shuffled);
  }, [currentIndex, questionsList]);

  // Click an available word tile -> Add to selectedWords
  const handleSelectWord = (wordObj) => {
    if (isCorrect === true || isGameFinished) return;
    playSoundEffect('click');
    setAvailableWords((prev) => prev.filter((w) => w.id !== wordObj.id));
    setSelectedWords((prev) => [...prev, wordObj]);
    setIsCorrect(null);
  };

  // Click a selected word tile in drop zone -> Return to availableWords
  const handleDeselectWord = (wordObj) => {
    if (isCorrect === true || isGameFinished) return;
    playSoundEffect('click');
    setSelectedWords((prev) => prev.filter((w) => w.id !== wordObj.id));
    setAvailableWords((prev) => [...prev, wordObj]);
    setIsCorrect(null);
  };

  // Reset selected words
  const handleResetSentence = () => {
    playSoundEffect('click');
    if (!currentQ) return;
    const wordsArr = currentQ.words || currentQ.correctSentence.split(' ');
    const shuffled = [...wordsArr]
      .map((w, i) => ({ id: `${i}-${w}-${Math.random()}`, text: w }))
      .sort(() => Math.random() - 0.5);

    setAvailableWords(shuffled);
    setSelectedWords([]);
    setIsCorrect(null);
  };

  // Check sentence answer
  const handleCheckSentence = () => {
    if (selectedWords.length === 0 || isGameFinished) return;

    const userSentence = selectedWords.map((w) => w.text).join(' ').trim();
    const targetSentence = currentQ.correctSentence.trim();

    const cleanUser = userSentence.replace(/\.$/, '').toLowerCase();
    const cleanTarget = targetSentence.replace(/\.$/, '').toLowerCase();

    if (cleanUser === cleanTarget) {
      playSoundEffect('correct');
      setIsCorrect(true);
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
            const starsWon = Math.min(5, Math.max(2, Math.floor(newScore / 2)));
            onWinStars(starsWon);
          }
        }
      }, 1500);
    } else {
      playSoundEffect('wrong');
      setIsCorrect(false);
      const newScore = Math.max(0, score - 1);
      setScore(newScore);
      setCombo(0);

      setFloatingScore({ text: '-1', type: 'minus', id: Date.now() });

      setTimeout(() => {
        setIsCorrect(null);
      }, 900);
    }
  };

  // Restart Game
  const handleRestart = () => {
    playSoundEffect('click');
    setCurrentIndex(0);
    setScore(0);
    setCombo(0);
    setSelectedWords([]);
    setIsCorrect(null);
    setIsGameFinished(false);
    setShowCelebration(false);
    setConfettiActive(false);
  };

  // Admin Question Edit Handlers
  const handleOpenEditQuestion = () => {
    setEditFormData({
      img: currentQ.img || '',
      correctSentence: currentQ.correctSentence,
      arabicTranslation: currentQ.arabicTranslation || '',
      wordsString: (currentQ.words || currentQ.correctSentence.split(' ')).join(' '),
    });
    setIsEditingQuestion(true);
  };

  const handleSaveEditedQuestion = (e) => {
    e.preventDefault();
    const updatedWords = editFormData.wordsString
      .split(' ')
      .map((w) => w.trim())
      .filter(Boolean);

    const updatedQuestions = questionsList.map((q, idx) => {
      if (idx === currentIndex) {
        return {
          ...q,
          img: editFormData.img,
          correctSentence: editFormData.correctSentence,
          arabicTranslation: editFormData.arabicTranslation,
          words: updatedWords,
        };
      }
      return q;
    });

    setQuestionsList(updatedQuestions);
    try {
      localStorage.setItem('custom_builder_questions', JSON.stringify(updatedQuestions));
    } catch {}

    setIsEditingQuestion(false);
    setIsCorrect(null);
    playSoundEffect('click');
  };

  // Admin Add Question Handler
  const handleSaveNewQuestion = (e) => {
    e.preventDefault();
    const wordsArr = addFormData.wordsString
      .split(' ')
      .map((w) => w.trim())
      .filter(Boolean);

    const newQuestion = {
      id: Date.now(),
      category: addFormData.category || 'Nouveau',
      img: addFormData.img,
      correctSentence: addFormData.correctSentence,
      arabicTranslation: addFormData.arabicTranslation,
      words: wordsArr,
    };

    const updated = [...questionsList, newQuestion];
    setQuestionsList(updated);
    try {
      localStorage.setItem('custom_builder_questions', JSON.stringify(updated));
    } catch {}

    setIsAddingQuestion(false);
    setCurrentIndex(updated.length - 1);
    setSelectedWords([]);
    setIsCorrect(null);
    playSoundEffect('fanfare');
  };

  // Admin Confirm Delete Handler
  const handleConfirmDeleteQuestion = () => {
    if (questionsList.length <= 1) return;

    const updated = questionsList.filter((_, idx) => idx !== currentIndex);
    setQuestionsList(updated);
    try {
      localStorage.setItem('custom_builder_questions', JSON.stringify(updated));
    } catch {}

    setCurrentIndex((prev) => Math.max(0, prev - 1));
    setSelectedWords([]);
    setIsCorrect(null);
    playSoundEffect('click');
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

        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 relative z-10">
          <div className="flex items-center gap-2.5">
            <span className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#4221b6] to-[#5d35e0] text-white flex items-center justify-center text-xl shadow-md shadow-indigo-200 shrink-0">
              🧩
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="font-black text-base text-[#1c0576]">
                  {lang === 'ar' ? 'تحدي تركيب الجمل' : 'Le Constructeur de Phrases'}
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

        {/* GAME PLAY VIEW */}
        {!isGameFinished ? (
          <div className="space-y-3.5 relative z-10">
            {/* Contextual Image & Admin Controls Header */}
            <div className="relative rounded-2xl overflow-hidden border-2 border-indigo-100 shadow-md h-40 bg-slate-100 group">
              <img
                src={currentQ.img}
                alt="Illustration"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

              <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white">
                <p className="text-xs font-bold text-white/90 drop-shadow" dir="rtl">
                  💡 {currentQ.arabicTranslation}
                </p>

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
                        className="px-2 py-1 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-900 font-black text-[11px] flex items-center gap-0.5 shadow-sm transition cursor-pointer"
                        title="تعديل السؤال والصورة (مسؤول)"
                      >
                        <span className="material-symbols-outlined text-xs">edit</span>
                        <span>تعديل</span>
                      </button>

                      {questionsList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setShowDeleteConfirm(true)}
                          className="w-7 h-7 rounded-xl bg-rose-500/80 hover:bg-rose-600 text-white font-black text-xs flex items-center justify-center transition cursor-pointer backdrop-blur-sm"
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
                    onClick={() => speakSentence(currentQ.correctSentence)}
                    className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-md border ${
                      isSpeaking
                        ? 'bg-amber-400 text-slate-900 border-amber-300 scale-110 animate-bounce'
                        : 'bg-white/20 hover:bg-white/30 text-white border-white/30'
                    }`}
                    title={lang === 'ar' ? 'استمع لنطق الجملة الصحيحة' : 'Écouter la phrase'}
                  >
                    <span className="material-symbols-outlined text-sm">
                      {isSpeaking ? 'volume_up' : 'campaign'}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Target Sentence Assembly Drop Zone */}
            <div
              className={`bg-slate-50 border-2 rounded-2xl p-3 sm:p-4 text-center min-h-[72px] flex flex-col justify-center gap-2 shadow-inner transition-all ${
                isCorrect === true
                  ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-200'
                  : isCorrect === false
                  ? 'border-rose-500 bg-rose-50/50 animate-shake ring-2 ring-rose-200'
                  : 'border-indigo-100'
              }`}
            >
              <div className="text-[10px] font-black text-indigo-500 uppercase tracking-wider">
                {lang === 'ar' ? '👇 الجملة المجمّعة (انقر على الكلمة لإزالتها):' : '👇 Phrase assemblée :'}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-1.5 min-h-[36px]">
                {selectedWords.length === 0 ? (
                  <span className="text-xs font-bold text-slate-400 italic">
                    {lang === 'ar' ? 'انقر على الكلمات بالأسفل لتركيب الجملة...' : 'Clique sur les mots ci-dessous...'}
                  </span>
                ) : (
                  selectedWords.map((wordObj) => (
                    <button
                      key={wordObj.id}
                      type="button"
                      onClick={() => handleDeselectWord(wordObj)}
                      className="px-3 py-1.5 rounded-xl bg-[#4221b6] text-white font-extrabold text-xs sm:text-sm shadow-md hover:bg-rose-600 transition duration-150 cursor-pointer animate-in zoom-in-90"
                    >
                      {wordObj.text}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Scrambled Words Pool */}
            <div className="space-y-2">
              <div className="text-[11px] font-black text-slate-600 uppercase tracking-wider text-center">
                {lang === 'ar' ? 'الكلمات المبعثرة:' : 'Mots disponibles :'}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 p-2 bg-indigo-50/50 rounded-2xl border border-indigo-100 min-h-[56px]">
                {availableWords.map((wordObj) => (
                  <button
                    key={wordObj.id}
                    type="button"
                    onClick={() => handleSelectWord(wordObj)}
                    className="px-3.5 py-2 rounded-xl bg-white text-slate-800 font-black text-xs sm:text-sm border-2 border-indigo-200 hover:border-[#4221b6] hover:bg-indigo-50 hover:scale-105 transition-all shadow-sm cursor-pointer"
                  >
                    {wordObj.text}
                  </button>
                ))}
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleResetSentence}
                disabled={selectedWords.length === 0}
                className="w-1/3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 font-black text-xs transition cursor-pointer flex items-center justify-center gap-1 border border-slate-200"
              >
                <span className="material-symbols-outlined text-base">restart_alt</span>
                <span>{lang === 'ar' ? 'تفريغ' : 'Vider'}</span>
              </button>

              <button
                type="button"
                onClick={handleCheckSentence}
                disabled={selectedWords.length === 0}
                className="w-2/3 py-2.5 rounded-xl bg-gradient-to-r from-[#4221b6] to-[#5d35e0] hover:from-[#351998] hover:to-[#4828be] text-white font-black text-xs shadow-md disabled:opacity-50 transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">check_circle</span>
                <span>{lang === 'ar' ? 'تحقق من الجملة' : 'Vérifier'}</span>
              </button>
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
                      {lang === 'ar' ? 'ممتاز يا بطل! 🌟' : 'Bravo, c\'est parfait ! 🌟'}
                    </h3>
                    <p className="text-xs font-bold text-slate-600">
                      {lang === 'ar'
                        ? 'جملة صحيحة! حصلت على +1 نقطة'
                        : 'Excellente phrase ! Tu gagnes +1 point.'}
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
                {lang === 'ar' ? '🎉 إنجاز رائع! أكملت التحدي!' : '🎉 Félicitations ! Jeu Terminé !'}
              </h2>
              <p className="text-xs text-slate-600 font-bold max-w-xs mx-auto">
                {lang === 'ar'
                  ? `لقد جمعت ${score} نقطة في لعبة تركيب الجمل!`
                  : `Tu as obtenu ${score} points au jeu de construction !`}
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
                  {score >= 4 ? '⭐⭐⭐' : score >= 2 ? '⭐⭐' : '⭐'}
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
                <span>تعديل الجملة والصورة رقم {currentIndex + 1} (لوحة المسؤول)</span>
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
              <label className="text-xs font-black text-slate-700 block">رابط الصورة (URL):</label>
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  value={editFormData.img}
                  onChange={(e) => setEditFormData({ ...editFormData, img: e.target.value })}
                  className="flex-1 px-3 py-2 text-xs font-bold border-2 border-slate-200 rounded-xl focus:border-amber-500 outline-none bg-slate-50"
                  required
                />
                {editFormData.img && (
                  <img
                    src={editFormData.img}
                    alt="معاينة"
                    className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                  />
                )}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-black text-slate-700 block">الجملة الفرنسية الصحيحة الكاملة:</label>
              <input
                type="text"
                value={editFormData.correctSentence}
                onChange={(e) => setEditFormData({ ...editFormData, correctSentence: e.target.value })}
                className="w-full px-3 py-2 text-sm font-bold border-2 border-slate-200 rounded-xl focus:border-amber-500 outline-none bg-slate-50"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-black text-slate-700 block">الترجمة التوضيحية بالعربية:</label>
              <input
                type="text"
                value={editFormData.arabicTranslation}
                onChange={(e) => setEditFormData({ ...editFormData, arabicTranslation: e.target.value })}
                className="w-full px-3 py-2 text-xs font-bold border-2 border-slate-200 rounded-xl focus:border-amber-500 outline-none bg-slate-50"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-black text-slate-700 block">الكلمات المبعثرة (مفصولة بمسافة):</label>
              <input
                type="text"
                value={editFormData.wordsString}
                onChange={(e) => setEditFormData({ ...editFormData, wordsString: e.target.value })}
                className="w-full px-3 py-2 text-xs font-bold border-2 border-slate-200 rounded-xl focus:border-amber-500 outline-none bg-slate-50"
                required
              />
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
                <span>إضافة مهمة / جملة جديدة (لوحة المسؤول)</span>
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
              <label className="text-xs font-black text-slate-700 block">رابط الصورة (URL):</label>
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  value={addFormData.img}
                  onChange={(e) => setAddFormData({ ...addFormData, img: e.target.value })}
                  className="flex-1 px-3 py-2 text-xs font-bold border-2 border-slate-200 rounded-xl focus:border-emerald-500 outline-none bg-slate-50"
                  placeholder="https://..."
                  required
                />
                {addFormData.img && (
                  <img
                    src={addFormData.img}
                    alt="معاينة"
                    className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                  />
                )}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-black text-slate-700 block">الجملة الفرنسية الصحيحة الكاملة:</label>
              <input
                type="text"
                value={addFormData.correctSentence}
                onChange={(e) => setAddFormData({ ...addFormData, correctSentence: e.target.value })}
                className="w-full px-3 py-2 text-sm font-bold border-2 border-slate-200 rounded-xl focus:border-emerald-500 outline-none bg-slate-50"
                placeholder="مثال: Le poisson nage dans l'eau."
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
                placeholder="مثال: السمكة تسبح في الماء."
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-black text-slate-700 block">الكلمات المبعثرة (مفصولة بمسافة):</label>
              <input
                type="text"
                value={addFormData.wordsString}
                onChange={(e) => setAddFormData({ ...addFormData, wordsString: e.target.value })}
                className="w-full px-3 py-2 text-xs font-bold border-2 border-slate-200 rounded-xl focus:border-emerald-500 outline-none bg-slate-50"
                placeholder="مثال: Le poisson nage dans l'eau."
                required
              />
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
                إضافة الجملة الجديدة ✓
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
                {lang === 'ar' ? 'تأكيد حذف الجملة ⚠️' : 'Confirmation de suppression ⚠️'}
              </h3>
              <p className="text-xs text-slate-500 font-bold leading-relaxed">
                {lang === 'ar'
                  ? 'هل أنت متاكد من اختيارك لحذف هذه الجملة من اللعبة؟ لا يمكن التراجع عن هذه الخطوة.'
                  : 'Es-tu sûr de vouloir supprimer cette phrase ? Cette action est irréversible.'}
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
