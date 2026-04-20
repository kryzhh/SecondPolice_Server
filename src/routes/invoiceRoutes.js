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

// Middleware: ADMIN OR any role with "Invoices: Read & Write"
const requireInvoiceWrite = (req, res, next) => {
  if (req.user.role === 'ADMIN') return next();
  const perms = req.user.permissions || {};
  if (perms['Invoices'] === 'Read & Write') return next();
  return res.status(403).json({ status: 'fail', message: 'You do not have permission to perform this action.' });
};

// Routes
router.get('/',          authenticate, invoiceController.getInvoices);
router.get('/:id',       authenticate, invoiceController.getInvoice);
router.get('/:id/pdf',   authenticateWithQuery, invoiceController.getInvoicePDF);

// Write operations — Admin OR Invoices Read & Write
router.post('/:id/send', authenticate, requireInvoiceWrite, invoiceController.sendInvoice);
router.patch('/:id',     authenticate, requireInvoiceWrite, invoiceController.updateInvoice);
router.delete('/:id',    authenticate, requireInvoiceWrite, invoiceController.deleteInvoice);

module.exports = router;

