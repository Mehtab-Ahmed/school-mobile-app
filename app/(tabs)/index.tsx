import { useAuthStore } from '../../src/store/authStore';
import AdminDashboard from '../../src/screens/admin/AdminDashboard';
import TeacherDashboard from '../../src/screens/teacher/TeacherDashboard';
import StudentDashboard from '../../src/screens/student/StudentDashboard';
import ParentDashboard from '../../src/screens/parent/ParentDashboard';
import DriverPortal from '../../src/screens/driver/DriverPortal';

export default function DashboardTab() {
  const role = useAuthStore((s) => s.user?.primaryRole);
  if (role === 'ADMIN') return <AdminDashboard />;
  if (role === 'TEACHER') return <TeacherDashboard />;
  if (role === 'PARENT') return <ParentDashboard />;
  if (role === 'DRIVER') return <DriverPortal />;
  return <StudentDashboard />;
}
