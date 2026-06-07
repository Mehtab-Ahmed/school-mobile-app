import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'default' | 'primary';

const VARIANT_STYLES: Record<BadgeVariant, { bg: string; text: string }> = {
  success: { bg: '#d1fae5', text: '#065f46' },
  warning: { bg: '#fef3c7', text: '#92400e' },
  danger: { bg: '#fee2e2', text: '#991b1b' },
  info: { bg: '#cffafe', text: '#155e75' },
  primary: { bg: '#e0e7ff', text: '#3730a3' },
  default: { bg: '#f1f5f9', text: '#475569' },
};

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  small?: boolean;
}

export function Badge({ label, variant = 'default', small = false }: BadgeProps) {
  const style = VARIANT_STYLES[variant];
  return (
    <View style={[styles.badge, { backgroundColor: style.bg }, small && styles.small]}>
      <Text style={[styles.text, { color: style.text }, small && styles.smallText]}>
        {label}
      </Text>
    </View>
  );
}

export function statusVariant(status: string): BadgeVariant {
  const s = status?.toUpperCase();
  if (['PAID', 'APPROVED', 'PRESENT', 'ACTIVE', 'SUBMITTED', 'GRADED'].includes(s)) return 'success';
  if (['PENDING', 'LATE', 'PARTIAL', 'ONGOING'].includes(s)) return 'warning';
  if (['OVERDUE', 'REJECTED', 'ABSENT', 'INACTIVE'].includes(s)) return 'danger';
  if (['UPCOMING', 'EXCUSED'].includes(s)) return 'info';
  return 'default';
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
    alignSelf: 'flex-start',
  },
  small: { paddingHorizontal: 7, paddingVertical: 2 },
  text: { fontSize: 12, fontWeight: '600' },
  smallText: { fontSize: 10 },
});
