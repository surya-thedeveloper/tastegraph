import { useEffect, useRef } from 'react';
import { Network } from 'vis-network/standalone';

// Color map for node types
const NODE_COLORS = {
  ingredient: { background: '#d4a843', border: '#a87d28', font: { color: '#1c1410' } },
  compound:   { background: '#4a8c4a', border: '#2d5e2d', font: { color: '#f0e6d3' } },
  neighbor:   { background: '#382a1c', border: '#4a3828', font: { color: '#8a7a65' } },
};

export default function FlavorGraph({ data }) {
  const containerRef = useRef(null);
  const networkRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !data) return;

    const nodes = data.nodes.map(n => ({
      id: n.id,
      label: n.label,
      title: n.aroma || n.label,
      shape: n.type === 'compound' ? 'ellipse' : 'box',
      borderWidth: n.central ? 3 : 1,
      size: n.central ? 28 : n.type === 'compound' ? 20 : 16,
      ...NODE_COLORS[n.type],
      font: {
        ...(NODE_COLORS[n.type]?.font || {}),
        size: n.central ? 14 : 12,
        face: 'Inter, system-ui, sans-serif',
      },
    }));

    const edges = data.edges.map((e, i) => ({
      id: i,
      from: e.from,
      to: e.to,
      color: { color: '#4a3828', highlight: '#d4a843' },
      width: e.amount === 'dominant' ? 2.5 : e.amount === 'moderate' ? 1.5 : 1,
      dashes: e.amount === 'trace' || e.amount === 'shared',
    }));

    const options = {
      physics: {
        enabled: true,
        solver: 'forceAtlas2Based',
        forceAtlas2Based: { gravitationalConstant: -60, centralGravity: 0.01, springLength: 120 },
        stabilization: { iterations: 150 },
      },
      interaction: { hover: true, tooltipDelay: 200, zoomView: true },
      edges: { smooth: { type: 'continuous' } },
    };

    if (networkRef.current) {
      networkRef.current.destroy();
    }

    networkRef.current = new Network(
      containerRef.current,
      { nodes, edges },
      options
    );

    // stop physics after stabilization to avoid jitter
    networkRef.current.on('stabilized', () => {
      networkRef.current.setOptions({ physics: { enabled: false } });
    });

    return () => {
      if (networkRef.current) {
        networkRef.current.destroy();
        networkRef.current = null;
      }
    };
  }, [data]);

  if (!data || data.nodes.length === 0) {
    return (
      <div className="flavor-graph">
        <div className="empty-state" style={{ padding: '40px' }}>
          <div className="empty-state__icon">◌</div>
          <p>No graph data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flavor-graph">
      <div className="flavor-graph__canvas" ref={containerRef} />
      <div className="flavor-graph__legend">
        <div className="flavor-graph__legend-item">
          <div className="flavor-graph__dot" style={{ background: '#d4a843' }} />
          <span>Ingredient</span>
        </div>
        <div className="flavor-graph__legend-item">
          <div className="flavor-graph__dot" style={{ background: '#4a8c4a' }} />
          <span>Flavor Compound</span>
        </div>
        <div className="flavor-graph__legend-item">
          <div className="flavor-graph__dot" style={{ background: '#382a1c', border: '1px solid #4a3828' }} />
          <span>Connected Ingredient</span>
        </div>
        <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--text-dim)' }}>
          Drag to explore · Scroll to zoom
        </span>
      </div>
    </div>
  );
}
