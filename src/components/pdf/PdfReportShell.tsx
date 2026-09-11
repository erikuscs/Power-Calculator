import { Document, Font, Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import type { ReactNode } from 'react'
import { APP_BRAND } from '../../lib/brand'

const isTestEnvironment = import.meta.env.MODE === 'test'
const headingFontFamily = isTestEnvironment ? 'Helvetica' : 'Sora'
const bodyFontFamily = isTestEnvironment ? 'Helvetica' : 'Source Sans 3'

if (!isTestEnvironment) {
  Font.register({ family: 'Sora', src: '/fonts/Sora-Variable.ttf' })
  Font.register({ family: 'Source Sans 3', src: '/fonts/SourceSans3-Variable.ttf' })
}

// ── Brand Tokens ───────────────────────────────────────────────────
const BRAND = {
  darkNavy: '#0E151C',
  copper: '#C27A2C',
  text: '#F9FAFB',
  muted: '#C5C6C7',
  warningBg: '#1C2732',
  warningBorder: '#C27A2C',
  sectionBorder: '#34495E',
  tableBorder: '#5B6673',
  tableHeaderBg: '#1C2732',
  tableStripeBg: '#141D26',
}

// ── Styles ─────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page: {
    backgroundColor: BRAND.darkNavy,
    padding: 40,
    fontFamily: bodyFontFamily,
    fontSize: 10,
    color: BRAND.text,
  },
  header: {
    marginBottom: 24,
    borderBottomWidth: 2,
    borderBottomColor: BRAND.copper,
    paddingBottom: 12,
  },
  headerCompany: {
    fontSize: 18,
    fontFamily: headingFontFamily,
    fontWeight: 700,
    color: BRAND.copper,
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
    fontFamily: headingFontFamily,
    fontWeight: 700,
    color: BRAND.copper,
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
    borderBottomColor: BRAND.copper,
    minHeight: 22,
    alignItems: 'center',
  },
  tableHeaderCell: {
    fontFamily: headingFontFamily,
    fontWeight: 700,
    fontSize: 9,
    color: BRAND.copper,
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
    fontFamily: bodyFontFamily,
    fontWeight: 700,
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
    color: BRAND.copper,
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
    <Document
      title={title}
      author="Sustainable Gaps"
      subject={projectName ? `${projectName} - EMaaS planning report` : 'EMaaS planning report'}
      creator="Sustainable Gaps EMaaS Pro"
      keywords="temporary power, energy management, generator planning, electrical distribution"
      language="en-US"
    >
      <Page size="LETTER" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.headerCompany}>{APP_BRAND.reportBrand}</Text>
          <Text style={s.headerTitle}>{title}</Text>
          <Text style={s.headerMeta}>
            {APP_BRAND.descriptor}  |  {APP_BRAND.domain}  |  {displayDate}
            {clientName ? `  |  Client: ${clientName}` : ''}
            {projectName ? `  |  Project: ${projectName}` : ''}
          </Text>
        </View>

        {/* Content */}
        <View style={s.content}>{children}</View>

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerDisclaimer}>
            EMaaS Pro calculations are estimates for reference only. Always verify with a licensed professional engineer.
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
    <View style={s.warningBox} wrap={false}>
      <Text style={s.warningText}>{children}</Text>
    </View>
  )
}
