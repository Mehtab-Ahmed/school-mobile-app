import React from 'react';
import { Text, View, StyleSheet, useColorScheme } from 'react-native';
import { Colors } from '../theme/colors';

export const PRIVACY_VERSION = '2026-09-15';

const SECTIONS: Array<[string, string]> = [
  ['Who is responsible',
    'Your school uses this app to run school life — attendance, homework, exams and results, fees, transport and messages between school and home. The school decides how the app is used and is responsible for the data in it.'],
  ['What we keep',
    "Names, class, admission and roll numbers, date of birth, photo and contact details; parents' contact details and which children they are linked to; school records such as attendance, homework, marks, report cards, fees, leave, health and behaviour notes; the bus location while a trip runs; and sign-in activity and this phone's notification token if you allow notifications."],
  ['Why',
    "Only to provide the school's services and tell families what they need to know. Personal data is not sold or used for advertising."],
  ['Children',
    "A child's data is processed with a parent's or guardian's consent. When a parent accepts this notice, they consent for their linked children. Students see only their own records."],
  ['Who can see it',
    'School staff according to their role, and parents for their own children. Text messages, email and push notifications go through service providers who handle the data only to deliver them.'],
  ['How long',
    'While the student or staff member is with the school, and afterwards only as long as the school must keep records (for example results, certificates and fee receipts).'],
  ['Your rights',
    "You can ask to see or correct your data, withdraw consent, or ask for your account and data to be deleted — from Settings in this app or through your school office. Records the school must keep by law are retained. You can raise a grievance with your school and, under India's Digital Personal Data Protection Act, 2023, with the Data Protection Board of India."],
];

export function PrivacyNoticeText() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? Colors.dark : Colors.light;
  return (
    <View style={{ gap: 14 }}>
      <Text style={[styles.version, { color: theme.textMuted }]}>Privacy notice · version {PRIVACY_VERSION}</Text>
      {SECTIONS.map(([heading, body]) => (
        <View key={heading} style={{ gap: 4 }}>
          <Text style={[styles.heading, { color: theme.text }]}>{heading}</Text>
          <Text style={[styles.body, { color: theme.textSecondary }]}>{body}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  version: { fontSize: 12 },
  heading: { fontSize: 15, fontWeight: '700' },
  body: { fontSize: 14, lineHeight: 21 },
});
