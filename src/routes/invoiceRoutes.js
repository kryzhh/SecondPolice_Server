const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const invoiceController = require('../controllers/invoiceController');
const { authenticate, restrictTo } = require('../middlewares/authMiddleware');

// Auth middleware that also accepts ?token= query param (for new-tab PDF viewing)
const authenticateWithQuery = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.query.token) {
      token = req.query.token;
    }
    if (!token) return res.status(401).json({ status: 'fail', message: 'Not authenticated.' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const currentUser = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { tenant: true },
    });
    if (!currentUser) return res.status(401).json({ status: 'fail', message: 'User not found.' });

    req.user = {
      id: currentUser.id,
      role: currentUser.role,
      tenantId: currentUser.tenantId,
      tenantName: currentUser.tenant.name,
    };
    next();
  } catch (err) {
    return res.status(401).json({ status: 'fail', message: 'Invalid or expired token.' });
  }
};

// Routes
router.get('/',          authenticate, invoiceController.getInvoices);
router.get('/:id',       authenticate, invoiceController.getInvoice);
router.get('/:id/pdf',   authenticateWithQuery, invoiceController.getInvoicePDF);

// Admin-only mutations
router.post('/:id/send', authenticate, restrictTo('ADMIN'), invoiceController.sendInvoice);
router.patch('/:id',     authenticate, restrictTo('ADMIN'), invoiceController.updateInvoice);
router.delete('/:id',    authenticate, restrictTo('ADMIN'), invoiceController.deleteInvoice);

module.exports = router;

