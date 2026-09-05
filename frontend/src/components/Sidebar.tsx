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
  X,
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

interface SidebarProps {
  role: Role;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function Sidebar({ role, mobileOpen = false, onMobileClose }: SidebarProps) {
  const items = NAV_BY_ROLE[role] ?? [];

  const nav = (
    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
      {items.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}
          onClick={onMobileClose}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition-colors min-h-[44px] ${
              isActive
                ? "bg-white/15 text-white font-medium"
                : "text-white/70 hover:bg-white/10"
            }`
          }
        >
          <Icon size={19} className="shrink-0" />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );

  return (
    <>
      {/* نسخة الحاسوب */}
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
        {nav}
        <div className="px-5 py-4 border-t border-white/10 text-[11px] text-white/50">
          مصلحة التعلم والتكوين عن بعد © 2026
        </div>
      </aside>

      {/* نسخة الهاتف */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
          aria-hidden="true"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 right-0 z-50 w-[min(86vw,20rem)] bg-brand-900 text-white shadow-2xl flex flex-col lg:hidden transform transition-transform duration-300 ease-out ${
          mobileOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!mobileOpen}
      >
        <div className="flex items-center justify-between gap-3 px-4 py-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
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
          <button
            type="button"
            onClick={onMobileClose}
            className="shrink-0 p-2.5 rounded-xl text-white/80 hover:bg-white/10 active:bg-white/15"
            aria-label="إغلاق القائمة"
          >
            <X size={22} />
          </button>
        </div>

        {nav}

        <div className="px-4 py-4 border-t border-white/10 text-[11px] text-white/50 shrink-0">
          مصلحة التعلم والتكوين عن بعد © 2026
        </div>
      </aside>
    </>
  );
}
