import type { IODomestic, IOInternational, IOInward, IOOutward, IOProduct, IOQuotation, IOQuotationItem, IOLineItem } from '@/lib/io/types'
import { fmtDate } from '@/lib/io/api'
type InvoiceLike = (IODomestic | IOInternational) & { items?: IOLineItem[] }

async function getPdfLib() {
  const { PDFDocument, StandardFonts, rgb, degrees } = await import('pdf-lib')
  return { PDFDocument, StandardFonts, rgb, degrees }
}

async function fetchArrayBuffer(url: string) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to load template: ${url}`)
  return res.arrayBuffer()
}

function openPrintBlob(blob: Blob, _filename: string) {
  const url = URL.createObjectURL(blob)
  const w = window.open(url, '_blank')
  if (!w) {
    window.location.href = url
    return
  }
  const t = window.setInterval(() => {
    try {
      if (w.document?.readyState === 'complete') {
        window.clearInterval(t)
        w.focus()
        w.print()
      }
    } catch {
      // ignore
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

function normalizeLinesPreserveNewlines(text: string) {
  return String(text ?? '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
}

function wrapParagraphLines(paragraph: string, font: any, size: number, maxWidth: number) {
  const words = safeText(paragraph).split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let cur = ''
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w
    if (font.widthOfTextAtSize(next, size) <= maxWidth) { cur = next; continue }
    if (cur) lines.push(cur)
    cur = w
  }
  if (cur) lines.push(cur)
  return lines
}

function renderTextBlock(opts: {
  text: string; page: any; x: number; y: number; font: any
  size: number; maxWidth: number; lineHeight: number; maxLines?: number
}) {
  const { text, page, x, font, size, maxWidth, lineHeight } = opts
  let { y } = opts
  const maxLines = opts.maxLines ?? Number.POSITIVE_INFINITY
  const out: { line: string; indent: number }[] = []

  for (const rawLine of normalizeLinesPreserveNewlines(text)) {
    if (!rawLine.trim()) { out.push({ line: '', indent: 0 }); continue }
    const trimmed = rawLine.trim()
    const isBullet = /^\*\s+/.test(trimmed)
    if (isBullet) {
      const bulletText = trimmed.replace(/^\*\s+/, '')
      const bulletPrefix = '• '
      const bulletPrefixW = font.widthOfTextAtSize(bulletPrefix, size)
      const wrapped = wrapParagraphLines(bulletText, font, size, Math.max(20, maxWidth - bulletPrefixW))
      wrapped.forEach((l, idx) => { out.push({ line: (idx === 0 ? bulletPrefix : '  ') + l, indent: 0 }) })
      continue
    }
    wrapParagraphLines(trimmed, font, size, maxWidth).forEach(l => out.push({ line: l, indent: 0 }))
  }

  for (const row of out.slice(0, maxLines)) {
    if (row.line === '') { y -= lineHeight; continue }
    page.drawText(row.line, { x: x + row.indent, y, size, font })
    y -= lineHeight
  }
  return y
}

function formatINR(amount: unknown) {
  const n = Number(amount)
  if (!Number.isFinite(n)) return ''
  return `Rs. ${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
}

function u8ToArrayBuffer(bytes: Uint8Array) {
  const u8 = Uint8Array.from(bytes)
  return u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength)
}

