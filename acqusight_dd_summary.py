from datetime import date
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether
)
from reportlab.lib.enums import TA_LEFT

OUT = "/home/user/Power-Calculator/AcquSight_Due_Diligence_Summary.pdf"

styles = getSampleStyleSheet()
ink = colors.HexColor("#1e1e1e")
muted = colors.HexColor("#6a6a6a")
accent = colors.HexColor("#1e3c6e")
rule = colors.HexColor("#c8d3e6")
callout_fill = colors.HexColor("#fbf7e3")
callout_border = colors.HexColor("#d9c46a")

styles.add(ParagraphStyle(
    "Title2", parent=styles["Title"], fontName="Helvetica-Bold",
    fontSize=22, leading=26, textColor=colors.HexColor("#0f1e46"),
    spaceAfter=4, alignment=TA_LEFT,
))
styles.add(ParagraphStyle(
    "Subtitle", parent=styles["Normal"], fontName="Helvetica",
    fontSize=13, leading=16, textColor=muted, spaceAfter=10,
))
styles.add(ParagraphStyle(
    "Meta", parent=styles["Normal"], fontName="Helvetica",
    fontSize=9.5, leading=13, textColor=colors.HexColor("#444"),
    spaceAfter=10,
))
styles.add(ParagraphStyle(
    "H2", parent=styles["Heading2"], fontName="Helvetica-Bold",
    fontSize=13, leading=17, textColor=accent,
    spaceBefore=14, spaceAfter=6,
))
styles.add(ParagraphStyle(
    "Body2", parent=styles["BodyText"], fontName="Helvetica",
    fontSize=10.5, leading=14.5, textColor=ink, spaceAfter=6,
))
styles.add(ParagraphStyle(
    "Bullet2", parent=styles["BodyText"], fontName="Helvetica",
    fontSize=10.5, leading=14.5, textColor=ink,
    leftIndent=12, bulletIndent=2, spaceAfter=2,
))
styles.add(ParagraphStyle(
    "Callout", parent=styles["BodyText"], fontName="Helvetica-Bold",
    fontSize=10.5, leading=14.5, textColor=colors.HexColor("#5a4400"),
))
styles.add(ParagraphStyle(
    "Caveat", parent=styles["BodyText"], fontName="Helvetica-Oblique",
    fontSize=8.5, leading=11.5, textColor=muted,
))
styles.add(ParagraphStyle(
    "TblKey", parent=styles["BodyText"], fontName="Helvetica-Bold",
    fontSize=9.5, leading=12.5, textColor=ink,
))
styles.add(ParagraphStyle(
    "TblVal", parent=styles["BodyText"], fontName="Helvetica",
    fontSize=9.5, leading=12.5, textColor=ink,
))


def header_footer(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 8.5)
    canvas.setFillColor(muted)
    canvas.drawString(18 * mm, A4[1] - 12 * mm, "AcquSight, Inc. - Due Diligence Summary")
    canvas.drawRightString(A4[0] - 18 * mm, A4[1] - 12 * mm, f"Prepared {date.today().isoformat()}")
    canvas.setStrokeColor(colors.HexColor("#dcdcdc"))
    canvas.line(18 * mm, A4[1] - 14 * mm, A4[0] - 18 * mm, A4[1] - 14 * mm)
    canvas.setFont("Helvetica-Oblique", 8)
    canvas.drawCentredString(A4[0] / 2, 10 * mm, f"Page {doc.page}")
    canvas.restoreState()


def callout(text):
    p = Paragraph(text, styles["Callout"])
    tbl = Table([[p]], colWidths=[None])
    tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), callout_fill),
        ("BOX", (0, 0), (-1, -1), 0.75, callout_border),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]))
    return tbl


def kv_table(rows):
    data = [[Paragraph(k, styles["TblKey"]), Paragraph(v, styles["TblVal"])] for k, v in rows]
    tbl = Table(data, colWidths=[55 * mm, None])
    tbl.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LINEBELOW", (0, 0), (-1, -2), 0.25, colors.HexColor("#e6e6e6")),
        ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#f6f8fc")),
    ]))
    return tbl


def bullets(items):
    return [Paragraph(item, styles["Bullet2"], bulletText="-") for item in items]


