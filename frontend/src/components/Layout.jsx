import { NavLink, Outlet } from 'react-router-dom';

export default function Layout() {
  return (
    <>
      <nav className="navbar" role="navigation" aria-label="Main navigation">
        <div className="container navbar__inner">
          <NavLink to="/" className="navbar__logo" aria-label="TasteGraph home">
            TasteGraph
            <span>flavor science</span>
          </NavLink>
          <ul className="navbar__links">
            <li><NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>Explore</NavLink></li>
            <li><NavLink to="/bridge" className={({ isActive }) => isActive ? 'active' : ''}>Bridge</NavLink></li>
          </ul>
        </div>
      </nav>
      <main>
        <Outlet />
      </main>
      <footer style={{
        borderTop: '1px solid var(--border)',
        padding: '24px',
        textAlign: 'center',
        fontSize: 12,
        color: 'var(--text-dim)'
      }}>
        TasteGraph — flavor pairing science meets graph databases.
        Data based on real flavor compound research.
      </footer>
    </>
  );
}
