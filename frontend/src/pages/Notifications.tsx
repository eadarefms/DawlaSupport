import { useCallback, useEffect, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { api } from "../api/client";

interface NotificationItem {
  id: string;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function Notifications() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<NotificationItem[]>("/notifications/mine");
      setItems(res.data);
    } catch {
      setError("تعذر تحميل الإشعارات. يرجى المحاولة مرة أخرى.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const unreadCount = items.filter((n) => !n.isRead).length;

  async function markAllRead() {
    if (unreadCount === 0) return;
    try {
      await api.patch("/notifications/read-all");
      setItems((current) => current.map((n) => ({ ...n, isRead: true })));
    } catch {
      setError("تعذر تعليم الإشعارات كمقروءة. يرجى المحاولة مرة أخرى.");
    }
  }

  async function markRead(id: string) {
    try {
      await api.patch(`/notifications/${id}/read`);
      setItems((current) =>
        current.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch {
      setError("تعذر تحديث الإشعار.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Bell size={22} className="text-brand-600" />
            الإشعارات
          </h1>
          {!loading && unreadCount > 0 && (
            <span className="min-w-6 h-6 px-1.5 rounded-full bg-brand-600 text-white text-xs font-bold flex items-center justify-center">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>

        {unreadCount > 0 && (
          <button onClick={markAllRead} className="btn-secondary">
            <CheckCheck size={16} />
            تعليم الكل كمقروء
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && <p className="text-sm text-slate-400">جارٍ التحميل...</p>}
      {!loading && !error && items.length === 0 && (
        <p className="text-sm text-slate-400">لا توجد إشعارات.</p>
      )}
      {!loading && !error && items.length > 0 && unreadCount === 0 && (
        <p className="text-sm text-slate-400">جميع الإشعارات مقروءة.</p>
      )}

      <div className="space-y-2">
        {items.map((n) => (
          <button
            key={n.id}
            onClick={() => !n.isRead && markRead(n.id)}
            className={`w-full text-right card !py-3 flex items-center justify-between ${
              n.isRead ? "opacity-60" : "border-r-4 border-r-brand-500"
            }`}
          >
            <div>
              <p className="text-sm text-slate-800">{n.message}</p>
              <p className="text-xs text-slate-400 mt-1">
                {new Date(n.createdAt).toLocaleString("ar-MA")}
              </p>
            </div>
            {!n.isRead && <span className="w-2 h-2 rounded-full bg-brand-500 shrink-0" />}
          </button>
        ))}
      </div>
    </div>
  );
}
