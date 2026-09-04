import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { api, getApiErrorMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { username, password });
      login(data.token, data.user);
      navigate("/");
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-brand-900 via-brand-700 to-brand-500 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6 text-white">
          <div className="flex justify-center mb-4">
            <img
              src="/logo.jpeg"
              alt="شعار المملكة المغربية ووزارة التربية الوطنية"
              className="w-32 h-32 object-contain rounded-2xl bg-white shadow-lg p-2"
            />
          </div>
          <h1 className="text-xl font-bold">منصة الدعم التربوي عن بعد</h1>
          <div className="text-sm text-white/80 mt-2 space-y-0.5">
            <p>الأكاديمية الجهوية للتربية والتكوين مراكش آسفي</p>
            <p>مصلحة التعلم والتكوين عن بعد</p>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-bold mb-4">تسجيل الدخول</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label-field">اسم المستخدم (رقم التأجير / رمز مسار)</label>
              <input
                className="input-field"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="مثال: T12345"
                required
              />
            </div>
            <div>
              <label className="label-field">كلمة المرور</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="input-field pl-11"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-600"
                  aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                  title={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                >
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
            </div>

            <div className="text-left -mt-2">
              <Link to="/forgot-password" className="text-sm text-brand-600 font-medium hover:underline">
                نسيت كلمة المرور؟
              </Link>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              <LogIn size={18} />
              {loading ? "جارٍ التحقق..." : "دخول"}
            </button>
          </form>

          <div className="mt-5 text-center text-sm text-slate-500 space-y-1">
            <p>
              ليس لديك حساب؟{" "}
              <Link to="/register/teacher" className="text-brand-600 font-medium">
                إنشاء حساب أستاذ/ة
              </Link>{" "}
              أو{" "}
              <Link to="/register/student" className="text-brand-600 font-medium">
                إنشاء حساب تلميذ/ة
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-white/60 text-xs mt-4">
          حسابات تجريبية: admin / chef.service / coord.marrakech / T12345 / M2026001 — كلمة المرور: Passw0rd!
        </p>
      </div>
    </div>
  );
}
