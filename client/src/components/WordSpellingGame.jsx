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

// Database of Default Word Spelling Questions
const DEFAULT_SPELLING_QUESTIONS = [
  {
    id: 1,
    img: 'https://images.unsplash.com/photo-1535268647677-300dbf3d78d1?auto=format&fit=crop&q=80&w=400',
    correctWord: 'CHAT',
    arabicTranslation: 'قط',
    hintAr: 'حيوان أليف معروف بمواوئه!',
  },
  {
    id: 2,
    img: 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?auto=format&fit=crop&q=80&w=400',
    correctWord: 'POMME',
    arabicTranslation: 'تفاحة',
    hintAr: 'فاكهة حمراء ولذيذة!',
  },
  {
    id: 3,
    img: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=400',
    correctWord: 'OISEAU',
    arabicTranslation: 'عصفور',
    hintAr: 'حيوان لطيف يطير في السماء!',
  },
  {
    id: 4,
    img: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&q=80&w=400',
    correctWord: 'LIVRE',
    arabicTranslation: 'كتاب',
    hintAr: 'نقرأ منه القصص والدروس!',
  },
  {
    id: 5,
    img: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&q=80&w=400',
    correctWord: 'BALLON',
    arabicTranslation: 'كرة',
    hintAr: 'نلعب بها في مباراة كرة القدم!',
  },
  {
    id: 6,
    img: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=400',
    correctWord: 'POISSON',
    arabicTranslation: 'سمكة',
    hintAr: 'مخلوق جميـل يسبح في البحر!',
  },
];

