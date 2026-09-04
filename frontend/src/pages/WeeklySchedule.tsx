import { useEffect, useMemo, useState } from "react";
import { ChevronRight, ChevronLeft, Filter, Video, Pencil, X, CalendarDays } from "lucide-react";
import { api, getApiErrorMessage } from "../api/client";
import { Level, SessionItem } from "../types";
import { startOfWeekISO, toISODate } from "../utils/dateRules";
import {
  STATUS_CLASSES,
  STATUS_LABELS,
  formatDurationLabel,
  dayNameOf,
  formatDateShort,
} from "../utils/sessionStatus";
import { useAuth } from "../context/AuthContext";

const DAY_COUNT = 7;

function getLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day);
}

export default function WeeklySchedule() {
  const { user } = useAuth();
  const canSeeMine = user?.role === "TEACHER" || user?.role === "STUDENT";
  const [tab, setTab] = useState<"general" | "mine">("general");

  const [levels, setLevels] = useState<Level[]>([]);
  const [filters, setFilters] = useState({ levelId: "", streamId: "", subjectId: "" });
  const [studentProfileLoaded, setStudentProfileLoaded] = useState(user?.role !== "STUDENT");
  const [weekStart, setWeekStart] = useState(startOfWeekISO());
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [mySessions, setMySessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingSession, setEditingSession] = useState<SessionItem | null>(null);

  const selectedLevel = levels.find((l) => l.id === filters.levelId);

  useEffect(() => {
    if (!canSeeMine) return;
    api
      .get<SessionItem[]>("/sessions/mine")
      .then((res) => setMySessions(res.data))
      .catch((err) => setError(getApiErrorMessage(err)));
  }, [canSeeMine]);

  useEffect(() => {
    if (tab !== "general") return;
    if (user?.role === "STUDENT" && !studentProfileLoaded) return;

    setLoading(true);
    setError(null);

    const params: Record<string, string> = { weekStart };
    if (filters.levelId) params.levelId = filters.levelId;
    if (filters.streamId) params.streamId = filters.streamId;
    if (filters.subjectId) params.subjectId = filters.subjectId;

    api
      .get("/schedule/weekly", { params })
      .then((res) => setSessions(res.data.sessions))
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [weekStart, filters, tab, user?.role, studentProfileLoaded]);

  useEffect(() => {
    if (user?.role !== "STUDENT") return;
    setStudentProfileLoaded(false);
    api
      .get<{ student?: { levelId: string | null; streamId: string | null } | null }>("/auth/me")
      .then(({ data }) => {
        const student = data.student;
        setFilters((current) => ({
          ...current,
          levelId: student?.levelId ?? "",
          streamId: student?.streamId ?? "",
        }));
      })
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setStudentProfileLoaded(true));
  }, [user?.role]);

  useEffect(() => {
    // حسابات الإدارة تحتاج إلى لائحة المستويات في "استعمال الزمن العام".
    // لا نغير منطق حساب الأستاذ أو التلميذ.
    if (user?.role === "STUDENT") return;
    if (tab !== "general") return;

    api
      .get<Level[]>("/meta/levels")
      .then((res) => setLevels(res.data))
      .catch((err) => setError(getApiErrorMessage(err)));
  }, [user?.role, tab]);

  const weekDays = useMemo(() => {
    const start = getLocalDate(weekStart);
    return Array.from({ length: DAY_COUNT }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return toISODate(d);
    });
  }, [weekStart]);

  function shiftWeek(deltaDays: number) {
    const d = getLocalDate(weekStart);
    d.setDate(d.getDate() + deltaDays);
    setWeekStart(toISODate(d));
    setError(null);
  }

  const activeList = tab === "mine" ? mySessions : sessions;

  const sessionsByDay = weekDays.map((day) => ({
    day,
    items: activeList
      .filter((s) => s.date.slice(0, 10) === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime)),
  }));

  // في وضع «حصصي» نعرض فقط الأيام التي تحتوي على حصص فعلية.
  const myDays = sessionsByDay.filter(({ items }) => items.length > 0);

  function loadMine() {
    if (!canSeeMine) return;
    setError(null);
    api
      .get<SessionItem[]>("/sessions/mine")
      .then((res) => setMySessions(res.data))
      .catch((err) => setError(getApiErrorMessage(err)));
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <CalendarDays size={22} className="text-brand-600" />
          استعمال الزمن
        </h1>

        {canSeeMine && (
          <div className="inline-flex rounded-xl bg-slate-100 p-1">
            <button
              onClick={() => setTab("general")}
              className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                tab === "general"
                  ? "bg-white shadow-sm font-medium text-slate-800"
                  : "text-slate-500"
              }`}
            >
              استعمال الزمن العام
            </button>
            <button
              onClick={() => {
                setTab("mine");
                setError(null);
              }}
              className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                tab === "mine"
                  ? "bg-brand-600 text-white shadow-sm font-semibold"
                  : "text-slate-500"
              }`}
            >
              {user?.role === "TEACHER" ? "حصصي" : "دروسي"}
            </button>
          </div>
        )}
      </div>

      {tab === "general" && user?.role !== "STUDENT" && (
        <div className="card flex flex-wrap items-center gap-3">
          <Filter size={16} className="text-slate-400" />
          <select
            className="input-field !w-auto"
            value={filters.levelId}
            onChange={(e) =>
              setFilters({ levelId: e.target.value, streamId: "", subjectId: "" })
            }
          >
            <option value="">كل المستويات</option>
            {levels.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>

          {selectedLevel?.hasStreams && (
            <select
              className="input-field !w-auto"
              value={filters.streamId}
              onChange={(e) => setFilters((f) => ({ ...f, streamId: e.target.value }))}
            >
              <option value="">كل الشعب</option>
              {selectedLevel.streams.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          )}

          {selectedLevel && (
            <select
              className="input-field !w-auto"
              value={filters.subjectId}
              onChange={(e) => setFilters((f) => ({ ...f, subjectId: e.target.value }))}
            >
              <option value="">كل المواد</option>
              {selectedLevel.subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <button onClick={() => shiftWeek(-7)} className="btn-secondary">
          <ChevronRight size={16} />
          الأسبوع السابق
        </button>

        <p className="text-sm font-medium text-slate-600 text-center">
          من {formatDateShort(weekDays[0])} إلى {formatDateShort(weekDays[6])}
        </p>

        <button onClick={() => shiftWeek(7)} className="btn-secondary">
          الأسبوع التالي
          <ChevronLeft size={16} />
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {tab === "general" && user?.role === "STUDENT" && !studentProfileLoaded && (
        <p className="text-sm text-slate-400">جارٍ تحميل استعمال الزمن...</p>
      )}
      {loading && tab === "general" && (
        <p className="text-sm text-slate-400">جارٍ تحميل استعمال الزمن...</p>
      )}

      {tab === "mine" ? (
        <div className="space-y-4">
          <div className="rounded-2xl bg-brand-50 border border-brand-100 px-5 py-4">
            <p className="font-bold text-brand-900">
              {user?.role === "TEACHER" ? "حصصي خلال هذا الأسبوع" : "دروسي خلال هذا الأسبوع"}
            </p>
            <p className="text-sm text-brand-700 mt-1">
              تظهر هنا حصصك فقط، مجمعة حسب الأيام.
            </p>
          </div>

          {myDays.length === 0 && (
            <div className="card text-center py-10">
              <CalendarDays size={34} className="mx-auto text-slate-300 mb-3" />
              <p className="font-medium text-slate-600">
                {user?.role === "TEACHER"
                  ? "لا توجد لديك حصص مبرمجة خلال هذا الأسبوع."
                  : "لا توجد لديك دروس خلال هذا الأسبوع."}
              </p>
              <p className="text-sm text-slate-400 mt-1">
                يمكنك استعمال أزرار الأسبوع السابق والتالي للتنقل بين الأسابيع.
              </p>
            </div>
          )}

          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {myDays.map(({ day, items }) => (
              <div
                key={day}
                className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 shadow-sm"
              >
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-blue-200">
                  <div>
                    <p className="font-bold text-blue-900">{dayNameOf(day)}</p>
                    <p className="text-xs text-blue-600 mt-0.5">{formatDateShort(day)}</p>
                  </div>
                  <span className="rounded-full bg-blue-600 text-white px-2.5 py-1 text-xs font-bold">
                    {items.length} {items.length === 1 ? "حصة" : "حصص"}
                  </span>
                </div>

                <div className="space-y-3">
                  {items.map((s) => (
                    <div
                      key={s.id}
                      className="rounded-xl bg-white border border-blue-100 p-3 shadow-sm"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-sm font-bold text-blue-700">
                          {s.startTime}–{s.endTime}
                        </span>
                        <span className={`badge ${STATUS_CLASSES[s.status]} !py-0.5 !px-2 text-[10px]`}>
                          {STATUS_LABELS[s.status]}
                        </span>
                      </div>

                      <p className="text-sm font-bold text-slate-800">{s.title}</p>
                      <p className="text-xs text-slate-600 mt-1">
                        {s.subject.name} • {s.level.name}
                        {s.stream ? ` • ${s.stream.name}` : ""}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {formatDurationLabel(s.durationMin)}
                      </p>

                      <div className="flex items-center gap-3 mt-3">
                        {s.meetingLink && (
                          <a
                            href={s.meetingLink}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-blue-700 font-bold hover:underline"
                          >
                            <Video size={14} />
                            الدخول إلى القسم
                          </a>
                        )}

                        {user?.role === "TEACHER" && (
                          <button
                            onClick={() => setEditingSession(s)}
                            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                          >
                            <Pencil size={12} />
                            تغيير الرابط
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
          {sessionsByDay.map(({ day, items }) => (
            <div key={day} className="card">
              <div className="flex items-center justify-between mb-3">
                <p className="font-bold text-sm">{dayNameOf(day)}</p>
                <p className="text-xs text-slate-400">{formatDateShort(day)}</p>
              </div>

              {items.length === 0 && (
                <p className="text-xs text-slate-400">لا توجد حصص</p>
              )}

              <div className="space-y-2">
                {items.map((s) => (
                  <div key={s.id} className="rounded-xl border border-slate-100 p-2.5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-brand-700">
                        {s.startTime}–{s.endTime}
                      </span>
                      <span className={`badge ${STATUS_CLASSES[s.status]} !py-0.5 !px-2 text-[10px]`}>
                        {STATUS_LABELS[s.status]}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-slate-800">{s.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {s.subject.name} • {s.level.name}
                      {s.stream ? ` • ${s.stream.name}` : ""}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {s.teacher.fullName} • {formatDurationLabel(s.durationMin)}
                    </p>
                    {s.meetingLink && (
                      <div className="mt-2">
                        <a
                          href={s.meetingLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-brand-700 font-medium hover:underline"
                        >
                          <Video size={13} />
                          الدخول إلى القسم
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {editingSession && (
        <MeetingLinkModal
          session={editingSession}
          onClose={() => setEditingSession(null)}
          onSaved={() => {
            setEditingSession(null);
            loadMine();
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
  onSaved: () => void;
}) {
  const [link, setLink] = useState(session.meetingLink ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      await api.patch(`/sessions/${session.id}/meeting-link`, { meetingLink: link });
      onSaved();
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
        >
          <X size={18} />
        </button>

        <h3 className="font-bold text-lg mb-1">رابط القسم الافتراضي</h3>
        <p className="text-sm text-slate-500 mb-4">{session.title}</p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="label-field">الرابط</label>
            <input
              type="url"
              className="input-field"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://meet.jit.si/... أو رابط Teams/Meet"
              required
            />
            <p className="text-xs text-slate-400 mt-1">
              تم توليد رابط Jitsi تلقائيًا عند إنشاء الحصة. يمكنك استبداله برابط آخر
              (Teams، Google Meet...) إذا رغبت.
            </p>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">
              {error}
            </div>
          )}

          <button type="submit" disabled={saving} className="btn-primary w-full">
            {saving ? "جارٍ الحفظ..." : "حفظ الرابط"}
          </button>
        </form>
      </div>
    </div>
  );
}
