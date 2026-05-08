import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const nav = [
  ['/', 'الرئيسية'],
  ['/user', 'لوحة المستخدم'],
  ['/admin', 'الإدارة']
];

export default function Layout() {
  const { user, logout } = useAuth();
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <header className="mb-8 flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur md:flex-row md:items-center md:justify-between">
        <Link to="/" className="text-2xl font-black tracking-tight">Yoz Store</Link>
        <nav className="flex flex-wrap items-center gap-2">
          {nav.map(([to, label]) => (
            <NavLink key={to} to={to} className={({ isActive }) => `rounded-2xl px-4 py-2 text-sm ${isActive ? 'bg-white text-slate-950' : 'text-slate-200 hover:bg-white/10'}`}>{label}</NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-3 text-sm">
          {user ? <><span>{user.name} · {user.balance} DZD</span><button onClick={logout} className="rounded-xl border border-white/10 px-3 py-2">خروج</button></> : <Link to="/login" className="btn py-2">دخول</Link>}
        </div>
      </header>
      <Outlet />
    </div>
  );
}
