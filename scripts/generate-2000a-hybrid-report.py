#!/usr/bin/env python3
"""Generate the customer-facing EMaaS Pro 2,000 A hybrid linked-plan example."""

from __future__ import annotations

import math
import shutil
from pathlib import Path

from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "output" / "pdf" / "EMAAS-Pro-2000A-Hybrid-Linked-Plan.pdf"
SITE_COPY = ROOT / "public" / "examples" / "EMAAS-Pro-2000A-Hybrid-Linked-Plan.pdf"

PAGE_W = 1152
PAGE_H = 720

NAVY = "#08131E"
PANEL = "#101E2B"
PANEL_2 = "#152636"
GRID = "#1C3142"
LINE = "#345168"
WHITE = "#F9FAFB"
SILVER = "#C5C6C7"
MUTED = "#8FA1B2"
COPPER = "#D88A34"
COPPER_DARK = "#3A2A1D"
BLUE = "#ABE1FA"
BLUE_DARK = "#183649"
MINT = "#70D6A8"
MINT_DARK = "#17382F"
WARNING = "#F0B44D"


def color(value: str):
    from reportlab.lib.colors import HexColor

    return HexColor(value)


def register_fonts() -> tuple[str, str]:
    body_path = ROOT / "public" / "fonts" / "SourceSans3-Variable.ttf"
    display_path = ROOT / "public" / "fonts" / "Sora-Variable.ttf"
    try:
        pdfmetrics.registerFont(TTFont("EMAASBody", str(body_path)))
        pdfmetrics.registerFont(TTFont("EMAASDisplay", str(display_path)))
        return "EMAASBody", "EMAASDisplay"
    except Exception:
        return "Helvetica", "Helvetica-Bold"


BODY, DISPLAY = register_fonts()


def top_y(top: float) -> float:
    return PAGE_H - top


def rect(c: canvas.Canvas, x: float, top: float, width: float, height: float, fill: str, stroke: str = LINE, radius: float = 7, stroke_width: float = 1):
    c.setFillColor(color(fill))
    c.setStrokeColor(color(stroke))
    c.setLineWidth(stroke_width)
    c.roundRect(x, PAGE_H - top - height, width, height, radius, fill=1, stroke=1)


def text(c: canvas.Canvas, x: float, top: float, value: str, size: float = 9, fill: str = SILVER, font: str = BODY):
    c.setFillColor(color(fill))
    c.setFont(font, size)
    c.drawString(x, top_y(top), value)


def centered(c: canvas.Canvas, x: float, top: float, width: float, value: str, size: float = 9, fill: str = SILVER, font: str = BODY):
    c.setFillColor(color(fill))
    c.setFont(font, size)
    c.drawCentredString(x + width / 2, top_y(top), value)


def line(c: canvas.Canvas, x1: float, top1: float, x2: float, top2: float, stroke: str = BLUE, width: float = 2):
    c.setStrokeColor(color(stroke))
    c.setLineWidth(width)
    c.line(x1, top_y(top1), x2, top_y(top2))


def arrow(c: canvas.Canvas, x1: float, top: float, x2: float, stroke: str = BLUE):
    line(c, x1, top, x2, top, stroke, 2.3)
    c.setFillColor(color(stroke))
    y = top_y(top)
    c.setStrokeColor(color(stroke))
    c.line(x2 - 8, y + 5, x2, y)
    c.line(x2 - 8, y - 5, x2, y)


def metric(c: canvas.Canvas, x: float, top: float, label: str, value: str, value_fill: str = WHITE):
    text(c, x, top, label.upper(), 7.5, MUTED, DISPLAY)
    text(c, x, top + 17, value, 15, value_fill, DISPLAY)


def one_line_box(c: canvas.Canvas, x: float, top: float, width: float, height: float, title: str, rows: list[str], fill: str, stroke: str):
    rect(c, x, top, width, height, fill, stroke, 6, 1.2)
    centered(c, x, top + 20, width, title, 10, WHITE, DISPLAY)
    for index, row in enumerate(rows):
        centered(c, x, top + 38 + (index * 13), width, row, 8, SILVER, BODY)


def equipment(c: canvas.Canvas, x: float, top: float, length_ft: float, width_ft: float, scale: float, label: str, fill: str, stroke: str):
    width = length_ft * scale
    height = width_ft * scale
    rect(c, x, top, width, height, fill, stroke, 3, 1)
    centered(c, x, top + (height / 2) + 3, width, label, 6.7, WHITE, BODY)
    return width, height


