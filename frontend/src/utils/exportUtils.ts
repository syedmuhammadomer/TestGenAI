import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// ── Types (mirrored from [id].tsx) ──────────────────────────────────────────
type Feature    = { id?: number; title: string; description: string; userImpact?: string; technicalDetails?: string; priority?: string; module?: string }
type UserStory  = { id?: number; actor: string; goal: string; benefit: string; acceptanceCriteria: string; priority?: string; storyPoints?: number }
type TestCase   = { id?: number; testCaseId: string; title: string; type?: string; preconditions: string; steps: string; expectedResult: string; severity?: string; category?: string }
type RtmEntry   = { id: number; requirementId: string; description: string; linkedUserStories: string[]; linkedTestCases: string[] }
type Analytics  = { totalFeatures: number; totalUserStories: number; totalTestCases: number; totalRequirements: number; coverageSummary?: string; riskAreas?: string | string[]; coveragePercentage?: number; qualityScore?: number; recommendations?: string[]; testTypeBreakdown?: { positive: number; negative: number; edge: number }; priorityBreakdown?: { high: number; medium: number; low: number } }

export interface ExportData {
  projectName: string
  createdAt: string
  features: Feature[]
  userStories: UserStory[]
  testCases: TestCase[]
  rtm: RtmEntry[]
  analytics?: Analytics
}

// ── CSV Export ────────────────────────────────────────────────────────────────
function esc(value: unknown): string {
  const str = value == null ? '' : String(value).replace(/"/g, '""')
  return `"${str}"`
}

export function exportTestCasesCSV(data: ExportData) {
  const headers = [
    'Test Case ID', 'Title', 'Type', 'Severity', 'Category',
    'Preconditions', 'Steps', 'Expected Result',
  ]

  const rows = data.testCases.map((tc) => [
    esc(tc.testCaseId),
    esc(tc.title),
    esc(tc.type ?? ''),
    esc(tc.severity ?? ''),
    esc(tc.category ?? ''),
    esc(tc.preconditions),
    esc(tc.steps),
    esc(tc.expectedResult),
  ])

  const csv = [headers.map(esc).join(','), ...rows.map((r) => r.join(','))].join('\r\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${slugify(data.projectName)}_test-cases.csv`
  link.click()
  URL.revokeObjectURL(url)
}

export function exportTestCasesTemplate(data: ExportData) {
  const headers = [
    'Test Case ID', 'Title', 'Type', 'Severity', 'Category',
    'Preconditions', 'Steps', 'Expected Result',
    'Actual Result', 'Status', 'Tester', 'Execution Date', 'Notes',
  ]

  const rows = data.testCases.map((tc) => [
    esc(tc.testCaseId),
    esc(tc.title),
    esc(tc.type ?? ''),
    esc(tc.severity ?? ''),
    esc(tc.category ?? ''),
    esc(tc.preconditions),
    esc(tc.steps),
    esc(tc.expectedResult),
    esc(''),   // Actual Result — blank for tester to fill
    esc(''),   // Status — blank
    esc(''),   // Tester
    esc(''),   // Execution Date
    esc(''),   // Notes
  ])

  const csv = [headers.map(esc).join(','), ...rows.map((r) => r.join(','))].join('\r\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${slugify(data.projectName)}_test-cases-template.csv`
  link.click()
  URL.revokeObjectURL(url)
}

// ── PDF Report ───────────────────────────────────────────────────────────────
const PRIMARY  = [20, 184, 166] as [number, number, number]   // teal-500
const DARK     = [15, 23, 42]   as [number, number, number]   // slate-900
const GRAY     = [100, 116, 139] as [number, number, number]  // slate-500
const LIGHT    = [241, 245, 249] as [number, number, number]  // slate-100
const WHITE    = [255, 255, 255] as [number, number, number]
const BLACK    = [15, 23, 42]   as [number, number, number]

function slugify(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function addCoverPage(doc: jsPDF, data: ExportData) {
  const W = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()

  // Dark background
  doc.setFillColor(...DARK)
  doc.rect(0, 0, W, H, 'F')

  // Teal accent bar on left
  doc.setFillColor(...PRIMARY)
  doc.rect(0, 0, 6, H, 'F')

  // Logo area
  doc.setFillColor(20, 184, 166, 0.15)
  doc.roundedRect(20, 28, 40, 40, 6, 6, 'F')
  doc.setTextColor(...PRIMARY)
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text('TG', 40, 54, { align: 'center' })

  // TestGen AI label
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...GRAY)
  doc.text('TestGen AI', 20, 80)

  // Report type
  doc.setFontSize(9)
  doc.setTextColor(...PRIMARY)
  doc.text('PROJECT REPORT', 20, 100)

  // Project name
  doc.setFontSize(26)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...WHITE)
  const nameLines = doc.splitTextToSize(data.projectName, W - 40)
  doc.text(nameLines, 20, 116)

  // Divider
  const divY = 126 + (nameLines.length - 1) * 10
  doc.setDrawColor(...PRIMARY)
  doc.setLineWidth(0.5)
  doc.line(20, divY, W - 20, divY)

  // Meta
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...GRAY)
  const generatedOn = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  const createdOn   = new Date(data.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  doc.text(`Created: ${createdOn}`, 20, divY + 10)
  doc.text(`Generated: ${generatedOn}`, 20, divY + 18)

  // Stats summary boxes
  const stats = [
    { label: 'Features',    value: data.features.length },
    { label: 'User Stories', value: data.userStories.length },
    { label: 'Test Cases',  value: data.testCases.length },
    { label: 'RTM Entries', value: data.rtm.length },
  ]
  const boxW = (W - 40 - 12) / 4
  const boxY = divY + 34
  stats.forEach((s, i) => {
    const bx = 20 + i * (boxW + 4)
    doc.setFillColor(30, 41, 59)
    doc.roundedRect(bx, boxY, boxW, 28, 3, 3, 'F')
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...PRIMARY)
    doc.text(String(s.value), bx + boxW / 2, boxY + 11, { align: 'center' })
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...GRAY)
    doc.text(s.label, bx + boxW / 2, boxY + 20, { align: 'center' })
  })

  // Footer
  doc.setFontSize(8)
  doc.setTextColor(...GRAY)
  doc.text('Confidential · Generated by TestGen AI', W / 2, H - 12, { align: 'center' })
}

