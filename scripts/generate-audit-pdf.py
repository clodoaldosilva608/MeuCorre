#!/usr/bin/env python3
"""Convert the audit report markdown to PDF using reportlab."""

import sys
from pathlib import Path

# Add reportlab path
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm, mm
from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle,
    KeepTogether, ListFlowable, ListItem
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# Register fonts
try:
    pdfmetrics.registerFont(TTFont('Inter', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'))
    pdfmetrics.registerFont(TTFont('Inter-Bold', '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'))
    pdfmetrics.registerFont(TTFont('Inter-Italic', '/usr/share/fonts/truetype/dejavu/DejaVuSans-Oblique.ttf'))
    BODY_FONT = 'Inter'
    BOLD_FONT = 'Inter-Bold'
    ITALIC_FONT = 'Inter-Italic'
except Exception:
    BODY_FONT = 'Helvetica'
    BOLD_FONT = 'Helvetica-Bold'
    ITALIC_FONT = 'Helvetica-Oblique'

# Brand colors
COLOR_PRIMARY = HexColor('#10b981')  # emerald
COLOR_DARK = HexColor('#0f172a')
COLOR_TEXT = HexColor('#1e293b')
COLOR_MUTED = HexColor('#64748b')
COLOR_BG_LIGHT = HexColor('#f8fafc')
COLOR_BG_WARNING = HexColor('#fef3c7')
COLOR_BG_ERROR = HexColor('#fee2e2')
COLOR_BG_SUCCESS = HexColor('#dcfce7')
COLOR_BORDER = HexColor('#e2e8f0')

# Read markdown
md_path = '/home/z/my-project/download/RELATORIO-AUDITORIA-MEUCORRE.md'
with open(md_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Output
output_pdf = '/home/z/my-project/download/RELATORIO-AUDITORIA-MEUCORRE.pdf'

# Build document
doc = SimpleDocTemplate(
    output_pdf,
    pagesize=A4,
    leftMargin=2*cm,
    rightMargin=2*cm,
    topMargin=2*cm,
    bottomMargin=2*cm,
    title='Relatório de Auditoria - MeuCorre',
    author='Super Z (Z.ai)',
    subject='Auditoria de segurança e testes funcionais',
)

# Styles
styles = getSampleStyleSheet()

style_title = ParagraphStyle(
    'CustomTitle',
    parent=styles['Title'],
    fontName=BOLD_FONT,
    fontSize=22,
    textColor=COLOR_PRIMARY,
    alignment=TA_CENTER,
    spaceAfter=6,
)

style_h1 = ParagraphStyle(
    'CustomH1',
    parent=styles['Heading1'],
    fontName=BOLD_FONT,
    fontSize=18,
    textColor=COLOR_DARK,
    spaceBefore=20,
    spaceAfter=10,
    borderWidth=0,
    borderPadding=0,
)

style_h2 = ParagraphStyle(
    'CustomH2',
    parent=styles['Heading2'],
    fontName=BOLD_FONT,
    fontSize=14,
    textColor=COLOR_PRIMARY,
    spaceBefore=14,
    spaceAfter=8,
)

style_h3 = ParagraphStyle(
    'CustomH3',
    parent=styles['Heading3'],
    fontName=BOLD_FONT,
    fontSize=12,
    textColor=COLOR_DARK,
    spaceBefore=10,
    spaceAfter=6,
)

style_body = ParagraphStyle(
    'CustomBody',
    parent=styles['Normal'],
    fontName=BODY_FONT,
    fontSize=10,
    textColor=COLOR_TEXT,
    alignment=TA_LEFT,
    leading=14,
    spaceAfter=6,
)

style_code = ParagraphStyle(
    'CustomCode',
    parent=styles['Code'],
    fontName='Courier',
    fontSize=8,
    textColor=COLOR_MUTED,
    backColor=COLOR_BG_LIGHT,
    borderPadding=4,
    leftIndent=8,
    rightIndent=8,
    spaceBefore=4,
    spaceAfter=8,
)

style_muted = ParagraphStyle(
    'CustomMuted',
    parent=styles['Normal'],
    fontName=ITALIC_FONT,
    fontSize=9,
    textColor=COLOR_MUTED,
    alignment=TA_CENTER,
    spaceAfter=10,
)


def md_to_flowables(text):
    """Simple markdown to flowables converter."""
    flowables = []
    lines = text.split('\n')
    in_code = False
    code_lines = []
    in_table = False
    table_rows = []
    i = 0
    while i < len(lines):
        line = lines[i]
        # Code block
        if line.startswith('```'):
            if in_code:
                code_text = '<br/>'.join(code_lines)
                flowables.append(Paragraph(f'<font name="Courier">{code_text}</font>', style_code))
                code_lines = []
                in_code = False
            else:
                in_code = True
            i += 1
            continue
        if in_code:
            code_lines.append(line.replace('<', '&lt;').replace('>', '&gt;'))
            i += 1
            continue
        # Table
        if line.startswith('|') and '|' in line[1:]:
            if not in_table:
                in_table = True
                table_rows = []
            cells = [c.strip() for c in line.split('|')[1:-1]]
            table_rows.append(cells)
            i += 1
            continue
        elif in_table:
            # End of table - render it
            if table_rows:
                # Skip separator row
                rows_to_render = [r for r in table_rows if not all(c.startswith('-') or c.startswith(':') for c in r)]
                if rows_to_render:
                    flowables.extend(render_table(rows_to_render))
            in_table = False
            table_rows = []
        # Headers
        if line.startswith('# ') and not line.startswith('## '):
            text = line[2:].strip()
            flowables.append(Paragraph(escape_md(text), style_title))
            i += 1
            continue
        if line.startswith('## '):
            text = line[3:].strip()
            flowables.append(Paragraph(escape_md(text), style_h1))
            i += 1
            continue
        if line.startswith('### '):
            text = line[4:].strip()
            flowables.append(Paragraph(escape_md(text), style_h2))
            i += 1
            continue
        if line.startswith('#### '):
            text = line[5:].strip()
            flowables.append(Paragraph(escape_md(text), style_h3))
            i += 1
            continue
        # Horizontal rule
        if line.strip() in ('---', '***'):
            flowables.append(Spacer(1, 6))
            i += 1
            continue
        # Empty line
        if not line.strip():
            flowables.append(Spacer(1, 4))
            i += 1
            continue
        # List items
        if line.startswith('- ') or line.startswith('* '):
            text = line[2:].strip()
            flowables.append(Paragraph(f'• {escape_md(text)}', style_body))
            i += 1
            continue
        if line.startswith('  - ') or line.startswith('  * '):
            text = line[4:].strip()
            flowables.append(Paragraph(f'&nbsp;&nbsp;◦ {escape_md(text)}', style_body))
            i += 1
            continue
        # Checkbox
        if line.startswith('- [x]') or line.startswith('- [ ]'):
            checked = line.startswith('- [x]')
            text = line[5:].strip()
            mark = '✓' if checked else '○'
            color = '#10b981' if checked else '#94a3b8'
            flowables.append(Paragraph(
                f'<font color="{color}">{mark}</font> {escape_md(text)}',
                style_body
            ))
            i += 1
            continue
        # Normal paragraph
        flowables.append(Paragraph(escape_md(line), style_body))
        i += 1
    # Render any pending table
    if in_table and table_rows:
        rows_to_render = [r for r in table_rows if not all(c.startswith('-') or c.startswith(':') for c in r)]
        if rows_to_render:
            flowables.extend(render_table(rows_to_render))
    return flowables


def render_table(rows):
    """Render a table from rows."""
    if len(rows) < 2:
        return []
    # Convert to Paragraphs for wrapping
    data = []
    header_style = ParagraphStyle(
        'TableHeader', fontName=BOLD_FONT, fontSize=9, textColor=HexColor('#ffffff'),
        alignment=TA_CENTER, leading=12
    )
    cell_style = ParagraphStyle(
        'TableCell', fontName=BODY_FONT, fontSize=9, textColor=COLOR_TEXT,
        alignment=TA_LEFT, leading=12
    )
    for i, row in enumerate(rows):
        new_row = []
        for cell in row:
            style = header_style if i == 0 else cell_style
            new_row.append(Paragraph(escape_md(cell), style))
        data.append(new_row)
    # Column widths: equal distribution
    n_cols = len(data[0])
    available = 17 * cm  # A4 - margins
    col_widths = [available / n_cols] * n_cols
    table = Table(data, colWidths=col_widths, repeatRows=1)
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), COLOR_PRIMARY),
        ('TEXTCOLOR', (0, 0), (-1, 0), HexColor('#ffffff')),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), BOLD_FONT),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('TOPPADDING', (0, 0), (-1, 0), 8),
        ('BACKGROUND', (0, 1), (-1, -1), HexColor('#ffffff')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [HexColor('#ffffff'), COLOR_BG_LIGHT]),
        ('GRID', (0, 0), (-1, -1), 0.5, COLOR_BORDER),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 1), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 5),
    ]))
    return [table, Spacer(1, 8)]


