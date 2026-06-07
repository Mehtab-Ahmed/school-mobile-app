import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, useColorScheme,
  Alert, ActivityIndicator, Platform,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { attendanceApi } from '../../api/attendance';
import { academicApi } from '../../api/academic';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Colors } from '../../theme/colors';
import { AttendanceRecord } from '../../types';

type AttStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY' | 'EXCUSED';

const STATUS_CONFIG: Record<AttStatus, { label: string; color: string; bg: string }> = {
  PRESENT: { label: 'P', color: Colors.success, bg: '#d1fae5' },
  ABSENT: { label: 'A', color: Colors.danger, bg: '#fee2e2' },
  LATE: { label: 'L', color: Colors.warning, bg: '#fef3c7' },
  HALF_DAY: { label: 'H', color: Colors.info, bg: '#cffafe' },
  EXCUSED: { label: 'E', color: '#8b5cf6', bg: '#ede9fe' },
};

export default function TeacherAttendance() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? Colors.dark : Colors.light;
  const qc = useQueryClient();

  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [statusMap, setStatusMap] = useState<Record<number, AttStatus>>({});

  const { data: classData, isLoading: classLoading } = useQuery({
    queryKey: ['class-sections'],
    queryFn: () => academicApi.classSections(),
  });

  const classes = classData?.data?.data ?? [];

  const { data: studentsData, isLoading: studLoading } = useQuery({
    queryKey: ['attendance-students', selectedClass, date],
    queryFn: () => attendanceApi.getStudents(selectedClass!, date),
    enabled: !!selectedClass,
  });

  // Sync statusMap when students load
  React.useEffect(() => {
    const records = studentsData?.data?.data ?? [];
    if (records.length > 0) {
      const map: Record<number, AttStatus> = {};
      records.forEach((r) => { map[r.studentId] = (r.status as AttStatus) || 'PRESENT'; });
      setStatusMap(map);
    }
  }, [studentsData]);

  const students = studentsData?.data?.data ?? [];

  const saveMutation = useMutation({
    mutationFn: () =>
      attendanceApi.mark({
        classSectionId: selectedClass!,
        date,
        attendanceRecords: Object.entries(statusMap).map(([id, status]) => ({
          studentId: Number(id),
          status,
        })),
      }),
    onSuccess: () => {
      Alert.alert('✅ Saved', 'Attendance has been marked successfully.');
      qc.invalidateQueries({ queryKey: ['attendance-students'] });
    },
    onError: () => Alert.alert('Error', 'Failed to save attendance. Please try again.'),
  });

  const toggle = (studentId: number) => {
    const order: AttStatus[] = ['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'EXCUSED'];
    const curr = statusMap[studentId] ?? 'PRESENT';
    const next = order[(order.indexOf(curr) + 1) % order.length];
    setStatusMap((prev) => ({ ...prev, [studentId]: next }));
  };

  const markAll = (status: AttStatus) => {
    const map: Record<number, AttStatus> = {};
    students.forEach((s) => { map[s.studentId] = status; });
    setStatusMap(map);
  };

  if (!selectedClass) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ScreenHeader title="Attendance" subtitle="Select a class" />
        {classLoading ? (
          <ActivityIndicator color={Colors.primary[500]} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={classes}
            keyExtractor={(c) => String(c.id)}
            contentContainerStyle={{ padding: 16, gap: 10 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => setSelectedClass(item.id)}
                style={[styles.classCard, { backgroundColor: theme.card, borderColor: theme.border }]}
              >
                <View style={[styles.classIcon, { backgroundColor: Colors.primary[500] + '22' }]}>
                  <Ionicons name="people" size={20} color={Colors.primary[500]} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.className, { color: theme.text }]}>
                    {item.grade?.name} – {item.section?.name}
                  </Text>
                  <Text style={[styles.classSub, { color: theme.textSecondary }]}>
                    Room {item.roomNumber ?? '—'} · {item.capacity ?? 0} students
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    );
  }

  const cls = classes.find((c) => c.id === selectedClass);
  const present = Object.values(statusMap).filter((s) => s === 'PRESENT').length;
  const absent = Object.values(statusMap).filter((s) => s === 'ABSENT').length;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScreenHeader
        title={`${cls?.grade?.name} – ${cls?.section?.name}`}
        subtitle={date}
        showBack
        right={
          <TouchableOpacity onPress={() => setSelectedClass(null)}>
            <Ionicons name="close" size={22} color={theme.text} />
          </TouchableOpacity>
        }
      />

      {/* Summary bar */}
      <View style={[styles.summaryBar, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        {[
          { label: 'Present', value: present, color: Colors.success },
          { label: 'Absent', value: absent, color: Colors.danger },
          { label: 'Total', value: students.length, color: Colors.primary[500] },
        ].map((s) => (
          <View key={s.label} style={styles.summaryItem}>
            <Text style={[styles.summaryVal, { color: s.color }]}>{s.value}</Text>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Bulk actions */}
      <View style={[styles.bulkRow, { borderBottomColor: theme.border }]}>
        <Text style={[styles.bulkLabel, { color: theme.textSecondary }]}>Mark All:</Text>
        {(['PRESENT', 'ABSENT'] as AttStatus[]).map((s) => {
          const cfg = STATUS_CONFIG[s];
          return (
            <TouchableOpacity
              key={s}
              onPress={() => markAll(s)}
              style={[styles.bulkBtn, { backgroundColor: cfg.bg }]}
            >
              <Text style={[styles.bulkBtnText, { color: cfg.color }]}>{s}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {studLoading ? (
        <ActivityIndicator color={Colors.primary[500]} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={students}
          keyExtractor={(s) => String(s.studentId)}
          contentContainerStyle={{ padding: 16, gap: 8, paddingBottom: 100 }}
          renderItem={({ item }) => {
            const status = statusMap[item.studentId] ?? 'PRESENT';
            const cfg = STATUS_CONFIG[status];
            return (
              <View style={[styles.stuRow, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={[styles.stuStatus, { backgroundColor: cfg.bg }]}>
                  <Text style={[styles.stuStatusText, { color: cfg.color }]}>{cfg.label}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.stuName, { color: theme.text }]}>{item.studentName}</Text>
                  <Text style={[styles.stuAdm, { color: theme.textMuted }]}>{item.admissionNumber}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => toggle(item.studentId)}
                  style={[styles.toggleBtn, { backgroundColor: cfg.bg }]}
                >
                  <Text style={[styles.toggleText, { color: cfg.color }]}>{status}</Text>
                </TouchableOpacity>
              </View>
            );
          }}
        />
      )}

      {/* Save button */}
      <View style={[styles.footer, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
        <Button
          label={`Save Attendance (${students.length} students)`}
          onPress={() => saveMutation.mutate()}
          loading={saveMutation.isPending}
          fullWidth
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  classCard: {
    flexDirection: 'row', alignItems: 'center', padding: 16,
    borderRadius: 14, borderWidth: 1, gap: 14,
  },
  classIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  className: { fontSize: 15, fontWeight: '600' },
  classSub: { fontSize: 12, marginTop: 2 },
  summaryBar: {
    flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12,
    borderBottomWidth: 1,
  },
  summaryItem: { alignItems: 'center' },
  summaryVal: { fontSize: 22, fontWeight: '800' },
  summaryLabel: { fontSize: 11, marginTop: 2 },
  bulkRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1,
  },
  bulkLabel: { fontSize: 12 },
  bulkBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 99 },
  bulkBtnText: { fontSize: 12, fontWeight: '700' },
  stuRow: {
    flexDirection: 'row', alignItems: 'center', padding: 12,
    borderRadius: 12, borderWidth: 1, gap: 12,
  },
  stuStatus: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  stuStatusText: { fontSize: 14, fontWeight: '800' },
  stuName: { fontSize: 14, fontWeight: '600' },
  stuAdm: { fontSize: 11, fontFamily: 'monospace' },
  toggleBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99 },
  toggleText: { fontSize: 11, fontWeight: '700' },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 16, borderTopWidth: 1,
  },
});
