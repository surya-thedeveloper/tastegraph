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
      // not fatal — just show nothing
    } finally {
      setSurpriseLoading(false);
    }
  }

  const filtered = category === 'All'
    ? ingredients
    : ingredients.filter(i => i.category === category);

  return (
    <div>
      {/* Hero */}
      <div className="home-hero container">
        <p className="home-hero__eyebrow">Flavor Science × Graph Database</p>
        <h1 className="home-hero__title">
          Why do some flavors<br />just <em>work</em>?
        </h1>
        <p className="home-hero__subtitle">
          TasteGraph maps the molecular connections between ingredients.
          Pick anything from chocolate to truffle and see what it pairs with — and why.
        </p>
        <div className="home-hero__search">
          <SearchBar
            onSearch={handleSearch}
            placeholder="Try 'coffee', 'truffle', or 'cardamom'..."
          />
        </div>

        {/* Category pills */}
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

      {/* Surprise pairing */}
      <div className="container home-surprise">
        {surprise ? (
          <div className="surprise-banner fade-in">
            <h3>Unexpected Pairing ✦</h3>
            <div className="surprise-banner__pair">
              <span
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(`/ingredient/${surprise.a.id}`)}
              >
                {surprise.a.emoji} {surprise.a.name}
              </span>
              <span className="surprise-banner__plus">+</span>
              <span
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(`/ingredient/${surprise.b.id}`)}
              >
                {surprise.b.emoji} {surprise.b.name}
              </span>
            </div>
            <p className="surprise-banner__compounds">
              Connected by: <strong style={{ color: 'var(--accent)' }}>{surprise.sharedCompounds.join(', ')}</strong>
            </p>
            <button className="btn btn-secondary" onClick={handleSurprise}>
              Another one →
            </button>
          </div>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <button
              id="surprise-me-btn"
              className="btn btn-secondary"
              onClick={handleSurprise}
              disabled={surpriseLoading}
              style={{ fontSize: '14px' }}
            >
              {surpriseLoading ? 'Finding a pairing...' : '✦ Surprise me'}
            </button>
            <p style={{ marginTop: 8, fontSize: 12, color: 'var(--text-dim)' }}>
              Find an unexpected cross-category flavor match
            </p>
          </div>
        )}
      </div>

      <hr className="divider" style={{ marginTop: 0 }} />

      {/* Ingredients grid */}
      <div className="container page" style={{ paddingTop: 0 }}>
        <div className="section-header">
          <h2>
            {query
              ? `Results for "${query}"`
              : category !== 'All'
              ? `${category} ingredients`
              : 'All ingredients'}
          </h2>
          {!loading && (
            <p>
              {filtered.length} ingredient{filtered.length !== 1 ? 's' : ''}
              {!query && ' — click any to explore its flavor profile'}
            </p>
          )}
        </div>

        {error ? (
          <ErrorBanner message={error} onRetry={() => load(query)} />
        ) : loading ? (
          <LoadingSpinner message="Checking the flavor network..." />
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">◌</div>
            <h3>Nothing found</h3>
            <p>Try a different search term — or clear the filter and browse everything.</p>
          </div>
        ) : (
          <div className="grid-3">
            {filtered.map(ing => (
              <IngredientCard key={ing.id} ingredient={ing} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
