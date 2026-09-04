import { useEffect, useState } from "react";
import { CalendarClock, Users, Clock, Award, Building2 } from "lucide-react";
import { api } from "../api/client";
import { useAuth, ROLE_LABELS } from "../context/AuthContext";
import { formatDateShort } from "../utils/sessionStatus";

interface TeacherDashboard {
  sessionsCount: number;
  studentsCount: number;
  totalHours: number;
  certificatesEarned: number;
  nextSession: {
    title: string;
    date: string;
    startTime: string;
    endTime: string;
    level: { name: string };
    stream: { name: string } | null;
    subject: { name: string };
  } | null;
}

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

export default function Home() {
  const { user } = useAuth();
  const [teacherData, setTeacherData] = useState<TeacherDashboard | null>(null);
  const [provinceData, setProvinceData] = useState<ProvinceDashboard | null>(null);
  const [regionalData, setRegionalData] = useState<RegionalDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    if (user.role === "TEACHER") {
      api.get<TeacherDashboard>("/dashboard/teacher").then((r) => setTeacherData(r.data)).finally(() => setLoading(false));
    } else if (user.role === "PROVINCIAL_COORDINATOR") {
      api.get<ProvinceDashboard>("/dashboard/province").then((r) => setProvinceData(r.data)).finally(() => setLoading(false));
    } else if (user.role === "REGIONAL_HEAD" || user.role === "ADMIN") {
      api.get<RegionalDashboard>("/dashboard/regional").then((r) => setRegionalData(r.data)).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user]);

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">
          مرحبًا بك، {ROLE_LABELS[user.role]} {user.fullName}
        </h1>
      </div>

      {loading && <p className="text-sm text-slate-400">جارٍ تحميل المؤشرات...</p>}

      {user.role === "TEACHER" && teacherData && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard icon={CalendarClock} label="عدد الحصص" value={teacherData.sessionsCount} />
            <KpiCard icon={Clock} label="مجموع الساعات" value={`${teacherData.totalHours} سا`} />
            <KpiCard icon={Users} label="عدد التلاميذ المستفيدين" value={teacherData.studentsCount} />
            <KpiCard icon={Award} label="الشهادات المستحقة" value={teacherData.certificatesEarned} />
          </div>
          {teacherData.nextSession && (
            <div className="card">
              <h2 className="font-bold mb-2">الحصة القادمة</h2>
              <p className="text-sm text-slate-700">{teacherData.nextSession.title}</p>
              <p className="text-sm text-slate-500 mt-1">
                {teacherData.nextSession.subject.name} • {teacherData.nextSession.level.name}
                {teacherData.nextSession.stream ? ` • ${teacherData.nextSession.stream.name}` : ""}
              </p>
              <p className="text-sm text-slate-500">
                {formatDateShort(teacherData.nextSession.date)} • {teacherData.nextSession.startTime}–
                {teacherData.nextSession.endTime}
              </p>
            </div>
          )}
        </>
      )}

      {user.role === "PROVINCIAL_COORDINATOR" && provinceData && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard icon={Users} label="عدد الأساتذة" value={provinceData.teachersCount} />
            <KpiCard icon={Users} label="عدد التلاميذ" value={provinceData.studentsCount} />
            <KpiCard icon={CalendarClock} label="عدد الحصص" value={provinceData.sessionsCount} />
            <KpiCard icon={Clock} label="مجموع الساعات" value={`${provinceData.totalHours} سا`} />
          </div>
          <div className="card">
            <h2 className="font-bold mb-3">التوزيع حسب المستوى</h2>
            <div className="space-y-2">
              {provinceData.distributionByLevel.map((d) => (
                <div key={d.levelId} className="flex items-center justify-between text-sm">
                  <span>{d.levelName}</span>
                  <span className="font-medium">{d.count}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {(user.role === "REGIONAL_HEAD" || user.role === "ADMIN") && regionalData && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard icon={Users} label="مجموع الأساتذة" value={regionalData.totals.teachersCount} />
            <KpiCard icon={Users} label="مجموع التلاميذ" value={regionalData.totals.studentsCount} />
            <KpiCard icon={CalendarClock} label="مجموع الحصص" value={regionalData.totals.sessionsCount} />
            <KpiCard icon={Clock} label="مجموع الساعات" value={`${regionalData.totals.totalHours} سا`} />
          </div>
          <div className="card overflow-x-auto">
            <h2 className="font-bold mb-3 flex items-center gap-2">
              <Building2 size={18} className="text-brand-600" />
              مقارنة المديريات الثمانية
            </h2>
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
                {regionalData.byProvince.map((p) => (
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
        </>
      )}

      {user.role === "STUDENT" && (
        <div className="card">
          <p className="text-sm text-slate-600">
            توجّه إلى "الدروس المتاحة" لاختيار دروسك، أو "دروسي" لمتابعة حصصك المسجَّلة.
          </p>
        </div>
      )}
    </div>
  );
}

function KpiCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | number }) {
  return (
    <div className="card">
      <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-3">
        <Icon size={20} />
      </div>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
      <p className="text-sm text-slate-500 mt-1">{label}</p>
    </div>
  );
}
