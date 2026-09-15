import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { router, type Href } from 'expo-router';
import api from '../api/axios';
import { useAuthStore } from '../store/authStore';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/** Where a tapped notification should open, from the data the server attaches. */
export function routeFor(data: Record<string, unknown> | undefined): Href | null {
  const type = String(data?.type ?? '');
  const ref = String(data?.referenceType ?? '');
  if (ref === 'RECEIPT' || type === 'FEE') return '/(tabs)/fees' as Href;
  if (ref === 'HOMEWORK' || type === 'HOMEWORK') return '/(tabs)/homework' as Href;
  if (ref === 'EXAM' || type === 'RESULTS' || type === 'EXAM') return '/(tabs)/exams' as Href;
  if (type === 'ATTENDANCE' || type === 'ABSENCE') return '/(tabs)/attendance' as Href;
  if (ref === 'ANNOUNCEMENT' || ref === 'CONVERSATION' || type === 'MESSAGE' || type === 'ANNOUNCEMENT') {
    return { pathname: '/(tabs)/more', params: { open: 'notifications' } } as unknown as Href;
  }
  return { pathname: '/(tabs)/more', params: { open: 'notifications' } } as unknown as Href;
}

export function usePushNotifications() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) return;
    registerForPushNotifications();
  }, [isAuthenticated]);

  // Tapping a notification opens the screen it's about — including when it launched the app.
  useEffect(() => {
    let handled: string | null = null;
    const open = (response: Notifications.NotificationResponse | null) => {
      if (!response) return;
      const id = response.notification.request.identifier;
      if (handled === id || !useAuthStore.getState().isAuthenticated) return;
      handled = id;
      const target = routeFor(response.notification.request.content.data as Record<string, unknown>);
      if (target) setTimeout(() => router.push(target), 0);
    };
    const sub = Notifications.addNotificationResponseReceivedListener(open);
    Notifications.getLastNotificationResponseAsync().then(open).catch(() => {});
    return () => sub.remove();
  }, []);
}

async function registerForPushNotifications() {
  try {
    // Android 13+ only shows the permission prompt once a channel exists.
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'School updates',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#6366f1',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return;

    const projectId =
      (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId ??
      Constants.easConfig?.projectId;
    if (!projectId) {
      console.warn('Push notifications are off: set EAS_PROJECT_ID (run `eas init`) for this build.');
      return;
    }

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    await api.put('/auth/push-token', { token });
    await SecureStore.setItemAsync('pushToken', token);
  } catch (error) {
    // Simulators and phones without Google Play services can't get a push token.
    console.warn('Failed to register for push notifications:', error);
  }
}
