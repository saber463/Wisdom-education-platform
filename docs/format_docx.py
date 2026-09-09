#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
按天府新区通用航空职业学院毕业设计规范精确设置 Word 字体字号。
字号对照：
  三号=16pt  小二=18pt  小三=15pt  四号=14pt  小四=12pt  五号=10.5pt
"""

import re
from docx import Document
from docx.shared import Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_LINE_SPACING
from docx.oxml.ns import qn
from docx.oxml import OxmlElement


def set_run_font(run, cn_font="宋体", en_font="Times New Roman", size_pt=12, bold=False):
    """设置 run 的中英文字体、字号、加粗"""
    run.font.size = Pt(size_pt)
    run.font.bold = bold
    run.font.name = en_font
    rpr = run._element.get_or_add_rPr()
    rfonts = rpr.find(qn('w:rFonts'))
    if rfonts is None:
        rfonts = OxmlElement('w:rFonts')
        rpr.insert(0, rfonts)
    rfonts.set(qn('w:ascii'), en_font)
    rfonts.set(qn('w:hAnsi'), en_font)
    rfonts.set(qn('w:eastAsia'), cn_font)


def set_paragraph_format(p, alignment=None, first_line_indent=None,
                         line_spacing=1.5, space_before=None, space_after=None):
    """设置段落格式"""
    pf = p.paragraph_format
    if alignment is not None:
        p.alignment = alignment
    if first_line_indent is not None:
        pf.first_line_indent = Pt(first_line_indent)
    pf.line_spacing = line_spacing
    pf.line_spacing_rule = WD_LINE_SPACING.MULTIPLE
    if space_before is not None:
        pf.space_before = Pt(space_before)
    if space_after is not None:
        pf.space_after = Pt(space_after)


def main():
    doc = Document("/workspace/docs/毕业设计论文.docx")

    # 规范字号常量（pt）
    SAN_HAO = 16        # 三号
    XIAO_ER = 18        # 小二号
    XIAO_SAN = 15       # 小三号
    SI_HAO = 14         # 四号
    XIAO_SI = 12        # 小四号
    WU_HAO = 10.5       # 五号

    for p in doc.paragraphs:
        text = p.text.strip()
        style_name = p.style.name if p.style else ""

        # Heading 1：第X章 / 结论 / 参考文献 / 致谢 / 附录 → 三号宋体加粗居中
        if style_name == "Heading 1" or re.match(r'^第\d+章', text) or text in (
                "结论", "参考文献", "致谢", "附录", "诚信承诺书", "目录"):
            set_paragraph_format(p, alignment=WD_ALIGN_PARAGRAPH.CENTER,
                                  line_spacing=1.5, space_before=12, space_after=6)
            for run in p.runs:
                # "目录"用黑体，其余用宋体
                cn = "黑体" if text == "目录" else "宋体"
                set_run_font(run, cn_font=cn, en_font="Times New Roman",
                             size_pt=SAN_HAO, bold=True)

        # Heading 2：1.1 级 → 小三号宋体顶格加粗
        elif style_name == "Heading 2" or re.match(r'^\d+\.\d+\s', text):
            set_paragraph_format(p, alignment=WD_ALIGN_PARAGRAPH.LEFT,
                                  line_spacing=1.5, space_before=8, space_after=4)
            for run in p.runs:
                set_run_font(run, cn_font="宋体", en_font="Times New Roman",
                             size_pt=XIAO_SAN, bold=True)

        # Heading 3：1.1.1 级 → 四号宋体空两格加粗
        elif style_name == "Heading 3" or re.match(r'^\d+\.\d+\.\d+\s', text):
            set_paragraph_format(p, alignment=WD_ALIGN_PARAGRAPH.LEFT,
                                  line_spacing=1.5, first_line_indent=28,
                                  space_before=6, space_after=3)
            for run in p.runs:
                set_run_font(run, cn_font="宋体", en_font="Times New Roman",
                             size_pt=SI_HAO, bold=True)

        # Heading 4：（1）级 → 小四号宋体空两格加粗
        elif style_name == "Heading 4" or re.match(r'^\(\d+\)', text) or re.match(r'^\d+\.\d+\.\d+\.\d+', text):
            set_paragraph_format(p, alignment=WD_ALIGN_PARAGRAPH.LEFT,
                                  line_spacing=1.5, first_line_indent=28,
                                  space_before=4, space_after=2)
            for run in p.runs:
                set_run_font(run, cn_font="宋体", en_font="Times New Roman",
                             size_pt=XIAO_SI, bold=True)

        # 摘要 / Abstract 标题行
        elif text == "摘要":
            set_paragraph_format(p, alignment=WD_ALIGN_PARAGRAPH.CENTER,
                                  line_spacing=1.5, space_before=6, space_after=4)
            for run in p.runs:
                set_run_font(run, cn_font="黑体", en_font="Times New Roman",
                             size_pt=SAN_HAO, bold=True)
        elif text == "Abstract":
            set_paragraph_format(p, alignment=WD_ALIGN_PARAGRAPH.CENTER,
                                  line_spacing=1.5, space_before=6, space_after=4)
            for run in p.runs:
                set_run_font(run, cn_font="Times New Roman", en_font="Times New Roman",
                             size_pt=XIAO_ER, bold=True)

        # 关键词行（顶格加粗）
        elif text.startswith("关键词") or text.startswith("Keywords"):
            set_paragraph_format(p, alignment=WD_ALIGN_PARAGRAPH.LEFT,
                                  line_spacing=1.5, space_before=4)
            for run in p.runs:
                set_run_font(run, cn_font="宋体", en_font="Times New Roman",
                             size_pt=XIAO_SI, bold=True)

        # 表/图标题行（五号黑体加粗）
        elif re.match(r'^(表|图)\s*\S', text):
            set_paragraph_format(p, alignment=WD_ALIGN_PARAGRAPH.CENTER,
                                  line_spacing=1.5, space_before=4, space_after=2)
            for run in p.runs:
                set_run_font(run, cn_font="黑体", en_font="Times New Roman",
                             size_pt=WU_HAO, bold=True)

        # 普通正文段落 → 小四号宋体，首行缩进2字符，1.5倍行距
        else:
            set_paragraph_format(p, alignment=WD_ALIGN_PARAGRAPH.JUSTIFY,
                                  line_spacing=1.5, first_line_indent=24)
            for run in p.runs:
                set_run_font(run, cn_font="宋体", en_font="Times New Roman",
                             size_pt=XIAO_SI, bold=False)

    # 处理表格内文字 → 五号宋体居中
    for table in doc.tables:
        for row in table.rows:
            for cell in row.cells:
                for p in cell.paragraphs:
                    set_paragraph_format(p, alignment=WD_ALIGN_PARAGRAPH.CENTER,
                                          line_spacing=1.0, first_line_indent=0)
                    for run in p.runs:
                        set_run_font(run, cn_font="宋体", en_font="Times New Roman",
                                     size_pt=WU_HAO, bold=False)

    # 设置文档默认字体
    styles = doc.styles
    normal = styles['Normal']
    normal.font.name = 'Times New Roman'
    normal.font.size = Pt(XIAO_SI)
    rpr = normal.element.get_or_add_rPr()
    rfonts = rpr.find(qn('w:rFonts'))
    if rfonts is None:
        rfonts = OxmlElement('w:rFonts')
        rpr.insert(0, rfonts)
    rfonts.set(qn('w:eastAsia'), '宋体')

    out_path = "/workspace/docs/毕业设计论文.docx"
    doc.save(out_path)
    print(f"已保存：{out_path}")
    print("字体字号设置完成，符合规范要求")


if __name__ == "__main__":
    main()
