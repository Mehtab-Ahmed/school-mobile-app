import React from 'react';
import {
  View, Text, StyleSheet, FlatList, useColorScheme,
  RefreshControl, ActivityIndicator, Alert, TouchableOpacity,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { studentsApi } from '../../api/students';
import { homeworkApi } from '../../api/homework';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { Colors } from '../../theme/colors';
import { Homework } from '../../types';

export default function StudentHomework() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? Colors.dark : Colors.light;
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();

  const { data: studentsData } = useQuery({
    queryKey: ['student-profile', user?.userId],
    queryFn: () => studentsApi.list({ size: 100 }),
    enabled: !!user,
  });

  const student = studentsData?.data?.data?.content?.find((s) => s.user?.id === user?.userId);
  const studentId = student?.id;

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['pending-hw-student', studentId],
    queryFn: () => homeworkApi.pending(studentId!),
    enabled: !!studentId,
  });

  const homework = data?.data?.data ?? [];

  const submitMutation = useMutation({
    mutationFn: (hwId: number) => homeworkApi.submit(hwId, studentId!),
    onSuccess: () => {
      Alert.alert('✅ Submitted', 'Homework submitted successfully!');
      qc.invalidateQueries({ queryKey: ['pending-hw-student'] });
    },
    onError: () => Alert.alert('Error', 'Failed to submit homework.'),
  });

  const renderItem = ({ item }: { item: Homework }) => {
    const isOverdue = new Date(item.dueDate) < new Date();
    return (
      <Card style={styles.hwCard}>
        <View style={styles.hwHeader}>
          <Badge label={item.subject?.name ?? 'General'} variant="primary" small />
          <Badge label={isOverdue ? 'OVERDUE' : 'PENDING'} variant={isOverdue ? 'danger' : 'warning'} small />
        </View>
        <Text style={[styles.hwTitle, { color: theme.text }]}>{item.title}</Text>
        {item.description && (
          <Text style={[styles.hwDesc, { color: theme.textSecondary }]} numberOfLines={3}>
            {item.description}
          </Text>
        )}
        <View style={styles.hwFooter}>
          <View>
            <Text style={[styles.hwDueLabel, { color: theme.textMuted }]}>Due Date</Text>
            <Text style={[styles.hwDue, { color: isOverdue ? Colors.danger : theme.text }]}>
              {item.dueDate}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() =>
              Alert.alert(
                'Submit Homework',
                `Submit "${item.title}"?`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Submit', onPress: () => submitMutation.mutate(item.id) },
                ]
              )
            }
            style={[styles.submitBtn, { backgroundColor: Colors.primary[500] }]}
          >
            <Text style={styles.submitText}>Mark Done</Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScreenHeader title="My Homework" subtitle={`${homework.length} pending`} />
      {isLoading ? (
        <ActivityIndicator color={Colors.primary[500]} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={homework}
          keyExtractor={(h) => String(h.id)}
          renderItem={renderItem}
          contentContainerStyle={[styles.list, homework.length === 0 && { flex: 1 }]}
          ListEmptyComponent={
            <EmptyState icon="checkmark-circle-outline" title="All done! 🎉" subtitle="No pending homework" />
          }
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary[500]} />}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: 16, paddingBottom: 40 },
  hwCard: { gap: 10 },
  hwHeader: { flexDirection: 'row', gap: 8 },
  hwTitle: { fontSize: 16, fontWeight: '700' },
  hwDesc: { fontSize: 13, lineHeight: 18 },
  hwFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  hwDueLabel: { fontSize: 10, fontWeight: '500' },
  hwDue: { fontSize: 13, fontWeight: '700' },
  submitBtn: { paddingHorizontal: 18, paddingVertical: 9, borderRadius: 10 },
  submitText: { color: '#fff', fontSize: 13, fontWeight: '700' },
});
