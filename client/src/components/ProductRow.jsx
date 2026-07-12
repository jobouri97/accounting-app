import "./ProductRow.css";

function ProductRow({
    product,
    onDeleteProduct,
    onEditProduct,
    onOpenStockHistory,
}) {
    const formattedPrice = Number(product.price).toFixed(2);

    const stockQuantity = Number(product.stock_quantity);

    return (
        <tr>
            <td>
                #{product.id}
            </td>

            <td>
                <div className="product-name-cell">
                    <div className="product-icon">
                        {product.name
                            ? product.name.charAt(0).toUpperCase()
                            : "P"}
                    </div>

                    <div>
                        <strong>{product.name}</strong>

                        <span className="product-user-id">
                            User ID: {product.user_id}
                        </span>
                    </div>
                </div>
            </td>

            <td>
                <span className="product-barcode">
                    {product.barcode || "—"}
                </span>
            </td>

            <td>
                ${formattedPrice}
            </td>

            <td>
                <button
                    type="button"
                    className={
                        stockQuantity > 0
                            ? "stock-badge stock-button available"
                            : "stock-badge stock-button unavailable"
                    }
                    onClick={() => onOpenStockHistory(product.id)}
                    title={`View stock history for ${product.name}`}
                >
                    {stockQuantity > 0
                        ? `${stockQuantity} in stock`
                        : "Out of stock"}
                </button>
            </td>

            <td>
                <div className="product-actions">
                    <button
                        className="edit-button"
                        type="button"
                        onClick={() => onEditProduct(product)}
                    >
                        Edit
                    </button>

                    <button
                        className="delete-button"
                        type="button"
                        onClick={() => onDeleteProduct(product.id)}
                    >
                        Delete
                    </button>
                </div>
            </td>
        </tr>
    );
}

export default ProductRow;