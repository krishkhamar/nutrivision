const User = require('../models/User');
const DailyLog = require('../models/DailyLog');

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

    try {
      const Meal = require('../models/Meal');
      if (Meal) {
        const todayMeals = await Meal.find({ userId, date: todayStr });
        todayMeals.forEach((m) => {
          nutritionSummary.caloriesConsumed += m.calories || 0;
          nutritionSummary.protein += m.protein || 0;
          nutritionSummary.carbs += m.carbs || 0;
          nutritionSummary.fats += m.fats || 0;
        });
      }
    } catch (e) {
      // Meal model not defined yet, fallback to default nutrition summary
    }

    const rawName = user.name || user.email?.split('@')[0] || 'User';
    const userName = rawName.charAt(0).toUpperCase() + rawName.slice(1);

    res.json({
      user: {
        name: userName,
        email: user.email,
        dailyCalorieTarget: user.dailyCalorieTarget || 2100,
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
