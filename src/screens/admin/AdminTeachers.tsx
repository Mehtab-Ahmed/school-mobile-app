import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, useColorScheme, RefreshControl, ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import api from '../../api/axios';
import { ApiResponse, PageResponse, Teacher } from '../../types';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { Colors } from '../../theme/colors';

export default function AdminTeachers() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? Colors.dark : Colors.light;
  const [search, setSearch] = useState('');

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['teachers-list', search],
    queryFn: () =>
      api.get<ApiResponse<PageResponse<Teacher>>>('/teachers', {
        params: { size: 50, search: search || undefined },
      }),
  });

  const teachers = data?.data?.data?.content ?? [];
  const total = data?.data?.data?.totalElements ?? 0;

  const renderItem = ({ item }: { item: Teacher }) => {
    const name = `${item.user.firstName} ${item.user.lastName}`;
    return (
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Avatar name={name} size={50} />
        <View style={styles.info}>
          <Text style={[styles.name, { color: theme.text }]}>{name}</Text>
          <Text style={[styles.sub, { color: theme.textSecondary }]}>{item.designation ?? 'Teacher'}</Text>
          <Text style={[styles.emp, { color: theme.textMuted }]}>{item.employeeId}</Text>
        </View>
        <Badge label={item.qualification ?? 'B.Ed'} small />
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScreenHeader title="Teachers" subtitle={`${total} total`} />
      <View style={[styles.searchWrap, { backgroundColor: theme.surface2, borderColor: theme.border }]}>
        <Ionicons name="search-outline" size={16} color={theme.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Search teachers…"
          placeholderTextColor={theme.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={16} color={theme.textMuted} />
          </TouchableOpacity>
        )}
      </View>
      {isLoading ? (
        <ActivityIndicator color={Colors.primary[500]} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={teachers}
          keyExtractor={(t) => String(t.id)}
          renderItem={renderItem}
          contentContainerStyle={[styles.list, teachers.length === 0 && { flex: 1 }]}
          ListEmptyComponent={<EmptyState icon="school-outline" title="No teachers found" />}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary[500]} />}
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
  emp: { fontSize: 11, fontFamily: 'monospace', marginTop: 2 },
});
