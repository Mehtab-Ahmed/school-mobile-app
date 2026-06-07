import React from 'react';
import {
  ScrollView, View, Text, StyleSheet, useColorScheme,
  RefreshControl, TouchableOpacity,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { studentsApi } from '../../api/students';
import { attendanceApi } from '../../api/attendance';
import { feesApi } from '../../api/fees';
import { communicationApi } from '../../api/communication';
import { StatCard } from '../../components/ui/StatCard';
import { Card } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Colors } from '../../theme/colors';

function fmt(n: number) { return '₹' + n.toLocaleString('en-IN'); }

export default function ParentDashboard() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? Colors.dark : Colors.light;
  const user = useAuthStore((s) => s.user);

  const { data: childrenData, refetch, isRefetching } = useQuery({
    queryKey: ['children', user?.userId],
    queryFn: () => studentsApi.byParent(user!.userId),
    enabled: !!user,
  });

  const children = childrenData?.data?.data ?? [];
  const child = children[0];
  const childId = child?.id;

  const today = new Date().toISOString().split('T')[0];
  const fromDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

  const { data: attData } = useQuery({
    queryKey: ['att-parent', childId],
    queryFn: () => attendanceApi.summary(childId!, fromDate, today),
    enabled: !!childId,
  });

  const { data: feeData } = useQuery({
    queryKey: ['fee-parent', childId],
    queryFn: () => feesApi.studentSummary(childId!),
    enabled: !!childId,
  });

  const { data: annData } = useQuery({
    queryKey: ['ann-parents'],
    queryFn: () => communicationApi.announcements('PARENTS'),
  });

  const summary = attData?.data?.data;
  const fees = feeData?.data?.data;
  const announcements = annData?.data?.data ?? [];
  const attPct = summary?.attendancePercentage ?? 0;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary[500]} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: theme.textSecondary }]}>Welcome back 👋</Text>
          <Text style={[styles.name, { color: theme.text }]}>{user?.fullName}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: Colors.success }]}>
          <Text style={styles.badgeText}>PARENT</Text>
        </View>
      </View>

      {/* Children list */}
      {children.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>My Children</Text>
          {children.map((c) => {
            const name = `${c.user.firstName} ${c.user.lastName}`;
            return (
              <Card key={c.id} style={styles.childCard}>
                <Avatar name={name} size={52} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.childName, { color: theme.text }]}>{name}</Text>
                  <Text style={[styles.childSub, { color: theme.textSecondary }]}>
                    {c.classSection?.grade?.name} – {c.classSection?.section?.name}
                  </Text>
                  <Text style={[styles.childAdm, { color: theme.textMuted }]}>{c.admissionNumber}</Text>
                </View>
                <Badge label="Active" variant="success" small />
              </Card>
            );
          })}
        </>
      )}

      {/* Stats */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick Overview</Text>
      <View style={styles.statsRow}>
        <StatCard
          title="Attendance"
          value={`${attPct.toFixed(0)}%`}
          subtitle={`${summary?.presentDays ?? 0}/${summary?.totalDays ?? 0} days`}
          icon="checkmark-circle"
          iconColor={attPct >= 75 ? Colors.success : Colors.danger}
        />
        <View style={{ width: 12 }} />
        <StatCard
          title="Fee Balance"
          value={fees ? fmt(Number(fees.totalBalance)) : '₹0'}
          subtitle={fees?.overdueAmount ? 'Has overdue' : 'All clear'}
          icon="card"
          iconColor={fees?.overdueAmount ? Colors.danger : Colors.success}
        />
      </View>

      {/* Attendance detail */}
      {summary && (
        <>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Attendance Breakdown</Text>
          <Card style={{ gap: 14 }}>
            {[
              { label: 'Present', value: summary.presentDays, max: summary.totalDays, color: Colors.success },
              { label: 'Absent', value: summary.absentDays, max: summary.totalDays, color: Colors.danger },
              { label: 'Late', value: summary.lateDays, max: summary.totalDays, color: Colors.warning },
            ].map((item) => (
              <View key={item.label}>
                <View style={styles.barRow}>
                  <Text style={[styles.barLabel, { color: theme.textSecondary }]}>{item.label}</Text>
                  <Text style={[styles.barVal, { color: theme.text }]}>{item.value} days</Text>
                </View>
                <View style={[styles.barTrack, { backgroundColor: theme.surface2 }]}>
                  <View style={[styles.barFill, {
                    backgroundColor: item.color,
                    width: `${item.max > 0 ? (item.value / item.max) * 100 : 0}%`,
                  }]} />
                </View>
              </View>
            ))}
          </Card>
        </>
      )}

      {/* Announcements */}
      {announcements.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>School Announcements</Text>
          {announcements.slice(0, 4).map((a) => (
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
              <Text style={[styles.annContent, { color: theme.textSecondary }]} numberOfLines={2}>
                {a.content}
              </Text>
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, marginTop: 8 },
  greeting: { fontSize: 13 },
  name: { fontSize: 22, fontWeight: '800' },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12, marginTop: 20 },
  childCard: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 10 },
  childName: { fontSize: 15, fontWeight: '700' },
  childSub: { fontSize: 12, marginTop: 2 },
  childAdm: { fontSize: 11, fontFamily: 'monospace', marginTop: 2 },
  statsRow: { flexDirection: 'row' },
  barRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  barLabel: { fontSize: 13 },
  barVal: { fontSize: 13, fontWeight: '600' },
  barTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  annCard: { marginBottom: 10, gap: 6 },
  annRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  annDate: { fontSize: 11 },
  annTitle: { fontSize: 14, fontWeight: '600' },
  annContent: { fontSize: 13, lineHeight: 18 },
});
