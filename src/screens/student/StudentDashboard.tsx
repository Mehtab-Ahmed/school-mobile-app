import React from 'react';
import {
  ScrollView, View, Text, StyleSheet, useColorScheme, RefreshControl,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { studentsApi } from '../../api/students';
import { attendanceApi } from '../../api/attendance';
import { feesApi } from '../../api/fees';
import { homeworkApi } from '../../api/homework';
import { communicationApi } from '../../api/communication';
import { StatCard } from '../../components/ui/StatCard';
import { Card } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Colors } from '../../theme/colors';

function fmt(n: number) { return '₹' + n.toLocaleString('en-IN'); }

export default function StudentDashboard() {
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

  const today = new Date().toISOString().split('T')[0];
  const fromDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

  const { data: attData, refetch, isRefetching } = useQuery({
    queryKey: ['att-summary-student', studentId],
    queryFn: () => attendanceApi.summary(studentId!, fromDate, today),
    enabled: !!studentId,
  });

  const { data: feeData } = useQuery({
    queryKey: ['fee-student', studentId],
    queryFn: () => feesApi.studentSummary(studentId!),
    enabled: !!studentId,
  });

  const { data: hwData } = useQuery({
    queryKey: ['pending-hw-student', studentId],
    queryFn: () => homeworkApi.pending(studentId!),
    enabled: !!studentId,
  });

  const { data: annData } = useQuery({
    queryKey: ['ann-students'],
    queryFn: () => communicationApi.announcements('STUDENTS'),
  });

  const summary = attData?.data?.data;
  const fees = feeData?.data?.data;
  const homework = hwData?.data?.data ?? [];
  const announcements = annData?.data?.data ?? [];
  const attPct = summary?.attendancePercentage ?? 0;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary[500]} />}
    >
      {/* Profile */}
      <View style={[styles.profileCard, { backgroundColor: Colors.primary[500] }]}>
        <Avatar name={user?.fullName ?? 'Student'} size={60} />
        <View style={{ flex: 1 }}>
          <Text style={styles.profileName}>{user?.fullName}</Text>
          {student && (
            <Text style={styles.profileSub}>
              {student.classSection?.grade?.name} – {student.classSection?.section?.name}
              {'  '}
              <Text style={styles.profileAdm}>{student.admissionNumber}</Text>
            </Text>
          )}
        </View>
        <View style={[styles.badge, { backgroundColor: '#ffffff33' }]}>
          <Text style={styles.badgeText}>STUDENT</Text>
        </View>
      </View>

      {/* Stats */}
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
          title="Pending HW"
          value={homework.length}
          subtitle={homework.length === 0 ? 'All done! 🎉' : 'tasks due'}
          icon="book"
          iconColor={Colors.warning}
        />
      </View>
      <View style={[styles.statsRow, { marginTop: 12 }]}>
        <StatCard
          title="Fee Balance"
          value={fees ? fmt(Number(fees.totalBalance)) : '₹0'}
          subtitle={fees?.overdueAmount ? `${fmt(Number(fees.overdueAmount))} overdue` : 'No dues'}
          icon="card"
          iconColor={fees?.overdueAmount ? Colors.danger : Colors.success}
        />
        <View style={{ width: 12 }} />
        <StatCard
          title="Notices"
          value={announcements.length}
          subtitle="Announcements"
          icon="megaphone"
          iconColor={Colors.info}
        />
      </View>

      {/* Attendance progress */}
      {summary && (
        <>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>This Month's Attendance</Text>
          <Card>
            <View style={styles.attProgress}>
              <View style={{ flex: 1 }}>
                <View style={[styles.attBar, { backgroundColor: theme.surface2 }]}>
                  <View style={[styles.attFill, {
                    width: `${attPct}%`,
                    backgroundColor: attPct >= 75 ? Colors.success : Colors.danger,
                  }]} />
                </View>
                <View style={styles.attStats}>
                  {[
                    { label: 'Present', value: summary.presentDays, color: Colors.success },
                    { label: 'Absent', value: summary.absentDays, color: Colors.danger },
                    { label: 'Late', value: summary.lateDays, color: Colors.warning },
                  ].map((s) => (
                    <View key={s.label} style={styles.attStat}>
                      <Text style={[styles.attStatVal, { color: s.color }]}>{s.value}</Text>
                      <Text style={[styles.attStatLabel, { color: theme.textSecondary }]}>{s.label}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <View style={styles.attCircle}>
                <Text style={[styles.attPct, { color: attPct >= 75 ? Colors.success : Colors.danger }]}>
                  {attPct.toFixed(0)}%
                </Text>
              </View>
            </View>
          </Card>
        </>
      )}

      {/* Pending homework */}
      {homework.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Pending Homework</Text>
          {homework.slice(0, 4).map((hw) => (
            <Card key={hw.id} style={styles.hwCard}>
              <View style={styles.hwRow}>
                <View style={[styles.hwDot, { backgroundColor: Colors.warning }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.hwTitle, { color: theme.text }]}>{hw.title}</Text>
                  <Text style={[styles.hwSub, { color: theme.textSecondary }]}>
                    {hw.subject?.name} · Due {hw.dueDate}
                  </Text>
                </View>
                <Badge label="DUE" variant="warning" small />
              </View>
            </Card>
          ))}
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
  profileCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 20, borderRadius: 20, marginBottom: 20,
    shadowColor: Colors.primary[500], shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  profileName: { color: '#fff', fontSize: 18, fontWeight: '800' },
  profileSub: { color: '#ffffffcc', fontSize: 12, marginTop: 2 },
  profileAdm: { fontFamily: 'monospace', color: '#ffffff99' },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  statsRow: { flexDirection: 'row' },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 10, marginTop: 20 },
  attProgress: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  attBar: { height: 10, borderRadius: 5, overflow: 'hidden', marginBottom: 16 },
  attFill: { height: '100%', borderRadius: 5 },
  attStats: { flexDirection: 'row', gap: 20 },
  attStat: { alignItems: 'center' },
  attStatVal: { fontSize: 20, fontWeight: '800' },
  attStatLabel: { fontSize: 11 },
  attCircle: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  attPct: { fontSize: 18, fontWeight: '800' },
  hwCard: { marginBottom: 8 },
  hwRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  hwDot: { width: 10, height: 10, borderRadius: 5 },
  hwTitle: { fontSize: 14, fontWeight: '600' },
  hwSub: { fontSize: 12, marginTop: 2 },
  annCard: { marginBottom: 10, gap: 6 },
  annRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  annDate: { fontSize: 11 },
  annTitle: { fontSize: 14, fontWeight: '600' },
  annContent: { fontSize: 13, lineHeight: 18 },
});