// --- REWRITTEN QUOTATION FUNCTION ---
export async function printLetterHeadQuotation(row: IOQuotation, products: IOProduct[]) {
  const { PDFDocument, StandardFonts } = await getPdfLib()
  const ab = await fetchArrayBuffer('/letter-head.pdf')
  const pdf = await PDFDocument.load(ab)
  const page = pdf.getPages()[0]
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const { width, height } = page.getSize()

  const marginX = 56
  const contentW = width - marginX * 2
  let y = height * 0.78 // Move start position to top

  const qNo = safeText(row.quotation_number)
  const qDate = fmtDate(row.quotation_date)
  const customerName = safeText(row.customer?.company_name ?? '')
  const rightX = marginX + contentW * 0.65

  // 1. TOP RIGHT DATE
  page.drawText(`Date: ${qDate || '—'}`, { x: rightX, y, size: 10.5, font })

  // 2. GREETING (Respected Mr. [Customer Name])
  const greeting = `Respected Mr. ${customerName},`
  page.drawText(greeting, { x: marginX, y, size: 11, font: fontBold })
  y -= 18

  // 3. HEADER CONTENT (Greetings of the day, etc)
  const headerText = safeText((row as any).header_content ?? '')
  if (headerText) {
    // Filter out redundant manual "Respected Mr" if it exists in data
    const cleanHeader = headerText.replace(/^Respected Mr,?\s*/i, '').replace(/^Greetings of the Day\s*!!!\s*/i, 'Greetings of the Day !!!\n\n')
    y = renderTextBlock({ text: cleanHeader, page, x: marginX, y, font, size: 10.5, maxWidth: contentW, lineHeight: 14 })
  }

  y -= 10

  // 4. QUOTATION TITLE AND NO
  page.drawText('QUOTATION', { x: marginX, y, size: 14, font: fontBold })
  page.drawText(`Quotation No: ${qNo || '—'}`, { x: rightX, y, size: 10.5, font: fontBold })

  y -= 25

  // 6. TABLE
  const tableW = Math.min(520, contentW)
  const x0 = (width - tableW) / 2
  const col1 = x0
  const col2 = x0 + tableW * 0.22
  const col3 = x0 + tableW * 0.80

  page.drawText('Outward Ref', { x: col1, y, size: 10, font: fontBold })
  page.drawText('Product', { x: col2, y, size: 10, font: fontBold })
  page.drawText('Price', { x: col3, y, size: 10, font: fontBold })
  y -= 16

  const items: IOQuotationItem[] = row.items ?? []
  for (const it of items) {
    const ref = safeText(it.reference_no ?? '')
    const name = safeText(it.product_name_override || productNameById(products, it.product_id || ''))
    const price = formatINR(it.price)
    page.drawText(ref || '—', { x: col1, y, size: 10, font })
    page.drawText(name || '—', { x: col2, y, size: 10, font })
    page.drawText(price || '—', { x: col3, y, size: 10, font })
    y -= 14
    if (y < height * 0.18) break
  }

  // 7. FOOTER
  y -= 20
  const footerText = safeText((row as any).footer_content ?? '')
  if (footerText && y > height * 0.10) {
    renderTextBlock({ text: footerText, page, x: marginX, y, font, size: 10, maxWidth: contentW, lineHeight: 13 })
  }

  const bytes = await pdf.save()
  openPrintBlob(new Blob([u8ToArrayBuffer(bytes)], { type: 'application/pdf' }), `${qNo || 'quotation'}.pdf`)
}

// --- REWRITTEN INVOICE FUNCTION ---
export async function printLetterHeadInvoice(_kind: 'Domestic' | 'International', row: InvoiceLike, products: IOProduct[]) {
  const { PDFDocument, StandardFonts } = await getPdfLib()
  const ab = await fetchArrayBuffer('/letter-head.pdf')
  const pdf = await PDFDocument.load(ab)
  const page = pdf.getPages()[0]
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const { width, height } = page.getSize()

  const marginX = 56
  const contentW = width - marginX * 2
  let y = height * 0.78

  const invNo = safeText((row as any).invoice_number)
  const taxNo = safeText((row as any).tax_invoice_number ?? '')
  const invDate = fmtDate((row as any).invoice_date)
  const customer = safeText((row as any).customer?.company_name ?? '')
  // 1. TOP HEADER - TO SECTION (Left) & INVOICE NO (Right)
  page.drawText('To,', { x: marginX, y, size: 10, font: fontBold })

  y -= 14
  page.drawText(customer || '—', { x: marginX, y, size: 10, font: fontBold })

  // 2. TAX INVOICE NO & DATE ON THE SAME LINE (Right)
  const taxLine = `Tax Invoice No: ${taxNo || '—'}      Date: ${invDate || '—'}`
  y -= 30
  page.drawText(taxLine, { x: marginX, y, size: 10, font })

  // 3. TABLE START
  y -= 50

  const tableW = Math.min(520, contentW)
  const x0 = (width - tableW) / 2
  const colP = x0
  const colQ = x0 + tableW * 0.65
  const colR = x0 + tableW * 0.78
  const colT = x0 + tableW * 0.90

  page.drawText('Product', { x: colP, y, size: 10, font: fontBold })
  page.drawText('Qty', { x: colQ, y, size: 10, font: fontBold })
  page.drawText('Rate', { x: colR, y, size: 10, font: fontBold })
  page.drawText('Total', { x: colT, y, size: 10, font: fontBold })
  y -= 16

  const items = (row.items ?? []) as IOLineItem[]
  for (const it of items) {
    const name = safeText(it.product?.product_name || productNameById(products, it.product_id))
    const qty = it.quantity != null ? String(Number(it.quantity)) : '0'
    const rate = formatINR(it.price)
    const total = (it.price != null && it.quantity != null) ? formatINR(Number(it.price) * Number(it.quantity)) : '—'

    page.drawText(name || '—', { x: colP, y, size: 10, font })
    page.drawText(qty, { x: colQ, y, size: 10, font })
    page.drawText(rate || '—', { x: colR, y, size: 10, font })
    page.drawText(total || '—', { x: colT, y, size: 10, font })
    y -= 14
    if (y < height * 0.15) break
  }

  const bytes = await pdf.save()
  openPrintBlob(new Blob([u8ToArrayBuffer(bytes)], { type: 'application/pdf' }), `${invNo || 'invoice'}.pdf`)
}

