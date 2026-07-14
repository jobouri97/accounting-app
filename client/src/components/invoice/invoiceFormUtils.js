let nextItemKey = 1;

export function createEmptyItem() {
  return {
    key: nextItemKey++,
    product_id: "",
    product_search: "",
    quantity: 1,
    discount: 0,
  };
}

export function getInitialItems(editingInvoice, products) {
  if (!editingInvoice) {
    return [createEmptyItem()];
  }

  return editingInvoice.items.map((item) => {
    const product = products.find(
      (currentProduct) => currentProduct.id === Number(item.product_id)
    );

    return {
      key: nextItemKey++,
      product_id: item.product_id,
      product_search: product?.name ?? item.product_name ?? "",
      quantity: item.quantity,
      discount: item.discount,
    };
  });
}

export function filterCustomers(customers, selectedCustomer, searchText) {
  if (selectedCustomer?.customer_name === searchText) {
    return customers;
  }

  const search = searchText.trim().toLowerCase();

  return customers.filter((customer) =>
    customer.customer_name.toLowerCase().includes(search)
  );
}

export function filterProducts(products, searchText) {
  const search = searchText.trim().toLowerCase();

  if (!search) {
    return products;
  }

  return products.filter((product) => {
    const nameMatches = product.name.toLowerCase().includes(search);
    const barcode = product.barcode || "";
    const barcodeMatches = barcode.toLowerCase().includes(search);

    return nameMatches || barcodeMatches;
  });
}

export function calculateLineTotal(item, product) {
  if (!product) {
    return 0;
  }

  const sellingPrice = Number(product.selling_price);
  const discount = Number(item.discount) || 0;
  const quantity = Number(item.quantity) || 0;

  return (sellingPrice - discount) * quantity;
}
