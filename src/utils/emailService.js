const axios = require('axios');

/**
 * Send an email via Brevo.
 * @param {string} toEmail
 * @param {string} toName
 * @param {string} subject
 * @param {string} htmlContent
 * @param {Array}  attachments  - Optional: [{ name: 'invoice.pdf', content: '<base64string>' }]
 */
const sendEmail = async (toEmail, toName, subject, htmlContent, attachments = []) => {
  if (process.env.EMAIL_PROVIDER !== 'brevo') {
    console.warn('Email provider is not configured as brevo. Skipping email send.');
    return;
  }

  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL || 'noreply@traincapetech.in';
  const senderName = process.env.BREVO_SENDER_NAME || 'Second Police CRM';

  const payload = {
    sender: { name: senderName, email: senderEmail },
    to: [{ email: toEmail, name: toName }],
    subject,
    htmlContent,
  };

  if (attachments.length > 0) {
    payload.attachment = attachments; // Brevo expects: [{ name, content (base64) }]
  }

  try {
    const response = await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      payload,
      {
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error sending email:', error.response?.data || error.message);
    throw new Error('Failed to send email. Please try again.');
  }
};

module.exports = { sendEmail };
