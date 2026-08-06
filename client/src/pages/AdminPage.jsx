import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import MeetModal from '../components/MeetModal';

export default function AdminPage() {
  const { t, lang, isRtl } = useLanguage();
  const [activeTab, setActiveTab] = useState('session'); // 'session' | 'client'
  const [searchQuery, setSearchQuery] = useState('');
  const [editingSession, setEditingSession] = useState(null);

  // Real clients from MongoDB + fallback mocks
  const [clientsList, setClientsList] = useState([]);
  const [loadingClients, setLoadingClients] = useState(false);

  // Confirmation Modals State
  const [roleModalData, setRoleModalData] = useState(null); // { client, targetRole }
  const [deleteModalData, setDeleteModalData] = useState(null); // client
  const [actionLoading, setActionLoading] = useState(false);

  // Dummy sessions data
  const [adminSessions, setAdminSessions] = useState([
    {
      id: 1,
      name: "Léo Martin",
      initial: "L",
      bgAvatar: "bg-[#E1F5FE]",
      textAvatar: "text-[#0277BD]",
      datetime: "12 Oct, 14:00",
      subject: "Math (Apprendre)",
      status: "pending",
      meetUrl: ""
    },
    {
      id: 2,
      name: "Chloé Dubois",
      initial: "C",
      bgAvatar: "bg-[#FCE4EC]",
      textAvatar: "text-[#AD1457]",
      datetime: "12 Oct, 15:30",
      subject: "Français (Jeux)",
      status: "meet_added",
      meetUrl: "meet.google.com/xyz"
    },
    {
      id: 3,
      name: "Arthur Petit",
      initial: "A",
      bgAvatar: "bg-[#F3E5F5]",
      textAvatar: "text-[#6A1B9A]",
      datetime: "11 Oct, 10:00",
      subject: "Math (Progrès)",
      status: "done",
      meetUrl: ""
    }
  ]);

  // Fetch clients from MongoDB Atlas
  useEffect(() => {
    if (activeTab === 'client') {
      fetchClients();
    }
  }, [activeTab]);

  const fetchClients = async () => {
    setLoadingClients(true);
    try {
      const res = await fetch('http://localhost:5000/api/clients');
      const data = await res.json();
      if (res.ok && data.clients) {
        setClientsList(data.clients);
      }
    } catch (err) {
      console.log('Erreur chargement clients:', err);
    } finally {
      setLoadingClients(false);
    }
  };

  // Trigger Role Change Confirmation Modal
  const requestRoleChange = (client) => {
    const targetRole = client.role === 'admin' ? 'user' : 'admin';
    setRoleModalData({ client, targetRole });
  };

  // Confirm Role Change API Call
  const confirmRoleChange = async () => {
    if (!roleModalData) return;
    setActionLoading(true);
    const { client, targetRole } = roleModalData;

    try {
      if (client._id) {
        const res = await fetch(`http://localhost:5000/api/clients/${client._id}/role`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: targetRole }),
        });
        if (res.ok) {
          setClientsList(prev => prev.map(c => c._id === client._id ? { ...c, role: targetRole } : c));
        }
      } else {
        // Mock update
        setClientsList(prev => prev.map(c => c === client ? { ...c, role: targetRole } : c));
      }
    } catch (err) {
      console.error('Erreur changement rôle:', err);
    } finally {
      setActionLoading(false);
      setRoleModalData(null);
    }
  };

  // Trigger Delete Confirmation Modal
  const requestDeleteClient = (client) => {
    setDeleteModalData(client);
  };

  // Confirm Delete API Call
  const confirmDeleteClient = async () => {
    if (!deleteModalData) return;
    setActionLoading(true);
    const client = deleteModalData;

    try {
      if (client._id) {
        const res = await fetch(`http://localhost:5000/api/clients/${client._id}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          setClientsList(prev => prev.filter(c => c._id !== client._id));
        }
      } else {
        // Mock delete
        setClientsList(prev => prev.filter(c => c !== client));
      }
    } catch (err) {
      console.error('Erreur suppression client:', err);
    } finally {
      setActionLoading(false);
      setDeleteModalData(null);
    }
  };

  const handleSaveMeetLink = (sessionId, meetUrl) => {
    setAdminSessions(prev => prev.map(s => {
      if (s.id === sessionId) {
        return {
          ...s,
          meetUrl: meetUrl || 'meet.google.com/xyz',
          status: 'meet_added'
        };
      }
      return s;
    }));
    setEditingSession(null);
  };

  const filteredSessions = adminSessions.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredClients = clientsList.filter(c =>
    (c.parentName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.childName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div class="w-full max-w-7xl mx-auto px-container-margin py-8 md:py-12 pb-32 md:pb-16 flex flex-col gap-8">
      {/* Header Bar */}
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 class="text-headline-md font-headline-md text-on-surface mb-2 font-bold">
            {activeTab === 'session' 
              ? (lang === 'ar' ? 'إدارة الجلسات' : 'Gestion de Session') 
              : (lang === 'ar' ? 'إدارة الحرفاء والأولياء' : 'Gestion de Client')}
          </h1>
          <p class="text-body-md font-body-md text-on-surface-variant font-medium">
            {activeTab === 'session' 
              ? (lang === 'ar' ? 'إدارة طلبات الحصص إضافة روابط الاجتماعات' : 'Gérez les demandes de cours et ajoutez des liens de visioconférence.')
              : (lang === 'ar' ? 'عرض أولياء الأمور المسجلين وحسابات الأطفال' : 'Consultez la liste des parents inscrits et des élèves.')}
          </p>
        </div>

        {/* Search */}
        <div class="flex gap-4 w-full md:w-auto">
          <div class="relative flex-grow md:flex-grow-0">
            <span class="material-symbols-outlined absolute left-3 top-1/2 transform -translate-y-1/2 text-on-surface-variant">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={activeTab === 'session' ? t.adminPage.searchPlaceholder : 'Rechercher client...'}
              class="h-12 pl-10 pr-4 rounded-xl border-2 border-surface-variant bg-surface-container-low focus:border-primary-container outline-none font-body-md transition-all w-full md:w-64"
            />
          </div>
        </div>
      </div>

      {/* Main Container Layout with Left Sidebar Navigation */}
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Sidebar Column: Vertical Navigation Buttons */}
        <div class="lg:col-span-3 w-full order-1 lg:order-1">
          <div class="bg-surface-container-lowest rounded-3xl p-5 soft-card-shadow border-2 border-surface-variant flex flex-col gap-4 sticky top-24">
            <div class="flex items-center gap-2 border-b border-surface-variant/70 pb-3">
              <span class="material-symbols-outlined text-primary text-xl">tune</span>
              <h2 class="text-sm font-bold text-on-surface uppercase tracking-wider">
                {lang === 'ar' ? 'قائمة الإدارة' : 'Menu Admin'}
              </h2>
            </div>

            {/* Stacked Vertical Buttons */}
            <div class="flex flex-col gap-2.5">
              <button
                onClick={() => setActiveTab('client')}
                class={`w-full p-3.5 rounded-2xl font-bold text-sm transition-all duration-200 cursor-pointer flex items-center justify-between group ${activeTab === 'client'
                  ? 'bg-[#4221b6] text-white shadow-md scale-[1.02]'
                  : 'bg-surface-container-low text-on-surface hover:bg-surface-container-high hover:text-[#4221b6] border border-surface-variant/80'
                  }`}
              >
                <div class="flex items-center gap-3">
                  <span class={`material-symbols-outlined text-xl ${activeTab === 'client' ? 'text-[#b0fdb5]' : 'text-[#4221b6]'}`}>
                    person_outline
                  </span>
                  <span>Gestion de Client</span>
                </div>
                <span class="material-symbols-outlined text-sm opacity-60 group-hover:translate-x-1 transition-transform">
                  {isRtl ? 'chevron_left' : 'chevron_right'}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('session')}
                class={`w-full p-3.5 rounded-2xl font-bold text-sm transition-all duration-200 cursor-pointer flex items-center justify-between group ${activeTab === 'session'
                  ? 'bg-[#4221b6] text-white shadow-md scale-[1.02]'
                  : 'bg-surface-container-low text-on-surface hover:bg-surface-container-high hover:text-[#4221b6] border border-surface-variant/80'
                  }`}
              >
                <div class="flex items-center gap-3">
                  <span class={`material-symbols-outlined text-xl ${activeTab === 'session' ? 'text-[#b0fdb5]' : 'text-[#4221b6]'}`}>
                    event_note
                  </span>
                  <span>Gestion de Session</span>
                </div>
                <span class="material-symbols-outlined text-sm opacity-60 group-hover:translate-x-1 transition-transform">
                  {isRtl ? 'chevron_left' : 'chevron_right'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Right/Main Column: Active Section View */}
        <div class="lg:col-span-9 w-full order-2 lg:order-2">
          {activeTab === 'session' ? (
            /* Gestion de Session View */
            <div class="bg-surface-container-lowest rounded-2xl soft-card-shadow border border-surface-variant overflow-hidden">
              <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                  <thead>
                    <tr class="bg-surface-container-low text-on-surface-variant text-label-bold uppercase tracking-wider text-xs">
                      <th class="p-4 border-b border-surface-variant">{t.adminPage.thChild}</th>
                      <th class="p-4 border-b border-surface-variant">{t.adminPage.thDateTime}</th>
                      <th class="p-4 border-b border-surface-variant">{t.adminPage.thSubject}</th>
                      <th class="p-4 border-b border-surface-variant">{t.adminPage.thStatus}</th>
                      <th class="p-4 border-b border-surface-variant text-right">{t.adminPage.thActions}</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-surface-variant">
                    {filteredSessions.map((session) => (
                      <tr key={session.id} class="hover:bg-surface-container-low transition-colors">
                        <td class="p-4 font-label-bold text-on-surface flex items-center gap-3 font-bold">
                          <div class={`w-9 h-9 rounded-full ${session.bgAvatar} ${session.textAvatar} flex items-center justify-center font-bold text-sm shadow-sm`}>
                            {session.initial}
                          </div>
                          {session.name}
                        </td>
                        <td class="p-4 text-on-surface-variant text-sm">
                          <div class="flex items-center gap-2">
                            <span class="material-symbols-outlined text-sm">calendar_today</span>
                            {session.datetime}
                          </div>
                        </td>
                        <td class="p-4 text-on-surface-variant text-sm">{session.subject}</td>
                        <td class="p-4">
                          {session.status === 'pending' ? (
                            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-label-bold bg-[#FFF3E0] text-[#E65100] font-bold">
                              <span class="w-2 h-2 rounded-full bg-[#E65100]"></span>
                              {t.adminPage.pendingStatus}
                            </span>
                          ) : session.status === 'meet_added' ? (
                            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-label-bold bg-[#E1F5FE] text-[#0277BD] font-bold">
                              <span class="w-2 h-2 rounded-full bg-[#0277BD]"></span>
                              {t.adminPage.meetAddedStatus}
                            </span>
                          ) : (
                            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-label-bold bg-[#E8F5E9] text-[#2E7D32] font-bold">
                              <span class="w-2 h-2 rounded-full bg-[#2E7D32]"></span>
                              {t.adminPage.doneStatus}
                            </span>
                          )}
                        </td>
                        <td class="p-4 text-right">
                          {session.status === 'pending' || session.status === 'meet_added' ? (
                            <button
                              onClick={() => setEditingSession(session)}
                              class="px-4 py-1.5 rounded-full bg-primary-container text-on-primary-container text-xs font-label-bold hover:brightness-95 transition-colors cursor-pointer font-bold inline-flex items-center gap-1 shadow-sm"
                            >
                              <span class="material-symbols-outlined text-sm">videocam</span>
                              {session.status === 'meet_added' ? 'Modifier Meet' : t.adminPage.addMeetBtn}
                            </button>
                          ) : (
                            <button class="text-on-surface-variant hover:text-primary text-sm font-label-bold underline cursor-pointer">
                              {t.adminPage.viewNotesBtn}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Table Footer Pagination */}
              <div class="p-4 border-t border-surface-variant bg-surface-container-lowest flex justify-between items-center text-sm text-on-surface-variant">
                <span>{t.adminPage.showingEntries}</span>
                <div class="flex gap-2">
                  <button class="w-8 h-8 rounded-lg border border-surface-variant flex items-center justify-center hover:bg-surface-container disabled:opacity-50 cursor-pointer" disabled>
                    <span class="material-symbols-outlined text-sm">chevron_left</span>
                  </button>
                  <button class="w-8 h-8 rounded-lg border border-surface-variant flex items-center justify-center bg-primary-container text-on-primary font-bold">1</button>
                  <button class="w-8 h-8 rounded-lg border border-surface-variant flex items-center justify-center hover:bg-surface-container cursor-pointer font-bold">2</button>
                  <button class="w-8 h-8 rounded-lg border border-surface-variant flex items-center justify-center hover:bg-surface-container cursor-pointer">
                    <span class="material-symbols-outlined text-sm">chevron_right</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Gestion de Client View */
            <div class="bg-surface-container-lowest rounded-2xl soft-card-shadow border border-surface-variant overflow-hidden">
              <div class="p-4 bg-surface-container-low border-b border-surface-variant flex justify-between items-center">
                <div class="flex items-center gap-2">
                  <span class="material-symbols-outlined text-xl text-[#4221b6]">group</span>
                  <h3 class="font-bold text-on-surface text-base">
                    {lang === 'ar' ? 'قائمة الحرفاء المسجلين (MongoDB)' : 'Liste des clients inscrits'}
                  </h3>
                </div>
                <button
                  onClick={fetchClients}
                  class="px-3 py-1.5 rounded-full bg-surface-container-high hover:bg-surface-variant text-xs font-bold text-on-surface flex items-center gap-1 cursor-pointer"
                >
                  <span class="material-symbols-outlined text-sm">refresh</span>
                  <span>{lang === 'ar' ? 'تحديث' : 'Actualiser'}</span>
                </button>
              </div>

              {loadingClients ? (
                <div class="p-12 text-center text-on-surface-variant font-bold">
                  Chargement des clients depuis MongoDB...
                </div>
              ) : (
                <div class="overflow-x-auto">
                  <table class="w-full text-left border-collapse">
                    <thead>
                      <tr class="bg-surface-container-low text-on-surface-variant text-label-bold uppercase tracking-wider text-xs">
                        <th class="p-4 border-b border-surface-variant">Parent</th>
                        <th class="p-4 border-b border-surface-variant">Enfant</th>
                        <th class="p-4 border-b border-surface-variant">Âge</th>
                        <th class="p-4 border-b border-surface-variant">E-mail</th>
                        <th class="p-4 border-b border-surface-variant">Rôle</th>
                        <th class="p-4 border-b border-surface-variant text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-surface-variant">
                      {filteredClients.length > 0 ? (
                        filteredClients.map((client, idx) => (
                          <tr key={client._id || idx} class="hover:bg-surface-container-low transition-colors">
                            <td class="p-4 font-bold text-on-surface flex items-center gap-3">
                              <div class="w-9 h-9 rounded-full bg-[#e0d7ff] text-[#4221b6] flex items-center justify-center font-black text-sm">
                                {(client.parentName || client.email || 'P')[0].toUpperCase()}
                              </div>
                              <div>
                                <span class="block">{client.parentName || 'Parent'}</span>
                                <span class="text-[10px] text-on-surface-variant block">ID: {client._id ? client._id.slice(-6) : idx + 1}</span>
                              </div>
                            </td>
                            <td class="p-4 text-on-surface text-sm font-semibold">{client.childName || 'Non spécifié'}</td>
                            <td class="p-4 text-on-surface-variant text-sm font-medium">{client.childAge || '5 ans'}</td>
                            <td class="p-4 text-on-surface-variant text-sm font-medium">{client.email}</td>
                            <td class="p-4">
                              {/* Clickable Role Pill for Toggle */}
                              <button
                                onClick={() => requestRoleChange(client)}
                                title={lang === 'ar' ? 'انقر لتغيير الرتبة' : 'Cliquer pour changer le rôle'}
                                class={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shadow-sm hover:scale-105 ${client.role === 'admin'
                                  ? 'bg-[#e0d7ff] text-[#4221b6] border border-[#8c90f6] hover:bg-[#d0c2ff]'
                                  : 'bg-[#F4F1EA] text-[#5A6E5E] border border-surface-variant/80 hover:bg-[#e6e2d8]'
                                  }`}
                              >
                                <span class="material-symbols-outlined text-sm">
                                  {client.role === 'admin' ? 'admin_panel_settings' : 'person'}
                                </span>
                                <span>{client.role === 'admin' ? (lang === 'ar' ? 'أدمن' : 'Admin') : (lang === 'ar' ? 'مستخدم عادي' : 'Utilisateur')}</span>
                                <span class="material-symbols-outlined text-xs opacity-60 ml-0.5">swap_horiz</span>
                              </button>
                            </td>
                            <td class="p-4 text-right">
                              <div class="flex items-center justify-end gap-2">
                                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#E8F5E9] text-[#2E7D32]">
                                  <span class="w-2 h-2 rounded-full bg-[#2E7D32]"></span>
                                  Actif
                                </span>

                                {/* Delete User Button */}
                                <button
                                  onClick={() => requestDeleteClient(client)}
                                  title={lang === 'ar' ? 'حذف الحساب' : 'Supprimer le compte'}
                                  class="w-8 h-8 rounded-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition-colors flex items-center justify-center cursor-pointer font-bold shadow-sm hover:scale-105"
                                >
                                  <span class="material-symbols-outlined text-base">delete</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" class="p-8 text-center text-on-surface-variant font-medium">
                            {lang === 'ar' ? 'لا يوجد حرفاء مسجلين حتى الآن' : 'Aucun client enregistré pour le moment.'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Meet Modal */}
      {editingSession && (
        <MeetModal
          session={editingSession}
          onClose={() => setEditingSession(null)}
          onSave={handleSaveMeetLink}
        />
      )}

      {/* Role Change Confirmation Modal */}
      {roleModalData && (
        <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div class="bg-white rounded-3xl p-6 max-w-md w-full relative soft-card-shadow flex flex-col items-center text-center gap-4 border-2 border-[#8c90f6] animate-in fade-in zoom-in duration-200">
            <div class="w-14 h-14 rounded-2xl bg-[#e0d7ff] text-[#4221b6] flex items-center justify-center shadow-inner">
              <span class="material-symbols-outlined text-3xl">admin_panel_settings</span>
            </div>

            <h3 class="text-xl font-extrabold text-[#1c0576]">
              {lang === 'ar' ? 'تأكيد تغيير الرتبة' : 'Changer le rôle du client'}
            </h3>

            <p class="text-xs text-[#5A6E5E] leading-relaxed font-medium">
              {lang === 'ar' ? (
                <>
                  هل أنت تأكد من تغيير رتبة الحريف <strong class="text-black">{roleModalData.client.parentName || roleModalData.client.email}</strong> من{' '}
                  <span class="underline font-bold">{roleModalData.client.role === 'admin' ? 'أدمن' : 'مستخدم عادي'}</span> إلى{' '}
                  <span class="text-[#4221b6] font-bold">{roleModalData.targetRole === 'admin' ? 'أدمن' : 'مستخدم عادي'}</span>؟
                </>
              ) : (
                <>
                  Voulez-vous vraiment changer le rôle de <strong class="text-black">{roleModalData.client.parentName || roleModalData.client.email}</strong> en{' '}
                  <span class="text-[#4221b6] font-bold">{roleModalData.targetRole === 'admin' ? 'Admin' : 'Utilisateur'}</span> ?
                </>
              )}
            </p>

            <div class="flex items-center gap-3 w-full pt-2">
              <button
                type="button"
                onClick={() => setRoleModalData(null)}
                disabled={actionLoading}
                class="flex-1 py-3 rounded-full border border-surface-variant bg-surface-container-low text-on-surface font-bold text-xs hover:bg-surface-container transition-colors cursor-pointer"
              >
                {lang === 'ar' ? 'إلغاء' : 'Annuler'}
              </button>
              <button
                type="button"
                onClick={confirmRoleChange}
                disabled={actionLoading}
                class="flex-1 py-3 rounded-full bg-[#4221b6] hover:bg-[#341a99] text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>{actionLoading ? 'Chargement...' : (lang === 'ar' ? 'تأكيد التغيير' : 'Confirmer')}</span>
                <span class="material-symbols-outlined text-sm">check_circle</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Client Confirmation Modal */}
      {deleteModalData && (
        <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div class="bg-white rounded-3xl p-6 max-w-md w-full relative soft-card-shadow flex flex-col items-center text-center gap-4 border-2 border-red-300 animate-in fade-in zoom-in duration-200">
            <div class="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shadow-inner">
              <span class="material-symbols-outlined text-3xl">warning</span>
            </div>

            <h3 class="text-xl font-extrabold text-red-700">
              {lang === 'ar' ? 'تأكيد حذف الحساب' : 'Supprimer le compte client'}
            </h3>

            <p class="text-xs text-[#5A6E5E] leading-relaxed font-medium">
              {lang === 'ar' ? (
                <>
                  هل أنت تأكد من حذف حساب الحريف <strong class="text-black">{deleteModalData.parentName || deleteModalData.email}</strong> نهائياً من قاعدة البيانات؟ لا يمكن التراجع عن هذا الإجراء.
                </>
              ) : (
                <>
                  Êtes-vous sûr de vouloir supprimer définitivement le compte de <strong class="text-black">{deleteModalData.parentName || deleteModalData.email}</strong> de la base de données ?
                </>
              )}
            </p>

            <div class="flex items-center gap-3 w-full pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalData(null)}
                disabled={actionLoading}
                class="flex-1 py-3 rounded-full border border-surface-variant bg-surface-container-low text-on-surface font-bold text-xs hover:bg-surface-container transition-colors cursor-pointer"
              >
                {lang === 'ar' ? 'إلغاء' : 'Annuler'}
              </button>
              <button
                type="button"
                onClick={confirmDeleteClient}
                disabled={actionLoading}
                class="flex-1 py-3 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>{actionLoading ? 'Suppression...' : (lang === 'ar' ? 'حذف نهائياً' : 'Supprimer')}</span>
                <span class="material-symbols-outlined text-sm">delete_forever</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
