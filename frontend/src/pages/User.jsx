import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export default function User() {
  const { user, setUser } = useAuth();
  const [mode, setMode] = useState('mobile');
  const [form, setForm] = useState({ plan_code: 'PREPAID_DJEZZY', MSSIDN: '0778037340', amount: 500, internetType: 'ADSL', number: '036362608', value: 1000 });
  const [transactions, setTransactions] = useState([]);
  const [message, setMessage] = useState('');

  const load = async () => {
    const { data } = await api.get('/transactions/me');
    setTransactions(data.transactions || []);
  };

  useEffect(() => { if (user) load(); }, [user]);

  const submit = async (event) => {
    event.preventDefault();
    setMessage('');
    const payload = mode === 'mobile'
      ? { type: 'mobile', plan_code: form.plan_code, MSSIDN: form.MSSIDN, amount: Number(form.amount) }
      : { type: 'internet', internetType: form.internetType, number: form.number, value: Number(form.value) };
    try {
      const { data } = await api.post('/transactions/topup', payload);
      setMessage('تم إرسال العملية بنجاح');
      setUser({ ...user, balance: data.balance });
      localStorage.setItem('user', JSON.stringify({ ...user, balance: data.balance }));
      await load();
    } catch (err) {
      setMessage(err.response?.data?.message || 'فشلت العملية');
    }
  };

  if (!user) return <div className="card">يرجى تسجيل الدخول أولاً.</div>;

  return (
    <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <section className="card">
        <p className="text-slate-300">رصيدك الحالي</p>
        <h2 className="mt-2 text-4xl font-black">{user.balance} DZD</h2>
        <div className="mt-6 flex rounded-2xl bg-slate-900/80 p-1">
          {['mobile', 'internet'].map((item) => <button key={item} onClick={() => setMode(item)} className={`flex-1 rounded-xl px-4 py-2 ${mode === item ? 'bg-white text-slate-950' : ''}`}>{item === 'mobile' ? 'هاتف' : 'إنترنت'}</button>)}
        </div>
        <form onSubmit={submit} className="mt-6 space-y-4">
          {mode === 'mobile' ? <>
            <input className="input" value={form.plan_code} onChange={(e) => setForm({ ...form, plan_code: e.target.value })} placeholder="Plan code" />
            <input className="input" value={form.MSSIDN} onChange={(e) => setForm({ ...form, MSSIDN: e.target.value })} placeholder="رقم الهاتف" />
            <input className="input" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="المبلغ" />
          </> : <>
            <select className="input" value={form.internetType} onChange={(e) => setForm({ ...form, internetType: e.target.value })}><option>ADSL</option><option>4G</option></select>
            <input className="input" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} placeholder="رقم الخدمة" />
            <input className="input" type="number" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} placeholder="القيمة" />
          </>}
          {message && <p className="rounded-2xl bg-white/10 p-3 text-sm">{message}</p>}
          <button className="btn w-full">تنفيذ الشحن</button>
        </form>
      </section>
      <section className="card overflow-x-auto">
        <h2 className="mb-4 text-2xl font-black">عملياتي</h2>
        <table className="w-full min-w-[680px] text-sm">
          <thead className="text-slate-300"><tr><th className="p-3 text-right">الخدمة</th><th>المبلغ</th><th>السعر</th><th>الحالة</th><th>المرجع</th></tr></thead>
          <tbody>{transactions.map((tx) => <tr key={tx._id} className="border-t border-white/10"><td className="p-3">{tx.type}</td><td>{tx.amount}</td><td>{tx.costToUser}</td><td>{tx.status}</td><td>{tx.providerRef}</td></tr>)}</tbody>
        </table>
      </section>
    </div>
  );
}
