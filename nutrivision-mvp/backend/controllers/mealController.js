const Meal = require('../models/Meal');

// Use the device/server's local calendar day so meal logging and the dashboard
// never split a late-night meal across different UTC dates.
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const numeric = (value) => Number.isFinite(Number(value)) && Number(value) >= 0;

exports.listToday = async (req, res) => {
  try {
    const meals = await Meal.find({ userId: req.user.id, date: req.query.date || today() }).sort({ createdAt: -1 });
    res.json({ meals });
  } catch (error) { res.status(500).json({ message: 'Unable to load meals' }); }
};

exports.create = async (req, res) => {
  try {
    const { name, mealType, calories, protein = 0, carbs = 0, fats = 0, date } = req.body;
    if (!name?.trim() || !numeric(calories) || ![protein, carbs, fats].every(numeric)) {
      return res.status(400).json({ message: 'Provide a meal name and valid non-negative nutrition values.' });
    }
    const meal = await Meal.create({ userId: req.user.id, date: date || today(), name: name.trim(), mealType, calories: Number(calories), protein: Number(protein), carbs: Number(carbs), fats: Number(fats) });
    res.status(201).json({ meal });
  } catch (error) { res.status(500).json({ message: 'Unable to save meal' }); }
};

exports.remove = async (req, res) => {
  try {
    const meal = await Meal.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!meal) return res.status(404).json({ message: 'Meal not found' });
    res.json({ message: 'Meal removed' });
  } catch (error) { res.status(400).json({ message: 'Invalid meal id' }); }
};
