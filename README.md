# 📱 School ERP — Mobile App

> A full-featured **React Native + Expo** mobile application for the School ERP System. Supports Students, Parents, and Teachers with native iOS and Android experiences.

---

## 📋 Table of Contents

- [Tech Stack](#-tech-stack)
- [Features by Role](#-features-by-role)
- [Screens](#-screens)
- [Prerequisites](#-prerequisites)
- [Getting Started](#-getting-started)
- [Running on Device / Emulator](#-running-on-device--emulator)
- [Project Structure](#-project-structure)
- [API Configuration](#-api-configuration)
- [Demo Credentials](#-demo-credentials)

---

## 🛠 Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| React Native | 0.85 | Mobile UI framework |
| Expo SDK | 56 | Native APIs, build tooling |
| Expo Router | 4.x | File-based navigation |
| React Navigation | 7.x | Tab + Stack navigation |
| TanStack React Query | 5.x | Server state & caching |
| Zustand | 5.x | Auth state management |
| Axios | 1.x | HTTP client with JWT interceptors |
| Expo SecureStore | 56.x | Encrypted token storage |
| Expo Vector Icons | 15.x | Ionicons icon set |
| React Native Reanimated | 4.x | Smooth animations |
| React Native Safe Area | 5.x | Notch / edge handling |

---

## ✨ Features by Role

### 🎓 Student
- **Dashboard** — Attendance donut, pending homework count, fee balance, announcements
- **Attendance** — Monthly attendance summary with progress bars and status card
- **Homework** — Pending assignments list with subject, due date, one-tap submit
- **Fees** — Balance overview with payment history table
- **Exams** — Exam results with marks, percentage, and letter grade
- **Timetable** — Today's schedule + full weekly grid

### 👨‍👩‍👧 Parent
- **Dashboard** — Children profile cards, attendance summary, fee alert, announcements
- **Attendance** — Per-child monthly attendance with progress visualisation
- **Fees** — Fee summary and payment history per child
- **Exams** — Child's exam results and academic performance

### 👩‍🏫 Teacher
- **Dashboard** — My classes, student count, pending homework, today's periods
- **Attendance** — Class + date picker, per-student status toggle, bulk save
- **Homework** — Assignments list with submission tracking per student
- **Timetable** — Teacher's weekly schedule

### 🛡️ Admin
- **Dashboard** — 6 stat cards (students, teachers, fees, library, leaves, payroll), charts
- **Students** — Full student directory with search
- **Teachers** — Staff directory
- **Fees** — Fee collection overview

### 🔔 Shared (all roles)
- **Notifications** — In-app notification list, mark as read
- **Profile & Settings** — User info, app version, logout
- **Dark mode** — Follows system preference automatically

---

## 📱 Screens

### Student Screens
| Screen | File |
|---|---|
| Dashboard | `src/screens/student/StudentDashboard.tsx` |
| Attendance | `src/screens/student/StudentAttendance.tsx` |
| Homework | `src/screens/student/StudentHomework.tsx` |
| Fees | `src/screens/student/StudentFees.tsx` |
| Exams | `src/screens/student/StudentExams.tsx` |

### Teacher Screens
| Screen | File |
|---|---|
| Dashboard | `src/screens/teacher/TeacherDashboard.tsx` |
| Attendance | `src/screens/teacher/TeacherAttendance.tsx` |
| Homework | `src/screens/teacher/TeacherHomework.tsx` |
| Timetable | `src/screens/teacher/TeacherTimetable.tsx` |

### Parent Screens
| Screen | File |
|---|---|
| Dashboard | `src/screens/parent/ParentDashboard.tsx` |
| Attendance | `src/screens/parent/ParentAttendance.tsx` |
| Fees | `src/screens/parent/ParentFees.tsx` |
| Exams | `src/screens/parent/ParentExams.tsx` |

### Admin Screens
| Screen | File |
|---|---|
| Dashboard | `src/screens/admin/AdminDashboard.tsx` |
| Students | `src/screens/admin/AdminStudents.tsx` |
| Teachers | `src/screens/admin/AdminTeachers.tsx` |
| Fees | `src/screens/admin/AdminFees.tsx` |

### Shared Screens
| Screen | File |
|---|---|
| Notifications + More | `src/screens/shared/MoreScreen.tsx` |

---

## ✅ Prerequisites

- **Node.js 18+**
- **npm 9+**
- **Expo CLI** — `npm install -g expo-cli`
- For Android: **Android Studio** with an emulator, OR a physical device with **Expo Go**
- For iOS: **Xcode 15+** (macOS only), OR a physical device with **Expo Go**

---

## 🚀 Getting Started

### 1. Install dependencies

```bash
cd school-erp-mobile
npm install
```

### 2. Start the Expo dev server

```bash
npx expo start
```

You'll see a QR code and keyboard shortcuts in the terminal.

---

## 📲 Running on Device / Emulator

### Android Emulator (recommended for dev)
```bash
# With emulator already open in Android Studio:
npx expo start
# Press 'a' to open in emulator
```

### iOS Simulator (macOS only)
```bash
npx expo start
# Press 'i' to open in iOS Simulator
```

### Physical Device (Android or iOS)
1. Install **Expo Go** from the App Store / Play Store
2. Run `npx expo start --lan`
3. Scan the QR code with your camera (iOS) or Expo Go app (Android)

> ⚠️ Make sure your phone and computer are on the **same Wi-Fi network**

### Web Browser
```bash
npx expo start --web
```

---

## 📁 Project Structure

```
school-erp-mobile/
│
├── app/                        # Expo Router file-based routes
│   ├── (auth)/                 # Auth group (no tab bar)
│   │   ├── _layout.tsx
│   │   └── login.tsx           # Login screen
│   └── (tabs)/                 # Main app with tab bar
│       ├── _layout.tsx         # Role-aware tab configuration
│       ├── index.tsx           # Home / Dashboard tab
│       ├── attendance.tsx
│       ├── homework.tsx
│       ├── fees.tsx
│       ├── exams.tsx
│       ├── timetable.tsx
│       ├── students.tsx        # Admin only
│       ├── teachers.tsx        # Admin only
│       └── more.tsx            # Notifications + Settings
│
├── src/
│   ├── api/                    # All API modules
│   │   ├── axios.ts            # Axios client + JWT interceptor
│   │   ├── auth.ts
│   │   ├── dashboard.ts
│   │   ├── students.ts
│   │   ├── attendance.ts
│   │   ├── fees.ts
│   │   ├── homework.ts
│   │   ├── exams.ts
│   │   ├── communication.ts
│   │   └── academic.ts         # + leavesApi
│   │
│   ├── components/
│   │   └── ui/                 # Avatar, Badge, Button, Card,
│   │                           # EmptyState, Input, ScreenHeader, StatCard
│   │
│   ├── hooks/
│   │   └── useTheme.ts         # Dark/light mode helper
│   │
│   ├── screens/                # Role-based screen components
│   │   ├── admin/
│   │   ├── teacher/
│   │   ├── student/
│   │   ├── parent/
│   │   └── shared/
│   │
│   ├── store/
│   │   └── authStore.ts        # Zustand + SecureStore
│   │
│   ├── theme/
│   │   └── colors.ts           # Design token palette
│   │
│   └── types/index.ts          # All TypeScript interfaces
│
├── assets/                     # App icon, splash, fonts
├── app.json                    # Expo config
└── tsconfig.json
```

---

## ⚙️ API Configuration

The mobile app connects to the Spring Boot backend. Edit `src/api/axios.ts`:

```ts
// Android emulator → maps to your machine's localhost
const BASE_URL = 'http://10.0.2.2:8081/api/v1';

// iOS simulator → localhost works directly
// const BASE_URL = 'http://localhost:8081/api/v1';

// Physical device → use your machine's LAN IP
// Find it with: ipconfig (Windows) or ifconfig (Mac/Linux)
// const BASE_URL = 'http://192.168.1.X:8081/api/v1';
```

| Scenario | URL |
|---|---|
| Android Emulator | `http://10.0.2.2:8081/api/v1` |
| iOS Simulator | `http://localhost:8081/api/v1` |
| Physical Device | `http://<your-LAN-IP>:8081/api/v1` |

---

## 👤 Demo Credentials

| Role | Email | Password |
|---|---|---|
| Admin | `admin@school.com` | `School@1234` |
| Teacher | `rajesh.kumar@school.com` | `School@1234` |
| Student | `arjun.sharma@school.com` | `School@1234` |
| Parent | `parent1@school.com` | `School@1234` |

> The login screen shows quick-tap role buttons for fast demo access.

---

## 🔒 Security

- Tokens stored in **Expo SecureStore** (AES-256 encrypted, backed by Android Keystore / iOS Keychain)
- Automatic JWT refresh on 401 responses
- Logout clears all stored credentials

---

## 🔗 Related Projects

| Project | Path | Description |
|---|---|---|
| Backend API | `../school-management-backend` | Spring Boot 3.2 REST API |
| Web Frontend | `../school-erp-frontend` | React 19 + Vite + Tailwind |

---

*Built with ❤️ using React Native · Expo SDK 56 · TypeScript*
