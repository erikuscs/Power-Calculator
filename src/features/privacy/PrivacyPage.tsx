import { Card, CardHeader } from '../../components/ui/Card'
import { APP_BRAND } from '../../lib/brand'

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card>
        <CardHeader
          title="Privacy Policy"
          subtitle={`${APP_BRAND.productName} is a client-side planning tool with no accounts, analytics, or advertising.`}
        />

        <div className="space-y-4 text-sm leading-relaxed text-text-muted">
          <p>
            {APP_BRAND.productName} does not collect, store, sell, rent, or transmit personal data.
            All calculations, saved scenarios, and disclaimer acceptance are stored locally on your
            device and do not leave it.
          </p>
          <p>
            The app does not use analytics, advertising trackers, user accounts, payment processing,
            or third-party data collection SDKs. PDF reports are generated locally from the values
            entered into the tool.
          </p>
          <p>
            If you export or share a report, that action is controlled by your browser or device
            share sheet. {APP_BRAND.companyName} does not receive a copy of exported reports.
          </p>
          <p>
            Contact: <a className="text-accent-400 hover:text-accent-300" href="mailto:erik.herring@sustainablegaps.com">erik.herring@sustainablegaps.com</a>
          </p>
        </div>
      </Card>
    </div>
  )
}
