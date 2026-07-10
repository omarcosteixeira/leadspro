const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// We don't have the service account for the principal project.
// So we can't easily query as the user.
console.log("Can't test without service account");
