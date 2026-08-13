const mongoose = require('mongoose');

const navSettingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: 'nav_titles',
      unique: true,
    },
    nav: {
      fr: {
        home: { type: String, default: 'Accueil' },
        dashboard: { type: String, default: 'Espace Élève' },
        parent: { type: String, default: 'Espace Parent' },
        calendar: { type: String, default: 'Calendrier' },
        admin: { type: String, default: 'Admin' },
      },
      ar: {
        home: { type: String, default: 'الرئيسية' },
        dashboard: { type: String, default: 'لوحة الطالب' },
        parent: { type: String, default: 'فضاء الوليّ' },
        calendar: { type: String, default: 'التقويم' },
        admin: { type: String, default: 'الإدارة' },
      },
      en: {
        home: { type: String, default: 'Home' },
        dashboard: { type: String, default: 'Student Space' },
        parent: { type: String, default: 'Parent Space' },
        calendar: { type: String, default: 'Schedule' },
        admin: { type: String, default: 'Admin' },
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('NavSettings', navSettingsSchema);
