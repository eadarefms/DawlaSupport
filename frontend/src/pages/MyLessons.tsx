import { useEffect, useState } from "react";
import { BookOpen } from "lucide-react";
import { api } from "../api/client";
import { SessionItem } from "../types";
import { STATUS_CLASSES, STATUS_LABELS, formatDurationLabel, formatDateShort } from "../utils/sessionStatus";

export default function MyLessons() {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<SessionItem[]>("/sessions/mine")
      .then((res) => setSessions(res.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
        <BookOpen size={22} className="text-brand-600" />
        دروسي
      </h1>

      {loading && <p className="text-sm text-slate-400">جارٍ التحميل...</p>}
      {!loading && sessions.length === 0 && (
        <p className="text-sm text-slate-400">لم تسجَّل بعد في أي درس. توجّه إلى "الدروس المتاحة" للتسجيل.</p>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {sessions.map((s) => (
          <div key={s.id} className="card">
            <div className="flex items-start justify-between mb-2">
              <p className="font-bold text-slate-800">{s.title}</p>
              <span className={`badge ${STATUS_CLASSES[s.status]}`}>{STATUS_LABELS[s.status]}</span>
            </div>
            <p className="text-sm text-slate-500">
              {s.subject.name} • {s.level.name}
              {s.stream ? ` • ${s.stream.name}` : ""}
            </p>
            <p className="text-sm text-slate-600 mt-1">الأستاذ: {s.teacher.fullName}</p>
            <p className="text-sm text-slate-600">
              {formatDateShort(s.date)} • {s.startTime}–{s.endTime} ({formatDurationLabel(s.durationMin)})
            </p>
            {s.meetingLink && (
              <a
                href={s.meetingLink}
                target="_blank"
                rel="noreferrer"
                className="btn-primary w-full mt-3 inline-flex"
              >
                الدخول إلى القسم الافتراضي
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
