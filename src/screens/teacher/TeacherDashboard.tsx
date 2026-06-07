import React from 'react';
import {
  ScrollView, View, Text, StyleSheet, useColorScheme, RefreshControl,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../../api/dashboard';
import { communicationApi } from '../../api/communication';
import { useAuthStore } from '../../store/authStore';
import { StatCard } from '../../components/ui/StatCard';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Colors } from '../../theme/colors';

export default function TeacherDashboard() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? Colors.dark : Colors.light;
  const user = useAuthStore((s) => s.user);

  // Find teacher ID (hack: user.userId is teacher's user id, need to map)
  const { data: dashData, refetch, isRefetching } = useQuery({
    queryKey: ['teacher-dashboard', user?.userId],
    queryFn: () => dashboardApi.teacher(user!.userId),
    enabled: !!user,
  });

  const { data: annData } = useQuery({
    queryKey: ['announcements-teacher'],
    queryFn: () => communicationApi.announcements('TEACHERS'),
  });

  const d = dashData?.data?.data;
  const announcements = annData?.data?.data ?? [];

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' });

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary[500]} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: theme.textSecondary }]}>Good morning 👋</Text>
          <Text style={[styles.name, { color: theme.text }]}>{user?.fullName}</Text>
          <Text style={[styles.date, { color: theme.textMuted }]}>{today}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: '#8b5cf6' }]}>
          <Text style={styles.badgeText}>TEACHER</Text>
        </View>
      </View>

      {/* Stats */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>My Summary</Text>
      <View style={styles.statsRow}>
        <StatCard title="My Classes" value={d?.totalClasses ?? '—'} icon="grid" iconColor={Colors.primary[500]} />
        <View style={{ width: 12 }} />
        <StatCard title="Students" value={d?.totalStudents ?? '—'} icon="people" iconColor="#8b5cf6" />
      </View>
      <View style={[styles.statsRow, { marginTop: 12 }]}>
        <StatCard title="Pending HW" value={d?.pendingHomework ?? '—'} subtitle="To review" icon="book" iconColor={Colors.warning} />
        <View style={{ width: 12 }} />
        <StatCard title="Today's Classes" value={d?.todayClasses?.length ?? 0} icon="calendar" iconColor={Colors.info} />
      </View>

      {/* Today's classes */}
      {d?.todayClasses && d.todayClasses.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Today's Classes</Text>
          <Card style={{ gap: 10 }}>
            {d.todayClasses.map((cls, i) => (
              <View key={cls.id ?? i} style={[styles.classRow, { borderBottomColor: theme.border, borderBottomWidth: i < d.todayClasses.length - 1 ? 1 : 0 }]}>
                <View style={[styles.classBadge, { backgroundColor: Colors.primary[500] + '22' }]}>
                  <Text style={[styles.classBadgeText, { color: Colors.primary[500] }]}>
                    {cls.grade?.name ?? 'Grade'}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.className, { color: theme.text }]}>
                    {cls.grade?.name} – {cls.section?.name}
                  </Text>
                  <Text style={[styles.classSub, { color: theme.textSecondary }]}>
                    Room {cls.roomNumber ?? 'TBD'}
                  </Text>
                </View>
                <Badge label={`${cls.capacity ?? 0} students`} small />
              </View>
            ))}
          </Card>
        </>
      )}

      {/* Announcements */}
      {announcements.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Announcements</Text>
          {announcements.slice(0, 3).map((a) => (
            <Card key={a.id} style={styles.annCard}>
              <View style={styles.annRow}>
                <Badge
                  label={a.priority}
                  variant={a.priority === 'URGENT' ? 'danger' : a.priority === 'HIGH' ? 'warning' : 'info'}
                  small
                />
                <Text style={[styles.annDate, { color: theme.textMuted }]}>
                  {new Date(a.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <Text style={[styles.annTitle, { color: theme.text }]}>{a.title}</Text>
              <Text style={[styles.annContent, { color: theme.textSecondary }]} numberOfLines={2}>{a.content}</Text>
            </Card>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, marginTop: 8 },
  greeting: { fontSize: 13 },
  name: { fontSize: 22, fontWeight: '800' },
  date: { fontSize: 12, marginTop: 2 },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12, marginTop: 20 },
  statsRow: { flexDirection: 'row' },
  classRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingBottom: 10 },
  classBadge: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  classBadgeText: { fontSize: 12, fontWeight: '700' },
  className: { fontSize: 14, fontWeight: '600' },
  classSub: { fontSize: 12 },
  annCard: { marginBottom: 10, gap: 6 },
  annRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  annDate: { fontSize: 11 },
  annTitle: { fontSize: 14, fontWeight: '600' },
  annContent: { fontSize: 13, lineHeight: 18 },
});
