import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  useColorScheme, ActivityIndicator, RefreshControl, Modal, ScrollView,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { studentsApi } from '../../api/students';
import { homeworkApi } from '../../api/homework';
import { Card } from '../../components/ui/Card';
import { Badge, statusVariant } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { Colors } from '../../theme/colors';
import { HomeworkSubmission } from '../../types';

type Filter = 'ALL' | 'PENDING' | 'SUBMITTED';

export default function ParentHomework() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? Colors.dark : Colors.light;
  const user = useAuthStore(s => s.user);
  const [filter, setFilter] = useState<Filter>('ALL');
  const [selected, setSelected] = useState<HomeworkSubmission | null>(null);

  const { data: childrenData } = useQuery({
    queryKey: ['parent-children', user?.userId],
    queryFn: () => studentsApi.byParent(user!.userId),
    enabled: !!user,
  });

  const children = childrenData?.data?.data ?? [];
  const child = children[0]; // Use first child

  const { data: hwData, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['child-homework', child?.id],
    queryFn: () => homeworkApi.pending(child.id),
    enabled: !!child,
  });

  const allHomework: HomeworkSubmission[] = (hwData?.data?.data ?? []).map((hw: any) => ({
    id: hw.id ?? Math.random(),
    homework: hw,
    status: hw.status ?? 'PENDING',
    submittedAt: hw.submittedAt,
    grade: hw.grade,
    remarks: hw.remarks,
  }));

  const filtered = filter === 'ALL'
    ? allHomework
    : allHomework.filter(h => h.status === filter);

  const isPast = (dueDate: string) => new Date(dueDate) < new Date();

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
      <View style={[styles.header, { backgroundColor: '#d97706' }]}>
        <Text style={styles.headerTitle}>Child's Homework</Text>
        {child && (
          <Text style={styles.headerSub}>
            {child.user.firstName} {child.user.lastName} ·{' '}
            {child.classSection?.grade?.name} – {child.classSection?.section?.name}
          </Text>
        )}
      </View>

      {!child ? (
        <EmptyState icon="people-outline" title="No child linked" subtitle="Contact school admin to link your child's account" />
      ) : (
        <>
          {/* Filter Tabs */}
          <View style={[styles.tabs, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
            {(['ALL', 'PENDING', 'SUBMITTED'] as Filter[]).map(f => (
              <TouchableOpacity
                key={f}
                onPress={() => setFilter(f)}
                style={[styles.tab, filter === f && { borderBottomColor: '#d97706', borderBottomWidth: 2 }]}
              >
                <Text style={[styles.tabText, { color: filter === f ? '#d97706' : theme.textSecondary }]}>
                  {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <FlatList
            data={filtered}
            keyExtractor={item => String(item.id)}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary[500]} />}
            ListEmptyComponent={
              <EmptyState
                icon="book-outline"
                title="No homework"
                subtitle={filter === 'ALL' ? "Your child has no homework assigned" : `No ${filter.toLowerCase()} homework`}
              />
            }
            renderItem={({ item }) => {
              const hw = item.homework;
              const overdue = item.status === 'PENDING' && isPast(hw.dueDate);
              return (
                <TouchableOpacity onPress={() => setSelected(item)} activeOpacity={0.85}>
                  <Card style={[
                    styles.hwCard,
                    overdue && { borderColor: Colors.danger + '55', borderWidth: 1.5 },
                  ]}>
                    <View style={[styles.subjectStripe, {
                      backgroundColor: item.status === 'SUBMITTED' || item.status === 'GRADED'
                        ? Colors.success + '30'
                        : overdue ? Colors.danger + '30'
                        : Colors.warning + '30',
                    }]}>
                      <Ionicons
                        name={item.status === 'SUBMITTED' || item.status === 'GRADED' ? 'checkmark-circle' : overdue ? 'alert-circle' : 'time'}
                        size={18}
                        color={item.status === 'SUBMITTED' || item.status === 'GRADED' ? Colors.success : overdue ? Colors.danger : Colors.warning}
                      />
                    </View>
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text style={[styles.hwTitle, { color: theme.text }]}>{hw.title}</Text>
                      {hw.subject && (
                        <Text style={[styles.hwSubject, { color: theme.textSecondary }]}>{hw.subject.name}</Text>
                      )}
                      <View style={styles.hwMeta}>
                        <Ionicons name="calendar-outline" size={12} color={overdue ? Colors.danger : theme.textMuted} />
                        <Text style={[styles.hwDue, { color: overdue ? Colors.danger : theme.textMuted }]}>
                          Due: {hw.dueDate}{overdue ? ' · Overdue' : ''}
                        </Text>
                      </View>
                      {item.grade && (
                        <View style={[styles.gradeBadge, { backgroundColor: Colors.success + '20' }]}>
                          <Text style={[styles.gradeText, { color: Colors.success }]}>Grade: {item.grade}</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.rightCol}>
                      <Badge label={item.status} variant={statusVariant(item.status)} small />
                      <Ionicons name="chevron-forward" size={14} color={theme.textMuted} style={{ marginTop: 8 }} />
                    </View>
                  </Card>
                </TouchableOpacity>
              );
            }}
          />
        </>
      )}

      {/* Homework Detail Modal */}
      <Modal visible={!!selected} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modal, { backgroundColor: theme.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]} numberOfLines={2}>
              {selected?.homework.title}
            </Text>
            <TouchableOpacity onPress={() => setSelected(null)}>
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>
          {selected && (
            <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>
              <View style={styles.detailRow}>
                <Badge label={selected.status} variant={statusVariant(selected.status)} />
                {selected.homework.subject && (
                  <Badge label={selected.homework.subject.name} variant="primary" />
                )}
              </View>

              <Card style={{ gap: 10 }}>
                <View style={styles.feeRow}>
                  <Ionicons name="calendar" size={14} color={theme.textMuted} />
                  <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Due Date</Text>
                  <Text style={[styles.detailVal, { color: theme.text }]}>{selected.homework.dueDate}</Text>
                </View>
                {selected.submittedAt && (
                  <View style={styles.feeRow}>
                    <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
                    <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Submitted</Text>
                    <Text style={[styles.detailVal, { color: theme.text }]}>
                      {new Date(selected.submittedAt).toLocaleDateString()}
                    </Text>
                  </View>
                )}
                {selected.grade && (
                  <View style={styles.feeRow}>
                    <Ionicons name="star" size={14} color={Colors.warning} />
                    <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Grade</Text>
                    <Text style={[styles.detailVal, { color: Colors.success, fontWeight: '700' }]}>{selected.grade}</Text>
                  </View>
                )}
                {selected.homework.teacher && (
                  <View style={styles.feeRow}>
                    <Ionicons name="person" size={14} color={theme.textMuted} />
                    <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Teacher</Text>
                    <Text style={[styles.detailVal, { color: theme.text }]}>
                      {selected.homework.teacher.firstName} {selected.homework.teacher.lastName}
                    </Text>
                  </View>
                )}
              </Card>

              {selected.homework.description && (
                <>
                  <Text style={[styles.descTitle, { color: theme.text }]}>Description</Text>
                  <Card>
                    <Text style={[styles.descText, { color: theme.textSecondary }]}>
                      {selected.homework.description}
                    </Text>
                  </Card>
                </>
              )}

              {selected.remarks && (
                <>
                  <Text style={[styles.descTitle, { color: theme.text }]}>Teacher's Remarks</Text>
                  <Card style={[{ backgroundColor: Colors.primary[50] }]}>
                    <Text style={[styles.descText, { color: Colors.primary[700] }]}>{selected.remarks}</Text>
                  </Card>
                </>
              )}
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20 },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '800' },
  headerSub: { color: '#ffffff99', fontSize: 13, marginTop: 2 },
  tabs: { flexDirection: 'row', borderBottomWidth: 1 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  tabText: { fontSize: 14, fontWeight: '600' },
  list: { padding: 16, gap: 12, paddingBottom: 40 },
  hwCard: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  subjectStripe: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  hwTitle: { fontSize: 14, fontWeight: '700' },
  hwSubject: { fontSize: 12 },
  hwMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  hwDue: { fontSize: 11 },
  gradeBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  gradeText: { fontSize: 11, fontWeight: '700' },
  rightCol: { alignItems: 'flex-end' },
  modal: { flex: 1 },
  modalHeader: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    padding: 20, borderBottomWidth: 1, gap: 12,
  },
  modalTitle: { flex: 1, fontSize: 17, fontWeight: '700' },
  detailRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  feeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailLabel: { flex: 1, fontSize: 14 },
  detailVal: { fontSize: 14, fontWeight: '600' },
  descTitle: { fontSize: 15, fontWeight: '700' },
  descText: { fontSize: 14, lineHeight: 22 },
});
