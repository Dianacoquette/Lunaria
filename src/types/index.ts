export interface Product {
  id: string
  name: string
  description: string
  category: string[]
  imageFile: string
  price: number
}

export interface PaginatedResult<T> {
  pageIndex: number
  pageSize: number
  count: number
  data: T[]
}

export interface CartItem {
  quantity: number
  color: string
  price: number
  productId: string
  productName: string
}

export interface ShoppingCart {
  userName: string
  items: CartItem[]
}

export type OrderStatus = 'Pending' | 'Confirmed' | 'Cancelled'

export interface OrderItem {
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  lineTotal: number
}

export interface Order {
  id: string
  customerId: string
  basketId: string
  createdAt: string
  status: OrderStatus
  items: OrderItem[]
  subtotal: number
  tax: number
  total: number
}

export interface ProductFormData {
  id?: string
  name: string
  description: string
  category: string
  imageFile: string
  price: string
}
