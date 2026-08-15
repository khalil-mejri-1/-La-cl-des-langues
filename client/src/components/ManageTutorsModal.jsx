import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { API_BASE_URL } from '../config';

export default function ManageTutorsModal({ onClose }) {
  const { lang, isRtl, customSections, updateSectionData, t } = useLanguage();
  const [activeLangTab, setActiveLangTab] = useState(lang); // 'fr' | 'ar' | 'en'
  const [registeredTeachers, setRegisteredTeachers] = useState([]);
  const [loadingTeachers, setLoadingTeachers] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Default initial tutors
  const defaultTutors = [
    {
      id: '1',
      visible: true,
      img: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400',
      fr: { name: 'Olfa', desc: "Enseignante d'arabe avec plus de 15 ans d'expérience." },
      ar: { name: 'ألفة', desc: 'أستاذة لغة عربية بخبرة تتجاوز 15 عاماً في التدريس.' },
      en: { name: 'Olfa', desc: 'Arabic language teacher with over 15 years of experience.' },
    },
    {
      id: '2',
      visible: true,
      img: 'https://images.unsplash.com/photo-1580894732413-801648a37947?auto=format&fit=crop&q=80&w=400',
      fr: { name: 'Feten', desc: "Spécialiste en FLE, passionnée par l'enseignement et la pédagogie." },
      ar: { name: 'فاتن', desc: 'مختصة في اللغة الفرنسية وشغوفة بالتعليم والبيداغوجيا الحديثة.' },
      en: { name: 'Feten', desc: 'Specialist in French as a Foreign Language, passionate about modern pedagogy.' },
    },
  ];

  const initialTutors = (customSections?.hero?.tutors && Array.isArray(customSections.hero.tutors))
    ? customSections.hero.tutors.map((tut, i) => ({
        id: tut.id || String(i + 1),
        teacherId: tut.teacherId || '',
        visible: tut.visible !== false && tut.hidden !== true,
        img: tut.img || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400',
        fr: { name: tut.fr?.name || tut.name || '', desc: tut.fr?.desc || tut.desc || '' },
        ar: { name: tut.ar?.name || tut.name || '', desc: tut.ar?.desc || tut.desc || '' },
        en: { name: tut.en?.name || tut.name || '', desc: tut.en?.desc || tut.desc || '' },
      }))
    : defaultTutors;

  const [tutorsList, setTutorsList] = useState(initialTutors);
  const [tutorsTitle, setTutorsTitle] = useState({
    fr: customSections?.hero?.fr?.tutorsTitle || "Nos maîtresses",
    ar: customSections?.hero?.ar?.tutorsTitle || "معلماتنا المتميزات",
    en: customSections?.hero?.en?.tutorsTitle || "Our Teachers",
  });

  // Fetch all accounts with role Maîtresse
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        setLoadingTeachers(true);
        const res = await fetch(`${API_BASE_URL}/api/teachers`);
        if (res.ok) {
          const data = await res.json();
          if (data.teachers && Array.isArray(data.teachers)) {
            setRegisteredTeachers(data.teachers);
          }
        }
      } catch (err) {
        console.error('Erreur chargement maîtresses:', err);
      } finally {
        setLoadingTeachers(false);
      }
    };
    fetchTeachers();
  }, []);

  // Toggle Visibility for a card
  const toggleVisibility = (index) => {
    setTutorsList(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], visible: !updated[index].visible };
      return updated;
    });
  };

  // Update tutor field
  const handleTutorChange = (index, langKey, field, value) => {
    setTutorsList(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [langKey]: {
          ...updated[index][langKey],
          [field]: value,
        },
      };
      return updated;
    });
  };

  // Update image
  const handleImgChange = (index, imgUrl) => {
    setTutorsList(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], img: imgUrl };
      return updated;
    });
  };

  // Add new empty card
  const addNewCard = (teacherAcc = null) => {
    const name = teacherAcc ? (teacherAcc.name || teacherAcc.parentName || teacherAcc.email?.split('@')[0]) : 'Nouvelle Maîtresse';
    const newTutor = {
      id: String(Date.now()),
      teacherId: teacherAcc ? (teacherAcc.id || teacherAcc._id) : '',
      visible: true,
      img: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400',
      fr: { name, desc: 'Enseignante certifiée et passionnée.' },
      ar: { name, desc: 'معلمة متميزة وخبيرة في التدريس.' },
      en: { name, desc: 'Certified and passionate teacher.' },
    };
    setTutorsList(prev => [...prev, newTutor]);
  };

  // Remove card
  const removeCard = (index) => {
    setTutorsList(prev => prev.filter((_, i) => i !== index));
  };

  // Save to MongoDB
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');

    const currentHero = customSections?.hero || {};
    const updatedHero = {
      ...currentHero,
      fr: { ...(currentHero.fr || {}), tutorsTitle: tutorsTitle.fr },
      ar: { ...(currentHero.ar || {}), tutorsTitle: tutorsTitle.ar },
      en: { ...(currentHero.en || {}), tutorsTitle: tutorsTitle.en },
      tutors: tutorsList,
    };

    const success = await updateSectionData('hero', updatedHero);
    setSaving(false);
    if (success !== false) {
      setSuccessMsg(
        lang === 'ar'
          ? 'تم حفظ وتحديث كروت المعلمات بنجاح في قاعدة البيانات!'
          : 'Les cartes des maîtresses ont été mises à jour avec succès !'
      );
      setTimeout(() => {
        onClose();
      }, 1200);
    }
  };

  return (
    <div className="fixed inset-0 z-[999999] bg-black/65 backdrop-blur-sm overflow-y-auto p-4 sm:p-6 flex items-center justify-center min-h-screen">
      <div
        className="relative bg-white rounded-3xl max-w-3xl w-full flex flex-col max-h-[90vh] border-2 border-[#4221b6] shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in duration-200"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="p-5 px-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#4221b6] text-white flex items-center justify-center font-bold shadow-md shrink-0">
              <span className="material-symbols-outlined text-2xl">school</span>
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-[#1c0576] leading-tight">
                {lang === 'ar' ? 'إدارة كروت المعلمات (Nos Maîtresses)' : 'Gestion des Cartes des Maîtresses'}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {lang === 'ar' ? 'تحكم في ظهور المعلمات، إضافة كروت، وتعديل الصور والنصوص' : 'Afficher, masquer ou ajouter des cartes pour les comptes Maîtresse'}
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

        {/* Success Banner */}
        {successMsg && (
          <div className="mx-6 mt-4 p-3 bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs rounded-2xl font-bold flex items-center gap-2 justify-center shrink-0">
            <span className="material-symbols-outlined text-lg">check_circle</span>
            <span>{successMsg}</span>
          </div>
        )}

        {/* Scrollable Body */}
        <div className="p-5 px-6 overflow-y-auto space-y-6 flex-1 bg-[#faf9f5]">
          
          {/* Quick Add from Registered Maîtresse Accounts */}
          {registeredTeachers.length > 0 && (
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#4221b6] text-base">group</span>
                <h4 className="text-xs font-black text-[#1c0576]">
                  {lang === 'ar' ? 'حسابات المعلمات المسجلة في الموقع (Role: Maîtresse):' : 'Comptes Maîtresses inscrits sur la plateforme :'}
                </h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {registeredTeachers.map((teacher) => {
                  const tid = teacher.id || teacher._id;
                  const isAlreadyAdded = tutorsList.some(t => String(t.teacherId) === String(tid));
                  return (
                    <button
                      key={tid}
                      type="button"
                      onClick={() => !isAlreadyAdded && addNewCard(teacher)}
                      disabled={isAlreadyAdded}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 border transition-all cursor-pointer ${
                        isAlreadyAdded
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300 opacity-80 cursor-default'
                          : 'bg-[#e0d7ff]/50 text-[#4221b6] border-[#8c90f6] hover:bg-[#4221b6] hover:text-white hover:scale-105'
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm">{isAlreadyAdded ? 'check' : 'add'}</span>
                      <span>{teacher.name || teacher.parentName || teacher.email?.split('@')[0]}</span>
                      {isAlreadyAdded && <span className="text-[10px] bg-emerald-200 text-emerald-900 px-1.5 py-0.2 rounded-full font-bold">Ajouté</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Language Selector Bar */}
          <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
            <button
              type="button"
              onClick={() => setActiveLangTab('fr')}
              className={`flex-1 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeLangTab === 'fr'
                  ? 'bg-[#4221b6] text-white shadow-md scale-[1.02]'
                  : 'text-slate-700 hover:text-[#4221b6]'
              }`}
            >
              <span>🇫🇷 Français</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveLangTab('ar')}
              className={`flex-1 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeLangTab === 'ar'
                  ? 'bg-[#4221b6] text-white shadow-md scale-[1.02]'
                  : 'text-slate-700 hover:text-[#4221b6]'
              }`}
            >
              <span>🇹🇳 العربية</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveLangTab('en')}
              className={`flex-1 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeLangTab === 'en'
                  ? 'bg-[#4221b6] text-white shadow-md scale-[1.02]'
                  : 'text-slate-700 hover:text-[#4221b6]'
              }`}
            >
              <span>🇬🇧 English</span>
            </button>
          </div>

          {/* Section Title Input */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base text-[#4221b6]">title</span>
              <span>{lang === 'ar' ? `عنوان القسم (${activeLangTab.toUpperCase()}):` : `Titre de la section (${activeLangTab.toUpperCase()}) :`}</span>
            </label>
            <input
              type="text"
              value={tutorsTitle[activeLangTab] || ''}
              onChange={(e) => setTutorsTitle(prev => ({ ...prev, [activeLangTab]: e.target.value }))}
              placeholder="Nos maîtresses / معلماتنا المتميزات"
              className="w-full h-10 px-3.5 rounded-xl border-2 border-slate-200 bg-white focus:border-[#4221b6] outline-none font-bold text-xs shadow-sm"
            />
          </div>

          {/* Teachers Cards List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-[#1c0576]">
                {lang === 'ar' ? `كروت المعلمات المعروضة (${tutorsList.filter(t => t.visible).length} ظاهر / ${tutorsList.length} إجمالي):` : `Cartes des maîtresses (${tutorsList.filter(t => t.visible).length} visible(s) sur ${tutorsList.length}) :`}
              </h4>
            </div>

            {tutorsList.map((tutor, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-2xl border transition-all duration-200 space-y-3 relative shadow-sm ${
                  tutor.visible
                    ? 'bg-white border-slate-200'
                    : 'bg-slate-100 border-slate-300 opacity-75'
                }`}
              >
                {/* Top card bar: Visibility toggle & Delete */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-3">
                    {/* Live Image Avatar */}
                    <img
                      src={tutor.img || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400'}
                      alt=""
                      className="w-9 h-11 object-cover rounded-lg border border-slate-300 shadow-sm"
                    />
                    <div>
                      <span className="text-xs font-extrabold text-[#1c0576]">
                        {tutor[activeLangTab]?.name || tutor.name || `Maîtresse #${idx + 1}`}
                      </span>
                      {tutor.teacherId && (
                        <span className="block text-[10px] text-emerald-700 font-bold">
                          ✓ {lang === 'ar' ? 'مرتبط بحساب معلمة' : 'Compte Maîtresse'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Visibility Switcher Button */}
                    <button
                      type="button"
                      onClick={() => toggleVisibility(idx)}
                      className={`px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer border ${
                        tutor.visible
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                          : 'bg-slate-200 text-slate-600 border-slate-300 hover:bg-slate-300'
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm">
                        {tutor.visible ? 'visibility' : 'visibility_off'}
                      </span>
                      <span>
                        {tutor.visible
                          ? (lang === 'ar' ? 'ظاهر على الصفحة' : 'Visible')
                          : (lang === 'ar' ? 'مخفي' : 'Masqué')}
                      </span>
                    </button>

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={() => removeCard(idx)}
                      className="w-8 h-8 rounded-full bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center transition-colors cursor-pointer"
                      title={lang === 'ar' ? 'حذف الكارد' : 'Supprimer'}
                    >
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  </div>
                </div>

                {/* Form fields for this tutor */}
                <div className="space-y-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">
                      {lang === 'ar' ? 'رابط صورة المعلمة (URL):' : 'Lien photo (URL) :'}
                    </label>
                    <input
                      type="text"
                      value={tutor.img || ''}
                      onChange={(e) => handleImgChange(idx, e.target.value)}
                      placeholder="https://..."
                      className="w-full h-9 px-3 rounded-xl border border-slate-300 font-medium text-xs focus:border-[#4221b6] outline-none bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">
                      {lang === 'ar' ? `اسم المعلمة (${activeLangTab.toUpperCase()}):` : `Nom de la maîtresse (${activeLangTab.toUpperCase()}) :`}
                    </label>
                    <input
                      type="text"
                      value={tutor[activeLangTab]?.name || ''}
                      onChange={(e) => handleTutorChange(idx, activeLangTab, 'name', e.target.value)}
                      placeholder="Olfa, Feten..."
                      className="w-full h-9 px-3 rounded-xl border border-slate-300 font-bold text-xs focus:border-[#4221b6] outline-none bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">
                      {lang === 'ar' ? `وصف وتخصص المعلمة (${activeLangTab.toUpperCase()}):` : `Description (${activeLangTab.toUpperCase()}) :`}
                    </label>
                    <textarea
                      rows={2}
                      value={tutor[activeLangTab]?.desc || ''}
                      onChange={(e) => handleTutorChange(idx, activeLangTab, 'desc', e.target.value)}
                      placeholder="Enseignante d'arabe avec plus de 15 ans d'expérience..."
                      className="w-full p-2.5 rounded-xl border border-slate-300 font-medium text-xs focus:border-[#4221b6] outline-none leading-relaxed bg-white"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 px-6 border-t border-slate-100 flex items-center justify-between gap-3 bg-white shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-300 font-bold text-xs text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            {lang === 'ar' ? 'إلغاء' : 'Annuler'}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-[#4221b6] hover:bg-[#341a99] text-white font-black text-xs shadow-md hover:scale-105 transition-all cursor-pointer disabled:opacity-60 flex items-center gap-2"
          >
            {saving ? (
              <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
            ) : (
              <span className="material-symbols-outlined text-base">save</span>
            )}
            <span>{lang === 'ar' ? 'حفظ التعديلات' : 'Enregistrer'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