function addSectionTitle(doc: jsPDF, title: string, y: number): number {
  const W = doc.internal.pageSize.getWidth()
  doc.setFillColor(...PRIMARY)
  doc.rect(14, y, 3, 8, 'F')
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...BLACK)
  doc.text(title, 20, y + 6.5)
  doc.setDrawColor(...LIGHT)
  doc.setLineWidth(0.3)
  doc.line(14, y + 10, W - 14, y + 10)
  return y + 18
}

function pageFooter(doc: jsPDF, pageNum: number, totalPages: number) {
  const W = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()
  doc.setFillColor(...LIGHT)
  doc.rect(0, H - 14, W, 14, 'F')
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...GRAY)
  doc.text('TestGen AI — Confidential', 14, H - 5)
  doc.text(`Page ${pageNum} of ${totalPages}`, W - 14, H - 5, { align: 'right' })
}

export function generatePDFReport(data: ExportData) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()

  // ── Cover page ──
  addCoverPage(doc, data)

  // ── Table of Contents ──
  doc.addPage()
  let y = 20
  y = addSectionTitle(doc, 'Table of Contents', y)

  const toc = [
    ['1', 'Features',                    String(data.features.length)    ],
    ['2', 'User Stories',                String(data.userStories.length)  ],
    ['3', 'Test Cases',                  String(data.testCases.length)   ],
    ['4', 'Requirements Traceability Matrix', String(data.rtm.length)    ],
    ['5', 'Analytics & Summary',         data.analytics ? '✓' : '—'      ],
  ]

  toc.forEach(([num, name, count]) => {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(30, 41, 59)
    doc.text(`${num}.`, 18, y)
    doc.text(name, 26, y)
    doc.setTextColor(...GRAY)
    doc.text(count, W - 18, y, { align: 'right' })
    doc.setDrawColor(203, 213, 225)
    doc.setLineWidth(0.2)
    doc.line(26, y + 1, W - 22, y + 1)
    y += 10
  })

  // ── FEATURES ──
  if (data.features.length > 0) {
    doc.addPage()
    y = 20
    y = addSectionTitle(doc, `1. Features  (${data.features.length})`, y)

    autoTable(doc, {
      startY: y,
      head: [['#', 'Feature', 'Priority', 'Module', 'Description']],
      body: data.features.map((f, i) => [
        String(i + 1),
        f.title,
        f.priority ?? '—',
        f.module ?? '—',
        f.description,
      ]),
      headStyles: { fillColor: PRIMARY, textColor: WHITE, fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 8 },
        1: { cellWidth: 44 },
        2: { cellWidth: 18 },
        3: { cellWidth: 22 },
        4: { cellWidth: 'auto' },
      },
      styles: { overflow: 'linebreak', cellPadding: 2.5 },
      margin: { left: 14, right: 14 },
      didDrawPage: (hookData) => {
        if (hookData.pageNumber > 1) pageFooter(doc, hookData.pageNumber, 99)
      },
    })

    // User impact + technical details for each feature (if any)
    data.features.forEach((f, i) => {
      if (!f.userImpact && !f.technicalDetails) return
      const tbl = doc as unknown as { lastAutoTable: { finalY: number } }
      y = (tbl.lastAutoTable?.finalY ?? 100) + 6
      if (y > 240) { doc.addPage(); y = 20 }
      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...PRIMARY)
      doc.text(`Feature ${i + 1}: ${f.title}`, 14, y)
      y += 5
      if (f.userImpact) {
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...GRAY)
        doc.text('User Impact:', 14, y)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(30, 41, 59)
        const lines = doc.splitTextToSize(f.userImpact, W - 28)
        doc.text(lines, 14, y + 4)
        y += 4 + lines.length * 4
      }
      if (f.technicalDetails) {
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...GRAY)
        doc.text('Technical Details:', 14, y + 2)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(30, 41, 59)
        const lines = doc.splitTextToSize(f.technicalDetails, W - 28)
        doc.text(lines, 14, y + 6)
        y += 10 + lines.length * 4
      }
    })
  }

  // ── USER STORIES ──
  if (data.userStories.length > 0) {
    doc.addPage()
    y = 20
    y = addSectionTitle(doc, `2. User Stories  (${data.userStories.length})`, y)

    autoTable(doc, {
      startY: y,
      head: [['#', 'Actor', 'Goal', 'Benefit', 'Priority', 'Pts']],
      body: data.userStories.map((s, i) => [
        String(i + 1),
        s.actor,
        s.goal,
        s.benefit,
        s.priority ?? '—',
        s.storyPoints != null ? String(s.storyPoints) : '—',
      ]),
      headStyles: { fillColor: [99, 102, 241], textColor: WHITE, fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 8 },
        1: { cellWidth: 28 },
        2: { cellWidth: 'auto' },
        3: { cellWidth: 42 },
        4: { cellWidth: 18 },
        5: { cellWidth: 10 },
      },
      styles: { overflow: 'linebreak', cellPadding: 2.5 },
      margin: { left: 14, right: 14 },
    })

    // Acceptance criteria
    const tbl = doc as unknown as { lastAutoTable: { finalY: number } }
    y = (tbl.lastAutoTable?.finalY ?? 100) + 10
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 41, 59)
    doc.text('Acceptance Criteria', 14, y)
    y += 6

    data.userStories.forEach((s, i) => {
      if (!s.acceptanceCriteria) return
      if (y > 250) { doc.addPage(); y = 20 }
      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor([99, 102, 241] as unknown as number)
      doc.text(`Story ${i + 1}: As a ${s.actor}, I want to ${s.goal}`, 14, y)
      y += 5
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(30, 41, 59)
      const lines = doc.splitTextToSize(s.acceptanceCriteria, W - 28)
      doc.text(lines, 14, y)
      y += lines.length * 4 + 5
    })
  }

  // ── TEST CASES ──
  if (data.testCases.length > 0) {
    doc.addPage()
    y = 20
    y = addSectionTitle(doc, `3. Test Cases  (${data.testCases.length})`, y)

    autoTable(doc, {
      startY: y,
      head: [['ID', 'Title', 'Type', 'Severity', 'Category', 'Preconditions', 'Steps', 'Expected Result']],
      body: data.testCases.map((tc) => [
        tc.testCaseId,
        tc.title,
        tc.type ?? '—',
        tc.severity ?? '—',
        tc.category ?? '—',
        tc.preconditions,
        tc.steps,
        tc.expectedResult,
      ]),
      headStyles: { fillColor: [16, 185, 129], textColor: WHITE, fontStyle: 'bold', fontSize: 7.5 },
      bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 18 },
        1: { cellWidth: 32 },
        2: { cellWidth: 14 },
        3: { cellWidth: 16 },
        4: { cellWidth: 20 },
        5: { cellWidth: 'auto' },
        6: { cellWidth: 'auto' },
        7: { cellWidth: 'auto' },
      },
      styles: { overflow: 'linebreak', cellPadding: 2 },
      margin: { left: 14, right: 14 },
    })
  }

  // ── RTM ──
  if (data.rtm.length > 0) {
    doc.addPage()
    y = 20
    y = addSectionTitle(doc, `4. Requirements Traceability Matrix  (${data.rtm.length})`, y)

    autoTable(doc, {
      startY: y,
      head: [['Req ID', 'Description', 'Linked User Stories', 'Linked Test Cases']],
      body: data.rtm.map((r) => [
        r.requirementId,
        r.description,
        (r.linkedUserStories ?? []).join(', ') || '—',
        (r.linkedTestCases ?? []).join(', ') || '—',
      ]),
      headStyles: { fillColor: [245, 158, 11], textColor: WHITE, fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 40 },
        3: { cellWidth: 40 },
      },
      styles: { overflow: 'linebreak', cellPadding: 2.5 },
      margin: { left: 14, right: 14 },
    })
  }

  // ── ANALYTICS ──
  if (data.analytics) {
    const a = data.analytics
    doc.addPage()
    y = 20
    y = addSectionTitle(doc, '5. Analytics & Summary', y)

    // KPI boxes
    const kpis = [
      { label: 'Features',     value: a.totalFeatures,    color: PRIMARY },
      { label: 'User Stories', value: a.totalUserStories, color: [99, 102, 241] as [number,number,number] },
      { label: 'Test Cases',   value: a.totalTestCases,   color: [16, 185, 129] as [number,number,number] },
      { label: 'Requirements', value: a.totalRequirements, color: [245, 158, 11] as [number,number,number] },
    ]
    const bw = (W - 28 - 9) / 4
    kpis.forEach((k, i) => {
      const bx = 14 + i * (bw + 3)
      doc.setFillColor(248, 250, 252)
      doc.roundedRect(bx, y, bw, 20, 2, 2, 'F')
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...k.color)
      doc.text(String(k.value ?? 0), bx + bw / 2, y + 10, { align: 'center' })
      doc.setFontSize(7)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...GRAY)
      doc.text(k.label, bx + bw / 2, y + 16, { align: 'center' })
    })
    y += 28

    // Quality score + coverage bars
    if (a.qualityScore != null || a.coveragePercentage != null) {
      if (a.qualityScore != null) {
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(30, 41, 59)
        doc.text(`Quality Score: ${a.qualityScore}%`, 14, y)
        y += 4
        doc.setFillColor(226, 232, 240)
        doc.roundedRect(14, y, W - 28, 5, 2, 2, 'F')
        const scoreColor: [number,number,number] = a.qualityScore >= 80 ? [16, 185, 129] : a.qualityScore >= 60 ? [245, 158, 11] : [239, 68, 68]
        doc.setFillColor(...scoreColor)
        doc.roundedRect(14, y, (W - 28) * a.qualityScore / 100, 5, 2, 2, 'F')
        y += 10
      }
      if (a.coveragePercentage != null) {
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(30, 41, 59)
        doc.text(`Test Coverage: ${a.coveragePercentage}%`, 14, y)
        y += 4
        doc.setFillColor(226, 232, 240)
        doc.roundedRect(14, y, W - 28, 5, 2, 2, 'F')
        const covColor: [number,number,number] = a.coveragePercentage >= 80 ? [16, 185, 129] : a.coveragePercentage >= 60 ? [245, 158, 11] : [239, 68, 68]
        doc.setFillColor(...covColor)
        doc.roundedRect(14, y, (W - 28) * a.coveragePercentage / 100, 5, 2, 2, 'F')
        y += 12
      }
    }

    // Test type breakdown table
    if (a.testTypeBreakdown) {
      const total = (a.testTypeBreakdown.positive ?? 0) + (a.testTypeBreakdown.negative ?? 0) + (a.testTypeBreakdown.edge ?? 0)
      autoTable(doc, {
        startY: y + 4,
        head: [['Test Type', 'Count', '%']],
        body: [
          ['Positive', String(a.testTypeBreakdown.positive ?? 0), total > 0 ? `${Math.round((a.testTypeBreakdown.positive ?? 0) / total * 100)}%` : '—'],
          ['Negative', String(a.testTypeBreakdown.negative ?? 0), total > 0 ? `${Math.round((a.testTypeBreakdown.negative ?? 0) / total * 100)}%` : '—'],
          ['Edge Cases', String(a.testTypeBreakdown.edge ?? 0), total > 0 ? `${Math.round((a.testTypeBreakdown.edge ?? 0) / total * 100)}%` : '—'],
        ],
        headStyles: { fillColor: PRIMARY, textColor: WHITE, fontStyle: 'bold', fontSize: 8 },
        bodyStyles: { fontSize: 8 },
        tableWidth: 60,
        margin: { left: 14 },
      })
      const tbl2 = doc as unknown as { lastAutoTable: { finalY: number } }
      y = (tbl2.lastAutoTable?.finalY ?? y) + 8
    }

    // Coverage summary
    if (a.coverageSummary) {
      if (y > 230) { doc.addPage(); y = 20 }
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(30, 41, 59)
      doc.text('Coverage Summary', 14, y)
      y += 5
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(51, 65, 85)
      const lines = doc.splitTextToSize(a.coverageSummary, W - 28)
      doc.text(lines, 14, y)
      y += lines.length * 4 + 6
    }

    // Risk areas
    if (a.riskAreas) {
      if (y > 230) { doc.addPage(); y = 20 }
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(239, 68, 68)
      doc.text('Risk Areas', 14, y)
      y += 5
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(51, 65, 85)
      const risks = Array.isArray(a.riskAreas) ? a.riskAreas : [a.riskAreas]
      risks.forEach((r) => {
        if (y > 265) { doc.addPage(); y = 20 }
        doc.text(`• ${r}`, 16, y)
        y += 5
      })
      y += 4
    }

    // Recommendations
    if (a.recommendations && a.recommendations.length > 0) {
      if (y > 230) { doc.addPage(); y = 20 }
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(30, 41, 59)
      doc.text('Recommendations', 14, y)
      y += 5
      a.recommendations.forEach((rec, i) => {
        if (y > 265) { doc.addPage(); y = 20 }
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(8)
        doc.setTextColor(...PRIMARY)
        doc.text(`${i + 1}.`, 14, y)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(51, 65, 85)
        const lines = doc.splitTextToSize(rec, W - 30)
        doc.text(lines, 20, y)
        y += lines.length * 4 + 4
      })
    }
  }

  // ── Add page footers ──
  const totalPages = doc.getNumberOfPages()
  for (let p = 2; p <= totalPages; p++) {
    doc.setPage(p)
    pageFooter(doc, p - 1, totalPages - 1)
  }

  doc.save(`${slugify(data.projectName)}_report.pdf`)
}
