import { useEffect, useState, type FormEvent } from 'react'
import type { Product, ProductFormData } from '../types'

interface ProductModalProps {
  open: boolean
  product: Product | null
  isSaving: boolean
  onClose: () => void
  onSubmit: (form: ProductFormData) => Promise<void>
}

const emptyForm: ProductFormData = {
  name: '',
  description: '',
  category: '',
  imageFile: '',
  price: '',
}

export function ProductModal({ open, product, isSaving, onClose, onSubmit }: ProductModalProps) {
  const [form, setForm] = useState<ProductFormData>(emptyForm)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return

    setError('')
    setForm(
      product
        ? {
            id: product.id,
            name: product.name,
            description: product.description,
            category: product.category.join(', '),
            imageFile: product.imageFile,
            price: String(product.price),
          }
        : emptyForm,
    )
  }, [open, product])

  if (!open) return null

  const update = (field: keyof ProductFormData, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const price = Number(form.price)

    if (!form.name.trim()) {
      setError('Escribe el nombre del artículo.')
      return
    }

    if (!Number.isFinite(price) || price <= 0) {
      setError('Escribe un precio mayor que cero.')
      return
    }

    setError('')
    await onSubmit(form)
  }

  return (
    <div className="modal-layer" role="presentation" onMouseDown={onClose}>
      <div className="product-modal" role="dialog" aria-modal="true" aria-labelledby="product-modal-title" onMouseDown={(event) => event.stopPropagation()}>
        <button className="round-close product-modal__close" type="button" onClick={onClose} aria-label="Cerrar">×</button>

        <div className="product-modal__intro">
          <span className="product-modal__flower">✿</span>
          <span className="kicker">Haz crecer la colección</span>
          <h2 id="product-modal-title">{product ? 'Editar artículo' : 'Agregar un artículo'}</h2>
          <p>Completa los detalles para mostrarlo en la tienda.</p>
        </div>

        <form onSubmit={handleSubmit} className="product-form">
          <label>
            <span>Nombre</span>
            <input value={form.name} onChange={(event) => update('name', event.target.value)} placeholder="Ej. Lámpara de mesa" autoFocus />
          </label>

          <label>
            <span>Descripción</span>
            <textarea value={form.description} onChange={(event) => update('description', event.target.value)} placeholder="Cuenta qué hace especial este artículo" rows={4} />
          </label>

          <div className="product-form__row">
            <label>
              <span>Colecciones</span>
              <input value={form.category} onChange={(event) => update('category', event.target.value)} placeholder="Hogar, Decoración" />
            </label>
            <label>
              <span>Precio</span>
              <input type="number" min="0.01" step="0.01" value={form.price} onChange={(event) => update('price', event.target.value)} placeholder="1299.00" />
            </label>
          </div>

          <label>
            <span>Imagen</span>
            <input type="url" value={form.imageFile} onChange={(event) => update('imageFile', event.target.value)} placeholder="Pega el enlace de una imagen" />
          </label>

          {error ? <p className="form-error">{error}</p> : null}

          <div className="product-form__actions">
            <button className="pill-button pill-button--light" type="button" onClick={onClose}>Cancelar</button>
            <button className="pill-button pill-button--filled" type="submit" disabled={isSaving}>
              {isSaving ? 'Guardando…' : product ? 'Guardar cambios' : 'Agregar a la tienda'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
