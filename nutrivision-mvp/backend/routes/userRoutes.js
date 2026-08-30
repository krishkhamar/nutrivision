const express = require('express');
const router = express.Router();
const { signup, login, googleLogin, saveBiometrics } = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

// Public User/Auth Routes
router.post('/google-login', googleLogin);
router.post('/signup', signup);
router.post('/login', login);

// Protected Biometrics Routes
router.post('/biometrics', authMiddleware, saveBiometrics);
router.put('/biometrics', authMiddleware, saveBiometrics);

module.exports = router;
