import { useEffect, useState } from "react";
import { Users, Download } from "lucide-react";
import { api, downloadProtectedFile, getApiErrorMessage } from "../api/client";

interface StudentRow {
  id: string;
  fullName: string;
  code: string;
  email: string;
  province: { name: string } | null;
  school: { name: string } | null;
  level: { name: string } | null;
  stream: { name: string } | null;
}

export default function StudentsDirectory() {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<StudentRow[]>("/directory/students")
      .then((res) => setStudents(res.data))
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  async function handleExport() {
    setExporting(true);
    setError(null);
    try {
      await downloadProtectedFile("/export/students.xlsx", "التلاميذ.xlsx");
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Users size={22} className="text-brand-600" />
          التلاميذ/ت
        </h1>
        <button onClick={handleExport} disabled={exporting} className="btn-secondary">
          <Download size={16} />
          {exporting ? "جارٍ التصدير..." : "تصدير Excel"}
        </button>
      </div>

      {error && <div className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{error}</div>}

      {loading && <p className="text-sm text-slate-400">جارٍ التحميل...</p>}

      {!loading && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead>
              <tr className="text-slate-500 border-b border-slate-100">
                <th className="py-2 pl-3 font-medium">الاسم الكامل</th>
                <th className="py-2 pl-3 font-medium">رمز مسار</th>
                <th className="py-2 pl-3 font-medium">البريد الإلكتروني</th>
                <th className="py-2 pl-3 font-medium">المديرية</th>
                <th className="py-2 pl-3 font-medium">المستوى</th>
                <th className="py-2 font-medium">الشعبة</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id} className="border-b border-slate-50 last:border-0">
                  <td className="py-2.5 pl-3 font-medium">{s.fullName}</td>
                  <td className="py-2.5 pl-3">{s.code}</td>
                  <td className="py-2.5 pl-3">{s.email}</td>
                  <td className="py-2.5 pl-3">{s.province?.name ?? ""}</td>
                  <td className="py-2.5 pl-3">{s.level?.name ?? "—"}</td>
                  <td className="py-2.5">{s.stream?.name ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
