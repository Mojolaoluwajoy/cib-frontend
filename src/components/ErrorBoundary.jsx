import { Component } from 'react';

// Catches errors thrown while a page renders, so one broken page shows a message instead of a blank
// screen. Changing `resetKey` (the current path) clears the error, so navigating away recovers.
export default class ErrorBoundary extends Component {
  state = { error: null, resetKey: this.props.resetKey };

  static getDerivedStateFromError(error) {
    return { error };
  }

  static getDerivedStateFromProps(props, state) {
    if (props.resetKey !== state.resetKey) return { error: null, resetKey: props.resetKey };
    return null;
  }

  componentDidCatch(error, info) {
    console.error('Page crashed:', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white border border-gray-200 rounded-xl p-8 max-w-md w-full text-center">
          <i className="ti ti-mood-sad text-4xl text-gray-300 block mb-3" />
          <h1 className="text-base font-semibold text-gray-900 mb-1">Something went wrong</h1>
          <p className="text-sm text-gray-500 mb-6">
            This page ran into a problem and couldn't be shown. Reloading usually fixes it; if it
            keeps happening, please contact support.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-all"
            >
              <i className="ti ti-refresh" /> Reload page
            </button>
            <a
              href="/dashboard"
              className="flex items-center justify-center gap-2 px-5 py-2.5 border border-gray-200 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-all"
            >
              <i className="ti ti-home" /> Go to dashboard
            </a>
          </div>
        </div>
      </div>
    );
  }
}
