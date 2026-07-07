from fpdf import FPDF

class PDF(FPDF):
    def header(self):
        self.set_font('helvetica', 'B', 15)
        self.cell(0, 10, 'Lab Project Synopsis - Q&A Format', border=False, align='C')
        self.ln(15)

    def chapter_title(self, title):
        self.set_font('helvetica', 'B', 12)
        self.multi_cell(0, 10, title)
        self.ln(2)

    def chapter_body(self, body):
        self.set_font('helvetica', '', 11)
        self.multi_cell(0, 6, body)
        self.ln(5)

md_file = 'C:\\Users\\neelp\\.gemini\\antigravity\\brain\\1b014401-2939-439f-b247-28387e0a5a64\\lab_project_synopsis.md'
with open(md_file, 'r', encoding='utf-8') as f:
    content = f.read()
content = content.replace('–', '-').replace('θ', 'theta').replace('°', ' degrees').replace('—', '-').replace('±', '+/-')

pdf = PDF()
pdf.add_page()
pdf.set_font('helvetica', '', 11)

pdf.chapter_body('Project Title: Real-Time Dynamic Strain & Deformation Analysis in High-Speed Textile Manufacturing Using Edge Computer Vision')
pdf.chapter_title('Submitted by : Neel Poddar 2441540 5BCA-A')
pdf.ln(5)

parts = content.split('### ')
for part in parts[1:]:
    lines = part.split('\n')
    title = lines[0].strip()
    body = '\n'.join(lines[1:]).replace('*', '').replace('_', '').replace('---', '').strip()
    pdf.chapter_title(title)
    pdf.chapter_body(body)

pdf.output('C:\\Users\\neelp\\.gemini\\antigravity\\brain\\1b014401-2939-439f-b247-28387e0a5a64\\lab_project_synopsis.pdf')
