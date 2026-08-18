// Base URL — in prod this comes from an env var set in Vercel dashboard
const BASE = import.meta.env.VITE_API_URL || '';

async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw Object.assign(new Error(err.message || 'Request failed'), { status: res.status });
  }
  return res.json();
}

export const api = {
  ingredients: {
    search: (q = '') => apiFetch(`/api/ingredients${q ? `?q=${encodeURIComponent(q)}` : ''}`),
    get: (id) => apiFetch(`/api/ingredients/${id}`),
    recipes: (id) => apiFetch(`/api/ingredients/${id}/recipes`),
  },
  pairings: {
    get: (id) => apiFetch(`/api/pairings/${id}`),
    recipes: (id1, id2) => apiFetch(`/api/pairings/${id1}/with/${id2}/recipes`),
    surprise: () => apiFetch('/api/pairings/surprise/pick'),
  },
  recipes: {
    all: () => apiFetch('/api/recipes'),
  },
  graph: {
    get: (id) => apiFetch(`/api/graph/${id}`),
    bridge: (from, to) => apiFetch(`/api/graph/bridge/path?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`),
  },
};
