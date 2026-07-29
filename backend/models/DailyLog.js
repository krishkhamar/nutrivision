const mongoose = require('mongoose');

const dailyLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true }, // Format: 'YYYY-MM-DD'
    waterIntake: { type: Number, default: 0 }, // In Liters (e.g. 1.75)
    steps: { type: Number, default: 0 },
    mood: { type: String, default: '😊' },
    caloriesBurned: { type: Number, default: 0 },
  },
  { timestamps: true }
);

dailyLogSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailyLog', dailyLogSchema);
