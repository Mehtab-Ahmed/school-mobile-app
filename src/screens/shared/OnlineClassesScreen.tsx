import React from 'react';
import { Alert, Linking, RefreshControl, ScrollView, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { onlineClassesApi } from '../../api/onlineClasses';
import { Card } from '../../components/ui/Card';
import { Badge, statusVariant } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { Colors } from '../../theme/colors';

export default function OnlineClassesScreen() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? Colors.dark : Colors.light;
  const qc = useQueryClient();
  const classes = useQuery({ queryKey: ['online-classes-my'], queryFn: () => onlineClassesApi.my() });
  const join = useMutation({
    mutationFn: (id: number) => onlineClassesApi.join(id),
    onSuccess: async (res) => {
      qc.invalidateQueries({ queryKey: ['online-classes-my'] });
      const url = res.data?.data?.joinUrl ?? res.data?.data?.meetingUrl;
      if (url) Linking.openURL(url);
      else Alert.alert('Joined', 'Class provider is not configured with a direct join link yet.');
    },
    onError: (err: any) => Alert.alert('Join failed', err?.response?.data?.message ?? 'Please try again.'),
  });

  const list = classes.data?.data?.data ?? [];
  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={classes.isRefetching} onRefresh={classes.refetch} tintColor={Colors.primary[500]} />}
    >
      {list.length === 0 ? <EmptyState icon="videocam-outline" title="No online classes" subtitle="Scheduled online classes will appear here." /> : list.map((c) => (
        <Card key={c.id} style={styles.card}>
          <View style={styles.row}>
            <Text style={[styles.title, { color: theme.text }]}>{c.title ?? c.topic ?? c.subjectName ?? 'Online Class'}</Text>
            <Badge label={c.status ?? 'SCHEDULED'} variant={statusVariant(c.status ?? 'INFO')} small />
          </View>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {c.teacherName ?? 'Teacher'} {c.scheduledStart ? `- ${new Date(c.scheduledStart).toLocaleString()}` : ''}
          </Text>
          <Button label="Join Class" onPress={() => join.mutate(c.id)} loading={join.isPending} />
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  card: { gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  title: { flex: 1, fontSize: 16, fontWeight: '800' },
  subtitle: { fontSize: 13, lineHeight: 19 },
});
