import { useEffect, useState } from "react";
import { UserCog, CheckCircle2 } from "lucide-react";
import { api, getApiErrorMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { Level, Province } from "../types";

interface MeResponse {
  student?: {
    levelId: string | null;
    streamId: string | null;
    provinceId: string | null;
    school: { name: string } | null;
  } | null;
  teacher?: {
    levelId: string | null;
    streamId: string | null;
    provinceId: string | null;
    school: { name: string } | null;
  } | null;
}

export default function AccountSettings() {
  const { user } = useAuth();
  const [levels, setLevels] = useState<Level[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [provinceId, setProvinceId] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [levelId, setLevelId] = useState("");
  const [streamId, setStreamId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selectedLevel = levels.find((l) => l.id === levelId);
  const isStudent = user?.role === "STUDENT";
  const isTeacher = user?.role === "TEACHER";

  useEffect(() => {
    let active = true;

    Promise.all([
      api.get<Level[]>("/meta/levels"),
      api.get<Province[]>("/meta/provinces"),
      api.get<MeResponse>("/auth/me"),
    ])
      .then(([levelsRes, provincesRes, meRes]) => {
        if (!active) return;
        setLevels(levelsRes.data);
        setProvinces(provincesRes.data);

        const current = isStudent ? meRes.data.student : meRes.data.teacher;
        if (!current) return;

        setProvinceId(current.provinceId ?? "");
        setSchoolName(current.school?.name ?? "");
        setLevelId(current.levelId ?? "");
        setStreamId(current.streamId ?? "");
      })
      .catch((err) => {
        if (active) setError(getApiErrorMessage(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isStudent]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const cleanProvinceId = provinceId.trim();
    const cleanSchoolName = schoolName.trim();
    const cleanLevelId = levelId.trim();
    const cleanStreamId = streamId.trim();

    if (!cleanProvinceId) {
      setError("المديرية الإقليمية مطلوبة.");
      return;
    }
    if (!cleanSchoolName) {
      setError("المؤسسة التعليمية مطلوبة.");
      return;
    }
    if (!cleanLevelId) {
      setError("المستوى مطلوب.");
      return;
    }
    if (selectedLevel?.hasStreams && !cleanStreamId) {
      setError("الشعبة مطلوبة.");
      return;
    }

    setSaving(true);
    try {
      const endpoint = isStudent ? "/profile/student" : "/profile/teacher";
      await api.patch(endpoint, {
        provinceId: cleanProvinceId,
        schoolName: cleanSchoolName,
        levelId: cleanLevelId,
        streamId: selectedLevel?.hasStreams ? cleanStreamId : null,
      });
      setSuccess("تم حفظ معلومات الحساب بنجاح.");
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-400">جارٍ التحميل...</p>;
  }

  return (
    <div className="max-w-lg space-y-4">
      <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
        <UserCog size={22} className="text-brand-600" />
        إعدادات الحساب
      </h1>

      <div className="card">
        <p className="text-sm text-slate-500 mb-4">
          يرجى استكمال جميع المعلومات. المديرية والمؤسسة والمستوى والشعبة (عند الاقتضاء) معلومات إجبارية.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label-field">المديرية الإقليمية</label>
            {isTeacher ? (
              <input
                className="input-field bg-slate-50"
                value={provinces.find((p) => p.id === provinceId)?.name ?? ""}
                readOnly
                disabled
              />
            ) : (
              <select
                className="input-field"
                value={provinceId}
                onChange={(e) => setProvinceId(e.target.value)}
                required
              >
                <option value="">اختر المديرية...</option>
                {provinces.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="label-field">المؤسسة التعليمية</label>
            <input
              className="input-field"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              placeholder="أدخل اسم المؤسسة التعليمية"
              required
            />
          </div>

          <div>
            <label className="label-field">المستوى</label>
            <select
              className="input-field"
              value={levelId}
              onChange={(e) => {
                setLevelId(e.target.value);
                setStreamId("");
              }}
              required
            >
              <option value="">اختر المستوى...</option>
              {levels.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>

          {selectedLevel?.hasStreams && (
            <div>
              <label className="label-field">الشعبة</label>
              <select
                className="input-field"
                value={streamId}
                onChange={(e) => setStreamId(e.target.value)}
                required
              >
                <option value="">اختر الشعبة...</option>
                {selectedLevel.streams.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
              <CheckCircle2 size={16} />
              {success}
            </div>
          )}

          <button type="submit" disabled={saving} className="btn-primary w-full">
            {saving ? "جارٍ الحفظ..." : "حفظ المعلومات"}
          </button>
        </form>
      </div>
    </div>
  );
}
