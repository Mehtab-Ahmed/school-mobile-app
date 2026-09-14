import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, useColorScheme, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '../../src/api/auth';
import { useAuthStore } from '../../src/store/authStore';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { Colors } from '../../src/theme/colors';

/**
 * Shown when the account still has the temporary password the school office
 * issued. The server refuses every other request until it's replaced.
 */
export default function ChangePasswordScreen() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? Colors.dark : Colors.light;
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');

  const signOut = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  const mutation = useMutation({
    mutationFn: () => authApi.changePassword(current, next),
    onSuccess: () => {
      // Changing the password ends every session, this one included.
      Alert.alert('Password changed', 'Sign in again with your new password.', [
        { text: 'Sign in', onPress: signOut },
      ]);
    },
    onError: (err: any) => {
      Alert.alert('Could not change password', err?.response?.data?.message ?? 'Please try again.');
    },
  });

  const submit = () => {
    if (!current || !next) {
      Alert.alert('Required', 'Enter your temporary password and a new password.');
      return;
    }
    if (next.length < 8) {
      Alert.alert('Too short', 'Use at least 8 characters for the new password.');
      return;
    }
    if (next !== confirm) {
      Alert.alert("Passwords don't match", 'Type the same new password in both fields.');
      return;
    }
    mutation.mutate();
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={[styles.container, { backgroundColor: theme.background }]}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.title, { color: theme.text }]}>Choose your own password</Text>
          <Text style={[styles.sub, { color: theme.textSecondary }]}>
            {user?.fullName ? `${user.fullName}, your` : 'Your'} account is using a temporary password from the school office.
            Set a new one to continue.
          </Text>

          <Input
            label="Temporary password"
            value={current}
            onChangeText={setCurrent}
            placeholder="Temporary password"
            isPassword
            icon="key-outline"
          />
          <Input
            label="New password"
            value={next}
            onChangeText={setNext}
            placeholder="At least 8 characters"
            isPassword
            icon="lock-closed-outline"
          />
          <Input
            label="Confirm new password"
            value={confirm}
            onChangeText={setConfirm}
            placeholder="Type it again"
            isPassword
            icon="lock-closed-outline"
          />

          <Button
            label="Change password"
            onPress={submit}
            loading={mutation.isPending}
            fullWidth
            style={{ marginTop: 4 }}
          />
        </View>

        <TouchableOpacity onPress={signOut} style={styles.signOut} activeOpacity={0.7}>
          <Text style={[styles.signOutText, { color: theme.textSecondary }]}>Sign out</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, paddingTop: 80, gap: 16 },
  card: {
    borderRadius: 20, borderWidth: 1, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
  },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 6 },
  sub: { fontSize: 13, lineHeight: 19, marginBottom: 24 },
  signOut: { alignSelf: 'center', padding: 12 },
  signOutText: { fontSize: 14, fontWeight: '600' },
});
