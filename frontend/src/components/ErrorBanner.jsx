export default function ErrorBanner({ message, onRetry }) {
  return (
    <div className="error-banner" role="alert">
      <span className="error-banner__icon">⚠</span>
      <div>
        <p>{message || 'Something went wrong. Please try again.'}</p>
        {onRetry && (
          <button
            className="btn btn-ghost"
            onClick={onRetry}
            style={{ marginTop: 8, padding: '4px 0', fontSize: 13 }}
          >
            Try again →
          </button>
        )}
      </div>
    </div>
  );
}
