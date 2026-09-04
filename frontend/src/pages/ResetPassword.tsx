import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { api, getApiErrorMessage } from "../api/client";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(token ? null : "رابط الاسترجاع غير صالح");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(null);
    if (password !== confirm) { setError("كلمتا المرور غير متطابقتين"); return; }
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, password });
      navigate("/login", { replace: true, state: { resetSuccess: "تم تغيير كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول." } });
    } catch (err) { setError(getApiErrorMessage(err)); } finally { setLoading(false); }
  }

  const EyeButton = ({ show, onClick, label }: { show: boolean; onClick: () => void; label: string }) => (
    <button type="button" onClick={onClick} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-600" aria-label={label}>{show ? <EyeOff size={19} /> : <Eye size={19} />}</button>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-brand-900 via-brand-700 to-brand-500 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6 text-white"><img src="/logo.jpeg" alt="الشعار" className="w-24 h-24 object-contain rounded-2xl bg-white shadow-lg p-2 mx-auto mb-4" /><h1 className="text-xl font-bold">تعيين كلمة مرور جديدة</h1></div>
        <div className="card">
          <div className="flex items-center gap-2 mb-4"><KeyRound size={20} className="text-brand-600" /><h2 className="text-lg font-bold">كلمة المرور الجديدة</h2></div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="label-field">كلمة المرور</label><div className="relative"><input type={showPassword ? "text" : "password"} className="input-field pl-11" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required autoFocus /><EyeButton show={showPassword} onClick={() => setShowPassword(v => !v)} label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"} /></div></div>
            <div><label className="label-field">تأكيد كلمة المرور</label><div className="relative"><input type={showConfirm ? "text" : "password"} className="input-field pl-11" value={confirm} onChange={(e) => setConfirm(e.target.value)} minLength={6} required /><EyeButton show={showConfirm} onClick={() => setShowConfirm(v => !v)} label={showConfirm ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"} /></div></div>
            {error && <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</div>}
            <button type="submit" disabled={loading || !token} className="btn-primary w-full">{loading ? "جارٍ الحفظ..." : "حفظ كلمة المرور الجديدة"}</button>
          </form>
          <Link to="/login" className="mt-5 inline-block text-sm text-brand-600 font-medium hover:underline">العودة إلى تسجيل الدخول</Link>
        </div>
      </div>
    </div>
  );
}