def escape_md(text):
    """Escape markdown special chars and convert basic markdown to HTML."""
    # Bold
    text = text.replace('**', '<b>', 1).replace('**', '</b>', 1) if '**' in text else text
    # Multiple bold pairs
    parts = text.split('**')
    if len(parts) > 1:
        text = ''
        for i, p in enumerate(parts):
            if i % 2 == 0:
                text += p
            else:
                text += f'<b>{p}</b>'
    # Inline code
    parts = text.split('`')
    if len(parts) > 1:
        text = ''
        for i, p in enumerate(parts):
            if i % 2 == 0:
                text += p
            else:
                text += f'<font name="Courier" color="#10b981">{p}</font>'
    # Escape HTML special chars (after markdown processing)
    text = text.replace('&', '&amp;').replace('<b>', '&lt;b&gt;').replace('</b>', '&lt;/b&gt;')
    text = text.replace('<font', '&lt;font').replace('</font>', '&lt;/font&gt;')
    # Restore
    text = text.replace('&lt;b&gt;', '<b>').replace('&lt;/b&gt;', '</b>')
    text = text.replace('&lt;font', '<font').replace('&lt;/font&gt;', '</font>')
    return text


# Build PDF
flowables = md_to_flowables(content)
doc.build(flowables)

print(f"PDF gerado: {output_pdf}")
print(f"Tamanho: {Path(output_pdf).stat().st_size / 1024:.1f} KB")
