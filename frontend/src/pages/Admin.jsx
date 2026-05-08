import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import StatCard from '../components/StatCard';

export default function Admin() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [settings, setSettings] = useState({ serviceEnabled: true, pricingMode: 'percent', markupPercent: 10, fixedFee: 0, baseUrl: 'https://api.oneclickdz.com', apiKey: '' });
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [notice, setNotice] = useState('');

  const load = async () => {
    const [statsRes, settingsRes, usersRes, txRes] = await Promise.all([
      api.get('/transactions/admin/stats'),
      api.get('/admin/settings'),
      api.get('/admin/users'),
      api.get('/transactions/admin/all')
    ]);
    setStats(statsRes.data.stats);
    if (settingsRes.data.settings) setSettings((prev) => ({ ...prev, ...settingsRes.data.settings, apiKey: '' }));
    setUsers(usersRes.data.users || []);
    setTransactions(txRes.data.transactions || []);
  };

  useEffect(() => { if (user?.role === 'admin') load(); }, [user]);

  const saveSettings = async (event) => {
    event.preventDefault();
    const payload = { ...settings };
    if (!payload.apiKey || payload.apiKey.includes('••••')) delete payload.apiKey;
    await api.put('/admin/settings', payload);
    setNotice('تم حفظ الإعدادات');
    await load();
  };

  const updateUser = async (target, patch) => {
    await api.patch(`/admin/users/${target.id}`, patch);
    await load();
  };

  if (!user) return <div className="card">يرجى تسجيل الدخول كأدمن.</div>;
  if (user.role !== 'admin') return <div className="card">هذه الصفحة للأدمن فقط.</div>;

  const chart = transactions.slice(0, 8).map((tx) => ({ name: tx.providerRef?.slice(0, 8) || tx._id.slice(-6), profit: tx.profitAmount, revenue: tx.costToUser }));

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="الإيرادات" value={`${stats?.revenue || 0} DZD`} />
        <StatCard label="الأرباح" value={`${stats?.profit || 0} DZD`} />
        <StatCard label="العمليات" value={stats?.transactions || 0} />
        <StatCard label="المستخدمون" value={stats?.users || 0} hint={`${stats?.activeUsers || 0} نشط`} />
      </section>

      <section className="card h-80">
        <h2 className="mb-4 text-2xl font-black">مخطط الأرباح</h2>
        <ResponsiveContainer width="100%" height="85%">
          <BarChart data={chart}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.12)" /><XAxis dataKey="name" stroke="#cbd5e1" /><YAxis stroke="#cbd5e1" /><Tooltip /><Bar dataKey="profit" fill="#22d3ee" /><Bar dataKey="revenue" fill="#3b82f6" /></BarChart>
        </ResponsiveContainer>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={saveSettings} className="card space-y-4">
          <h2 className="text-2xl font-black">إعدادات API والتسعير</h2>
          <input className="input" value={settings.baseUrl || ''} onChange={(e) => setSettings({ ...settings, baseUrl: e.target.value })} placeholder="Base URL" />
          <input className="input" value={settings.apiKey || ''} onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })} placeholder="API Key جديد (اختياري)" />
          <select className="input" value={settings.serviceEnabled ? 'true' : 'false'} onChange={(e) => setSettings({ ...settings, serviceEnabled: e.target.value === 'true' })}><option value="true">الخدمة مفعلة</option><option value="false">الخدمة متوقفة</option></select>
          <select className="input" value={settings.pricingMode} onChange={(e) => setSettings({ ...settings, pricingMode: e.target.value })}><option value="percent">نسبة مئوية</option><option value="fixed">سعر ثابت</option></select>
          <input className="input" type="number" value={settings.markupPercent || 0} onChange={(e) => setSettings({ ...settings, markupPercent: Number(e.target.value) })} placeholder="نسبة الربح" />
          <input className="input" type="number" value={settings.fixedFee || 0} onChange={(e) => setSettings({ ...settings, fixedFee: Number(e.target.value) })} placeholder="ربح ثابت" />
          {notice && <p className="rounded-2xl bg-emerald-400/10 p-3 text-emerald-200">{notice}</p>}
          <button className="btn">حفظ</button>
        </form>

        <div className="card overflow-x-auto">
          <h2 className="mb-4 text-2xl font-black">المستخدمون</h2>
          <table className="w-full min-w-[560px] text-sm"><thead className="text-slate-300"><tr><th className="p-3 text-right">الاسم</th><th>الرصيد</th><th>الحالة</th><th>إجراء</th></tr></thead><tbody>{users.map((target) => <tr key={target.id} className="border-t border-white/10"><td className="p-3">{target.name}<br /><span className="text-xs text-slate-400">{target.email}</span></td><td><input className="w-24 rounded-xl bg-slate-900 p-2" type="number" defaultValue={target.balance} onBlur={(e) => updateUser(target, { balance: Number(e.target.value) })} /></td><td>{target.isActive ? 'نشط' : 'محظور'}</td><td><button className="rounded-xl border border-white/10 px-3 py-2" onClick={() => updateUser(target, { isActive: !target.isActive })}>{target.isActive ? 'حظر' : 'تفعيل'}</button></td></tr>)}</tbody></table>
        </div>
      </section>

      <section className="card overflow-x-auto">
        <h2 className="mb-4 text-2xl font-black">كل العمليات</h2>
        <table className="w-full min-w-[820px] text-sm"><thead className="text-slate-300"><tr><th className="p-3 text-right">المستخدم</th><th>النوع</th><th>المبلغ</th><th>الربح</th><th>الحالة</th><th>التاريخ</th></tr></thead><tbody>{transactions.map((tx) => <tr key={tx._id} className="border-t border-white/10"><td className="p-3">{tx.user?.name || '-'}</td><td>{tx.type}</td><td>{tx.costToUser}</td><td>{tx.profitAmount}</td><td>{tx.status}</td><td>{new Date(tx.createdAt).toLocaleString('ar-DZ')}</td></tr>)}</tbody></table>
      </section>
    </div>
  );
}
