import { useEffect } from 'react';

export default function Popup({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  type = 'success', 
  autoClose = true, 
  duration = 3000,
  redirectTo = null,
  onRedirect = null,
  jobId = null
}) {
  useEffect(() => {
    if (isOpen && autoClose) {
      const timer = setTimeout(() => {
        onClose();
        if (redirectTo && onRedirect) {
          if (redirectTo === 'feedback' && jobId) {
            onRedirect(redirectTo, jobId);
          } else {
            onRedirect(redirectTo);
          }
        }
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isOpen, autoClose, duration, onClose, redirectTo, onRedirect]);

  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-gradient-to-r from-green-500 to-emerald-600',
          icon: '✅',
          border: 'border-green-400'
        };
      case 'error':
        return {
          bg: 'bg-gradient-to-r from-red-500 to-rose-600',
          icon: '❌',
          border: 'border-red-400'
        };
      case 'warning':
        return {
          bg: 'bg-gradient-to-r from-yellow-500 to-orange-600',
          icon: '⚠️',
          border: 'border-yellow-400'
        };
      case 'info':
        return {
          bg: 'bg-gradient-to-r from-blue-500 to-purple-600',
          icon: 'ℹ️',
          border: 'border-blue-400'
        };
      default:
        return {
          bg: 'bg-gradient-to-r from-blue-500 to-purple-600',
          icon: '✨',
          border: 'border-blue-400'
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Popup */}
      <div className={`
        relative bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl 
        border ${styles.border} border-opacity-30 p-8 max-w-md w-full
        transform transition-all duration-300 scale-100 animate-bounce-in
      `}>
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Content */}
        <div className="text-center">
          {/* Icon */}
          <div className={`
            w-20 h-20 ${styles.bg} rounded-full flex items-center justify-center 
            mx-auto mb-6 shadow-lg transform animate-pulse
          `}>
            <span className="text-3xl">{styles.icon}</span>
          </div>

          {/* Title */}
          <h3 className="text-2xl font-bold text-white mb-4">
            {title}
          </h3>

          {/* Message */}
          <p className="text-white/80 text-lg mb-6 leading-relaxed">
            {message}
          </p>

          {/* Progress bar for auto-close */}
          {autoClose && (
            <div className="w-full bg-white/20 rounded-full h-1 mb-4 overflow-hidden">
              <div 
                className={`h-full ${styles.bg} rounded-full animate-progress`}
                style={{
                  animation: `progress ${duration}ms linear forwards`
                }}
              />
            </div>
          )}

          {/* Action button */}
          <button
            onClick={() => {
              onClose();
              if (redirectTo && onRedirect) {
                if (redirectTo === 'feedback' && jobId) {
                  onRedirect(redirectTo, jobId);
                } else {
                  onRedirect(redirectTo);
                }
              }
            }}
            className={`
              px-8 py-3 ${styles.bg} text-white font-semibold rounded-xl
              hover:shadow-lg transform hover:scale-105 transition-all duration-200
              focus:outline-none focus:ring-4 focus:ring-white/20
            `}
          >
            {redirectTo ? 'Continue' : 'OK'}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes bounce-in {
          0% {
            transform: scale(0.3) rotate(-10deg);
            opacity: 0;
          }
          50% {
            transform: scale(1.05) rotate(2deg);
          }
          70% {
            transform: scale(0.9) rotate(-1deg);
          }
          100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }

        @keyframes progress {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }

        .animate-bounce-in {
          animation: bounce-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }

        .animate-progress {
          animation: progress ${duration}ms linear forwards;
        }
      `}</style>
    </div>
  );
}
