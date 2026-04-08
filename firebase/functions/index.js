const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

// THE SECURITY GATE: This email is independent of your Firebase Project Owner email.
// It is the specific account you will create in the "Auth" tab.
const ADMIN_EMAIL = 'omkarjagtap@gmail.com';

const checkAdmin = (context) => {
  if (!context.auth || context.auth.token.email !== ADMIN_EMAIL) {
    throw new functions.https.HttpsError(
      'permission-denied', 
      'Unauthorized: This action requires Admin privileges.'
    );
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
        return Promise.all(listResult.users.map(async (u) => {
          const devices = await db.collection('users').doc(u.uid).collection('devices').get();
          return {
            uid: u.uid,
            email: u.email,
            disabled: u.disabled,
            customClaims: u.customClaims || {},
            deviceCount: devices.size,
            // Shows password if you've stored it in claims, otherwise masked
            password: u.customClaims?.tempPass || '********'
          };
        }));

      case 'block':
        await admin.auth().updateUser(user.uid, { disabled: true });
        return { success: true, message: `User ${email} has been blocked.` };

      case 'extend':
        const days = payload?.days || 365;
        const expiry = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
        await admin.auth().setCustomUserClaims(user.uid, {
          plan: 'yearly',
          maxDevices: 5,
          cloudSync: true,
          licenseExpiry: expiry
        });
        return { success: true };

      default:
        throw new functions.https.HttpsError('invalid-argument', 'Action not recognized.');
    }
  } catch (error) {
    throw new functions.https.HttpsError('internal', error.message);
  }
});
