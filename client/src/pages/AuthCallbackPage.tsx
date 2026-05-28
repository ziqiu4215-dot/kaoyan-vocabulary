import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

export default function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      localStorage.setItem('kaoyan-token', token);
      window.location.hash = '#/';
      window.location.reload();
    } else {
      navigate('/login', { replace: true });
    }
  }, [searchParams, navigate]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <p className="text-gray-400">正在登录...</p>
    </div>
  );
}
