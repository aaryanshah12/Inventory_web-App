import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import type { IODomestic, IOInternational, IOInward, IOOutward, IOProduct, IOQuotation, IOQuotationItem, IOLineItem } from '@/lib/io/types'
import { fmtDate } from '@/lib/io/api'

async function fetchArrayBuffer(url: string) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to load template: ${url}`)
  return res.arrayBuffer()
}

function openPrintBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const w = window.open(url, '_blank')
  if (!w) {
    // fallback: just navigate current tab
    window.location.href = url
    return
  }
  // Best-effort auto print after load
  const t = window.setInterval(() => {
    try {
      if (w.document?.readyState === 'complete') {
        window.clearInterval(t)
        w.focus()
        w.print()
      }
    } catch {
      // cross-origin / pdf viewer quirks; ignore
    }
  }, 300)
  window.setTimeout(() => window.clearInterval(t), 6000)
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

function productNameById(products: IOProduct[], id: string) {
  return products.find(p => p.id === id)?.product_name ?? ''
}

function safeText(v: unknown) {
  return String(v ?? '').trim()
}

function drawCentered(page: any, text: string, y: number, font: any, size: number, color = rgb(0, 0, 0)) {
  const { width } = page.getSize()
  const textWidth = font.widthOfTextAtSize(text, size)
  page.drawText(text, { x: Math.max(0, (width - textWidth) / 2), y, size, font, color })
}

function wrapLines(text: string, font: any, size: number, maxWidth: number) {
  const words = safeText(text).split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let cur = ''
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w
    if (font.widthOfTextAtSize(next, size) <= maxWidth) {
      cur = next
      continue
    }
    if (cur) lines.push(cur)
    cur = w
  }
  if (cur) lines.push(cur)
  return lines
}

function normalizeLinesPreserveNewlines(text: string) {
  return String(text ?? '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
}

function wrapParagraphLines(paragraph: string, font: any, size: number, maxWidth: number) {
  const words = safeText(paragraph).split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let cur = ''
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w
    if (font.widthOfTextAtSize(next, size) <= maxWidth) {
      cur = next
      continue
    }
    if (cur) lines.push(cur)
    cur = w
  }
  if (cur) lines.push(cur)
  return lines
}

function renderTextBlock(opts: {
  text: string
  page: any
  x: number
  y: number
  font: any
  size: number
  maxWidth: number
  lineHeight: number
  maxLines?: number
}) {
  const { text, page, x, font, size, maxWidth, lineHeight } = opts
  let { y } = opts
  const maxLines = opts.maxLines ?? Number.POSITIVE_INFINITY

  const out: { line: string; indent: number }[] = []

  for (const rawLine of normalizeLinesPreserveNewlines(text)) {
    // Blank line = paragraph spacing
    if (!rawLine.trim()) {
      out.push({ line: '', indent: 0 })
      continue
    }

    const trimmed = rawLine.trim()
    const isBullet = /^\*\s+/.test(trimmed)
    if (isBullet) {
      const bulletText = trimmed.replace(/^\*\s+/, '')
      const bulletPrefix = '• '
      const bulletPrefixW = font.widthOfTextAtSize(bulletPrefix, size)
      const wrapped = wrapParagraphLines(bulletText, font, size, Math.max(20, maxWidth - bulletPrefixW))
      wrapped.forEach((l, idx) => {
        out.push({ line: (idx === 0 ? bulletPrefix : '  ') + l, indent: 0 })
      })
      continue
    }

    wrapParagraphLines(trimmed, font, size, maxWidth).forEach(l => out.push({ line: l, indent: 0 }))
  }

  for (const row of out.slice(0, maxLines)) {
    if (row.line === '') {
      y -= lineHeight
      continue
    }
    page.drawText(row.line, { x: x + row.indent, y, size, font })
    y -= lineHeight
  }

  return y
}

function formatINR(amount: unknown) {
  const n = Number(amount)
  if (!Number.isFinite(n)) return ''
  // Avoid "₹" because StandardFonts (WinAnsi) can't encode it reliably in many PDF viewers.
  return `Rs. ${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
}

function u8ToArrayBuffer(bytes: Uint8Array) {
  // Ensure we hand an ArrayBuffer (not SharedArrayBuffer) to Blob for TS + browser compatibility.
  const u8 = Uint8Array.from(bytes)
  return u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength)
}

