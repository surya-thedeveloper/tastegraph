export default function RecipeCard({ recipe }) {
  const { title, description, difficulty, why_it_works, otherIngredients } = recipe;

  return (
    <div className="recipe-card fade-in">
      <div className="recipe-card__header">
        <div className="recipe-card__title">{title}</div>
        <span className={`recipe-card__difficulty recipe-card__difficulty--${difficulty}`}>
          {difficulty}
        </span>
      </div>

      {description && (
        <p className="recipe-card__desc">{description}</p>
      )}

      {why_it_works && (
        <div className="recipe-card__why">
          <strong style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--accent)', fontStyle: 'normal' }}>
            Why it works
          </strong>
          <br />
          {why_it_works}
        </div>
      )}

      {otherIngredients && otherIngredients.length > 0 && (
        <div className="recipe-card__ingredients">
          {otherIngredients.map((ing) => (
            <span key={ing.id} className="recipe-card__ingredient-tag">
              {ing.emoji} {ing.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
