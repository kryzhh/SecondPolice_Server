const express = require('express');
const announcementController = require('../controllers/announcementController');
const { authenticate } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authenticate);

router.route('/')
  .get(announcementController.getAnnouncements)
  .post(announcementController.createAnnouncement);

router.route('/:id')
  .put(announcementController.updateAnnouncement)
  .delete(announcementController.deleteAnnouncement);

module.exports = router;
