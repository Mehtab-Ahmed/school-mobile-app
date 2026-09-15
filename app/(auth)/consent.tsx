import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, useColorScheme, Alert } from 'react-native';
import { router, type Href } from 'expo-router';
import { authApi } from '../../src/api/auth';
import { useAuthStore } from '../../src/store/authStore';
import { Button } from '../../src/components/ui/Button';
import { PrivacyNoticeText } from '../../src/components/PrivacyNoticeText';
import { Colors } from '../../src/theme/colors';

/** Shown after sign-in until the current privacy notice is accepted. */
export default function ConsentScreen() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? Colors.dark : Colors.light;
  const { user, updateUser, logout } = useAuthStore();
  const [agreed, setAgreed] = useState(false);
  const [saving, setSaving] = useState(false);
  const isParent = user?.primaryRole === 'PARENT';

  const accept = async () => {
    setSaving(true);
    try {
      await authApi.acceptConsent();
      await updateUser({ consentRequired: false });
      router.replace('/(tabs)' as Href);
    } catch {
      Alert.alert("Couldn't save", 'Check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  const signOut = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Before you continue</Text>
        <Text style={[styles.sub, { color: theme.textSecondary }]}>
          {user?.schoolName ?? 'Your school'} uses this app to keep school records and stay in touch with families.
        </Text>
      </View>
      <ScrollView style={[styles.notice, { backgroundColor: theme.card, borderColor: theme.border }]} contentContainerStyle={{ padding: 16 }}>
        <PrivacyNoticeText />
      </ScrollView>
      <View style={styles.footer}>
        <View style={styles.agreeRow}>
          <Switch value={agreed} onValueChange={setAgreed} accessibilityLabel="I agree to the privacy notice" />
          <Text style={[styles.agreeText, { color: theme.text }]}>
            I have read the privacy notice and agree{isParent ? ', including for my children linked to this account' : ''}.
          </Text>
        </View>
        <Button label="Agree and continue" onPress={accept} loading={saving} disabled={!agreed} fullWidth />
        <Button label="Sign out" onPress={signOut} variant="ghost" fullWidth />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 56 },
  header: { paddingHorizontal: 20, gap: 6, marginBottom: 12 },
  title: { fontSize: 24, fontWeight: '800' },
  sub: { fontSize: 14, lineHeight: 20 },
  notice: { flex: 1, marginHorizontal: 16, borderRadius: 16, borderWidth: 1 },
  footer: { padding: 16, gap: 10, paddingBottom: 32 },
  agreeRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  agreeText: { flex: 1, fontSize: 14, lineHeight: 20 },
});
