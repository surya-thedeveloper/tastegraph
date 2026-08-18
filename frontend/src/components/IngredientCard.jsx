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
      aria-label={`View ${name} flavor profile`}
    >
      <div className="ingredient-card__emoji">{emoji || '●'}</div>
      <div className="ingredient-card__name">{name}</div>
      <div className="ingredient-card__desc">{description}</div>
      <div className="ingredient-card__meta">
        {category && <span className="badge badge-accent">{category}</span>}
      </div>
    </div>
  );
}
