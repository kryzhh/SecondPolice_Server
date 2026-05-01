const express = require('express');
const { authenticate } = require('../middlewares/authMiddleware');
const {
  createScheduledEmail,
  getScheduledEmails,
  cancelScheduledEmail,
} = require('../controllers/scheduledEmailController');

const router = express.Router();
router.use(authenticate);

router.post('/',     createScheduledEmail);
router.get('/',      getScheduledEmails);
router.delete('/:id', cancelScheduledEmail);

module.exports = router;
