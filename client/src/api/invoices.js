import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000/api/invoices",
});

export const getInvoices = (page = 1, customerId = null, invoiceId = null) =>
  api.get("/", {
    params: {
      page,
      ...(customerId ? { customer_id: customerId } : {}),
      ...(invoiceId ? { invoice_id: invoiceId } : {}),
    },
  });

export const getInvoice = (id) => api.get(`/${id}`);

export const createInvoice = (invoice) => api.post("/", invoice);

export const updateInvoice = (id, invoice) => api.put(`/${id}`, invoice);

export const deleteInvoice = (id) => api.delete(`/${id}`);
