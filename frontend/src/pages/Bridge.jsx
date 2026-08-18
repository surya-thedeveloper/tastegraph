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
        setError(`No flavor connection found between these two ingredients. They don't share any compounds within 8 hops.`);
      } else {
        setError(err.message);
      }
    } finally {
      setSearching(false);
    }
  }

  const fromIng = ingredients.find(i => i.id === from);
  const toIng   = ingredients.find(i => i.id === to);

  return (
    <div className="container page">
      {/* Header */}
      <div className="bridge-page__header">
        <h1>Flavor Bridge</h1>
        <p>
          Find the shortest flavor path between two seemingly unrelated ingredients.
          How many hops does it take to get from dark chocolate to lavender?
        </p>
      </div>

      {/* Form */}
      {ingLoading ? (
        <LoadingSpinner message="Loading ingredients..." />
      ) : (
        <form className="bridge-form" onSubmit={handleSearch} id="bridge-form">
          <div className="bridge-form__field">
            <label className="bridge-form__label" htmlFor="bridge-from">Start with</label>
            <select
              id="bridge-from"
              value={from}
              onChange={e => { setFrom(e.target.value); setResult(null); setError(null); }}
            >
              {ingredients.map(i => (
                <option key={i.id} value={i.id}>{i.emoji} {i.name}</option>
              ))}
            </select>
          </div>

          <div className="bridge-connector">→</div>

          <div className="bridge-form__field">
            <label className="bridge-form__label" htmlFor="bridge-to">Connect to</label>
            <select
              id="bridge-to"
              value={to}
              onChange={e => { setTo(e.target.value); setResult(null); setError(null); }}
            >
              {ingredients.map(i => (
                <option key={i.id} value={i.id} disabled={i.id === from}>
                  {i.emoji} {i.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={searching || from === to}
            style={{ flexShrink: 0 }}
          >
            {searching ? 'Searching...' : 'Find path'}
          </button>
        </form>
      )}

      {/* Results */}
      {searching && <LoadingSpinner message="Traversing the flavor graph..." />}

      {error && <ErrorBanner message={error} />}

      {result && (
        <div className="fade-in">
          <div className="bridge-result__hops">
            <strong>{result.hops}</strong>
            <span>hop{result.hops !== 1 ? 's' : ''} between {fromIng?.name} and {toIng?.name}</span>
          </div>

          <div className="bridge-path">
            {result.bridge.map((node, i) => (
              <span key={`${node.id}-${i}`} style={{ display: 'contents' }}>
                <span
                  className={`bridge-path__node${i === 0 || i === result.bridge.length - 1 ? ' bridge-path__node--start' : ''}`}
                >
                  {node.emoji ? `${node.emoji} ` : ''}{node.name}
                </span>
                {i < result.bridge.length - 1 && (
                  <span className="bridge-path__arrow">→</span>
                )}
              </span>
            ))}
          </div>

          <div style={{ marginTop: 24, padding: '16px 20px', background: 'var(--surface)', borderRadius: 'var(--radius)', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--accent)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Why this matters
            </strong>
            <br />
            This path shows the chain of compound overlaps connecting the two ingredients.
            Each hop is a shared flavor molecule — a relay station in the graph.
            {result.hops === 1 && ' A direct 1-hop connection means they share at least one flavor compound directly.'}
            {result.hops === 2 && ' A 2-hop connection means they don\'t share compounds directly, but both pair with a common third ingredient.'}
            {result.hops > 2 && ` At ${result.hops} hops, this is a longer chain — but the molecular logic still holds at each step.`}
          </div>
        </div>
      )}

      {/* Explainer */}
      {!result && !error && !searching && (
        <div style={{ marginTop: 48 }}>
          <div className="section-header">
            <h2>How this works</h2>
            <p>The shortest path query is a good example of where graph databases shine</p>
          </div>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24 }}>
            <pre style={{ fontSize: 12, color: 'var(--accent)', overflowX: 'auto', fontFamily: 'monospace', lineHeight: 1.7 }}>
{`MATCH (a:Ingredient {id: $from}), (b:Ingredient {id: $to})
MATCH path = shortestPath((a)-[:PAIRS_WITH*..8]-(b))
RETURN [n IN nodes(path) | {id: n.id, name: n.name}] AS bridge,
       length(path) AS hops`}
            </pre>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 16, lineHeight: 1.6 }}>
              This is a single Cypher query. In SQL, you'd need recursive CTEs or application-side BFS with multiple round trips.
              The graph model makes shortest-path trivial to express.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
