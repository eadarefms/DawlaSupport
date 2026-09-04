import { useEffect, useMemo, useState } from "react";
import { CalendarClock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { api, getApiErrorMessage } from "../api/client";
import { Level, SessionItem } from "../types";
import { minAllowedDateISO, computeDurationMinutesClient, formatDurationClient } from "../utils/dateRules";
import { STATUS_CLASSES, STATUS_LABELS, formatDurationLabel } from "../utils/sessionStatus";

export default function ProposeSession() {
  const [levels, setLevels] = useState<Level[]>([]);
  const [form, setForm] = useState({
    levelId: "",
    streamId: "",
    subjectId: "",
    title: "",
    date: "",
    startTime: "",
    endTime: "",
  });
  const [preview, setPreview] = useState<SessionItem[] | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const minDate = useMemo(() => minAllowedDateISO(), []);

  // تحميل المستويات عند فتح الصفحة
  useEffect(() => {
    setError(null);
    api
      .get<Level[]>("/meta/levels")
      .then((res) => {
        setLevels(Array.isArray(res.data) ? res.data : []);
      })
      .catch((err) => {
        setLevels([]);
        setError(getApiErrorMessage(err));
      });
  }, []);

  const selectedLevel = levels.find((l) => l.id === form.levelId);
  const duration = computeDurationMinutesClient(form.startTime, form.endTime);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({
      ...f,
      [key]: value,
      ...(key === "levelId" ? { streamId: "", subjectId: "" } : {}),
    }));
    setSuccess(null);
  }

  // معاينة استعمال الزمن الحالي للمستوى/الشعبة المختارين، لمساعدة الأستاذ على تفادي التعارض
  useEffect(() => {
    if (!form.levelId) {
      setPreview(null);
      return;
    }
    setPreviewLoading(true);
    const params: Record<string, string> = { levelId: form.levelId };
    if (form.streamId) params.streamId = form.streamId;
    if (form.date) params.weekStart = form.date;

    api
      .get("/schedule/weekly", { params })
      .then((res) => setPreview(res.data.sessions))
      .catch(() => setPreview(null))
      .finally(() => setPreviewLoading(false));
  }, [form.levelId, form.streamId, form.date]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      await api.post("/sessions", {
        levelId: form.levelId,
        streamId: form.streamId || null,
        subjectId: form.subjectId,
        title: form.title,
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
      });
      setSuccess(
        "تم إرسال اقتراح الحصة بنجاح، وهي الآن قيد المراجعة. تم توليد رابط قسم افتراضي تلقائيًا (Jitsi)، ويمكنك استبداله لاحقًا من استعمال الزمن → حصصي."
      );
      setForm((f) => ({ ...f, title: "", startTime: "", endTime: "" }));
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="card">
        <h2 className="font-bold text-lg mb-1 flex items-center gap-2">
          <CalendarClock size={20} className="text-brand-600" />
          المشاركة في تقديم حصة دعم
        </h2>
        <p className="text-sm text-slate-500 mb-5">
          التواريخ المتاحة تبدأ من {minDate} (الأسبوع المقبل). يقوم النظام تلقائيًا بمنع أي تعارض في التوقيت.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-field">المستوى الإشهادي</label>
              <select
                className="input-field"
                value={form.levelId}
                onChange={(e) => update("levelId", e.target.value)}
                required
              >
                <option value="">اختر المستوى...</option>
                {levels.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedLevel?.hasStreams && (
              <div>
                <label className="label-field">الشعبة</label>
                <select
                  className="input-field"
                  value={form.streamId}
                  onChange={(e) => update("streamId", e.target.value)}
                    required
                >
                  <option value="">اختر الشعبة...</option>
                  {selectedLevel.streams.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="label-field">المادة</label>
            <select
              className="input-field"
              value={form.subjectId}
              onChange={(e) => update("subjectId", e.target.value)}
              disabled={!selectedLevel}
              required
            >
              <option value="">اختر المادة...</option>
              {selectedLevel?.subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label-field">عنوان/موضوع الدرس</label>
            <input
              className="input-field"
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              placeholder="مثال: المتتاليات العددية"
              required
            />
          </div>

          <div>
            <label className="label-field">التاريخ</label>
            <input
              type="date"
              className="input-field"
              value={form.date}
              min={minDate}
              onChange={(e) => update("date", e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-field">وقت البداية</label>
              <input
                type="time"
                className="input-field"
                value={form.startTime}
                onChange={(e) => update("startTime", e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label-field">وقت النهاية</label>
              <input
                type="time"
                className="input-field"
                value={form.endTime}
                onChange={(e) => update("endTime", e.target.value)}
                required
              />
            </div>
          </div>

          {duration !== null && (
            <p className="text-sm text-brand-700 bg-brand-50 rounded-xl px-3 py-2">
              مدة الحصة: {formatDurationClient(duration)}
            </p>
          )}

          {error && (
            <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}
          {success && (
            <div className="flex items-start gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
              <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
              {success}
            </div>
          )}

          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? "جارٍ الإرسال..." : "تأكيد اقتراح الحصة"}
          </button>
        </form>
      </div>

      <div className="card">
        <h3 className="font-bold mb-1">استعمال الزمن الحالي</h3>
        <p className="text-sm text-slate-500 mb-4">
          {selectedLevel
            ? "عاين الحصص المبرمجة لهذا المستوى/الشعبة قبل اختيار توقيتك لتفادي التعارض."
            : "اختر مستوى لعرض استعمال الزمن الخاص به."}
        </p>

        {previewLoading && <p className="text-sm text-slate-400">جارٍ التحميل...</p>}

        {!previewLoading && preview && preview.length === 0 && (
          <p className="text-sm text-slate-400">لا توجد حصص مبرمجة في هذا الأسبوع لهذا الاختيار.</p>
        )}

        <div className="space-y-2">
          {preview?.map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2.5">
              <div>
                <p className="text-sm font-medium text-slate-800">{s.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {s.subject.name} • {s.teacher.fullName} • {s.date.slice(0, 10)} • {s.startTime}–{s.endTime} (
                  {formatDurationLabel(s.durationMin)})
                </p>
              </div>
              <span className={`badge ${STATUS_CLASSES[s.status]}`}>{STATUS_LABELS[s.status]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
