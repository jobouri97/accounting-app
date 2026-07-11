import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  getProducts,
  createProduct,
  deleteProduct,
  updateProduct,
} from "../api/products";

import ProductForm from "../components/ProductForm";
import ProductTable from "../components/ProductTable";

import "./Products.css";

const initialPagination = {
  page: 1,
  pageSize: 100,
  totalItems: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPreviousPage: false,
};

function Products() {
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] =
    useState(initialPagination);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingProduct, setEditingProduct] =
    useState(null);

  const loadProducts = useCallback(async (page) => {
    try {
      setIsLoading(true);
      setError("");

      const response = await getProducts(page);

      setProducts(response.data.products);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error("Error loading products:", error);

      setError(
        "An error occurred while loading the products."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts(currentPage);
  }, [currentPage, loadProducts]);

  function handleEditClick(product) {
    setEditingProduct(product);
  }

  function handlePageChange(page) {
    if (
      page < 1 ||
      page > pagination.totalPages ||
      page === currentPage ||
      isLoading
    ) {
      return;
    }

    setCurrentPage(page);
  }

  async function handleAddProduct(productData) {
    try {
      setError("");

      await createProduct(productData);

      if (currentPage === 1) {
        await loadProducts(1);
      } else {
        setCurrentPage(1);
      }

      return true;
    } catch (error) {
      console.error("Error creating product:", error);

      setError(
        "An error occurred while adding the product."
      );

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

      const nextPage =
        products.length === 1 && currentPage > 1
          ? currentPage - 1
          : currentPage;

      if (nextPage === currentPage) {
        await loadProducts(currentPage);
      } else {
        setCurrentPage(nextPage);
      }
    } catch (error) {
      console.error("Error deleting product:", error);

      setError(
        "An error occurred while deleting the product."
      );
    }
  }

  async function handleUpdateProduct(
    productId,
    updatedProductData
  ) {
    try {
      setError("");

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

      setError(
        "An error occurred while updating the product."
      );

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

            <strong>{pagination.totalItems}</strong>
          </div>
        </header>

        {error && (
          <div className="error-message">{error}</div>
        )}

        <ProductForm
          onAddProduct={handleAddProduct}
          editingProduct={editingProduct}
          onUpdateProduct={handleUpdateProduct}
          onCancelEdit={() => setEditingProduct(null)}
        />

        {isLoading ? (
          <div className="products-status">
            Loading products...
          </div>
        ) : (
          <ProductTable
            products={products}
            pagination={pagination}
            onPageChange={handlePageChange}
            onDeleteProduct={handleDeleteProduct}
            onEditProduct={handleEditClick}
          />
        )}
      </div>
    </main>
  );
}

export default Products;