import React, { useMemo, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { studentsApi } from '../../api/students';
import { adminUsersApi, AdminUser } from '../../api/adminUsers';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { Colors } from '../../theme/colors';
import { Student } from '../../types';

function studentName(s?: Student) {
  if (!s) return 'Select student';
  return `${s.user?.firstName ?? ''} ${s.user?.lastName ?? ''}`.trim() || s.admissionNumber;
}

function parentName(p?: AdminUser) {
  if (!p) return 'Select parent';
  return `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim() || p.email || p.loginId || `Parent #${p.id}`;
}

export default function ParentMappingScreen() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? Colors.dark : Colors.light;
  const qc = useQueryClient();
  const [studentSearch, setStudentSearch] = useState('');
  const [parentSearch, setParentSearch] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [selectedParentId, setSelectedParentId] = useState<number | null>(null);

  const students = useQuery({
    queryKey: ['mapping-students', studentSearch],
    queryFn: () => studentsApi.list({ search: studentSearch || undefined, size: 30 }),
  });
  const parents = useQuery({
    queryKey: ['mapping-parents', parentSearch],
    queryFn: () => adminUsersApi.list({ role: 'PARENT', search: parentSearch || undefined, size: 30 }),
  });
  const linkedParents = useQuery({
    queryKey: ['student-parents', selectedStudentId],
    queryFn: () => studentsApi.parents(selectedStudentId!),
    enabled: !!selectedStudentId,
  });

  const studentList = students.data?.data?.data?.content ?? [];
  const parentList = parents.data?.data?.data?.content ?? [];
  const selectedStudent = useMemo(() => studentList.find((s) => s.id === selectedStudentId), [studentList, selectedStudentId]);
  const selectedParent = useMemo(() => parentList.find((p) => p.id === selectedParentId), [parentList, selectedParentId]);
  const linked = linkedParents.data?.data?.data ?? [];

  const link = useMutation({
    mutationFn: () => studentsApi.linkParent(selectedStudentId!, selectedParentId!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['student-parents', selectedStudentId] });
      Alert.alert('Linked', 'Parent linked to student.');
    },
    onError: (err: any) => Alert.alert('Link failed', err?.response?.data?.message ?? 'Please try again.'),
  });

  const unlink = useMutation({
    mutationFn: (parentId: number) => studentsApi.unlinkParent(selectedStudentId!, parentId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['student-parents', selectedStudentId] }),
    onError: (err: any) => Alert.alert('Unlink failed', err?.response?.data?.message ?? 'Please try again.'),
  });

  const reset = useMutation({
    mutationFn: (parentId: number) => adminUsersApi.resetPassword(parentId),
    onSuccess: (res) => Alert.alert('Credentials Reset', `Login ID: ${res.data.data.loginId}\nPassword: ${res.data.data.tempPassword}`),
    onError: (err: any) => Alert.alert('Reset failed', err?.response?.data?.message ?? 'Please try again.'),
  });

  const refresh = () => { students.refetch(); parents.refetch(); linkedParents.refetch(); };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={students.isRefetching || parents.isRefetching || linkedParents.isRefetching} onRefresh={refresh} tintColor={Colors.primary[500]} />}
    >
      <Card style={styles.card}>
        <Text style={[styles.title, { color: theme.text }]}>Parent-Child Mapping</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Link one parent to multiple children, or multiple guardians to one student.</Text>
      </Card>

      <PickerBlock
        title="Student"
        search={studentSearch}
        setSearch={setStudentSearch}
        placeholder="Search students"
        items={studentList.map((s) => ({ id: s.id, title: studentName(s), sub: s.admissionNumber }))}
        selectedId={selectedStudentId}
        setSelectedId={setSelectedStudentId}
      />

      <PickerBlock
        title="Parent / Guardian"
        search={parentSearch}
        setSearch={setParentSearch}
        placeholder="Search parents"
        items={parentList.map((p) => ({ id: p.id, title: parentName(p), sub: p.loginId ?? p.email ?? p.phoneNumber }))}
        selectedId={selectedParentId}
        setSelectedId={setSelectedParentId}
      />

      <Button
        label={`Link ${parentName(selectedParent)} to ${studentName(selectedStudent)}`}
        disabled={!selectedStudentId || !selectedParentId}
        loading={link.isPending}
        onPress={() => link.mutate()}
        fullWidth
      />

      <Text style={[styles.sectionTitle, { color: theme.text }]}>Linked Parents</Text>
      {!selectedStudentId ? (
        <EmptyState icon="people-outline" title="Select a student" subtitle="Existing parent links will show here." />
      ) : linked.length === 0 ? (
        <EmptyState icon="person-add-outline" title="No linked parents" />
      ) : linked.map((p: any) => (
        <Card key={p.id} style={styles.linkedCard}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.itemTitle, { color: theme.text }]}>{parentName(p)}</Text>
            <Text style={[styles.itemSub, { color: theme.textSecondary }]}>{p.loginId ?? p.email ?? p.phoneNumber ?? `ID ${p.id}`}</Text>
          </View>
          <Badge label={p.role ?? 'PARENT'} variant="success" small />
          <TouchableOpacity onPress={() => reset.mutate(p.id)} style={styles.iconBtn}>
            <Ionicons name="key-outline" size={18} color={Colors.primary[500]} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => unlink.mutate(p.id)} style={styles.iconBtn}>
            <Ionicons name="unlink-outline" size={18} color={Colors.danger} />
          </TouchableOpacity>
        </Card>
      ))}
    </ScrollView>
  );
}

function PickerBlock(props: {
  title: string;
  search: string;
  setSearch: (v: string) => void;
  placeholder: string;
  items: Array<{ id: number; title: string; sub?: string }>;
  selectedId: number | null;
  setSelectedId: (id: number) => void;
}) {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? Colors.dark : Colors.light;
  return (
    <Card style={styles.card}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>{props.title}</Text>
      <View style={[styles.search, { backgroundColor: theme.surface2, borderColor: theme.border }]}>
        <Ionicons name="search-outline" size={16} color={theme.textMuted} />
        <TextInput
          value={props.search}
          onChangeText={props.setSearch}
          placeholder={props.placeholder}
          placeholderTextColor={theme.textMuted}
          style={[styles.searchInput, { color: theme.text }]}
        />
      </View>
      {props.items.length === 0 ? <EmptyState icon="search-outline" title="No matches" /> : props.items.map((item) => {
        const selected = item.id === props.selectedId;
        return (
          <TouchableOpacity
            key={item.id}
            onPress={() => props.setSelectedId(item.id)}
            style={[styles.item, { backgroundColor: selected ? Colors.primary[50] : theme.surface2, borderColor: selected ? Colors.primary[500] : theme.border }]}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.itemTitle, { color: theme.text }]}>{item.title}</Text>
              {!!item.sub && <Text style={[styles.itemSub, { color: theme.textSecondary }]}>{item.sub}</Text>}
            </View>
            {selected && <Ionicons name="checkmark-circle" size={20} color={Colors.primary[500]} />}
          </TouchableOpacity>
        );
      })}
    </Card>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  card: { gap: 10 },
  title: { fontSize: 18, fontWeight: '800' },
  subtitle: { fontSize: 13, lineHeight: 19 },
  sectionTitle: { fontSize: 15, fontWeight: '800' },
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, height: 44 },
  searchInput: { flex: 1, fontSize: 14 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 12, padding: 12 },
  itemTitle: { fontSize: 14, fontWeight: '800' },
  itemSub: { fontSize: 12, marginTop: 2 },
  linkedCard: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
});
