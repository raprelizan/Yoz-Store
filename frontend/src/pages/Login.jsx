import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('admin@yoz.local');
  const [password, setPassword] = useState('Admin@12345');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      const user = await login(email, password);
      navigate(user.role === 'admin' ? '/admin' : '/user');
    } catch (err) {
      setError(err.response?.data?.message || 'تعذر تسجيل الدخول');
    }
  };

  return (
    <div className="mx-auto max-w-md card">
      <h2 className="text-3xl font-black">تسجيل الدخول</h2>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="البريد الإلكتروني" />
        <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="كلمة المرور" />
        {error && <p className="rounded-2xl bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
        <button className="btn w-full">دخول</button>
      </form>
    </div>
  );
}
