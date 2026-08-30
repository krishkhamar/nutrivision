const mongoose = require('mongoose');

const mealSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  date: { type: String, required: true, index: true },
  name: { type: String, required: true, trim: true },
  mealType: { type: String, enum: ['breakfast', 'lunch', 'dinner', 'snack'], default: 'snack' },
  calories: { type: Number, required: true, min: 0 },
  protein: { type: Number, default: 0, min: 0 },
  carbs: { type: Number, default: 0, min: 0 },
  fats: { type: Number, default: 0, min: 0 },
}, { timestamps: true });

mealSchema.index({ userId: 1, date: 1 });
module.exports = mongoose.model('Meal', mealSchema);
