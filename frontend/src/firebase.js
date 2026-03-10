import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: 'AIzaSyA8pH0RMpvzevgSp2ibphw4nHSKMB2OuZY',
  authDomain: 'pos-billing-software-5a3c0.firebaseapp.com',
  projectId: 'pos-billing-software-5a3c0',
  storageBucket: 'pos-billing-software-5a3c0.firebasestorage.app',
  messagingSenderId: '61763644017',
  appId: '1:61763644017:web:458c17f402a5db237c49d0',
  measurementId: 'G-912D4R1T9Q'
};

export const app = initializeApp(firebaseConfig);

// Analytics is not available in every runtime (for example some local/dev contexts).
export const analyticsPromise = isSupported()
  .then((supported) => (supported ? getAnalytics(app) : null))
  .catch(() => null);
