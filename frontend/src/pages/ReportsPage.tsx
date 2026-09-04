import { useState } from "react";
import { FileText, FileSpreadsheet, Download } from "lucide-react";
import { downloadProtectedFile, getApiErrorMessage } from "../api/client";

const REPORTS = [
  {
    key: "weekly-pdf",
    title: "البرمجة الأسبوعية للنشر (PDF)",
    description: "وثيقة رسمية جاهزة للنشر على صفحة الأكاديمية، بترويسة وشعار وجدول الحصص.",
    url: "/export/weekly-schedule.pdf",
    filename: "البرمجة-الأسبوعية.pdf",
    icon: FileText,
  },
  {
    key: "weekly-word",
    title: "البرمجة الأسبوعية للنشر (Word)",
    description: "نسخة قابلة للتعديل بصيغة Word من البرمجة الأسبوعية للنشر.",
    url: "/export/weekly-schedule.docx",
    filename: "البرمجة-الأسبوعية.docx",
    icon: FileText,
  },
  {
    key: "teachers-xlsx",
    title: "لائحة الأساتذة (Excel)",
    description: "كل الأساتذة المسجلين مع مديرياتهم ومؤسساتهم.",
    url: "/export/teachers.xlsx",
    filename: "الأساتذة.xlsx",
    icon: FileSpreadsheet,
  },
  {
    key: "sessions-xlsx",
    title: "لائحة الحصص (Excel)",
    description: "كل الحصص مع حالاتها وتوقيتاتها.",
    url: "/export/sessions.xlsx",
    filename: "الحصص.xlsx",
    icon: FileSpreadsheet,
  },
];

export default function ReportsPage() {
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload(key: string, url: string, filename: string) {
    setError(null);
    setLoadingKey(key);
    try {
      await downloadProtectedFile(url, filename);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoadingKey(null);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-slate-800">التقارير</h1>

      {error && <div className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{error}</div>}

      <div className="grid md:grid-cols-2 gap-4">
        {REPORTS.map((r) => (
          <div key={r.key} className="card">
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-3">
              <r.icon size={20} />
            </div>
            <p className="font-bold text-slate-800">{r.title}</p>
            <p className="text-sm text-slate-500 mt-1 mb-4">{r.description}</p>
            <button
              onClick={() => handleDownload(r.key, r.url, r.filename)}
              disabled={loadingKey === r.key}
              className="btn-primary w-full"
            >
              <Download size={16} />
              {loadingKey === r.key ? "جارٍ التحميل..." : "تحميل"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
