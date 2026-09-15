import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, useColorScheme, Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { authApi } from '../../src/api/auth';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { Colors } from '../../src/theme/colors';

const message = (e: any, fallback: string) => e?.response?.data?.message ?? fallback;

/** Two steps: get a code by text message or email, then set a new password with it. */
export default function ForgotPasswordScreen() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? Colors.dark : Colors.light;
  const params = useLocalSearchParams<{ tenantId?: string; identifier?: string }>();

  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [tenantId, setTenantId] = useState(params.tenantId ?? '');
  const [identifier, setIdentifier] = useState(params.identifier ?? '');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const requestCode = async () => {
    if (!tenantId.trim() || !identifier.trim()) {
      Alert.alert('Required', 'Enter your School ID and the email, login ID or phone you sign in with.');
      return;
    }
    setBusy(true);
    try {
      const res = await authApi.forgotPassword(tenantId.trim(), identifier.trim());
      if (res.data?.data?.codeDeliveryAvailable === false) {
        Alert.alert('Ask your school office', res.data?.message ?? 'Password reset by code is not set up for this school yet.');
      } else {
        setNotice(res.data?.message ?? null);
        setStep('reset');
      }
    } catch (e) {
      Alert.alert("Couldn't send a code", message(e, 'Try again in a few minutes.'));
    } finally {
      setBusy(false);
    }
  };

  const reset = async () => {
    if (code.trim().length !== 6) { Alert.alert('Enter the code', 'The code has 6 digits.'); return; }
    if (password.length < 8) { Alert.alert('Password too short', 'Use at least 8 characters.'); return; }
    if (password !== confirm) { Alert.alert("Passwords don't match", 'Type the same new password twice.'); return; }
    setBusy(true);
    try {
      await authApi.resetPassword(tenantId.trim(), identifier.trim(), code.trim(), password);
      Alert.alert('Password changed', 'Sign in with your new password.', [
        { text: 'Sign in', onPress: () => router.replace('/(auth)/login') },
      ]);
    } catch (e) {
      Alert.alert("That didn't work", message(e, 'Request a new code and try again.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.title, { color: theme.text }]}>Reset your password</Text>
          <Text style={[styles.sub, { color: theme.textSecondary }]}>
            {step === 'request'
              ? "We'll send a 6-digit code to the mobile number or email your school has on file."
              : notice ?? 'Enter the code we sent and choose a new password.'}
          </Text>

          {step === 'request' ? (
            <>
              <Input label="School ID" value={tenantId} onChangeText={setTenantId} placeholder="Your School ID" icon="business-outline" />
              <Input label="Email / login ID / phone" value={identifier} onChangeText={setIdentifier} placeholder="What you sign in with" icon="person-circle-outline" />
              <Button label="Send code" onPress={requestCode} loading={busy} fullWidth />
            </>
          ) : (
            <>
              <Input label="6-digit code" value={code} onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 6))} placeholder="123456" keyboardType="number-pad" icon="keypad-outline" />
              <Input label="New password" value={password} onChangeText={setPassword} placeholder="At least 8 characters" isPassword icon="lock-closed-outline" />
              <Input label="Type it again" value={confirm} onChangeText={setConfirm} placeholder="Same password" isPassword icon="lock-closed-outline" />
              <Button label="Set new password" onPress={reset} loading={busy} fullWidth />
              <TouchableOpacity onPress={() => { setStep('request'); setCode(''); }} style={styles.link}>
                <Text style={{ color: Colors.primary[500], fontWeight: '600' }}>Didn't get a code? Send another</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <TouchableOpacity onPress={() => router.replace('/(auth)/login')} style={styles.link}>
          <Text style={{ color: theme.textSecondary }}>Back to sign in</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 24, paddingTop: 80, gap: 16 },
  card: { borderRadius: 20, borderWidth: 1, padding: 24, gap: 4 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 4 },
  sub: { fontSize: 13, marginBottom: 20, lineHeight: 19 },
  link: { alignItems: 'center', paddingVertical: 12 },
});
