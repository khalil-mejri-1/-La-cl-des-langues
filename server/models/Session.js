const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    studentName: {
      type: String,
      trim: true,
      default: '',
    },
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
    studentEmail: {
      type: String,
      trim: true,
      default: '',
    },
    studentId: {
      type: String,
      default: '',
    },
    teacherId: {
      type: String,
      default: '',
    },
    teacherName: {
      type: String,
      trim: true,
      default: '',
    },
    teacherEmail: {
      type: String,
      trim: true,
      default: '',
    },
    day: {
      type: String,
      required: true,
    },
    time: {
      type: String,
      required: true,
    },
    datetime: {
      type: String,
      default: '',
    },
    subject: {
      type: String,
      default: 'Français & Arabe (Séance d\'essai)',
    },
    status: {
      type: String,
      enum: ['pending', 'meet_added', 'completed', 'done', 'cancelled'],
      default: 'pending',
    },
    meetUrl: {
      type: String,
      default: '',
    },
    paymentMethod: {
      type: String,
      default: 'card',
    },
    packId: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Session', sessionSchema);
