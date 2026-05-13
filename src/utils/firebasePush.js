const admin = require('firebase-admin');
const prisma = require('../lib/prisma');
const path = require('path');

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    let serviceAccount;
    // Check if path is provided
    if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      // Resolve path relative to the current working directory or make it absolute
      const accountPath = path.isAbsolute(process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
        ? process.env.FIREBASE_SERVICE_ACCOUNT_PATH
        : path.resolve(process.cwd(), process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
      serviceAccount = require(accountPath);
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
      serviceAccount = JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8'));
    }

    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log('Firebase Admin initialized successfully');
    } else {
      console.warn('Firebase Admin not initialized: Missing FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_SERVICE_ACCOUNT_BASE64 in .env');
    }
  } catch (error) {
    console.error('Failed to initialize Firebase Admin:', error);
  }
}

/**
 * Sends a push notification to a user's registered FCM token
 * @param {string} userId - The ID of the user to send the push to
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Optional custom data payload
 */
const sendPushNotification = async (userId, title, body, data = {}) => {
  try {
    if (!admin.apps.length) {
      return; // Silently ignore if not configured
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { fcmToken: true }
    });

    if (!user || !user.fcmToken) {
      return; // No token registered for this user
    }

    const message = {
      notification: {
        title,
        body
      },
      data: {
        ...data,
        click_action: data.linkUrl || '/'
      },
      token: user.fcmToken
    };

    const response = await admin.messaging().send(message);
    return response;
  } catch (error) {
    console.error(`Error sending FCM push to user ${userId}:`, error.message);
    
    // If the token is invalid or unregistered, remove it
    if (
      error.code === 'messaging/invalid-registration-token' ||
      error.code === 'messaging/registration-token-not-registered'
    ) {
      await prisma.user.update({
        where: { id: userId },
        data: { fcmToken: null }
      }).catch(() => {});
    }
  }
};

module.exports = { sendPushNotification };
