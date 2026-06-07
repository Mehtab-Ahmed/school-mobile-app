import React from 'react';
import { View, Text, StyleSheet, ScrollView, useColorScheme, RefreshControl, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { studentsApi } from '../../api/students';
import { attendanceApi } from '../../api/attendance';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { Card } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { Colors } from '../../theme/colors';

export default function ParentAttendance() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? Colors.dark : Colors.light;
  const user = useAuthStore((s) => s.user);

  const { data: childrenData } = useQuery({
    queryKey: ['children', user?.userId],
    queryFn: () => studentsApi.byParent(user!.userId),
    enabled: !!user,
  });

  const children = childrenData?.data?.data ?? [];
  const childId = children[0]?.id;
  const childName = children[0] ? `${children[0].user.firstName} ${children[0].user.lastName}` : '';

  const today = new Date().toISOString().split('T')[0];
  const fromDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['att-parent-detail', childId],
    queryFn: () => attendanceApi.summary(childId!, fromDate, today),
    enabled: !!childId,
  });

  const summary = data?.data?.data;
  const attPct = summary?.attendancePercentage ?? 0;
  const good = attPct >= 75;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScreenHeader title="Child's Attendance" />
      {isLoading ? (
        <ActivityIndicator color={Colors.primary[500]} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary[500]} />}
        >
          {/* Child info */}
          {childName && (
            <Card style={styles.childRow}>
              <Avatar name={childName} size={48} />
              <View>
                <Text style={[styles.childName, { color: theme.text }]}>{childName}</Text>
                <Text style={[styles.childSub, { color: theme.textSecondary }]}>
                  {children[0]?.classSection?.grade?.name} – {children[0]?.classSection?.section?.name}
                </Text>
              </View>
            </Card>
          )}

          {/* Percentage */}
          <Card style={styles.circleCard}>
            <View style={[styles.circle, { borderColor: good ? Colors.success : Colors.danger }]}>
              <Text style={[styles.circleVal, { color: good ? Colors.success : Colors.danger }]}>
                {attPct.toFixed(1)}%
              </Text>
              <Text style={[styles.circleLabel, { color: theme.textSecondary }]}>Attendance</Text>
            </View>
            <View style={styles.circleStats}>
              {[
                { l: 'Present', v: summary?.presentDays ?? 0, c: Colors.success },
                { l: 'Absent', v: summary?.absentDays ?? 0, c: Colors.danger },
                { l: 'Late', v: summary?.lateDays ?? 0, c: Colors.warning },
              ].map((s) => (
                <View key={s.l} style={styles.cStat}>
                  <Text style={[styles.cStatVal, { color: s.c }]}>{s.v}</Text>
                  <Text style={[styles.cStatLabel, { color: theme.textSecondary }]}>{s.l}</Text>
                </View>
              ))}
            </View>
          </Card>

          {/* Alert */}
          <Card style={{ backgroundColor: good ? '#d1fae5' : '#fee2e2', flexDirection: 'row', alignItems: 'center', gap: 12 }} padding={16}>
            <Text style={{ fontSize: 28 }}>{good ? '✅' : '⚠️'}</Text>
            <View>
              <Text style={{ color: good ? '#065f46' : '#991b1b', fontSize: 15, fontWeight: '700' }}>
                {good ? 'Attendance is Good' : 'Attendance Below 75%'}
              </Text>
              <Text style={{ color: good ? '#047857' : '#b91c1c', fontSize: 12, marginTop: 3 }}>
                {good ? 'Your child is maintaining regular attendance.' : 'Please encourage your child to attend regularly.'}
              </Text>
            </View>
          </Card>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  childRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  childName: { fontSize: 16, fontWeight: '700' },
  childSub: { fontSize: 12, marginTop: 2 },
  circleCard: { alignItems: 'center', gap: 24 },
  circle: {
    width: 150, height: 150, borderRadius: 75, borderWidth: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  circleVal: { fontSize: 32, fontWeight: '900' },
  circleLabel: { fontSize: 12 },
  circleStats: { flexDirection: 'row', gap: 28 },
  cStat: { alignItems: 'center' },
  cStatVal: { fontSize: 22, fontWeight: '800' },
  cStatLabel: { fontSize: 11 },
});
