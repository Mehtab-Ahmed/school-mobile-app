import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, useColorScheme, RefreshControl, ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { studentsApi } from '../../api/students';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { Colors } from '../../theme/colors';
import { Student } from '../../types';

export default function AdminStudents() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? Colors.dark : Colors.light;
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['students-list', search, page],
    queryFn: () => studentsApi.list({ page, size: 20, search: search || undefined }),
  });

  const students = data?.data?.data?.content ?? [];
  const total = data?.data?.data?.totalElements ?? 0;
  const hasMore = !data?.data?.data?.last;

  const renderItem = ({ item }: { item: Student }) => {
    const name = `${item.user.firstName} ${item.user.lastName}`;
    return (
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Avatar name={name} size={48} />
        <View style={styles.info}>
          <Text style={[styles.name, { color: theme.text }]}>{name}</Text>
          <Text style={[styles.sub, { color: theme.textSecondary }]}>
            {item.classSection?.grade?.name} – {item.classSection?.section?.name}
          </Text>
          <Text style={[styles.admno, { color: theme.textMuted }]}>{item.admissionNumber}</Text>
        </View>
        <Badge label={item.classSection?.grade?.name ?? 'N/A'} variant="primary" small />
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScreenHeader title="Students" subtitle={`${total} total`} />

      {/* Search */}
      <View style={[styles.searchWrap, { backgroundColor: theme.surface2, borderColor: theme.border }]}>
        <Ionicons name="search-outline" size={16} color={theme.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Search students…"
          placeholderTextColor={theme.textMuted}
          value={search}
          onChangeText={(t) => { setSearch(t); setPage(0); }}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => { setSearch(''); setPage(0); }}>
            <Ionicons name="close-circle" size={16} color={theme.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <ActivityIndicator color={Colors.primary[500]} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={students}
          keyExtractor={(s) => String(s.id)}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary[500]} />}
          contentContainerStyle={[styles.list, students.length === 0 && { flex: 1 }]}
          ListEmptyComponent={<EmptyState icon="people-outline" title="No students found" />}
          ListFooterComponent={
            hasMore ? (
              <TouchableOpacity onPress={() => setPage((p) => p + 1)} style={styles.loadMore}>
                <Text style={[styles.loadMoreText, { color: Colors.primary[500] }]}>Load More</Text>
              </TouchableOpacity>
            ) : null
          }
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', margin: 16,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1, gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14 },
  list: { padding: 16, paddingTop: 0, paddingBottom: 40 },
  card: {
    flexDirection: 'row', alignItems: 'center', padding: 14,
    borderRadius: 14, borderWidth: 1, gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600' },
  sub: { fontSize: 12, marginTop: 2 },
  admno: { fontSize: 11, fontFamily: 'monospace', marginTop: 2 },
  loadMore: { alignItems: 'center', paddingVertical: 16 },
  loadMoreText: { fontSize: 14, fontWeight: '600' },
});
