import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { API_BASE_URL } from '../config';

// Curated list of cute mascot & student avatars
export const PRESET_AVATARS = [
  {
    id: 'fox_default',
    name: { fr: 'Renard Rusé (Par défaut)', ar: 'الثعلب الذكي (الافتراضي)', en: 'Clever Fox (Default)' },
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBF-VgHZWivqK0W6c5fa_VKkY0L-pIuXnMOONzEFytFG-zLHuG4tkUuGky5v-ViLjzhK1IX-z7ieazinQTvBAynhmrlnpD6QCbmytyBkxdwnQ1WZrIW6oIrpuci_8qWFnKEVCdQkpDJRWy0Z-4dU5bP9hYyYRnu2L48NivQ6aVab9Eetf-U8FK45VgF1t4JEeLEwVcHHkamYSu-Y5xJQ-cjWxsOeLn2Z1R2NmC-goe6GYnD1FtjC3PS',
  },
  {
    id: 'panda',
    name: { fr: 'Petit Panda', ar: 'الباندا اللطيف', en: 'Cute Panda' },
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=PandaJoy&backgroundColor=b6e3f4,c0aede',
  },
  {
    id: 'lion',
    name: { fr: 'Lion Courageux', ar: 'الأسد الشجاع', en: 'Brave Lion' },
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=LionHero&backgroundColor=ffd5dc,ffdfbf',
  },
  {
    id: 'rabbit',
    name: { fr: 'Lapin Joyeux', ar: 'الأرنب السريع', en: 'Happy Bunny' },
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=BunnyStar&backgroundColor=d1d4f9,c0aede',
  },
  {
    id: 'owl',
    name: { fr: 'Chouette Savante', ar: 'البومة الحكيمة', en: 'Wise Owl' },
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=WiseOwl&backgroundColor=ffdfbf,ffd5dc',
  },
  {
    id: 'cat',
    name: { fr: 'Petit Chat Malicieux', ar: 'القط المرح', en: 'Playful Cat' },
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=PlayfulCat&backgroundColor=b6e3f4,ffd5dc',
  },
  {
    id: 'astronaut',
    name: { fr: 'Astronaute Explorateur', ar: 'رائد الفضاء المستكشف', en: 'Space Explorer' },
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=AstroKid&backgroundColor=c0aede,d1d4f9',
  },
  {
    id: 'superhero',
    name: { fr: 'Super Étoile', ar: 'النجم الخارق', en: 'Super Star' },
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=SuperStar&backgroundColor=ffd5dc,b6e3f4',
  },
  {
    id: 'adventurer_girl',
    name: { fr: 'Petite Aventurière', ar: 'المغامرة الصغيرة', en: 'Little Adventurer' },
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=LeaSophie&backgroundColor=ffd5dc,c0aede',
  },
  {
    id: 'adventurer_boy',
    name: { fr: 'Petit Champion', ar: 'البطل الصغير', en: 'Little Champion' },
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=LeoMax&backgroundColor=b6e3f4,d1d4f9',
  },
  {
    id: 'scholar_girl',
    name: { fr: 'Élève Curieuse', ar: 'التلميذة النجيبة', en: 'Curious Student' },
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=NourSarah&backgroundColor=ffdfbf,ffd5dc',
  },
  {
    id: 'scholar_boy',
    name: { fr: 'Élève Passionné', ar: 'التلميذ المبدع', en: 'Passionate Student' },
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=AdamYoussef&backgroundColor=d1d4f9,b6e3f4',
  },
];

export const DEFAULT_STUDENT_AVATAR = PRESET_AVATARS[0].url;