story = []

story.append(Paragraph("AcquSight, Inc.", styles["Title2"]))
story.append(Paragraph("Due Diligence Summary - Energy Sector Relevance", styles["Subtitle"]))
story.append(Paragraph(
    "Subject: <b>acqusight.com</b> &nbsp;|&nbsp; Entity: AcquSight, Inc. (Virginia) &nbsp;|&nbsp; "
    "Founded: 2014 &nbsp;|&nbsp; Principal: David Winks, Managing Director &nbsp;|&nbsp; "
    "Address: 154 Lyle Lane, Amissville, VA 20106",
    styles["Meta"],
))

story.append(callout(
    "VERDICT: Single-principal home-office advisory shell. Real founder credentials in EMP/grid "
    "resilience, but no public evidence of an operating business with disclosed contracts, staff, "
    "or revenue. Energy is adjacent (microgrid resilience), not a substantive commercial line."
))
story.append(Spacer(1, 6))

story.append(Paragraph("1. What it actually is", styles["H2"]))
story.append(Paragraph(
    "AcquSight is a single-principal consultancy founded 2014 by David Winks, operating from his "
    "residence in Amissville, VA (Zillow: 3BR single-family home, ~$1.48M valuation). Headcount is "
    "estimated at 1-2 employees with $130-200K revenue (ZoomInfo / Manta). The website is built on "
    "<b>GoDaddy Websites + Marketing</b> - the <font face='Courier'>/blog/f/&lt;slug&gt;</font> URL "
    "pattern is its signature - and fronted by AWS edge IPs. The 'thin 2019 GoDaddy template' "
    "impression matches the digital substance.",
    styles["Body2"],
))

story.append(Paragraph("2. Substance check - what is there, what is not", styles["H2"]))
checks = [
    ("Federal prime contracts", "None found in USAspending, FPDS, HigherGov, GovTribe, or GovCB. Vendor shell exists; no awarded dollars surfaced."),
    ("SBIR / STTR awards", "None. <font face='Courier'>site:sbir.gov \"AcquSight\"</font> returns zero results."),
    ("SAM.gov registration", "Active. UEI <b>CKE4V41WAFG3</b>. Small Business / WOSB / SDB. NAICS 541512 (custom programming), 541611 (mgmt consulting)."),
    ("USPTO patents (assignee)", "None."),
    ("Press releases (BW / PRN / GNW / EIN)", "None on any major wire service."),
    ("Lobbying", "Listed on LegiStorm (id 233924); page paywalled. Manual check at lda.senate.gov required for amounts and clients."),
    ("Virginia SCC filing", "Registered, entity ID 07840002."),
    ("LinkedIn company page", "Does not exist - only David Winks's personal profile."),
    ("Other named staff / advisors / board", "None surfaced across any source."),
    ("Job postings (Glassdoor / Indeed, ever)", "None."),
    ("Social media (X, YouTube, Facebook)", "No presence."),
    ("Site blog cadence", "Four undated posts, topically vintage ~2019-2021. No recent content."),
]
story.append(kv_table(checks))

story.append(Paragraph("3. What does exist (credibility signals)", styles["H2"]))
story.extend(bullets([
    "Winks authored <i>'Protecting U.S. Electric Grid Communications from Electromagnetic Pulse'</i> "
    "(Foundation for Resilient Societies, May 2020).",
    "Contributing author to InfraGard's <i>'Powering Through'</i> infrastructure resilience series.",
    "Listed SME on the DHS Resilient Power Working Group (advisory role, not a contract).",
    "Quoted as an EMP / grid-resilience expert in Fox News and Washington Times (Nov 2021).",
    "Speaker at OSIsoft PI World 2018, EnergyTech University Prize, and InfraGard EMP SIG Summit 2018.",
    "Real Virginia entity with active SAM registration - capable of taking subcontracts that would "
    "not surface as prime awards in public databases.",
]))

