import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, useColorScheme, FlatList, ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { academicApi } from '../../api/academic';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { Card } from '../../components/ui/Card';
import { Colors } from '../../theme/colors';

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
const DAY_SHORT: Record<string, string> = {
  MONDAY: 'MON', TUESDAY: 'TUE', WEDNESDAY: 'WED',
  THURSDAY: 'THU', FRIDAY: 'FRI', SATURDAY: 'SAT',
};

const SUBJECT_COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

function subjectColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % SUBJECT_COLORS.length;
  return SUBJECT_COLORS[h];
}

export default function TeacherTimetable() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? Colors.dark : Colors.light;
  const user = useAuthStore((s) => s.user);
  const todayIdx = new Date().getDay(); // 0 = Sun
  const todayName = DAYS[todayIdx - 1] ?? 'MONDAY';
  const [activeDay, setActiveDay] = useState(todayName);

  const { data, isLoading } = useQuery({
    queryKey: ['teacher-timetable', user?.userId],
    queryFn: () => academicApi.teacherTimetable(user!.userId),
    enabled: !!user,
  });

  const timetable = data?.data?.data ?? [];
  const dayEntries = timetable.filter((e) => e.dayOfWeek === activeDay);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScreenHeader title="My Timetable" />

      {/* Day tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayScroll} contentContainerStyle={styles.dayScrollContent}>
        {DAYS.map((d) => {
          const isActive = d === activeDay;
          const isToday = d === todayName;
          return (
            <View key={d} onTouchEnd={() => setActiveDay(d)}>
              <View style={[
                styles.dayTab,
                { backgroundColor: isActive ? Colors.primary[500] : theme.surface2 },
                isToday && !isActive && { borderWidth: 1.5, borderColor: Colors.primary[300] },
              ]}>
                <Text style={[styles.dayText, { color: isActive ? '#fff' : theme.textSecondary }]}>
                  {DAY_SHORT[d]}
                </Text>
                {isToday && (
                  <View style={[styles.todayDot, { backgroundColor: isActive ? '#fff' : Colors.primary[500] }]} />
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>

      {isLoading ? (
        <ActivityIndicator color={Colors.primary[500]} style={{ marginTop: 40 }} />
      ) : dayEntries.length === 0 ? (
        <View style={styles.empty}>
          <Text style={{ fontSize: 40 }}>📅</Text>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No classes on {activeDay.toLowerCase()}</Text>
        </View>
      ) : (
        <FlatList
          data={dayEntries.sort((a, b) => a.startTime.localeCompare(b.startTime))}
          keyExtractor={(e) => String(e.id)}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}
          renderItem={({ item }) => {
            const color = subjectColor(item.subject?.name ?? 'X');
            return (
              <View style={[styles.entry, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={[styles.entryAccent, { backgroundColor: color }]} />
                <View style={styles.timeCol}>
                  <Text style={[styles.timeStart, { color: theme.text }]}>{item.startTime.slice(0, 5)}</Text>
                  <Text style={[styles.timeDash, { color: theme.textMuted }]}>│</Text>
                  <Text style={[styles.timeEnd, { color: theme.textSecondary }]}>{item.endTime.slice(0, 5)}</Text>
                </View>
                <View style={styles.entryBody}>
                  <Text style={[styles.subjectName, { color }]}>{item.subject?.name ?? 'Free'}</Text>
                  {item.classSection && (
                    <Text style={[styles.classInfo, { color: theme.text }]}>
                      {item.classSection.grade?.name} – {item.classSection.section?.name}
                    </Text>
                  )}
                  <Text style={[styles.entryCode, { color: theme.textMuted }]}>{item.subject?.code ?? ''}</Text>
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  dayScroll: { maxHeight: 72 },
  dayScrollContent: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  dayTab: {
    paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  dayText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  todayDot: { width: 4, height: 4, borderRadius: 2, marginTop: 3 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyText: { fontSize: 14 },
  entry: {
    flexDirection: 'row', borderRadius: 14, borderWidth: 1, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 1,
  },
  entryAccent: { width: 5 },
  timeCol: {
    paddingVertical: 14, paddingHorizontal: 12, alignItems: 'center', minWidth: 68,
  },
  timeStart: { fontSize: 13, fontWeight: '700' },
  timeDash: { fontSize: 12, marginVertical: 2 },
  timeEnd: { fontSize: 12 },
  entryBody: { flex: 1, paddingVertical: 14, paddingRight: 14, gap: 3 },
  subjectName: { fontSize: 16, fontWeight: '700' },
  classInfo: { fontSize: 13 },
  entryCode: { fontSize: 11, fontFamily: 'monospace' },
});
