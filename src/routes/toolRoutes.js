const express = require('express');
const { getOrCreateSession, generateInvoice, createCheckout, verifyPayment, downloadInvoice } = require('../controllers/toolController');

const router = express.Router();

router.post('/auth/session', getOrCreateSession);
router.post('/invoice/generate', generateInvoice);
router.get('/invoice/download/:id', downloadInvoice);
router.post('/checkout', createCheckout);
router.post('/verify-payment', verifyPayment);

module.exports = router;
