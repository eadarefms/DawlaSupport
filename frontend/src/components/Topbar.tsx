import { Bell, LogOut, Menu } from "lucide-react";
import { useAuth, ROLE_LABELS } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Topbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="lg:hidden p-2 rounded-lg hover:bg-slate-100">
          <Menu size={20} />
        </button>
        <div>
          <p className="text-sm text-slate-400">مرحبًا بك،</p>
          <p className="font-bold text-slate-800 leading-tight">{user?.fullName}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="badge bg-brand-50 text-brand-700 hidden sm:inline-flex">
          {user ? ROLE_LABELS[user.role] : ""}
        </span>
        <button className="relative p-2 rounded-lg hover:bg-slate-100">
          <Bell size={19} />
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-red-600 px-3 py-2 rounded-lg hover:bg-red-50"
        >
          <LogOut size={17} />
          <span className="hidden sm:inline">تسجيل الخروج</span>
        </button>
      </div>
    </header>
  );
}
