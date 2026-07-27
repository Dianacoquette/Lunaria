import type { ShoppingCart } from '../types'

interface CartPanelProps {
  open: boolean
  cart: ShoppingCart
  isLoading: boolean
  isSaving: boolean
  onClose: () => void
  onQuantityChange: (productId: string, quantity: number) => void
  onRemove: (productId: string) => void
  onSave: () => void
  onClear: () => void
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(value)

export function CartPanel({
  open,
  cart,
  isLoading,
  isSaving,
  onClose,
  onQuantityChange,
  onRemove,
  onSave,
  onClear,
}: CartPanelProps) {
  const total = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const units = cart.items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div className={open ? 'bag-layer open' : 'bag-layer'} aria-hidden={!open}>
      <button className="bag-backdrop" type="button" onClick={onClose} aria-label="Cerrar bolsa" />
      <aside className="bag-drawer" role="dialog" aria-modal="true" aria-label="Mi bolsa">
        <div className="bag-drawer__header">
          <div>
            <span className="kicker">Tu selección</span>
            <h2>Mi bolsa</h2>
          </div>
          <button className="round-close" type="button" onClick={onClose} aria-label="Cerrar">×</button>
        </div>

        <div className="bag-owner">
          <span>{cart.userName.slice(0, 1).toUpperCase()}</span>
          <div><small>Selección de</small><strong>{cart.userName}</strong></div>
          <b>{units}</b>
        </div>

        <div className="bag-items">
          {isLoading ? (
            <div className="bag-loading">Preparando tu bolsa…</div>
          ) : cart.items.length === 0 ? (
            <div className="bag-empty">
              <span>♡</span>
              <h3>Tu bolsa está esperando</h3>
              <p>Agrega algo que te guste y aparecerá aquí.</p>
              <button type="button" onClick={onClose}>Seguir explorando</button>
            </div>
          ) : (
            cart.items.map((item) => (
              <article className="bag-item" key={item.productId}>
                <div className="bag-item__initial">{item.productName.slice(0, 1).toUpperCase()}</div>
                <div className="bag-item__info">
                  <div>
                    <strong>{item.productName}</strong>
                    <button type="button" onClick={() => onRemove(item.productId)}>Quitar</button>
                  </div>
                  <small>{formatCurrency(item.price)} por unidad</small>
                  <div className="bag-item__bottom">
                    <div className="stepper">
                      <button type="button" onClick={() => onQuantityChange(item.productId, item.quantity - 1)}>−</button>
                      <span>{item.quantity}</span>
                      <button type="button" onClick={() => onQuantityChange(item.productId, item.quantity + 1)}>＋</button>
                    </div>
                    <strong>{formatCurrency(item.price * item.quantity)}</strong>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>

        <div className="bag-summary">
          <div><span>Artículos</span><strong>{formatCurrency(total)}</strong></div>
          <div><span>Entrega</span><strong>Por calcular</strong></div>
          <div className="bag-summary__total"><span>Total estimado</span><strong>{formatCurrency(total)}</strong></div>
        </div>

        <div className="bag-actions">
          <button className="pill-button pill-button--filled" type="button" onClick={onSave} disabled={isSaving || cart.items.length === 0}>
            {isSaving ? 'Guardando…' : 'Guardar selección'}
          </button>
          <button className="bag-clear" type="button" onClick={onClear} disabled={isSaving || cart.items.length === 0}>
            Vaciar bolsa
          </button>
        </div>
      </aside>
    </div>
  )
}
