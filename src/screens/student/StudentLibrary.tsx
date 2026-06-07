import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  useColorScheme, ActivityIndicator, RefreshControl, TextInput,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { libraryApi } from '../../api/library';
import { Card } from '../../components/ui/Card';
import { Badge, statusVariant } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { Colors } from '../../theme/colors';
import { Book, BookIssue } from '../../types';

type Tab = 'books' | 'issued';

export default function StudentLibrary() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? Colors.dark : Colors.light;
  const [tab, setTab] = useState<Tab>('books');
  const [search, setSearch] = useState('');

  const { data: booksData, isLoading: booksLoading, refetch: refetchBooks, isRefetching: refetchingBooks } = useQuery({
    queryKey: ['library-books', search],
    queryFn: () => libraryApi.books(search || undefined),
  });

  const { data: issuedData, isLoading: issuedLoading, refetch: refetchIssued, isRefetching: refetchingIssued } = useQuery({
    queryKey: ['library-issued'],
    queryFn: () => libraryApi.myIssued(),
  });

  const books: Book[] = booksData?.data ?? [];
  const issued: BookIssue[] = issuedData?.data?.data ?? issuedData?.data ?? [];

  const isLoading = tab === 'books' ? booksLoading : issuedLoading;
  const isRefreshing = tab === 'books' ? refetchingBooks : refetchingIssued;
  const onRefresh = tab === 'books' ? refetchBooks : refetchIssued;

  const renderBook = ({ item }: { item: Book }) => (
    <Card style={styles.bookCard}>
      <View style={styles.bookIcon}>
        <Ionicons name="book" size={24} color={Colors.primary[500]} />
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={[styles.bookTitle, { color: theme.text }]} numberOfLines={2}>{item.title}</Text>
        <Text style={[styles.bookAuthor, { color: theme.textSecondary }]}>by {item.author}</Text>
        {item.subject && (
          <Text style={[styles.bookSubject, { color: theme.textMuted }]}>{item.subject.name}</Text>
        )}
        <View style={styles.bookMeta}>
          <Badge
            label={item.availableCopies > 0 ? `${item.availableCopies} Available` : 'Unavailable'}
            variant={item.availableCopies > 0 ? 'success' : 'danger'}
            small
          />
          <Text style={[styles.copies, { color: theme.textMuted }]}>{item.totalCopies} total</Text>
        </View>
      </View>
    </Card>
  );

  const renderIssue = ({ item }: { item: BookIssue }) => {
    const isOverdue = item.status === 'OVERDUE';
    const dueDate = new Date(item.dueDate);
    const today = new Date();
    const daysLeft = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    return (
      <Card style={[styles.bookCard, isOverdue && { borderColor: Colors.danger + '66', borderWidth: 1.5 }]}>
        <View style={[styles.bookIcon, { backgroundColor: isOverdue ? Colors.danger + '22' : Colors.primary[50] }]}>
          <Ionicons
            name={item.status === 'RETURNED' ? 'checkmark-circle' : 'book-outline'}
            size={24}
            color={isOverdue ? Colors.danger : Colors.primary[500]}
          />
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={[styles.bookTitle, { color: theme.text }]} numberOfLines={2}>
            {item.book.title}
          </Text>
          <Text style={[styles.bookAuthor, { color: theme.textSecondary }]}>by {item.book.author}</Text>
          <View style={styles.issueDates}>
            <Text style={[styles.dateLabel, { color: theme.textMuted }]}>
              Issued: {new Date(item.issuedAt).toLocaleDateString()}
            </Text>
            <Text style={[styles.dateLabel, { color: isOverdue ? Colors.danger : theme.textMuted }]}>
              Due: {dueDate.toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.bookMeta}>
            <Badge label={item.status} variant={statusVariant(item.status)} small />
            {item.status === 'ISSUED' && daysLeft > 0 && (
              <Text style={[styles.copies, { color: theme.textSecondary }]}>{daysLeft}d left</Text>
            )}
            {isOverdue && (
              <Text style={[styles.copies, { color: Colors.danger, fontWeight: '600' }]}>
                {Math.abs(daysLeft)}d overdue
              </Text>
            )}
          </View>
          {isOverdue && !item.finePaid && (
            <View style={[styles.fineWarning, { backgroundColor: Colors.danger + '15' }]}>
              <Ionicons name="warning" size={13} color={Colors.danger} />
              <Text style={[styles.fineText, { color: Colors.danger }]}>Fine may be applicable</Text>
            </View>
          )}
        </View>
      </Card>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: Colors.primary[500] }]}>
        <Text style={styles.headerTitle}>Library</Text>
        <Text style={styles.headerSub}>Browse & manage books</Text>
      </View>

      {/* Tabs */}
      <View style={[styles.tabs, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        {(['books', 'issued'] as Tab[]).map(t => (
          <TouchableOpacity
            key={t}
            onPress={() => setTab(t)}
            style={[styles.tab, tab === t && { borderBottomColor: Colors.primary[500], borderBottomWidth: 2 }]}
          >
            <Text style={[styles.tabText, { color: tab === t ? Colors.primary[500] : theme.textSecondary }]}>
              {t === 'books' ? 'All Books' : 'My Issued'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Search (books tab only) */}
      {tab === 'books' && (
        <View style={[styles.searchWrap, { backgroundColor: theme.surface }]}>
          <View style={[styles.searchBar, { backgroundColor: theme.surface2, borderColor: theme.border }]}>
            <Ionicons name="search" size={18} color={theme.textMuted} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Search books, authors..."
              placeholderTextColor={theme.textMuted}
              value={search}
              onChangeText={setSearch}
              returnKeyType="search"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={18} color={theme.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
        </View>
      ) : tab === 'books' ? (
        <FlatList
          data={books}
          keyExtractor={item => String(item.id)}
          renderItem={renderBook}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<EmptyState icon="book-outline" title="No books found" subtitle="Try a different search" />}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={Colors.primary[500]} />}
        />
      ) : (
        <FlatList
          data={issued}
          keyExtractor={item => String(item.id)}
          renderItem={renderIssue}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<EmptyState icon="book-outline" title="No issued books" subtitle="You haven't borrowed any books yet" />}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={Colors.primary[500]} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20 },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '800' },
  headerSub: { color: '#ffffff99', fontSize: 13, marginTop: 2 },
  tabs: { flexDirection: 'row', borderBottomWidth: 1 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  tabText: { fontSize: 14, fontWeight: '600' },
  searchWrap: { paddingHorizontal: 16, paddingVertical: 10 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 12, borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 14 },
  list: { padding: 16, gap: 12, paddingBottom: 40 },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  bookCard: { flexDirection: 'row', gap: 12 },
  bookIcon: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: Colors.primary[50],
    alignItems: 'center', justifyContent: 'center',
  },
  bookTitle: { fontSize: 14, fontWeight: '700', lineHeight: 20 },
  bookAuthor: { fontSize: 12 },
  bookSubject: { fontSize: 11 },
  bookMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  copies: { fontSize: 11 },
  issueDates: { flexDirection: 'row', gap: 12 },
  dateLabel: { fontSize: 11 },
  fineWarning: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 6, borderRadius: 8, marginTop: 2 },
  fineText: { fontSize: 11, fontWeight: '600' },
});
