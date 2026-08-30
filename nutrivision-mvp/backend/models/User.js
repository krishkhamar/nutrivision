const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: function () {
        return !this.isGoogleAccount;
      },
    },
    googleId: {
      type: String,
    },
    isGoogleAccount: {
      type: Boolean,
      default: false,
    },
    dob: {
      type: Date,
    },
    age: {
      type: Number,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      default: 'male',
    },
    height: {
      type: Number, // in cm
    },
    currentWeight: {
      type: Number, // in kg
    },
    targetWeight: {
      type: Number, // in kg
    },
    pathway: {
      type: String, // e.g., 'Diet Deficit Only', 'Cardio Focus', 'Gym Training Only', 'Gym + Diet Balance', 'Cardio + Gym + Diet (Hybrid)'
    },
    activityLevel: {
      type: Number, // e.g., 1.2, 1.375, 1.55, 1.725
      default: 1.2,
    },
    dietaryPreference: {
      type: String, // e.g., 'Vegetarian', 'Vegan', 'Non-Veg', 'Eggetarian', 'Jain'
    },
    workoutFrequency: {
      type: String, // e.g., '1-2 days/week', '3-4 days/week', '5-6 days/week', 'Everyday'
    },
    medicalConditions: {
      type: String, // Notes or health conditions
    },
    bmr: {
      type: Number,
    },
    tdee: {
      type: Number,
    },
    dailyCalorieTarget: {
      type: Number,
    },
    bmi: { type: Number },
    goalPlan: {
      id: String,
      label: String,
      direction: { type: String, enum: ['loss', 'gain', 'maintenance'] },
      dailyAdjustment: Number,
      estimatedDays: Number,
      targetDate: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving if present and modified
UserSchema.pre('save', async function (next) {
  if (!this.password || !this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare entered password with hashed password
UserSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
