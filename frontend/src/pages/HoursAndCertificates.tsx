import { useEffect, useState } from "react";
import { Clock, Award } from "lucide-react";
import { api } from "../api/client";

interface HoursSummary {
  totalMinutes: number;
  certificatesEarned: number;
  minutesTowardNext: number;
  thresholdMinutes: number;
  certificates: { id: string; certificateNumber: number; issuedAt: string }[];
}

export default function HoursAndCertificates() {
  const [summary, setSummary] = useState<HoursSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get<HoursSummary>("/hours/mine")
      .then((res) => setSummary(res.data))
      .catch(() => setError("تعذر تحميل بيانات الساعات والشهادات. يرجى المحاولة مرة أخرى."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-slate-400">جارٍ التحميل...</p>;
  if (error) return <div className="card text-sm text-red-600">{error}</div>;
  if (!summary) return <div className="card text-sm text-slate-500">لا توجد بيانات متاحة حاليًا.</div>;

  const totalHours = Math.round((summary.totalMinutes / 60) * 10) / 10;
  const progressPercent = summary.thresholdMinutes > 0 ? Math.min(100, Math.round((summary.minutesTowardNext / summary.thresholdMinutes) * 100)) : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
        <Clock size={22} className="text-brand-600" />
        الساعات والشهادات
      </h1>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card">
          <p className="text-sm text-slate-500 mb-1">مجموع ساعات المشاركة</p>
          <p className="text-3xl font-bold text-slate-800">{totalHours} ساعة</p>
        </div>
        <div className="card">
          <p className="text-sm text-slate-500 mb-1">الشهادات المستحقة</p>
          <p className="text-3xl font-bold text-slate-800">{summary.certificatesEarned}</p>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-bold">التقدم نحو الشهادة القادمة</h2>
          <span className="text-sm text-slate-500">
            {Math.round((summary.minutesTowardNext / 60) * 10) / 10} / 10 ساعات
          </span>
        </div>
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-brand-600 rounded-full transition-all" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      <div className="card">
        <h2 className="font-bold mb-3 flex items-center gap-2">
          <Award size={18} className="text-gold-600" />
          الشهادات التقديرية
        </h2>
        {summary.certificates.length === 0 && (
          <p className="text-sm text-slate-400">لم تستوف بعد عدد الساعات التي تخول لك الحصول على شهادة (10 ساعات).</p>
        )}
        <div className="space-y-2">
          {summary.certificates.map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2.5">
              <span className="text-sm font-medium">الشهادة التقديرية رقم {c.certificateNumber}</span>
              <span className="text-xs text-slate-400">{new Date(c.issuedAt).toLocaleDateString("ar-MA")}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
