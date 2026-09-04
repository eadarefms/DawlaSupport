import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarClock,
  Users,
  Clock,
  Bell,
  BookOpen,
  BarChart3,
  Settings,
  UserCog,
} from "lucide-react";
import { Role } from "../types";

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
}

const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  TEACHER: [
    { to: "/", label: "لوحة القيادة", icon: LayoutDashboard },
    { to: "/propose-session", label: "المشاركة في تقديم حصة", icon: CalendarClock },
    { to: "/schedule", label: "استعمال الزمن", icon: Clock },
    { to: "/beneficiaries", label: "التلاميذ المستفيدون", icon: Users },
    { to: "/hours-certificates", label: "الساعات والشهادات", icon: Clock },
    { to: "/notifications", label: "الإشعارات", icon: Bell },
  ],
  STUDENT: [
    { to: "/", label: "لوحة القيادة", icon: LayoutDashboard },
    { to: "/schedule", label: "استعمال الزمن المتاح", icon: Clock },
    { to: "/available-lessons", label: "الدروس المتاحة", icon: BookOpen },
    { to: "/my-lessons", label: "دروسي", icon: BookOpen },
    { to: "/notifications", label: "الإشعارات", icon: Bell },
  ],
  PROVINCIAL_COORDINATOR: [
    { to: "/", label: "لوحة القيادة", icon: LayoutDashboard },
    { to: "/teachers", label: "الأساتذة", icon: Users },
    { to: "/students", label: "التلاميذ", icon: Users },
    { to: "/sessions", label: "الحصص", icon: CalendarClock },
    { to: "/schedule", label: "استعمالات الزمن", icon: Clock },
    { to: "/hours-certificates", label: "الساعات والشهادات", icon: Clock },
    { to: "/stats", label: "الإحصائيات", icon: BarChart3 },
  ],
  REGIONAL_HEAD: [
    { to: "/", label: "لوحة القيادة الجهوية", icon: LayoutDashboard },
    { to: "/teachers", label: "الأساتذة", icon: Users },
    { to: "/students", label: "التلاميذ", icon: Users },
    { to: "/sessions", label: "الحصص", icon: CalendarClock },
    { to: "/schedule", label: "استعمالات الزمن", icon: Clock },
    { to: "/hours-certificates", label: "الساعات والشهادات", icon: Clock },
    { to: "/stats", label: "الإحصائيات", icon: BarChart3 },
    { to: "/reports", label: "التقارير", icon: BarChart3 },
  ],
  ADMIN: [
    { to: "/", label: "لوحة القيادة الجهوية", icon: LayoutDashboard },
    { to: "/teachers", label: "الأساتذة", icon: Users },
    { to: "/students", label: "التلاميذ", icon: Users },
    { to: "/sessions", label: "الحصص", icon: CalendarClock },
    { to: "/schedule", label: "استعمالات الزمن", icon: Clock },
    { to: "/hours-certificates", label: "الساعات والشهادات", icon: Clock },
    { to: "/stats", label: "الإحصائيات", icon: BarChart3 },
    { to: "/reports", label: "التقارير", icon: BarChart3 },
    { to: "/settings", label: "إعدادات النظام", icon: Settings },
    { to: "/users", label: "إدارة الحسابات", icon: UserCog },
  ],
};

export default function Sidebar({ role }: { role: Role }) {
  const items = NAV_BY_ROLE[role] ?? [];

  return (
    <aside className="w-64 shrink-0 bg-brand-900 text-white min-h-screen hidden lg:flex flex-col">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
          <img
            src="/logo.jpeg"
            alt="شعار المملكة المغربية"
            className="w-full h-full object-contain p-0.5"
          />
        </div>
        <div className="min-w-0">
          <p className="font-bold leading-tight text-sm">الدعم التربوي عن بعد</p>
          <p className="text-[11px] text-white/60 mt-0.5">مراكش آسفي</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                isActive ? "bg-white/15 text-white font-medium" : "text-white/70 hover:bg-white/10"
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-5 py-4 border-t border-white/10 text-[11px] text-white/50">
        مصلحة التعلم والتكوين عن بعد © 2026
      </div>
    </aside>
  );
}
