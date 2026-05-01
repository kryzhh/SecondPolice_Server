const express = require('express');
const { runScheduledEmails } = require('../controllers/jobController');

const router = express.Router();

// No JWT — secured by x-cron-secret header instead
router.post('/run-scheduled-emails', runScheduledEmails);

module.exports = router;
