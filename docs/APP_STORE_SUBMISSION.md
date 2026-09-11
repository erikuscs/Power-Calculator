# EMaaS Pro App Store Submission Boundary

Status: `REFERENCE / VERIFY CURRENT APPLE REQUIREMENTS BEFORE USE`

The iOS source is under `ios/` and uses Capacitor with bundle identifier `pro.emaas.app`. The repository does not store Apple credentials, signing authority, submission approval, or an assertion that an earlier App Store Connect state remains current.

Use [NATIVE-RELEASE-CHECKLIST.md](NATIVE-RELEASE-CHECKLIST.md) for the repository-side preparation sequence. At submission time, use current official Apple documentation and the live App Store Connect form as the authority for required screenshots, metadata, privacy disclosures, age rating, encryption, distribution regions, trader status, and review questions.

The following claims must be reverified against the exact build before they appear in listing copy or privacy answers:

- offline operation;
- number and availability of calculators and workflows;
- local-only storage and absence of analytics or tracking;
- PDF export behavior;
- supported iPhone/iPad layouts;
- support and privacy URLs;
- professional-review limitations.

Do not archive, upload, or submit until the exact native icon and launch-screen candidate has passed target-device proof and the central SG brand release decision is recorded.
