import { Bell, LogOut, Menu, X } from "lucide-react";
import { useAuth, ROLE_LABELS } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

interface TopbarProps {
  onMenuClick?: () => void;
  mobileMenuOpen?: boolean;
}

export default function Topbar({ onMenuClick, mobileMenuOpen = false }: TopbarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <header className="h-16 min-h-16 bg-white border-b border-slate-100 flex items-center justify-between px-3 sm:px-4 lg:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          type="button"
          onClick={onMenuClick}
          className="lg:hidden shrink-0 p-2.5 rounded-xl text-slate-700 hover:bg-slate-100 active:bg-slate-200"
          aria-label={mobileMenuOpen ? "إغلاق القائمة" : "فتح القائمة"}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X size={23} /> : <Menu size={23} />}
        </button>
        <div className="min-w-0">
          <p className="text-xs sm:text-sm text-slate-400 truncate">مرحبًا بك،</p>
          <p className="font-bold text-slate-800 leading-tight truncate max-w-[12rem] sm:max-w-none">
            {user?.fullName}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-3 shrink-0">
        <span className="badge bg-brand-50 text-brand-700 hidden sm:inline-flex">
          {user ? ROLE_LABELS[user.role] : ""}
        </span>
        <button
          type="button"
          className="relative p-2.5 rounded-xl hover:bg-slate-100 active:bg-slate-200"
          aria-label="الإشعارات"
        >
          <Bell size={19} />
        </button>
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-red-600 px-2.5 sm:px-3 py-2 rounded-xl hover:bg-red-50"
          aria-label="تسجيل الخروج"
        >
          <LogOut size={17} />
          <span className="hidden sm:inline">تسجيل الخروج</span>
        </button>
      </div>
    </header>
  );
}
