import { useEffect } from 'react';

function Toast({ message, type = 'success', onClose, duration = 5000 }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const getIcon = () => {
    if (type === 'success') {
      return (
        <svg className="h-6 w-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    } else if (type === 'error') {
      return (
        <svg className="h-6 w-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    } else if (type === 'warning') {
      return (
        <svg className="h-6 w-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      );
    } else {
      return (
        <svg className="h-6 w-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }
  };

  const getBackgroundColor = () => {
    if (type === 'success') return 'bg-green-50 border-green-200';
    if (type === 'error') return 'bg-red-50 border-red-200';
    if (type === 'warning') return 'bg-yellow-50 border-yellow-200';
    return 'bg-blue-50 border-blue-200';
  };

  const getTextColor = () => {
    if (type === 'success') return 'text-green-800';
    if (type === 'error') return 'text-red-800';
    if (type === 'warning') return 'text-yellow-800';
    return 'text-blue-800';
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
      <div className={`max-w-md w-full shadow-lg rounded-lg border ${getBackgroundColor()}`}>
        <div className="p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {getIcon()}
            </div>
            <div className="ml-3 flex-1">
              <p className={`text-sm font-medium ${getTextColor()}`}>
                {message}
              </p>
            </div>
            <div className="ml-4 flex-shrink-0 flex">
              <button
                onClick={onClose}
                className={`inline-flex rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  type === 'success' ? 'text-green-500 hover:text-green-600 focus:ring-green-500' :
                  type === 'error' ? 'text-red-500 hover:text-red-600 focus:ring-red-500' :
                  type === 'warning' ? 'text-yellow-500 hover:text-yellow-600 focus:ring-yellow-500' :
                  'text-blue-500 hover:text-blue-600 focus:ring-blue-500'
                }`}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Toast;
