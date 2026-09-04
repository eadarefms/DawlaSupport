import { useEffect, useState } from "react";
import { BookOpen, CheckCircle2, X, AlertTriangle } from "lucide-react";
import { api, getApiErrorMessage } from "../api/client";
import { AvailableLesson } from "../types";
import { STATUS_CLASSES, STATUS_LABELS, formatDurationLabel, formatDateShort } from "../utils/sessionStatus";
import { useAuth } from "../context/AuthContext";

export default function AvailableLessons() {
  const { user } = useAuth();
  const [lessons, setLessons] = useState<AvailableLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeLesson, setActiveLesson] = useState<AvailableLesson | null>(null);

  function load() {
    setLoading(true);
    setLoadError(null);
    api
      .get<AvailableLesson[]>("/lessons/available")
      .then((res) => setLessons(res.data))
      .catch((err) => setLoadError(getApiErrorMessage(err)))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <BookOpen size={22} className="text-brand-600" />
          الدروس المتاحة
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          الدروس المعروضة مطابقة لمستواك{user?.role === "STUDENT" ? " وشعبتك" : ""} المسجلين في حسابك.
        </p>
      </div>

      {loading && <p className="text-sm text-slate-400">جارٍ التحميل...</p>}
      {loadError && (
        <div className="flex items-center justify-between gap-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
          <span>{loadError}</span>
        </div>
      )}
      {!loading && !loadError && lessons.length === 0 && (
        <p className="text-sm text-slate-400">لا توجد دروس متاحة حاليًا.</p>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {lessons.map((lesson) => (
          <div key={lesson.id} className="card">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-bold text-slate-800">{lesson.title}</p>
                <p className="text-sm text-slate-500 mt-0.5">
                  {lesson.subject.name} • {lesson.level.name}
                  {lesson.stream ? ` • ${lesson.stream.name}` : ""}
                </p>
              </div>
              <span className={`badge ${STATUS_CLASSES[lesson.status]}`}>{STATUS_LABELS[lesson.status]}</span>
            </div>

            <p className="text-sm text-slate-600">
              الأستاذ: <span className="font-medium">{lesson.teacher.fullName}</span>
            </p>
            <p className="text-sm text-slate-600">
              {formatDateShort(lesson.date)} • {lesson.startTime}–{lesson.endTime} ({formatDurationLabel(lesson.durationMin)})
            </p>

            <div className="mt-4">
              {lesson.isEnrolled ? (
                <span className="inline-flex items-center gap-1.5 text-emerald-700 text-sm font-medium">
                  <CheckCircle2 size={16} />
                  أنت مسجَّل في هذه الحصة
                </span>
              ) : (
                <button className="btn-primary w-full" onClick={() => setActiveLesson(lesson)}>
                  اختيار هذا الدرس
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {activeLesson && (
        <EnrollModal
          lesson={activeLesson}
          onClose={() => setActiveLesson(null)}
          onSuccess={() => {
            setActiveLesson(null);
            load();
          }}
        />
      )}
    </div>
  );
}

interface MeResponse {
  student?: {
    fullName?: string | null;
    code?: string | null;
    email?: string | null;
    provinceId: string | null;
    school: { name: string } | null;
    province?: { id: string; name: string } | null;
  } | null;
}

interface ProvinceOption {
  id: string;
  name: string;
}

function EnrollModal({
  lesson,
  onClose,
  onSuccess,
}: {
  lesson: AvailableLesson;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [provinces, setProvinces] = useState<ProvinceOption[]>([]);
  const [form, setForm] = useState({ fullName: "", code: "", email: "", province: "", school: "" });
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([api.get<ProvinceOption[]>("/meta/provinces"), api.get<MeResponse>("/auth/me")])
      .then(([provincesRes, meRes]) => {
        const available = provincesRes.data;
        setProvinces(available);
        const student = meRes.data.student;
        if (student) {
          const provinceName =
            student.province?.name ??
            available.find((p) => p.id === student.provinceId)?.name ??
            "";
          setForm((current) => ({
            ...current,
            fullName: student.fullName ?? current.fullName,
            code: student.code ?? current.code,
            email: student.email ?? current.email,
            province: provinceName,
            school: student.school?.name ?? current.school,
          }));
        }
      })
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setLoadingProfile(false));
  }, []);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.province) {
      setError("المديرية الإقليمية مطلوبة.");
      return;
    }
    if (!form.school.trim()) {
      setError("المؤسسة التعليمية مطلوبة.");
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/sessions/${lesson.id}/enroll`, {
        ...form,
        province: form.province.trim(),
        school: form.school.trim(),
      });
      onSuccess();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-md relative">
        <button onClick={onClose} className="absolute top-4 left-4 text-slate-400 hover:text-slate-600">
          <X size={18} />
        </button>
        <h3 className="font-bold text-lg mb-1">تأكيد التسجيل</h3>
        <p className="text-sm text-slate-500 mb-4">{lesson.title}</p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="label-field">الاسم الكامل</label>
            <input
              className="input-field"
              value={form.fullName}
              onChange={(e) => update("fullName", e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label-field">رمز مسار</label>
            <input
              className="input-field"
              value={form.code}
              onChange={(e) => update("code", e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label-field">البريد الإلكتروني</label>
            <input
              type="email"
              className="input-field"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-field">المديرية الإقليمية <span className="text-red-500">*</span></label>
              <select
                className="input-field"
                value={form.province}
                onChange={(e) => update("province", e.target.value)}
                required
                disabled={loadingProfile}
              >
                <option value="">{loadingProfile ? "جارٍ تحميل المديريات..." : "اختر المديرية..."}</option>
                {provinces.map((p) => (
                  <option key={p.id} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-field">المؤسسة التعليمية <span className="text-red-500">*</span></label>
              <input
                className="input-field"
                value={form.school}
                onChange={(e) => update("school", e.target.value)}
                placeholder="أدخل اسم المؤسسة التعليمية"
                required
              />
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          <button type="submit" disabled={submitting || loadingProfile} className="btn-primary w-full">
            {submitting ? "جارٍ التسجيل..." : "تأكيد التسجيل"}
          </button>
        </form>
      </div>
    </div>
  );
}
