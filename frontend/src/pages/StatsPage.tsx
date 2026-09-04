import { useEffect, useState } from "react";
import { BarChart3 } from "lucide-react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

interface ProvinceDashboard {
  teachersCount: number;
  studentsCount: number;
  sessionsCount: number;
  totalHours: number;
  distributionByLevel: { levelId: string; levelName: string; count: number }[];
}

interface RegionalDashboard {
  totals: { teachersCount: number; studentsCount: number; sessionsCount: number; totalHours: number };
  byProvince: {
    provinceId: string;
    provinceName: string;
    teachersCount: number;
    studentsCount: number;
    sessionsCount: number;
    totalHours: number;
  }[];
}

export default function StatsPage() {
  const { user } = useAuth();
  const [province, setProvince] = useState<ProvinceDashboard | null>(null);
  const [regional, setRegional] = useState<RegionalDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    if (user.role === "PROVINCIAL_COORDINATOR") {
      api.get<ProvinceDashboard>("/dashboard/province").then((r) => setProvince(r.data)).finally(() => setLoading(false));
    } else {
      api.get<RegionalDashboard>("/dashboard/regional").then((r) => setRegional(r.data)).finally(() => setLoading(false));
    }
  }, [user]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
        <BarChart3 size={22} className="text-brand-600" />
        الإحصائيات
      </h1>

      {loading && <p className="text-sm text-slate-400">جارٍ التحميل...</p>}

      {province && (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="card">
            <h2 className="font-bold mb-3">توزيع الحصص حسب المستوى</h2>
            {province.distributionByLevel.map((d) => {
              const max = Math.max(...province.distributionByLevel.map((x) => x.count), 1);
              return (
                <div key={d.levelId} className="mb-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span>{d.levelName}</span>
                    <span className="font-medium">{d.count}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-600 rounded-full"
                      style={{ width: `${(d.count / max) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="card space-y-2">
            <h2 className="font-bold mb-1">أرقام عامة</h2>
            <Row label="عدد الأساتذة" value={province.teachersCount} />
            <Row label="عدد التلاميذ" value={province.studentsCount} />
            <Row label="عدد الحصص" value={province.sessionsCount} />
            <Row label="مجموع الساعات" value={`${province.totalHours} سا`} />
          </div>
        </div>
      )}

      {regional && (
        <div className="card overflow-x-auto">
          <h2 className="font-bold mb-3">مقارنة المديريات</h2>
          <table className="w-full text-sm text-right">
            <thead>
              <tr className="text-slate-500 border-b border-slate-100">
                <th className="py-2 pl-3 font-medium">المديرية</th>
                <th className="py-2 pl-3 font-medium">الأساتذة</th>
                <th className="py-2 pl-3 font-medium">التلاميذ</th>
                <th className="py-2 pl-3 font-medium">الحصص</th>
                <th className="py-2 font-medium">الساعات</th>
              </tr>
            </thead>
            <tbody>
              {regional.byProvince.map((p) => (
                <tr key={p.provinceId} className="border-b border-slate-50 last:border-0">
                  <td className="py-2.5 pl-3 font-medium">{p.provinceName}</td>
                  <td className="py-2.5 pl-3">{p.teachersCount}</td>
                  <td className="py-2.5 pl-3">{p.studentsCount}</td>
                  <td className="py-2.5 pl-3">{p.sessionsCount}</td>
                  <td className="py-2.5">{p.totalHours} سا</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
