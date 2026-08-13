const mongoose = require('mongoose');

const sectionSettingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: 'home_sections',
      unique: true,
    },
    sections: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SectionSettings', sectionSettingsSchema);
