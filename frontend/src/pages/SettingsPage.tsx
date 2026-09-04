import { useEffect, useState } from "react";
import { Settings as SettingsIcon, Plus } from "lucide-react";
import { api, getApiErrorMessage } from "../api/client";

interface SystemSettings {
  academyName: string;
  serviceName: string;
  contactEmail: string | null;
  contactPhone: string | null;
  platformUrl: string | null;
  activeSchoolYearId: string | null;
}

interface SchoolYear {
  id: string;
  label: string;
  isActive: boolean;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [years, setYears] = useState<SchoolYear[]>([]);
  const [newYearLabel, setNewYearLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function load() {
    api.get<SystemSettings>("/settings").then((res) => setSettings(res.data));
    api.get<SchoolYear[]>("/meta/school-years").then((res) => setYears(res.data));
  }

  useEffect(load, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await api.put("/settings", settings);
      setMessage("تم حفظ الإعدادات بنجاح.");
      load();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleAddYear(e: React.FormEvent) {
    e.preventDefault();
    if (!newYearLabel) return;
    try {
      await api.post("/settings/school-years", { label: newYearLabel });
      setNewYearLabel("");
      load();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }

  async function activateYear(id: string) {
    await api.put("/settings", { activeSchoolYearId: id });
    load();
  }

  if (!settings) return <p className="text-sm text-slate-400">جارٍ التحميل...</p>;

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
        <SettingsIcon size={22} className="text-brand-600" />
        إعدادات النظام
      </h1>

      <form onSubmit={handleSave} className="card space-y-4">
        <h2 className="font-bold">معلومات الأكاديمية</h2>
        <div>
          <label className="label-field">اسم الأكاديمية</label>
          <input
            className="input-field"
            value={settings.academyName}
            onChange={(e) => setSettings({ ...settings, academyName: e.target.value })}
          />
        </div>
        <div>
          <label className="label-field">اسم المصلحة</label>
          <input
            className="input-field"
            value={settings.serviceName}
            onChange={(e) => setSettings({ ...settings, serviceName: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label-field">البريد الإلكتروني للتواصل</label>
            <input
              className="input-field"
              value={settings.contactEmail ?? ""}
              onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
            />
          </div>
          <div>
            <label className="label-field">هاتف التواصل</label>
            <input
              className="input-field"
              value={settings.contactPhone ?? ""}
              onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
            />
          </div>
        </div>
        <div>
          <label className="label-field">رابط المنصة الافتراضية (اختياري)</label>
          <input
            className="input-field"
            value={settings.platformUrl ?? ""}
            onChange={(e) => setSettings({ ...settings, platformUrl: e.target.value })}
          />
        </div>

        {error && <div className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{error}</div>}
        {message && <div className="text-sm text-emerald-700 bg-emerald-50 rounded-xl px-3 py-2">{message}</div>}

        <button type="submit" disabled={saving} className="btn-primary w-full">
          {saving ? "جارٍ الحفظ..." : "حفظ الإعدادات"}
        </button>
      </form>

      <div className="card space-y-3">
        <h2 className="font-bold">السنوات الدراسية</h2>
        {years.map((y) => (
          <div key={y.id} className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2.5">
            <span className="text-sm font-medium">{y.label}</span>
            {y.isActive ? (
              <span className="badge bg-emerald-50 text-emerald-700">نشطة حاليًا</span>
            ) : (
              <button onClick={() => activateYear(y.id)} className="btn-secondary !py-1 !px-3 text-xs">
                تفعيل
              </button>
            )}
          </div>
        ))}

        <form onSubmit={handleAddYear} className="flex gap-2 pt-2">
          <input
            className="input-field"
            placeholder="مثال: 2027/2028"
            value={newYearLabel}
            onChange={(e) => setNewYearLabel(e.target.value)}
          />
          <button type="submit" className="btn-secondary shrink-0">
            <Plus size={16} />
            إضافة
          </button>
        </form>
      </div>
    </div>
  );
}
