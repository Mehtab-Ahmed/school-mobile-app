import React from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  useColorScheme, ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Colors } from '../../theme/colors';
import { feeInstallmentsApi } from '../../api/advanced';
import ScreenHeader from '../../components/ui/ScreenHeader';

const STATUS_CONFIG: Record<string, { color: string; icon: string; bg: string }> = {
  PENDING:         { color: '#f59e0b', icon: '⏳', bg: '#fffbeb' },
  PAID:            { color: '#10b981', icon: '✅', bg: '#f0fdf4' },
  OVERDUE:         { color: '#ef4444', icon: '⚠️', bg: '#fef2f2' },
  PARTIALLY_PAID:  { color: '#3b82f6', icon: '🔵', bg: '#eff6ff' },
  WAIVED:          { color: '#9ca3af', icon: '🚫', bg: '#f9fafb' },
};

function formatCurrency(amount: number) {
  return `₹${(amount ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function FeeInstallmentsScreen() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? Colors.dark : Colors.light;

  const { data, isLoading } = useQuery({
    queryKey: ['my-installments'],
    queryFn: () => feeInstallmentsApi.getMy().then(r => r.data?.data ?? []),
  });

  const installments: any[] = data ?? [];

  // Summaries
  const totalAmount  = installments.reduce((s, i) => s + (i.amount ?? 0), 0);
  const totalPaid    = installments.reduce((s, i) => s + (i.paidAmount ?? 0), 0);
  const totalPending = installments.filter(i => i.status === 'PENDING' || i.status === 'OVERDUE' || i.status === 'PARTIALLY_PAID')
                                   .reduce((s, i) => s + ((i.amount ?? 0) - (i.paidAmount ?? 0)), 0);
  const paidCount    = installments.filter(i => i.status === 'PAID' || i.status === 'WAIVED').length;
  const progressPct  = installments.length > 0 ? (paidCount / installments.length) * 100 : 0;

  if (isLoading) {
    return <ActivityIndicator style={{ marginTop: 80 }} color={Colors.primary[500]} />;
  }

  return (
    <View style={[s.container, { backgroundColor: theme.background }]}>
      <ScreenHeader title="Fee Installments" />
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>

        {/* Summary card */}
        <View style={[s.summaryCard, { backgroundColor: Colors.primary[500] }]}>
          <View style={s.summaryRow}>
            <View style={s.summaryItem}>
              <Text style={s.summaryLabel}>Total Fees</Text>
              <Text style={s.summaryAmt}>{formatCurrency(totalAmount)}</Text>
            </View>
            <View style={[s.summaryDivider]} />
            <View style={s.summaryItem}>
              <Text style={s.summaryLabel}>Paid</Text>
              <Text style={s.summaryAmt}>{formatCurrency(totalPaid)}</Text>
            </View>
            <View style={s.summaryDivider} />
            <View style={s.summaryItem}>
              <Text style={s.summaryLabel}>Pending</Text>
              <Text style={[s.summaryAmt, { color: '#fde68a' }]}>{formatCurrency(totalPending)}</Text>
            </View>
          </View>
          {/* Progress bar */}
          <View style={s.progressBg}>
            <View style={[s.progressFill, { width: `${progressPct}%` as any }]} />
          </View>
          <Text style={s.progressLabel}>{paidCount}/{installments.length} installments paid</Text>
        </View>

        {/* Installments timeline */}
        {installments.length === 0 ? (
          <View style={s.empty}>
            <Text style={{ fontSize: 44 }}>💰</Text>
            <Text style={[{ color: theme.textSecondary, fontSize: 15 }]}>No installments assigned</Text>
          </View>
        ) : (
          <View style={s.timeline}>
            {installments.map((item, idx) => {
              const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.PENDING;
              const isDark = scheme === 'dark';
              const bgColor = isDark ? theme.card : cfg.bg;
              const isLast = idx === installments.length - 1;
              const isOverdue = item.status === 'OVERDUE';

              return (
                <View key={item.id} style={s.timelineItem}>
                  {/* Left: connector */}
                  <View style={s.timelineLeft}>
                    <View style={[s.dot, { backgroundColor: cfg.color }]}>
                      <Text style={{ fontSize: 10 }}>{cfg.icon}</Text>
                    </View>
                    {!isLast && <View style={[s.line, { backgroundColor: theme.border }]} />}
                  </View>
                  {/* Right: card */}
                  <View style={[s.instCard, { backgroundColor: bgColor, borderColor: isOverdue ? cfg.color : theme.border }]}>
                    <View style={s.instTop}>
                      <Text style={[s.instNum, { color: theme.text }]}>Installment #{item.installmentNumber}</Text>
                      <View style={[s.statusBadge, { backgroundColor: cfg.color + '22' }]}>
                        <Text style={[s.statusText, { color: cfg.color }]}>{item.status}</Text>
                      </View>
                    </View>
                    <View style={s.instAmounts}>
                      <View>
                        <Text style={[s.amtLabel, { color: theme.textMuted }]}>Due Amount</Text>
                        <Text style={[s.amtVal, { color: theme.text }]}>{formatCurrency(item.amount)}</Text>
                      </View>
                      {item.paidAmount > 0 && (
                        <View>
                          <Text style={[s.amtLabel, { color: theme.textMuted }]}>Paid</Text>
                          <Text style={[s.amtVal, { color: '#10b981' }]}>{formatCurrency(item.paidAmount)}</Text>
                        </View>
                      )}
                    </View>
                    <View style={s.instDates}>
                      <Text style={[s.dateText, { color: isOverdue ? '#ef4444' : theme.textMuted }]}>
                        📅 Due: {item.dueDate}
                      </Text>
                      {item.paidAt && (
                        <Text style={[s.dateText, { color: '#10b981' }]}>
                          ✓ Paid: {item.paidAt?.substring(0, 10)}
                        </Text>
                      )}
                    </View>
                    {item.lateFeeApplied > 0 && (
                      <Text style={[s.lateNote, { color: '#ef4444' }]}>
                        Late fee applied: {formatCurrency(item.lateFeeApplied)}
                      </Text>
                    )}
                    {item.transactionId && (
                      <Text style={[s.txnId, { color: theme.textMuted }]}>TXN: {item.transactionId}</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container:    { flex: 1 },
  summaryCard:  { margin: 16, borderRadius: 20, padding: 20 },
  summaryRow:   { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
  summaryItem:  { alignItems: 'center', flex: 1 },
  summaryLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: '600', marginBottom: 4 },
  summaryAmt:   { color: '#fff', fontSize: 14, fontWeight: '800' },
  summaryDivider:{ width: 1, backgroundColor: 'rgba(255,255,255,0.3)' },
  progressBg:   { height: 8, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#fff', borderRadius: 4 },
  progressLabel:{ color: 'rgba(255,255,255,0.8)', fontSize: 11, textAlign: 'center', marginTop: 8 },
  timeline:     { marginHorizontal: 16 },
  timelineItem: { flexDirection: 'row', gap: 12 },
  timelineLeft: { alignItems: 'center', width: 34 },
  dot:          { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  line:         { flex: 1, width: 2, marginVertical: 4 },
  instCard:     { flex: 1, marginBottom: 12, borderRadius: 14, padding: 14, borderWidth: 1 },
  instTop:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  instNum:      { fontSize: 14, fontWeight: '800' },
  statusBadge:  { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusText:   { fontSize: 11, fontWeight: '700' },
  instAmounts:  { flexDirection: 'row', gap: 24, marginBottom: 8 },
  amtLabel:     { fontSize: 10, fontWeight: '600', marginBottom: 2 },
  amtVal:       { fontSize: 16, fontWeight: '900' },
  instDates:    { gap: 2 },
  dateText:     { fontSize: 12 },
  lateNote:     { fontSize: 11, marginTop: 6, fontWeight: '600' },
  txnId:        { fontSize: 10, marginTop: 4, fontFamily: 'monospace' },
  empty:        { alignItems: 'center', paddingTop: 60, gap: 10 },
});
