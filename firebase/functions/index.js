const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.firestore();

// Security Gate: Only you can call these functions
const checkAdmin = (context) => {
  if (!context.auth || context.auth.token.email !== 'omkarjagtap@gmail.com') {
    throw new functions.https.HttpsError('permission-denied', 'Unauthorized access.');
  }
};

// Helper: Send Push Notification (Migrated from admin.js)
const sendPush = async (uid, title, body) => {
  const tokenSnap = await db.collection('fcm_tokens').doc(uid).get();
  if (tokenSnap.exists) {
    const token = tokenSnap.data().token;
    await admin.messaging().send({
      token: token,
      notification: { title, body },
      android: { priority: 'high' }
    });
  }
};

exports.manageUser = functions.https.onCall(async (data, context) => {
  checkAdmin(context);
  const { action, email, payload } = data;

  try {
    const user = action !== 'list' ? await admin.auth().getUserByEmail(email) : null;

    switch (action) {
      case 'list':
        const listResult = await admin.auth().listUsers(1000);
        // Include device counts from your users/{uid}/devices subcollection
        return Promise.all(listResult.users.map(async (u) => {
          const devices = await db.collection('users').doc(u.uid).collection('devices').get();
          return {
            uid: u.uid,
            email: u.email,
            disabled: u.disabled,
            customClaims: u.customClaims || {},
            deviceCount: devices.size
          };
        }));

      case 'block':
        await admin.auth().updateUser(user.uid, { disabled: true });
        await sendPush(user.uid, "Account Status", "Your account has been disabled.");
        return { success: true, message: `Blocked ${email}` };

      case 'unblock':
        await admin.auth().updateUser(user.uid, { disabled: false });
        return { success: true, message: `Unblocked ${email}` };

      case 'extend':
        const days = payload.days || 365;
        const expiry = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
        const claims = {
          plan: 'yearly',
          maxDevices: 5,
          cloudSync: true,
          licenseExpiry: expiry
        };
        await admin.auth().setCustomUserClaims(user.uid, claims);
        await sendPush(user.uid, "License Updated", `Plan extended for ${days} days.`);
        return { success: true };

      case 'removedevice':
        const { deviceId } = payload;
        await db.collection('users').doc(user.uid).collection('devices').doc(deviceId).delete();
        await sendPush(user.uid, "Security Alert", "A device was removed from your account.");
        return { success: true };

      default:
        throw new functions.https.HttpsError('invalid-argument', 'Action not found');
    }
  } catch (error) {
    console.error("Admin Action Error:", error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});
