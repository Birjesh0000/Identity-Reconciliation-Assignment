const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema(
  {
    phoneNumber: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    linkedId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contact',
      default: null,
    },
    linkPrecedence: {
      type: String,
      enum: ['primary', 'secondary'],
      default: 'primary',
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
contactSchema.index({ email: 1 });
contactSchema.index({ phoneNumber: 1 });
contactSchema.index({ linkedId: 1 });

module.exports = mongoose.model('Contact', contactSchema);
