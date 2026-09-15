import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import api from '../api/axios';

/**
 * Sends the bus position to the server during a trip — including while the phone
 * is locked or the app is in the background. The task must be defined when the
 * app starts (this file is imported from the root layout), not inside a screen.
 */
export const DRIVER_LOCATION_TASK = 'driver-location-updates';

TaskManager.defineTask(DRIVER_LOCATION_TASK, async ({ data, error }) => {
  if (error) return;
  const locations = (data as { locations?: Location.LocationObject[] } | undefined)?.locations;
  const latest = locations?.[locations.length - 1];
  if (!latest) return;
  try {
    await api.post('/transport/driver/location', {
      latitude: latest.coords.latitude,
      longitude: latest.coords.longitude,
    });
  } catch {
    // A missed ping is fine; the next one follows in seconds.
  }
});

// One watcher for the whole app, however many driver screens are open.
let displayWatch: Location.LocationSubscription | null = null;
let listener: ((lat: number, lng: number) => void) | null = null;

export type TrackingMode = 'background' | 'foreground' | 'denied';

/**
 * Starts (or resumes) trip tracking. Uses background updates when the driver
 * allows "Allow all the time"; otherwise tracks only while the app is open.
 */
export async function startDriverTracking(onFix?: (lat: number, lng: number) => void): Promise<TrackingMode> {
  listener = onFix ?? listener;
  const fg = await Location.requestForegroundPermissionsAsync();
  if (fg.status !== 'granted') return 'denied';

  let background = false;
  try {
    const bg = await Location.requestBackgroundPermissionsAsync();
    background = bg.status === 'granted' && (await TaskManager.isAvailableAsync());
  } catch {
    background = false;
  }

  if (background) {
    const running = await Location.hasStartedLocationUpdatesAsync(DRIVER_LOCATION_TASK).catch(() => false);
    if (!running) {
      await Location.startLocationUpdatesAsync(DRIVER_LOCATION_TASK, {
        accuracy: Location.Accuracy.High,
        timeInterval: 15000,
        distanceInterval: 20,
        pausesUpdatesAutomatically: false,
        activityType: Location.ActivityType.AutomotiveNavigation,
        showsBackgroundLocationIndicator: true,
        foregroundService: {
          notificationTitle: 'Bus trip in progress',
          notificationBody: 'Sharing the bus location with parents',
          notificationColor: '#22c55e',
        },
      });
    }
  }

  // On-screen position (and, without background permission, the pings themselves).
  if (!displayWatch) {
    displayWatch = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, timeInterval: 15000, distanceInterval: 20 },
      (loc) => {
        const { latitude, longitude } = loc.coords;
        listener?.(latitude, longitude);
        if (!background) {
          api.post('/transport/driver/location', { latitude, longitude }).catch(() => {});
        }
      },
    );
  }
  return background ? 'background' : 'foreground';
}

export async function stopDriverTracking() {
  displayWatch?.remove();
  displayWatch = null;
  listener = null;
  try {
    if (await Location.hasStartedLocationUpdatesAsync(DRIVER_LOCATION_TASK)) {
      await Location.stopLocationUpdatesAsync(DRIVER_LOCATION_TASK);
    }
  } catch {
    // Not running.
  }
}

export function isDisplayTrackingActive() {
  return displayWatch != null;
}
