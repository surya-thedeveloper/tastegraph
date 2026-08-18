import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import SearchBar from '../components/SearchBar';
import IngredientCard from '../components/IngredientCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorBanner from '../components/ErrorBanner';

const CATEGORIES = ['All', 'Roasted', 'Sweet', 'Umami', 'Earthy', 'Floral', 'Citrus', 'Spice', 'Fruity', 'Dairy', 'Smoky'];

export default function Home() {
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [surprise, setSurprise] = useState(null);
  const [surpriseLoading, setSurpriseLoading] = useState(false);
  const navigate = useNavigate();

  const load = useCallback(async (q = '') => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.ingredients.search(q);
      setIngredients(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function handleSearch(q) {
    setQuery(q);
    setCategory('All');
    load(q);
  }

  async function handleSurprise() {
    setSurpriseLoading(true);
    setSurprise(null);
    try {
      const data = await api.pairings.surprise();
      setSurprise(data);
    } catch (err) {
      // quiet fallback
    } finally {
      setSurpriseLoading(false);
    }
  }

  const filtered = category === 'All'
    ? ingredients
    : ingredients.filter(i => i.category === category);

  return (
    <div className="container page">
      {/* Header */}
      <div className="home-hero">
        <div className="home-hero__header">
          <h1 className="home-hero__title">TasteGraph</h1>
          <p className="home-hero__subtitle">
            A graph application mapping molecular flavor connections. Select an ingredient to see 
            shared aromatic compounds, multi-hop pairings, and graph traversals.
          </p>
        </div>

        <SearchBar
          onSearch={handleSearch}
          placeholder="Filter by ingredient name (e.g. coffee, miso, cardamom)..."
        />

        {/* Category Pills */}
        <div className="home-categories">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`category-pill${category === cat ? ' active' : ''}`}
              onClick={() => { setCategory(cat); setQuery(''); }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Surprise Pairing Generator */}
      {surprise ? (
        <div className="surprise-box fade-in">
          <div className="surprise-box__info">
            <span className="badge badge-hot">Cross-Category Match</span>
            <div className="surprise-box__pair">
              <span style={{ cursor: 'pointer' }} onClick={() => navigate(`/ingredient/${surprise.a.id}`)}>
                {surprise.a.emoji} {surprise.a.name}
              </span>
              <span style={{ margin: '0 8px', color: 'var(--text-dim)' }}>+</span>
              <span style={{ cursor: 'pointer' }} onClick={() => navigate(`/ingredient/${surprise.b.id}`)}>
                {surprise.b.emoji} {surprise.b.name}
              </span>
            </div>
            <span className="surprise-box__compounds">
              [{surprise.sharedCompounds.join(', ')}]
            </span>
          </div>
          <button className="btn btn-secondary" onClick={handleSurprise}>
            Randomize →
          </button>
        </div>
      ) : (
        <div style={{ marginBottom: 24 }}>
          <button
            className="btn btn-secondary"
            onClick={handleSurprise}
            disabled={surpriseLoading}
          >
            {surpriseLoading ? 'Querying Cypher...' : '🎲 Random Cross-Category Match'}
          </button>
        </div>
      )}

      {/* Results grid */}
      <div className="section-header">
        <h2>
          {query
            ? `Search: "${query}"`
            : category !== 'All'
            ? `${category} Category`
            : 'All Ingredients'}
        </h2>
        {!loading && (
          <p>{filtered.length} nodes loaded from CognoDB</p>
        )}
      </div>

      {error ? (
        <ErrorBanner message={error} onRetry={() => load(query)} />
      ) : loading ? (
        <LoadingSpinner message="Querying CognoDB..." />
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <h3>No matching ingredients found</h3>
          <p>Try searching for another keyword or select 'All'.</p>
        </div>
      ) : (
        <div className="grid-3">
          {filtered.map(ing => (
            <IngredientCard key={ing.id} ingredient={ing} />
          ))}
        </div>
      )}
    </div>
  );
}
