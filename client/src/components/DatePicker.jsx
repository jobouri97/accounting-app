import { useEffect, useRef, useState } from "react";

function parseDate(value) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDateValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(value) {
  const date = parseDate(value);
  if (!date) return "Select date";

  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function DatePicker({ label, value, onChange, min = "", max = "" }) {
  const containerRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const selectedDate = parseDate(value) || new Date();
    return new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
  });

  useEffect(() => {
    function handleOutsideClick(event) {
      if (!containerRef.current?.contains(event.target)) setIsOpen(false);
    }

    function handleEscape(event) {
      if (event.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function toggleCalendar() {
    if (!isOpen) {
      const selectedDate = parseDate(value) || new Date();
      setVisibleMonth(
        new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
      );
    }
    setIsOpen((currentValue) => !currentValue);
  }

  function changeMonth(amount) {
    setVisibleMonth(
      (currentMonth) =>
        new Date(currentMonth.getFullYear(), currentMonth.getMonth() + amount, 1)
    );
  }

  function selectDate(date) {
    onChange(formatDateValue(date));
    setIsOpen(false);
  }

  function selectToday() {
    const today = new Date();
    const todayValue = formatDateValue(today);
    if ((min && todayValue < min) || (max && todayValue > max)) return;
    onChange(todayValue);
    setIsOpen(false);
  }

  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const calendarCells = [];

  for (let index = 0; index < firstWeekday; index += 1) {
    calendarCells.push(<span key={`empty-${index}`} className="date-picker-empty" />);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day);
    const dateValue = formatDateValue(date);
    const isSelected = dateValue === value;
    const isToday = dateValue === formatDateValue(new Date());
    const isDisabled = (min && dateValue < min) || (max && dateValue > max);

    calendarCells.push(
      <button
        type="button"
        key={dateValue}
        className={`date-picker-day${isSelected ? " selected" : ""}${
          isToday ? " today" : ""
        }`}
        disabled={isDisabled}
        aria-pressed={isSelected}
        onClick={() => selectDate(date)}
      >
        {day}
      </button>
    );
  }

  return (
    <div className="date-picker" ref={containerRef}>
      <span className="date-picker-label">{label}</span>

      <button
        type="button"
        className={`date-picker-trigger${isOpen ? " open" : ""}`}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={toggleCalendar}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 2v4M18 2v4M3 9h18M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2Z" />
        </svg>
        <span className={value ? "" : "placeholder"}>{formatDisplayDate(value)}</span>
        <span className="date-picker-chevron" aria-hidden="true">⌄</span>
      </button>

      {isOpen && (
        <div className="date-picker-popover" role="dialog" aria-label={`${label} calendar`}>
          <div className="date-picker-header">
            <strong>
              {visibleMonth.toLocaleDateString(undefined, {
                month: "long",
                year: "numeric",
              })}
            </strong>
            <div className="date-picker-navigation">
              <button type="button" onClick={() => changeMonth(-1)} aria-label="Previous month">
                ‹
              </button>
              <button type="button" onClick={() => changeMonth(1)} aria-label="Next month">
                ›
              </button>
            </div>
          </div>

          <div className="date-picker-weekdays" aria-hidden="true">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>

          <div className="date-picker-grid">{calendarCells}</div>

          <div className="date-picker-footer">
            <button type="button" onClick={() => onChange("")} disabled={!value}>
              Clear
            </button>
            <button type="button" onClick={selectToday}>
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DatePicker;