story.append(Paragraph("4. Energy sector relevance", styles["H2"]))
story.append(Paragraph(
    "On the website, power generation is one of five named pillars. The microgrid offering "
    "explicitly integrates small nuclear reactors, fuel cells, geothermal, gas turbines, and "
    "thermal storage - but framed as <b>EMP-shielded, cyber-hardened microgrids for defense / "
    "critical infrastructure</b>, not commercial power markets.",
    styles["Body2"],
))
story.append(Paragraph(
    "No evidence found of utility, IPP, oil &amp; gas, or renewables customers; energy-sector "
    "partnerships; M&amp;A advisory transactions; ISO/RTO market participation; or wind / solar "
    "product lines. Visible energy engagement is personal thought leadership by Winks, not "
    "corporate deal flow.",
    styles["Body2"],
))
story.append(callout(
    "Energy is a core technical CAPABILITY (resilient on-site power) but applied almost exclusively "
    "to defense / national-security resilience. The firm is ADJACENT TO rather than EMBEDDED IN "
    "the commercial energy sector."
))

story.append(PageBreak())

story.append(Paragraph("5. Due diligence verdict", styles["H2"]))
story.append(Paragraph(
    "<b>'Is there a real operating business here?'</b> &nbsp; No public evidence of one. The profile "
    "is consistent with a one-person thought-leadership / advisory shop, monetizing SME work and "
    "possibly subcontracts that do not surface in public databases.",
    styles["Body2"],
))
story.append(Paragraph(
    "<b>'Is the founder a credible subject-matter expert?'</b> &nbsp; Yes - specifically on EMP and "
    "electric-grid resilience.",
    styles["Body2"],
))

story.append(Paragraph("6. Recommended manual checks before closing DD", styles["H2"]))
story.append(Paragraph(
    "Several authoritative sources returned HTTP 403 to automated scraping and should be verified "
    "by hand:",
    styles["Body2"],
))
story.extend(bullets([
    "<b>SAM.gov</b> - confirm registration is active, view full NAICS / PSC list, exclusions status.",
    "<b>Virginia SCC</b> (cis.scc.virginia.gov) - current standing, annual report filings, registered agent.",
    "<b>Senate LDA</b> (lda.senate.gov) - exact lobbying registrants, clients, dollar amounts.",
    "<b>assignment.uspto.gov</b> - patent assignments (distinct from issued patents).",
    "<b>archive.org Wayback</b> - first snapshot of acqusight.com and content evolution over time.",
    "<b>Subcontract data</b> - FPDS sub-awards, USAspending sub-recipient search, FOIA on DoD/DHS for any AcquSight involvement on prime contracts.",
    "<b>Litigation / bankruptcy</b> - PACER and Virginia Circuit Court records for David Winks personally.",
    "<b>Business credit</b> - D&amp;B Paydex, Experian Business trade lines.",
]))

story.append(Paragraph("7. Key sources", styles["H2"]))
story.extend(bullets([
    "acqusight.com &nbsp;|&nbsp; acqusight.com/services",
    "Potomac Officers Club - David Winks profile",
    "RocketReach - David Winks; ZoomInfo, Manta, Cience - AcquSight company profiles",
    "GovCB and GovTribe federal vendor profiles",
    "OpenCorporates VA entity ID 07840002",
    "LegiStorm lobbying overview id 233924",
    "Foundation for Resilient Societies - Winks 2020 EMP paper",
    "EnergyTech.org speaker page; OSIsoft PI World 2018 speaker page",
    "Fox News / Washington Times - Winks quoted on EMP threat (Nov 2021)",
    "Zillow / FamilyTreeNow - 154 Lyle Ln, Amissville, VA (residential address)",
]))

story.append(Spacer(1, 8))
story.append(Paragraph(
    "Caveat: several authoritative sources (SAM.gov, OpenCorporates, LegiStorm, web.archive.org, "
    "WHOIS providers) returned HTTP 403 to automated fetches during research. Findings derived from "
    "indexed snippets and third-party mirrors should be verified manually before being relied on "
    "for a final DD decision.",
    styles["Caveat"],
))

doc = SimpleDocTemplate(
    OUT,
    pagesize=A4,
    leftMargin=18 * mm, rightMargin=18 * mm,
    topMargin=20 * mm, bottomMargin=16 * mm,
    title="AcquSight - Due Diligence Summary",
    author="Research synthesis",
)
doc.build(story, onFirstPage=header_footer, onLaterPages=header_footer)
print(f"Wrote {OUT}")
