import { useNavigate } from 'react-router-dom';

export default function PairingCard({ pairing }) {
  const navigate = useNavigate();
  const { id, name, emoji, sharedCompounds, overlap } = pairing;

  return (
    <div
      className="pairing-card fade-in"
      onClick={() => navigate(`/ingredient/${id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/ingredient/${id}`)}
    >
      <div className="pairing-card__left">
        <div className="pairing-card__name">
          {emoji && <span style={{ marginRight: 6 }}>{emoji}</span>}
          {name}
        </div>
        <div className="pairing-card__compounds">
          {sharedCompounds.slice(0, 4).map((c) => (
            <span key={c} className="pairing-card__tag">
              {c}
            </span>
          ))}
          {sharedCompounds.length > 4 && (
            <span className="pairing-card__tag" style={{ opacity: 0.7 }}>
              +{sharedCompounds.length - 4} more
            </span>
          )}
        </div>
      </div>
      <div className="pairing-card__score" title={`${overlap} shared compounds`}>
        {overlap} {overlap === 1 ? 'match' : 'matches'}
      </div>
    </div>
  );
}
