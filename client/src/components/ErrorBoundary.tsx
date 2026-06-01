import { Component, type ReactNode } from 'react';

interface Props { children: ReactNode; }
interface State { hasError: boolean; }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error('ErrorBoundary caught:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center px-4">
          <p className="text-5xl mb-4">🔧</p>
          <h2 className="text-xl font-bold text-gray-900 mb-2">出了点问题</h2>
          <p className="text-gray-400 mb-6">页面遇到了意外错误，请刷新重试</p>
          <button onClick={() => { this.setState({ hasError: false }); window.location.reload(); }} className="btn-primary">
            刷新页面
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
