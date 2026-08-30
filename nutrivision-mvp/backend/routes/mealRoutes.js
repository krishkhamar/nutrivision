const router = require('express').Router();
const auth = require('../middleware/auth');
const meals = require('../controllers/mealController');
router.use(auth);
router.get('/', meals.listToday);
router.post('/', meals.create);
router.delete('/:id', meals.remove);
module.exports = router;
