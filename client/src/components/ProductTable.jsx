import ProductRow from "./ProductRow";
import Pagination from "./Pagination";

function ProductTable({
    products,
    pagination,
    onPageChange,
    onDeleteProduct,
    onEditProduct,
}) {
    if (products.length === 0) {
        return (
            <section className="empty-products">
                <h2>No Products Found</h2>

                <p>Add your first product to display it here.</p>
            </section>
        );
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