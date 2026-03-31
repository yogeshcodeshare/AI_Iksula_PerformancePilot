---
name: pdf-report-designer
description: "Professional PDF report creation skill for generating agency-quality, data-rich PDF reports using Python (ReportLab, FPDF2, or WeasyPrint). Use this skill ANY time a user asks to create, generate, design, or improve a PDF report — especially performance audits, analytics dashboards, web vitals reports, SEO reports, client deliverables, or any data-driven document. Triggers on phrases like 'create a PDF report', 'generate audit report', 'make a professional PDF', 'design a report', 'performance report', 'web vitals PDF', 'improve my report design', or when the user wants to produce a polished PDF from data. Also use when users upload an existing PDF report and ask to make it look more professional, redesign it, or improve its visual quality."
---

# PDF Report Designer — Professional Report Engineering Skill

This skill transforms raw data into agency-quality PDF reports that clients want to frame on their wall. Every output should look like it came from a $200/hr consulting firm — polished typography, sophisticated data visualization, refined color systems, and meticulous spatial hierarchy.

The difference between an amateur report and a professional one isn't flashiness — it's restraint, consistency, and attention to detail. A well-designed report builds trust before the reader processes a single data point.

## Library Selection

Choose the right tool based on the report's needs:

| Library | Best For | Install |
|---------|----------|---------|
| **ReportLab** | Full control, charts, gauges, custom graphics, complex layouts | `pip install reportlab` |
| **FPDF2** | Lightweight, fast, simple reports with tables and images | `pip install fpdf2` |
| **WeasyPrint** | HTML/CSS-based reports, when you want web-style layouts | `pip install weasyprint` |

**Default recommendation:** Use **ReportLab** for data-heavy reports with charts/gauges (like performance audits). Use **WeasyPrint** for simpler narrative reports where HTML/CSS templating is faster. Use **FPDF2** when you need something lightweight with minimal dependencies.

## 1. Color System — The Brand Foundation

A professional report uses a disciplined, limited color palette. Never use random colors or high-saturation rainbow schemes.

### Primary Palette (Dark Professional Theme)
```python
COLORS = {
    # Backgrounds
    'bg_dark':        '#1B2838',   # Dark navy — headers, hero sections
    'bg_darker':      '#141E2B',   # Deeper navy — page header bar
    'bg_light':       '#F8F9FB',   # Off-white — page background
    'bg_white':       '#FFFFFF',   # Pure white — card/table backgrounds
    'bg_subtle':      '#F1F3F6',   # Light grey — alternating rows, subtle sections

    # Text
    'text_primary':   '#1A1A2E',   # Near-black — headings, key data
    'text_secondary': '#5A6578',   # Slate grey — body text, descriptions
    'text_muted':     '#8B95A5',   # Light grey — footnotes, metadata
    'text_white':     '#FFFFFF',   # White — text on dark backgrounds

    # Status Colors (traffic-light system for metrics)
    'status_good':    '#22C55E',   # Green — pass, good, healthy
    'status_good_bg': '#DCFCE7',   # Light green background
    'status_warn':    '#F59E0B',   # Amber — needs improvement, warning
    'status_warn_bg': '#FEF3C7',   # Light amber background
    'status_fail':    '#EF4444',   # Red — fail, poor, critical
    'status_fail_bg': '#FEE2E2',   # Light red background

    # Accent
    'accent':         '#3B82F6',   # Blue — links, highlights, active elements
    'accent_light':   '#DBEAFE',   # Light blue — subtle accent backgrounds

    # Borders & Dividers
    'border_light':   '#E5E7EB',   # Light grey — table borders, dividers
    'border_medium':  '#D1D5DB',   # Medium grey — stronger separators
}
```

### Color Usage Rules

