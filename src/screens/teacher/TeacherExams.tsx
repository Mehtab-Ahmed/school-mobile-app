import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  useColorScheme, ActivityIndicator, RefreshControl,
  Modal, TextInput, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { examsApi } from '../../api/exams';
import { studentsApi } from '../../api/students';
import { academicApi } from '../../api/academic';
import api from '../../api/axios';
import { Card } from '../../components/ui/Card';
import { Badge, statusVariant } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { Colors } from '../../theme/colors';
import { Exam, Student, ClassSection } from '../../types';

interface MarkEntry {
  studentId: number;
  studentName: string;
  marksObtained: string;
  absent: boolean;
}

export default function TeacherExams() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? Colors.dark : Colors.light;
  const qc = useQueryClient();
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [marks, setMarks] = useState<MarkEntry[]>([]);
  const [saving, setSaving] = useState(false);

  const { data: classesData } = useQuery({
    queryKey: ['class-sections'],
    queryFn: () => academicApi.classSections(),
  });

  const { data: examsData, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['exams-teacher', selectedClassId],
    queryFn: () => api.get('/exams', { params: selectedClassId ? { classSectionId: selectedClassId } : {} }).then(r => r.data),
  });

  const { data: studentsData } = useQuery({
    queryKey: ['students-class', selectedClassId],
    queryFn: () => studentsApi.list({ size: 100 }),
    enabled: !!selectedExam,
  });

  const classes: ClassSection[] = classesData?.data?.data ?? [];
  const exams: Exam[] = examsData?.data?.data ?? examsData?.data ?? [];
  const students: Student[] = studentsData?.data?.data?.content ?? [];

  const openMarkEntry = (exam: Exam) => {
    setSelectedExam(exam);
    const classStudents = selectedClassId
      ? students.filter(s => s.classSection?.id === selectedClassId)
      : students.slice(0, 30);
    setMarks(classStudents.map(s => ({
      studentId: s.id,
      studentName: `${s.user.firstName} ${s.user.lastName}`,
      marksObtained: '',
      absent: false,
    })));
  };

  const saveMarks = async () => {
    if (!selectedExam) return;
    setSaving(true);
    try {
      await Promise.all(
        marks.map(m =>
          api.put(`/exams/${selectedExam.id}/results/${m.studentId}`, {
            marksObtained: m.absent ? null : parseFloat(m.marksObtained) || 0,
            absent: m.absent,
          })
        )
      );
      Alert.alert('Saved', 'Marks saved successfully.');
      setSelectedExam(null);
      qc.invalidateQueries({ queryKey: ['exams-teacher'] });
    } catch {
      Alert.alert('Error', 'Failed to save marks. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const renderExam = ({ item }: { item: Exam }) => (
    <TouchableOpacity onPress={() => openMarkEntry(item)} activeOpacity={0.85}>
      <Card style={styles.examCard}>
        <View style={styles.examLeft}>
          <View style={[styles.examIcon, { backgroundColor: Colors.primary[500] + '20' }]}>
            <Ionicons name="document-text" size={22} color={Colors.primary[500]} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.examName, { color: theme.text }]}>{item.name}</Text>
            <Text style={[styles.examType, { color: theme.textSecondary }]}>{item.examType}</Text>
            <Text style={[styles.examDate, { color: theme.textMuted }]}>
              {item.startDate} – {item.endDate}
            </Text>
            {item.totalMarks && (
              <Text style={[styles.examMarks, { color: theme.textMuted }]}>
                Total: {item.totalMarks} marks · Pass: {item.passingMarks}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.examRight}>
          <Badge label={item.status} variant={statusVariant(item.status)} small />
          <Ionicons name="chevron-forward" size={16} color={theme.textMuted} style={{ marginTop: 8 }} />
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: '#7c3aed' }]}>
        <Text style={styles.headerTitle}>Exams & Marks</Text>
        <Text style={styles.headerSub}>Enter and manage student marks</Text>
      </View>

      {/* Class filter */}
      <View style={[styles.filterWrap, { backgroundColor: theme.surface }]}>
        <Text style={[styles.filterLabel, { color: theme.textSecondary }]}>Filter by Class:</Text>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[{ id: 0, label: 'All' }, ...classes.map(c => ({ id: c.id, label: `${c.grade.name}-${c.section.name}` }))]}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={{ gap: 8, paddingRight: 16 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setSelectedClassId(item.id === 0 ? null : item.id)}
              style={[
                styles.classChip,
                (item.id === 0 ? !selectedClassId : selectedClassId === item.id)
                  && { backgroundColor: Colors.primary[500] },
              ]}
            >
              <Text style={[
                styles.classChipText,
                { color: (item.id === 0 ? !selectedClassId : selectedClassId === item.id) ? '#fff' : theme.textSecondary },
              ]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
        </View>
      ) : (
        <FlatList
          data={exams}
          keyExtractor={item => String(item.id)}
          renderItem={renderExam}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary[500]} />}
          ListEmptyComponent={<EmptyState icon="document-text-outline" title="No exams found" subtitle="No exams scheduled for this class" />}
        />
      )}

      {/* Marks Entry Modal */}
      <Modal visible={!!selectedExam} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView style={[styles.modal, { backgroundColor: theme.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.modalTitle, { color: theme.text }]} numberOfLines={1}>
                {selectedExam?.name}
              </Text>
              <Text style={[styles.modalSub, { color: theme.textSecondary }]}>
                Enter marks (max: {selectedExam?.totalMarks ?? '—'})
              </Text>
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={saveMarks}
                disabled={saving}
                style={[styles.saveBtn, { backgroundColor: Colors.primary[500] }]}
              >
                {saving
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={styles.saveBtnText}>Save</Text>
                }
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setSelectedExam(null)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
          </View>

          <FlatList
            data={marks}
            keyExtractor={item => String(item.studentId)}
            contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 60 }}
            ListEmptyComponent={<EmptyState icon="people-outline" title="No students" subtitle="No students found for this class" />}
            renderItem={({ item, index }) => (
              <Card style={styles.markRow}>
                <View style={[styles.markAvatar, { backgroundColor: Colors.primary[500] + '20' }]}>
                  <Text style={[styles.markAvatarText, { color: Colors.primary[500] }]}>
                    {item.studentName.charAt(0)}
                  </Text>
                </View>
                <Text style={[styles.markStudentName, { color: theme.text }]} numberOfLines={1}>
                  {item.studentName}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    const updated = [...marks];
                    updated[index] = { ...updated[index], absent: !updated[index].absent };
                    setMarks(updated);
                  }}
                  style={[styles.absentBtn, item.absent && { backgroundColor: Colors.danger + '20' }]}
                >
                  <Ionicons
                    name={item.absent ? 'close-circle' : 'close-circle-outline'}
                    size={18}
                    color={item.absent ? Colors.danger : theme.textMuted}
                  />
                  <Text style={[styles.absentText, { color: item.absent ? Colors.danger : theme.textMuted }]}>
                    {item.absent ? 'Absent' : 'Mark Absent'}
                  </Text>
                </TouchableOpacity>
                <TextInput
                  style={[
                    styles.marksInput,
                    { backgroundColor: theme.surface2, color: theme.text, borderColor: theme.border },
                    item.absent && { opacity: 0.4 },
                  ]}
                  value={item.marksObtained}
                  onChangeText={t => {
                    const updated = [...marks];
                    updated[index] = { ...updated[index], marksObtained: t };
                    setMarks(updated);
                  }}
                  keyboardType="decimal-pad"
                  placeholder="—"
                  placeholderTextColor={theme.textMuted}
                  editable={!item.absent}
                  maxLength={6}
                />
              </Card>
            )}
          />
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20 },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '800' },
  headerSub: { color: '#ffffff99', fontSize: 13, marginTop: 2 },
  filterWrap: { paddingVertical: 10, paddingLeft: 16 },
  filterLabel: { fontSize: 11, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  classChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 99, backgroundColor: '#e2e8f0' },
  classChipText: { fontSize: 13, fontWeight: '600' },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16, gap: 12, paddingBottom: 40 },
  examCard: { gap: 4 },
  examLeft: { flexDirection: 'row', gap: 12, flex: 1 },
  examIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  examName: { fontSize: 15, fontWeight: '700' },
  examType: { fontSize: 12, marginTop: 2 },
  examDate: { fontSize: 11, marginTop: 2 },
  examMarks: { fontSize: 11, marginTop: 2 },
  examRight: { alignItems: 'flex-end' },
  modal: { flex: 1 },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 20, borderBottomWidth: 1, gap: 12,
  },
  modalTitle: { fontSize: 17, fontWeight: '700' },
  modalSub: { fontSize: 12, marginTop: 2 },
  modalActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  saveBtn: { paddingHorizontal: 18, paddingVertical: 9, borderRadius: 10 },
  saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  markRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  markAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  markAvatarText: { fontSize: 15, fontWeight: '700' },
  markStudentName: { flex: 1, fontSize: 13, fontWeight: '600' },
  absentBtn: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 4, borderRadius: 8 },
  absentText: { fontSize: 11 },
  marksInput: {
    width: 64, textAlign: 'center', fontSize: 15, fontWeight: '700',
    paddingVertical: 8, borderRadius: 10, borderWidth: 1,
  },
});
