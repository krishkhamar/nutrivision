const router = require('express').Router();
const multer = require('multer');
const auth = require('../middleware/auth');
const { scan } = require('../controllers/foodController');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 }, fileFilter: (req, file, cb) => cb(null, ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) });
router.post('/scan', auth, upload.single('image'), scan);
module.exports = router;
