import { PdfSection, PdfTable, PdfWarning } from '../../components/pdf/PdfReportShell'
import type { EquipmentRecommendation } from '../../lib/equipmentRecommendations'

export function PdfEquipmentRecommendationSection({ recommendation }: { recommendation: EquipmentRecommendation | null }) {
  if (!recommendation) return null

  const rows = [
    formatOption(recommendation.generator),
    formatOption(recommendation.bess),
    formatOption(recommendation.hybrid),
  ]

  return (
    <PdfSection title="Suggested Equipment Setup">
      <PdfTable
        headers={['Option', 'Planning Units', 'Capacity', 'Footprint']}
        rows={rows}
      />
      {[recommendation.generator, recommendation.bess, recommendation.hybrid].map((option) => (
        <PdfWarning key={option.label}>
          {`${option.label}: ${option.notes.join(' ')}`}
        </PdfWarning>
      ))}
      <PdfWarning>
        {`${recommendation.fuelCell.label}: ${recommendation.fuelCell.reason}`}
      </PdfWarning>
      <PdfWarning>
        {recommendation.sourceNote}
      </PdfWarning>
    </PdfSection>
  )
}

function formatOption(option: EquipmentRecommendation['generator']) {
  return [
    `${option.label}${option.practicality === 'impractical' ? ' (usually impractical)' : ''}`,
    option.units,
    option.energyKwh === undefined
      ? `${fi(option.capacityKw)} kW`
      : `${fi(option.capacityKw)} kW / ${fi(option.energyKwh)} kWh`,
    `~${fi(option.footprintSqFt)} sq ft`,
  ]
}

function fi(value: number) {
  return Math.round(value).toLocaleString('en-US')
}
