const express = require('express');
const router = express.Router();

const { updateProfile, changePassword } = require('../controllers/profileController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(protect);

router.put('/', upload.single('avatar'), updateProfile);
router.put('/password', changePassword);

module.exports = router;
