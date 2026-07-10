import { useState } from "react";

function ProductForm({ onAddProduct }) {
    const initialProductState = {
        name: "",
        price: "",
        stock_quantity: "",
    };

    const [product, setProduct] = useState(initialProductState);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState("");

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

        if (product.stock_quantity === "") {
            setFormError("Please enter the stock quantity.");
            return;
        }

        if (Number(product.price) < 0) {
            setFormError("The product price cannot be less than zero.");
            return;
        }

        if (Number(product.stock_quantity) < 0) {
            setFormError("The stock quantity cannot be less than zero.");
            return;
        }

        const productData = {
            name: product.name.trim(),
            price: Number(product.price),
            stock_quantity: Number(product.stock_quantity),
        };

        try {
            setIsSubmitting(true);

            const wasAdded = await onAddProduct(productData);

            if (wasAdded) {
                setProduct(initialProductState);
            }
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <section className="product-form-card">
            <div className="section-heading">
                <h2>Add New Product</h2>

                <p>
                    Enter the product information and click the add button.
                </p>
            </div>

            {formError && (
                <div className="form-error-message">
                    {formError}
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
                    />
                </div>

                <button
                    className="add-product-button"
                    type="submit"
                    disabled={isSubmitting}
                >
                    {isSubmitting
                        ? "Adding..."
                        : "+ Add Product"}
                </button>
            </form>
        </section>
    );
}

export default ProductForm;