import type { Product } from '../types'

interface ProductCardProps {
  product: Product
  onAdd: (product: Product) => void
  onEdit: (product: Product) => void
  onDelete: (product: Product) => void
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 2,
  }).format(value)

export function ProductCard({ product, onAdd, onEdit, onDelete }: ProductCardProps) {
  const image = product.imageFile?.trim()

  return (
    <article className="product-card">
      <div className="product-card__visual">
        {image ? (
          <img
            src={image}
            alt={product.name}
            loading="lazy"
            onError={(event) => {
              event.currentTarget.style.display = 'none'
              event.currentTarget.nextElementSibling?.classList.remove('hidden')
            }}
          />
        ) : null}
        <div className={`product-card__fallback ${image ? 'hidden' : ''}`} aria-hidden="true">
          <span>✦</span>
          <strong>{product.name.slice(0, 2).toUpperCase()}</strong>
        </div>

        <span className="product-card__tag">Elegido para ti</span>

        <div className="product-card__tools">
          <button type="button" onClick={() => onEdit(product)} aria-label={`Editar ${product.name}`} title="Editar">
            ✎
          </button>
          <button type="button" onClick={() => onDelete(product)} aria-label={`Eliminar ${product.name}`} title="Eliminar">
            ×
          </button>
        </div>
      </div>

      <div className="product-card__content">
        <div className="product-card__meta">
          <span>{product.category[0] || 'Especial'}</span>
          <span>♡</span>
        </div>
        <h3>{product.name}</h3>
        <p>{product.description || 'Un artículo especial para acompañar tus días.'}</p>
        <div className="product-card__bottom">
          <div>
            <strong>{formatCurrency(product.price)}</strong>
            <small>Envío disponible</small>
          </div>
          <button type="button" onClick={() => onAdd(product)} aria-label={`Agregar ${product.name} a la bolsa`}>
            ＋
          </button>
        </div>
      </div>
    </article>
  )
}
