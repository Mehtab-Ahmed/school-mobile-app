import React from 'react';
import {
  ScrollView, View, Text, StyleSheet, useColorScheme, RefreshControl,
  Dimensions,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../../api/dashboard';
import { useAuthStore } from '../../store/authStore';
import { StatCard } from '../../components/ui/StatCard';
import { Card } from '../../components/ui/Card';
import { Colors } from '../../theme/colors';

const { width } = Dimensions.get('window');

function formatCurrency(n: number) {
  return '₹' + n.toLocaleString('en-IN');
}

export default function AdminDashboard() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? Colors.dark : Colors.light;
  const user = useAuthStore((s) => s.user);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => dashboardApi.admin(),
  });

  const d = data?.data?.data;

  const gradeEntries = d?.studentsByGrade ? Object.entries(d.studentsByGrade) : [];
  const maxGrade = Math.max(...gradeEntries.map(([, v]) => v as number), 1);

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
        <View style={[styles.badge, { backgroundColor: Colors.primary[500] }]}>
          <Text style={styles.badgeText}>ADMIN</Text>
        </View>
      </View>

      {/* Quick stats */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Overview</Text>
      <View style={styles.statsRow}>
        <StatCard title="Students" value={d?.totalStudents ?? '—'} subtitle={`${d?.activeStudents ?? 0} active`} icon="people" iconColor={Colors.primary[500]} />
        <View style={{ width: 12 }} />
        <StatCard title="Teachers" value={d?.totalTeachers ?? '—'} subtitle={`${d?.activeTeachers ?? 0} active`} icon="school" iconColor="#8b5cf6" />
      </View>
      <View style={[styles.statsRow, { marginTop: 12 }]}>
        <StatCard title="Fee Collected" value={d ? formatCurrency(Number(d.totalFeeCollected)) : '₹0'} subtitle={`${formatCurrency(Number(d?.totalFeePending ?? 0))} pending`} icon="card" iconColor={Colors.success} />
        <View style={{ width: 12 }} />
        <StatCard title="Overdue" value={d?.overduePayments ?? '—'} subtitle="Payments" icon="alert-circle" iconColor={Colors.warning} />
      </View>

      {/* Library & Leave */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Library & Leaves</Text>
      <View style={styles.statsRow}>
        <StatCard title="Books" value={d?.totalBooks ?? '—'} subtitle={`${d?.booksIssued ?? 0} issued`} icon="library" iconColor={Colors.info} />
        <View style={{ width: 12 }} />
        <StatCard title="Overdue Books" value={d?.overdueBooks ?? '—'} icon="book" iconColor={Colors.danger} />
      </View>
      <View style={[styles.statsRow, { marginTop: 12 }]}>
        <StatCard title="Pending Leaves" value={d?.pendingLeaveRequests ?? '—'} subtitle="Awaiting approval" icon="time" iconColor="#f97316" />
        <View style={{ width: 12 }} />
        <StatCard title="Last Payroll" value={d?.lastPayrollNetAmount ? formatCurrency(Number(d.lastPayrollNetAmount)) : '—'} subtitle={d?.lastPayrollMonth ?? ''} icon="cash" iconColor={Colors.primary[400]} />
      </View>

      {/* Grade bar chart */}
      {gradeEntries.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Students by Grade</Text>
          <Card style={{ gap: 10 }}>
            {gradeEntries.map(([grade, count]) => (
              <View key={grade}>
                <View style={styles.barLabelRow}>
                  <Text style={[styles.barLabel, { color: theme.textSecondary }]}>{grade}</Text>
                  <Text style={[styles.barValue, { color: theme.text }]}>{String(count)}</Text>
                </View>
                <View style={[styles.barTrack, { backgroundColor: theme.surface2 }]}>
                  <View
                    style={[styles.barFill, {
                      width: `${((count as number) / maxGrade) * 100}%`,
                      backgroundColor: Colors.primary[500],
                    }]}
                  />
                </View>
              </View>
            ))}
          </Card>
        </>
      )}

      {/* Fee split */}
      {d && (
        <>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Fee Collection</Text>
          <Card>
            <View style={styles.feeRow}>
              {[
                { label: 'Collected', value: Number(d.totalFeeCollected), color: Colors.success },
                { label: 'Pending', value: Number(d.totalFeePending), color: Colors.warning },
              ].map((item) => (
                <View key={item.label} style={styles.feeItem}>
                  <View style={[styles.feeDot, { backgroundColor: item.color }]} />
                  <Text style={[styles.feeLabel, { color: theme.textSecondary }]}>{item.label}</Text>
                  <Text style={[styles.feeAmount, { color: theme.text }]}>{formatCurrency(item.value)}</Text>
                </View>
              ))}
            </View>
            {/* Progress bar */}
            {(() => {
              const total = Number(d.totalFeeCollected) + Number(d.totalFeePending);
              const pct = total > 0 ? (Number(d.totalFeeCollected) / total) * 100 : 0;
              return (
                <View style={[styles.barTrack, { backgroundColor: theme.surface2, marginTop: 16, height: 12, borderRadius: 6 }]}>
                  <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: Colors.success, borderRadius: 6 }]} />
                </View>
              );
            })()}
          </Card>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, marginTop: 8 },
  greeting: { fontSize: 13 },
  name: { fontSize: 22, fontWeight: '800' },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12, marginTop: 20 },
  statsRow: { flexDirection: 'row' },
  barLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  barLabel: { fontSize: 12 },
  barValue: { fontSize: 12, fontWeight: '600' },
  barTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  feeRow: { flexDirection: 'row', gap: 20 },
  feeItem: { flex: 1, gap: 4 },
  feeDot: { width: 10, height: 10, borderRadius: 5 },
  feeLabel: { fontSize: 12 },
  feeAmount: { fontSize: 18, fontWeight: '700' },
});
