"""
PDF export service — generates a clean one-page workflow brief using fpdf2 + Pillow.
Pillow draws the workflow diagram directly as a PNG (no headless browser, no Cairo).
Works cross-platform; uses system fonts on Windows, DejaVu/Liberation on Linux.
"""

import io
import math
from datetime import date

from fpdf import FPDF, XPos, YPos
from PIL import Image, ImageDraw, ImageFont

from db import models

# ── Color palette (RGB) ───────────────────────────────────────────────────────
HEADER_BG  = (15, 15, 26)
WHITE      = (255, 255, 255)
TEXT_DARK  = (28, 30, 50)
TEXT_MID   = (100, 116, 139)
TEXT_LIGHT = (148, 163, 184)

C_ENTRY  = (16, 185, 129)   # emerald
C_PROC   = (124, 58, 237)   # violet
C_OUTPUT = (168, 85, 247)   # purple

PAGE_W = 210               # A4 width mm
MARGIN = 20
CW     = PAGE_W - 2 * MARGIN   # 170 mm

ARCHETYPE_LABELS = {
    "trend_to_content":            "Trend > Content",
    "source_transform_distribute": "Source > Transform > Distribute",
    "monitor_engage_report":       "Monitor > Engage > Report",
    "schedule_generate_publish":   "Schedule > Generate > Publish",
}

# fpdf2 built-in fonts are Latin-1 only — sanitize all AI-generated text.
_REPLACEMENTS = {
    "\u2192": ">",    # →
    "\u2190": "<",    # ←
    "\u2013": "-",    # –
    "\u2014": "--",   # —
    "\u2018": "'",    # '
    "\u2019": "'",    # '
    "\u201c": '"',    # "
    "\u201d": '"',    # "
    "\u2022": "*",    # •
    "\u2026": "...",  # …
}

def _safe(text: str) -> str:
    """Replace common non-Latin-1 characters then drop anything still outside."""
    for char, rep in _REPLACEMENTS.items():
        text = text.replace(char, rep)
    return text.encode("latin-1", errors="replace").decode("latin-1")


# ── DAG layout ────────────────────────────────────────────────────────────────

def _compute_layout(nodes: list, edges: list) -> tuple[dict, dict]:
    """Topological column assignment — mirrors the frontend DAG layout."""
    children = {n["id"]: [] for n in nodes}
    parents  = {n["id"]: [] for n in nodes}
    for e in edges:
        if e["from"] in children:
            children[e["from"]].append(e["to"])
        if e["to"] in parents:
            parents[e["to"]].append(e["from"])

    col: dict[str, int] = {}

    def _set(nid: str, depth: int) -> None:
        if col.get(nid, -1) >= depth:
            return
        col[nid] = depth
        for child in children.get(nid, []):
            _set(child, depth + 1)

    roots = [n for n in nodes if not parents[n["id"]]] or nodes[:1]
    for n in roots:
        _set(n["id"], 0)
    for n in nodes:
        col.setdefault(n["id"], 0)

    col_groups: dict[int, list] = {}
    for n in nodes:
        col_groups.setdefault(col[n["id"]], []).append(n["id"])

    return col, col_groups


# ── Pillow diagram ────────────────────────────────────────────────────────────

def _pil_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    """Load a TrueType font — Windows first, Linux fallback."""
    candidates = (
        [
            "C:/Windows/Fonts/segoeuib.ttf",
            "C:/Windows/Fonts/arialbd.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
            "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
        ] if bold else [
            "C:/Windows/Fonts/segoeui.ttf",
            "C:/Windows/Fonts/arial.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
            "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
        ]
    )
    for path in candidates:
        try:
            return ImageFont.truetype(path, size)
        except (IOError, OSError):
            continue
    return ImageFont.load_default()


def _text_w(draw: ImageDraw.ImageDraw, text: str, font) -> int:
    bbox = draw.textbbox((0, 0), text, font=font)
    return bbox[2] - bbox[0]


