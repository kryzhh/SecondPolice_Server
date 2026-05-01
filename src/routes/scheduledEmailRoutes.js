const express = require('express');
const { authenticate } = require('../middlewares/authMiddleware');
const {
  createScheduledEmail,
  getScheduledEmails,
  cancelScheduledEmail,
  updateScheduledEmail,
  hardDeleteScheduledEmail,
} = require('../controllers/scheduledEmailController');

const router = express.Router();
router.use(authenticate);

router.post('/',              createScheduledEmail);
router.get('/',               getScheduledEmails);
router.patch('/:id',          updateScheduledEmail);
router.delete('/:id',         cancelScheduledEmail);
router.delete('/:id/hard',    hardDeleteScheduledEmail);

module.exports = router;
