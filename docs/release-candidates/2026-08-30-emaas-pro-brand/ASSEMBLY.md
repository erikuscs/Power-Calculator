# EMaaS Pro Web-Shell Brand-Only Freeze Package

Status: `REVIEW / NOT RELEASED / NOT DEPLOYED`

Canonical repository: `/Users/sustainablegaps/Projects/emaas-pro`

Informational Git anchor: `2c27ed215942836177c2607f571074424f83f6b2`.
The exact input hashes, not Git HEAD, control assembly because the Header and
workflow smoke test contained pre-existing uncommitted work.

## Authority

- Consolidated correction matrix:
  `/Users/sustainablegaps/SG-OFFICE/Brand Guidelines/01-Current-SG-Brand/17-Brand-Governance-Operations-2026/02-Change-Control/DIGITAL-BRAND-IMPLEMENTATION-CORRECTION-MATRIX-20260830.md`
  — SHA-256
  `431c065deb13eee53b60e611dd61c7ac7754164336f726d813bbdd16a4f73ab4`.
- Step 3 owner authorization:
  `/Users/sustainablegaps/SG-OFFICE/Brand Guidelines/01-Current-SG-Brand/17-Brand-Governance-Operations-2026/02-Change-Control/DIGITAL-BRAND-IMPLEMENTATION-STEP-3-OWNER-AUTHORIZATION-20260830.md`
  — SHA-256
  `f3c30a536d47b610cae50c5575f5ecabdf37b857257f945cf77a0754186d1ed9`.
- Candidate source-use record: `docs/SOURCE-MAP.md` — SHA-256
  `d12c0de98613c296208a37f8f6e392465942b8f615bcdda4002d7c764269d71e`.
- Existing 17-entry review-evidence manifest:
  `docs/BRAND-SHELL-CHECKSUMS-SHA256.txt` — SHA-256
  `dc75b766f22aad11bf7936d15b889de314a167b24140ffff3197c702464162e9`.

## Frozen Boundary

`emaas-pro-web-shell-brand-only.patch` contains only the approved web-shell
brand hunks across nine text files:

- exact first-reference and later-use naming in metadata and existing display
  locations, while retaining the `emaas.pro` URL;
- local font-face declarations, approved palette values, and heading/body font
  assignments;
- the registered reversed-dark horizontal logo in the existing home-link brand
  block; and
- two naming assertions in the existing workflow smoke test.

The Header patch changes only the old Zap/type brand block. It preserves the
pre-existing return link, menu/focus work, connectivity state, and all other
Header behavior. The test patch changes only the naming assertions and excludes
all broader pre-existing test work. The final CSS patch never adds the temporary
`button, input, select, textarea { font: inherit; }` intermediate edit.

Do not replace this patch with a whole `git diff`, whole-file export, or
Git-HEAD patch. `ASSET-COPY-MANIFEST.tsv` freezes the three byte-identical
controlled inputs and permits no substitutes.

The existing 17-entry checksum manifest remains review evidence; it includes
whole current files and screenshots. This package does not use those screenshots
as assembly inputs and does not use that manifest as a substitute for the
hunk-only patch.

## Guarded Assembly

Run from the canonical repository root. First verify `PACKAGE-SHA256.txt` from
the package directory and independently verify the two authority hashes above.

1. Run
   `shasum -a 256 -c docs/release-candidates/2026-08-30-emaas-pro-brand/OUTPUT-SHA256.txt`.
2. If every output already passes, the exact candidate is already assembled;
   do not apply or copy anything again.
3. Otherwise run
   `shasum -a 256 -c docs/release-candidates/2026-08-30-emaas-pro-brand/INPUT-SHA256.txt`.
   Any mismatch is a hard stop.
4. Run
   `git apply --check docs/release-candidates/2026-08-30-emaas-pro-brand/emaas-pro-web-shell-brand-only.patch`.
5. Only after both checks pass, apply that patch once.
6. For every asset row, verify the controlled source hash. If the destination
   exists, accept it only when its hash is already exact; never overwrite a
   differing file. If absent, create only its parent and copy the controlled
   source byte-for-byte.
7. Run
   `shasum -a 256 -c docs/release-candidates/2026-08-30-emaas-pro-brand/OUTPUT-SHA256.txt`.
   The source map and existing evidence manifest are immutable prerequisites;
   this patch intentionally does not create or modify them.

The text patch was independently round-tripped in task scratch. Reverse
application to the exact current outputs reproduced all nine input hashes;
forward application reproduced all nine output hashes byte-for-byte. The three
controlled source hashes matched their current repository destinations. No
build, dependency install, duplicate worktree, PDF render, Xcode/Capacitor
operation, or deployment is required.

## Release Boundary And Holds

This package is construction evidence only. It does not authorize deployment,
publication, formula/data/chart/diagram/PDF changes, Xcode/iOS/Capacitor
changes, or product behavior changes. Font copyright/OFL accompaniment, the
logo production register, and all separate owner/live-surface gates remain
controlling.
