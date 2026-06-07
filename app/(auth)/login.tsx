import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, useColorScheme, Alert, Image,
} from 'react-native';
import { router } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '../../src/api/auth';
import { useAuthStore } from '../../src/store/authStore';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { Colors } from '../../src/theme/colors';

const QUICK_LOGINS = [
  { role: 'Admin', email: 'admin@school.com', password: 'School@1234', icon: '🏫', color: '#6366f1' },
  { role: 'Teacher', email: 'rajesh.kumar@school.com', password: 'School@1234', icon: '👨‍🏫', color: '#8b5cf6' },
  { role: 'Student', email: 'arjun.sharma@school.com', password: 'School@1234', icon: '🎓', color: '#06b6d4' },
  { role: 'Parent', email: 'parent1@school.com', password: 'School@1234', icon: '👪', color: '#10b981' },
];

export default function LoginScreen() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? Colors.dark : Colors.light;
  const login = useAuthStore((s) => s.login);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const mutation = useMutation({
    mutationFn: ({ e, p }: { e: string; p: string }) => authApi.login(e, p),
    onSuccess: async (res) => {
      const d = res.data?.data;
      if (d) {
        await login(d.user, d.accessToken, d.refreshToken);
        router.replace('/(tabs)');
      }
    },
    onError: () => Alert.alert('Login Failed', 'Invalid credentials. Please try again.'),
  });

  const doLogin = (e: string, p: string) => mutation.mutate({ e, p });

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={[styles.container, { backgroundColor: theme.background }]}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo / Hero */}
        <View style={styles.hero}>
          <View style={[styles.logoWrap, { backgroundColor: Colors.primary[500] }]}>
            <Text style={styles.logoText}>🏫</Text>
          </View>
          <Text style={[styles.appName, { color: theme.text }]}>School ERP</Text>
          <Text style={[styles.tagline, { color: theme.textSecondary }]}>
            Complete School Management System
          </Text>
        </View>

        {/* Card */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Sign In</Text>
          <Text style={[styles.cardSub, { color: theme.textSecondary }]}>Enter your credentials to continue</Text>

          <Input
            label="Email / Username"
            value={email}
            onChangeText={setEmail}
            placeholder="you@school.com"
            keyboardType="email-address"
            icon="mail-outline"
          />
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            isPassword
            icon="lock-closed-outline"
          />

          <Button
            label="Sign In"
            onPress={() => doLogin(email, password)}
            loading={mutation.isPending}
            fullWidth
            style={{ marginTop: 4 }}
          />
        </View>

        {/* Quick Login */}
        <View style={[styles.quickCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.quickTitle, { color: theme.textSecondary }]}>QUICK LOGIN (DEMO)</Text>
          <View style={styles.quickGrid}>
            {QUICK_LOGINS.map((q) => (
              <TouchableOpacity
                key={q.role}
                onPress={() => doLogin(q.email, q.password)}
                activeOpacity={0.8}
                style={[styles.quickBtn, { backgroundColor: q.color + '18', borderColor: q.color + '44' }]}
              >
                <Text style={styles.quickIcon}>{q.icon}</Text>
                <Text style={[styles.quickRole, { color: q.color }]}>{q.role}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Text style={[styles.footer, { color: theme.textMuted }]}>
          School ERP v1.0 · Powered by React Native + Spring Boot
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, paddingTop: 60, gap: 20 },
  hero: { alignItems: 'center', marginBottom: 8, gap: 8 },
  logoWrap: {
    width: 80, height: 80, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.primary[500], shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35, shadowRadius: 16, elevation: 8,
  },
  logoText: { fontSize: 36 },
  appName: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  tagline: { fontSize: 14, textAlign: 'center' },
  card: {
    borderRadius: 20, borderWidth: 1, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
  },
  cardTitle: { fontSize: 22, fontWeight: '700', marginBottom: 4 },
  cardSub: { fontSize: 13, marginBottom: 24 },
  quickCard: {
    borderRadius: 20, borderWidth: 1, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  quickTitle: { fontSize: 11, fontWeight: '600', letterSpacing: 1, marginBottom: 14 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickBtn: {
    flex: 1, minWidth: '44%', alignItems: 'center', paddingVertical: 14,
    borderRadius: 14, borderWidth: 1.5, gap: 6,
  },
  quickIcon: { fontSize: 24 },
  quickRole: { fontSize: 13, fontWeight: '700' },
  footer: { textAlign: 'center', fontSize: 11, marginBottom: 20 },
});
