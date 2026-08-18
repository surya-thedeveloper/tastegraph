import { useState, useRef } from 'react';

export default function SearchBar({ onSearch, placeholder }) {
  const [value, setValue] = useState('');
  const timer = useRef(null);

  function handleChange(e) {
    const q = e.target.value;
    setValue(q);
    // debounce — wait 280ms before firing search
    clearTimeout(timer.current);
    timer.current = setTimeout(() => onSearch(q), 280);
  }

  function handleSubmit(e) {
    e.preventDefault();
    clearTimeout(timer.current);
    onSearch(value);
  }

  return (
    <form className="search-bar" onSubmit={handleSubmit} role="search">
      <span className="search-bar__icon" aria-hidden="true">⌕</span>
      <input
        id="ingredient-search"
        type="search"
        value={value}
        onChange={handleChange}
        placeholder={placeholder || 'Search ingredients...'}
        autoComplete="off"
        spellCheck="false"
        aria-label="Search ingredients"
      />
    </form>
  );
}
