const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.firestore();

// Security: Only you (the admin) can call these
const checkAdmin = (context) => {
  if (!context.auth || context.auth.token.email !== 'jagtapomkar3052002@gmail.com') {
    throw new functions.https.HttpsError('permission-denied', 'Unauthorized access.');
  }
};

exports.manageUser = functions.https.onCall(async (data, context) => {
  checkAdmin(context);
  const { action, email, payload } = data;

  try {
    switch (action) {
      case 'list':
        const users = await admin.auth().listUsers(1000);
        return users.users;

      case 'block':
        const user = await admin.auth().getUserByEmail(email);
        await admin.auth().updateUser(user.uid, { disabled: true });
        // Send Push Notification (from your admin.js logic)
        return { success: true };

      case 'extend':
        // Logic to update claims and Firestore expiry
        const { days } = payload;
        // ... implementation of extendLicense logic
        return { success: true };

      default:
        throw new functions.https.HttpsError('invalid-argument', 'Action not found');
    }
  } catch (error) {
    throw new functions.https.HttpsError('internal', error.message);
  }
});
