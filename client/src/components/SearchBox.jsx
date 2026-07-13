import { useEffect, useState } from "react";
import "./SearchBox.css";

function SearchBox({
  onSearch,
  onPageReset,
  label = "Search",
  placeholder = "Search...",
  maxLength = 100,
  debounceMs = 300,
}) {
  const [value, setValue] = useState("");

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      onPageReset?.(1);
      onSearch(value.trim());
    }, debounceMs);

    return () => window.clearTimeout(timeoutId);
  }, [value, debounceMs, onSearch, onPageReset]);

  return (
    <section className="search-box">
      <label htmlFor="search-input">
        {label}
      </label>

      <div className="search-box-row">
        <input
          id="search-input"
          type="search"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          autoComplete="off"
        />
      </div>
    </section>
  );
}

export default SearchBox;