- **Status colors** are semantic: green=good, amber=warning, red=fail. Never use them decoratively.
- **Background tinting for status cells:** Use the `_bg` variants for cell backgrounds (e.g., light green behind "Good" text, light red behind "Fail" text). Never use full-saturation backgrounds with white text for data cells — it's visually aggressive and harder to read.
- **Alternating row colors:** Alternate between `bg_white` and `bg_subtle` (`#F8F9FB` / `#F1F3F6`). The difference should be barely perceptible — just enough to guide the eye across wide tables.
- **Header rows:** Use `bg_dark` (#1B2838) with white text for table headers. This anchors the table visually.
- **Section headers:** Use the dark navy band across full page width for major section breaks.
- **Never use:** Neon colors, rainbow gradients, high-saturation fills behind data, or more than 3 accent colors total.

## 2. Typography — Establishing Authority

Typography in PDF reports establishes credibility. Inconsistent or poorly-chosen fonts instantly undermine trust.

### Font Stack

```python
# ReportLab font registration
from reportlab.lib.fonts import addMapping
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# Option A: Use Helvetica (built-in, always works)
FONT_FAMILY = 'Helvetica'
FONT_BOLD = 'Helvetica-Bold'

# Option B: Register a premium font (if available)
# pdfmetrics.registerFont(TTFont('Inter', 'Inter-Regular.ttf'))
# pdfmetrics.registerFont(TTFont('Inter-Bold', 'Inter-Bold.ttf'))
```

### Type Scale

```python
TYPOGRAPHY = {
    'report_title':     {'font': FONT_BOLD,   'size': 28, 'color': '#FFFFFF', 'leading': 34},
    'report_subtitle':  {'font': FONT_FAMILY, 'size': 14, 'color': '#94A3B8', 'leading': 18},
    'section_title':    {'font': FONT_BOLD,   'size': 18, 'color': '#1A1A2E', 'leading': 24},
    'subsection_title': {'font': FONT_BOLD,   'size': 14, 'color': '#1A1A2E', 'leading': 18},
    'body':             {'font': FONT_FAMILY, 'size': 10, 'color': '#5A6578', 'leading': 15},
    'body_bold':        {'font': FONT_BOLD,   'size': 10, 'color': '#1A1A2E', 'leading': 15},
    'table_header':     {'font': FONT_BOLD,   'size': 9,  'color': '#FFFFFF', 'leading': 12},
    'table_cell':       {'font': FONT_FAMILY, 'size': 9,  'color': '#374151', 'leading': 12},
    'caption':          {'font': FONT_FAMILY, 'size': 8,  'color': '#8B95A5', 'leading': 10},
    'kpi_value':        {'font': FONT_BOLD,   'size': 36, 'color': '#F59E0B', 'leading': 40},
    'kpi_label':        {'font': FONT_FAMILY, 'size': 9,  'color': '#8B95A5', 'leading': 12},
    'eyebrow':          {'font': FONT_BOLD,   'size': 8,  'color': '#3B82F6', 'leading': 10},
}
```

### Typography Rules

- **Headlines** use bold weight exclusively. Never use ALL CAPS for section headings longer than 3 words — it reduces readability.
- **Body text** at 10pt minimum for print. 9pt is acceptable for table cells only.
- **Line height (leading)** should be 1.4–1.6× the font size for body text. Tight leading (1.1–1.2×) only for headings and KPI numbers.
- **Letter-spacing:** Use `charSpace=0.5` for ALL-CAPS eyebrow labels. No letter-spacing adjustments elsewhere.
- **Number formatting:** Always use consistent decimal places within a column. Use monospace or tabular figures for aligned numbers in tables.
- **Color contrast:** Body text should be at least 4.5:1 contrast ratio against its background. Never use light grey text on white.

## 3. Page Layout — The Professional Grid

### Page Structure

```python
from reportlab.lib.pagesizes import A4, letter
from reportlab.lib.units import mm, inch

# Page dimensions
PAGE_SIZE = A4  # or letter for US
PAGE_WIDTH, PAGE_HEIGHT = PAGE_SIZE

# Margins
MARGIN = {
    'left':   20 * mm,
    'right':  20 * mm,
    'top':    25 * mm,
    'bottom': 20 * mm,
}

# Content area
CONTENT_WIDTH = PAGE_WIDTH - MARGIN['left'] - MARGIN['right']
CONTENT_HEIGHT = PAGE_HEIGHT - MARGIN['top'] - MARGIN['bottom']

# Header bar height (dark navy bar at top of each page)
HEADER_BAR_HEIGHT = 14 * mm

# Footer height
FOOTER_HEIGHT = 10 * mm
```

### Grid System

Divide the content area into columns for structured layouts:

```python
# Column system
def get_columns(n, gap=5*mm):
    """Get column widths for n-column layout."""
    total_gap = gap * (n - 1)
    col_width = (CONTENT_WIDTH - total_gap) / n
    return col_width, gap

# Common layouts
TWO_COL_WIDTH, TWO_COL_GAP = get_columns(2)     # ~83mm each
THREE_COL_WIDTH, THREE_COL_GAP = get_columns(3)  # ~53mm each
FOUR_COL_WIDTH, FOUR_COL_GAP = get_columns(4)    # ~39mm each
```

### Page Template

Every page follows this structure:

```
┌──────────────────────────────────────────┐
│ ██ HEADER BAR (dark navy, full width) ██ │ ← Brand + section name + page context
│                                          │
│  [Section Title]                         │ ← 18pt bold, with subtle rule below
│  [Description text]                      │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │         CONTENT AREA               │  │ ← Tables, charts, KPI cards
│  │                                    │  │
│  │                                    │  │
│  │                                    │  │
│  └────────────────────────────────────┘  │
│                                          │
│ ── footer line ────────────────────────  │
│ Run ID | Generated | Brand    Page X/Y   │ ← Metadata footer
└──────────────────────────────────────────┘
```

## 4. Component Library — Building Blocks

### 4a. Cover Page / Title Section

The first page sets expectations. It needs a dark hero section with the report title, key metadata, and the headline KPI.

```python
def draw_cover_page(canvas, data):
    """Draw a professional cover page with dark hero and KPI highlight."""
    w, h = PAGE_SIZE

    # Dark hero section (top 40% of page)
    hero_height = h * 0.35
    canvas.setFillColor(HexColor('#1B2838'))
    canvas.rect(0, h - hero_height, w, hero_height, fill=True, stroke=False)

    # Accent line under hero
    canvas.setFillColor(HexColor('#3B82F6'))
    canvas.rect(0, h - hero_height, w, 3, fill=True, stroke=False)

    # Brand name (eyebrow)
    canvas.setFillColor(HexColor('#3B82F6'))
    canvas.setFont(FONT_BOLD, 10)
    canvas.drawString(MARGIN['left'], h - 40*mm, 'IKSULA PERFORMANCE PILOT')

    # Report title
    canvas.setFillColor(HexColor('#FFFFFF'))
    canvas.setFont(FONT_BOLD, 28)
    canvas.drawString(MARGIN['left'], h - 55*mm, 'Performance Audit Report')

    # Subtitle
    canvas.setFillColor(HexColor('#94A3B8'))
    canvas.setFont(FONT_FAMILY, 13)
    canvas.drawString(MARGIN['left'], h - 68*mm, data['site_name'])

    # Metadata line
    canvas.setFont(FONT_FAMILY, 10)
    canvas.drawString(MARGIN['left'], h - 80*mm,
        f"Base Audit  |  {data['environment']}  |  {data['date']}")

    # KPI card (overall health score) — positioned right side of hero
    kpi_x = w - MARGIN['right'] - 55*mm
    kpi_y = h - 45*mm
    draw_score_card(canvas, kpi_x, kpi_y, 50*mm, 45*mm,
                    label='OVERALL HEALTH', value=data['score'],
                    suffix='%', color=score_color(data['score']))
```

### 4b. KPI Score Cards

Small highlight cards showing a single key metric prominently.

```python
def draw_score_card(canvas, x, y, width, height, label, value, suffix='', color='#F59E0B'):
    """Draw a KPI card with rounded rectangle, large number, and label."""
    # Card background (subtle dark panel)
    canvas.setFillColor(HexColor('#0F172A'))
    canvas.roundRect(x, y, width, height, radius=8, fill=True, stroke=False)

    # Inner border (subtle)
    canvas.setStrokeColor(HexColor('#1E293B'))
    canvas.setLineWidth(0.5)
    canvas.roundRect(x+1, y+1, width-2, height-2, radius=7, fill=False, stroke=True)

    # Label (top)
    canvas.setFillColor(HexColor('#8B95A5'))
    canvas.setFont(FONT_BOLD, 8)
    text_x = x + width/2
    canvas.drawCentredString(text_x, y + height - 16, label)

    # Value (large)
    canvas.setFillColor(HexColor(color))
    canvas.setFont(FONT_BOLD, 32)
    canvas.drawCentredString(text_x, y + 10, f"{value}{suffix}")
```

### 4c. Metric Status Distribution Bar

A horizontal stacked bar showing good/warning/fail distribution.

```python
def draw_status_bar(canvas, x, y, width, height, good, warn, fail):
    """Draw a proportional status distribution bar."""
    total = good + warn + fail
    if total == 0:
        return

    bar_y = y
    radius = height / 2

    # Calculate widths
    good_w = (good / total) * width
    warn_w = (warn / total) * width
    fail_w = (fail / total) * width

    # Draw segments (green → amber → red)
    segments = [
        (good_w, '#22C55E'),
        (warn_w, '#F59E0B'),
        (fail_w, '#EF4444'),
    ]

    # Background track
    canvas.setFillColor(HexColor('#E5E7EB'))
    canvas.roundRect(x, bar_y, width, height, radius=radius, fill=True, stroke=False)

    # Filled segments
    current_x = x
    for seg_w, seg_color in segments:
        if seg_w > 0:
            canvas.setFillColor(HexColor(seg_color))
            # Clip to rounded rect bounds
            canvas.rect(current_x, bar_y, seg_w, height, fill=True, stroke=False)
            current_x += seg_w

    # Labels to the right
    label_x = x + width + 8
    for i, (count, label, color) in enumerate([
        (good, 'GOOD (PASS)', '#22C55E'),
        (warn, 'NEEDS IMPROVEMENT', '#F59E0B'),
        (fail, 'POOR (FAIL)', '#EF4444'),
    ]):
        ly = y - (i * 18)
        canvas.setFillColor(HexColor(color))
        canvas.setFont(FONT_BOLD, 8)
        canvas.drawString(x, ly, label)
        canvas.setFillColor(HexColor('#374151'))
        canvas.setFont(FONT_FAMILY, 9)
        canvas.drawRightString(x + width, ly, str(count))
```

### 4d. Gauge / Arc Score Indicator

A semi-circular gauge for showing performance scores (0–100).

```python
import math

def draw_gauge(canvas, cx, cy, radius, score, max_score=100, label=''):
    """Draw a semi-circular gauge with score indicator."""
    # Background arc (grey track)
    canvas.setStrokeColor(HexColor('#E5E7EB'))
    canvas.setLineWidth(8)
    # Draw arc from 180° to 0° (left to right, bottom half circle)
    draw_arc(canvas, cx, cy, radius, 180, 0, '#E5E7EB', 8)

    # Score arc (colored portion)
    score_pct = min(score / max_score, 1.0)
    end_angle = 180 - (score_pct * 180)
    color = score_color(score)
    draw_arc(canvas, cx, cy, radius, 180, end_angle, color, 8)

    # Score text (centered)
    canvas.setFillColor(HexColor('#1A1A2E'))
    canvas.setFont(FONT_BOLD, 24)
    canvas.drawCentredString(cx, cy - 5, str(score))

    # Label below
    if label:
        canvas.setFillColor(HexColor('#8B95A5'))
        canvas.setFont(FONT_FAMILY, 8)
        canvas.drawCentredString(cx, cy - radius - 12, label)

def draw_arc(canvas, cx, cy, r, start_deg, end_deg, color, width):
    """Draw an arc using small line segments."""
    canvas.setStrokeColor(HexColor(color))
    canvas.setLineWidth(width)
    canvas.setLineCap(1)  # Round cap

    p = canvas.beginPath()
    steps = 50
    for i in range(steps + 1):
        angle = math.radians(start_deg + (end_deg - start_deg) * i / steps)
        x = cx + r * math.cos(angle)
        y = cy + r * math.sin(angle)
        if i == 0:
            p.moveTo(x, y)
        else:
            p.lineTo(x, y)
    canvas.drawPath(p, fill=False, stroke=True)

def score_color(score):
    """Return traffic-light color for a 0-100 score."""
    if score >= 90:
        return '#22C55E'
    elif score >= 50:
        return '#F59E0B'
    else:
        return '#EF4444'
```

### 4e. Professional Tables

Tables are the backbone of data reports. Every table should be clean, scannable, and status-aware.

```python
from reportlab.platypus import Table, TableStyle
from reportlab.lib import colors

def create_data_table(data, col_widths, has_status_column=None):
    """Create a professionally styled data table.

    Args:
        data: List of lists (first row = headers)
        col_widths: List of column widths
        has_status_column: Index of column that contains status values (Good/Fail/etc.)
    """
    table = Table(data, colWidths=col_widths, repeatRows=1)

    # Base styling
    style = [
        # Header row
        ('BACKGROUND',    (0, 0), (-1, 0), HexColor('#1B2838')),
        ('TEXTCOLOR',     (0, 0), (-1, 0), colors.white),
        ('FONTNAME',      (0, 0), (-1, 0), FONT_BOLD),
        ('FONTSIZE',      (0, 0), (-1, 0), 9),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('TOPPADDING',    (0, 0), (-1, 0), 8),

        # Data rows
        ('FONTNAME',      (0, 1), (-1, -1), FONT_FAMILY),
        ('FONTSIZE',      (0, 1), (-1, -1), 9),
        ('TEXTCOLOR',     (0, 1), (-1, -1), HexColor('#374151')),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 7),
        ('TOPPADDING',    (0, 1), (-1, -1), 7),
        ('LEFTPADDING',   (0, 0), (-1, -1), 8),
        ('RIGHTPADDING',  (0, 0), (-1, -1), 8),

        # Grid
        ('LINEBELOW',     (0, 0), (-1, 0), 1, HexColor('#1B2838')),
        ('LINEBELOW',     (0, 1), (-1, -2), 0.5, HexColor('#E5E7EB')),
        ('LINEBELOW',     (0, -1), (-1, -1), 0.5, HexColor('#E5E7EB')),

        # Alignment
        ('VALIGN',        (0, 0), (-1, -1), 'MIDDLE'),
    ]

    # Alternating row backgrounds
    for i in range(1, len(data)):
        if i % 2 == 0:
            style.append(('BACKGROUND', (0, i), (-1, i), HexColor('#F8F9FB')))

    # Status-aware cell coloring
    if has_status_column is not None:
        col = has_status_column
        for row_idx in range(1, len(data)):
            cell_value = str(data[row_idx][col]).strip().lower()
            if cell_value in ('good', 'pass'):
                style.append(('TEXTCOLOR', (col, row_idx), (col, row_idx), HexColor('#22C55E')))
                style.append(('FONTNAME',  (col, row_idx), (col, row_idx), FONT_BOLD))
            elif cell_value in ('needs imp.', 'needs improvement', 'warning'):
                style.append(('TEXTCOLOR', (col, row_idx), (col, row_idx), HexColor('#F59E0B')))
                style.append(('FONTNAME',  (col, row_idx), (col, row_idx), FONT_BOLD))
            elif cell_value in ('poor', 'fail', 'critical'):
                style.append(('TEXTCOLOR', (col, row_idx), (col, row_idx), HexColor('#EF4444')))
                style.append(('FONTNAME',  (col, row_idx), (col, row_idx), FONT_BOLD))

    table.setStyle(TableStyle(style))
    return table
```

### 4f. Lighthouse Score Bars

The 4-category horizontal score display (Performance, Accessibility, Best Practices, SEO).

```python
def draw_lighthouse_scores(canvas, x, y, width, scores):
    """Draw the 4 Lighthouse category scores in a horizontal bar.

    scores = {'Performance': 52, 'Accessibility': 82, 'Best Practices': 65, 'SEO': 85}
    """
    col_width = width / len(scores)

    # Header bar
    canvas.setFillColor(HexColor('#1B2838'))
    canvas.rect(x, y, width, 22, fill=True, stroke=False)

    for i, (label, score) in enumerate(scores.items()):
        cx = x + (i * col_width) + col_width / 2

        # Header label
        canvas.setFillColor(HexColor('#FFFFFF'))
        canvas.setFont(FONT_BOLD, 8)
        canvas.drawCentredString(cx, y + 7, label)

        # Score value below header
        color = score_color(score)
        canvas.setFillColor(HexColor(color))
        canvas.setFont(FONT_BOLD, 16)
        canvas.drawCentredString(cx, y - 20, str(score))

    # Border around the score area
    canvas.setStrokeColor(HexColor('#E5E7EB'))
    canvas.setLineWidth(0.5)
    canvas.rect(x, y - 30, width, 30, fill=False, stroke=True)
```

### 4g. Page Header & Footer

Consistent header and footer on every page for professional continuity.

```python
def draw_page_header(canvas, left_text, right_text):
    """Draw the dark header bar at the top of each page."""
    w, h = PAGE_SIZE

    # Dark bar
    canvas.setFillColor(HexColor('#1B2838'))
    canvas.rect(0, h - HEADER_BAR_HEIGHT, w, HEADER_BAR_HEIGHT, fill=True, stroke=False)

    # Left text (site name | audit type)
    canvas.setFillColor(HexColor('#CBD5E1'))
    canvas.setFont(FONT_FAMILY, 8)
    canvas.drawString(MARGIN['left'], h - HEADER_BAR_HEIGHT + 5, left_text)

    # Right text (section name)
    canvas.drawRightString(w - MARGIN['right'], h - HEADER_BAR_HEIGHT + 5, right_text)

def draw_page_footer(canvas, run_id, generated_at, brand, page_num, total_pages):
    """Draw the footer with metadata and page number."""
    w, h = PAGE_SIZE
    footer_y = MARGIN['bottom'] - 5*mm

    # Divider line
    canvas.setStrokeColor(HexColor('#E5E7EB'))
    canvas.setLineWidth(0.5)
    canvas.line(MARGIN['left'], footer_y + 8, w - MARGIN['right'], footer_y + 8)

    # Left: metadata
    canvas.setFillColor(HexColor('#8B95A5'))
    canvas.setFont(FONT_FAMILY, 7)
    canvas.drawString(MARGIN['left'], footer_y,
        f"Run: {run_id}  |  Generated At: {generated_at}")

    # Center: brand
    canvas.drawCentredString(w/2, footer_y, brand)

    # Right: page number
    canvas.drawRightString(w - MARGIN['right'], footer_y,
        f"Page {page_num} of {total_pages}")
```

### 4h. Section Title with Rule

A clean section title with a subtle horizontal divider.

```python
def draw_section_title(canvas, x, y, title, subtitle=None):
    """Draw a section heading with horizontal rule."""
    # Title
    canvas.setFillColor(HexColor('#1A1A2E'))
    canvas.setFont(FONT_BOLD, 18)
    canvas.drawString(x, y, title)

    # Subtitle (optional)
    if subtitle:
        canvas.setFillColor(HexColor('#5A6578'))
        canvas.setFont(FONT_FAMILY, 10)
        canvas.drawString(x, y - 18, subtitle)
        rule_y = y - 30
    else:
        rule_y = y - 12

    # Horizontal rule
    canvas.setStrokeColor(HexColor('#E5E7EB'))
    canvas.setLineWidth(0.75)
    canvas.line(x, rule_y, x + CONTENT_WIDTH, rule_y)

    return rule_y - 10  # Return Y position for next content
```

### 4i. Alert / Callout Box

For critical findings, warnings, or key highlights.

```python
def draw_alert_box(canvas, x, y, width, text, severity='critical'):
    """Draw a colored alert/callout box."""
    configs = {
        'critical': {'bg': '#FEF2F2', 'border': '#EF4444', 'icon': '⚠', 'text': '#991B1B'},
        'warning':  {'bg': '#FFFBEB', 'border': '#F59E0B', 'icon': '⚡', 'text': '#92400E'},
        'info':     {'bg': '#EFF6FF', 'border': '#3B82F6', 'icon': 'ℹ', 'text': '#1E40AF'},
        'success':  {'bg': '#F0FDF4', 'border': '#22C55E', 'icon': '✓', 'text': '#166534'},
    }
    cfg = configs.get(severity, configs['info'])
    height = 28

    # Background
    canvas.setFillColor(HexColor(cfg['bg']))
    canvas.roundRect(x, y - height, width, height, radius=4, fill=True, stroke=False)

    # Left accent border
    canvas.setFillColor(HexColor(cfg['border']))
    canvas.rect(x, y - height, 3, height, fill=True, stroke=False)

    # Text
    canvas.setFillColor(HexColor(cfg['text']))
    canvas.setFont(FONT_BOLD, 9)
    canvas.drawString(x + 12, y - height + 9, text)
```

## 5. Page-by-Page Report Structure

A professional performance audit report follows this exact structure. Each section has a clear purpose and consistent visual treatment.

### Page 1: Cover / Executive Summary
- Dark hero section (top 35%) with report title, subtitle, metadata, and overall health KPI card
- Executive summary below: scope, metrics count, CWV pass rate, data source (4-column KPI row)
- Audit overview paragraph
- Metric status distribution bar (good/warning/fail)

### Page 2: Methodology & Standards
- Section title with rule
- Description paragraph
- Core Web Vitals thresholds table (Metric, Description, Good, Poor, Unit)

### Page 3: Audited URLs / Scope
- Table listing all audited pages with #, Label, Type, URL columns

### Page 4: Core Web Vitals Assessment
- CWV pass/fail table per page+device combination
- Lighthouse scores table (Performance, Accessibility, Best Practices, SEO) with color-coded cells

### Page 5: Detailed Results Matrix
- Full metric breakdown table: Page, Device, LCP, INP, CLS, FCP, TTFB, Score
- Color-code each metric cell based on its status (good=green text, warn=amber, fail=red)

### Page 6: Key Findings & Top Issues
- Alert callout box with critical count
- Table of all failing metrics sorted by severity: Page, Device, Metric, Value, Threshold

### Page 7: Top Optimization Opportunities
- Table ranked by potential savings: Rank, Page, Device, Issue, Category, Savings

### Pages 8+: Per-Page Diagnostic Workspace
Each audited page gets its own section:
- Page name header bar (dark, rounded)
- Mobile section: device indicator, CWV pass/fail badge, perf score
  - Metric table (LCP, INP, CLS, FCP, TTFB with status + threshold)
  - Lighthouse 4-score bar
  - Diagnostic insights table (audit items, status, category, recommendation)
- Desktop section: same structure

## 6. Design Patterns for Specific Report Types

### Performance Audit Reports (like your current report)
- Use the full structure above
- Emphasize traffic-light status coloring in all metric tables
- Show CWV Pass/Fail prominently with colored badges
- Lighthouse scores in the compact 4-bar format
- Alert boxes for critical findings

### SEO Audit Reports
- Replace CWV metrics with SEO-specific scores
- Add keyword ranking tables with position change indicators (↑↓)
- Use sparkline-style mini charts for trend data
- Include screenshot thumbnails for visual issues

### Analytics / Dashboard Reports
- Lead with gauge indicators for key KPIs
- Use more charts (bar, line, pie) alongside tables
- Include comparison periods (this month vs last month)
- Trend arrows next to numbers (green ↑, red ↓)

### Client Deliverable Reports
- Stronger branding (logo placement, brand colors)
- Executive summary page with high-level takeaways
- Recommendation section with priority ranking
- Next steps / action items callout

## 7. Visual Refinement Checklist

Before delivering any report PDF, verify:

- [ ] Consistent color palette — no rogue colors, all status colors are semantic
- [ ] Typography hierarchy is clear — title > section > subsection > body > caption
- [ ] All tables have: dark header row, alternating row backgrounds, adequate padding
- [ ] Status values (Good/Fail/Warning) are color-coded with bold text
- [ ] Every page has header bar and footer with page numbers
- [ ] Adequate whitespace between sections (minimum 15mm gaps)
- [ ] No content runs off the page or overlaps margins
- [ ] Tables split gracefully across pages with repeated headers
- [ ] Numbers are right-aligned within table columns
- [ ] Text is left-aligned (never center-align body text or long content)
- [ ] Alert/callout boxes used for critical findings (not just plain text)
- [ ] Cover page has the headline KPI prominently displayed
- [ ] Consistent border treatments (hairline #E5E7EB, never thick black borders)
- [ ] PDF metadata set (title, author, subject)
- [ ] File size reasonable (< 5MB for a 20-page report)

## 8. Anti-Patterns — What Makes Reports Look Amateur

**Color:** Rainbow backgrounds on data cells. Full-saturation red/green fills (use light tints instead). Inconsistent greys (mixing warm and cool). Blue text for non-links.

**Typography:** All-caps for paragraphs. Comic Sans or decorative fonts. Inconsistent sizes across similar elements. Body text below 8pt.

**Tables:** Thick black borders on every cell. No header row differentiation. Missing alternating rows. Cramped padding. Center-aligned text columns.

**Layout:** Content pressed against page edges. No vertical breathing room between sections. Inconsistent margins across pages. Missing page numbers.

**Content:** "N/A" everywhere instead of "—" dash. Inconsistent number formatting. Truncated text without ellipsis. Missing units on metric values.

## 9. Execution Protocol

When creating a PDF report:

1. **Determine report type** — match to the patterns in §6
2. **Set up page template** — register fonts, define colors, create header/footer functions
3. **Build cover page** — hero section, title, KPI card
4. **Build content pages** — follow the page-by-page structure, using components from §4
5. **Apply status coloring** — color-code all metric/status values programmatically
6. **Add navigation** — page headers show current section, footers show page numbers
7. **Verify** — run through the checklist in §7
8. **Output** — save with metadata, verify file opens correctly

## 10. Complete Skeleton (ReportLab)

```python
#!/usr/bin/env python3
"""Professional PDF Report Generator — Skeleton."""

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor
from reportlab.pdfgen import canvas
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

# --- Configuration ---
PAGE_SIZE = A4
W, H = PAGE_SIZE
MARGIN_L, MARGIN_R, MARGIN_T, MARGIN_B = 20*mm, 20*mm, 25*mm, 20*mm
CONTENT_W = W - MARGIN_L - MARGIN_R
FONT = 'Helvetica'
FONT_B = 'Helvetica-Bold'

# --- Color System ---
C = {
    'navy':      HexColor('#1B2838'),
    'bg':        HexColor('#F8F9FB'),
    'white':     HexColor('#FFFFFF'),
    'text':      HexColor('#1A1A2E'),
    'text2':     HexColor('#5A6578'),
    'muted':     HexColor('#8B95A5'),
    'border':    HexColor('#E5E7EB'),
    'green':     HexColor('#22C55E'),
    'amber':     HexColor('#F59E0B'),
    'red':       HexColor('#EF4444'),
    'blue':      HexColor('#3B82F6'),
    'green_bg':  HexColor('#DCFCE7'),
    'amber_bg':  HexColor('#FEF3C7'),
    'red_bg':    HexColor('#FEE2E2'),
    'row_alt':   HexColor('#F8F9FB'),
}

def build_report(output_path, report_data):
    """Main entry point — builds the complete PDF."""
    c = canvas.Canvas(output_path, pagesize=PAGE_SIZE)
    c.setTitle(f"Performance Audit - {report_data['site']}")
    c.setAuthor('Iksula Performance Pilot')

    # Page 1: Cover
    draw_cover(c, report_data)
    c.showPage()

    # Page 2+: Content pages
    # ... build each section using the component functions above ...

    c.save()
    print(f"Report saved to {output_path}")

if __name__ == '__main__':
    data = {
        'site': 'Converse AUS_Web vitals records',
        'environment': 'PRODUCTION',
        'date': 'Mar 21, 2026',
        'score': 53,
        # ... rest of report data ...
    }
    build_report('performance_audit.pdf', data)
```

This skeleton gives you the architecture. Populate each section using the component functions defined in §4. The key is consistency — every table, every header, every color choice should follow the system defined above. That consistency is what makes the output feel professional rather than cobbled together.
