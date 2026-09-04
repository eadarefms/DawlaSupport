import { useEffect, useMemo, useState } from "react";
import { KeyRound, Pencil, Plus, Search, ShieldCheck, Trash2, UserCog, X } from "lucide-react";
import { api, getApiErrorMessage } from "../api/client";
import { Level, Province, Role } from "../types";

type Account = {
  id: string; username: string; email: string | null; fullName: string; role: Role; isActive: boolean;
  province: Province | null; school: { id: string; name: string } | null;
  level: Level | null; stream: { id: string; name: string } | null;
};

const roleLabels: Record<Role, string> = {
  ADMIN: "مدير النظام", REGIONAL_HEAD: "رئيس المصلحة", PROVINCIAL_COORDINATOR: "منسق إقليمي", TEACHER: "أستاذ/ة", STUDENT: "تلميذ/ة",
};
const empty = { username: "", password: "", fullName: "", email: "", role: "TEACHER" as Role, provinceId: "", schoolName: "", levelId: "", streamId: "" };

export default function UserManagement() {
  const [users, setUsers] = useState<Account[]>([]), [provinces, setProvinces] = useState<Province[]>([]), [levels, setLevels] = useState<Level[]>([]);
  const [search, setSearch] = useState(""), [roleFilter, setRoleFilter] = useState("ALL"), [loading, setLoading] = useState(true), [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Account | null>(null), [creating, setCreating] = useState(false);

  function load() { setLoading(true); Promise.all([api.get<Account[]>("/users"), api.get<Province[]>("/meta/provinces"), api.get<Level[]>("/meta/levels")]).then(([u,p,l])=>{setUsers(u.data);setProvinces(p.data);setLevels(l.data)}).catch(e=>setError(getApiErrorMessage(e))).finally(()=>setLoading(false)); }
  useEffect(load, []);
  const filtered = useMemo(() => users.filter(u => (roleFilter === "ALL" || u.role === roleFilter) && `${u.fullName} ${u.username} ${u.email ?? ""}`.toLowerCase().includes(search.toLowerCase())), [users, roleFilter, search]);

  async function toggle(u: Account) { try { await api.patch(`/users/${u.id}`, { isActive: !u.isActive }); load(); } catch(e) { setError(getApiErrorMessage(e)); } }

  async function remove(u: Account) {
    if (!window.confirm(`هل أنت متأكد من حذف حساب «${u.fullName}»؟\nسيتم حذف بيانات الحساب التابعة له أيضًا ولا يمكن التراجع عن هذا الإجراء.`)) return;
    try {
      await api.delete(`/users/${u.id}`);
      setError(null);
      load();
    } catch (e) {
      setError(getApiErrorMessage(e));
    }
  }

  return <div className="space-y-5">
    <div className="flex items-center justify-between gap-3 flex-wrap"><div><h1 className="text-xl font-bold text-slate-800 flex items-center gap-2"><UserCog size={22} className="text-brand-600"/>إدارة الحسابات</h1><p className="text-sm text-slate-500 mt-1">إنشاء وتعديل وتفعيل حسابات مستخدمي المنصة.</p></div><button className="btn-primary" onClick={()=>setCreating(true)}><Plus size={16}/>حساب جديد</button></div>
    {error && <div className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{error}</div>}
    <div className="card flex gap-3 flex-wrap"><div className="relative flex-1 min-w-[220px]"><Search size={16} className="absolute right-3 top-3 text-slate-400"/><input className="input-field pr-9" placeholder="بحث بالاسم أو اسم المستخدم أو البريد..." value={search} onChange={e=>setSearch(e.target.value)}/></div><select className="input-field w-auto min-w-[190px]" value={roleFilter} onChange={e=>setRoleFilter(e.target.value)}><option value="ALL">كل الأدوار</option>{Object.entries(roleLabels).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></div>
    {loading ? <p className="text-sm text-slate-400">جارٍ التحميل...</p> : <div className="card overflow-x-auto"><table className="w-full text-sm text-right"><thead><tr className="text-slate-500 border-b border-slate-100"><th className="py-3">المستخدم</th><th>الدور</th><th>المديرية</th><th>المؤسسة</th><th>الحالة</th><th>الإجراءات</th></tr></thead><tbody>{filtered.map(u=><tr key={u.id} className="border-b border-slate-50 last:border-0"><td className="py-3"><div className="font-medium">{u.fullName}</div><div className="text-xs text-slate-400">{u.username}{u.email ? ` • ${u.email}` : ""}</div></td><td>{roleLabels[u.role]}</td><td>{u.province?.name ?? "—"}</td><td>{u.school?.name ?? "—"}</td><td><button onClick={()=>toggle(u)} className={`badge ${u.isActive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{u.isActive ? "مفعل" : "غير مفعل"}</button></td><td><div className="flex items-center gap-3"><button className="inline-flex items-center gap-1 text-brand-700 font-medium" onClick={()=>setEditing(u)}><Pencil size={14}/>تعديل</button>{u.id !== undefined && <button className="inline-flex items-center gap-1 text-red-600 hover:text-red-800 font-medium" onClick={()=>remove(u)} title="حذف الحساب"><Trash2 size={14}/>حذف</button>}</div></td></tr>)}</tbody></table>{filtered.length===0&&<p className="py-8 text-center text-slate-400">لا توجد نتائج.</p>}</div>}
    {(creating || editing) && <UserModal account={editing} provinces={provinces} levels={levels} onClose={()=>{setCreating(false);setEditing(null)}} onSaved={()=>{setCreating(false);setEditing(null);load()}}/>}
  </div>;
}

function UserModal({account,provinces,levels,onClose,onSaved}:{account:Account|null;provinces:Province[];levels:Level[];onClose:()=>void;onSaved:()=>void}) {
  const [form,setForm]=useState(account?{username:account.username,password:"",fullName:account.fullName,email:account.email??"",role:account.role,provinceId:account.province?.id??"",schoolName:account.school?.name??"",levelId:account.level?.id??"",streamId:account.stream?.id??""}:empty);
  const [saving,setSaving]=useState(false),[error,setError]=useState<string|null>(null); const level=levels.find(l=>l.id===form.levelId);
  function update(k:string,v:string){setForm(f=>({...f,[k]:v}))}
  async function submit(e:React.FormEvent){e.preventDefault();setSaving(true);setError(null);try{if(account){const {username,password,role,...rest}=form;void username;void role;await api.patch(`/users/${account.id}`,{...rest,password:password||undefined,provinceId:rest.provinceId||undefined,schoolName:rest.schoolName||undefined,levelId:rest.levelId||undefined,streamId:rest.streamId||undefined})}else await api.post("/users",{...form,provinceId:form.provinceId||undefined,schoolName:form.schoolName||undefined,levelId:form.levelId||undefined,streamId:form.streamId||undefined});onSaved()}catch(e){setError(getApiErrorMessage(e))}finally{setSaving(false)}}
  const academic=form.role==="TEACHER"||form.role==="STUDENT";
  const usernameLabel = form.role === "STUDENT" ? "رمز مسار" : form.role === "TEACHER" || form.role === "PROVINCIAL_COORDINATOR" || form.role === "REGIONAL_HEAD" ? "رقم التأجير" : "اسم المستخدم";
  const usernamePattern = form.role === "STUDENT" ? "[A-Za-z][0-9]+" : form.role === "TEACHER" || form.role === "PROVINCIAL_COORDINATOR" || form.role === "REGIONAL_HEAD" ? "[0-9]+" : undefined;
  const usernamePlaceholder = form.role === "STUDENT" ? "مثال: M2026001" : form.role === "TEACHER" || form.role === "PROVINCIAL_COORDINATOR" || form.role === "REGIONAL_HEAD" ? "مثال: 123456" : "اسم المستخدم";
  return <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"><div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto relative"><button onClick={onClose} className="absolute top-4 left-4 text-slate-400"><X/></button><h2 className="font-bold text-lg mb-4">{account?"تعديل الحساب":"إنشاء حساب جديد"}</h2><form onSubmit={submit} className="space-y-3"><div className="grid md:grid-cols-2 gap-3"><div><label className="label-field">الاسم الكامل</label><input className="input-field" value={form.fullName} onChange={e=>update("fullName",e.target.value)} required/></div><div><label className="label-field">{usernameLabel}</label><input className="input-field" value={form.username} onChange={e=>update("username", form.role === "STUDENT" ? e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "") : (form.role === "TEACHER" || form.role === "PROVINCIAL_COORDINATOR" || form.role === "REGIONAL_HEAD") ? e.target.value.replace(/\D/g, "") : e.target.value)} pattern={usernamePattern} placeholder={usernamePlaceholder} disabled={!!account && form.role === "ADMIN"} required/></div></div><div className="grid md:grid-cols-2 gap-3"><div><label className="label-field">البريد الإلكتروني</label><input type="email" className="input-field" value={form.email} onChange={e=>update("email",e.target.value)}/></div><div><label className="label-field">كلمة المرور {account&&"(اتركها فارغة دون تغيير)"}</label><input type="password" className="input-field" value={form.password} onChange={e=>update("password",e.target.value)} required={!account}/></div></div>{!account&&<div><label className="label-field">نوع الحساب</label><select className="input-field" value={form.role} onChange={e=>update("role",e.target.value)}>{Object.entries(roleLabels).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></div>}{(academic||form.role==="PROVINCIAL_COORDINATOR")&&<div><label className="label-field">المديرية الإقليمية</label><select className="input-field" value={form.provinceId} onChange={e=>update("provinceId",e.target.value)} required><option value="">اختر المديرية...</option>{provinces.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></div>}{academic&&<><div><label className="label-field">المؤسسة التعليمية</label><input className="input-field" value={form.schoolName} onChange={e=>update("schoolName",e.target.value)} required/></div><div><label className="label-field">المستوى</label><select className="input-field" value={form.levelId} onChange={e=>{update("levelId",e.target.value);update("streamId","")}} required><option value="">اختر المستوى...</option>{levels.map(l=><option key={l.id} value={l.id}>{l.name}</option>)}</select></div>{level?.hasStreams&&<div><label className="label-field">الشعبة</label><select className="input-field" value={form.streamId} onChange={e=>update("streamId",e.target.value)} required><option value="">اختر الشعبة...</option>{level.streams.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></div>}</>}{error&&<div className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{error}</div>}<div className="flex gap-2"><button className="btn-primary flex-1" disabled={saving}>{saving?<><KeyRound size={15}/>جارٍ الحفظ...</>:account?"حفظ التعديلات":"إنشاء الحساب"}</button><button type="button" className="btn-secondary" onClick={onClose}>إلغاء</button></div></form></div></div>
}
