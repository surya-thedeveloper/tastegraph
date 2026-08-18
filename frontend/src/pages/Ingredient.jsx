import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import PairingCard from '../components/PairingCard';
import RecipeCard from '../components/RecipeCard';
import FlavorGraph from '../components/FlavorGraph';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorBanner from '../components/ErrorBanner';

const AMOUNT_ORDER = { dominant: 0, moderate: 1, trace: 2 };

export default function Ingredient() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [ingredient, setIngredient] = useState(null);
  const [pairings, setPairings] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [graphData, setGraphData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('pairings');

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      setIngredient(null);
      setPairings([]);
      setRecipes([]);
      setGraphData(null);

      try {
        // load ingredient + pairings + recipes in parallel
        const [ing, pairs, recs, graph] = await Promise.all([
          api.ingredients.get(id),
          api.pairings.get(id),
          api.ingredients.recipes(id),
          api.graph.get(id),
        ]);
        setIngredient(ing);
        setPairings(pairs);
        setRecipes(recs);
        setGraphData(graph);
      } catch (err) {
        if (err.status === 404) {
          navigate('/', { replace: true });
        } else {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id, navigate]);

  if (loading) return (
    <div className="container page">
      <LoadingSpinner message="Loading flavor profile..." />
    </div>
  );

  if (error) return (
    <div className="container page">
      <ErrorBanner message={error} onRetry={() => window.location.reload()} />
    </div>
  );

  if (!ingredient) return null;

  const sortedCompounds = [...(ingredient.compounds || [])].sort(
    (a, b) => (AMOUNT_ORDER[a.amount] ?? 3) - (AMOUNT_ORDER[b.amount] ?? 3)
  );

  return (
    <div>
      {/* Header */}
      <div className="ingredient-page__header">
        <div className="container">
          <button className="btn btn-ghost" onClick={() => navigate(-1)} style={{ marginBottom: 24, padding: '4px 0' }}>
            ← Back
          </button>
          <div className="ingredient-page__top">
            <div className="ingredient-page__emoji">{ingredient.emoji || '●'}</div>
            <div className="ingredient-page__meta">
              <h1>{ingredient.name}</h1>
              <p className="ingredient-page__desc">{ingredient.description}</p>
              {ingredient.origin && (
                <p className="ingredient-page__origin">Origin: {ingredient.origin}</p>
              )}
              <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                {ingredient.category && (
                  <span className="badge badge-accent">{ingredient.category}</span>
                )}
                <span className="badge badge-green">{sortedCompounds.length} flavor compounds</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container page" style={{ paddingTop: 0 }}>
        {/* Two-column layout: compounds + graph */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 48 }}>
          {/* Compounds */}
          <div>
            <div className="section-header">
              <h2>Flavor Compounds</h2>
              <p>What makes {ingredient.name} smell and taste the way it does</p>
            </div>
            {sortedCompounds.length === 0 ? (
              <div className="empty-state"><p>No compound data available</p></div>
            ) : (
              <div className="compounds-list">
                {sortedCompounds.map(fc => (
                  <div key={fc.id} className="compound-row">
                    <div
                      className="compound-row__amount"
                      style={{
                        background: fc.amount === 'dominant' ? 'var(--accent-hot)'
                          : fc.amount === 'moderate' ? 'var(--accent)'
                          : 'var(--text-dim)'
                      }}
                      title={fc.amount}
                    />
                    <div className="compound-row__name">{fc.name}</div>
                    <div className="compound-row__aroma">{fc.aroma_descriptor}</div>
                    <div className="compound-row__class">{fc.chemical_class}</div>
                  </div>
                ))}
                <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 8 }}>
                  ● dominant  ● moderate  ● trace
                </p>
              </div>
            )}
          </div>

          {/* Graph */}
          <div>
            <div className="section-header">
              <h2>Compound Network</h2>
              <p>How {ingredient.name} connects to other ingredients through shared compounds</p>
            </div>
            <FlavorGraph data={graphData} />
          </div>
        </div>

        {/* Tabs: Pairings / Recipes */}
        <div className="tabs">
          <button
            className={`tab${activeTab === 'pairings' ? ' active' : ''}`}
            onClick={() => setActiveTab('pairings')}
          >
            Pairs well with ({pairings.length})
          </button>
          <button
            className={`tab${activeTab === 'recipes' ? ' active' : ''}`}
            onClick={() => setActiveTab('recipes')}
          >
            Recipes ({recipes.length})
          </button>
        </div>

        {activeTab === 'pairings' && (
          <div>
            {pairings.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state__icon">◌</div>
                <h3>No pairings found</h3>
                <p>This ingredient doesn't share enough compounds with others in the database yet.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>
                  Ranked by number of shared flavor compounds — the more overlap, the more natural the pairing.
                </p>
                {pairings.map(p => (
                  <PairingCard key={p.id} pairing={p} sourceId={id} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'recipes' && (
          <div>
            {recipes.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state__icon">◌</div>
                <h3>No recipes yet</h3>
                <p>We don't have any recipes featuring {ingredient.name} in the database yet.</p>
              </div>
            ) : (
              <div className="grid-2">
                {recipes.map(r => (
                  <RecipeCard key={r.id} recipe={r} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
