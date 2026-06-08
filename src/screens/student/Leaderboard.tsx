import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, useColorScheme,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { gamificationApi, LeaderboardEntry } from '../../api/gamification';
import { useAuthStore } from '../../store/authStore';
import { Colors } from '../../theme/colors';

const MEDAL = ['🥇', '🥈', '🥉'];
const RARITY_COLOR: Record<string, string> = {
  COMMON: '#6b7280', RARE: '#3b82f6', EPIC: '#8b5cf6', LEGENDARY: '#f59e0b',
};

export default function LeaderboardScreen() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? Colors.dark : Colors.light;
  const user = useAuthStore(s => s.user);
  const [tab, setTab] = useState<'class' | 'school'>('class');

  // We resolve class section from the student's stored data
  const classSectionId = (user as any)?.classSectionId ?? 1;

  const classLB = useQuery({
    queryKey: ['leaderboard', 'class', classSectionId],
    queryFn: () => gamificationApi.getClassLeaderboard(classSectionId).then(r => r.data?.data ?? []),
    enabled: tab === 'class',
  });

  const schoolLB = useQuery({
    queryKey: ['leaderboard', 'school'],
    queryFn: () => gamificationApi.getSchoolLeaderboard(50).then(r => r.data?.data ?? []),
    enabled: tab === 'school',
  });

  const { data, isLoading, refetch } = tab === 'class' ? classLB : schoolLB;
  const entries: LeaderboardEntry[] = data ?? [];

  return (
    <ScrollView
      style={[s.container, { backgroundColor: theme.background }]}
      contentContainerStyle={s.content}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
    >
      {/* Header */}
      <View style={s.header}>
        <Text style={[s.title, { color: theme.text }]}>🏆 Leaderboard</Text>

        {/* Tabs */}
        <View style={[s.tabs, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {(['class', 'school'] as const).map(t => (
            <TouchableOpacity
              key={t}
              onPress={() => setTab(t)}
              style={[s.tab, tab === t && { backgroundColor: Colors.primary[500] }]}
            >
              <Text style={[s.tabText, { color: tab === t ? '#fff' : theme.textSecondary }]}>
                {t === 'class' ? '📚 My Class' : '🏫 School'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator color={Colors.primary[500]} style={{ marginTop: 40 }} />
      ) : entries.length === 0 ? (
        <Text style={[s.empty, { color: theme.textSecondary }]}>No data yet — earn points to appear here!</Text>
      ) : (
        <View style={s.list}>
          {entries.map((entry, idx) => {
            const isMe = user?.userId && entry.studentName === 'You'; // approximate
            return (
              <View
                key={entry.studentId}
                style={[
                  s.row,
                  { backgroundColor: theme.card, borderColor: theme.border },
                  idx < 3 && s.topRow,
                ]}
              >
                {/* Rank */}
                <View style={s.rankWrap}>
                  {idx < 3 ? (
                    <Text style={s.medal}>{MEDAL[idx]}</Text>
                  ) : (
                    <Text style={[s.rankNum, { color: theme.textSecondary }]}>#{entry.rank}</Text>
                  )}
                </View>

                {/* Name + streak */}
                <View style={s.info}>
                  <Text style={[s.name, { color: theme.text }]} numberOfLines={1}>
                    {entry.studentName}
                  </Text>
                  {entry.streakDays > 0 && (
                    <Text style={s.streak}>🔥 {entry.streakDays}d streak</Text>
                  )}
                </View>

                {/* Points breakdown */}
                <View style={s.pts}>
                  <Text style={[s.totalPts, { color: Colors.primary[500] }]}>
                    {entry.totalPoints}
                  </Text>
                  <Text style={[s.ptsLabel, { color: theme.textMuted }]}>pts</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:  { flex: 1 },
  content:    { padding: 16, paddingBottom: 32 },
  header:     { marginBottom: 16 },
  title:      { fontSize: 22, fontWeight: '800', marginBottom: 12 },
  tabs:       { flexDirection: 'row', borderRadius: 12, borderWidth: 1, padding: 3 },
  tab:        { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 10 },
  tabText:    { fontSize: 13, fontWeight: '600' },
  list:       { gap: 8 },
  row: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, borderWidth: 1,
    paddingVertical: 12, paddingHorizontal: 14, gap: 10,
  },
  topRow:     { borderWidth: 2 },
  rankWrap:   { width: 36, alignItems: 'center' },
  medal:      { fontSize: 22 },
  rankNum:    { fontSize: 15, fontWeight: '700' },
  info:       { flex: 1 },
  name:       { fontSize: 15, fontWeight: '600' },
  streak:     { fontSize: 11, color: '#f59e0b', marginTop: 2 },
  pts:        { alignItems: 'flex-end' },
  totalPts:   { fontSize: 20, fontWeight: '800' },
  ptsLabel:   { fontSize: 10 },
  empty:      { textAlign: 'center', marginTop: 60, fontSize: 14 },
});
