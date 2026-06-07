import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  useColorScheme, ActivityIndicator, FlatList, RefreshControl,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { studentsApi } from '../../api/students';
import { academicApi } from '../../api/academic';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Colors } from '../../theme/colors';
import { TimetableEntry } from '../../types';

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const SUBJECT_COLORS = [
  Colors.primary[500], '#8b5cf6', '#06b6d4', '#10b981',
  '#f59e0b', '#ef4444', '#ec4899', '#14b8a6',
];

function subjectColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h + name.charCodeAt(i)) % SUBJECT_COLORS.length;
  return SUBJECT_COLORS[h];
}

function todayIndex() {
  const d = new Date().getDay(); // 0=Sun, 1=Mon...
  return d === 0 ? 0 : Math.min(d - 1, 5);
}

export default function StudentTimetable() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? Colors.dark : Colors.light;
  const user = useAuthStore(s => s.user);
  const [selectedDay, setSelectedDay] = useState(todayIndex());

  const { data: studentsData } = useQuery({
    queryKey: ['student-profile', user?.userId],
    queryFn: () => studentsApi.list({ size: 100 }),
    enabled: !!user,
  });

  const student = studentsData?.data?.data?.content?.find(s => s.user?.id === user?.userId);
  const classSectionId = student?.classSection?.id;

  const { data: ttData, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['timetable-class', classSectionId],
    queryFn: () => academicApi.timetable(classSectionId!),
    enabled: !!classSectionId,
  });

  const allEntries: TimetableEntry[] = ttData?.data?.data ?? [];
  const dayEntries = allEntries
    .filter(e => e.dayOfWeek === DAYS[selectedDay])
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={Colors.primary[500]} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: Colors.primary[500] }]}>
        <Text style={styles.headerTitle}>My Timetable</Text>
        {student && (
          <Text style={styles.headerSub}>
            {student.classSection?.grade?.name} – {student.classSection?.section?.name}
          </Text>
        )}
      </View>

      {/* Day Tabs */}
      <View style={[styles.dayTabsWrap, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayTabs}>
          {DAY_SHORT.map((day, i) => {
            const isToday = i === todayIndex();
            const isSelected = i === selectedDay;
            return (
              <TouchableOpacity
                key={day}
                onPress={() => setSelectedDay(i)}
                style={[
                  styles.dayTab,
                  isSelected && { backgroundColor: Colors.primary[500] },
                  isToday && !isSelected && { borderColor: Colors.primary[300], borderWidth: 1 },
                ]}
              >
                <Text style={[styles.dayText, { color: isSelected ? '#fff' : theme.textSecondary }]}>{day}</Text>
                {isToday && <View style={[styles.todayDot, { backgroundColor: isSelected ? '#fff' : Colors.primary[500] }]} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Today label */}
      <View style={[styles.dayLabel, { backgroundColor: theme.surface2 }]}>
        <Text style={[styles.dayLabelText, { color: theme.textSecondary }]}>
          {DAYS[selectedDay]}{selectedDay === todayIndex() ? '  · Today' : ''}
        </Text>
        <Text style={[styles.slotCount, { color: theme.textMuted }]}>{dayEntries.length} periods</Text>
      </View>

      <FlatList
        data={dayEntries}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary[500]} />}
        ListEmptyComponent={
          <EmptyState icon="calendar-outline" title="No classes" subtitle={`No periods scheduled for ${DAY_SHORT[selectedDay]}`} />
        }
        renderItem={({ item, index }) => {
          const color = subjectColor(item.subject?.name ?? 'X');
          return (
            <View style={styles.entryRow}>
              {/* Time column */}
              <View style={styles.timeCol}>
                <Text style={[styles.startTime, { color: theme.text }]}>{item.startTime}</Text>
                <View style={[styles.timeLine, { backgroundColor: theme.border }]} />
                <Text style={[styles.endTime, { color: theme.textMuted }]}>{item.endTime}</Text>
              </View>

              {/* Period card */}
              <View style={[styles.periodCard, { backgroundColor: theme.card, borderColor: theme.border, borderLeftColor: color, borderLeftWidth: 4 }]}>
                <View style={styles.periodHeader}>
                  <View style={[styles.subjectBadge, { backgroundColor: color + '20' }]}>
                    <Ionicons name="book-outline" size={14} color={color} />
                    <Text style={[styles.subjectName, { color }]} numberOfLines={1}>
                      {item.subject?.name ?? 'Period'}
                    </Text>
                  </View>
                  <View style={[styles.periodNum, { backgroundColor: theme.surface2 }]}>
                    <Text style={[styles.periodNumText, { color: theme.textMuted }]}>P{index + 1}</Text>
                  </View>
                </View>
                {item.teacher && (
                  <View style={styles.teacherRow}>
                    <Ionicons name="person-outline" size={12} color={theme.textMuted} />
                    <Text style={[styles.teacherName, { color: theme.textSecondary }]}>
                      {item.teacher.firstName} {item.teacher.lastName}
                    </Text>
                  </View>
                )}
                {item.classSection?.roomNumber && (
                  <View style={styles.teacherRow}>
                    <Ionicons name="location-outline" size={12} color={theme.textMuted} />
                    <Text style={[styles.teacherName, { color: theme.textSecondary }]}>
                      Room {item.classSection.roomNumber}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20 },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '800' },
  headerSub: { color: '#ffffff99', fontSize: 13, marginTop: 2 },
  dayTabsWrap: { borderBottomWidth: 1 },
  dayTabs: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  dayTab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 99, alignItems: 'center' },
  dayText: { fontSize: 13, fontWeight: '600' },
  todayDot: { width: 4, height: 4, borderRadius: 2, marginTop: 3 },
  dayLabel: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 8 },
  dayLabelText: { fontSize: 12, fontWeight: '600', letterSpacing: 0.5 },
  slotCount: { fontSize: 12 },
  list: { padding: 16, gap: 12, paddingBottom: 40 },
  entryRow: { flexDirection: 'row', gap: 12 },
  timeCol: { width: 52, alignItems: 'center', paddingTop: 4 },
  startTime: { fontSize: 12, fontWeight: '700' },
  timeLine: { width: 2, flex: 1, marginVertical: 4, minHeight: 20 },
  endTime: { fontSize: 10 },
  periodCard: {
    flex: 1, borderRadius: 14, borderWidth: 1,
    padding: 12, gap: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  periodHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  subjectBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  subjectName: { fontSize: 13, fontWeight: '700' },
  periodNum: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  periodNumText: { fontSize: 11, fontWeight: '600' },
  teacherRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  teacherName: { fontSize: 12 },
});
