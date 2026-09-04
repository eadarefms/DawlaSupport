import { useEffect, useState } from "react";
import { Users, Download } from "lucide-react";
import { api, downloadProtectedFile } from "../api/client";

interface TeacherRow {
  id: string;
  fullName: string;
  matricule: string;
  email: string;
  province: { name: string } | null;
  school: { name: string } | null;
  level: { name: string } | null;
  stream: { name: string } | null;
}

export default function TeachersDirectory() {
  const [teachers, setTeachers] = useState<TeacherRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    api.get<TeacherRow[]>("/directory/teachers").then((res) => setTeachers(res.data)).finally(() => setLoading(false));
  }, []);

  async function handleExport() {
    setExporting(true);
    try {
      await downloadProtectedFile("/export/teachers.xlsx", "الأساتذة.xlsx");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Users size={22} className="text-brand-600" />
          الأساتذة/ت
        </h1>
        <button onClick={handleExport} disabled={exporting} className="btn-secondary">
          <Download size={16} />
          {exporting ? "جارٍ التصدير..." : "تصدير Excel"}
        </button>
      </div>

      {loading && <p className="text-sm text-slate-400">جارٍ التحميل...</p>}

      {!loading && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead>
              <tr className="text-slate-500 border-b border-slate-100">
                <th className="py-2 pl-3 font-medium">الاسم الكامل</th>
                <th className="py-2 pl-3 font-medium">رقم التأجير</th>
                <th className="py-2 pl-3 font-medium">البريد الإلكتروني</th>
                <th className="py-2 pl-3 font-medium">المديرية</th>
                <th className="py-2 pl-3 font-medium">المستوى</th>
                <th className="py-2 font-medium">الشعبة</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((t) => (
                <tr key={t.id} className="border-b border-slate-50 last:border-0">
                  <td className="py-2.5 pl-3 font-medium">{t.fullName}</td>
                  <td className="py-2.5 pl-3">{t.matricule}</td>
                  <td className="py-2.5 pl-3">{t.email}</td>
                  <td className="py-2.5 pl-3">{t.province?.name ?? ""}</td>
                  <td className="py-2.5 pl-3">{t.level?.name ?? "—"}</td>
                  <td className="py-2.5">{t.stream?.name ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
