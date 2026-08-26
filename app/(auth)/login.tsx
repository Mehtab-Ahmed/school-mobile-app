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

const QUICK_LOGINS = [
  { role: 'Admin', identifier: 'admin@school.com', password: 'Admin@1234', tenantId: 'test-school', icon: 'ADM', color: '#6366f1' },
  { role: 'Teacher', identifier: 'rajesh.kumar@school.com', password: 'School@1234', tenantId: 'test-school', icon: 'TCH', color: '#8b5cf6' },
  { role: 'Student', identifier: 'arjun.singh@student.com', password: 'School@1234', tenantId: 'test-school', icon: 'STD', color: '#06b6d4' },
  { role: 'Parent', identifier: 'suresh.singh@parent.com', password: 'School@1234', tenantId: 'test-school', icon: 'PAR', color: '#10b981' },
  { role: 'Driver', identifier: 'ramkumar.yadav@driver.com', password: 'School@1234', tenantId: 'test-school', icon: 'DRV', color: '#f59e0b' },
];

export default function LoginScreen() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? Colors.dark : Colors.light;
  const login = useAuthStore((s) => s.login);

  const [identifier, setIdentifier] = useState('');
  const [tenantId, setTenantId] = useState('test-school');
  const [password, setPassword] = useState('');

  const mutation = useMutation({
    mutationFn: ({ i, p, t }: { i: string; p: string; t?: string }) => authApi.login(i, p, t),
    onSuccess: async (res) => {
      const d = res.data?.data;
      if (d?.accessToken) {
        const user = {
          userId: d.userId,
          id: d.userId,
          fullName: d.fullName,
          email: d.email,
          loginId: d.loginId,
          primaryRole: d.primaryRole,
          roles: d.roles ?? [],
          schoolId: d.schoolId,
          schoolSlug: d.schoolSlug,
          schoolName: d.schoolName,
          forcePasswordChange: d.forcePasswordChange,
        };
        await login(user, d.accessToken, d.refreshToken);
        router.replace('/(tabs)');
      } else {
        Alert.alert('Login Failed', 'Unexpected response from server.');
      }
    },
    onError: (err: any) => {
      const message = err?.response?.data?.message ?? 'Invalid credentials. Please try again.';
      Alert.alert('Login Failed', message);
    },
  });

  const doLogin = (i: string, p: string, t?: string) => {
    const trimmedIdentifier = i.trim();
    if (!trimmedIdentifier || !p) {
      Alert.alert('Required', 'Enter your login ID and password.');
      return;
    }
    mutation.mutate({ i: trimmedIdentifier, p, t: t?.trim() });
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={[styles.container, { backgroundColor: theme.background }]}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.hero}>
          <View style={[styles.logoWrap, { backgroundColor: Colors.primary[500] }]}>
            <Text style={styles.logoText}>ERP</Text>
          </View>
          <Text style={[styles.appName, { color: theme.text }]}>School ERP</Text>
          <Text style={[styles.tagline, { color: theme.textSecondary }]}>
            Complete School Management System
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Sign In</Text>
          <Text style={[styles.cardSub, { color: theme.textSecondary }]}>Use your school-scoped login credentials</Text>

          <Input
            label="Email / Student ID / Parent ID / Phone"
            value={identifier}
            onChangeText={setIdentifier}
            placeholder="Email / Student ID / Parent ID"
            keyboardType="default"
            icon="person-circle-outline"
          />
          <Input
            label="School ID"
            value={tenantId}
            onChangeText={setTenantId}
            placeholder="test-school"
            keyboardType="default"
            icon="business-outline"
          />
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            isPassword
            icon="lock-closed-outline"
          />

          <Button
            label="Sign In"
            onPress={() => doLogin(identifier, password, tenantId)}
            loading={mutation.isPending}
            fullWidth
            style={{ marginTop: 4 }}
          />
        </View>

        <View style={[styles.quickCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.quickTitle, { color: theme.textSecondary }]}>QUICK LOGIN (DEMO)</Text>
          <View style={styles.quickGrid}>
            {QUICK_LOGINS.map((q) => (
              <TouchableOpacity
                key={q.role}
                onPress={() => {
                  setIdentifier(q.identifier);
                  setTenantId(q.tenantId);
                  setPassword(q.password);
                  doLogin(q.identifier, q.password, q.tenantId);
                }}
                activeOpacity={0.8}
                style={[styles.quickBtn, { backgroundColor: q.color + '18', borderColor: q.color + '44' }]}
              >
                <Text style={[styles.quickIcon, { color: q.color }]}>{q.icon}</Text>
                <Text style={[styles.quickRole, { color: q.color }]}>{q.role}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Text style={[styles.footer, { color: theme.textMuted }]}>
          School ERP v1.0 - Powered by React Native + Spring Boot
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
  logoText: { fontSize: 22, fontWeight: '900', color: '#fff' },
  appName: { fontSize: 28, fontWeight: '800' },
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
    width: '30%', alignItems: 'center', paddingVertical: 14,
    borderRadius: 14, borderWidth: 1.5, gap: 6,
  },
  quickIcon: { fontSize: 12, fontWeight: '900' },
  quickRole: { fontSize: 13, fontWeight: '700' },
  footer: { textAlign: 'center', fontSize: 11, marginBottom: 20 },
});
