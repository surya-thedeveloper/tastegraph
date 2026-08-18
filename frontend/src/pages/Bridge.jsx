import { useState, useEffect } from 'react';
import { api } from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorBanner from '../components/ErrorBanner';

export default function Bridge() {
  const [ingredients, setIngredients] = useState([]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [result, setResult] = useState(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);
  const [ingLoading, setIngLoading] = useState(true);

  useEffect(() => {
    api.ingredients.search('').then(data => {
      setIngredients(data);
      if (data.length >= 2) {
        setFrom(data.find(i => i.id === 'dark-chocolate')?.id || data[0].id);
        setTo(data.find(i => i.id === 'lavender')?.id || data[1].id);
      }
    }).finally(() => setIngLoading(false));
  }, []);

  async function handleSearch(e) {
    e.preventDefault();
    if (!from || !to || from === to) return;

    setSearching(true);
    setResult(null);
    setError(null);

    try {
      const data = await api.graph.bridge(from, to);
      setResult(data);
    } catch (err) {
      if (err.status === 404) {
        setError(`No path found within 8 hops between these two nodes.`);
      } else {
        setError(err.message);
      }
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="container page">
      <div className="section-header" style={{ marginBottom: 24 }}>
        <h1>Shortest Path Cypher Query</h1>
        <p>
          Calculates graph shortest path using Cypher's native <code>shortestPath((a)-[:PAIRS_WITH*..8]-(b))</code> algorithm.
        </p>
      </div>

      {ingLoading ? (
        <LoadingSpinner message="Loading nodes..." />
      ) : (
        <form className="bridge-form" onSubmit={handleSearch}>
          <div className="bridge-form__field">
            <label className="bridge-form__label">Start Node</label>
            <select value={from} onChange={e => { setFrom(e.target.value); setResult(null); setError(null); }}>
              {ingredients.map(i => (
                <option key={i.id} value={i.id}>{i.name}</option>
              ))}
            </select>
          </div>

          <div style={{ paddingBottom: 8, color: 'var(--text-dim)' }}>→</div>

          <div className="bridge-form__field">
            <label className="bridge-form__label">Target Node</label>
            <select value={to} onChange={e => { setTo(e.target.value); setResult(null); setError(null); }}>
              {ingredients.map(i => (
                <option key={i.id} value={i.id} disabled={i.id === from}>{i.name}</option>
              ))}
            </select>
          </div>

          <button type="submit" className="btn btn-primary" disabled={searching || from === to}>
            {searching ? 'Querying...' : 'Find Shortest Path'}
          </button>
        </form>
      )}

      {searching && <LoadingSpinner message="Running shortestPath in CognoDB..." />}
      {error && <ErrorBanner message={error} />}

      {result && (
        <div className="fade-in">
          <div style={{ marginBottom: 16, fontSize: 14 }}>
            Path Length: <strong style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>{result.hops} hops</strong>
          </div>

          <div className="bridge-path">
            {result.bridge.map((node, i) => (
              <span key={`${node.id}-${i}`} style={{ display: 'contents' }}>
                <span className={`bridge-path__node${i === 0 || i === result.bridge.length - 1 ? ' bridge-path__node--highlight' : ''}`}>
                  {node.name}
                </span>
                {i < result.bridge.length - 1 && (
                  <span className="bridge-path__arrow">→</span>
                )}
              </span>
            ))}
          </div>

          <div style={{ marginTop: 24, padding: 16, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 12, color: 'var(--text-muted)' }}>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)', display: 'block', marginBottom: 4 }}>
              Cypher Query Executed:
            </span>
            <code>MATCH (a:Ingredient &#123;id: $from&#125;), (b:Ingredient &#123;id: $to&#125;) MATCH path = shortestPath((a)-[:PAIRS_WITH*..8]-(b)) RETURN nodes(path)</code>
          </div>
        </div>
      )}
    </div>
  );
}