export async function printLetterHeadQuotation(row: IOQuotation, products: IOProduct[]) {
  const ab = await fetchArrayBuffer('/letter-head.pdf')
  const pdf = await PDFDocument.load(ab)
  const page = pdf.getPages()[0]
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const { width, height } = page.getSize()

  // Layout:
  // Header content
  // QUOTATION + meta
  // Quotation table
  // Footer content
  const marginX = 56
  const contentW = width - marginX * 2
  let y = height * 0.64

  const headerText = safeText((row as any).header_content ?? '')
  if (headerText) {
    y = renderTextBlock({
      text: headerText,
      page,
      x: marginX,
      y,
      font,
      // slightly bigger as requested
      size: 12,
      maxWidth: contentW,
      lineHeight: 16,
      maxLines: 14,
    })
    y -= 10
  }

  // Title + meta in letter format (not centered)
  page.drawText('QUOTATION', { x: marginX, y, size: 16, font: fontBold })
  y -= 26

  const qNo = safeText(row.quotation_number)
  const qDate = fmtDate(row.quotation_date)
  const customer = safeText(row.customer?.company_name ?? '')

  const rightX = marginX + contentW * 0.62
  page.drawText(`Quotation No: ${qNo || '—'}`, { x: rightX, y, size: 10.5, font })
  y -= 14
  page.drawText(`Date: ${qDate || '—'}`, { x: rightX, y, size: 10.5, font })

  const toY = y + 14
  page.drawText('To,', { x: marginX, y: toY, size: 10.5, font: fontBold })
  page.drawText(customer || '—', { x: marginX, y: toY - 14, size: 10.5, font })

  y -= 20
  y -= 10
  // Items table
  const items: IOQuotationItem[] = row.items ?? []
  const tableW = Math.min(520, contentW)
  const x0 = (width - tableW) / 2
  const col1 = x0
  const col2 = x0 + tableW * 0.18
  const col3 = x0 + tableW * 0.78

  page.drawText('Outward Ref', { x: col1, y, size: 10, font: fontBold })
  page.drawText('Product', { x: col2, y, size: 10, font: fontBold })
  page.drawText('Price', { x: col3, y, size: 10, font: fontBold })
  y -= 14

  const maxRows = 14
  for (const it of items.slice(0, maxRows)) {
    const ref = safeText(it.reference_no ?? '')
    const name = safeText(it.product_name_override || productNameById(products, it.product_id || ''))
    const price = formatINR(it.price)
    page.drawText(ref || '—', { x: col1, y, size: 10, font })
    page.drawText(name || '—', { x: col2, y, size: 10, font })
    page.drawText(price || '—', { x: col3, y, size: 10, font })
    y -= 14
    if (y < height * 0.18) break
  }

  y -= 18
  const footerText = safeText((row as any).footer_content ?? '')
  if (footerText && y > height * 0.14) {
    y = renderTextBlock({
      text: footerText,
      page,
      x: marginX,
      y,
      font,
      size: 10.5,
      maxWidth: contentW,
      lineHeight: 14,
      maxLines: 14,
    })
  }

  const bytes = await pdf.save()
  openPrintBlob(new Blob([u8ToArrayBuffer(bytes)], { type: 'application/pdf' }), `${safeText(row.quotation_number) || 'quotation'}.pdf`)
}

type InvoiceLike = (IODomestic | IOInternational) & { items?: IOLineItem[] }

