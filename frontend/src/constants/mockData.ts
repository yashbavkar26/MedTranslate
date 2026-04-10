export interface AnalysisResult {
  id: string;
  date: string;
  type: 'bloodTest' | 'labReport' | 'symptoms';
  summary: string;
  triageLevel: 'red' | 'yellow' | 'green';
  fullReport?: string;
}

export const mockAnalyses: AnalysisResult[] = [
  {
    id: '1',
    date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
    type: 'bloodTest',
    summary: 'Your Hemoglobin is slightly low at 11.5 g/dL (normal: 12.0-16.0). Your White Blood Cells are elevated, suggesting possible infection. Platelets are normal.',
    triageLevel: 'yellow',
    fullReport: 'CBC (Complete Blood Count) Results:\n- Hemoglobin: 11.5 g/dL (LOW)\n- WBC: 12,500 /µL (HIGH)\n- Platelets: 255,000 /µL (NORMAL)\n- Recommendation: Follow up with your doctor within 1-2 days.'
  },
  {
    id: '2',
    date: 'Oct 12, 2024',
    type: 'bloodTest',
    summary: 'Blood Test - All values within normal range.',
    triageLevel: 'green'
  },
  {
    id: '3',
    date: 'Sep 28, 2024',
    type: 'labReport',
    summary: 'Lab Report - Some elevated markers detected.',
    triageLevel: 'yellow'
  }
];

export const samplePDFContent = `
LAB REPORT
Patient: John Doe | DOB: 01/15/1985 | Date: ${new Date().toLocaleDateString()}

COMPLETE BLOOD COUNT (CBC)
Test Name                    Result          Reference Range     Unit
---------------------------------------------------------------------------
Hemoglobin                   11.5            12.0 - 16.0        g/dL
White Blood Cells (WBC)      12,500          4,500 - 11,000    /µL
Red Blood Cells (RBC)        4.2             4.5 - 5.5          M/µL
Hematocrit                   35              36 - 46            %
Mean Corpuscular Volume      82              80 - 100           fL
Platelets                    255,000         150,000 - 400,000  /µL

CLINICAL INTERPRETATION:
- Hemoglobin is SLIGHTLY LOW - May indicate mild anemia
- WBC is ELEVATED - Suggests possible infection or inflammation
- Other values are within normal range

RECOMMENDATION:
Follow up with your primary care physician within 1-2 days.
Monitor for symptoms of infection or fatigue.
`;
