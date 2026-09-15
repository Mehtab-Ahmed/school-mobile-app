/**
 * Build-time settings layered on app.json. Values come from the environment
 * (set per build profile in eas.json, or in a local .env):
 *
 *   EXPO_PUBLIC_API_URL  the school server, e.g. https://erp.example.org/api/v1  (required for release builds)
 *   EAS_PROJECT_ID       from `eas init` — without it phones can't receive push notifications
 *   APP_BUNDLE_ID        store identifier, e.g. org.example.schoolapp
 *   GOOGLE_SERVICES_JSON path to google-services.json (Android push via FCM)
 */
module.exports = ({ config }) => {
  const bundleId = process.env.APP_BUNDLE_ID || config.ios?.bundleIdentifier;
  return {
    ...config,
    name: process.env.APP_NAME || config.name,
    ios: {
      ...config.ios,
      bundleIdentifier: bundleId,
      infoPlist: {
        ...(config.ios?.infoPlist ?? {}),
        NSLocationWhenInUseUsageDescription:
          'While you run a bus trip, the bus location is shared with parents so they know when it will arrive.',
        NSLocationAlwaysAndWhenInUseUsageDescription:
          'During a bus trip the location keeps updating for parents even when the phone is locked.',
        UIBackgroundModes: ['location', 'remote-notification'],
      },
    },
    android: {
      ...config.android,
      package: process.env.APP_BUNDLE_ID || config.android?.package,
      ...(process.env.GOOGLE_SERVICES_JSON ? { googleServicesFile: process.env.GOOGLE_SERVICES_JSON } : {}),
      permissions: [
        'ACCESS_COARSE_LOCATION',
        'ACCESS_FINE_LOCATION',
        'ACCESS_BACKGROUND_LOCATION',
        'FOREGROUND_SERVICE',
        'FOREGROUND_SERVICE_LOCATION',
        'POST_NOTIFICATIONS',
      ],
    },
    plugins: [
      ...(config.plugins ?? []),
      [
        'expo-location',
        {
          locationWhenInUsePermission:
            'While you run a bus trip, the bus location is shared with parents so they know when it will arrive.',
          locationAlwaysAndWhenInUsePermission:
            'During a bus trip the location keeps updating for parents even when the phone is locked.',
          isAndroidBackgroundLocationEnabled: true,
          isAndroidForegroundServiceEnabled: true,
        },
      ],
      ['expo-notifications', { color: '#6366f1' }],
    ],
    extra: {
      ...(config.extra ?? {}),
      apiUrl: process.env.EXPO_PUBLIC_API_URL,
      eas: { ...(config.extra?.eas ?? {}), projectId: process.env.EAS_PROJECT_ID || config.extra?.eas?.projectId },
    },
  };
};