export async function printLetterHeadInvoice(kind: 'Domestic' | 'International', row: InvoiceLike, products: IOProduct[]) {
  const ab = await fetchArrayBuffer('/letter-head.pdf')
  const pdf = await PDFDocument.load(ab)
  const page = pdf.getPages()[0]
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const { width, height } = page.getSize()

  let y = height * 0.62
  drawCentered(page, `${kind.toUpperCase()} INVOICE`, y, fontBold, 18)
  y -= 28

  const meta = [
    `Invoice No: ${safeText((row as any).invoice_number)}`,
    `Tax Invoice No: ${safeText((row as any).tax_invoice_number ?? '')}`,
    `Date: ${fmtDate((row as any).invoice_date)}`,
    `Customer: ${safeText((row as any).customer?.company_name ?? '')}`,
  ].filter(Boolean)
  for (const line of meta) {
    drawCentered(page, line, y, font, 11)
    y -= 16
  }

  y -= 14
  const items = (row.items ?? []) as IOLineItem[]
  const tableW = Math.min(520, width - 80)
  const x0 = (width - tableW) / 2
  const colP = x0
  const colQ = x0 + tableW * 0.62
  const colR = x0 + tableW * 0.74
  const colT = x0 + tableW * 0.86

  page.drawText('Product', { x: colP, y, size: 10, font: fontBold })
  page.drawText('Qty', { x: colQ, y, size: 10, font: fontBold })
  page.drawText('Rate', { x: colR, y, size: 10, font: fontBold })
  page.drawText('Total', { x: colT, y, size: 10, font: fontBold })
  y -= 14

  const maxRows = 14
  for (const it of items.slice(0, maxRows)) {
    const name = safeText(it.product?.product_name || productNameById(products, it.product_id))
    const qty = it.quantity != null ? String(Number(it.quantity)) : ''
    const rate = formatINR(it.price)
    const total = (it.price != null && it.quantity != null) ? formatINR(Number(it.price) * Number(it.quantity)) : ''
    page.drawText(name || '—', { x: colP, y, size: 10, font })
    page.drawText(qty || '—', { x: colQ, y, size: 10, font })
    page.drawText(rate || '—', { x: colR, y, size: 10, font })
    page.drawText(total || '—', { x: colT, y, size: 10, font })
    y -= 14
    if (y < height * 0.18) break
  }

  const bytes = await pdf.save()
  openPrintBlob(new Blob([u8ToArrayBuffer(bytes)], { type: 'application/pdf' }), `${safeText((row as any).invoice_number) || 'invoice'}.pdf`)
}

export async function printLabelForInward(row: IOInward, products: IOProduct[]) {
  await printLabelPages('Inward', safeText(row.inward_number), row.inward_date, safeText(row.remarks ?? ''), row.items ?? [], products)
}

export async function printLabelForOutward(row: IOOutward, products: IOProduct[]) {
  await printLabelPages('Outward', safeText(row.outward_number), row.outward_date, safeText(row.remarks ?? ''), row.items ?? [], products)
}

function fmtLabelDate(d?: string | null) {
  if (!d) return ''
  const dt = new Date(d)
  if (Number.isNaN(dt.getTime())) return ''
  const dd = String(dt.getDate()).padStart(2, '0')
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const yy = String(dt.getFullYear() % 100).padStart(2, '0')
  return `${dd}-${mm}-${yy}`
}

async function printLabelPages(
  _kind: string,
  number: string,
  date: string,
  remarks: string,
  items: IOLineItem[],
  products: IOProduct[],
) {
  const ab = await fetchArrayBuffer('/label.pdf')
  const src = await PDFDocument.load(ab)
  const tplPage = src.getPages()[0]
  const { width, height } = tplPage.getSize()

  const pdf = await PDFDocument.create()
  const font = await pdf.embedFont(StandardFonts.HelveticaBold)
  const fontSmall = await pdf.embedFont(StandardFonts.Helvetica)

  const pages = items.length ? items : [{ product_id: '', quantity: 0, price: 0 } as any]
  for (const it of pages) {
    const [page] = await pdf.copyPages(src, [0])
    pdf.addPage(page)

    const product = safeText(it.product?.product_name || productNameById(products, it.product_id))

    // Match the sample label style (left aligned, like the physical sticker):
    // Product (big), then Ref No + Date on left, Remarks on right.
    const xLeft = width * 0.10
    const yProduct = height * 0.66
    const yMeta1 = height * 0.45
    const yMeta2 = height * 0.32
    const xValue = xLeft + 44

    page.drawText(product || '—', { x: xLeft, y: yProduct, size: 20, font })
    page.drawText('Ref No :', { x: xLeft, y: yMeta1, size: 10, font: fontSmall })
    page.drawText(number || '—', { x: xValue, y: yMeta1, size: 12, font: fontSmall })
    page.drawText('Date :', { x: xLeft, y: yMeta2, size: 10, font: fontSmall })
    page.drawText(fmtLabelDate(date) || '—', { x: xValue, y: yMeta2, size: 12, font: fontSmall })

    // Remarks at side (right)
    const r = remarks || safeText(it.remarks ?? '')
    if (r) {
      const x = width * 0.58
      const y = yMeta1
      const size = 11
      const maxW = width - x - 6
      const lineH = 12
      const lines = wrapLines(r, fontSmall, size, Math.max(20, maxW)).slice(0, 4)
      lines.forEach((line, idx) => {
        page.drawText(line, { x, y: y - idx * lineH, size, font: fontSmall, color: rgb(0, 0, 0) })
      })
    }
  }

  const bytes = await pdf.save()
  openPrintBlob(new Blob([u8ToArrayBuffer(bytes)], { type: 'application/pdf' }), `${number || 'label'}.pdf`)
}

