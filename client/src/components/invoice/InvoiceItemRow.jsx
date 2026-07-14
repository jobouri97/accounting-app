import ProductSelector from "./ProductSelector";
import { calculateLineTotal } from "./invoiceFormUtils";

function InvoiceItemRow({
  item,
  lineNumber,
  items,
  products,
  product,
  isProductListOpen,
  onUpdateItem,
  onProductSearch,
  onProductSelect,
  onProductListOpen,
  onProductListClose,
  onRemoveItem,
}) {
  const lineTotal = calculateLineTotal(item, product);

  return (
    <div className="invoice-line">
      <span className="invoice-line-number">{lineNumber}</span>

      <ProductSelector
        item={item}
        items={items}
        products={products}
        isOpen={isProductListOpen}
        onProductSearch={onProductSearch}
        onProductSelect={onProductSelect}
        onOpen={onProductListOpen}
        onClose={onProductListClose}
      />

      <div className="invoice-line-field">
        <label htmlFor={`invoice-quantity-${item.key}`}>Quantity</label>
        <input
          id={`invoice-quantity-${item.key}`}
          type="number"
          min="1"
          step="1"
          value={item.quantity}
          onChange={(event) => onUpdateItem(item.key, "quantity", event.target.value)}
        />
      </div>

      <div className="invoice-line-field">
        <label htmlFor={`invoice-discount-${item.key}`}>Discount</label>
        <input
          id={`invoice-discount-${item.key}`}
          type="number"
          min="0"
          step="0.01"
          value={item.discount}
          onChange={(event) => onUpdateItem(item.key, "discount", event.target.value)}
        />
      </div>

      <div className="invoice-line-price">
        <span>Unit Price</span>
        <strong>{product ? Number(product.selling_price).toFixed(2) : "0.00"}</strong>
      </div>

      <div className="invoice-line-price invoice-line-total">
        <span>Line Total</span>
        <strong>{Math.max(0, lineTotal).toFixed(2)}</strong>
      </div>

      <button
        type="button"
        className="remove-invoice-item"
        aria-label={`Remove line ${lineNumber}`}
        disabled={items.length === 1}
        onClick={() => onRemoveItem(item.key)}
      >
        ×
      </button>
    </div>
  );
}

export default InvoiceItemRow;
