import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  ActivityIndicator, useColorScheme,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { gamificationApi, Badge, BadgeDefinition } from '../../api/gamification';
import { Colors } from '../../theme/colors';

const RARITY_COLORS = {
  COMMON:    { bg: '#f3f4f6', border: '#d1d5db', text: '#6b7280' },
  RARE:      { bg: '#eff6ff', border: '#93c5fd', text: '#3b82f6' },
  EPIC:      { bg: '#f5f3ff', border: '#c4b5fd', text: '#8b5cf6' },
  LEGENDARY: { bg: '#fffbeb', border: '#fcd34d', text: '#f59e0b' },
};

const RARITY_EMOJI = { COMMON: '⚪', RARE: '🔵', EPIC: '🟣', LEGENDARY: '⭐' };

const CATEGORY_EMOJI: Record<string, string> = {
  ACADEMIC: '📚', ATTENDANCE: '✅', BEHAVIOR: '💬',
  SPORTS: '⚽', LEADERSHIP: '👑', SOCIAL: '🤝',
};

interface Props { studentId?: number }

export default function MyBadgesScreen({ studentId }: Props) {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? Colors.dark : Colors.light;

  const earnedQuery = useQuery({
    queryKey: ['badges', 'earned', studentId],
    queryFn: () => studentId
      ? gamificationApi.getStudentBadges(studentId).then(r => r.data?.data ?? [])
      : gamificationApi.getMy().then(r => r.data?.data?.badges ?? []),
  });

  const allBadgesQuery = useQuery({
    queryKey: ['badges', 'all'],
    queryFn: () => gamificationApi.getAllBadges().then(r => r.data?.data ?? []),
  });

  const earned: Badge[] = earnedQuery.data ?? [];
  const earnedIds = new Set(earned.map(b => b.badge.id));
  const allBadges: BadgeDefinition[] = allBadgesQuery.data ?? [];

  const isLoading = earnedQuery.isLoading || allBadgesQuery.isLoading;
  const refetch = () => { earnedQuery.refetch(); allBadgesQuery.refetch(); };

  return (
    <ScrollView
      style={[s.container, { backgroundColor: theme.background }]}
      contentContainerStyle={s.content}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
    >
      <Text style={[s.title, { color: theme.text }]}>🏅 My Badges</Text>

      {/* Earned count */}
      <View style={[s.statsRow, { backgroundColor: Colors.primary[500] + '18' }]}>
        <Text style={[s.statNum, { color: Colors.primary[600] }]}>{earned.length}</Text>
        <Text style={[s.statLabel, { color: Colors.primary[500] }]}>
          of {allBadges.length} badges earned
        </Text>
      </View>

      {isLoading ? (
        <ActivityIndicator color={Colors.primary[500]} style={{ marginTop: 40 }} />
      ) : (
        <>
          {/* Earned badges */}
          {earned.length > 0 && (
            <View style={s.section}>
              <Text style={[s.sectionTitle, { color: theme.text }]}>✨ Earned</Text>
              <View style={s.grid}>
                {earned.map(b => (
                  <BadgeCard
                    key={b.id}
                    name={b.badge.name}
                    description={b.badge.description}
                    rarity={b.badge.rarity}
                    category={b.badge.category}
                    earnedAt={b.earnedAt}
                    locked={false}
                    theme={theme}
                  />
                ))}
              </View>
            </View>
          )}

          {/* Locked badges */}
          {allBadges.filter(b => !earnedIds.has(b.id)).length > 0 && (
            <View style={s.section}>
              <Text style={[s.sectionTitle, { color: theme.textSecondary }]}>🔒 Locked</Text>
              <View style={s.grid}>
                {allBadges.filter(b => !earnedIds.has(b.id)).map(b => (
                  <BadgeCard
                    key={b.id}
                    name={b.name}
                    description={b.description}
                    rarity={b.rarity}
                    category={b.category}
                    locked
                    theme={theme}
                    hint={b.triggerType === 'POINTS_THRESHOLD'
                      ? `Reach ${b.triggerValue} points`
                      : b.triggerType === 'STREAK'
                      ? `${b.triggerValue}-day attendance streak`
                      : undefined}
                  />
                ))}
              </View>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

function BadgeCard({ name, description, rarity, category, locked, earnedAt, hint, theme }: {
  name: string; description?: string; rarity: string; category: string;
  locked: boolean; earnedAt?: string; hint?: string; theme: any;
}) {
  const colors = RARITY_COLORS[rarity as keyof typeof RARITY_COLORS] ?? RARITY_COLORS.COMMON;
  return (
    <View style={[
      s.badgeCard,
      {
        backgroundColor: locked ? theme.card : colors.bg,
        borderColor: locked ? theme.border : colors.border,
        opacity: locked ? 0.6 : 1,
      },
    ]}>
      <Text style={s.badgeIcon}>
        {locked ? '🔒' : (CATEGORY_EMOJI[category] ?? '🏅')}
      </Text>
      <Text style={[s.badgeName, { color: locked ? theme.textSecondary : colors.text }]}
        numberOfLines={2}>
        {name}
      </Text>
      <Text style={[s.rarityTag, { color: colors.text }]}>
        {RARITY_EMOJI[rarity as keyof typeof RARITY_EMOJI]} {rarity}
      </Text>
      {hint && <Text style={[s.hint, { color: theme.textMuted }]} numberOfLines={2}>{hint}</Text>}
      {earnedAt && (
        <Text style={[s.earned, { color: theme.textMuted }]}>
          {new Date(earnedAt).toLocaleDateString()}
        </Text>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container:    { flex: 1 },
  content:      { padding: 16, paddingBottom: 32 },
  title:        { fontSize: 22, fontWeight: '800', marginBottom: 12 },
  statsRow: {
    flexDirection: 'row', alignItems: 'baseline', gap: 6,
    padding: 14, borderRadius: 12, marginBottom: 20,
  },
  statNum:      { fontSize: 28, fontWeight: '800' },
  statLabel:    { fontSize: 14, fontWeight: '500' },
  section:      { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 10 },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
  },
  badgeCard: {
    width: '47%', borderRadius: 14, borderWidth: 1.5,
    padding: 12, alignItems: 'center', gap: 4,
  },
  badgeIcon:  { fontSize: 28, marginBottom: 2 },
  badgeName:  { fontSize: 12, fontWeight: '700', textAlign: 'center' },
  rarityTag:  { fontSize: 10, fontWeight: '600' },
  hint:       { fontSize: 10, textAlign: 'center', marginTop: 2 },
  earned:     { fontSize: 10, marginTop: 2 },
});
