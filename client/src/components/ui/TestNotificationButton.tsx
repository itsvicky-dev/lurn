import React from 'react';
import { useNotifications } from '../../contexts/NotificationContext';

const TestNotificationButton: React.FC = () => {
  const { addNotification } = useNotifications();

  const testNotifications = [
    {
      type: 'success' as const,
      title: 'Test Success!',
      message: 'This is a test success notification.',
    },
    {
      type: 'info' as const,
      title: 'Test Info',
      message: 'This is a test info notification with some longer text to see how it wraps.',
    },
    {
      type: 'warning' as const,
      title: 'Test Warning',
      message: 'This is a test warning notification.',
    },
    {
      type: 'error' as const,
      title: 'Test Error',
      message: 'This is a test error notification.',
    },
  ];

  const addTestNotification = () => {
    const randomNotification = testNotifications[Math.floor(Math.random() * testNotifications.length)];
    addNotification(randomNotification);
  };

  return (
    <button
      onClick={addTestNotification}
      className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
    >
      Add Test Notification
    </button>
  );
};

export default TestNotificationButton;