import { Hammer } from "lucide-react";

export default function ComingSoon({ title }: { title: string }) {
  return (
    <div className="card flex flex-col items-center justify-center text-center py-16">
      <div className="w-14 h-14 rounded-2xl bg-gold-500/15 text-gold-600 flex items-center justify-center mb-4">
        <Hammer size={26} />
      </div>
      <h2 className="font-bold text-slate-800 text-lg">{title}</h2>
      <p className="text-sm text-slate-500 mt-2 max-w-md">
        هذه الوحدة ستُبنى في المرحلة القادمة من المشروع حسب خطة التنفيذ المتفق عليها.
      </p>
    </div>
  );
}
