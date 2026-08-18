import { useNavigate } from 'react-router-dom';

export default function IngredientCard({ ingredient }) {
  const navigate = useNavigate();
  const { id, name, description, emoji, category } = ingredient;

  return (
    <div
      className="ingredient-card fade-in"
      onClick={() => navigate(`/ingredient/${id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/ingredient/${id}`)}
    >
      <div className="ingredient-card__header">
        <div className="ingredient-card__name">
          {emoji && <span style={{ marginRight: 6 }}>{emoji}</span>}
          {name}
        </div>
        {category && <span className="badge badge-accent">{category}</span>}
      </div>
      <div className="ingredient-card__desc">{description}</div>
      <div className="ingredient-card__footer">
        <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>View compounds & graph →</span>
      </div>
    </div>
  );
}