def generate() -> None:
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    SITE_COPY.parent.mkdir(parents=True, exist_ok=True)

    service_amps = 2000
    voltage = 480
    power_factor = 0.80
    service_kva = service_amps * voltage * math.sqrt(3) / 1000
    protected_kw = service_kva * power_factor
    generator_installed_kw = 4 * 500
    generator_firm_kw = 3 * 500
    bess_installed_kw = 7 * 250
    bess_firm_kw = 6 * 250
    bess_installed_kwh = 7 * 518
    bess_firm_kwh = 6 * 518
    all_online_headroom_kw = generator_installed_kw - protected_kw
    one_offline_headroom_kw = generator_firm_kw - protected_kw

    assert round(service_kva, 1) == 1662.8
    assert round(protected_kw, 1) == 1330.2
    assert generator_firm_kw >= protected_kw
    assert bess_firm_kw >= protected_kw
    assert round(all_online_headroom_kw, 1) == 669.8
    assert round(one_offline_headroom_kw, 1) == 169.8

    c = canvas.Canvas(str(OUTPUT), pagesize=(PAGE_W, PAGE_H), pageCompression=1, invariant=1)
    c.setTitle("EMaaS Pro - 2,000 A Hybrid Linked Plan and One-Line")
    c.setAuthor("Sustainable Gaps")
    c.setSubject("Conceptual 480 V three-phase hybrid temporary-power planning example")

    c.setFillColor(color(NAVY))
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)

    # Left navigation - styled as an EMaaS Pro application report, not a screenshot.
    c.setFillColor(color("#0B1824"))
    c.rect(0, 0, 154, PAGE_H, fill=1, stroke=0)
    text(c, 18, 34, "EMaaS Pro", 22, WHITE, DISPLAY)
    text(c, 20, 53, "by SUSTAINABLE GAPS", 7.5, SILVER, DISPLAY)
    line(c, 0, 70, 154, 70, LINE, 0.8)
    text(c, 18, 94, "2,000 A HYBRID EXAMPLE", 7.5, COPPER, DISPLAY)
    for top, label in [
        (125, "Sizing basis"),
        (156, "Electrical one-line"),
        (187, "Scaled site layout"),
        (218, "Capacity and continuity"),
        (249, "Field verification"),
    ]:
        if top == 156:
            rect(c, 10, top - 18, 134, 28, COPPER_DARK, COPPER, 5, 1)
            text(c, 20, top, label, 9, WHITE, DISPLAY)
        else:
            text(c, 20, top, label, 9, SILVER, BODY)
    text(c, 18, 660, "PLANNING EXAMPLE", 7, MUTED, DISPLAY)
    text(c, 18, 678, "PE and vendor verification", 7, SILVER, BODY)
    text(c, 18, 692, "required before release", 7, SILVER, BODY)

    # Header.
    text(c, 176, 35, "2,000 A Hybrid Service - Linked Plan + One-Line", 20, WHITE, DISPLAY)
    text(c, 176, 56, "480 V, 3-phase temporary-power example with modular generation, BESS continuity and DEIF controls", 9, SILVER, BODY)
    rect(c, 935, 22, 195, 39, PANEL, LINE, 6, 1)
    centered(c, 935, 46, 195, "CONCEPTUAL - NOT FOR CONSTRUCTION", 7.5, BLUE, DISPLAY)
    line(c, 154, 75, PAGE_W, 75, LINE, 0.8)

    # One-line panel.
    rect(c, 170, 90, 755, 255, PANEL, LINE, 8, 1)
    text(c, 184, 113, "Electrical One-Line Diagram", 13, WHITE, DISPLAY)
    text(c, 184, 132, "2,000 A service sizing basis at 480 V, 3-phase", 8.5, SILVER, BODY)

    one_line_box(c, 188, 160, 122, 72, "GEN PLANT", ["4 x 500 kW", "2,000 kW installed", "1,500 kW firm"], COPPER_DARK, COPPER)
    one_line_box(c, 188, 252, 122, 72, "BESS PLANT", ["7 x 250 kW cont.", "3,626 kWh net", "1,500 kW firm"], BLUE_DARK, BLUE)
    one_line_box(c, 352, 200, 90, 84, "DEIF", ["lead / lag", "parallel", "recharge limit"], "#27323D", COPPER)
    one_line_box(c, 486, 200, 106, 84, "SWGR-1", ["480 V, 3-phase", "protected bus", "metering / OCPD"], "#1B2C3C", WARNING)
    one_line_box(c, 636, 200, 80, 84, "CB-1", ["2,000 A", "service", "breaker"], "#1B2C3C", BLUE)
    one_line_box(c, 760, 200, 136, 84, "CUSTOMER SERVICE", ["480 V, 3-phase", f"{service_kva:,.0f} kVA", f"{protected_kw:,.0f} kW @ 0.80 PF"], MINT_DARK, MINT)

    arrow(c, 310, 196, 352, COPPER)
    arrow(c, 310, 288, 352, BLUE)
    arrow(c, 442, 242, 486, BLUE)
    arrow(c, 592, 242, 636, BLUE)
    arrow(c, 716, 242, 760, BLUE)
    text(c, 354, 304, "BESS-only intervals: zero generator fuel burn", 7.5, MINT, BODY)
    text(c, 540, 320, "Optional step-down transformer only when downstream 208/120 V loads require it", 7.5, SILVER, BODY)

    # Site layout panel.
    rect(c, 170, 360, 755, 322, PANEL, LINE, 8, 1)
    text(c, 184, 383, "Scaled Conceptual Site Layout", 13, WHITE, DISPLAY)
    text(c, 184, 402, "Equipment bodies use current EMaaS fleet-class planning dimensions; clearances and exact delivered sizes require field verification", 8.3, SILVER, BODY)
    rect(c, 184, 418, 727, 244, "#0A1722", "#52697C", 5, 1)
    text(c, 194, 435, "220 ft planning length", 7, MUTED, BODY)
    text(c, 855, 435, "120 ft width", 7, MUTED, BODY)

    scale = 2.20
    # Four 500 kW generators: 25 x 11 ft planning bodies.
    for index in range(4):
        x = 200 + (index * 82)
        equipment(c, x, 452, 25, 11, scale, f"GEN-{index + 1}", COPPER_DARK, COPPER)
        centered(c, x, 489, 55, "25 x 11 ft", 6.4, MUTED, BODY)

    # Seven 250 kW BESS units: 23 x 10 ft planning bodies.
    for index in range(7):
        row = 0 if index < 4 else 1
        col = index if index < 4 else index - 4
        x = 200 + (col * 76)
        top = 532 + (row * 47)
        equipment(c, x, top, 23, 10, scale, f"BESS-{index + 1}", BLUE_DARK, BLUE)
    text(c, 200, 632, "BESS body: 23 x 10 ft each - 250 kW continuous / 518 kWh net each", 7, MUTED, BODY)

    equipment(c, 555, 452, 12, 8, scale, "DEIF", "#27323D", COPPER)
    equipment(c, 628, 452, 24, 8, scale, "SWGR", "#1B2C3C", WARNING)
    equipment(c, 748, 452, 30, 12, scale, "FUEL / SERVICE", COPPER_DARK, COPPER)
    rect(c, 545, 535, 340, 55, "#1A2A39", LINE, 4, 1)
    centered(c, 545, 559, 340, "20 FT ACCESS / DELIVERY / MAINTENANCE LANE", 7.2, SILVER, DISPLAY)
    text(c, 554, 610, "Conceptual cable paths", 7, MUTED, BODY)
    line(c, 555, 620, 860, 620, COPPER, 1.6)
    c.setDash(5, 4)
    line(c, 555, 640, 860, 640, BLUE, 1.6)
    c.setDash()

    # Right summary.
    rect(c, 942, 90, 190, 592, PANEL, LINE, 8, 1)
    text(c, 958, 116, "Sizing Summary", 13, WHITE, DISPLAY)
    metric(c, 958, 146, "Service", "2,000 A")
    metric(c, 958, 194, "Electrical basis", "480 V / 3-phase")
    metric(c, 958, 242, "Planning load", f"{protected_kw:,.0f} kW")
    line(c, 958, 274, 1115, 274, LINE, 0.8)
    metric(c, 958, 296, "Generation", "4 x 500 kW", COPPER)
    text(c, 958, 331, "2,000 kW installed", 8, SILVER, BODY)
    text(c, 958, 346, "1,500 kW firm with one offline", 8, SILVER, BODY)
    metric(c, 958, 382, "BESS", "7 x 250 kW", BLUE)
    text(c, 958, 417, f"{bess_installed_kw:,.0f} kW installed continuous", 8, SILVER, BODY)
    text(c, 958, 432, f"{bess_firm_kw:,.0f} kW firm with one offline", 8, SILVER, BODY)
    text(c, 958, 447, f"{bess_installed_kwh:,.0f} kWh installed net", 8, SILVER, BODY)
    text(c, 958, 462, f"{bess_firm_kwh:,.0f} kWh firm net", 8, SILVER, BODY)
    line(c, 958, 483, 1115, 483, LINE, 0.8)
    text(c, 958, 507, "DEIF RECHARGE LIMIT", 7.5, COPPER, DISPLAY)
    text(c, 958, 526, f"All generators online: {all_online_headroom_kw:,.0f} kW", 8, SILVER, BODY)
    text(c, 958, 543, f"One generator offline: {one_offline_headroom_kw:,.0f} kW", 8, SILVER, BODY)
    rect(c, 956, 565, 162, 72, MINT_DARK, "#2C7659", 6, 1)
    centered(c, 956, 588, 162, "N+1 SOURCE CAPACITY", 9, MINT, DISPLAY)
    centered(c, 956, 608, 162, "One generator or BESS unit", 7.5, SILVER, BODY)
    centered(c, 956, 623, 162, "may be offline at 1,330 kW", 7.5, SILVER, BODY)
    text(c, 958, 658, "Step-down: only if required", 7.5, WARNING, BODY)

    # Footer.
    line(c, 154, 694, PAGE_W, 694, LINE, 0.8)
    text(c, 176, 711, "EMaaS Pro planning example - final equipment, charge limits, protection, cable, grounding, fuel, dimensions and availability require vendor and licensed-engineer verification.", 6.9, MUTED, BODY)
    text(c, 1075, 711, "1 / 1", 7, SILVER, DISPLAY)

    c.showPage()
    c.save()
    shutil.copyfile(OUTPUT, SITE_COPY)
    print(OUTPUT)
    print(SITE_COPY)


if __name__ == "__main__":
    generate()
