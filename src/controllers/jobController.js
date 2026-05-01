const prisma = require('../lib/prisma');
const { sendEmail } = require('../utils/emailService');

/**
 * POST /api/jobs/run-scheduled-emails
 *
 * Secured by the x-cron-secret header (NOT JWT).
 * Called externally by cron-job.org every minute.
 *
 * Finds all PENDING emails whose scheduledAt <= now,
 * sends them via Brevo, marks SENT or FAILED.
 */
const runScheduledEmails = async (req, res) => {
  // ── Auth: validate the cron secret header ─────────────────────────────────
  const secret = req.headers['x-cron-secret'];
  if (!secret || secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ status: 'fail', message: 'Unauthorized.' });
  }

  const now = new Date();

  // ── Find all PENDING emails that are due ───────────────────────────────────
  const due = await prisma.scheduledEmail.findMany({
    where: {
      status:      'PENDING',
      scheduledAt: { lte: now },
    },
    take: 50, // safety cap — process max 50 at once
  });

  if (due.length === 0) {
    return res.json({ status: 'success', processed: 0, sent: 0, failed: 0 });
  }

  let sent = 0, failed = 0;

  await Promise.all(
    due.map(async (email) => {
      try {
        await sendEmail(email.to, email.toName || email.to, email.subject, email.htmlBody);

        await prisma.scheduledEmail.update({
          where: { id: email.id },
          data:  { status: 'SENT', sentAt: new Date() },
        });
        sent++;
      } catch (err) {
        console.error(`[ScheduledEmail] Failed to send ${email.id}:`, err.message);
        await prisma.scheduledEmail.update({
          where: { id: email.id },
          data:  { status: 'FAILED', errorMsg: err.message },
        });
        failed++;
      }
    })
  );

  console.log(`[ScheduledEmail] Processed ${due.length} — sent: ${sent}, failed: ${failed}`);
  res.json({ status: 'success', processed: due.length, sent, failed });
};

module.exports = { runScheduledEmails };