export default function ChangeStudentAvatarModal({
  isOpen,
  onClose,
  student,
  onSuccess,
}) {
  const { lang } = useLanguage();
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [activeTab, setActiveTab] = useState('presets'); // 'presets' | 'upload' | 'url'
  const [customUrl, setCustomUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (isOpen && student) {
      const currentPic = student.picture || DEFAULT_STUDENT_AVATAR;
      setSelectedAvatar(currentPic);
      setCustomUrl(student.picture && !student.picture.startsWith('data:') ? student.picture : '');
      setErrorMessage('');
      setSuccessMessage('');
      setActiveTab('presets');
    }
  }, [isOpen, student]);

  if (!isOpen || !student) return null;

  const studentName = student.childName || student.parentName || student.email?.split('@')[0] || 'Élève';
  const studentId = student.id || student._id;

  // Handle local file upload (converts to compressed base64)
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage(lang === 'ar' ? 'يرجى اختيار ملف صورة صالح (PNG, JPG, WebP)' : 'Veuillez sélectionner une image valide (PNG, JPG, WebP).');
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      setErrorMessage(lang === 'ar' ? 'حجم الصورة كبير جداً (أقصى حد 4 ميغابايت)' : 'Image trop volumineuse (max 4 Mo).');
      return;
    }

    setErrorMessage('');
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Resize image to max 256x256 for optimal lightweight storage
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 256;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setSelectedAvatar(dataUrl);
      };
      img.src = event.target?.result;
    };
    reader.readAsDataURL(file);
  };

  // Save selected avatar for this specific student
  const handleSave = async () => {
    if (!studentId) {
      setErrorMessage(lang === 'ar' ? 'معرف التلميذ غير صالح' : 'Identifiant de l\'élève introuvable.');
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage('');
      setSuccessMessage('');

      const res = await fetch(`${API_BASE_URL}/api/clients/${studentId}/avatar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ picture: selectedAvatar }),
      });

      if (res.ok) {
        const data = await res.json();
        setSuccessMessage(lang === 'ar' ? 'تم تحديث صورة التلميذ بنجاح !' : 'Photo de l\'élève mise à jour avec succès !');

        // Dispatch local events so the UI refreshes instantly without page reload
        window.dispatchEvent(
          new CustomEvent('auth_role_updated', {
            detail: {
              clientId: studentId,
              picture: selectedAvatar,
            },
          })
        );

        if (onSuccess) {
          onSuccess(selectedAvatar);
        }

        setTimeout(() => {
          onClose();
        }, 600);
      } else {
        const errData = await res.json();
        setErrorMessage(errData.error || (lang === 'ar' ? 'فشل حفظ الصورة' : 'Échec de la mise à jour.'));
      }
    } catch (err) {
      console.error('Erreur save student avatar:', err);
      setErrorMessage(lang === 'ar' ? 'تعذر الاتصال بالخادم' : 'Erreur de connexion au serveur.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border-2 border-[#8c90f6]/50 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#e0d7ff] text-[#4221b6] flex items-center justify-center font-bold shadow-sm">
              <span className="material-symbols-outlined text-xl">palette</span>
            </div>
            <div>
              <h3 className="text-lg font-black text-[#1c0576] leading-tight">
                {lang === 'ar' ? `تغيير صورة التلميذ: ${studentName}` : `Changer l'avatar de l'élève : ${studentName}`}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {lang === 'ar' ? 'خاص بالمعلمة والإدارة • التعديل يخص هذا التلميذ فقط' : 'Privilège Admin & Maîtresse • S\'applique à cet élève uniquement'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Highlight Banner */}
        <div className="bg-gradient-to-r from-[#e8f5e9] to-[#e0f2fe] border border-emerald-200 rounded-2xl p-3 flex items-center gap-3">
          <span className="material-symbols-outlined text-emerald-600 text-2xl">verified_user</span>
          <div className="text-xs font-semibold text-emerald-900">
            <span className="font-bold">
              {lang === 'ar' ? `التعديل خاص بحساب: ${studentName}` : `Modification ciblée pour : ${studentName}`}
            </span>
            <p className="text-[11px] text-emerald-700 mt-0.5">
              {lang === 'ar'
                ? 'لن تتأثر الحسابات الأخرى؛ كل تلميذ لديه صورته الخاصة به.'
                : 'Les autres élèves conserveront leur propre photo respective.'}
            </p>
          </div>
        </div>

        {/* Live Avatar Preview */}
        <div className="flex flex-col items-center justify-center py-2 gap-2">
          <div className="relative group">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden border-4 border-[#4221b6] shadow-xl bg-slate-100 flex items-center justify-center transition-all hover:scale-105">
              <img
                src={selectedAvatar || DEFAULT_STUDENT_AVATAR}
                alt="Selected Student Avatar"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = DEFAULT_STUDENT_AVATAR;
                }}
              />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-[#4221b6] text-white p-1.5 rounded-full shadow-md">
              <span className="material-symbols-outlined text-sm">auto_awesome</span>
            </div>
          </div>
          <span className="text-xs font-bold text-slate-700">
            {lang === 'ar' ? 'المعاينة المباشرة للصورة' : 'Aperçu en direct'}
          </span>
        </div>

        {/* Tabs for Avatar Selection Mode */}
        <div className="flex bg-slate-100 p-1 rounded-2xl gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('presets')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'presets'
                ? 'bg-white text-[#4221b6] shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-sm">sentiment_satisfied</span>
            <span>{lang === 'ar' ? 'مجموعة الأفاتار' : 'Mascottes'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'upload'
                ? 'bg-white text-[#4221b6] shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-sm">upload</span>
            <span>{lang === 'ar' ? 'رفع صورة' : 'Importer'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'url'
                ? 'bg-white text-[#4221b6] shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-sm">link</span>
            <span>{lang === 'ar' ? 'رابط URL' : 'Lien URL'}</span>
          </button>
        </div>

        {/* Tab 1: Presets Grid */}
        {activeTab === 'presets' && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-56 overflow-y-auto p-1">
            {PRESET_AVATARS.map((avatar) => {
              const isSelected = selectedAvatar === avatar.url;
              return (
                <button
                  key={avatar.id}
                  type="button"
                  onClick={() => {
                    setSelectedAvatar(avatar.url);
                    setErrorMessage('');
                  }}
                  className={`flex flex-col items-center gap-1.5 p-2 rounded-2xl border-2 transition-all cursor-pointer relative ${
                    isSelected
                      ? 'border-[#4221b6] bg-[#e0d7ff]/30 shadow-md scale-105'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {isSelected && (
                    <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#4221b6] text-white flex items-center justify-center text-[10px]">
                      ✓
                    </span>
                  )}
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-50 flex items-center justify-center">
                    <img src={avatar.url} alt={avatar.name[lang] || avatar.name.fr} className="w-full h-full object-cover" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-700 text-center leading-tight line-clamp-1">
                    {avatar.name[lang] || avatar.name.fr}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Tab 2: Upload File */}
        {activeTab === 'upload' && (
          <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50 hover:bg-slate-100/60 transition-colors">
            <label className="cursor-pointer flex flex-col items-center gap-2 text-center w-full">
              <div className="w-12 h-12 rounded-2xl bg-[#e0d7ff] text-[#4221b6] flex items-center justify-center shadow-sm">
                <span className="material-symbols-outlined text-2xl">add_photo_alternate</span>
              </div>
              <span className="text-xs font-bold text-slate-800">
                {lang === 'ar' ? 'انقر لاختيار صورة من جهازك' : 'Cliquez pour choisir une photo'}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                PNG, JPG, WebP (Max 4 Mo)
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        )}

        {/* Tab 3: Custom URL */}
        {activeTab === 'url' && (
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700">
              {lang === 'ar' ? 'رابط الصورة المباشر (URL):' : 'Lien URL direct de l\'image :'}
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={customUrl}
                onChange={(e) => {
                  setCustomUrl(e.target.value);
                  setSelectedAvatar(e.target.value);
                }}
                placeholder="https://example.com/avatar.jpg"
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#4221b6]"
              />
            </div>
          </div>
        )}

        {/* Feedback Messages */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-base">error</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-base">check_circle</span>
            <span>{successMessage}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 gap-3">
          <button
            type="button"
            onClick={() => {
              setSelectedAvatar(DEFAULT_STUDENT_AVATAR);
              setCustomUrl('');
            }}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 underline cursor-pointer"
          >
            {lang === 'ar' ? 'استعادة الافتراضي' : 'Par défaut'}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              {lang === 'ar' ? 'إلغاء' : 'Annuler'}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-[#4221b6] hover:bg-[#341a99] text-white text-xs font-bold shadow-md hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                  <span>{lang === 'ar' ? 'جاري الحفظ...' : 'Enregistrement...'}</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm">save</span>
                  <span>{lang === 'ar' ? 'حفظ لهذا التلميذ' : 'Enregistrer'}</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
