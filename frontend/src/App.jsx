import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Ingredient from './pages/Ingredient';
import Bridge from './pages/Bridge';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="ingredient/:id" element={<Ingredient />} />
          <Route path="bridge" element={<Bridge />} />
          <Route path="*" element={
            <div className="container page" style={{ textAlign: 'center' }}>
              <h1 style={{ fontSize: '4rem', color: 'var(--accent)' }}>404</h1>
              <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>
                This page doesn't exist. <a href="/">Go back home →</a>
              </p>
            </div>
          } />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
