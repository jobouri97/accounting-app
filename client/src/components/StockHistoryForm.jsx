import { useState } from "react";
import FormError from "./FormError";
import "./StockHistoryForm.css";

function StockHistoryForm({
    products,
    onAddStock,
    lockedProductId = null,
}) {
    const initialState = {
        product_id: lockedProductId ?? "",
        adjustmentType: "add",
        quantity: "",
        description: "",
    };

    const [form, setForm] = useState(initialState);
    const [formError, setFormError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [productSearch, setProductSearch] = useState("");
    const [isProductListOpen, setIsProductListOpen] = useState(false);
    const [isAdjustmentListOpen, setIsAdjustmentListOpen] = useState(false);

    const lockedProduct = products.find(
        (product) =>
            product.id === Number(lockedProductId)
    );

    const selectedProduct = products.find(
        (product) => product.id === Number(form.product_id)
    );
    const isShowingSelectedProduct =
        selectedProduct?.name === productSearch;

    const filteredProducts = products.filter((product) => {
        const searchValue = productSearch.trim().toLowerCase();

        if (!searchValue || isShowingSelectedProduct) {
            return true;
        }

        return (
            product.name.toLowerCase().includes(searchValue) ||
            (product.barcode ?? "").toLowerCase().includes(searchValue)
        );
    });

    function handleChange(event) {
        const { name, value } = event.target;

        setForm((previousForm) => ({
            ...previousForm,
            [name]: value,
        }));
    }

    function handleProductSearch(event) {
        setProductSearch(event.target.value);
        setIsProductListOpen(true);
        setForm((previousForm) => ({
            ...previousForm,
            product_id: "",
        }));
    }

    function handleProductSelect(product) {
        setProductSearch(product.name);
        setIsProductListOpen(false);
        setForm((previousForm) => ({
            ...previousForm,
            product_id: product.id,
        }));
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setFormError("");

        const productId = Number(form.product_id);
        const quantity = Number(form.quantity);

        if (!Number.isInteger(productId) || productId < 1) {
            setFormError("Please select a product.");
            return;
        }

        if (!Number.isInteger(quantity) || quantity < 1) {
            setFormError("Quantity must be a positive integer.");
            return;
        }

        const signedQuantity =
            form.adjustmentType === "remove"
                ? -quantity
                : quantity;

        const result = await onAddStock({
            product_id: productId,
            quantity: signedQuantity,
            description: form.description.trim() || null,
        });

        if (result.success) {
            setForm({
                product_id: lockedProductId ?? "",
                adjustmentType: "add",
                quantity: "",
                description: "",
            });

            if (!lockedProductId) {
                setProductSearch("");
            }
        } else {
            setFormError(result.message);
        }
    }

    async function submitForm(event) {
        try {
            setIsSubmitting(true);
            await handleSubmit(event);
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <section className="stock-history-form-card">
            <h2>Stock Adjustment</h2>

            <FormError
                message={formError}
                onDismiss={() => setFormError("")}
            />

            <form
                className="stock-history-form"
                onSubmit={submitForm}
            >
                <div className="form-group">
                    <label htmlFor="product_id">Product</label>

                    {lockedProductId ? (
                        <input
                            id="product_id"
                            type="text"
                            value={
                                lockedProduct
                                    ? `${lockedProduct.name} - Stock: ${lockedProduct.stock_quantity}`
                                    : "Loading product..."
                            }
                            disabled
                        />
                    ) : (
                        <div className="product-combobox">
                            <input
                                id="product_id"
                                type="text"
                                role="combobox"
                                autoComplete="off"
                                aria-expanded={isProductListOpen}
                                aria-controls="product-options"
                                value={productSearch}
                                onChange={handleProductSearch}
                                onFocus={() => setIsProductListOpen(true)}
                                onClick={() => setIsProductListOpen(true)}
                                onBlur={() => {
                                    window.setTimeout(() => {
                                        setIsProductListOpen(false);
                                    }, 150);
                                }}
                                placeholder="Search by product or barcode"
                            />

                            <span className="combobox-arrow" aria-hidden="true">
                                &#8964;
                            </span>

                            {isProductListOpen && (
                                <div
                                    id="product-options"
                                    className="product-options"
                                    role="listbox"
                                >
                                    {filteredProducts.length === 0 ? (
                                        <div className="product-option-empty">
                                            No products found
                                        </div>
                                    ) : (
                                        filteredProducts.map((product) => (
                                            <button
                                                key={product.id}
                                                type="button"
                                                className="product-option"
                                                role="option"
                                                aria-selected={
                                                    Number(form.product_id) === product.id
                                                }
                                                onMouseDown={(event) => {
                                                    event.preventDefault();
                                                    handleProductSelect(product);
                                                }}
                                            >
                                                <span>
                                                    <strong>{product.name}</strong>
                                                    <small>
                                                        {product.barcode || "No barcode"}
                                                    </small>
                                                </span>

                                                <span className="product-option-stock">
                                                    {product.stock_quantity} in stock
                                                </span>
                                            </button>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="form-group">
                    <label htmlFor="adjustmentType">
                        Adjustment Type
                    </label>

                    <div className="adjustment-combobox">
                        <button
                            id="adjustmentType"
                            type="button"
                            className="adjustment-trigger"
                            aria-haspopup="listbox"
                            aria-expanded={isAdjustmentListOpen}
                            onClick={() => {
                                setIsAdjustmentListOpen(true);
                            }}
                            onBlur={() => {
                                window.setTimeout(() => {
                                    setIsAdjustmentListOpen(false);
                                }, 150);
                            }}
                        >
                            <span
                                className={`adjustment-dot ${form.adjustmentType}`}
                                aria-hidden="true"
                            />

                            <span>
                                {form.adjustmentType === "add"
                                    ? "Add stock"
                                    : "Remove stock"}
                            </span>

                            <span className="adjustment-arrow" aria-hidden="true">
                                &#8964;
                            </span>
                        </button>

                        {isAdjustmentListOpen && (
                            <div
                                className="product-options adjustment-options"
                                role="listbox"
                            >
                                <button
                                    type="button"
                                    className="product-option adjustment-option"
                                    role="option"
                                    aria-selected={form.adjustmentType === "add"}
                                    onMouseDown={(event) => {
                                        event.preventDefault();
                                        setForm((previousForm) => ({
                                            ...previousForm,
                                            adjustmentType: "add",
                                        }));
                                        setIsAdjustmentListOpen(false);
                                    }}
                                >
                                    <span className="adjustment-option-icon add">+</span>

                                    <span>
                                        <strong>Add stock</strong>
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    className="product-option adjustment-option"
                                    role="option"
                                    aria-selected={form.adjustmentType === "remove"}
                                    onMouseDown={(event) => {
                                        event.preventDefault();
                                        setForm((previousForm) => ({
                                            ...previousForm,
                                            adjustmentType: "remove",
                                        }));
                                        setIsAdjustmentListOpen(false);
                                    }}
                                >
                                    <span className="adjustment-option-icon remove">-</span>

                                    <span>
                                        <strong>Remove stock</strong>
                                    </span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="form-group">
                    <label htmlFor="quantity">Quantity</label>

                    <input
                        id="quantity"
                        name="quantity"
                        type="number"
                        min="1"
                        step="1"
                        value={form.quantity}
                        onChange={handleChange}
                        placeholder="Example: 5"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="description">Description</label>

                    <textarea
                        id="description"
                        name="description"
                        value={form.description}
                        onChange={handleChange}
                        maxLength="500"
                        placeholder="Example: Broken items"
                    />
                </div>

                <button
                    className="save-adjustment-button"
                    type="submit"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? "Saving..." : "Save Adjustment"}
                </button>
            </form>
        </section>
    );
}

export default StockHistoryForm;
