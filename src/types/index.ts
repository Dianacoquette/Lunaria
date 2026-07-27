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

export interface ProductFormData {
  id?: string
  name: string
  description: string
  category: string
  imageFile: string
  price: string
}