export default function WordSpellingGame({ lang = 'ar', isRtl = true, onClose, onWinStars }) {
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
      const saved = localStorage.getItem('custom_spelling_questions');
      return saved ? JSON.parse(saved) : DEFAULT_SPELLING_QUESTIONS;
    } catch {
      return DEFAULT_SPELLING_QUESTIONS;
    }
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);

  const currentQ = questionsList[currentIndex] || DEFAULT_SPELLING_QUESTIONS[0];

  const [availableLetters, setAvailableLetters] = useState([]);
  const [selectedLetters, setSelectedLetters] = useState([]);
  const [isCorrect, setIsCorrect] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [floatingScore, setFloatingScore] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [isGameFinished, setIsGameFinished] = useState(false);
  const [confettiActive, setConfettiActive] = useState(false);

  // Admin Question Edit, Add & Delete Confirmation State
  const [isEditingQuestion, setIsEditingQuestion] = useState(false);
  const [editFormData, setEditFormData] = useState(null);

  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [addFormData, setAddFormData] = useState({
    img: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=400',
    correctWord: 'FLEUR',
    arabicTranslation: 'زهـرة',
    hintAr: 'نبات جميل عطري في الحديقة',
  });

  // Speech Synthesis Pronunciation
  const speakWord = (text) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fr-FR';
    utterance.rate = 0.85;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  // Prepare and shuffle letter tiles on question change
  useEffect(() => {
    if (!currentQ) return;
    setSelectedLetters([]);
    setIsCorrect(null);
    setShowCelebration(false);
    setShowHint(false);

    const targetWord = currentQ.correctWord.toUpperCase();
    const letterArr = targetWord.split('');

    const shuffled = [...letterArr]
      .map((char, i) => ({ id: `${i}-${char}-${Math.random()}`, char }))
      .sort(() => Math.random() - 0.5);

    setAvailableLetters(shuffled);
  }, [currentIndex, questionsList]);

  // Click an available letter tile -> Add to selectedLetters
  const handleSelectLetter = (letterObj) => {
    if (isCorrect === true || isGameFinished) return;
    playSoundEffect('click');
    setAvailableLetters((prev) => prev.filter((l) => l.id !== letterObj.id));
    setSelectedLetters((prev) => [...prev, letterObj]);
    setIsCorrect(null);
  };

  // Click a selected letter in drop zone -> Return to availableLetters
  const handleDeselectLetter = (letterObj) => {
    if (isCorrect === true || isGameFinished) return;
    playSoundEffect('click');
    setSelectedLetters((prev) => prev.filter((l) => l.id !== letterObj.id));
    setAvailableLetters((prev) => [...prev, letterObj]);
    setIsCorrect(null);
  };

  // Reset selected letters
  const handleResetLetters = () => {
    playSoundEffect('click');
    if (!currentQ) return;
    const targetWord = currentQ.correctWord.toUpperCase();
    const letterArr = targetWord.split('');
    const shuffled = [...letterArr]
      .map((char, i) => ({ id: `${i}-${char}-${Math.random()}`, char }))
      .sort(() => Math.random() - 0.5);

    setAvailableLetters(shuffled);
    setSelectedLetters([]);
    setIsCorrect(null);
  };

  // Check word spelling
  const handleCheckWord = () => {
    if (selectedLetters.length === 0 || isGameFinished) return;

    const userWord = selectedLetters.map((l) => l.char).join('').toUpperCase();
    const targetWord = currentQ.correctWord.toUpperCase().trim();

    if (userWord === targetWord) {
      playSoundEffect('correct');
      setIsCorrect(true);
      const newScore = score + 1;
      setScore(newScore);

      setFloatingScore({ text: '+1', type: 'plus', id: Date.now() });
      setConfettiActive(true);
      setShowCelebration(true);

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
    setSelectedLetters([]);
    setIsCorrect(null);
    setIsGameFinished(false);
    setShowCelebration(false);
    setConfettiActive(false);
  };

  // Admin Question Edit Handlers
  const handleOpenEditQuestion = () => {
    setEditFormData({
      img: currentQ.img || '',
      correctWord: currentQ.correctWord,
      arabicTranslation: currentQ.arabicTranslation || '',
      hintAr: currentQ.hintAr || '',
    });
    setIsEditingQuestion(true);
  };

  const handleSaveEditedQuestion = (e) => {
    e.preventDefault();
    const updatedQuestions = questionsList.map((q, idx) => {
      if (idx === currentIndex) {
        return {
          ...q,
          img: editFormData.img,
          correctWord: editFormData.correctWord.toUpperCase().trim(),
          arabicTranslation: editFormData.arabicTranslation,
          hintAr: editFormData.hintAr,
        };
      }
      return q;
    });

    setQuestionsList(updatedQuestions);
    try {
      localStorage.setItem('custom_spelling_questions', JSON.stringify(updatedQuestions));
    } catch {}

    setIsEditingQuestion(false);
    setIsCorrect(null);
    playSoundEffect('click');
  };

  // Admin Add Question Handler
  const handleSaveNewQuestion = (e) => {
    e.preventDefault();
    const newQuestion = {
      id: Date.now(),
      img: addFormData.img,
      correctWord: addFormData.correctWord.toUpperCase().trim(),
      arabicTranslation: addFormData.arabicTranslation,
      hintAr: addFormData.hintAr || '',
    };

    const updated = [...questionsList, newQuestion];
    setQuestionsList(updated);
    try {
      localStorage.setItem('custom_spelling_questions', JSON.stringify(updated));
    } catch {}

    setIsAddingQuestion(false);
    setCurrentIndex(updated.length - 1);
    setSelectedLetters([]);
    setIsCorrect(null);
    playSoundEffect('fanfare');
  };

  // Admin Confirm Delete Handler
  const handleConfirmDeleteQuestion = () => {
    if (questionsList.length <= 1) return;

    const updated = questionsList.filter((_, idx) => idx !== currentIndex);
    setQuestionsList(updated);
    try {
      localStorage.setItem('custom_spelling_questions', JSON.stringify(updated));
    } catch {}

    setCurrentIndex((prev) => Math.max(0, prev - 1));
    setSelectedLetters([]);
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
              🔤
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="font-black text-base text-[#1c0576]">
                  {lang === 'ar' ? 'تحدي تركيب الحروف' : 'Le Maître des Lettres'}
                </h2>
              </div>
              <p className="text-[11px] text-slate-400 font-bold">
                {lang === 'ar'
                  ? `الكلمة ${currentIndex + 1} من ${questionsList.length}`
                  : `Mot ${currentIndex + 1} sur ${questionsList.length}`}
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
              <span>{lang === 'ar' ? `الكلمة ${currentIndex + 1} من ${questionsList.length}` : `Mot ${currentIndex + 1}/${questionsList.length}`}</span>
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
                        title="إضافة كلمة جديدة (مسؤول)"
                      >
                        <span className="material-symbols-outlined text-xs">add_circle</span>
                        <span>إضافة</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleOpenEditQuestion}
                        className="px-2 py-1 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-900 font-black text-[11px] flex items-center gap-0.5 shadow-sm transition cursor-pointer"
                        title="تعديل الكلمة والصورة (مسؤول)"
                      >
                        <span className="material-symbols-outlined text-xs">edit</span>
                        <span>تعديل</span>
                      </button>

                      {questionsList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setShowDeleteConfirm(true)}
                          className="w-7 h-7 rounded-xl bg-rose-500/80 hover:bg-rose-600 text-white font-black text-xs flex items-center justify-center transition cursor-pointer backdrop-blur-sm"
                          title="حذف الكلمة الحالية (مسؤول)"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      )}
                    </>
                  )}

                  {/* Audio Speaker Button */}
                  <button
                    type="button"
                    onClick={() => speakWord(currentQ.correctWord)}
                    className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-md border ${
                      isSpeaking
                        ? 'bg-amber-400 text-slate-900 border-amber-300 scale-110 animate-bounce'
                        : 'bg-white/20 hover:bg-white/30 text-white border-white/30'
                    }`}
                    title={lang === 'ar' ? 'استمع لنطق الكلمة الصحيحة' : 'Écouter le mot'}
                  >
                    <span className="material-symbols-outlined text-sm">
                      {isSpeaking ? 'volume_up' : 'campaign'}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Target Spelling Drop Zone / Slots */}
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
                {lang === 'ar' ? '👇 الكلمة المجمّعة (انقر على الحرف لإزالته):' : '👇 Mot assemblé :'}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-1.5 min-h-[42px]">
                {Array.from({ length: currentQ.correctWord.length }).map((_, idx) => {
                  const letterObj = selectedLetters[idx];
                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={!letterObj}
                      onClick={() => letterObj && handleDeselectLetter(letterObj)}
                      className={`w-10 h-11 sm:w-11 sm:h-12 rounded-xl font-black text-lg sm:text-xl flex items-center justify-center transition-all duration-200 cursor-pointer shadow-sm border-2 ${
                        letterObj
                          ? 'bg-[#4221b6] text-white border-[#33179a] hover:bg-rose-600 animate-in zoom-in-90'
                          : 'bg-white border-dashed border-slate-300 text-slate-300'
                      }`}
                    >
                      {letterObj ? letterObj.char : ''}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Scrambled Letters Pool */}
            <div className="space-y-2">
              <div className="text-[11px] font-black text-slate-600 uppercase tracking-wider text-center">
                {lang === 'ar' ? 'الحروف المبعثرة:' : 'Lettres disponibles :'}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 p-2 bg-indigo-50/50 rounded-2xl border border-indigo-100 min-h-[56px]">
                {availableLetters.map((letterObj) => (
                  <button
                    key={letterObj.id}
                    type="button"
                    onClick={() => handleSelectLetter(letterObj)}
                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white text-slate-800 font-black text-base sm:text-lg border-2 border-indigo-200 hover:border-[#4221b6] hover:bg-indigo-50 hover:scale-108 transition-all shadow-sm cursor-pointer"
                  >
                    {letterObj.char}
                  </button>
                ))}
              </div>
            </div>

            {/* Controls (Reset & Verify & Hint) */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleResetLetters}
                disabled={selectedLetters.length === 0}
                className="w-1/3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 font-black text-xs transition cursor-pointer flex items-center justify-center gap-1 border border-slate-200"
              >
                <span className="material-symbols-outlined text-base">restart_alt</span>
                <span>{lang === 'ar' ? 'تفريغ' : 'Vider'}</span>
              </button>

              <button
                type="button"
                onClick={handleCheckWord}
                disabled={selectedLetters.length === 0}
                className="w-2/3 py-2.5 rounded-xl bg-gradient-to-r from-[#4221b6] to-[#5d35e0] hover:from-[#351998] hover:to-[#4828be] text-white font-black text-xs shadow-md disabled:opacity-50 transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">check_circle</span>
                <span>{lang === 'ar' ? 'تحقق من الكلمة' : 'Vérifier'}</span>
              </button>
            </div>

            {/* Hint Button */}
            {currentQ.hintAr && (
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => setShowHint(!showHint)}
                  className="text-[11px] font-black text-amber-600 hover:text-amber-700 bg-amber-50 px-3 py-1 rounded-lg transition border border-amber-200 inline-flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">lightbulb</span>
                  <span>{showHint ? 'إخفاء التلميح' : 'تلميح؟'}</span>
                </button>

                {showHint && (
                  <div className="mt-2 p-2 rounded-xl bg-amber-100/90 text-amber-900 font-bold text-xs animate-in fade-in duration-200 border border-amber-300 max-w-xs mx-auto" dir="rtl">
                    💡 {currentQ.hintAr}
                  </div>
                )}
              </div>
            )}

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
                        ? 'كلمة صحيحة! حصلت على +1 نقطة'
                        : 'Mot exact ! Tu gagnes +1 point.'}
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
                  ? `لقد جمعت ${score} نقطة في لعبة تركيب الحروف!`
                  : `Tu as obtenu ${score} points au jeu des lettres !`}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <div className="p-2 bg-white rounded-xl border border-slate-100 text-center space-y-0.5">
                <span className="text-[10px] font-bold text-slate-400 block">{lang === 'ar' ? 'النقاط' : 'Score'}</span>
                <span className="text-base font-black text-indigo-600">{score}</span>
              </div>
              <div className="p-2 bg-white rounded-xl border border-slate-100 text-center space-y-0.5">
                <span className="text-[10px] font-bold text-slate-400 block">{lang === 'ar' ? 'الكلمات' : 'Mots'}</span>
                <span className="text-base font-black text-slate-800">{questionsList.length}</span>
              </div>
              <div className="p-2 bg-white rounded-xl border border-slate-100 text-center space-y-0.5">
                <span className="text-[10px] font-bold text-slate-400 block">{lang === 'ar' ? 'التقييم' : 'Note'}</span>
                <span className="text-base font-black text-amber-500">
                  {score >= 5 ? '⭐⭐⭐' : score >= 3 ? '⭐⭐' : '⭐'}
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
                <span>تعديل الكلمة والصورة رقم {currentIndex + 1} (لوحة المسؤول)</span>
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
              <label className="text-xs font-black text-slate-700 block">الكلمة الفرنسية الصحيحة:</label>
              <input
                type="text"
                value={editFormData.correctWord}
                onChange={(e) => setEditFormData({ ...editFormData, correctWord: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 text-sm font-black tracking-widest uppercase border-2 border-slate-200 rounded-xl focus:border-amber-500 outline-none bg-slate-50"
                placeholder="مثال: CHAT"
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
              <label className="text-xs font-black text-slate-700 block">التلميح بالعربية:</label>
              <input
                type="text"
                value={editFormData.hintAr}
                onChange={(e) => setEditFormData({ ...editFormData, hintAr: e.target.value })}
                className="w-full px-3 py-2 text-xs font-bold border-2 border-slate-200 rounded-xl focus:border-amber-500 outline-none bg-slate-50"
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
                <span>إضافة مهمة / كلمة جديدة (لوحة المسؤول)</span>
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
              <label className="text-xs font-black text-slate-700 block">الكلمة الفرنسية الصحيحة:</label>
              <input
                type="text"
                value={addFormData.correctWord}
                onChange={(e) => setAddFormData({ ...addFormData, correctWord: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 text-sm font-black tracking-widest uppercase border-2 border-slate-200 rounded-xl focus:border-emerald-500 outline-none bg-slate-50"
                placeholder="مثال: FLEUR"
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
                placeholder="مثال: زهرة"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-black text-slate-700 block">التلميح بالعربية:</label>
              <input
                type="text"
                value={addFormData.hintAr}
                onChange={(e) => setAddFormData({ ...addFormData, hintAr: e.target.value })}
                className="w-full px-3 py-2 text-xs font-bold border-2 border-slate-200 rounded-xl focus:border-emerald-500 outline-none bg-slate-50"
                placeholder="مثال: نبات عطري في الحديقة"
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
                إضافة الكلمة الجديدة ✓
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
                {lang === 'ar' ? 'تأكيد حذف الكلمة ⚠️' : 'Confirmation de suppression ⚠️'}
              </h3>
              <p className="text-xs text-slate-500 font-bold leading-relaxed">
                {lang === 'ar'
                  ? 'هل أنت متاكد من اختيارك لحذف هذه الكلمة من اللعبة؟ لا يمكن التراجع عن هذه الخطوة.'
                  : 'Es-tu sûr de vouloir supprimer ce mot ? Cette action est irréversible.'}
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
