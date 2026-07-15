import { filterProducts } from "./invoiceFormUtils";

function ProductOptions({ item, items, products, onProductSelect }) {
  if (products.length === 0) {
    return (
      <div
        id={`invoice-product-options-${item.key}`}
        className="invoice-product-options"
        role="listbox"
      >
        <div className="invoice-product-empty">No products found</div>
      </div>
    );
  }

  return (
    <div
      id={`invoice-product-options-${item.key}`}
      className="invoice-product-options"
      role="listbox"
    >
      {products.map((product) => {
        const selectedElsewhere = items.some(
          (currentItem) =>
            currentItem.key !== item.key &&
            Number(currentItem.product_id) === product.id
        );

        return (
          <button
            key={product.id}
            type="button"
            className="invoice-product-option"
            role="option"
            disabled={selectedElsewhere}
            aria-selected={Number(item.product_id) === product.id}
            onMouseDown={(event) => {
              event.preventDefault();
              onProductSelect(item.key, product);
            }}
          >
            <span>
              <strong>{product.name}</strong>
              <small>
                {product.barcode ? `Barcode: ${product.barcode}` : "No barcode"}
              </small>
            </span>
            <span>
              <strong>{Number(product.selling_price).toFixed(2)}</strong>
              <small>Stock: {product.stock_quantity}</small>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function ProductSelector({
  item,
  items,
  products,
  isOpen,
  onProductSearch,
  onProductSelect,
  onOpen,
  onClose,
}) {
  const matchingProducts = filterProducts(products, item.product_search);

  return (
    <div className="invoice-line-field invoice-product-field">
      <label htmlFor={`invoice-product-${item.key}`}>Product</label>

      <div className="invoice-product-combobox">
        <input
          id={`invoice-product-${item.key}`}
          role="combobox"
          autoComplete="off"
          aria-expanded={isOpen}
          aria-controls={`invoice-product-options-${item.key}`}
          value={item.product_search}
          placeholder="Search name or barcode"
          onChange={(event) => onProductSearch(item.key, event.target.value)}
          onFocus={onOpen}
          onClick={onOpen}
          onBlur={onClose}
        />
        <span className="invoice-combobox-arrow" aria-hidden="true">⌄</span>

        {isOpen && (
          <ProductOptions
            item={item}
            items={items}
            products={matchingProducts}
            onProductSelect={onProductSelect}
          />
        )}
      </div>
    </div>
  );
}

export default ProductSelector;
