import type { Order, PaginatedResult, Product, ShoppingCart } from '../types'

const CATALOG_BASE_URL = import.meta.env.VITE_CATALOG_API_URL ?? '/api/catalog'
const BASKET_BASE_URL = import.meta.env.VITE_BASKET_API_URL ?? '/api/basket'
const ORDERS_BASE_URL = import.meta.env.VITE_ORDERS_API_URL ?? 'http://localhost:5250'
const PDF_BASE_URL = import.meta.env.VITE_PDF_API_URL ?? 'http://localhost:5251'

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!response.ok) {
    let message = 'No fue posible completar la operación.'

    try {
      const problem = (await response.json()) as {
        detail?: string
        title?: string
        errors?: Record<string, string[]>
      }
      const validationMessage = problem.errors
        ? Object.values(problem.errors).flat().join(' ')
        : undefined
      message = validationMessage || problem.detail || problem.title || message
    } catch {
    }

    throw new ApiError(message, response.status)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

export const catalogApi = {
  getProducts: (name = '', pageIndex = 1, pageSize = 50) => {
    const params = new URLSearchParams({
      pageIndex: pageIndex.toString(),
      pageSize: pageSize.toString(),
    })
    if (name.trim()) params.set('name', name.trim())

    return request<PaginatedResult<Product>>(
      `${CATALOG_BASE_URL}/products?${params.toString()}`,
    )
  },

  createProduct: (product: Omit<Product, 'id'>) =>
    request<{ id: string }>(`${CATALOG_BASE_URL}/products`, {
      method: 'POST',
      body: JSON.stringify(product),
    }),

  updateProduct: (product: Product) =>
    request<{ isSuccess: boolean }>(`${CATALOG_BASE_URL}/products`, {
      method: 'PUT',
      body: JSON.stringify(product),
    }),

  deleteProductByName: (name: string) =>
    request<{ success: boolean }>(
      `${CATALOG_BASE_URL}/products/by-name/${encodeURIComponent(name)}`,
      { method: 'DELETE' },
    ),
}

export const basketApi = {
  getBasket: async (userName: string): Promise<ShoppingCart> => {
    try {
      const response = await request<{ cart: ShoppingCart }>(
        `${BASKET_BASE_URL}/basket/${encodeURIComponent(userName)}`,
      )
      return response.cart
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return { userName, items: [] }
      }
      throw error
    }
  },

  storeBasket: (cart: ShoppingCart) =>
    request<{ userName: string }>(`${BASKET_BASE_URL}/basket`, {
      method: 'POST',
      body: JSON.stringify({ cart }),
    }),

  deleteBasket: (userName: string) =>
    request<{ isSuccess: boolean }>(
      `${BASKET_BASE_URL}/basket/${encodeURIComponent(userName)}`,
      { method: 'DELETE' },
    ),

  health: async () => {
    const response = await fetch(`${BASKET_BASE_URL}/health`)
    return response.ok
  },
}

export const ordersApi = {
  createOrder: (customerId: string, basketId: string) =>
    request<Order>(`${ORDERS_BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Idempotency-Key': crypto.randomUUID() },
      body: JSON.stringify({ customerId, basketId }),
    }),

  getOrderById: (id: string) =>
    request<Order>(`${ORDERS_BASE_URL}/api/orders/${encodeURIComponent(id)}`),

  getOrdersByCustomer: (customerId: string) =>
    request<Order[]>(
      `${ORDERS_BASE_URL}/api/orders/customer/${encodeURIComponent(customerId)}`,
    ),
}

export const pdfApi = {
  downloadOrderReceipt: async (order: Order): Promise<Blob> => {
    const response = await fetch(`${PDF_BASE_URL}/api/pdf/order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: order.id,
        customerId: order.customerId,
        createdAt: order.createdAt,
        status: order.status,
        items: order.items.map((item) => ({
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          lineTotal: item.lineTotal,
        })),
        subtotal: order.subtotal,
        tax: order.tax,
        total: order.total,
      }),
    })

    if (!response.ok) {
      throw new Error('No fue posible generar el comprobante en PDF.')
    }

    return response.blob()
  },
}
