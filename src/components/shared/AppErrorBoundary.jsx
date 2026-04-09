import React from 'react';
import { logger } from '../../utils/logger';

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    logger.error('Unhandled UI error', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-6">
          <div className="max-w-md text-center space-y-4">
            <h1 className="text-3xl font-black">Algo salió mal</h1>
            <p className="text-gray-400">
              La app encontró un error inesperado. Recarga la página para volver a intentar.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-6 py-3 rounded-2xl bg-[#d0ff00] text-black font-bold"
            >
              Recargar Rivapp
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
