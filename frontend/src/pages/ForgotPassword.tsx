import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, KeyRound } from "lucide-react";
import { api, getApiErrorMessage } from "../api/client";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(null); setMessage(null); setLoading(true);
    try {
      const { data } = await api.post("/auth/forgot-password", { email: email.trim() });
      setMessage(data.message);
    } catch (err) { setError(getApiErrorMessage(err)); } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-brand-900 via-brand-700 to-brand-500 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6 text-white">
          <img src="/logo.jpeg" alt="الشعار" className="w-24 h-24 object-contain rounded-2xl bg-white shadow-lg p-2 mx-auto mb-4" />
          <h1 className="text-xl font-bold">استرجاع كلمة المرور</h1>
          <p className="text-sm text-white/80 mt-2">أدخل البريد الإلكتروني المرتبط بحسابك</p>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 mb-4"><KeyRound size={20} className="text-brand-600" /><h2 className="text-lg font-bold">نسيت كلمة المرور؟</h2></div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="label-field">البريد الإلكتروني</label><input type="email" className="input-field" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" required autoFocus /></div>
            {message && <div className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-xl px-3 py-2">{message}</div>}
            {error && <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</div>}
            <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? "جارٍ الإرسال..." : "إرسال رابط الاسترجاع"}</button>
          </form>
          <Link to="/login" className="mt-5 inline-flex items-center gap-2 text-sm text-brand-600 font-medium hover:underline"><ArrowRight size={16} /> العودة إلى تسجيل الدخول</Link>
        </div>
      </div>
    </div>
  );
}
