import api from "./client";

export const getInvoices = (page = 1, customerId = null, invoiceId = null) =>
  api.get("/invoices", {
    params: {
      page,
      ...(customerId ? { customer_id: customerId } : {}),
      ...(invoiceId ? { invoice_id: invoiceId } : {}),
    },
  });

export const getInvoice = (id) => api.get(`/invoices/${id}`);

export const createInvoice = (invoice) => api.post("/invoices", invoice);

export const updateInvoice = (id, invoice) => api.put(`/invoices/${id}`, invoice);

export const deleteInvoice = (id) => api.delete(`/invoices/${id}`);
