import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserPlus } from "lucide-react";
import { api, getApiErrorMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { Level, Province } from "../types";

export default function RegisterStudent() {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [form, setForm] = useState({
    fullName: "", code: "", email: "", password: "",
    provinceId: "", schoolName: "", levelId: "", streamId: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const selectedLevel = levels.find((l) => l.id === form.levelId);

  useEffect(() => {
    Promise.all([api.get<Province[]>("/meta/provinces"), api.get<Level[]>("/meta/levels")])
      .then(([p, l]) => { setProvinces(p.data); setLevels(l.data); })
      .catch((err) => setError(getApiErrorMessage(err)));
  }, []);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(null); setLoading(true);
    try {
      const { data } = await api.post("/auth/register/student", {
        ...form,
        streamId: selectedLevel?.hasStreams ? form.streamId : null,
      });
      login(data.token, data.user); navigate("/");
    } catch (err) { setError(getApiErrorMessage(err)); }
    finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-lg card">
        <h2 className="text-lg font-bold mb-1">إنشاء حساب تلميذ</h2>
        <p className="text-sm text-slate-500 mb-5">جميع المعلومات الدراسية مطلوبة لإتمام التسجيل.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="label-field">الاسم الكامل</label><input className="input-field" value={form.fullName} onChange={(e) => update("fullName", e.target.value)} required /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label-field">رمز مسار</label><input className="input-field" value={form.code} onChange={(e) => update("code", e.target.value)} required /></div>
            <div><label className="label-field">البريد الإلكتروني</label><input type="email" className="input-field" value={form.email} onChange={(e) => update("email", e.target.value)} required /></div>
          </div>
          <div><label className="label-field">المديرية الإقليمية</label><select className="input-field" value={form.provinceId} onChange={(e) => update("provinceId", e.target.value)} required><option value="">اختر المديرية...</option>{provinces.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
          <div><label className="label-field">المؤسسة التعليمية</label><input className="input-field" value={form.schoolName} onChange={(e) => update("schoolName", e.target.value)} placeholder="أدخل اسم المؤسسة التعليمية" required /></div>
          <div><label className="label-field">المستوى</label><select className="input-field" value={form.levelId} onChange={(e) => { update("levelId", e.target.value); update("streamId", ""); }} required><option value="">اختر المستوى...</option>{levels.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</select></div>
          {selectedLevel?.hasStreams && <div><label className="label-field">الشعبة</label><select className="input-field" value={form.streamId} onChange={(e) => update("streamId", e.target.value)} required><option value="">اختر الشعبة...</option>{selectedLevel.streams.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>}
          <div><label className="label-field">كلمة المرور</label><input type="password" className="input-field" value={form.password} onChange={(e) => update("password", e.target.value)} minLength={6} required /></div>
          {error && <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</div>}
          <button type="submit" disabled={loading} className="btn-primary w-full"><UserPlus size={18} />{loading ? "جارٍ الإنشاء..." : "إنشاء الحساب"}</button>
        </form>
        <p className="text-center text-sm text-slate-500 mt-4">لديك حساب بالفعل؟ <Link to="/login" className="text-brand-600 font-medium">تسجيل الدخول</Link></p>
      </div>
    </div>
  );
}
