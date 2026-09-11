import { PdfDocument, PdfSection, PdfTable, PdfWarning } from '../../components/pdf/PdfReportShell'
import { calculateEstimateTotals, estimateStatusLabel, type EstimateDraft } from './estimateDraft'

export function EstimatePdf({ draft }: { draft: EstimateDraft }) {
  const totals = calculateEstimateTotals(draft)
  const money = (value: number) => value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })

  return (
    <PdfDocument
      title="EMaaS Job Estimate Draft"
      clientName={draft.clientName}
      projectName={draft.projectName}
    >
      <PdfWarning>
        {`${estimateStatusLabel[draft.status]} — this document is a commercial estimate draft, not an engineering design or equipment release.`}
      </PdfWarning>

      <PdfSection title="Customer and Job">
        <PdfTable
          headers={['Field', 'Value']}
          rows={[
            ['Contact', draft.contactName || 'Not entered'],
            ['Jobsite', draft.jobsiteAddress || 'Not entered'],
            ['Estimator', draft.estimatorName || 'Not entered'],
            ['Quote / Opportunity', draft.quoteNumber || 'Not entered'],
            ['Billing / PO Requirements', draft.billingAndPoRequirements || 'Not entered'],
            ['Requested / Needed By', `${draft.requestedOn || 'Not entered'} / ${draft.neededBy || 'Not entered'}`],
            ['Valid Until', draft.validUntil || 'Not entered'],
          ]}
        />
      </PdfSection>

      <PdfSection title="Imported Planning Requirements">
        <PdfTable
          headers={['Source', 'Requirement', 'Detail']}
          rows={draft.planningRequirements.length > 0
            ? draft.planningRequirements.flatMap((requirement) => requirement.details.map((detail, index) => [
                index === 0 ? requirement.title : '',
                detail.label,
                detail.value,
              ]))
            : [['None', 'No calculator results imported', 'Add a verified planning result before review']]}
        />
        {draft.planningRequirements.flatMap((requirement) => requirement.assumptions).map((assumption, index) => (
          <PdfWarning key={`${assumption}-${index}`}>{assumption}</PdfWarning>
        ))}
      </PdfSection>

      <PdfSection title="Equipment and Commercial Lines">
        <PdfTable
          headers={['Category / Description', 'Model', 'Qty x Periods', 'Rate', 'Extended']}
          rows={draft.lineItems.length > 0
            ? draft.lineItems.map((item) => [
                `${item.category}: ${item.description || 'Not described'}`,
                item.modelSku || 'TBD',
                `${item.quantity} x ${item.periods} ${item.rateUnit}`,
                money(item.rate),
                money(Math.max(0, item.quantity) * Math.max(0, item.periods) * Math.max(0, item.rate)),
              ])
            : [['None', 'TBD', '0', money(0), money(0)]]}
        />
        <PdfTable
          headers={['Commercial Summary', 'Amount']}
          rows={[
            ['Subtotal', money(totals.subtotal)],
            [`Discount (${draft.discountPercent || 0}%)`, money(totals.discount)],
            [`Tax (${draft.taxPercent || 0}%)`, money(totals.tax)],
            ['Estimated Total', money(totals.total)],
          ]}
        />
      </PdfSection>

      <PdfSection title="Site, Logistics, and Service">
        <PdfTable
          headers={['Field', 'Value']}
          rows={[
            ['Cable / duct / hose distance', draft.cableOrDuctDistance || 'Not confirmed'],
            ['Connections and distribution', draft.connectionAndDistribution || 'Not confirmed'],
            ['Delivery access', draft.deliveryAccess || 'Not confirmed'],
            ['Delivery / pickup plan', draft.deliveryPickupPlan || 'Not confirmed'],
            ['Placement and clearances', draft.placementAndClearance || 'Not confirmed'],
            ['Fuel and service plan', draft.fuelAndServicePlan || 'Not confirmed'],
            ['Restrictions / permits', draft.siteRestrictions || 'Not confirmed'],
            ['Commercial terms', draft.commercialTerms || 'Not confirmed'],
            ['Notes', draft.notes || 'None'],
          ]}
        />
      </PdfSection>

      <PdfSection title="Release Gate">
        <PdfTable
          headers={['Check', 'Status']}
          rows={[
            ['Customer scope confirmed', draft.scopeConfirmed ? 'Confirmed' : 'Open'],
            ['Technical review complete', draft.technicalReviewComplete ? 'Confirmed' : 'Open'],
            ['Equipment availability and rates confirmed', draft.availabilityAndRatesConfirmed ? 'Confirmed' : 'Open'],
          ]}
        />
      </PdfSection>
    </PdfDocument>
  )
}
