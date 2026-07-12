import { useState, useEffect } from "react";
import "./ProductForm.css";

function ProductForm({
    onAddProduct,
    editingProduct,
    onUpdateProduct,
    onCancelEdit,
}) {
    const initialProductState = {
        name: "",
        barcode: "",
        price: "",
        stock_quantity: "",
    };

    const [product, setProduct] = useState(initialProductState);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState("");


    useEffect(() => {
        if (editingProduct) {
            setProduct({
                name: editingProduct.name,
                price: editingProduct.price,
                stock_quantity: editingProduct.stock_quantity,
                barcode: editingProduct.barcode ?? "",
            });
        } else {
            setProduct(initialProductState);
        }

        setFormError("");
    }, [editingProduct]);

    function handleChange(event) {
        const { name, value } = event.target;

        setProduct((previousProduct) => ({
            ...previousProduct,
            [name]: value,
        }));
    }

    async function handleSubmit(event) {
        event.preventDefault();

        setFormError("");

        if (!product.name.trim()) {
            setFormError("Please enter the product name.");
            return;
        }

        if (product.price === "") {
            setFormError("Please enter the product price.");
            return;
        }

        if (!editingProduct && product.stock_quantity === "") {
            setFormError("Please enter the stock quantity.");
            return;
        }

        if (Number(product.price) < 0) {
            setFormError("The product price cannot be less than zero.");
            return;
        }

        if (!editingProduct && Number(product.stock_quantity) < 0) {
            setFormError("The stock quantity cannot be less than zero.");
            return;
        }

        const productData = {
            name: product.name.trim(),
            barcode: product.barcode.trim() || null,
            price: Number(product.price),
            ...(!editingProduct && {
                stock_quantity: Number(product.stock_quantity),
            }),
        };

        try {
            setIsSubmitting(true);

            let result;

            if (editingProduct) {
                result = await onUpdateProduct(
                    editingProduct.id,
                    productData
                );
            } else {
                result = await onAddProduct(productData);
            }

            if (result.success) {
                setProduct(initialProductState);
            } else {
                setFormError(result.message);
            }
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <section className="product-form-card">
            <div className="section-heading">
                <h2>    {editingProduct ? "Edit Product" : "Add New Product"}
                </h2>

                <p>
                    Enter the product information and click the add button.
                </p>
            </div>

            {formError && (
                <div
                    className="form-error-message"
                    role="alert"
                >
                    <span>{formError}</span>

                    <button
                        type="button"
                        className="form-error-close"
                        onClick={() => setFormError("")}
                        aria-label="Dismiss error"
                        title="Dismiss"
                    >
                        ×
                    </button>
                </div>
            )}

            <form
                className="product-form"
                onSubmit={handleSubmit}
            >
                <div className="form-group">
                    <label htmlFor="name">
                        Product Name
                    </label>

                    <input
                        id="name"
                        type="text"
                        name="name"
                        value={product.name}
                        onChange={handleChange}
                        placeholder="Example: Laptop"
                        maxLength="150"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="barcode">Barcode</label>

                    <input
                        id="barcode"
                        type="text"
                        name="barcode"
                        value={product.barcode}
                        onChange={handleChange}
                        placeholder="Example: 0123456789012"
                        maxLength="100"
                        autoComplete="off"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="price">
                        Price
                    </label>

                    <input
                        id="price"
                        type="number"
                        name="price"
                        value={product.price}
                        onChange={handleChange}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="stock_quantity">
                        Stock Quantity
                    </label>

                    <input
                        id="stock_quantity"
                        type="number"
                        name="stock_quantity"
                        value={product.stock_quantity}
                        onChange={handleChange}
                        placeholder="0"
                        min="0"
                        step="1"
                        disabled={Boolean(editingProduct)}
                    />

                   
                </div>

                <div className="form-actions">
                    {editingProduct && (
                        <button
                            className="cancel-button"
                            type="button"
                            onClick={onCancelEdit}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                    )}

                    <button
                        className="add-product-button"
                        type="submit"
                        disabled={isSubmitting}
                    >
                        {isSubmitting
                            ? editingProduct
                                ? "Updating..."
                                : "Adding..."
                            : editingProduct
                                ? "Update Product"
                                : "Add Product"}
                    </button>
                </div>
            </form>
        </section>
    );
}

export default ProductForm;
