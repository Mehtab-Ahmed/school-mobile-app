import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  useColorScheme, RefreshControl, ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { studentsApi } from '../../api/students';
import { feesApi } from '../../api/fees';
import { Avatar } from '../../components/ui/Avatar';
import { Badge, statusVariant } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { Colors } from '../../theme/colors';
import { Student } from '../../types';

function fmt(n: number) { return '₹' + n.toLocaleString('en-IN'); }

export default function AdminFees() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? Colors.dark : Colors.light;
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const { data: studentsData, isLoading } = useQuery({
    queryKey: ['students-fees-list'],
    queryFn: () => studentsApi.list({ size: 50 }),
  });

  const students = studentsData?.data?.data?.content ?? [];

  const { data: feeData, isLoading: feeLoading, refetch } = useQuery({
    queryKey: ['fee-summary', selectedStudent?.id],
    queryFn: () => feesApi.studentSummary(selectedStudent!.id),
    enabled: !!selectedStudent,
  });

  const summary = feeData?.data?.data;

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ScreenHeader title="Fee Management" />
        <ActivityIndicator color={Colors.primary[500]} style={{ marginTop: 40 }} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScreenHeader title="Fee Management" subtitle="Select a student" />

      {!selectedStudent ? (
        <FlatList
          data={students}
          keyExtractor={(s) => String(s.id)}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          renderItem={({ item }) => {
            const name = `${item.user.firstName} ${item.user.lastName}`;
            return (
              <TouchableOpacity
                onPress={() => setSelectedStudent(item)}
                style={[styles.studentRow, { backgroundColor: theme.card, borderColor: theme.border }]}
              >
                <Avatar name={name} size={44} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sName, { color: theme.text }]}>{name}</Text>
                  <Text style={[styles.sSub, { color: theme.textSecondary }]}>
                    {item.classSection?.grade?.name} – {item.classSection?.section?.name}
                  </Text>
                </View>
                <Badge label={item.admissionNumber} small />
              </TouchableOpacity>
            );
          }}
        />
      ) : (
        <FlatList
          data={summary?.payments ?? []}
          keyExtractor={(p) => String(p.id)}
          refreshControl={<RefreshControl refreshing={feeLoading} onRefresh={refetch} tintColor={Colors.primary[500]} />}
          ListHeaderComponent={() => (
            <View style={{ gap: 16 }}>
              {/* Back + Student */}
              <TouchableOpacity onPress={() => setSelectedStudent(null)} style={styles.backRow}>
                <Text style={[styles.backText, { color: Colors.primary[500] }]}>← All Students</Text>
              </TouchableOpacity>

              {/* Summary cards */}
              {summary && (
                <View style={styles.statsRow}>
                  {[
                    { label: 'Total Fee', value: fmt(Number(summary.totalFee)), color: theme.text },
                    { label: 'Paid', value: fmt(Number(summary.totalPaid)), color: Colors.success },
                    { label: 'Balance', value: fmt(Number(summary.totalBalance)), color: Colors.warning },
                    { label: 'Overdue', value: fmt(Number(summary.overdueAmount)), color: Colors.danger },
                  ].map((s) => (
                    <Card key={s.label} style={styles.miniCard} padding={12}>
                      <Text style={[styles.miniVal, { color: s.color }]}>{s.value}</Text>
                      <Text style={[styles.miniLabel, { color: theme.textSecondary }]}>{s.label}</Text>
                    </Card>
                  ))}
                </View>
              )}
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Payment History</Text>
            </View>
          )}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          renderItem={({ item }) => (
            <Card style={styles.payRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.payReceipt, { color: theme.textMuted }]}>{item.receiptNumber}</Text>
                <Text style={[styles.payCategory, { color: theme.text }]}>{item.feeCategory?.name ?? 'General'}</Text>
                <Text style={[styles.payDate, { color: theme.textSecondary }]}>{item.paymentDate}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 6 }}>
                <Text style={[styles.payAmt, { color: theme.text }]}>{fmt(Number(item.amount))}</Text>
                <Badge label={item.status} variant={statusVariant(item.status)} small />
              </View>
            </Card>
          )}
          ListEmptyComponent={
            !feeLoading ? (
              <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                <Text style={{ color: theme.textSecondary }}>No payment records</Text>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  studentRow: {
    flexDirection: 'row', alignItems: 'center', padding: 14,
    borderRadius: 14, borderWidth: 1, gap: 12,
  },
  sName: { fontSize: 14, fontWeight: '600' },
  sSub: { fontSize: 12 },
  backRow: { paddingVertical: 4 },
  backText: { fontSize: 14, fontWeight: '600' },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  miniCard: { flex: 1, minWidth: '44%' },
  miniVal: { fontSize: 18, fontWeight: '700' },
  miniLabel: { fontSize: 11, marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  payRow: { flexDirection: 'row', alignItems: 'center' },
  payReceipt: { fontSize: 10, fontFamily: 'monospace' },
  payCategory: { fontSize: 14, fontWeight: '600', marginTop: 2 },
  payDate: { fontSize: 11, marginTop: 2 },
  payAmt: { fontSize: 16, fontWeight: '700' },
});
