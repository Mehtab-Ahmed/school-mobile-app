import React from 'react';
import {
  View, Text, StyleSheet, FlatList, useColorScheme,
  RefreshControl, ActivityIndicator, ScrollView,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { studentsApi } from '../../api/students';
import { feesApi } from '../../api/fees';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { Card } from '../../components/ui/Card';
import { Badge, statusVariant } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { Colors } from '../../theme/colors';

function fmt(n: number) { return '₹' + n.toLocaleString('en-IN'); }

export default function StudentFees() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? Colors.dark : Colors.light;
  const user = useAuthStore((s) => s.user);

  const { data: studentsData } = useQuery({
    queryKey: ['student-profile', user?.userId],
    queryFn: () => studentsApi.list({ size: 100 }),
    enabled: !!user,
  });

  const student = studentsData?.data?.data?.content?.find((s) => s.user?.id === user?.userId);
  const studentId = student?.id;

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['fee-student', studentId],
    queryFn: () => feesApi.studentSummary(studentId!),
    enabled: !!studentId,
  });

  const summary = data?.data?.data;
  const payments = summary?.payments ?? [];

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ScreenHeader title="My Fees" />
        <ActivityIndicator color={Colors.primary[500]} style={{ marginTop: 40 }} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScreenHeader title="My Fees" />
      <FlatList
        data={payments}
        keyExtractor={(p) => String(p.id)}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary[500]} />}
        contentContainerStyle={[styles.list, payments.length === 0 && { flex: 1 }]}
        ListHeaderComponent={() =>
          summary ? (
            <View style={styles.header}>
              {/* Summary row */}
              <View style={styles.summaryRow}>
                {[
                  { label: 'Total Fee', value: fmt(Number(summary.totalFee)), color: theme.text },
                  { label: 'Paid', value: fmt(Number(summary.totalPaid)), color: Colors.success },
                  { label: 'Balance', value: fmt(Number(summary.totalBalance)), color: Colors.warning },
                ].map((s) => (
                  <Card key={s.label} style={styles.miniCard} padding={14}>
                    <Text style={[styles.miniVal, { color: s.color }]}>{s.value}</Text>
                    <Text style={[styles.miniLabel, { color: theme.textSecondary }]}>{s.label}</Text>
                  </Card>
                ))}
              </View>

              {/* Progress */}
              {Number(summary.totalFee) > 0 && (
                <Card style={{ gap: 8 }}>
                  <View style={styles.progressRow}>
                    <Text style={[styles.progressLabel, { color: theme.textSecondary }]}>Fee paid</Text>
                    <Text style={[styles.progressPct, { color: Colors.success }]}>
                      {((Number(summary.totalPaid) / Number(summary.totalFee)) * 100).toFixed(0)}%
                    </Text>
                  </View>
                  <View style={[styles.barTrack, { backgroundColor: theme.surface2 }]}>
                    <View style={[styles.barFill, {
                      width: `${(Number(summary.totalPaid) / Number(summary.totalFee)) * 100}%`,
                      backgroundColor: Colors.success,
                    }]} />
                  </View>
                </Card>
              )}

              {Number(summary.overdueAmount) > 0 && (
                <Card style={{ backgroundColor: '#fee2e2', flexDirection: 'row', alignItems: 'center', gap: 12 }} padding={14}>
                  <Text style={{ fontSize: 24 }}>⚠️</Text>
                  <View>
                    <Text style={{ color: '#991b1b', fontWeight: '700', fontSize: 15 }}>Overdue Amount</Text>
                    <Text style={{ color: Colors.danger, fontSize: 18, fontWeight: '800' }}>
                      {fmt(Number(summary.overdueAmount))}
                    </Text>
                  </View>
                </Card>
              )}

              <Text style={[styles.sectionTitle, { color: theme.text }]}>Payment History</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={<EmptyState icon="card-outline" title="No payment records" />}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item }) => (
          <Card style={styles.payRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.payReceipt, { color: theme.textMuted }]}>{item.receiptNumber}</Text>
              <Text style={[styles.payCategory, { color: theme.text }]}>{item.feeCategory?.name ?? 'General'}</Text>
              <Text style={[styles.payDate, { color: theme.textSecondary }]}>
                {item.paymentDate} · {item.paymentMethod ?? 'N/A'}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 6 }}>
              <Text style={[styles.payAmt, { color: theme.text }]}>{fmt(Number(item.amount))}</Text>
              <Badge label={item.status} variant={statusVariant(item.status)} small />
            </View>
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: 16, paddingBottom: 40 },
  header: { gap: 12, marginBottom: 8 },
  summaryRow: { flexDirection: 'row', gap: 8 },
  miniCard: { flex: 1 },
  miniVal: { fontSize: 16, fontWeight: '800' },
  miniLabel: { fontSize: 11, marginTop: 2 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { fontSize: 13 },
  progressPct: { fontSize: 13, fontWeight: '700' },
  barTrack: { height: 10, borderRadius: 5, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 5 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  payRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  payReceipt: { fontSize: 10, fontFamily: 'monospace' },
  payCategory: { fontSize: 14, fontWeight: '600', marginTop: 2 },
  payDate: { fontSize: 11, marginTop: 2 },
  payAmt: { fontSize: 16, fontWeight: '700' },
});
