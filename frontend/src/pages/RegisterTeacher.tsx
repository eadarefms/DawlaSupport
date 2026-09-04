import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserPlus } from "lucide-react";
import { api, getApiErrorMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { Province } from "../types";

export default function RegisterTeacher() {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [form, setForm] = useState({
    fullName: "",
    matricule: "",
    email: "",
    password: "",
    provinceId: "",
    otherProvince: "",
    schoolName: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get<Province[]>("/meta/provinces").then((res) => setProvinces(res.data));
  }, []);

  const selectedProvince = provinces.find((p) => p.id === form.provinceId);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data } = await api.post("/auth/register/teacher", form);
      login(data.token, data.user);
      navigate("/");
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-lg card">
        <div className="flex justify-center mb-4">
          <img
            src="/logo.jpeg"
            alt="شعار المملكة المغربية ووزارة التربية الوطنية"
            className="w-28 h-28 object-contain rounded-2xl border border-slate-100 bg-white p-1"
          />
        </div>
        <div className="text-center mb-5">
          <p className="text-sm text-slate-700 font-medium">الأكاديمية الجهوية للتربية والتكوين مراكش آسفي</p>
          <p className="text-xs text-slate-500 mt-1">مصلحة التعلم والتكوين عن بعد</p>
        </div>
        <h2 className="text-lg font-bold mb-1">إنشاء حساب أستاذ/ة</h2>
        <p className="text-sm text-slate-500 mb-5">رقم التأجير هو اسم المستخدم الخاص بك في المنصة</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label-field">الاسم الكامل</label>
            <input
              className="input-field"
              value={form.fullName}
              onChange={(e) => update("fullName", e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-field">رقم التأجير</label>
              <input
                className="input-field"
                value={form.matricule}
                onChange={(e) => update("matricule", e.target.value)}
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
          </div>

          <div>
            <label className="label-field">المديرية الإقليمية</label>
            <select
              className="input-field"
              value={form.provinceId}
              onChange={(e) => update("provinceId", e.target.value)}
              required
            >
              <option value="">اختر المديرية...</option>
              {provinces.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label-field">المؤسسة التعليمية</label>
            <input
              className="input-field"
              value={form.schoolName}
              onChange={(e) => update("schoolName", e.target.value)}
              placeholder="أدخل اسم المؤسسة التعليمية"
              required
            />
          </div>

          {selectedProvince?.isOther && (
            <div>
              <label className="label-field">اسم المديرية</label>
              <input
                className="input-field"
                value={form.otherProvince}
                onChange={(e) => update("otherProvince", e.target.value)}
                required
              />
            </div>
          )}

          <div>
            <label className="label-field">كلمة المرور</label>
            <input
              type="password"
              className="input-field"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              minLength={6}
              required
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            <UserPlus size={18} />
            {loading ? "جارٍ الإنشاء..." : "إنشاء الحساب"}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-4">
          لديك حساب بالفعل؟{" "}
          <Link to="/login" className="text-brand-600 font-medium">
            تسجيل الدخول
          </Link>
        </p>
      </div>
    </div>
  );
}
