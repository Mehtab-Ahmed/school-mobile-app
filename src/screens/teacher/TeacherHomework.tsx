import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, useColorScheme,
  Modal, TextInput, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { homeworkApi } from '../../api/homework';
import { academicApi } from '../../api/academic';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { EmptyState } from '../../components/ui/EmptyState';
import { Colors } from '../../theme/colors';
import { Homework } from '../../types';

export default function TeacherHomework() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? Colors.dark : Colors.light;
  const qc = useQueryClient();
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', dueDate: '', subjectId: '' });

  const { data: classData } = useQuery({
    queryKey: ['class-sections'],
    queryFn: () => academicApi.classSections(),
  });

  const classes = classData?.data?.data ?? [];

  const { data: hwData, isLoading, refetch } = useQuery({
    queryKey: ['homework-class', selectedClass],
    queryFn: () => homeworkApi.byClass(selectedClass!),
    enabled: !!selectedClass,
  });

  const homework = hwData?.data?.data ?? [];

  const createMutation = useMutation({
    mutationFn: () =>
      homeworkApi.create({
        title: form.title,
        description: form.description,
        dueDate: form.dueDate,
        subjectId: Number(form.subjectId) || 1,
        classSectionId: selectedClass!,
      }),
    onSuccess: () => {
      Alert.alert('✅ Created', 'Homework assigned successfully!');
      setShowCreate(false);
      setForm({ title: '', description: '', dueDate: '', subjectId: '' });
      qc.invalidateQueries({ queryKey: ['homework-class'] });
    },
    onError: () => Alert.alert('Error', 'Failed to create homework.'),
  });

  if (!selectedClass) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ScreenHeader title="Homework" subtitle="Select a class" />
        <FlatList
          data={classes}
          keyExtractor={(c) => String(c.id)}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setSelectedClass(item.id)}
              style={[styles.classCard, { backgroundColor: theme.card, borderColor: theme.border }]}
            >
              <Ionicons name="book" size={20} color={Colors.primary[500]} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.className, { color: theme.text }]}>
                  {item.grade?.name} – {item.section?.name}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
            </TouchableOpacity>
          )}
        />
      </View>
    );
  }

  const cls = classes.find((c) => c.id === selectedClass);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScreenHeader
        title={`${cls?.grade?.name} – ${cls?.section?.name}`}
        subtitle="Homework"
        showBack
        right={
          <TouchableOpacity
            onPress={() => setShowCreate(true)}
            style={[styles.addBtn, { backgroundColor: Colors.primary[500] }]}
          >
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        }
      />

      {isLoading ? (
        <ActivityIndicator color={Colors.primary[500]} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={homework}
          keyExtractor={(h) => String(h.id)}
          contentContainerStyle={[styles.list, homework.length === 0 && { flex: 1 }]}
          ListEmptyComponent={
            <EmptyState icon="book-outline" title="No homework assigned" subtitle="Tap + to assign homework to this class" />
          }
          renderItem={({ item }) => (
            <Card style={styles.hwCard}>
              <View style={styles.hwTop}>
                <Badge label={item.subject?.name ?? 'General'} variant="primary" small />
                <Text style={[styles.hwDue, { color: Colors.warning }]}>Due: {item.dueDate}</Text>
              </View>
              <Text style={[styles.hwTitle, { color: theme.text }]}>{item.title}</Text>
              {item.description && (
                <Text style={[styles.hwDesc, { color: theme.textSecondary }]} numberOfLines={2}>
                  {item.description}
                </Text>
              )}
            </Card>
          )}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        />
      )}

      {/* Create Modal */}
      <Modal visible={showCreate} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modal, { backgroundColor: theme.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Assign Homework</Text>
            <TouchableOpacity onPress={() => setShowCreate(false)}>
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 24, gap: 4 }}>
            <Input
              label="Title *"
              value={form.title}
              onChangeText={(t) => setForm((f) => ({ ...f, title: t }))}
              placeholder="e.g. Chapter 5 Exercises"
            />
            <Input
              label="Description"
              value={form.description}
              onChangeText={(t) => setForm((f) => ({ ...f, description: t }))}
              placeholder="Additional instructions…"
              multiline
            />
            <Input
              label="Due Date (YYYY-MM-DD) *"
              value={form.dueDate}
              onChangeText={(t) => setForm((f) => ({ ...f, dueDate: t }))}
              placeholder="2024-12-31"
            />
            <Input
              label="Subject ID"
              value={form.subjectId}
              onChangeText={(t) => setForm((f) => ({ ...f, subjectId: t }))}
              placeholder="1"
              keyboardType="numeric"
            />
            <Button
              label="Assign Homework"
              onPress={() => {
                if (!form.title || !form.dueDate) {
                  Alert.alert('Required', 'Title and Due Date are required.');
                  return;
                }
                createMutation.mutate();
              }}
              loading={createMutation.isPending}
              fullWidth
              style={{ marginTop: 8 }}
            />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  classCard: {
    flexDirection: 'row', alignItems: 'center', padding: 16,
    borderRadius: 14, borderWidth: 1, gap: 12,
  },
  className: { fontSize: 15, fontWeight: '600' },
  addBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16, paddingBottom: 40 },
  hwCard: { gap: 6 },
  hwTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  hwDue: { fontSize: 12, fontWeight: '600' },
  hwTitle: { fontSize: 15, fontWeight: '700' },
  hwDesc: { fontSize: 13, lineHeight: 18 },
  modal: { flex: 1 },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 20, borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 18, fontWeight: '700' },
});
