import { PdfDocument, PdfSection, PdfTable, PdfWarning } from './PdfReportShell'

interface GenericPdfProps {
  title: string
  inputs: { label: string; value: string }[]
  results: { label: string; value: string; unit?: string }[]
  formulaSteps?: { label: string; result: string }[]
  warnings?: string[]
}

export function GenericCalculatorPdf({ title, inputs, results, formulaSteps, warnings }: GenericPdfProps) {
  return (
    <PdfDocument title={title}>
      <PdfSection title="Input Parameters">
        <PdfTable
          headers={['Parameter', 'Value']}
          rows={inputs.map((i) => [i.label, i.value])}
        />
      </PdfSection>

      <PdfSection title="Results">
        <PdfTable
          headers={['Parameter', 'Value', 'Unit']}
          rows={results.map((r) => [r.label, r.value, r.unit ?? ''])}
        />
      </PdfSection>

      {formulaSteps && formulaSteps.length > 0 && (
        <PdfSection title="Formula Breakdown">
          <PdfTable
            headers={['Step', 'Result']}
            rows={formulaSteps.map((s) => [s.label, s.result])}
          />
        </PdfSection>
      )}

      {warnings && warnings.map((w, i) => (
        <PdfWarning key={i}>{w}</PdfWarning>
      ))}
    </PdfDocument>
  )
}
