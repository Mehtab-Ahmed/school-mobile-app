import { Tabs, Redirect } from 'expo-router';
import { useColorScheme, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { Colors } from '../../src/theme/colors';

type TabConfig = {
  name: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  focusedIcon: keyof typeof Ionicons.glyphMap;
};

const ADMIN_TABS: TabConfig[] = [
  { name: 'index', title: 'Dashboard', icon: 'grid-outline', focusedIcon: 'grid' },
  { name: 'students', title: 'Students', icon: 'people-outline', focusedIcon: 'people' },
  { name: 'teachers', title: 'Teachers', icon: 'school-outline', focusedIcon: 'school' },
  { name: 'fees', title: 'Fees', icon: 'card-outline', focusedIcon: 'card' },
  { name: 'more', title: 'More', icon: 'menu-outline', focusedIcon: 'menu' },
];

const TEACHER_TABS: TabConfig[] = [
  { name: 'index', title: 'Dashboard', icon: 'grid-outline', focusedIcon: 'grid' },
  { name: 'attendance', title: 'Attendance', icon: 'checkmark-circle-outline', focusedIcon: 'checkmark-circle' },
  { name: 'homework', title: 'Homework', icon: 'book-outline', focusedIcon: 'book' },
  { name: 'timetable', title: 'Timetable', icon: 'calendar-outline', focusedIcon: 'calendar' },
  { name: 'more', title: 'More', icon: 'menu-outline', focusedIcon: 'menu' },
];

const STUDENT_TABS: TabConfig[] = [
  { name: 'index', title: 'Dashboard', icon: 'grid-outline', focusedIcon: 'grid' },
  { name: 'attendance', title: 'Attendance', icon: 'checkmark-circle-outline', focusedIcon: 'checkmark-circle' },
  { name: 'homework', title: 'Homework', icon: 'book-outline', focusedIcon: 'book' },
  { name: 'exams', title: 'Exams', icon: 'document-text-outline', focusedIcon: 'document-text' },
  { name: 'more', title: 'More', icon: 'menu-outline', focusedIcon: 'menu' },
];

const PARENT_TABS: TabConfig[] = [
  { name: 'index', title: 'Dashboard', icon: 'grid-outline', focusedIcon: 'grid' },
  { name: 'attendance', title: 'Attendance', icon: 'checkmark-circle-outline', focusedIcon: 'checkmark-circle' },
  { name: 'fees', title: 'Fees', icon: 'card-outline', focusedIcon: 'card' },
  { name: 'exams', title: 'Exams', icon: 'document-text-outline', focusedIcon: 'document-text' },
  { name: 'more', title: 'More', icon: 'menu-outline', focusedIcon: 'menu' },
];

// All possible tab names
const ALL_TABS = ['index', 'students', 'teachers', 'fees', 'attendance', 'homework', 'timetable', 'exams', 'more'];

export default function TabsLayout() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? Colors.dark : Colors.light;
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) return <Redirect href="/(auth)/login" />;

  const role = user?.primaryRole ?? 'STUDENT';
  const tabs =
    role === 'ADMIN' ? ADMIN_TABS :
    role === 'TEACHER' ? TEACHER_TABS :
    role === 'PARENT' ? PARENT_TABS :
    STUDENT_TABS;

  const activeTabNames = new Set(tabs.map((t) => t.name));

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopColor: theme.border,
          borderTopWidth: 1,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          paddingTop: 8,
          height: Platform.OS === 'ios' ? 84 : 64,
        },
        tabBarActiveTintColor: Colors.primary[500],
        tabBarInactiveTintColor: theme.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      {ALL_TABS.map((tabName) => {
        const cfg = tabs.find((t) => t.name === tabName);
        if (!cfg) {
          return (
            <Tabs.Screen
              key={tabName}
              name={tabName}
              options={{ href: null }}
            />
          );
        }
        return (
          <Tabs.Screen
            key={tabName}
            name={tabName}
            options={{
              title: cfg.title,
              tabBarIcon: ({ focused, color }) => (
                <Ionicons
                  name={focused ? cfg.focusedIcon : cfg.icon}
                  size={24}
                  color={color}
                />
              ),
            }}
          />
        );
      })}
    </Tabs>
  );
}
