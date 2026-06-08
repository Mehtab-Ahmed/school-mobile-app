import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  useColorScheme, ActivityIndicator, RefreshControl,
  TextInput, Modal, ScrollView,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { studentsApi } from '../../api/students';
import { academicApi } from '../../api/academic';
import { attendanceApi } from '../../api/attendance';
import { feesApi } from '../../api/fees';
import BehaviorRemarkScreen from './BehaviorRemarkScreen';
import { Avatar } from '../../components/ui/Avatar';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { Colors } from '../../theme/colors';
import { Student, ClassSection } from '../../types';

export default function TeacherStudents() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? Colors.dark : Colors.light;
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showRemark, setShowRemark] = useState(false);

  const { data: classesData } = useQuery({
    queryKey: ['class-sections'],
    queryFn: () => academicApi.classSections(),
  });

  const { data: studentsData, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['students-list', selectedClassId],
    queryFn: () => studentsApi.list({ size: 200 }),
  });

  const today = new Date().toISOString().split('T')[0];
  const fromDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

  const { data: attData } = useQuery({
    queryKey: ['att-student', selectedStudent?.id],
    queryFn: () => attendanceApi.summary(selectedStudent!.id, fromDate, today),
    enabled: !!selectedStudent,
  });

  const { data: feeData } = useQuery({
    queryKey: ['fee-student', selectedStudent?.id],
    queryFn: () => feesApi.studentSummary(selectedStudent!.id),
    enabled: !!selectedStudent,
  });

  const classes: ClassSection[] = classesData?.data?.data ?? [];
  const allStudents: Student[] = studentsData?.data?.data?.content ?? [];

  const filtered = useMemo(() => {
    let list = allStudents;
    if (selectedClassId) list = list.filter(s => s.classSection?.id === selectedClassId);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(s =>
        `${s.user.firstName} ${s.user.lastName}`.toLowerCase().includes(q) ||
        s.admissionNumber.toLowerCase().includes(q)
      );
    }
    return list;
  }, [allStudents, selectedClassId, search]);

  const attSummary = attData?.data?.data;
  const fees = feeData?.data?.data;

  const renderStudent = ({ item }: { item: Student }) => (
    <TouchableOpacity onPress={() => setSelectedStudent(item)} activeOpacity={0.85}>
      <Card style={styles.studentCard}>
        <Avatar name={`${item.user.firstName} ${item.user.lastName}`} size={44} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.studentName, { color: theme.text }]}>
            {item.user.firstName} {item.user.lastName}
          </Text>
          <Text style={[styles.studentAdm, { color: theme.textSecondary }]}>{item.admissionNumber}</Text>
          {item.classSection && (
            <Text style={[styles.studentClass, { color: theme.textMuted }]}>
              {item.classSection.grade?.name} – {item.classSection.section?.name}
            </Text>
          )}
        </View>
        <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: '#059669' }]}>
        <Text style={styles.headerTitle}>My Students</Text>
        <Text style={styles.headerSub}>{filtered.length} students</Text>
      </View>

      {/* Class filter */}
      <View style={[styles.filterWrap, { backgroundColor: theme.surface }]}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[{ id: 0, label: 'All Classes' }, ...classes.map(c => ({ id: c.id, label: `${c.grade.name}-${c.section.name}` }))]}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingVertical: 10 }}
          renderItem={({ item }) => {
            const active = item.id === 0 ? !selectedClassId : selectedClassId === item.id;
            return (
              <TouchableOpacity
                onPress={() => setSelectedClassId(item.id === 0 ? null : item.id)}
                style={[styles.classChip, active && { backgroundColor: '#059669' }]}
              >
                <Text style={[styles.classChipText, { color: active ? '#fff' : theme.textSecondary }]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Search */}
      <View style={[styles.searchWrap, { backgroundColor: theme.surface }]}>
        <View style={[styles.searchBar, { backgroundColor: theme.surface2, borderColor: theme.border }]}>
          <Ionicons name="search" size={18} color={theme.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search name or admission no..."
            placeholderTextColor={theme.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={theme.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => String(item.id)}
          renderItem={renderStudent}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary[500]} />}
          ListEmptyComponent={<EmptyState icon="people-outline" title="No students found" subtitle="Try adjusting your filter or search" />}
        />
      )}

      {/* Student Profile Modal */}
      <Modal visible={!!selectedStudent} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modal, { backgroundColor: theme.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Student Profile</Text>
            <TouchableOpacity onPress={() => setSelectedStudent(null)}>
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>
          {selectedStudent && (
            <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
              {/* Profile */}
              <Card style={styles.profileCard}>
                <Avatar name={`${selectedStudent.user.firstName} ${selectedStudent.user.lastName}`} size={64} />
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={[styles.profileName, { color: theme.text }]}>
                    {selectedStudent.user.firstName} {selectedStudent.user.lastName}
                  </Text>
                  <Text style={[styles.profileAdm, { color: theme.textSecondary }]}>
                    {selectedStudent.admissionNumber}
                  </Text>
                  {selectedStudent.classSection && (
                    <Badge
                      label={`${selectedStudent.classSection.grade?.name} – ${selectedStudent.classSection.section?.name}`}
                      variant="primary"
                      small
                    />
                  )}
                  {selectedStudent.user.email && (
                    <Text style={[styles.profileEmail, { color: theme.textMuted }]}>{selectedStudent.user.email}</Text>
                  )}
                </View>
              </Card>

              {/* Attendance */}
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Attendance (This Month)</Text>
              {attSummary ? (
                <Card style={{ gap: 12 }}>
                  <View style={[styles.attBar, { backgroundColor: theme.surface2 }]}>
                    <View style={[styles.attFill, {
                      width: `${attSummary.attendancePercentage}%`,
                      backgroundColor: attSummary.attendancePercentage >= 75 ? Colors.success : Colors.danger,
                    }]} />
                  </View>
                  <View style={styles.attStats}>
                    {[
                      { label: 'Present', val: attSummary.presentDays, color: Colors.success },
                      { label: 'Absent', val: attSummary.absentDays, color: Colors.danger },
                      { label: 'Late', val: attSummary.lateDays, color: Colors.warning },
                      { label: '%', val: `${attSummary.attendancePercentage.toFixed(0)}%`, color: theme.text },
                    ].map(s => (
                      <View key={s.label} style={styles.attStat}>
                        <Text style={[styles.attVal, { color: s.color as string }]}>{s.val}</Text>
                        <Text style={[styles.attLabel, { color: theme.textMuted }]}>{s.label}</Text>
                      </View>
                    ))}
                  </View>
                </Card>
              ) : <ActivityIndicator color={Colors.primary[500]} />}

              {/* Fees */}
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Fee Summary</Text>
              {fees ? (
                <Card style={{ gap: 10 }}>
                  {[
                    { label: 'Total Fee', val: `₹${Number(fees.totalFee).toLocaleString('en-IN')}`, color: theme.text },
                    { label: 'Paid', val: `₹${Number(fees.totalPaid).toLocaleString('en-IN')}`, color: Colors.success },
                    { label: 'Balance', val: `₹${Number(fees.totalBalance).toLocaleString('en-IN')}`, color: fees.totalBalance > 0 ? Colors.danger : Colors.success },
                  ].map(row => (
                    <View key={row.label} style={styles.feeRow}>
                      <Text style={[styles.feeLabel, { color: theme.textSecondary }]}>{row.label}</Text>
                      <Text style={[styles.feeVal, { color: row.color as string }]}>{row.val}</Text>
                    </View>
                  ))}
                </Card>
              ) : <ActivityIndicator color={Colors.primary[500]} />}

              {/* Extra info */}
              {(selectedStudent.bloodGroup || selectedStudent.dateOfBirth || selectedStudent.parentName) && (
                <>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>Additional Info</Text>
                  <Card style={{ gap: 8 }}>
                    {selectedStudent.bloodGroup && (
                      <View style={styles.feeRow}>
                        <Text style={[styles.feeLabel, { color: theme.textSecondary }]}>Blood Group</Text>
                        <Badge label={selectedStudent.bloodGroup} variant="danger" small />
                      </View>
                    )}
                    {selectedStudent.dateOfBirth && (
                      <View style={styles.feeRow}>
                        <Text style={[styles.feeLabel, { color: theme.textSecondary }]}>Date of Birth</Text>
                        <Text style={[styles.feeVal, { color: theme.text }]}>{selectedStudent.dateOfBirth}</Text>
                      </View>
                    )}
                    {selectedStudent.parentName && (
                      <View style={styles.feeRow}>
                        <Text style={[styles.feeLabel, { color: theme.textSecondary }]}>Parent</Text>
                        <Text style={[styles.feeVal, { color: theme.text }]}>{selectedStudent.parentName}</Text>
                      </View>
                    )}
                    {selectedStudent.parentPhone && (
                      <View style={styles.feeRow}>
                        <Text style={[styles.feeLabel, { color: theme.textSecondary }]}>Parent Phone</Text>
                        <Text style={[styles.feeVal, { color: theme.text }]}>{selectedStudent.parentPhone}</Text>
                      </View>
                    )}
                  </Card>
                </>
              )}

              {/* Behavior Remark Button */}
              <TouchableOpacity
                onPress={() => setShowRemark(true)}
                style={{
                  backgroundColor: '#f59e0b18', borderColor: '#f59e0b44',
                  borderWidth: 1.5, borderRadius: 14, padding: 14,
                  flexDirection: 'row', alignItems: 'center', gap: 10,
                }}
              >
                <Text style={{ fontSize: 22 }}>💬</Text>
                <View>
                  <Text style={[{ fontWeight: '700', fontSize: 15 }, { color: '#f59e0b' }]}>
                    Add Behavior Remark
                  </Text>
                  <Text style={{ fontSize: 12, color: '#9ca3af' }}>
                    Award points or note behavior
                  </Text>
                </View>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </Modal>

      {/* Behavior Remark Modal */}
      {selectedStudent && (
        <Modal visible={showRemark} animationType="slide" presentationStyle="pageSheet"
          onRequestClose={() => setShowRemark(false)}>
          <View style={{ flex: 1 }}>
            <BehaviorRemarkScreen
              studentId={selectedStudent.id}
              studentName={`${selectedStudent.user.firstName} ${selectedStudent.user.lastName}`}
              onClose={() => setShowRemark(false)}
            />
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20 },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '800' },
  headerSub: { color: '#ffffff99', fontSize: 13, marginTop: 2 },
  filterWrap: {},
  classChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 99, backgroundColor: '#e2e8f0' },
  classChipText: { fontSize: 13, fontWeight: '600' },
  searchWrap: { paddingHorizontal: 16, paddingVertical: 10 },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  searchInput: { flex: 1, fontSize: 14 },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16, gap: 10, paddingBottom: 40 },
  studentCard: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  studentName: { fontSize: 14, fontWeight: '700' },
  studentAdm: { fontSize: 12, marginTop: 1 },
  studentClass: { fontSize: 11, marginTop: 1 },
  modal: { flex: 1 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1 },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  profileCard: { flexDirection: 'row', gap: 16 },
  profileName: { fontSize: 17, fontWeight: '800' },
  profileAdm: { fontSize: 13 },
  profileEmail: { fontSize: 12, marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  attBar: { height: 10, borderRadius: 5, overflow: 'hidden' },
  attFill: { height: '100%', borderRadius: 5 },
  attStats: { flexDirection: 'row', justifyContent: 'space-around' },
  attStat: { alignItems: 'center' },
  attVal: { fontSize: 20, fontWeight: '800' },
  attLabel: { fontSize: 11 },
  feeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  feeLabel: { fontSize: 14 },
  feeVal: { fontSize: 14, fontWeight: '700' },
});
