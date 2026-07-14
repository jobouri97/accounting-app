function BarcodeSection({ barcodeValue, onBarcodeChange, onBarcodeKeyDown, onAddItem }) {
  return (
    <div className="invoice-barcode-field">
      <label htmlFor="invoice-barcode">Scan Barcode</label>

      <div className="invoice-barcode-controls">
        <div className="invoice-barcode-input">
          <span aria-hidden="true">▥</span>
          <input
            id="invoice-barcode"
            value={barcodeValue}
            onChange={onBarcodeChange}
            onKeyDown={onBarcodeKeyDown}
            autoComplete="off"
            placeholder="Scan or enter a product barcode"
          />
        </div>

        <button type="button" className="add-invoice-item" onClick={onAddItem}>
          + Add Product
        </button>
      </div>

      <small>Enter or scan a barcode, then press Enter to add the product.</small>
    </div>
  );
}

export default BarcodeSection;
