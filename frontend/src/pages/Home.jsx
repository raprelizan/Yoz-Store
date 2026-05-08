import { Link } from 'react-router-dom';
import StatCard from '../components/StatCard';

export default function Home() {
  return (
    <main className="grid gap-8 lg:grid-cols-[1.25fr_0.75fr]">
      <section className="card overflow-hidden">
        <p className="mb-4 inline-flex rounded-full bg-cyan-400/10 px-4 py-2 text-sm text-cyan-200">منصة خدمات رقمية حديثة</p>
        <h1 className="max-w-3xl text-4xl font-black leading-tight md:text-6xl">شحن Flexy والإنترنت مع إدارة أرباح ومستخدمين من مكان واحد.</h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">واجهة عربية احترافية، لوحة تحكم للأدمن، تتبع العمليات، وتسعير مرن بالنسبة أو السعر الثابت بدون نسخ أي تصميم خارجي.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link className="btn" to="/user">ابدأ عملية شحن</Link>
          <Link className="rounded-2xl border border-white/10 px-5 py-3 font-bold" to="/admin">لوحة الإدارة</Link>
        </div>
      </section>
      <section className="grid gap-4">
        <StatCard label="هامش ربح مرن" value="% أو ثابت" hint="قابل للتعديل من الأدمن" />
        <StatCard label="تكامل OneClickDZ" value="v3 API" hint="Mobile + Internet" />
        <StatCard label="حماية" value="JWT" hint="bcrypt + validation + rate limit" />
      </section>
    </main>
  );
}