def _arrowhead(draw: ImageDraw.ImageDraw, x1, y1, x2, y2, color, size: int = 10):
    angle = math.atan2(y2 - y1, x2 - x1)
    a = math.radians(25)
    pts = [
        (x2, y2),
        (x2 - size * math.cos(angle - a), y2 - size * math.sin(angle - a)),
        (x2 - size * math.cos(angle + a), y2 - size * math.sin(angle + a)),
    ]
    draw.polygon(pts, fill=color)


def _build_diagram_png(nodes: list, edges: list) -> bytes | None:
    """Render the workflow diagram as a PNG. Returns raw PNG bytes or None."""
    if not nodes:
        return None

    col_map, col_groups = _compute_layout(nodes, edges)
    n_cols = (max(col_map.values(), default=0) + 1) if col_map else 1
    n_rows = max(len(ids) for ids in col_groups.values()) if col_groups else 1

    NODE_W = 170
    NODE_H = 58
    H_GAP  = 72
    V_GAP  = 28
    PAD    = 28

    canvas_w = max(n_cols * NODE_W + (n_cols - 1) * H_GAP + 2 * PAD, 400)
    canvas_h = max(n_rows * NODE_H + (n_rows - 1) * V_GAP + 2 * PAD, 120)

    img  = Image.new("RGB", (canvas_w, canvas_h), (18, 18, 32))
    draw = ImageDraw.Draw(img)

    font_bold  = _pil_font(15, bold=True)
    font_small = _pil_font(11, bold=False)

    has_incoming = {e["to"]   for e in edges}
    has_outgoing = {e["from"] for e in edges}

    # ── Compute node pixel positions ──────────────────────────────────────────
    pos: dict[str, tuple[int, int]] = {}
    for c_int, ids in col_groups.items():
        c = int(c_int)
        total_h = len(ids) * NODE_H + (len(ids) - 1) * V_GAP
        start_y = (canvas_h - total_h) // 2
        for row_i, nid in enumerate(ids):
            pos[nid] = (
                PAD + c * (NODE_W + H_GAP),
                start_y + row_i * (NODE_H + V_GAP),
            )

    # ── Edges ─────────────────────────────────────────────────────────────────
    edge_color = (130, 90, 210)
    for e in edges:
        if e["from"] not in pos or e["to"] not in pos:
            continue
        sx, sy = pos[e["from"]]
        tx, ty = pos[e["to"]]
        x1 = sx + NODE_W
        y1 = sy + NODE_H // 2
        x2 = tx
        y2 = ty + NODE_H // 2
        draw.line([(x1, y1), (x2, y2)], fill=edge_color, width=2)
        _arrowhead(draw, x1, y1, x2, y2, color=edge_color, size=10)

    # ── Nodes ─────────────────────────────────────────────────────────────────
    for n in nodes:
        if n["id"] not in pos:
            continue
        nx, ny = pos[n["id"]]
        nid = n["id"]
        role_color = (
            C_ENTRY  if nid not in has_incoming else
            C_OUTPUT if nid not in has_outgoing else
            C_PROC
        )

        # Card background
        draw.rounded_rectangle(
            [nx, ny, nx + NODE_W, ny + NODE_H],
            radius=8, fill=(28, 28, 46), outline=(60, 50, 90), width=1,
        )
        # Colored left accent bar (solid rectangle, 6 px wide)
        draw.rectangle(
            [nx, ny, nx + 6, ny + NODE_H],
            fill=role_color,
        )
        # Re-round the top-left and bottom-left corners of the accent so it
        # doesn't bleed outside the rounded card.
        draw.rounded_rectangle(
            [nx, ny, nx + 6, ny + NODE_H],
            radius=4, fill=role_color,
        )

        # Label
        max_label_w = NODE_W - 22
        label = _safe(n.get("label", ""))
        while label and _text_w(draw, label, font_bold) > max_label_w:
            label = label[:-2] + ">"
        draw.text((nx + 14, ny + 10), label, font=font_bold, fill=(230, 225, 255))

        # Description (one truncated line)
        desc = _safe((n.get("description") or "").strip())
        if desc:
            max_desc_w = NODE_W - 22
            while desc and _text_w(draw, desc, font_small) > max_desc_w:
                desc = desc[:-2] + ">"
            draw.text((nx + 14, ny + 34), desc, font=font_small, fill=(110, 120, 150))

    buf = io.BytesIO()
    img.save(buf, format="PNG", optimize=True)
    return buf.getvalue()


