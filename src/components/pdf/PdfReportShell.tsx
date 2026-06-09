import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import type { ReactNode } from 'react'

// ── Brand Tokens ───────────────────────────────────────────────────
const BRAND = {
  darkNavy: '#1a1f2e',
  gold: '#c89a3c',
  text: '#f1f5f9',
  muted: '#9ca3af',
  warningBg: '#44300a',
  warningBorder: '#c89a3c',
  sectionBorder: '#2d3548',
  tableBorder: '#374151',
  tableHeaderBg: '#242a38',
  tableStripeBg: '#1f2535',
}

// ── Styles ─────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page: {
    backgroundColor: BRAND.darkNavy,
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: BRAND.text,
  },
  header: {
    marginBottom: 24,
    borderBottomWidth: 2,
    borderBottomColor: BRAND.gold,
    paddingBottom: 12,
  },
  headerCompany: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: BRAND.gold,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 13,
    color: BRAND.text,
    marginBottom: 4,
  },
  headerMeta: {
    fontSize: 9,
    color: BRAND.muted,
  },

  footer: {
    position: 'absolute',
    bottom: 24,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: BRAND.sectionBorder,
    paddingTop: 8,
  },
  footerDisclaimer: {
    fontSize: 7,
    color: BRAND.muted,
    maxWidth: '80%',
  },
  footerPage: {
    fontSize: 8,
    color: BRAND.muted,
  },

  content: {
    marginBottom: 40,
  },

  // Section
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: BRAND.gold,
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.sectionBorder,
    paddingBottom: 4,
  },

  // Table
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: BRAND.tableBorder,
    minHeight: 20,
    alignItems: 'center',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: BRAND.tableHeaderBg,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.gold,
    minHeight: 22,
    alignItems: 'center',
  },
  tableHeaderCell: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    color: BRAND.gold,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  tableCell: {
    fontSize: 9,
    color: BRAND.text,
    paddingVertical: 3,
    paddingHorizontal: 6,
  },

  // Key-Value
  kvRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  kvLabel: {
    fontSize: 9,
    color: BRAND.muted,
    width: '45%',
  },
  kvValue: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: BRAND.text,
    width: '55%',
  },

  // Warning
  warningBox: {
    backgroundColor: BRAND.warningBg,
    borderWidth: 1,
    borderColor: BRAND.warningBorder,
    borderRadius: 4,
    padding: 8,
    marginTop: 6,
    marginBottom: 6,
  },
  warningText: {
    fontSize: 9,
    color: BRAND.gold,
  },
})

// ── PdfDocument ────────────────────────────────────────────────────
export interface PdfDocumentProps {
  title: string
  clientName?: string
  projectName?: string
  date?: string
  children: ReactNode
}

export function PdfDocument({ title, clientName, projectName, date, children }: PdfDocumentProps) {
  const displayDate = date ?? new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <Document>
      <Page size="LETTER" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.headerCompany}>Sustainable Gaps</Text>
          <Text style={s.headerTitle}>{title}</Text>
          <Text style={s.headerMeta}>
            {displayDate}
            {clientName ? `  |  Client: ${clientName}` : ''}
            {projectName ? `  |  Project: ${projectName}` : ''}
          </Text>
        </View>

        {/* Content */}
        <View style={s.content}>{children}</View>

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerDisclaimer}>
            Calculations are estimates for reference only. Always verify with a licensed professional engineer.
          </Text>
          <Text style={s.footerPage} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}

// ── PdfSection ─────────────────────────────────────────────────────
export interface PdfSectionProps {
  title: string
  children: ReactNode
}

export function PdfSection({ title, children }: PdfSectionProps) {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{title}</Text>
      {children}
    </View>
  )
}

// ── PdfTable ───────────────────────────────────────────────────────
export interface PdfTableProps {
  headers: string[]
  rows: string[][]
}

export function PdfTable({ headers, rows }: PdfTableProps) {
  const colWidth = `${100 / headers.length}%`

  return (
    <View>
      {/* Header row */}
      <View style={s.tableHeaderRow}>
        {headers.map((h, i) => (
          <Text key={i} style={[s.tableHeaderCell, { width: colWidth }]}>
            {h}
          </Text>
        ))}
      </View>

      {/* Data rows */}
      {rows.map((row, ri) => (
        <View
          key={ri}
          style={[
            s.tableRow,
            ri % 2 === 1 ? { backgroundColor: BRAND.tableStripeBg } : {},
          ]}
        >
          {row.map((cell, ci) => (
            <Text key={ci} style={[s.tableCell, { width: colWidth }]}>
              {cell}
            </Text>
          ))}
        </View>
      ))}
    </View>
  )
}

// ── PdfKeyValue ────────────────────────────────────────────────────
export interface PdfKeyValueProps {
  label: string
  value: string
}

export function PdfKeyValue({ label, value }: PdfKeyValueProps) {
  return (
    <View style={s.kvRow}>
      <Text style={s.kvLabel}>{label}</Text>
      <Text style={s.kvValue}>{value}</Text>
    </View>
  )
}

// ── PdfWarning ─────────────────────────────────────────────────────
export interface PdfWarningProps {
  children: string
}

export function PdfWarning({ children }: PdfWarningProps) {
  return (
    <View style={s.warningBox}>
      <Text style={s.warningText}>{children}</Text>
    </View>
  )
}
