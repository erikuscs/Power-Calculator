import { PdfDocument, PdfSection, PdfTable } from '../../components/pdf/PdfReportShell'
import { Text } from '@react-pdf/renderer'
import type { RuntimeInputs, RuntimeResults } from './bess.formulas'

export interface BessRuntimePdfDocProps {
  inputs: RuntimeInputs
  results: RuntimeResults
  clientName?: string
  projectName?: string
}

export function BessRuntimePdfDoc({ inputs, results, clientName, projectName }: BessRuntimePdfDocProps) {
  const fv = (v: number, d = 1) => v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })

  return (
    <PdfDocument title="BESS Runtime Analysis" clientName={clientName} projectName={projectName}>
      <PdfSection title="Input Parameters">
        <PdfTable
          headers={['Parameter', 'Value']}
          rows={[
            ['Battery Capacity', `${fv(inputs.kWh)} kWh`],
            ['System Voltage', `${fv(inputs.voltage, 0)} V`],
            ['Load Current', `${fv(inputs.amps, 0)} A`],
            ['Power Factor', `${inputs.powerFactor}`],
          ]}
        />
      </PdfSection>

      <PdfSection title="Results">
        <PdfTable
          headers={['Metric', 'Value']}
          rows={[
            ['Amp-Hours', `${fv(results.ampHours)} Ah`],
            ['Estimated Runtime', `${fv(results.runtime)} hrs`],
          ]}
        />
      </PdfSection>

      <PdfSection title="Formula">
        <Text style={{ fontSize: 9, color: '#9ca3af', marginBottom: 4 }}>
          AmpHours = (kWh x 1000) / Voltage
        </Text>
        <Text style={{ fontSize: 9, color: '#f1f5f9', marginBottom: 8 }}>
          = ({inputs.kWh} x 1000) / {inputs.voltage} = {fv(results.ampHours)} Ah
        </Text>
        <Text style={{ fontSize: 9, color: '#9ca3af', marginBottom: 4 }}>
          Runtime = (AmpHours / Amps) x PowerFactor
        </Text>
        <Text style={{ fontSize: 9, color: '#f1f5f9' }}>
          = ({fv(results.ampHours)} / {inputs.amps}) x {inputs.powerFactor} = {fv(results.runtime)} hrs
        </Text>
      </PdfSection>
    </PdfDocument>
  )
}
