const express = require('express');
const authController = require('../controllers/authController');

const { authenticate } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/register-tenant', authController.register);
router.post('/login', authController.login);
router.get('/me', authenticate, authController.getMe);

module.exports = router;