export async function printLabelForInward(row: IOInward, products: IOProduct[]) {
  await printLabelPages('Inward', safeText(row.inward_number), row.inward_date, safeText(row.remarks ?? ''), row.items ?? [], products)
}

export async function printLabelForOutward(row: IOOutward, products: IOProduct[]) {
  await printLabelPages('Outward', safeText(row.outward_number), row.outward_date, safeText(row.remarks ?? ''), row.items ?? [], products)
}

export async function printLabelForDomestic(row: IODomestic, products: IOProduct[]) {
  const id = safeText(row.tax_invoice_number || (row as any).invoice_number)
  await printLabelPages('Domestic', id, (row as any).invoice_date, safeText(row.remarks ?? ''), (row.items ?? []) as any[], products)
}

export async function printLabelForInternational(row: IOInternational, products: IOProduct[]) {
  const id = safeText(row.tax_invoice_number || (row as any).invoice_number)
  await printLabelPages('International', id, (row as any).invoice_date, safeText(row.remarks ?? ''), (row.items ?? []) as any[], products)
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
  const { PDFDocument, StandardFonts, rgb } = await getPdfLib()
  const ab = await fetchArrayBuffer('/label.pdf')
  const src = await PDFDocument.load(ab)
  const tplPage = src.getPages()[0]
  void tplPage

  const pdf = await PDFDocument.create()
  const font = await pdf.embedFont(StandardFonts.HelveticaBold)
  const fontSmall = await pdf.embedFont(StandardFonts.Helvetica)

  // Force landscape 100×50mm so the browser prints without manual rotation,
  // avoiding the header/footer trimming caused by rotating in the print dialog.
  const width = 283.5   // 100mm in points
  const height = 141.75 // 50mm in points

  // Embed template once for reuse across all label pages
  const [embeddedTpl] = await pdf.embedPdf(src, [0])

  const pages = items.length ? items : [{ product_id: '', quantity: 0, price: 0 } as any]
  for (const it of pages) {
    const page = pdf.addPage([width, height])
    page.drawPage(embeddedTpl, { x: 0, y: 0, width, height })

    const product = safeText(it.product?.product_name || productNameById(products, it.product_id))

    const xLeft = width * 0.10
    const yProduct = height * 0.66
    const yMeta1   = height * 0.45
    const yMeta2   = height * 0.32

    const labelSize = 9
    const labelRef = 'Ref No. :'
    const labelDate = 'Date :'
    const colonX = xLeft + Math.max(
      fontSmall.widthOfTextAtSize(labelRef, labelSize),
      fontSmall.widthOfTextAtSize(labelDate, labelSize),
    )
    const xValue = colonX + 5

    const productMaxW = width * 0.50
    const productSize = (() => {
      for (const s of [16, 13, 11, 9]) {
        if (font.widthOfTextAtSize(product || '—', s) <= productMaxW) return s
      }
      return 9
    })()
    page.drawText(product || '—', { x: xLeft, y: yProduct, size: productSize, font })
    page.drawText(labelRef, { x: colonX - fontSmall.widthOfTextAtSize(labelRef, labelSize), y: yMeta1, size: labelSize, font: fontSmall })
    page.drawText(number || '—', { x: xValue, y: yMeta1, size: 10, font: fontSmall })
    page.drawText(labelDate, { x: colonX - fontSmall.widthOfTextAtSize(labelDate, labelSize), y: yMeta2, size: labelSize, font: fontSmall })
    page.drawText(fmtLabelDate(date) || '—', { x: xValue, y: yMeta2, size: 10, font: fontSmall })

    const r = remarks || safeText(it.remarks ?? '')
    if (r) {
      const x = width * 0.58
      const y = yMeta1
      const size = 8
      const maxW = width - x - 6
      const lineH = 10
      const lines = wrapParagraphLines(r, fontSmall, size, Math.max(20, maxW)).slice(0, 4)
      lines.forEach((line, idx) => {
        page.drawText(line, { x, y: y - idx * lineH, size, font: fontSmall, color: rgb(0, 0, 0) })
      })
    }
  }

  const bytes = await pdf.save()
  openPrintBlob(new Blob([u8ToArrayBuffer(bytes)], { type: 'application/pdf' }), `${number || 'label'}.pdf`)
}