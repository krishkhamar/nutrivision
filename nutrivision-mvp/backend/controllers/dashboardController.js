const User = require('../models/User');
const DailyLog = require('../models/DailyLog');
const mongoose = require('mongoose');

// Helper to get date string in 'YYYY-MM-DD' format
const getTodayDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper to get or create today's DailyLog document for user
const getOrCreateTodayLog = async (userId, dateStr) => {
  let dailyLog = await DailyLog.findOne({ userId, date: dateStr });
  if (!dailyLog) {
    dailyLog = new DailyLog({
      userId,
      date: dateStr,
      waterIntake: 0,
      steps: 0,
      mood: '😊',
      caloriesBurned: 0,
    });
    await dailyLog.save();
  }
  return dailyLog;
};

// @desc    Get consolidated today's dashboard metrics
// @route   GET /api/dashboard/today
// @access  Private
exports.getTodayDashboard = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const todayStr = getTodayDateString();
    const dailyLog = await getOrCreateTodayLog(userId, todayStr);

    // Nutrition macros summary (defaults to 0, or sums Meal documents if Meal model exists)
    let nutritionSummary = {
      caloriesConsumed: 0,
      protein: 0,
      carbs: 0,
      fats: 0,
    };

    const Meal = require('../models/Meal');
    // Production JWT user IDs are ObjectIds; preserving this guard keeps controller tests
    // and non-database mocks from issuing invalid Mongoose queries.
    let todayMeals = [];
    if (mongoose.isValidObjectId(userId)) {
      // Repair only meals created after this local midnight by the earlier UTC-date
      // implementation, so they immediately appear in today's dashboard.
      const localMidnight = new Date();
      localMidnight.setHours(0, 0, 0, 0);
      await Meal.updateMany(
        { userId, createdAt: { $gte: localMidnight }, date: { $ne: todayStr } },
        { $set: { date: todayStr } }
      );
      todayMeals = await Meal.find({ userId, date: todayStr });
    }
    todayMeals.forEach((m) => {
      nutritionSummary.caloriesConsumed += m.calories || 0;
      nutritionSummary.protein += m.protein || 0;
      nutritionSummary.carbs += m.carbs || 0;
      nutritionSummary.fats += m.fats || 0;
    });

    const rawName = user.name || user.email?.split('@')[0] || 'User';
    const userName = rawName.charAt(0).toUpperCase() + rawName.slice(1);

    res.json({
      user: {
        name: userName,
        email: user.email,
        dailyCalorieTarget: user.dailyCalorieTarget || 2100,
        bmr: user.bmr,
        tdee: user.tdee,
        bmi: user.bmi,
        currentWeight: user.currentWeight,
        targetWeight: user.targetWeight,
        goalPlan: user.goalPlan,
      },
      dailyLog: {
        waterIntake: dailyLog.waterIntake,
        steps: dailyLog.steps,
        mood: dailyLog.mood,
        caloriesBurned: dailyLog.caloriesBurned,
      },
      nutrition: nutritionSummary,
    });
  } catch (error) {
    console.error('Get Today Dashboard Error:', error);
    res.status(500).json({ message: 'Server error fetching dashboard data', error: error.message });
  }
};

// @desc    Return daily meal and activity history for the Progress screen
// @route   GET /api/dashboard/history?days=14
// @access  Private
exports.getHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const days = Math.min(60, Math.max(7, Number.parseInt(req.query.days, 10) || 14));
    const dates = Array.from({ length: days }, (_, index) => {
      const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - (days - 1 - index));
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    });
    const Meal = require('../models/Meal');
    const [meals, logs] = mongoose.isValidObjectId(userId)
      ? await Promise.all([Meal.find({ userId, date: { $in: dates } }), DailyLog.find({ userId, date: { $in: dates } })])
      : [[], []];
    const mealTotals = new Map();
    meals.forEach((meal) => {
      const total = mealTotals.get(meal.date) || { calories: 0, protein: 0, carbs: 0, fats: 0 };
      total.calories += meal.calories || 0; total.protein += meal.protein || 0; total.carbs += meal.carbs || 0; total.fats += meal.fats || 0;
      mealTotals.set(meal.date, total);
    });
    const logsByDate = new Map(logs.map((log) => [log.date, log]));
    const dailyCalorieTarget = user.dailyCalorieTarget || 2100;
    res.json({ history: dates.map((date) => {
      const food = mealTotals.get(date) || { calories: 0, protein: 0, carbs: 0, fats: 0 };
      const log = logsByDate.get(date);
      return { date, ...food, target: dailyCalorieTarget, difference: food.calories - dailyCalorieTarget, caloriesBurned: log?.caloriesBurned || 0, waterIntake: log?.waterIntake || 0, steps: log?.steps || 0, mood: log?.mood || null };
    }) });
  } catch (error) {
    console.error('Get History Error:', error);
    res.status(500).json({ message: 'Server error fetching history' });
  }
};

// @desc    Increment or decrement water intake for today
// @route   POST /api/dashboard/water
// @access  Private
exports.logWater = async (req, res) => {
  try {
    const userId = req.user.id;
    const amount = typeof req.body.amount === 'number' ? req.body.amount : 0.25;

    const todayStr = getTodayDateString();
    const dailyLog = await getOrCreateTodayLog(userId, todayStr);

    const calculatedWater = parseFloat((dailyLog.waterIntake + amount).toFixed(2));
    dailyLog.waterIntake = Math.max(0, calculatedWater);
    await dailyLog.save();

    res.json({
      message: 'Water updated successfully',
      waterIntake: dailyLog.waterIntake,
      dailyLog,
    });
  } catch (error) {
    console.error('Log Water Error:', error);
    res.status(500).json({ message: 'Server error updating water intake', error: error.message });
  }
};

exports.updateWaterIntake = exports.logWater;

// @desc    Update mood for today
// @route   POST /api/dashboard/mood
// @access  Private
exports.updateMood = async (req, res) => {
  try {
    const userId = req.user.id;
    const { mood } = req.body;

    if (!mood) {
      return res.status(400).json({ message: 'Mood is required' });
    }

    const todayStr = getTodayDateString();
    const dailyLog = await getOrCreateTodayLog(userId, todayStr);

    dailyLog.mood = mood;
    await dailyLog.save();

    res.json({
      message: 'Mood updated successfully',
      mood: dailyLog.mood,
      dailyLog,
    });
  } catch (error) {
    console.error('Update Mood Error:', error);
    res.status(500).json({ message: 'Server error updating mood', error: error.message });
  }
};
