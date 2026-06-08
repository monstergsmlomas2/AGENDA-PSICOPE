import { Component } from 'react';
import { Loader2 } from 'lucide-react';

const RELOAD_FLAG_KEY = 'chunk_error_reload_attempted';

function isChunkLoadError(error) {
  const msg = String(error?.message || error || '');
  return /Failed to fetch dynamically imported module|Importing a module script failed|ChunkLoadError|error loading dynamically imported module/i.test(msg);
}

export default class ChunkErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error) {
    if (isChunkLoadError(error)) {
      const alreadyTried = sessionStorage.getItem(RELOAD_FLAG_KEY);
      if (!alreadyTried) {
        sessionStorage.setItem(RELOAD_FLAG_KEY, '1');
        window.location.reload();
        return;
      }
    }
  }

  componentDidMount() {
    sessionStorage.removeItem(RELOAD_FLAG_KEY);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full min-h-[300px]">
          <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
            <Loader2 size={24} className="animate-spin" />
            <span className="text-sm font-medium">Actualizando…</span>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
