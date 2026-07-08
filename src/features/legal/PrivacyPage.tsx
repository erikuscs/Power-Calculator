import { Link } from 'react-router-dom'

export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6 py-4">
      <div>
        <p className="text-[10px] font-bold text-accent-500 uppercase tracking-[0.15em] mb-2">EMaaS.pro Power Console</p>
        <h1 className="text-3xl font-bold text-text tracking-tight">Privacy Policy</h1>
        <p className="text-text-muted mt-2 text-sm">Last updated: July 8, 2026</p>
      </div>

      <div className="bg-sg-800 border border-sg-600/40 rounded-xl p-6 space-y-5 text-sm text-text-muted leading-relaxed">
        <p className="text-text">
          EMaaS.pro Power Console does not collect, store, or transmit any personal data.
        </p>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-text tracking-tight">What we collect</h2>
          <p>
            Nothing. The app has no user accounts, no analytics, no advertising, and no
            tracking of any kind. We do not know who you are, and we never ask.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-text tracking-tight">Where your data lives</h2>
          <p>
            All calculator inputs, saved scenarios, and calculation history are stored
            locally on your device using your browser or device storage. This information
            never leaves your device and is never sent to us or any third party. Clearing
            the app's data or uninstalling the app removes it permanently.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-text tracking-tight">Network use</h2>
          <p>
            After the initial download, every calculator works fully offline. The app makes
            no network requests containing user data. PDF reports are generated entirely on
            your device and shared only when you choose to share them.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-text tracking-tight">Children's privacy</h2>
          <p>
            The app collects no data from anyone, including children under 13.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-text tracking-tight">Changes to this policy</h2>
          <p>
            If this policy changes, the updated version will be posted here with a new
            "last updated" date.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-text tracking-tight">Contact</h2>
          <p>
            Questions about this policy: <a href="mailto:erik.herring@sustainablegaps.com" className="text-accent-400 hover:text-accent-300">erik.herring@sustainablegaps.com</a>
            <br />
            Sustainable Gaps LLC
          </p>
        </section>
      </div>

      <div className="text-center">
        <Link to="/" className="text-sm text-accent-400 hover:text-accent-300 no-underline">← Back to calculators</Link>
      </div>

      <p className="text-center text-xs text-text-dim leading-relaxed">
        EMaaS.pro Power Console provides estimates for reference and planning only.
        Verify all results with a licensed professional engineer before making
        equipment, procurement, or design decisions.
      </p>
    </div>
  )
}
