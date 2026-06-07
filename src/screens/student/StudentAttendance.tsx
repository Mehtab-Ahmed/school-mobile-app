import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, useColorScheme, RefreshControl, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { studentsApi } from '../../api/students';
import { attendanceApi } from '../../api/attendance';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { Card } from '../../components/ui/Card';
import { Colors } from '../../theme/colors';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function StudentAttendance() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? Colors.dark : Colors.light;
  const user = useAuthStore((s) => s.user);

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year] = useState(now.getFullYear());

  const { data: studentsData } = useQuery({
    queryKey: ['student-profile', user?.userId],
    queryFn: () => studentsApi.list({ size: 100 }),
    enabled: !!user,
  });

  const student = studentsData?.data?.data?.content?.find((s) => s.user?.id === user?.userId);
  const studentId = student?.id;

  const fromDate = new Date(year, month, 1).toISOString().split('T')[0];
  const toDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['att-summary-detail', studentId, month, year],
    queryFn: () => attendanceApi.summary(studentId!, fromDate, toDate),
    enabled: !!studentId,
  });

  const summary = data?.data?.data;
  const attPct = summary?.attendancePercentage ?? 0;
  const good = attPct >= 75;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScreenHeader title="My Attendance" subtitle={`${MONTHS[month]} ${year}`} />

      {/* Month selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.monthScroll} contentContainerStyle={styles.monthContent}>
        {MONTHS.map((m, i) => (
          <View key={m} onTouchEnd={() => setMonth(i)}>
            <View style={[
              styles.monthTab,
              { backgroundColor: i === month ? Colors.primary[500] : theme.surface2 },
            ]}>
              <Text style={[styles.monthText, { color: i === month ? '#fff' : theme.textSecondary }]}>
                {m}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {isLoading ? (
        <ActivityIndicator color={Colors.primary[500]} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary[500]} />}
        >
          {/* Big percentage circle */}
          <Card style={styles.circleCard}>
            <View style={[styles.circle, { borderColor: good ? Colors.success : Colors.danger }]}>
              <Text style={[styles.circleValue, { color: good ? Colors.success : Colors.danger }]}>
                {attPct.toFixed(1)}%
              </Text>
              <Text style={[styles.circleLabel, { color: theme.textSecondary }]}>Attendance</Text>
            </View>
            <View style={styles.circleStats}>
              {[
                { label: 'Total Days', value: summary?.totalDays ?? 0, color: theme.text },
                { label: 'Present', value: summary?.presentDays ?? 0, color: Colors.success },
                { label: 'Absent', value: summary?.absentDays ?? 0, color: Colors.danger },
                { label: 'Late', value: summary?.lateDays ?? 0, color: Colors.warning },
              ].map((s) => (
                <View key={s.label} style={styles.circleStat}>
                  <Text style={[styles.circleStatVal, { color: s.color }]}>{s.value}</Text>
                  <Text style={[styles.circleStatLabel, { color: theme.textSecondary }]}>{s.label}</Text>
                </View>
              ))}
            </View>
          </Card>

          {/* Status message */}
          <Card style={[styles.statusCard, { backgroundColor: good ? '#d1fae5' : '#fee2e2' } as any]} padding={14}>
            <Text style={[styles.statusIcon]}>{ good ? '✅' : '⚠️' }</Text>
            <View>
              <Text style={[styles.statusTitle, { color: good ? '#065f46' : '#991b1b' }]}>
                {good ? 'Attendance is Good' : 'Attendance Below 75%'}
              </Text>
              <Text style={[styles.statusMsg, { color: good ? '#047857' : '#b91c1c' }]}>
                {good
                  ? 'Keep it up! You are maintaining good attendance.'
                  : 'Please improve attendance to avoid academic issues.'}
              </Text>
            </View>
          </Card>

          {/* Progress bars per type */}
          {summary && (
            <Card style={{ gap: 14 }}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Breakdown</Text>
              {[
                { label: 'Present', value: summary.presentDays, max: summary.totalDays, color: Colors.success },
                { label: 'Absent', value: summary.absentDays, max: summary.totalDays, color: Colors.danger },
                { label: 'Late', value: summary.lateDays, max: summary.totalDays, color: Colors.warning },
                { label: 'Half Day', value: summary.halfDays ?? 0, max: summary.totalDays, color: Colors.info },
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
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  monthScroll: { maxHeight: 60 },
  monthContent: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  monthTab: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10,
  },
  monthText: { fontSize: 12, fontWeight: '600' },
  circleCard: { alignItems: 'center', gap: 24 },
  circle: {
    width: 160, height: 160, borderRadius: 80, borderWidth: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  circleValue: { fontSize: 36, fontWeight: '900' },
  circleLabel: { fontSize: 12 },
  circleStats: { flexDirection: 'row', gap: 20, flexWrap: 'wrap', justifyContent: 'center' },
  circleStat: { alignItems: 'center' },
  circleStatVal: { fontSize: 22, fontWeight: '800' },
  circleStatLabel: { fontSize: 11 },
  statusCard: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  statusIcon: { fontSize: 28 },
  statusTitle: { fontSize: 15, fontWeight: '700' },
  statusMsg: { fontSize: 12, marginTop: 2 },
  cardTitle: { fontSize: 15, fontWeight: '700' },
  barRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  barLabel: { fontSize: 13 },
  barVal: { fontSize: 13, fontWeight: '600' },
  barTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
});
