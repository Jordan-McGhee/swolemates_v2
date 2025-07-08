import * as admin from "firebase-admin";

admin.initializeApp(); // In Cloud Functions, no config needed

export { admin };
