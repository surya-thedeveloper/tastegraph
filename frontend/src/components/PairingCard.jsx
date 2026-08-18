import { useNavigate } from 'react-router-dom';

export default function PairingCard({ pairing, sourceId }) {
  const navigate = useNavigate();
  const { id, name, emoji, sharedCompounds, overlap } = pairing;

  return (
    <div
      className="pairing-card fade-in"
      onClick={() => navigate(`/ingredient/${id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/ingredient/${id}`)}
      aria-label={`Explore ${name} pairing`}
    >
      <div className="pairing-card__emoji">{emoji || '●'}</div>
      <div className="pairing-card__body">
        <div className="pairing-card__name">{name}</div>
        <div className="pairing-card__compounds">
          {sharedCompounds.slice(0, 3).map((c) => (
            <span key={c} className="pairing-card__compound-tag">{c}</span>
          ))}
          {sharedCompounds.length > 3 && (
            <span className="pairing-card__compound-tag">+{sharedCompounds.length - 3}</span>
          )}
        </div>
      </div>
      <div className="pairing-card__score" title={`${overlap} shared compound${overlap !== 1 ? 's' : ''}`}>
        {overlap}
      </div>
    </div>
  );
}
