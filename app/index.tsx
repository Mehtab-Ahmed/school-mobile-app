import { Redirect, type Href } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';
import { View, ActivityIndicator } from 'react-native';
import { Colors } from '../src/theme/colors';

export default function Index() {
  const { isAuthenticated, isLoading, user } = useAuthStore();

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primary[500] }}>
        <ActivityIndicator color="#fff" size="large" />
      </View>
    );
  }

  if (isAuthenticated && user?.forcePasswordChange) return <Redirect href={'/(auth)/change-password' as Href} />;
  if (isAuthenticated) return <Redirect href="/(tabs)" />;
  return <Redirect href="/(auth)/login" />;
}
