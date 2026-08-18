import { NavLink, Outlet } from 'react-router-dom';

export default function Layout() {
  return (
    <>
      <nav className="navbar" role="navigation" aria-label="Main navigation">
        <div className="container navbar__inner">
          <NavLink to="/" className="navbar__logo" aria-label="TasteGraph home">
            TasteGraph
            <span className="navbar__logo-tag">openCypher</span>
          </NavLink>
          <ul className="navbar__links">
            <li><NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>Explorer</NavLink></li>
            <li><NavLink to="/bridge" className={({ isActive }) => isActive ? 'active' : ''}>Shortest Path</NavLink></li>
          </ul>
        </div>
      </nav>
      <main>
        <Outlet />
      </main>
      <footer style={{
        borderTop: '1px solid var(--border)',
        padding: '20px',
        textAlign: 'center',
        fontSize: '12px',
        color: 'var(--text-dim)'
      }}>
        TasteGraph · Backed by CognoDB Graph DB & Neo4j Driver · Take-home submission
      </footer>
    </>
  );
}
