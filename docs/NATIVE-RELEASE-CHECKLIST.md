# EMaaS Pro Native Release Checklist

Status: `PROCEDURE / NO SUBMISSION AUTHORIZATION`

This replaces the July machine-specific morning checklist. It deliberately contains no saved account state, device nickname, order number, or claim that Apple submission prerequisites are still current.

## Prepare source

1. Confirm `/Users/sustainablegaps/Projects/emaas-pro` is the Git top level.
2. Confirm the intended commit, branch, and release owner decision.
3. Use Node 22 and run:

   ```bash
   npm ci
   npm test
   npm run lint
   npm run build
   npm run test:e2e
   npx cap sync ios
   ```

4. Rerun `npm run audit:brand` after the native sync so the packaged iOS web bundle is checked.
5. Confirm the repository is clean or that every release change is intentionally staged.

## Verify native targets

1. Open `ios/App/App.xcodeproj` through `npx cap open ios`.
2. Verify bundle identifier `pro.emaas.app`, display name `EMaaS Pro`, signing team, version, and build number.
3. Build and run on current supported iPhone and iPad simulator families.
4. Verify first launch, navigation, saved-state behavior, all primary workflows, PDF share, safe areas, rotation policy, app icon, launch screen, and offline behavior.
5. Confirm the icon survives rounded-square and platform masking and the launch mark is centered without clipping.
6. Capture review evidence in the controlled product evidence lane; do not leave simulator screenshots or DerivedData in the repository.

## Distribution gate

Before archive or submission, verify the current Apple requirements from official Apple documentation and App Store Connect. Confirm privacy answers, support/privacy URLs, screenshots, export-compliance answers, age rating, trader status where applicable, listing copy, and review notes against the actual submitted build.

A successful archive or upload is not App Store acceptance. Record the processed build, device verification, submission status, and final App Store surface separately.
