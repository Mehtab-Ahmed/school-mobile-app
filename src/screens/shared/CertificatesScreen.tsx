import React from 'react';
import {
  View, Text, FlatList, StyleSheet, useColorScheme, ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { Colors } from '../../theme/colors';
import { certificatesApi } from '../../api/advanced';
import ScreenHeader from '../../components/ui/ScreenHeader';

const CERT_CONFIG: Record<string, { emoji: string; label: string; gradient: string }> = {
  ATTENDANCE_EXCELLENCE: { emoji: '🎯', label: 'Attendance Excellence', gradient: '#10b981' },
  ACADEMIC_TOPPER:       { emoji: '🏆', label: 'Academic Topper',       gradient: '#f59e0b' },
  SPORTS_WINNER:         { emoji: '🏅', label: 'Sports Winner',         gradient: '#3b82f6' },
  BEHAVIOR_AWARD:        { emoji: '⭐', label: 'Behavior Award',        gradient: '#8b5cf6' },
  PARTICIPATION:         { emoji: '📜', label: 'Participation',         gradient: '#06b6d4' },
  CUSTOM:                { emoji: '🎖️', label: 'Custom Award',          gradient: '#ef4444' },
};

export default function CertificatesScreen() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? Colors.dark : Colors.light;
  const { user } = useAuthStore();
  const isStudent = user?.primaryRole === 'STUDENT';
  const isParent  = user?.primaryRole === 'PARENT';

  const { data, isLoading } = useQuery({
    queryKey: ['my-certificates'],
    queryFn: () => certificatesApi.getMy().then(r => r.data?.data ?? []),
    enabled: isStudent || isParent,
  });

  const certs: any[] = data ?? [];

  const renderCert = ({ item }: { item: any }) => {
    const cfg = CERT_CONFIG[item.certificateType] ?? CERT_CONFIG.CUSTOM;
    return (
      <View style={[s.certCard, { borderColor: cfg.gradient }]}>
        <View style={[s.certHeader, { backgroundColor: cfg.gradient }]}>
          <Text style={s.certEmoji}>{cfg.emoji}</Text>
          <Text style={s.certTypeLabel}>{cfg.label}</Text>
        </View>
        <View style={[s.certBody, { backgroundColor: theme.card }]}>
          <Text style={[s.certTitle, { color: theme.text }]}>{item.title}</Text>
          {item.description ? (
            <Text style={[s.certDesc, { color: theme.textSecondary }]} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}
          <View style={s.certMeta}>
            <Text style={[s.certDate, { color: theme.textMuted }]}>🗓 {item.issuedDate}</Text>
            <Text style={[s.certSerial, { color: theme.textMuted }]}># {item.serialNumber}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[s.container, { backgroundColor: theme.background }]}>
      <ScreenHeader title="My Certificates" />
      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 60 }} color={Colors.primary[500]} />
      ) : certs.length === 0 ? (
        <View style={s.empty}>
          <Text style={{ fontSize: 56 }}>🎖️</Text>
          <Text style={[s.emptyTitle, { color: theme.text }]}>No Certificates Yet!</Text>
          <Text style={[s.emptySub, { color: theme.textSecondary }]}>
            Keep working hard and earn your first certificate 💪
          </Text>
        </View>
      ) : (
        <FlatList
          data={certs}
          keyExtractor={i => String(i.id)}
          renderItem={renderCert}
          contentContainerStyle={{ padding: 16, gap: 16 }}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container:     { flex: 1 },
  certCard:      { borderRadius: 16, overflow: 'hidden', borderWidth: 2 },
  certHeader:    { alignItems: 'center', paddingVertical: 20, gap: 6 },
  certEmoji:     { fontSize: 44 },
  certTypeLabel: { color: 'rgba(255,255,255,0.9)', fontWeight: '700', fontSize: 13, letterSpacing: 1 },
  certBody:      { padding: 16 },
  certTitle:     { fontSize: 18, fontWeight: '800', textAlign: 'center', marginBottom: 6 },
  certDesc:      { fontSize: 13, textAlign: 'center', marginBottom: 10 },
  certMeta:      { flexDirection: 'row', justifyContent: 'space-between' },
  certDate:      { fontSize: 12 },
  certSerial:    { fontSize: 12, fontFamily: 'monospace' },
  empty:         { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  emptyTitle:    { fontSize: 20, fontWeight: '800' },
  emptySub:      { fontSize: 14, textAlign: 'center' },
});
