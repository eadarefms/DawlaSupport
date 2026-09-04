import { useEffect, useState } from "react";
import { Users, Download } from "lucide-react";
import { api, downloadProtectedFile } from "../api/client";
import { Enrollment } from "../types";
import { formatDateShort } from "../utils/sessionStatus";

export default function StudentsList() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    api
      .get<Enrollment[]>("/beneficiaries/mine")
      .then((res) => setEnrollments(res.data))
      .finally(() => setLoading(false));
  }, []);

  async function handleExport() {
    setExporting(true);
    try {
      await downloadProtectedFile("/export/beneficiaries.xlsx", "التلاميذ/ت_المستفيدون.xlsx");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Users size={22} className="text-brand-600" />
          التلاميذ/ت المستفيدون
        </h1>
        <button onClick={handleExport} disabled={exporting} className="btn-secondary">
          <Download size={16} />
          {exporting ? "جارٍ التصدير..." : "تصدير Excel"}
        </button>
      </div>

      {loading && <p className="text-sm text-slate-400">جارٍ التحميل...</p>}
      {!loading && enrollments.length === 0 && (
        <p className="text-sm text-slate-400">لا يوجد تلاميذ/ت مسجلون في حصصك بعد.</p>
      )}

      {enrollments.length > 0 && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead>
              <tr className="text-slate-500 border-b border-slate-100">
                <th className="py-2 pl-3 font-medium">الاسم الكامل</th>
                <th className="py-2 pl-3 font-medium">رمز مسار</th>
                <th className="py-2 pl-3 font-medium">البريد الإلكتروني</th>
                <th className="py-2 pl-3 font-medium">الدرس</th>
                <th className="py-2 pl-3 font-medium">المادة</th>
                <th className="py-2 pl-3 font-medium">التاريخ</th>
                <th className="py-2 font-medium">تاريخ التسجيل</th>
              </tr>
            </thead>
            <tbody>
              {enrollments.map((e) => (
                <tr key={e.id} className="border-b border-slate-50 last:border-0">
                  <td className="py-2.5 pl-3">{e.fullName}</td>
                  <td className="py-2.5 pl-3">{e.code}</td>
                  <td className="py-2.5 pl-3">{e.email}</td>
                  <td className="py-2.5 pl-3">{e.session?.title}</td>
                  <td className="py-2.5 pl-3">{e.session?.subject.name}</td>
                  <td className="py-2.5 pl-3">{e.session ? formatDateShort(e.session.date) : ""}</td>
                  <td className="py-2.5">{formatDateShort(e.registeredAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
