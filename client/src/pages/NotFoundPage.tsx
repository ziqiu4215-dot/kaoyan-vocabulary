import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4">
      <p className="text-6xl mb-4">📖</p>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">页面未找到</h1>
      <p className="text-gray-400 mb-6">这个词还没收录，先回首页吧</p>
      <Link to="/" className="btn-primary">返回首页</Link>
    </div>
  );
}
