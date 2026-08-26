import React, { useEffect, useState } from 'react';
import {
  ScrollView, View, Text, StyleSheet, useColorScheme,
  RefreshControl, TouchableOpacity,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { studentsApi } from '../../api/students';
import { parentApi } from '../../api/parent';
import { attendanceApi } from '../../api/attendance';
import { feesApi } from '../../api/fees';
import { communicationApi } from '../../api/communication';
import { StatCard } from '../../components/ui/StatCard';
import { Card } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { Colors } from '../../theme/colors';

function fmt(n: number) { return 'Rs ' + Number(n || 0).toLocaleString('en-IN'); }

function childName(c: any) {
  if (!c) return 'Child';
  if (c.fullName || c.studentName) return c.fullName ?? c.studentName;
  return `${c.user?.firstName ?? ''} ${c.user?.lastName ?? ''}`.trim() || c.admissionNumber || `Child #${c.id}`;
}

function childClass(c: any) {
  return [c.className ?? c.classSection?.grade?.name, c.sectionName ?? c.classSection?.section?.name].filter(Boolean).join(' - ');
}

export default function ParentDashboard() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? Colors.dark : Colors.light;
  const user = useAuthStore((s) => s.user);
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);

  const { data: childrenData, refetch, isRefetching } = useQuery({
    queryKey: ['children', user?.userId],
    queryFn: async () => {
      try {
        return await parentApi.children();
      } catch {
        return studentsApi.byParent(user!.userId);
      }
    },
    enabled: !!user,
  });

  const children = childrenData?.data?.data ?? [];
  const selectedChild = children.find((c: any) => (c.studentId ?? c.id) === selectedChildId) ?? children[0];
  const childId = selectedChild ? ((selectedChild as any).studentId ?? selectedChild.id) : null;

  useEffect(() => {
    if (!selectedChildId && children.length > 0) {
      const first = children[0] as any;
      setSelectedChildId(first.studentId ?? first.id);
    }
  }, [children, selectedChildId]);

  const today = new Date().toISOString().split('T')[0];
  const fromDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

  const { data: attData, refetch: refetchAtt } = useQuery({
    queryKey: ['att-parent', childId],
    queryFn: () => attendanceApi.summary(childId!, fromDate, today),
    enabled: !!childId,
  });

  const { data: feeData, refetch: refetchFees } = useQuery({
    queryKey: ['fee-parent', childId],
    queryFn: () => feesApi.studentSummary(childId!),
    enabled: !!childId,
  });

  const { data: overviewData, refetch: refetchOverview } = useQuery({
    queryKey: ['parent-overview', childId],
    queryFn: () => parentApi.overview(childId!),
    enabled: !!childId,
  });

  const { data: digestsData, refetch: refetchDigests } = useQuery({
    queryKey: ['parent-digests'],
    queryFn: () => parentApi.digests(),
    enabled: !!user,
  });

  const { data: annData } = useQuery({
    queryKey: ['ann-parents'],
    queryFn: () => communicationApi.announcements('PARENTS'),
  });

  const summary = attData?.data?.data;
  const fees = feeData?.data?.data;
  const overview = overviewData?.data?.data;
  const announcements = annData?.data?.data ?? [];
  const latestDigest = (digestsData?.data?.data ?? []).find((d) => d.studentId === childId);
  const attPct = Number(overview?.attendancePercentage ?? summary?.attendancePercentage ?? 0);

  const refreshAll = () => {
    refetch();
    refetchAtt();
    refetchFees();
    refetchOverview();
    refetchDigests();
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refreshAll} tintColor={Colors.primary[500]} />}
    >
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: theme.textSecondary }]}>Welcome back</Text>
          <Text style={[styles.name, { color: theme.text }]}>{user?.fullName}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: Colors.success }]}>
          <Text style={styles.badgeText}>PARENT</Text>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: theme.text }]}>My Children</Text>
      {children.length === 0 ? (
        <EmptyState icon="people-outline" title="No mapped children" subtitle="Ask the school admin to link your children to this parent account." />
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.childSwitcher}>
          {children.map((c: any) => {
            const id = c.studentId ?? c.id;
            const selected = id === childId;
            const name = childName(c);
            return (
              <TouchableOpacity
                key={id}
                activeOpacity={0.86}
                onPress={() => setSelectedChildId(id)}
                style={[styles.childChip, {
                  backgroundColor: selected ? Colors.primary[500] : theme.card,
                  borderColor: selected ? Colors.primary[500] : theme.border,
                }]}
              >
                <Avatar name={name} size={50} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.childName, { color: selected ? '#fff' : theme.text }]} numberOfLines={1}>{name}</Text>
                  <Text style={[styles.childSub, { color: selected ? '#e0e7ff' : theme.textSecondary }]} numberOfLines={1}>
                    {childClass(c) || 'Class not assigned'}
                  </Text>
                  <Text style={[styles.childAdm, { color: selected ? '#c7d2fe' : theme.textMuted }]}>{c.admissionNumber}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {!!childId && (
        <>
          <Card style={styles.digestCard}>
            <View style={styles.digestTop}>
              <View>
                <Text style={[styles.digestTitle, { color: theme.text }]}>Parent Overview</Text>
                <Text style={[styles.digestSub, { color: theme.textSecondary }]}>{childName(selectedChild)}</Text>
              </View>
              <Badge label={overview?.behaviorRemarks ? 'Review' : 'On Track'} variant={overview?.behaviorRemarks ? 'warning' : 'success'} small />
            </View>
            <Text style={[styles.digestText, { color: theme.textSecondary }]}>
              Attendance {attPct.toFixed(0)}%, {overview?.pendingHomework ?? 0} pending homework, fee balance {fmt(Number(overview?.feeBalance ?? fees?.totalBalance ?? 0))}.
            </Text>
            {latestDigest?.summary && (
              <Text style={[styles.digestText, { color: theme.textMuted }]} numberOfLines={3}>{latestDigest.summary}</Text>
            )}
          </Card>

          <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick Overview</Text>
          <View style={styles.statsRow}>
            <StatCard
              title="Attendance"
              value={`${attPct.toFixed(0)}%`}
              subtitle={`${summary?.presentDays ?? overview?.presentDays ?? 0}/${summary?.totalDays ?? overview?.totalDays ?? 0} days`}
              icon="checkmark-circle"
              iconColor={attPct >= 75 ? Colors.success : Colors.danger}
            />
            <View style={{ width: 12 }} />
            <StatCard
              title="Fee Balance"
              value={fmt(Number(fees?.totalBalance ?? overview?.feeBalance ?? 0))}
              subtitle={fees?.overdueAmount || overview?.overdueFees ? 'Has overdue' : 'All clear'}
              icon="card"
              iconColor={fees?.overdueAmount || overview?.overdueFees ? Colors.danger : Colors.success}
            />
          </View>

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
        </>
      )}

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
  childSwitcher: { gap: 10, paddingRight: 12 },
  childChip: { width: 250, flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, borderWidth: 1, padding: 14 },
  childName: { fontSize: 15, fontWeight: '700' },
  childSub: { fontSize: 12, marginTop: 2 },
  childAdm: { fontSize: 11, fontFamily: 'monospace', marginTop: 2 },
  digestCard: { gap: 10, marginTop: 14 },
  digestTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  digestTitle: { fontSize: 16, fontWeight: '800' },
  digestSub: { fontSize: 12, marginTop: 2 },
  digestText: { fontSize: 13, lineHeight: 19 },
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
