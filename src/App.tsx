import { useCallback, useEffect, useMemo, useState } from 'react'
import { CartPanel } from './components/CartPanel'
import { OrderConfirmation } from './components/OrderConfirmation'
import { ProductCard } from './components/ProductCard'
import { ProductModal } from './components/ProductModal'
import { ApiError, basketApi, catalogApi, ordersApi } from './services/api'
import type { Order, Product, ProductFormData, ShoppingCart } from './types'
import './styles.css'

const DEFAULT_USER = 'Diana'

type Toast = { type: 'success' | 'error'; message: string } | null

const getFriendlyMessage = (error: unknown, fallback: string) =>
  error instanceof ApiError ? error.message : fallback

function App() {
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('Todas')
  const [isLoadingProducts, setIsLoadingProducts] = useState(true)
  const [catalogOnline, setCatalogOnline] = useState(false)
  const [basketOnline, setBasketOnline] = useState(false)

  const [userName, setUserName] = useState(() => localStorage.getItem('lunaria-user') || DEFAULT_USER)
  const [cart, setCart] = useState<ShoppingCart>({ userName, items: [] })
  const [isLoadingCart, setIsLoadingCart] = useState(true)
  const [isSavingCart, setIsSavingCart] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [lastOrder, setLastOrder] = useState<Order | null>(null)
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [checkoutError, setCheckoutError] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isSavingProduct, setIsSavingProduct] = useState(false)
  const [toast, setToast] = useState<Toast>(null)

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    window.setTimeout(() => setToast(null), 3500)
  }, [])

  const loadProducts = useCallback(async (query = '') => {
    setIsLoadingProducts(true)
    try {
      const result = await catalogApi.getProducts(query)
      setProducts(result.data ?? [])
      setCatalogOnline(true)
    } catch (error) {
      setCatalogOnline(false)
      showToast('error', getFriendlyMessage(error, 'No fue posible cargar los productos.'))
    } finally {
      setIsLoadingProducts(false)
    }
  }, [showToast])

  const loadCart = useCallback(async (currentUser: string) => {
    setIsLoadingCart(true)
    try {
      const loadedCart = await basketApi.getBasket(currentUser)
      setCart({ userName: currentUser, items: loadedCart.items ?? [] })
      setBasketOnline(true)
    } catch (error) {
      setBasketOnline(false)
      setCart({ userName: currentUser, items: [] })
      showToast('error', getFriendlyMessage(error, 'No fue posible cargar tu carrito.'))
    } finally {
      setIsLoadingCart(false)
    }
  }, [showToast])

  useEffect(() => {
    void loadProducts()
    void loadCart(userName)
  }, [loadCart, loadProducts])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadProducts(search)
    }, 350)

    return () => window.clearTimeout(timer)
  }, [search, loadProducts])

  useEffect(() => {
    void basketApi.health().then(setBasketOnline).catch(() => setBasketOnline(false))
  }, [])

  useEffect(() => {
    document.body.style.overflow = isCartOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [isCartOpen])

  const categories = useMemo(() => {
    const values = new Set(products.flatMap((product) => product.category))
    return ['Todas', ...Array.from(values).sort((a, b) => a.localeCompare(b, 'es'))]
  }, [products])

  const visibleProducts = useMemo(() => {
    if (category === 'Todas') return products
    return products.filter((product) => product.category.includes(category))
  }, [category, products])

  const cartUnits = cart.items.reduce((sum, item) => sum + item.quantity, 0)
  const showAvailabilityWarning =
    (!isLoadingProducts && !catalogOnline) || (!isLoadingCart && !basketOnline)

  const addToCart = (product: Product) => {
    setCart((current) => {
      const existing = current.items.find((item) => item.productId === product.id)
      const items = existing
        ? current.items.map((item) =>
          item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item,
        )
        : [
          ...current.items,
          {
            productId: product.id,
            productName: product.name,
            price: product.price,
            quantity: 1,
            color: 'Predeterminado',
          },
        ]

      return { ...current, items }
    })
    showToast('success', `${product.name} se agregó a tu bolsa.`)
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }

    setCart((current) => ({
      ...current,
      items: current.items.map((item) =>
        item.productId === productId ? { ...item, quantity } : item,
      ),
    }))
  }

  const removeFromCart = (productId: string) => {
    setCart((current) => ({
      ...current,
      items: current.items.filter((item) => item.productId !== productId),
    }))
  }

  const saveCart = async (showFeedback = true) => {
    setIsSavingCart(true)
    try {
      await basketApi.storeBasket(cart)
      setBasketOnline(true)
      if (showFeedback) showToast('success', 'Tu selección quedó guardada.')
    } catch (error) {
      setBasketOnline(false)
      if (showFeedback) {
        showToast('error', getFriendlyMessage(error, 'No fue posible guardar tu selección.'))
      } else {
        throw error
      }
    } finally {
      setIsSavingCart(false)
    }
  }

  const clearCart = async () => {
    setIsSavingCart(true)
    try {
      await basketApi.deleteBasket(cart.userName)
      setCart({ userName: cart.userName, items: [] })
      setBasketOnline(true)
      showToast('success', 'Tu bolsa quedó vacía.')
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        setCart({ userName: cart.userName, items: [] })
      } else {
        showToast('error', getFriendlyMessage(error, 'No fue posible vaciar tu bolsa.'))
      }
    } finally {
      setIsSavingCart(false)
    }
  }

  const handleCheckout = async () => {
    setIsCheckingOut(true)
    setCheckoutError('')
    try {
      await saveCart(false)
      const order = await ordersApi.createOrder(cart.userName, cart.userName)
      setLastOrder(order)
      try {
        await basketApi.deleteBasket(cart.userName)
      } catch (error) {
        console.error('No fue posible vaciar el basket después de crear la orden.', error)
      }
      setCart({ userName: cart.userName, items: [] })
      setIsCartOpen(false)
    } catch (error) {
      setCheckoutError(getFriendlyMessage(error, 'No fue posible realizar tu compra.'))
    } finally {
      setIsCheckingOut(false)
    }
  }

  const changeUser = () => {
    const normalized = userName.trim() || DEFAULT_USER
    localStorage.setItem('lunaria-user', normalized)
    setUserName(normalized)
    setCart({ userName: normalized, items: [] })
    void loadCart(normalized)
  }

  const openCreateModal = () => {
    setEditingProduct(null)
    setModalOpen(true)
  }

  const openEditModal = (product: Product) => {
    setEditingProduct(product)
    setModalOpen(true)
  }

  const saveProduct = async (form: ProductFormData) => {
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      category: form.category.split(',').map((value) => value.trim()).filter(Boolean),
      imageFile: form.imageFile.trim(),
      price: Number(form.price),
    }

    setIsSavingProduct(true)
    try {
      if (form.id) {
        await catalogApi.updateProduct({ id: form.id, ...payload })
        showToast('success', 'El artículo se actualizó correctamente.')
      } else {
        await catalogApi.createProduct(payload)
        showToast('success', 'El artículo se agregó correctamente.')
      }
      setModalOpen(false)
      await loadProducts(search)
    } catch (error) {
      showToast('error', getFriendlyMessage(error, 'No fue posible guardar el artículo.'))
    } finally {
      setIsSavingProduct(false)
    }
  }

  const deleteProduct = async (product: Product) => {
    if (!window.confirm(`¿Eliminar “${product.name}”?`)) return

    try {
      await catalogApi.deleteProductByName(product.name)
      setProducts((current) => current.filter((item) => item.id !== product.id))
      removeFromCart(product.id)
      showToast('success', 'El artículo se eliminó correctamente.')
    } catch (error) {
      showToast('error', getFriendlyMessage(error, 'No fue posible eliminar el artículo.'))
    }
  }

  return (
    <div className="store-shell" id="inicio">
      <div className="announcement">
        <span>Envíos disponibles en todo México</span>
        <span className="announcement__dot">•</span>
        <span>Compra con tranquilidad</span>
      </div>

      <header className="site-header">
        <a className="wordmark" href="#inicio" aria-label="Lunaria, inicio">
          <span className="wordmark__petal" aria-hidden="true">✦</span>
          <span>Lunaria</span>
        </a>

        <nav className="desktop-nav" aria-label="Navegación principal">
          <a href="#colecciones">Colecciones</a>
          <a href="#productos">Novedades</a>
          <a href="#beneficios">Beneficios</a>
        </nav>

        <div className="header-actions">
          <label className="profile-chip">
            <span className="profile-chip__avatar">{(userName || DEFAULT_USER).slice(0, 1).toUpperCase()}</span>
            <span className="sr-only">Nombre de la cuenta</span>
            <input
              value={userName}
              onChange={(event) => setUserName(event.target.value)}
              onBlur={changeUser}
              onKeyDown={(event) => event.key === 'Enter' && changeUser()}
            />
          </label>

          <button className="bag-button" type="button" onClick={() => setIsCartOpen(true)}>
            <span aria-hidden="true">♡</span>
            <span>Mi bolsa</span>
            <b>{cartUnits}</b>
          </button>
        </div>
      </header>

      {showAvailabilityWarning ? (
        <div className="soft-alert" role="status">
          Estamos preparando algunas opciones. Vuelve a intentar en unos segundos.
        </div>
      ) : null}

      <main>
        <section className="editorial-hero">
          <div className="editorial-hero__copy">
            <span className="kicker">Una selección hecha para ti</span>
            <h1>Detalles bonitos para todos tus días.</h1>
            <p>
              Encuentra productos especiales, descubre nuevas ideas y guarda tus favoritos en una experiencia sencilla y delicada.
            </p>
            <div className="hero-actions">
              <a className="pill-button pill-button--filled" href="#productos">Explorar ahora</a>
              <button className="pill-button pill-button--light" type="button" onClick={openCreateModal}>Agregar artículo</button>
            </div>
          </div>

          <div className="editorial-hero__art" aria-hidden="true">
            <div className="hero-blob hero-blob--large"></div>
            <div className="hero-blob hero-blob--small"></div>
            <div className="hero-card hero-card--top">
              <span>Favoritos</span>
              <strong>{products.length}</strong>
              <small>para descubrir</small>
            </div>
            <div className="hero-flower">✿</div>
            <div className="hero-card hero-card--bottom">
              <span>Tu bolsa</span>
              <strong>{cartUnits}</strong>
              <small>{cartUnits === 1 ? 'artículo' : 'artículos'}</small>
            </div>
          </div>
        </section>

        <section className="search-ribbon" aria-label="Buscar productos">
          <div>
            <span className="search-ribbon__icon" aria-hidden="true">⌕</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="¿Qué te gustaría encontrar hoy?"
            />
          </div>
          <span>{visibleProducts.length} resultados</span>
        </section>

        <section id="colecciones" className="collection-strip">
          <div className="section-intro section-intro--center">
            <span className="kicker">Explora por estilo</span>
            <h2>Colecciones para cada momento</h2>
          </div>

          <div className="collection-pills" role="tablist" aria-label="Filtrar por colección">
            {categories.map((item, index) => (
              <button
                key={item}
                type="button"
                className={category === item ? 'collection-pill active' : 'collection-pill'}
                onClick={() => setCategory(item)}
              >
                <span>{['✦', '♡', '✿', '☁', '☆', '❀'][index % 6]}</span>
                {item}
              </button>
            ))}
          </div>
        </section>

        <section id="beneficios" className="promise-band">
          <article>
            <span>01</span>
            <div><strong>Compra sencilla</strong><small>Todo lo que necesitas en pocos pasos.</small></div>
          </article>
          <article>
            <span>02</span>
            <div><strong>Selección especial</strong><small>Productos para distintos gustos y momentos.</small></div>
          </article>
          <article>
            <span>03</span>
            <div><strong>Tu bolsa siempre contigo</strong><small>Guarda tu selección y continúa después.</small></div>
          </article>
        </section>

        <section id="productos" className="product-showcase">
          <div className="section-intro section-intro--split">
            <div>
              <span className="kicker">Lo más bonito de la tienda</span>
              <h2>Encuentra tu próximo favorito</h2>
            </div>
            <button className="text-button" type="button" onClick={openCreateModal}>
              <span>＋</span> Agregar un artículo
            </button>
          </div>

          {isLoadingProducts ? (
            <div className="product-grid" aria-label="Cargando productos">
              {Array.from({ length: 8 }).map((_, index) => <div className="product-skeleton" key={index} />)}
            </div>
          ) : visibleProducts.length > 0 ? (
            <div className="product-grid">
              {visibleProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAdd={addToCart}
                  onEdit={openEditModal}
                  onDelete={deleteProduct}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <span>✿</span>
              <h3>No encontramos coincidencias</h3>
              <p>Prueba con otra palabra o agrega un artículo nuevo.</p>
              <button className="pill-button pill-button--filled" type="button" onClick={openCreateModal}>Agregar artículo</button>
            </div>
          )}
        </section>

        <section className="closing-card">
          <span className="closing-card__flower" aria-hidden="true">❀</span>
          <div>
            <span className="kicker">Hazlo tuyo</span>
            <h2>Tu próxima compra favorita puede empezar aquí.</h2>
          </div>
          <a className="pill-button pill-button--filled" href="#productos">Seguir explorando</a>
        </section>
      </main>

      <footer className="site-footer">
        <div>
          <strong>Lunaria</strong>
          <p>Una tienda suave, sencilla y hecha para disfrutar.</p>
        </div>
        <div className="footer-links">
          <a href="#colecciones">Colecciones</a>
          <a href="#productos">Productos</a>
          <button type="button" onClick={() => setIsCartOpen(true)}>Mi bolsa</button>
        </div>
        <small>Precios mostrados en pesos mexicanos.</small>
      </footer>

      <CartPanel
        open={isCartOpen}
        cart={cart}
        isLoading={isLoadingCart}
        isSaving={isSavingCart}
        isCheckingOut={isCheckingOut}
        checkoutError={checkoutError}
        onClose={() => setIsCartOpen(false)}
        onQuantityChange={updateQuantity}
        onRemove={removeFromCart}
        onSave={saveCart}
        onClear={clearCart}
        onCheckout={handleCheckout}
      />

      {lastOrder ? <OrderConfirmation order={lastOrder} onClose={() => setLastOrder(null)} /> : null}

      <ProductModal
        open={modalOpen}
        product={editingProduct}
        isSaving={isSavingProduct}
        onClose={() => setModalOpen(false)}
        onSubmit={saveProduct}
      />

      {toast ? <div className={`toast toast--${toast.type}`} role="status">{toast.message}</div> : null}
    </div>
  )
}

export default App
