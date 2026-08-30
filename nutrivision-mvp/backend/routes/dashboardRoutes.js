const express = require('express');
const router = express.Router();
const {
  getTodayDashboard,
  getHistory,
  logWater,
  updateMood,
} = require('../controllers/dashboardController');
const authMiddleware = require('../middleware/auth');

// All dashboard routes are protected by JWT auth middleware
router.get('/today', authMiddleware, getTodayDashboard);
router.get('/history', authMiddleware, getHistory);
router.post('/water', authMiddleware, logWater);
router.post('/mood', authMiddleware, updateMood);

module.exports = router;
