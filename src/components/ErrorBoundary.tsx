import React from 'react';

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    let friendly = 'حدث خطأ غير متوقع أثناء تشغيل اللعبة.';
    try {
      const parsed = JSON.parse(error.message);
      if (parsed?.error) {
        friendly = `خطأ في الاتصال بقاعدة البيانات: ${parsed.error}`;
      }
    } catch {
      if (error.message) friendly = error.message;
    }
    return { hasError: true, message: friendly };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          dir="rtl"
          className="min-h-screen bg-[#0B0F17] text-slate-100 flex items-center justify-center p-6"
        >
          <div className="max-w-md w-full bg-[#131A27] border border-slate-700/80 rounded-2xl p-6 text-center space-y-4">
            <div className="text-4xl">⚖️</div>
            <h2 className="text-xl font-bold text-amber-400">
              توقف مؤقت في بنك الحظ
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed break-words">
              {this.state.message}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition-colors cursor-pointer"
            >
              إعادة تحميل اللعبة
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
