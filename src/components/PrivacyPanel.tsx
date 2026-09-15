import React, { useState } from 'react';
import { ScrollView, Text, View, StyleSheet, useColorScheme, Alert, TextInput } from 'react-native';
import { authApi } from '../api/auth';
import { Button } from './ui/Button';
import { PrivacyNoticeText } from './PrivacyNoticeText';
import { Colors } from '../theme/colors';

/** The privacy notice, plus a way to ask the school to delete the account and its data. */
export function PrivacyPanel() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? Colors.dark : Colors.light;
  const [reason, setReason] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const request = () =>
    Alert.alert('Delete my account and data?', 'Your school will be asked to delete your account. You may lose access to the app.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Send request', style: 'destructive', onPress: async () => {
          setSending(true);
          try {
            const res = await authApi.requestDeletion(reason.trim() || undefined);
            setSent(true);
            Alert.alert('Request sent', res.data?.message ?? 'Your school will contact you.');
          } catch {
            Alert.alert("Couldn't send", 'Try again, or contact your school office.');
          } finally {
            setSending(false);
          }
        },
      },
    ]);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 20, paddingBottom: 48 }}>
      <PrivacyNoticeText />
      <View style={[styles.box, { borderColor: theme.border, backgroundColor: theme.card }]}>
        <Text style={[styles.heading, { color: theme.text }]}>Delete my account and data</Text>
        {sent ? (
          <Text style={{ color: theme.textSecondary }}>Your request has been sent to the school.</Text>
        ) : (
          <>
            <TextInput
              value={reason}
              onChangeText={setReason}
              placeholder="Reason (optional)"
              placeholderTextColor={theme.textMuted}
              multiline
              style={[styles.input, { color: theme.text, borderColor: theme.border }]}
            />
            <Button label="Send deletion request" onPress={request} loading={sending} variant="danger" fullWidth />
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  box: { borderWidth: 1, borderRadius: 14, padding: 16, gap: 12 },
  heading: { fontSize: 15, fontWeight: '700' },
  input: { borderWidth: 1, borderRadius: 10, padding: 10, minHeight: 60, textAlignVertical: 'top' },
});
