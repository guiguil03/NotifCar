// Give the service worker access to Firebase Messaging.
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing the generated config
const firebaseConfig = {
  apiKey: "AIzaSyA3V3u5S4pICnfwTwyo6OxWKmAh-n0U3Uo",
  authDomain: "notifcar-4115c.firebaseapp.com",
  projectId: "notifcar-4115c",
  storageBucket: "notifcar-4115c.firebasestorage.app",
  messagingSenderId: "960249373749",
  appId: "1:960249373749:web:d11e7372df0362d7853d7c",
  measurementId: "G-BDPH26KK2N"
};

firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  // Customize notification here
  const notificationTitle = payload.notification.title || 'NotifCar';
  const notificationOptions = {
    body: payload.notification.body || 'Nouvelle notification',
    icon: '/icon-192x192.png',
    badge: '/badge-icon.png',
    data: payload.data,
    actions: [
      {
        action: 'open',
        title: 'Ouvrir'
      },
      {
        action: 'close',
        title: 'Fermer'
      }
    ]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', function(event) {
  console.log('[firebase-messaging-sw.js] Notification click received.');

  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  // This looks to see if the current is already open and focuses if it is
  event.waitUntil(clients.matchAll({
    type: "window"
  }).then(function(clientList) {
    for (let i = 0; i < clientList.length; i++) {
      let client = clientList[i];
      if (client.url == '/' && 'focus' in client) {
        return client.focus();
      }
    }
    if (clients.openWindow) {
      return clients.openWindow('/');
    }
  }));
});
