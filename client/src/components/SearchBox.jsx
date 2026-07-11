import "./SearchBox.css";

function SearchBox({
  value,
  onChange,
  label = "Search",
  placeholder = "Search...",
  maxLength = 100,
}) {
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
          onChange={(event) =>
            onChange(event.target.value)
          }
          placeholder={placeholder}
          maxLength={maxLength}
          autoComplete="off"
        />

        {value && (
          <button
            type="button"
            className="clear-search-button"
            onClick={() => onChange("")}
          >
            Clear
          </button>
        )}
      </div>
    </section>
  );
}

export default SearchBox;