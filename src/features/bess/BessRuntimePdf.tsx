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
            ['Continuous Load', `${fv(inputs.loadKw)} kW`],
            ['Usable Energy Window', `${fv(inputs.usablePercent)}%`],
            ['Delivery Efficiency', `${fv(inputs.efficiencyPercent)}%`],
          ]}
        />
      </PdfSection>

      <PdfSection title="Results">
        <PdfTable
          headers={['Metric', 'Value']}
          rows={[
            ['Usable Energy', `${fv(results.usableEnergyKwh)} kWh`],
            ['Delivered Energy', `${fv(results.deliveredEnergyKwh)} kWh`],
            ['Estimated Runtime', `${fv(results.runtime)} hrs`],
          ]}
        />
      </PdfSection>

      <PdfSection title="Formula">
        <Text style={{ fontSize: 9, color: '#C5C6C7', marginBottom: 4 }}>
          UsableEnergy = NameplateEnergy x UsablePercent
        </Text>
        <Text style={{ fontSize: 9, color: '#F9FAFB', marginBottom: 8 }}>
          = {inputs.kWh} x ({inputs.usablePercent} / 100) = {fv(results.usableEnergyKwh)} kWh
        </Text>
        <Text style={{ fontSize: 9, color: '#C5C6C7', marginBottom: 4 }}>
          Runtime = (UsableEnergy x DeliveryEfficiency) / ContinuousLoad
        </Text>
        <Text style={{ fontSize: 9, color: '#F9FAFB' }}>
          = ({fv(results.usableEnergyKwh)} x {inputs.efficiencyPercent / 100}) / {inputs.loadKw} = {fv(results.runtime)} hrs
        </Text>
      </PdfSection>
    </PdfDocument>
  )
}
