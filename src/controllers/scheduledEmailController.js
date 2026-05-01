const prisma = require('../lib/prisma');
const AppError = require('../utils/appError');

/**
 * POST /api/scheduled-emails
 * Body: { to, toName?, subject, htmlBody, scheduledAt }
 */
const createScheduledEmail = async (req, res, next) => {
  try {
    const { to, toName, subject, htmlBody, scheduledAt } = req.body;

    if (!to || !subject || !htmlBody || !scheduledAt)
      return next(new AppError('to, subject, htmlBody, and scheduledAt are required.', 400));

    const scheduledDate = new Date(scheduledAt);
    if (isNaN(scheduledDate.getTime()) || scheduledDate <= new Date())
      return next(new AppError('scheduledAt must be a valid future date/time.', 400));

    const email = await prisma.scheduledEmail.create({
      data: {
        tenantId:    req.user.tenantId,
        createdById: req.user.id,
        to,
        toName:      toName || '',
        subject,
        htmlBody,
        scheduledAt: scheduledDate,
      },
    });

    res.status(201).json({ status: 'success', data: { email } });
  } catch (err) { next(err); }
};

/**
 * GET /api/scheduled-emails
 * Returns all scheduled emails for this tenant, newest first.
 */
const getScheduledEmails = async (req, res, next) => {
  try {
    const emails = await prisma.scheduledEmail.findMany({
      where: { tenantId: req.user.tenantId },
      orderBy: { scheduledAt: 'asc' },
    });
    res.json({ status: 'success', data: { emails } });
  } catch (err) { next(err); }
};

/**
 * DELETE /api/scheduled-emails/:id
 * Cancel a PENDING scheduled email (marks as CANCELLED, does NOT delete).
 */
const cancelScheduledEmail = async (req, res, next) => {
  try {
    const existing = await prisma.scheduledEmail.findFirst({
      where: { id: req.params.id, tenantId: req.user.tenantId },
    });

    if (!existing) return next(new AppError('Scheduled email not found.', 404));
    if (existing.status !== 'PENDING')
      return next(new AppError(`Cannot cancel a ${existing.status} email.`, 400));

    await prisma.scheduledEmail.update({
      where: { id: existing.id },
      data:  { status: 'CANCELLED' },
    });

    res.status(204).send();
  } catch (err) { next(err); }
};

module.exports = { createScheduledEmail, getScheduledEmails, cancelScheduledEmail };
