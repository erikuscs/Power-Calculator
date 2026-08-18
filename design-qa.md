# Product Design QA - Temporary Power Runtime and Scope

## Evidence

- Source visual truth: `/Users/erikherring/.codex/generated_images/01a011a9-a3c5-7810-ad97-f5d2bba30394/exec-ed5a6292-47be-46ae-928e-592150d25f52.png`
- Browser-rendered implementation: `/Users/erikherring/Projects/emaas-pro/.codex-audit/build-qa/ui-generator-only-final-1490x1060.png`
- Full-view comparison: `/Users/erikherring/Projects/emaas-pro/.codex-audit/build-qa/design-comparison-runtime-scope.png`
- Focused package and one-line comparison: `/Users/erikherring/Projects/emaas-pro/.codex-audit/build-qa/focused-plan-comparison.png`
- Responsive comparison: `/Users/erikherring/Projects/emaas-pro/.codex-audit/build-qa/responsive-comparison.png`
- PDF contact sheet: `/Users/erikherring/Projects/emaas-pro/tmp/pdfs/temp-power-final/contact-sheet.png`

## Normalization and State

- Source pixels: 1486 x 1058. It was normalized to 1490 x 1060 for comparison.
- Implementation pixels and CSS viewport: 1490 x 1060 at devicePixelRatio 1.
- Responsive CSS viewports: 768 x 1024 and 390 x 844 at devicePixelRatio 1.
- Theme: dark desktop/web application.
- Source state: hybrid generator, BESS, and cooling.
- Implementation state: generator-only default. The equipment and content difference is intentional and required by the revised brief; visual fidelity was judged on hierarchy, layout language, tokens, controls, typography, one-line legibility, and interaction polish rather than matching the superseded hybrid scope.

## Findings and Comparison History

1. **P1 - Runtime required a manually calculated hour total.**
   - Earlier evidence: the requirements form exposed a free-entry `Duration` field in hours.
   - Fix: replaced it with rental period, period count, and 8-hour-shift or 24/7 schedule inputs. The UI now displays the derived operating hours and rental days immediately.
   - Post-fix evidence: two weekly periods at an 8-hour shift produced 112 operating hours and 14 rental days in the browser.

2. **P1 - Cooling and hybrid equipment appeared in a generator request by default.**
   - Earlier evidence: the reference package, one-line, 3D image, and PDF included BESS and cooling in the initial recommendation.
   - Fix: made standalone generator the default source; temporary cooling is an explicit add-on. Battery and hybrid evaluation remains in the separate Hybrid EMaaS Strategy workflow.
   - Post-fix evidence: the default one-line, 3D view, metrics, calculations, field questions, and PDF omit cooling and BESS. Selecting cooling adds its load, tonnage, branch, 3D equipment, and PDF rows.

3. **P2 - ATS was rendered as a second generator in the compact one-line.**
   - Earlier evidence: symbol classification matched the word `Generator` in `ATS / Generator Controller` before matching the ATS device ID.
   - Fix: device IDs and transfer terminology now classify the ATS before generator labels.
   - Post-fix evidence: the final desktop and focused comparisons show the ATS/52 transfer symbol between the generator breaker and switchgear.

4. **P2 - A long cooling label collided with the transformer label in the compact one-line.**
   - Earlier evidence: `Temporary Cooling Add-on` overlapped the adjacent transformer text at the target desktop viewport.
   - Fix: shortened the diagram equipment label to `Cooling Plant`; the surrounding UI retains the clearer add-on wording.
   - Post-fix evidence: the final generator-only state is clear, and the cooling-on state renders separate equipment branches without horizontal page overflow.

5. **P2 - The final field question spilled onto the PDF without a section heading.**
   - Earlier evidence: the first PDF render began page 5 with an orphaned warning box.
   - Fix: split remaining field questions into a titled page section before project assumptions.
   - Post-fix evidence: the five-page Poppler render shows complete headings, aligned tables, no clipped text, and no orphaned warning boxes.

## Required Fidelity Surfaces

- Fonts and typography: existing EMaaS font stack, weights, hierarchy, line height, uppercase labels, and wrapping were preserved. No clipped or truncated primary text was found.
- Spacing and layout rhythm: recommendation-first hierarchy remains consistent with the source. Removing alternatives and unused hybrid rows intentionally reduces density. Desktop, tablet, and mobile screenshots show aligned cards and no horizontal overflow.
- Colors and tokens: existing navy, charcoal, gold, blue, muted text, confidence, border, and focus tokens are preserved.
- Image quality and assets: generator-only and generator-plus-cooling 3D renders match the established isometric industrial art direction and show only selected equipment. Images are sharp at desktop and in the PDF.
- Copy and content: rental duration, operating schedule, derived hours, generator-first scope, optional cooling, breaker-panel rationale, wet stacking, forced regeneration, overload trips, and unscheduled shutdowns are stated in plain language. User-facing `savings` terminology is absent from the final PDF.

## Interaction and Technical Verification

- Opened and closed the requirements dialog.
- Verified monthly plus 8-hour shift equals 240 operating hours.
- Verified two weekly periods plus 8-hour shift equals 112 operating hours and 14 rental days.
- Confirmed cooling inputs are absent for generator-only and appear after selecting `Add Temporary Cooling`.
- Confirmed selected scope updates the recommendation, one-line, metrics, energy priorities, and 3D asset.
- Exercised One-Line and 3D Site Layout tabs.
- Generated and saved the PDF from the browser.
- Checked browser console warnings and errors: none.
- Checked desktop, tablet, and mobile horizontal overflow: none.
- Automated verification: 13 test files and 102 tests passed; lint passed; production build and PWA generation passed; PDF render test passed.

## Open Questions

- None.

## Follow-up Polish

- P3: if the rental catalog later supplies exact calendar start and end dates, a date-range option could sit behind an advanced control without changing the simple daily, weekly, and monthly path.

final result: passed
