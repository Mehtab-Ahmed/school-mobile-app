import { useAuthStore } from '../../src/store/authStore';
import TeacherAttendance from '../../src/screens/teacher/TeacherAttendance';
import StudentAttendance from '../../src/screens/student/StudentAttendance';
import ParentAttendance from '../../src/screens/parent/ParentAttendance';

export default function AttendanceTab() {
  const role = useAuthStore((s) => s.user?.primaryRole);
  if (role === 'TEACHER') return <TeacherAttendance />;
  if (role === 'PARENT') return <ParentAttendance />;
  return <StudentAttendance />;
}
