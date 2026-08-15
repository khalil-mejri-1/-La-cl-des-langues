const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    parentName: {
      type: String,
      trim: true,
      default: '',
    },
    childName: {
      type: String,
      trim: true,
      default: '',
    },
    childAge: {
      type: String,
      trim: true,
      default: '',
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      default: 'user',
    },
    status: {
      type: String,
      default: 'Actif',
    },
    availableDays: {
      type: Array,
      default: () => ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
    },
    timeSlots: {
      type: Array,
      default: [],
    },
    subject: {
      type: String,
      default: 'Français & Arabe',
    },
    blockedDates: {
      type: Array,
      default: [],
    },
    blockedSlots: {
      type: Array,
      default: [],
    },
    customDaySlots: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
