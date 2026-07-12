import ProductRow from "./ProductRow";
import Pagination from "./Pagination";
import "./ProductTable.css";

function ProductTable({
    products,
    pagination,
    hasSearch,
    onPageChange,
    onDeleteProduct,
    onEditProduct,
    onOpenStockHistory,
}) {
    if (products.length === 0) {
        if (products.length === 0) {
            return (
                <section className="empty-products">
                    <h2>
                        {hasSearch
                            ? "No Matching Products"
                            : "No Products Found"}
                    </h2>

                    <p>
                        {hasSearch
                            ? "Try searching by another name or barcode."
                            : "Add your first product to display it here."}
                    </p>
                </section>
            );
        }
    }

    const firstItem =
        (pagination.page - 1) * pagination.pageSize + 1;

    const lastItem = Math.min(
        pagination.page * pagination.pageSize,
        pagination.totalItems
    );

    return (
        <section className="products-table-card">
            <div className="section-heading">
                <h2>Product List</h2>

                <p>View, edit, or delete your products.</p>
            </div>

            <div className="table-wrapper">
                <table className="products-table">
                    <thead>
                        <tr>
                            <th>Product ID</th>
                            <th>Product</th>
                            <th>Barcode</th>
                            <th>Price</th>
                            <th>Stock</th>
                            <th>Actions</th>
                        </tr>
                    </thead>

                    <tbody>
                        {products.map((product) => (
                            <ProductRow
                                key={product.id}
                                product={product}
                                onDeleteProduct={onDeleteProduct}
                                onEditProduct={onEditProduct}
                                onOpenStockHistory={onOpenStockHistory}
                            />
                        ))}
                    </tbody>
                </table>
            </div>

            <Pagination
                pagination={pagination}
                onPageChange={onPageChange}
                itemLabel="products"
            />
        </section>
    );
}

export default ProductTable;