# ── PDF chip helper ───────────────────────────────────────────────────────────

def _chip(pdf: FPDF, x: float, y: float, label: str,
          bg: tuple, border: tuple, fg: tuple) -> float:
    pdf.set_font("Helvetica", style="B", size=7.5)
    w = pdf.get_string_width(label) + 8
    pdf.set_fill_color(*bg)
    pdf.set_draw_color(*border)
    pdf.set_line_width(0.3)
    pdf.rect(x, y, w, 7, style="FD")
    pdf.set_text_color(*fg)
    pdf.set_xy(x + 4, y + 1.2)
    pdf.cell(w - 8, 5, label)
    return w + 3


# ── Main generator ────────────────────────────────────────────────────────────

def generate_pdf(workflow_id: str) -> bytes:
    workflow = models.get_workflow(workflow_id)
    if not workflow:
        raise ValueError("Workflow not found")

    wf         = workflow.get("workflow_json") or {}
    nodes      = wf.get("nodes", [])
    edges      = wf.get("edges", [])
    summary    = (workflow.get("summary_brief") or "").strip()
    archetype  = workflow.get("archetype") or wf.get("archetype") or ""
    platforms  = workflow.get("platforms") or []
    auto_level = workflow.get("automation_level") or wf.get("automation_level") or ""

    pdf = FPDF(orientation="P", unit="mm", format="A4")
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=18)
    pdf.set_margins(MARGIN, MARGIN, MARGIN)

    has_incoming = {e["to"]   for e in edges}
    has_outgoing = {e["from"] for e in edges}

    # ── Header band ───────────────────────────────────────────────────────────
    HEADER_H = 52
    pdf.set_fill_color(*HEADER_BG)
    pdf.rect(0, 0, PAGE_W, HEADER_H, style="F")

    pdf.set_fill_color(*C_PROC)
    pdf.rect(0, 0, 5, HEADER_H, style="F")

    pdf.set_xy(MARGIN + 5, 14)
    pdf.set_font("Helvetica", style="B", size=22)
    pdf.set_text_color(*WHITE)
    pdf.cell(CW - 5, 12, "Workflow Brief")

    archetype_label = ARCHETYPE_LABELS.get(archetype, _safe(archetype))
    if archetype_label:
        pdf.set_xy(MARGIN + 5, 33)
        pdf.set_font("Helvetica", size=10)
        pdf.set_text_color(167, 139, 250)
        pdf.cell(CW - 5, 6, archetype_label)

    # ── Metadata chips ────────────────────────────────────────────────────────
    y = HEADER_H + 12
    pdf.set_xy(MARGIN, y)
    pdf.set_font("Helvetica", style="B", size=7.5)
    pdf.set_text_color(*TEXT_MID)
    pdf.cell(0, 5, "PLATFORMS & SETTINGS")
    y += 9

    x = float(MARGIN)
    for p in platforms:
        x += _chip(pdf, x, y, p, (238, 233, 255), (180, 150, 240), (90, 50, 180))
    if auto_level:
        lbl = "Fully automated" if auto_level == "full" else "Human in loop"
        _chip(pdf, x, y, lbl, (224, 242, 254), (125, 211, 252), (14, 116, 144))

    # ── Divider ───────────────────────────────────────────────────────────────
    y += 16
    pdf.set_draw_color(220, 215, 240)
    pdf.set_line_width(0.25)
    pdf.line(MARGIN, y, PAGE_W - MARGIN, y)
    y += 8

    # ── Summary brief ─────────────────────────────────────────────────────────
    pdf.set_xy(MARGIN, y)
    pdf.set_font("Helvetica", style="B", size=12)
    pdf.set_text_color(*TEXT_DARK)
    pdf.cell(CW, 8, "Summary")
    y += 12

    if summary:
        pdf.set_xy(MARGIN, y)
        pdf.set_font("Helvetica", size=11)
        pdf.set_text_color(*TEXT_MID)
        pdf.multi_cell(CW, 6.5, _safe(summary), align="L")
        y = pdf.get_y() + 10
    else:
        y += 8

    # ── Agent breakdown ───────────────────────────────────────────────────────
    if nodes:
        pdf.set_draw_color(220, 215, 240)
        pdf.line(MARGIN, y, PAGE_W - MARGIN, y)
        y += 8

        pdf.set_xy(MARGIN, y)
        pdf.set_font("Helvetica", style="B", size=12)
        pdf.set_text_color(*TEXT_DARK)
        pdf.cell(CW, 8, "Agents")
        y += 12

        for n in nodes:
            if y > 238:
                break  # stop before footer
            nid = n["id"]
            role_color = (
                C_ENTRY  if nid not in has_incoming else
                C_OUTPUT if nid not in has_outgoing else
                C_PROC
            )
            # Colored dot indicator
            pdf.set_fill_color(*role_color)
            pdf.ellipse(MARGIN, y + 1.5, 3, 3, style="F")

            # Agent name
            pdf.set_xy(MARGIN + 6, y)
            pdf.set_font("Helvetica", style="B", size=10)
            pdf.set_text_color(*TEXT_DARK)
            pdf.cell(CW - 6, 6, _safe(n.get("label", "")))
            y += 7

            desc = (n.get("description") or "").strip()
            if desc:
                pdf.set_xy(MARGIN + 6, y)
                pdf.set_font("Helvetica", size=9)
                pdf.set_text_color(*TEXT_MID)
                pdf.multi_cell(CW - 6, 5, _safe(desc), align="L")
                y = pdf.get_y() + 5
            else:
                y += 4

    # ── Workflow diagram ──────────────────────────────────────────────────────
    if nodes:
        png_bytes = _build_diagram_png(nodes, edges)
        if png_bytes:
            IMG_H = CW * 0.38   # fixed image height (~65 mm)
            # If less than IMG_H + 30 mm remains on the current page, start a new one
            current_y = pdf.get_y()
            remaining = pdf.h - pdf.b_margin - current_y
            if remaining < IMG_H + 30:
                pdf.add_page()
                current_y = MARGIN

            y = current_y
            pdf.set_draw_color(220, 215, 240)
            pdf.set_line_width(0.25)
            pdf.line(MARGIN, y, PAGE_W - MARGIN, y)
            y += 8

            pdf.set_xy(MARGIN, y)
            pdf.set_font("Helvetica", style="B", size=12)
            pdf.set_text_color(*TEXT_DARK)
            pdf.cell(CW, 8, "Workflow Diagram")
            y += 12

            pdf.image(io.BytesIO(png_bytes), x=MARGIN, y=y, w=CW, h=IMG_H)

    # ── Footer ────────────────────────────────────────────────────────────────
    # Place footer on the last page at the very bottom
    pdf.set_y(pdf.h - pdf.b_margin - 8)
    pdf.set_font("Helvetica", size=7.5)
    pdf.set_text_color(*TEXT_LIGHT)
    today = date.today().strftime("%B %d, %Y")
    pdf.cell(CW, 5, f"Generated by CreatorFlow  *  {today}", align="C")

    return bytes(pdf.output())
