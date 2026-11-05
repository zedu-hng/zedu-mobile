const unsubscribe = () => {};

module.exports = {
  getMessaging: jest.fn(() => ({})),
  getToken: jest.fn(() => Promise.resolve('test-fcm-token')),
  getInitialNotification: jest.fn(() => Promise.resolve(null)),
  onMessage: jest.fn(() => unsubscribe),
  onNotificationOpenedApp: jest.fn(() => unsubscribe),
  onTokenRefresh: jest.fn(() => unsubscribe),
  setBackgroundMessageHandler: jest.fn(),
};
