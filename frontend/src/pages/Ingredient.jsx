import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import PairingCard from '../components/PairingCard';
import RecipeCard from '../components/RecipeCard';
import FlavorGraph from '../components/FlavorGraph';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorBanner from '../components/ErrorBanner';

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
      <LoadingSpinner message="Fetching graph node profile..." />
    </div>
  );

  if (error) return (
    <div className="container page">
      <ErrorBanner message={error} onRetry={() => window.location.reload()} />
    </div>
  );

  if (!ingredient) return null;

  return (
    <div className="container page">
      <button className="btn btn-secondary" onClick={() => navigate(-1)} style={{ marginBottom: 20 }}>
        ← Back
      </button>

      {/* Header */}
      <div className="ingredient-page__header">
        <div className="ingredient-page__top">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 className="ingredient-page__title">{ingredient.name}</h1>
              {ingredient.category && (
                <span className="badge badge-accent">{ingredient.category}</span>
              )}
            </div>
            <p className="ingredient-page__desc">{ingredient.description}</p>
          </div>
        </div>
      </div>

      {/* Grid layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 24, marginBottom: 36 }}>
        {/* Compounds list */}
        <div>
          <div className="section-header">
            <h2>Flavor Compounds</h2>
            <p>Volatile molecules contained in {ingredient.name}</p>
          </div>
          <div className="compounds-list">
            {(ingredient.compounds || []).map(fc => (
              <div key={fc.id} className="compound-row">
                <span className="compound-row__name">{fc.name}</span>
                <span className="compound-row__aroma">{fc.aroma_descriptor}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Network canvas */}
        <div>
          <div className="section-header">
            <h2>Network Subgraph</h2>
            <p>Interactive vis-network canvas of compound connections</p>
          </div>
          <FlavorGraph data={graphData} />
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab${activeTab === 'pairings' ? ' active' : ''}`}
          onClick={() => setActiveTab('pairings')}
        >
          2-Hop Pairings ({pairings.length})
        </button>
        <button
          className={`tab${activeTab === 'recipes' ? ' active' : ''}`}
          onClick={() => setActiveTab('recipes')}
        >
          Featured Recipes ({recipes.length})
        </button>
      </div>

      {activeTab === 'pairings' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {pairings.map(p => (
            <PairingCard key={p.id} pairing={p} />
          ))}
        </div>
      )}

      {activeTab === 'recipes' && (
        <div className="grid-2">
          {recipes.map(r => (
            <RecipeCard key={r.id} recipe={r} />
          ))}
        </div>
      )}
    </div>
  );
}
