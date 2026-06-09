import { Text } from '@react-pdf/renderer'
import { PdfDocument, PdfSection, PdfTable, PdfKeyValue, PdfWarning } from '../../components/pdf/PdfReportShell'
import type { SizingInputs, SizingResults, ROIInputs, ROIResults } from '../bess/bess.formulas'

export interface BessProjectPdfDocProps {
  sizingInputs: SizingInputs
  sizingResults: SizingResults
  roiInputs: ROIInputs
  roiResults: ROIResults
  clientName?: string
  projectName?: string
}

export function BessProjectPdfDoc({
  sizingInputs,
  sizingResults,
  roiInputs,
  roiResults,
  clientName,
  projectName,
}: BessProjectPdfDocProps) {
  const fv = (v: number, d = 1) =>
    v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })
  const fi = (v: number) => Math.round(v).toLocaleString('en-US')
  const fc = (v: number, d = 0) =>
    v.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: d, maximumFractionDigits: d })

  return (
    <PdfDocument title="BESS Project Evaluation Report" clientName={clientName} projectName={projectName}>
      {/* Project Parameters */}
      <PdfSection title="Project Parameters">
        <PdfKeyValue label="Load" value={`${fv(sizingInputs.loadKW)} kW`} />
        <PdfKeyValue label="Duration" value={`${fv(sizingInputs.hours)} hours`} />
        <PdfKeyValue label="Unit Capacity" value={`${fi(sizingInputs.unitCapacity)} kWh`} />
        <PdfKeyValue label="Depth of Discharge" value={`${fv(sizingInputs.dodPercent)}%`} />
        <PdfKeyValue label="System Losses" value={`${fv(sizingInputs.lossesPercent)}%`} />
        <PdfKeyValue label="System Cost" value={fc(roiInputs.systemCost)} />
        <PdfKeyValue label="Peak Rate" value={`${fv(roiInputs.peakRate, 2)} $/kWh`} />
        <PdfKeyValue label="Off-Peak Rate" value={`${fv(roiInputs.offPeakRate, 2)} $/kWh`} />
        <PdfKeyValue label="Round Trip Efficiency" value={`${fv(roiInputs.roundTripEfficiency * 100)}%`} />
        <PdfKeyValue label="Cycles/Day" value={`${roiInputs.cyclesPerDay}`} />
        <PdfKeyValue label="Monthly Peak Reduction" value={`${fv(roiInputs.monthlyPeakReduction)} kW`} />
        <PdfKeyValue label="Demand Charge Rate" value={`${fv(roiInputs.demandChargeRate, 2)} $/kW`} />
        <PdfKeyValue label="Degradation Rate" value={`${fv(roiInputs.degradationRate * 100)}%/yr`} />
        <PdfKeyValue label="Discount Rate" value={`${fv(roiInputs.discountRate * 100)}%`} />
        <PdfKeyValue label="Analysis Period" value={`${roiInputs.analysisPeriod} years`} />
      </PdfSection>

      {/* System Sizing */}
      <PdfSection title="System Sizing">
        <PdfKeyValue label="Total Energy Required" value={`${fv(sizingResults.totalEnergy)} kWh`} />
        <PdfKeyValue label="Usable per Unit" value={`${fv(sizingResults.usablePerUnit)} kWh`} />
        <PdfKeyValue label="Units Required" value={`${sizingResults.unitsRequired} units`} />
      </PdfSection>

      {/* Financial Analysis */}
      <PdfSection title="Financial Analysis">
        <PdfKeyValue label="Daily Arbitrage" value={fc(roiResults.dailyArbitrage, 2)} />
        <PdfKeyValue label="Annual Revenue" value={fc(roiResults.annualRevenue)} />
        <PdfKeyValue label="Net Present Value (NPV)" value={fc(roiResults.npv)} />
        <PdfKeyValue label="Simple Payback" value={`${fv(roiResults.simplePayback)} years`} />
        {roiResults.npv < 0 && (
          <PdfWarning>
            NPV is negative. The project may not meet the required rate of return at the specified discount rate.
          </PdfWarning>
        )}
      </PdfSection>

      {/* Year-by-Year Projection */}
      <PdfSection title="Year-by-Year Projection">
        <PdfTable
          headers={['Year', 'Revenue', 'Cumulative', 'NPV']}
          rows={roiResults.yearlyData.slice(0, 10).map((d) => [
            `${d.year}`,
            fc(d.revenue),
            fc(d.cumulative),
            fc(d.npv),
          ])}
        />
      </PdfSection>

      {/* Disclaimer */}
      <PdfSection title="Disclaimer">
        <Text style={{ fontSize: 8, color: '#9ca3af' }}>
          These calculations are estimates for reference only. Actual BESS performance depends on site conditions, equipment specifications, and operational parameters. Revenue projections assume consistent market rates and do not account for regulatory changes. Final sizing and financial analysis must be verified by a licensed professional engineer and qualified financial advisor. Sustainable Gaps is not responsible for investment decisions made based on these estimates.
        </Text>
      </PdfSection>
    </PdfDocument>
  )
}
