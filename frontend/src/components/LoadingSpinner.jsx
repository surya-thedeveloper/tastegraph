export default function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <div className="loading-spinner">
      <div className="loading-spinner__ring" />
      <span>{message}</span>
    </div>
  );
}
