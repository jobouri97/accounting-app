import ProductRow from "./ProductRow";

function ProductTable({
    products,
    onDeleteProduct,
}) {
    if (products.length === 0) {
        return (
            <section className="empty-products">
                <h2>No Products Found</h2>

                <p>
                    Add your first product to display it here.
                </p>
            </section>
        );
    }

    return (
        <section className="products-table-card">
            <div className="section-heading">
                <h2>Product List</h2>

                <p>
                    View, edit, or delete your products.
                </p>
            </div>

            <div className="table-wrapper">
                <table className="products-table">
                    <thead>
                        <tr>
                            <th>Product ID</th>
                            <th>Product</th>
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
                            />
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

export default ProductTable;