import { useEffect, useState } from "react";
import { Award } from "lucide-react";
import { api } from "../api/client";

interface EligibleTeacher {
  teacherId: string;
  fullName: string;
  matricule: string;
  province: string;
  totalMinutes: number;
  certificatesEarned: number;
  remainingMinutesToNext: number;
}

export default function EligibleTeachersList() {
  const [teachers, setTeachers] = useState<EligibleTeacher[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<EligibleTeacher[]>("/hours/eligible-teachers")
      .then((res) => setTeachers(res.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
        <Award size={22} className="text-gold-600" />
        الأساتذة المستحقون للشهادات
      </h1>

      {loading && <p className="text-sm text-slate-400">جارٍ التحميل...</p>}
      {!loading && teachers.length === 0 && (
        <p className="text-sm text-slate-400">لا يوجد أساتذة مستحقون لشهادة بعد (العتبة: 10 ساعات).</p>
      )}

      {teachers.length > 0 && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead>
              <tr className="text-slate-500 border-b border-slate-100">
                <th className="py-2 pl-3 font-medium">الأستاذ</th>
                <th className="py-2 pl-3 font-medium">رقم التأجير</th>
                <th className="py-2 pl-3 font-medium">المديرية</th>
                <th className="py-2 pl-3 font-medium">مجموع الساعات</th>
                <th className="py-2 pl-3 font-medium">الشهادات المستحقة</th>
                <th className="py-2 font-medium">المتبقي للشهادة القادمة</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((t) => (
                <tr key={t.teacherId} className="border-b border-slate-50 last:border-0">
                  <td className="py-2.5 pl-3 font-medium">{t.fullName}</td>
                  <td className="py-2.5 pl-3">{t.matricule}</td>
                  <td className="py-2.5 pl-3">{t.province}</td>
                  <td className="py-2.5 pl-3">{Math.round((t.totalMinutes / 60) * 10) / 10} سا</td>
                  <td className="py-2.5 pl-3">{t.certificatesEarned}</td>
                  <td className="py-2.5">{Math.round((t.remainingMinutesToNext / 60) * 10) / 10} سا</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
