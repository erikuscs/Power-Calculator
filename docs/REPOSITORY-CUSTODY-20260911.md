# EMaaS Pro Repository Custody Record — 2026-09-11

Status: `REVIEW / LOCAL ONLY`

## Source and destination

- Application source of truth: `/Users/sustainablegaps/Projects/emaas-pro`
- Physical checkout: `/Volumes/SustainableGaps/Linked-Offload/Branch-and-Tool-Offload/Projects/emaas-pro`
- The linked-offload location is permitted by the storage register as active Mac Mini extension storage. No repository relocation was performed.

## Controlled moves

| Source | Destination | Bytes | SHA-256 | Result |
| --- | --- | ---: | --- | --- |
| `docs/SBA-BUSINESS-PLAN-HANDOFF.md` | `/Users/sustainablegaps/SG-OFFICE/Business Development/Working/EMaaS Pro/SBA-BUSINESS-PLAN-HANDOFF.md` | 13,395 | `a4fe81147cdeb1cfb91a8303ed41385087c337ee23af51304cd1f43917b3f990` | Exact checksum preserved; removed from app repository |
| `docs/RED-TEAM-DEBRIEF.md` | `/Users/sustainablegaps/SG-OFFICE/Positioning and Traction/Evidence/EMaaS Pro/RED-TEAM-DEBRIEF.md` | 10,571 | `96e5bfcc1bc4e39b08dcaeb06587e56f24f0347e44d75ffc3aba1bd869797d4a` | Exact checksum preserved; removed from app repository |
| `.azure/plan.md` | `/Users/sustainablegaps/SG-OFFICE/Websites and Products/03 EMaaS Pro/Review Evidence/2026-08-30/AZURE-PLAN-STALE-NOT-AUTHORIZATION.md` | 9,438 | `fdd82bf541b4ded5197bb1111351144adb40f79334ae39eed8d3ef93a851e849` | Exact checksum preserved and relabeled as stale, not current deployment authority |

## Removed or replaced repository material

- Removed the unused `public/icons.svg` starter sprite.
- Removed six unreferenced generated 3D JPGs under `src/assets/`; Git history remains the recovery path.
- Replaced the generic gold lightning icon and splash family across root Capacitor inputs and the iOS asset catalog.
- Replaced stale active documentation with current repository, QA, handoff, and native-release guidance. Git history preserves earlier versions.
- Moved approximately 370 MiB of ignored `.playwright-cli`, `output`, `tmp`, and `dist` material plus Finder metadata to the macOS Trash. These were stale review/build/derived outputs; they remain recoverable from Trash until it is emptied, and build/test outputs can be regenerated.
- Retained `node_modules` for the current verification run; it remains ignored and reproducible from `package-lock.json`.

No cloud synchronization, push, pull request, Azure deployment, App Store upload, or public release was performed.
