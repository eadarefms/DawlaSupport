import { useEffect, useState } from "react";
import { CalendarClock, Download, Pencil, Video, X } from "lucide-react";
import { api, downloadProtectedFile, getApiErrorMessage } from "../api/client";
import { SessionItem, SessionStatus } from "../types";
import { STATUS_CLASSES, STATUS_LABELS, formatDateShort, formatDurationLabel } from "../utils/sessionStatus";
import { useAuth } from "../context/AuthContext";

const ALL_STATUSES: SessionStatus[] = [
  "PROPOSED",
  "UNDER_REVIEW",
  "APPROVED",
  "SCHEDULED",
  "COMPLETED",
  "CANCELLED",
];

export default function SessionsManagement() {
  const { user } = useAuth();

  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [editingSession, setEditingSession] = useState<SessionItem | null>(null);

  const canEditAnyLink =
    user?.role === "PROVINCIAL_COORDINATOR" ||
    user?.role === "REGIONAL_HEAD" ||
    user?.role === "ADMIN";

  function load() {
    setLoading(true);
    setError(null);

    api
      .get<SessionItem[]>("/sessions")
      .then((res) => setSessions(res.data))
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleStatusChange(id: string, status: SessionStatus) {
    setError(null);
    try {
      await api.patch(`/sessions/${id}/status`, { status });
      load();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }

  async function handleExport() {
    setExporting(true);
    setError(null);

    try {
      await downloadProtectedFile("/export/sessions.xlsx", "الحصص.xlsx");
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <CalendarClock size={22} className="text-brand-600" />
          الحصص
        </h1>

        <button onClick={handleExport} disabled={exporting} className="btn-secondary">
          <Download size={16} />
          {exporting ? "جارٍ التصدير..." : "تصدير Excel"}
        </button>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">
          {error}
        </div>
      )}

      {loading && <p className="text-sm text-slate-400">جارٍ التحميل...</p>}

      {!loading && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead>
              <tr className="text-slate-500 border-b border-slate-100">
                <th className="py-2 pl-3 font-medium">الدرس</th>
                <th className="py-2 pl-3 font-medium">الأستاذ</th>
                <th className="py-2 pl-3 font-medium">المستوى/الشعبة</th>
                <th className="py-2 pl-3 font-medium">المادة</th>
                <th className="py-2 pl-3 font-medium">التاريخ</th>
                <th className="py-2 pl-3 font-medium">التوقيت</th>
                <th className="py-2 pl-3 font-medium">الرابط</th>
                <th className="py-2 font-medium">الحالة</th>
              </tr>
            </thead>

            <tbody>
              {sessions.map((s) => (
                <tr key={s.id} className="border-b border-slate-50 last:border-0">
                  <td className="py-2.5 pl-3 font-medium">{s.title}</td>
                  <td className="py-2.5 pl-3">{s.teacher.fullName}</td>

                  <td className="py-2.5 pl-3">
                    {s.level.name}
                    {s.stream ? ` / ${s.stream.name}` : ""}
                  </td>

                  <td className="py-2.5 pl-3">{s.subject.name}</td>
                  <td className="py-2.5 pl-3">{formatDateShort(s.date)}</td>

                  <td className="py-2.5 pl-3">
                    {s.startTime}–{s.endTime} ({formatDurationLabel(s.durationMin)})
                  </td>

                  <td className="py-2.5 pl-3">
                    <div className="flex items-center gap-2 min-w-[190px]">
                      {s.meetingLink ? (
                        <a
                          href={s.meetingLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-brand-700 font-medium hover:underline"
                        >
                          <Video size={14} />
                          الدخول
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400">لا يوجد رابط</span>
                      )}

                      {canEditAnyLink && (
                        <button
                          type="button"
                          onClick={() => setEditingSession(s)}
                          className="inline-flex items-center gap-1 text-xs text-brand-600 hover:text-brand-800 font-medium"
                          title="تعديل الرابط"
                        >
                          <Pencil size={13} />
                          تغيير الرابط
                        </button>
                      )}
                    </div>
                  </td>

                  <td className="py-2.5">
                    <select
                      value={s.status}
                      onChange={(e) =>
                        handleStatusChange(s.id, e.target.value as SessionStatus)
                      }
                      className={`badge border-0 cursor-pointer ${STATUS_CLASSES[s.status]}`}
                    >
                      {ALL_STATUSES.map((st) => (
                        <option key={st} value={st}>
                          {STATUS_LABELS[st]}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}

              {sessions.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    لا توجد حصص.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {editingSession && (
        <MeetingLinkModal
          session={editingSession}
          onClose={() => setEditingSession(null)}
          onSaved={(updated) => {
            setSessions((current) =>
              current.map((s) => (s.id === updated.id ? { ...s, ...updated } : s))
            );
            setEditingSession(null);
          }}
        />
      )}
    </div>
  );
}

function MeetingLinkModal({
  session,
  onClose,
  onSaved,
}: {
  session: SessionItem;
  onClose: () => void;
  onSaved: (updated: SessionItem) => void;
}) {
  const [link, setLink] = useState(session.meetingLink ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const res = await api.patch<SessionItem>(
        `/sessions/${session.id}/meeting-link`,
        { meetingLink: link.trim() }
      );

      onSaved(res.data);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 text-slate-400 hover:text-slate-600"
          aria-label="إغلاق"
        >
          <X size={18} />
        </button>

        <h3 className="font-bold text-lg mb-1">تغيير رابط الحصة</h3>

        <p className="text-sm text-slate-500 mb-4">
          {session.title} — {session.teacher.fullName}
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="label-field">رابط الحصة</label>
            <input
              type="url"
              className="input-field"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://meet.jit.si/... أو رابط Teams/Meet"
              required
              autoFocus
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving || !link.trim()}
              className="btn-primary flex-1"
            >
              {saving ? "جارٍ الحفظ..." : "حفظ الرابط"}
            </button>

            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="btn-secondary"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
