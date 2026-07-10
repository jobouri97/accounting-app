import { useEffect, useState } from "react";

import {
  getProducts,
  createProduct,
  deleteProduct,
} from "../api/products";

import ProductForm from "../components/ProductForm";
import ProductTable from "../components/ProductTable";

import "./Products.css";

function Products() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingProduct, setEditingProduct] = useState(null);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    try {
      setIsLoading(true);
      setError("");

      const response = await getProducts();

      setProducts(response.data);
    } catch (error) {
      console.error("Error loading products:", error);

      setError("An error occurred while loading the products.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleEditClick(product) {
    setEditingProduct(product);
  }

  async function handleAddProduct(productData) {
    try {
      setError("");

      const response = await createProduct(productData);

      setProducts((previousProducts) => [
        response.data,
        ...previousProducts,
      ]);

      return true;
    } catch (error) {
      console.error("Error creating product:", error);

      setError("An error occurred while adding the product.");

      return false;
    }
  }

  async function handleDeleteProduct(id) {
    const isConfirmed = window.confirm(
      "Are you sure you want to delete this product?"
    );

    if (!isConfirmed) {
      return;
    }

    try {
      setError("");

      await deleteProduct(id);

      setProducts((previousProducts) =>
        previousProducts.filter((product) => product.id !== id)
      );
    } catch (error) {
      console.error("Error deleting product:", error);

      setError("An error occurred while deleting the product.");
    }
  }

  async function handleUpdateProduct(productId, updatedProductData) {
    try {
        const response = await updateProduct(
            productId,
            updatedProductData
        );

        setProducts((previousProducts) =>
            previousProducts.map((product) =>
                product.id === productId
                    ? response.data
                    : product
            )
        );

        setEditingProduct(null);

        return true;
    } catch (error) {
        console.error("Failed to update product:", error);
        return false;
    }
}

  return (
    <main className="products-page">
      <div className="products-container">
        <header className="products-header">
          <div>
            <p className="products-subtitle">
              Inventory Management
            </p>

            <h1>Products</h1>
          </div>

          <div className="products-count">
            <span>Total Products</span>

            <strong>{products.length}</strong>
          </div>
        </header>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <ProductForm onAddProduct={handleAddProduct} />

        {isLoading ? (
          <div className="products-status">
            Loading products...
          </div>
        ) : (
          <ProductTable
            products={products}
            onDeleteProduct={handleDeleteProduct}
          />
        )}
      </div>
    </main>
  );
}

export default Products;