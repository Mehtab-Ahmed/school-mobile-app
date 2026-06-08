import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, useColorScheme, Modal,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { gamificationApi } from '../../api/gamification';
import { Colors } from '../../theme/colors';
import LeaderboardScreen from '../student/Leaderboard';
import MyBadgesScreen from '../student/MyBadges';

const CATEGORY_ICONS: Record<string, string> = {
  assignmentPoints: '📝', attendancePoints: '✅',
  behaviorPoints: '💬', sportsPoints: '⚽', activityPoints: '🎭', leadershipPoints: '👑',
};
const CATEGORY_LABELS: Record<string, string> = {
  assignmentPoints: 'Assignments', attendancePoints: 'Attendance',
  behaviorPoints: 'Behavior', sportsPoints: 'Sports',
  activityPoints: 'Activities', leadershipPoints: 'Leadership',
};

export default function GamificationDashboard() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? Colors.dark : Colors.light;
  const [modal, setModal] = useState<null | 'leaderboard' | 'badges'>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['gamification', 'my'],
    queryFn: () => gamificationApi.getMy().then(r => r.data?.data),
  });

  const summary = data?.summary;
  const badges  = data?.badges ?? [];

  const categories = ['assignmentPoints', 'attendancePoints', 'behaviorPoints',
                      'sportsPoints', 'activityPoints', 'leadershipPoints'];

  return (
    <ScrollView
      style={[s.container, { backgroundColor: theme.background }]}
      contentContainerStyle={s.content}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
    >
      {/* ── Points Hero Card ─────────────────────────────── */}
      <View style={[s.hero, { backgroundColor: Colors.primary[500] }]}>
        <View>
          <Text style={s.heroLabel}>Total Points</Text>
          <Text style={s.heroPoints}>{summary?.totalPoints ?? 0}</Text>
          {summary?.streakDays ? (
            <Text style={s.heroStreak}>🔥 {summary.streakDays}-day streak</Text>
          ) : null}
        </View>
        <View style={s.ranks}>
          {summary?.classRank && (
            <View style={s.rankPill}>
              <Text style={s.rankNum}>#{summary.classRank}</Text>
              <Text style={s.rankLabel}>Class</Text>
            </View>
          )}
          {summary?.schoolRank && (
            <View style={s.rankPill}>
              <Text style={s.rankNum}>#{summary.schoolRank}</Text>
              <Text style={s.rankLabel}>School</Text>
            </View>
          )}
        </View>
      </View>

      {/* ── Points Breakdown ─────────────────────────────── */}
      <Text style={[s.sectionTitle, { color: theme.text }]}>Points Breakdown</Text>
      <View style={s.breakdown}>
        {categories.map(cat => {
          const val = summary ? (summary as any)[cat] ?? 0 : 0;
          return (
            <View key={cat} style={[s.catCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={s.catIcon}>{CATEGORY_ICONS[cat]}</Text>
              <Text style={[s.catVal, { color: theme.text }]}>{val}</Text>
              <Text style={[s.catLabel, { color: theme.textSecondary }]}>{CATEGORY_LABELS[cat]}</Text>
            </View>
          );
        })}
      </View>

      {/* ── Badges ───────────────────────────────────────── */}
      <View style={s.rowHeader}>
        <Text style={[s.sectionTitle, { color: theme.text }]}>My Badges ({badges.length})</Text>
        <TouchableOpacity onPress={() => setModal('badges')}>
          <Text style={{ color: Colors.primary[500], fontSize: 13, fontWeight: '600' }}>See all →</Text>
        </TouchableOpacity>
      </View>
      {badges.length === 0 ? (
        <Text style={[s.empty, { color: theme.textMuted }]}>No badges yet — keep earning points!</Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.badgeRow}>
          {badges.slice(0, 6).map(b => (
            <View key={b.id} style={[s.badgeChip, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={s.badgeEmoji}>🏅</Text>
              <Text style={[s.badgeChipName, { color: theme.text }]} numberOfLines={2}>{b.badge.name}</Text>
            </View>
          ))}
        </ScrollView>
      )}

      {/* ── Leaderboard CTA ──────────────────────────────── */}
      <TouchableOpacity
        onPress={() => setModal('leaderboard')}
        style={[s.lbBtn, { backgroundColor: Colors.primary[500] + '18', borderColor: Colors.primary[300] }]}
      >
        <Text style={[s.lbBtnText, { color: Colors.primary[600] }]}>🏆 View Leaderboard</Text>
      </TouchableOpacity>

      {/* ── Modals ───────────────────────────────────────── */}
      <Modal visible={modal === 'leaderboard'} animationType="slide" onRequestClose={() => setModal(null)}>
        <View style={{ flex: 1, paddingTop: 50 }}>
          <TouchableOpacity onPress={() => setModal(null)} style={s.closeBtn}>
            <Text style={s.closeTxt}>✕ Close</Text>
          </TouchableOpacity>
          <LeaderboardScreen />
        </View>
      </Modal>

      <Modal visible={modal === 'badges'} animationType="slide" onRequestClose={() => setModal(null)}>
        <View style={{ flex: 1, paddingTop: 50 }}>
          <TouchableOpacity onPress={() => setModal(null)} style={s.closeBtn}>
            <Text style={s.closeTxt}>✕ Close</Text>
          </TouchableOpacity>
          <MyBadgesScreen />
        </View>
      </Modal>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:    { flex: 1 },
  content:      { padding: 16, paddingBottom: 32, gap: 12 },
  hero: {
    borderRadius: 20, padding: 20, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between',
  },
  heroLabel:   { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '600' },
  heroPoints:  { color: '#fff', fontSize: 44, fontWeight: '900', lineHeight: 50 },
  heroStreak:  { color: 'rgba(255,255,255,0.9)', fontSize: 13, marginTop: 4 },
  ranks:       { gap: 8 },
  rankPill: {
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 6, alignItems: 'center',
  },
  rankNum:     { color: '#fff', fontSize: 16, fontWeight: '800' },
  rankLabel:   { color: 'rgba(255,255,255,0.8)', fontSize: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginTop: 4 },
  breakdown: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catCard: {
    width: '30.5%', borderRadius: 14, borderWidth: 1,
    padding: 10, alignItems: 'center', gap: 2,
  },
  catIcon:  { fontSize: 20 },
  catVal:   { fontSize: 18, fontWeight: '800' },
  catLabel: { fontSize: 10, textAlign: 'center' },
  rowHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badgeRow:   { marginLeft: -2 },
  badgeChip: {
    borderRadius: 12, borderWidth: 1, padding: 10,
    alignItems: 'center', marginRight: 8, width: 80,
  },
  badgeEmoji:     { fontSize: 24 },
  badgeChipName:  { fontSize: 10, textAlign: 'center', marginTop: 4 },
  lbBtn: {
    borderRadius: 14, borderWidth: 1.5, padding: 14, alignItems: 'center', marginTop: 4,
  },
  lbBtnText:   { fontSize: 15, fontWeight: '700' },
  empty:       { fontSize: 12, fontStyle: 'italic' },
  closeBtn:    { paddingHorizontal: 16, paddingVertical: 10 },
  closeTxt:    { color: '#6366f1', fontSize: 15, fontWeight: '600' },
});
