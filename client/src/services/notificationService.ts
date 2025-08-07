class NotificationService {
  private isSupported: boolean;
  private permission: NotificationPermission;

  constructor() {
    this.isSupported = 'Notification' in window;
    this.permission = this.isSupported ? Notification.permission : 'denied';
  }

  async requestPermission(): Promise<boolean> {
    if (!this.isSupported) {
      console.warn('Browser notifications are not supported');
      return false;
    }

    if (this.permission === 'granted') {
      return true;
    }

    if (this.permission === 'denied') {
      console.warn('Notification permission was denied');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  async showNotification(title: string, options?: NotificationOptions): Promise<void> {
    if (!this.isSupported || this.permission !== 'granted') {
      console.warn('Cannot show notification: not supported or permission denied');
      return;
    }

    try {
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options,
      });

      // Auto-close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);

      return new Promise((resolve) => {
        notification.onshow = () => resolve();
        notification.onerror = () => resolve();
      });
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }

  async notifyContentReady(contentType: string, title: string): Promise<void> {
    const messages = {
      'learning-path': `🎉 Your learning path "${title}" is ready!`,
      'modules': `📚 Modules for "${title}" have been generated!`,
      'topics': `📖 Topic content for "${title}" is now available!`,
      'course': `🎓 Your course "${title}" is ready to start!`,
    };

    const message = messages[contentType as keyof typeof messages] || `✅ "${title}" is ready!`;

    await this.showNotification('AI Tutor', {
      body: message,
      tag: `content-ready-${contentType}`,
      requireInteraction: true,
    });
  }

  async notifyProgress(message: string): Promise<void> {
    await this.showNotification('AI Tutor - Progress Update', {
      body: message,
      tag: 'progress-update',
    });
  }

  isPermissionGranted(): boolean {
    return this.permission === 'granted';
  }

  isPermissionDenied(): boolean {
    return this.permission === 'denied';
  }
}

export const notificationService = new NotificationService();
export default notificationService;