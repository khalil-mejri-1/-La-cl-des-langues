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
      enum: ['user', 'admin'],
      default: 'user',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
