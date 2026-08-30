const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Helper to generate JWT Token
const generateToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET must be configured');
  }
  return jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Strict email validator function
// Requires a realistic username (at least 2 valid characters), valid @ domain, and a 2+ letter top-level domain
const isValidEmailFormat = (email) => {
  const emailRegex = /^[a-zA-Z0-9._%+-]{2,}@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

// @desc    Register new user
// @route   POST /api/auth/signup or /api/user/signup
// @access  Public
exports.signup = async (req, res) => {
  try {
    const { name, email, password, dob, age, height, currentWeight, targetWeight, pathway, gender, activityLevel } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const cleanEmail = email.toLowerCase().trim();

    // 1. Strict email validation check
    if (!isValidEmailFormat(cleanEmail)) {
      return res.status(400).json({ message: 'Please enter a valid email address (e.g. name@example.com)' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Create user instance
    const user = new User({
      name,
      email: cleanEmail,
      password,
      dob,
      age,
      height,
      currentWeight,
      targetWeight,
      pathway,
      gender,
      activityLevel,
    });

    await user.save();

    const token = generateToken(user);

    const userObj = user.toObject();
    delete userObj.password;

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: userObj,
    });
  } catch (error) {
    console.error('Signup Error:', error);
    res.status(500).json({ message: 'Server error during signup', error: error.message });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login or /api/user/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const cleanEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user);

    const userObj = user.toObject();
    delete userObj.password;

    res.json({
      message: 'Login successful',
      token,
      user: userObj,
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Server error during login', error: error.message });
  }
};

// @desc    Google OAuth login or registration
// @route   POST /api/user/google-login or /api/auth/google-login
// @access  Public
exports.googleLogin = async (req, res) => {
  try {
    const { email, googleId, name } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required for Google login' });
    }

    const emailLower = email.toLowerCase().trim();
    let user = await User.findOne({ email: emailLower });
    let isNewUser = false;

    if (user) {
      // User exists
      if (!user.googleId && googleId) {
        user.googleId = googleId;
        user.isGoogleAccount = true;
        await user.save();
      }
      // Determine if biometrics are already configured
      const hasBiometrics = Boolean(user.dailyCalorieTarget || user.age);
      isNewUser = !hasBiometrics;
    } else {
      // User does not exist: create user document
      isNewUser = true;
      user = new User({
        email: emailLower,
        name: name || '',
        googleId: googleId || '',
        isGoogleAccount: true,
      });
      await user.save();
    }

    const token = generateToken(user);

    const userObj = user.toObject();
    delete userObj.password;

    return res.status(isNewUser ? 201 : 200).json({
      message: isNewUser ? 'Google registration successful' : 'Google login successful',
      token,
      user: userObj,
      isNewUser,
    });
  } catch (error) {
    console.error('Google Login Error:', error);
    return res.status(500).json({ message: 'Server error during Google login', error: error.message });
  }
};

// @desc    Calculate BMR, TDEE, & dailyCalorieTarget using Mifflin-St Jeor and save to DB
// @route   POST /api/auth/biometrics or /api/user/biometrics
// @access  Private (Protected)
exports.saveBiometrics = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { dob, age, height, currentWeight, targetWeight, pathway, gender, activityLevel, dietaryPreference, workoutFrequency, medicalConditions, goalPlan } = req.body;

    // Use passed values or fall back to user's existing values
    const weight = currentWeight !== undefined ? currentWeight : user.currentWeight;
    const h = height !== undefined ? height : user.height;
    const a = age !== undefined ? age : user.age;
    const g = gender || user.gender || 'male';
    const act = activityLevel !== undefined ? activityLevel : (user.activityLevel || 1.2);
    const p = pathway || user.pathway || 'maintenance';
    const tWeight = targetWeight !== undefined ? targetWeight : user.targetWeight;

    if (!weight || !h || !a) {
      return res.status(400).json({
        message: 'age, height, and currentWeight are required to calculate biometrics',
      });
    }

    // Mifflin-St Jeor Equation:
    // BMR = 10 * weight(kg) + 6.25 * height(cm) - 5 * age(y) + s
    // s = +5 for male, -161 for female
    let genderOffset = 5;
    if (typeof g === 'string' && g.toLowerCase() === 'female') {
      genderOffset = -161;
    }
    const bmr = Math.round(10 * weight + 6.25 * h - 5 * a + genderOffset);

    // Resolve activity factor multiplier
    let factor = 1.2;
    if (typeof act === 'number') {
      factor = act;
    } else if (typeof act === 'string') {
      const parsedFactor = parseFloat(act);
      if (!isNaN(parsedFactor)) {
        factor = parsedFactor;
      } else {
        const actStr = act.toLowerCase();
        if (actStr.includes('sedentary')) factor = 1.2;
        else if (actStr.includes('light')) factor = 1.375;
        else if (actStr.includes('moderate')) factor = 1.55;
        else if (actStr.includes('very') || actStr.includes('active')) factor = 1.725;
        else if (actStr.includes('extra')) factor = 1.9;
      }
    }

    // Total Daily Energy Expenditure (TDEE)
    const tdee = Math.round(bmr * factor);

    const bmi = Number((weight / ((h / 100) ** 2)).toFixed(1));
    const weightDifference = Number(tWeight) - Number(weight);
    const direction = weightDifference < -0.05 ? 'loss' : weightDifference > 0.05 ? 'gain' : 'maintenance';

    // A chosen goal plan takes priority. Its adjustment is bounded to avoid an
    // unrealistic daily calorie recommendation; pathway is retained as a fallback.
    let calorieAdjustment = 0;
    if (goalPlan && Number.isFinite(Number(goalPlan.dailyAdjustment))) {
      const maximum = direction === 'gain' ? 500 : direction === 'loss' ? 750 : 0;
      calorieAdjustment = direction === 'maintenance' ? 0 : Math.min(maximum, Math.abs(Math.round(Number(goalPlan.dailyAdjustment)))) * (direction === 'loss' ? -1 : 1);
    } else {
      const pathwayLower = String(p).toLowerCase();
      if (pathwayLower.includes('extreme') && pathwayLower.includes('loss')) calorieAdjustment = -750;
      else if (pathwayLower.includes('loss') || pathwayLower.includes('lose') || pathwayLower.includes('deficit')) calorieAdjustment = -500;
      else if (pathwayLower.includes('hybrid') || pathwayLower.includes('recomp') || pathwayLower.includes('balance')) calorieAdjustment = -250;
      else if (pathwayLower.includes('gain')) calorieAdjustment = 500;
    }

    const dailyCalorieTarget = Math.max(1200, Math.round(tdee + calorieAdjustment));
    const estimatedDays = calorieAdjustment === 0 ? 0 : Math.ceil((Math.abs(weightDifference) * 7700) / Math.abs(calorieAdjustment));
    const savedGoalPlan = goalPlan ? {
      id: goalPlan?.id || `${direction}-default`,
      label: goalPlan?.label || (direction === 'maintenance' ? 'Maintenance' : 'Balanced plan'),
      direction,
      dailyAdjustment: calorieAdjustment,
      estimatedDays,
      targetDate: estimatedDays ? new Date(Date.now() + estimatedDays * 24 * 60 * 60 * 1000) : null,
    } : user.goalPlan;

    // Update user profile fields
    if (dob !== undefined) user.dob = dob;
    user.age = a;
    user.height = h;
    user.currentWeight = weight;
    if (tWeight !== undefined) user.targetWeight = tWeight;
    user.pathway = p;
    user.gender = g;
    user.activityLevel = factor;
    if (dietaryPreference !== undefined) user.dietaryPreference = dietaryPreference;
    if (workoutFrequency !== undefined) user.workoutFrequency = workoutFrequency;
    if (medicalConditions !== undefined) user.medicalConditions = medicalConditions;
    user.bmr = bmr;
    user.tdee = tdee;
    user.dailyCalorieTarget = dailyCalorieTarget;
    user.bmi = bmi;
    if (goalPlan) user.goalPlan = savedGoalPlan;

    await user.save();

    const userObj = user.toObject();
    delete userObj.password;

    res.json({
      message: 'Biometrics updated successfully',
      biometrics: {
        bmr,
        tdee,
        dailyCalorieTarget,
        bmi,
        goalPlan: savedGoalPlan,
      },
      user: userObj,
    });
  } catch (error) {
    console.error('Save Biometrics Error:', error);
    res.status(500).json({ message: 'Server error during biometrics calculation', error: error.message });
  }
};
