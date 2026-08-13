import { useState } from 'react'
import { pdfApi } from '../services/api'
import type { Order } from '../types'

interface OrderConfirmationProps {
  order: Order
  onClose: () => void
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(value)

export function OrderConfirmation({ order, onClose }: OrderConfirmationProps) {
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false)
  const [pdfError, setPdfError] = useState('')

  const handleDownloadPdf = async () => {
    setIsDownloadingPdf(true)
    setPdfError('')
    try {
      const blob = await pdfApi.downloadOrderReceipt(order)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `orden-${order.id}.pdf`
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (error) {
      setPdfError(error instanceof Error ? error.message : 'No fue posible descargar el comprobante.')
    } finally {
      setIsDownloadingPdf(false)
    }
  }

  return (
    <div className="modal-layer" role="presentation" onMouseDown={onClose}>
      <div
        className="product-modal order-confirmation"
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-confirmation-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="round-close product-modal__close" type="button" onClick={onClose} aria-label="Cerrar">×</button>

        <div className="product-modal__intro">
          <span className="product-modal__flower">✦</span>
          <span className="kicker">Compra confirmada</span>
          <h2 id="order-confirmation-title">Gracias por tu compra</h2>
          <p>Orden <strong>{order.id}</strong> · Estado: <strong>{order.status}</strong></p>
        </div>

        <div className="order-confirmation__items">
          {order.items.map((item) => (
            <div className="order-confirmation__item" key={item.productId}>
              <div>
                <strong>{item.productName}</strong>
                <small>{item.quantity} × {formatCurrency(item.unitPrice)}</small>
              </div>
              <strong>{formatCurrency(item.lineTotal)}</strong>
            </div>
          ))}
        </div>

        <div className="order-confirmation__summary">
          <div><span>Subtotal</span><strong>{formatCurrency(order.subtotal)}</strong></div>
          <div><span>Impuestos</span><strong>{formatCurrency(order.tax)}</strong></div>
          <div className="order-confirmation__total"><span>Total</span><strong>{formatCurrency(order.total)}</strong></div>
        </div>

        {pdfError ? <p className="form-error" role="alert">{pdfError}</p> : null}

        <div className="product-form__actions">
          <button className="pill-button pill-button--light" type="button" onClick={onClose}>Cerrar</button>
          <button className="pill-button pill-button--filled" type="button" onClick={handleDownloadPdf} disabled={isDownloadingPdf}>
            {isDownloadingPdf ? 'Generando PDF…' : 'Descargar comprobante PDF'}
          </button>
        </div>
      </div>
    </div>
  )
}
