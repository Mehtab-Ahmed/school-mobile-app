import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { sportsApi } from '../../api/sports';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { Colors } from '../../theme/colors';

export default function SportsScreen() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? Colors.dark : Colors.light;
  const dashboard = useQuery({ queryKey: ['sports-dashboard'], queryFn: () => sportsApi.dashboard() });
  const achievements = useQuery({ queryKey: ['sports-my-achievements'], queryFn: () => sportsApi.myAchievements(), retry: false });
  const data = dashboard.data?.data?.data;

  const refresh = () => { dashboard.refetch(); achievements.refetch(); };
  const winners = data?.recentWinners ?? [];
  const upcoming = data?.upcoming ?? [];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={dashboard.isRefetching || achievements.isRefetching} onRefresh={refresh} tintColor={Colors.primary[500]} />}
    >
      <Card style={styles.hero}>
        <View style={styles.heroIcon}><Ionicons name="trophy-outline" size={24} color="#fff" /></View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.heroTitle, { color: theme.text }]}>Sports & Winners</Text>
          <Text style={[styles.heroSub, { color: theme.textSecondary }]}>Competitions, prizes, and achievements</Text>
        </View>
      </Card>

      <Text style={[styles.sectionTitle, { color: theme.text }]}>Winners Highlight</Text>
      {winners.length === 0 ? <EmptyState icon="medal-outline" title="No winners yet" /> : winners.slice(0, 5).map((w) => (
        <Card key={w.id} style={styles.card}>
          <View style={styles.row}>
            <Text style={[styles.title, { color: theme.text }]}>{w.studentName ?? w.teamName ?? 'Winner'}</Text>
            <Badge label={w.medalType ?? w.position} variant={w.medalType === 'GOLD' ? 'warning' : 'success'} small />
          </View>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{w.competitionName} - {w.sport}</Text>
          {!!w.achievementDescription && <Text style={[styles.subtitle, { color: theme.textMuted }]}>{w.achievementDescription}</Text>}
        </Card>
      ))}

      <Text style={[styles.sectionTitle, { color: theme.text }]}>Upcoming Competitions</Text>
      {upcoming.length === 0 ? <EmptyState icon="calendar-outline" title="No upcoming competitions" /> : upcoming.map((c) => (
        <Card key={c.id} style={styles.card}>
          <View style={styles.row}>
            <Text style={[styles.title, { color: theme.text }]}>{c.name}</Text>
            <Badge label={c.status} variant="info" small />
          </View>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {c.sport} {c.venue ? `- ${c.venue}` : ''} {c.competitionDate ? `- ${new Date(c.competitionDate).toLocaleDateString()}` : ''}
          </Text>
        </Card>
      ))}

      {(achievements.data?.data?.data ?? []).length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>My Achievements</Text>
          {(achievements.data?.data?.data ?? []).map((a, idx) => (
            <Card key={`${a.competitionName}-${idx}`} style={styles.card}>
              <Text style={[styles.title, { color: theme.text }]}>{a.competitionName}</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{a.position} - {a.medalType ?? 'Participation'}</Text>
            </Card>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  heroIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#f59e0b', alignItems: 'center', justifyContent: 'center' },
  heroTitle: { fontSize: 18, fontWeight: '800' },
  heroSub: { fontSize: 13, marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginTop: 8 },
  card: { gap: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  title: { flex: 1, fontSize: 15, fontWeight: '800' },
  subtitle: { fontSize: 13, lineHeight: 19 },
});
