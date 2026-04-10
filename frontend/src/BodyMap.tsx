import React, { useState } from 'react';

// --- ORGAN DEFINITIONS ---
export type OrganId = 'brain' | 'eyes' | 'lungs' | 'heart' | 'liver' | 'stomach' | 'kidneys' | 'intestines' | 'bones' | 'blood' | 'thyroid' | 'spleen' | 'pancreas' | 'bladder';

interface OrganMarker {
  id: OrganId;
  label: string;
  keywords: string[];
  /** Position as percentage from top-left of the image */
  x: number;
  y: number;
  /** Which side to show the label tooltip */
  labelSide: 'left' | 'right';
}

const ORGANS: OrganMarker[] = [
  {
    id: 'brain', label: 'Brain',
    keywords: ['brain', 'neurological', 'neuro', 'headache', 'migraine', 'seizure', 'concussion', 'stroke', 'cerebral', 'cognitive', 'memory', 'dizziness', 'vertigo', 'mental'],
    x: 50, y: 7, labelSide: 'right'
  },
  {
    id: 'eyes', label: 'Eyes',
    keywords: ['eye', 'vision', 'retina', 'optic', 'cataract', 'glaucoma', 'blindness', 'blurred vision', 'conjunctivitis', 'ocular'],
    x: 50, y: 16, labelSide: 'left'
  },
  {
    id: 'thyroid', label: 'Thyroid',
    keywords: ['thyroid', 'tsh', 'thyroxine', 't3', 't4', 'goiter', 'hypothyroid', 'hyperthyroid', 'thyroiditis'],
    x: 50, y: 26, labelSide: 'right'
  },
  {
    id: 'lungs', label: 'Lungs',
    keywords: ['lung', 'pulmonary', 'respiratory', 'breathing', 'cough', 'asthma', 'bronchitis', 'pneumonia', 'tuberculosis', 'tb', 'shortness of breath', 'wheezing', 'chest', 'oxygen saturation', 'spo2', 'copd'],
    x: 38, y: 38, labelSide: 'left'
  },
  {
    id: 'heart', label: 'Heart',
    keywords: ['heart', 'cardiac', 'cardio', 'cardiovascular', 'ecg', 'ekg', 'blood pressure', 'hypertension', 'cholesterol', 'ldl', 'hdl', 'triglycerides', 'arrhythmia', 'palpitation', 'chest pain', 'angina', 'myocardial'],
    x: 52, y: 38, labelSide: 'right'
  },
  {
    id: 'liver', label: 'Liver',
    keywords: ['liver', 'hepatic', 'hepatitis', 'bilirubin', 'sgpt', 'sgot', 'alt', 'ast', 'alkaline phosphatase', 'alp', 'ggt', 'jaundice', 'cirrhosis', 'fatty liver', 'liver function'],
    x: 42, y: 50, labelSide: 'left'
  },
  {
    id: 'stomach', label: 'Stomach',
    keywords: ['stomach', 'gastric', 'gastritis', 'acid', 'ulcer', 'nausea', 'vomiting', 'appetite', 'digestion', 'abdominal', 'abdomen', 'epigastric', 'bloating', 'indigestion'],
    x: 57, y: 50, labelSide: 'right'
  },
  {
    id: 'spleen', label: 'Spleen',
    keywords: ['spleen', 'splenic', 'splenomegaly', 'platelet', 'thrombocytopenia'],
    x: 62, y: 46, labelSide: 'right'
  },
  {
    id: 'pancreas', label: 'Pancreas',
    keywords: ['pancreas', 'pancreatic', 'insulin', 'glucose', 'blood sugar', 'diabetes', 'diabetic', 'hba1c', 'a1c', 'fasting glucose', 'glycated'],
    x: 50, y: 55, labelSide: 'left'
  },
  {
    id: 'kidneys', label: 'Kidneys',
    keywords: ['kidney', 'renal', 'nephro', 'creatinine', 'urea', 'bun', 'gfr', 'urine', 'urinary', 'proteinuria', 'dialysis', 'kidney stone', 'nephritis', 'electrolyte'],
    x: 38, y: 56, labelSide: 'left'
  },
  {
    id: 'intestines', label: 'Intestines',
    keywords: ['intestine', 'bowel', 'colon', 'rectal', 'ibs', 'colitis', 'crohn', 'diarrhea', 'constipation', 'abdominal pain', 'gut', 'celiac', 'digestive'],
    x: 50, y: 67, labelSide: 'right'
  },
  {
    id: 'bladder', label: 'Bladder',
    keywords: ['bladder', 'urination', 'uti', 'urinary tract', 'incontinence', 'cystitis'],
    x: 50, y: 79, labelSide: 'left'
  },
  {
    id: 'bones', label: 'Bones / Joints',
    keywords: ['bone', 'skeleton', 'fracture', 'osteoporosis', 'calcium', 'vitamin d', 'joint', 'arthritis', 'ortho', 'orthopedic', 'spine', 'spinal', 'back pain', 'knee', 'hip'],
    x: 62, y: 35, labelSide: 'right'
  },
  {
    id: 'blood', label: 'Blood',
    keywords: ['blood', 'hemoglobin', 'hb', 'hgb', 'rbc', 'wbc', 'platelet', 'anemia', 'iron', 'ferritin', 'mcv', 'mch', 'mchc', 'hematocrit', 'esr', 'crp', 'cbc', 'complete blood count', 'bleeding', 'clotting', 'coagulation', 'leukocyte', 'lymphocyte', 'neutrophil'],
    x: 50, y: 44, labelSide: 'left'
  },
];

// --- KEYWORD MATCHING ---
export function detectAffectedOrgans(text: string): OrganId[] {
  const lower = text.toLowerCase();
  const affected: OrganId[] = [];
  for (const organ of ORGANS) {
    for (const kw of organ.keywords) {
      if (lower.includes(kw)) {
        affected.push(organ.id);
        break;
      }
    }
  }
  return affected;
}

// --- BODY MAP COMPONENT ---
interface BodyMapProps {
  affectedOrgans: OrganId[];
  isDark: boolean;
}

const BodyMap: React.FC<BodyMapProps> = ({ affectedOrgans, isDark }) => {
  const [hoveredOrgan, setHoveredOrgan] = useState<OrganId | null>(null);

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: 520, margin: '0 auto' }}>
      {/* Title */}
      <h3 style={{
        textAlign: 'center',
        fontWeight: 900,
        fontSize: 13,
        letterSpacing: '0.15em',
        textTransform: 'uppercase',
        marginBottom: 16,
        color: isDark ? '#94a3b8' : '#64748b',
      }}>
        Affected Body Areas
      </h3>

      {/* Image container with markers */}
      <div style={{
        position: 'relative',
        width: '100%',
        borderRadius: 20,
        overflow: 'hidden',
      }}>
        {/* The realistic anatomy image */}
        <img
          src="/realistic_body_map.png"
          alt="Human anatomy"
          draggable={false}
          style={{
            width: '100%',
            display: 'block',
            userSelect: 'none',
          }}
        />

        {/* Scan-line overlay for futuristic feel */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0,200,255,0.015) 2px,
            rgba(0,200,255,0.015) 4px
          )`,
          pointerEvents: 'none',
          zIndex: 1,
        }} />

        {/* Organ markers */}
        {ORGANS.map((organ) => {
          const isAffected = affectedOrgans.includes(organ.id);
          const isHovered = hoveredOrgan === organ.id;

          if (!isAffected && !isHovered) {
            // Show a subtle dot for non-affected organs
            return (
              <div
                key={organ.id}
                onMouseEnter={() => setHoveredOrgan(organ.id)}
                onMouseLeave={() => setHoveredOrgan(null)}
                style={{
                  position: 'absolute',
                  left: `${organ.x}%`,
                  top: `${organ.y}%`,
                  transform: 'translate(-50%, -50%)',
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  border: `1.5px solid rgba(100, 200, 255, 0.3)`,
                  cursor: 'pointer',
                  zIndex: 5,
                  transition: 'all 0.3s ease',
                }}
              />
            );
          }

          return (
            <div
              key={organ.id}
              onMouseEnter={() => setHoveredOrgan(organ.id)}
              onMouseLeave={() => setHoveredOrgan(null)}
              style={{
                position: 'absolute',
                left: `${organ.x}%`,
                top: `${organ.y}%`,
                transform: 'translate(-50%, -50%)',
                zIndex: 10,
                cursor: 'pointer',
              }}
            >
              {/* Outer pulse ring - only for affected */}
              {isAffected && (
                <>
                  <div style={{
                    position: 'absolute',
                    inset: -18,
                    borderRadius: '50%',
                    border: '2px solid rgba(239, 68, 68, 0.4)',
                    animation: 'markerPulseOuter 2s ease-out infinite',
                  }} />
                  <div style={{
                    position: 'absolute',
                    inset: -10,
                    borderRadius: '50%',
                    border: '1.5px solid rgba(239, 68, 68, 0.6)',
                    animation: 'markerPulseInner 2s ease-out infinite 0.3s',
                  }} />
                </>
              )}

              {/* Core circle */}
              <div style={{
                width: isAffected ? 18 : 14,
                height: isAffected ? 18 : 14,
                borderRadius: '50%',
                backgroundColor: isAffected ? 'rgba(239, 68, 68, 0.85)' : 'rgba(59, 130, 246, 0.7)',
                border: `2px solid ${isAffected ? '#fca5a5' : '#93c5fd'}`,
                boxShadow: isAffected
                  ? '0 0 20px rgba(239, 68, 68, 0.6), 0 0 40px rgba(239, 68, 68, 0.3), inset 0 0 8px rgba(255,255,255,0.3)'
                  : '0 0 12px rgba(59, 130, 246, 0.5), inset 0 0 4px rgba(255,255,255,0.2)',
                transition: 'all 0.3s ease',
                position: 'relative',
              }}>
                {/* Inner white dot */}
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 4,
                  height: 4,
                  borderRadius: '50%',
                  backgroundColor: '#fff',
                  opacity: 0.9,
                }} />
              </div>

              {/* Crosshair lines */}
              {isAffected && (
                <>
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: -14,
                    width: 10,
                    height: 1,
                    backgroundColor: 'rgba(239, 68, 68, 0.6)',
                    transform: 'translateY(-50%)',
                  }} />
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    right: -14,
                    width: 10,
                    height: 1,
                    backgroundColor: 'rgba(239, 68, 68, 0.6)',
                    transform: 'translateY(-50%)',
                  }} />
                  <div style={{
                    position: 'absolute',
                    left: '50%',
                    top: -14,
                    width: 1,
                    height: 10,
                    backgroundColor: 'rgba(239, 68, 68, 0.6)',
                    transform: 'translateX(-50%)',
                  }} />
                  <div style={{
                    position: 'absolute',
                    left: '50%',
                    bottom: -14,
                    width: 1,
                    height: 10,
                    backgroundColor: 'rgba(239, 68, 68, 0.6)',
                    transform: 'translateX(-50%)',
                  }} />
                </>
              )}

              {/* Label tooltip */}
              {(isAffected || isHovered) && (
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  ...(organ.labelSide === 'right'
                    ? { left: 'calc(100% + 22px)' }
                    : { right: 'calc(100% + 22px)' }
                  ),
                  transform: 'translateY(-50%)',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  flexDirection: organ.labelSide === 'right' ? 'row' : 'row-reverse',
                }}>
                  {/* Connector line */}
                  <div style={{
                    width: 16,
                    height: 1,
                    backgroundColor: isAffected ? 'rgba(239, 68, 68, 0.6)' : 'rgba(59, 130, 246, 0.5)',
                  }} />
                  {/* Label chip */}
                  <div style={{
                    padding: '4px 10px',
                    borderRadius: 8,
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: '#fff',
                    backgroundColor: isAffected ? 'rgba(239, 68, 68, 0.85)' : 'rgba(59, 130, 246, 0.75)',
                    backdropFilter: 'blur(8px)',
                    boxShadow: isAffected
                      ? '0 0 12px rgba(239, 68, 68, 0.4)'
                      : '0 0 8px rgba(59, 130, 246, 0.3)',
                    border: `1px solid ${isAffected ? 'rgba(252,165,165,0.4)' : 'rgba(147,197,253,0.4)'}`,
                  }}>
                    {isAffected ? '⚠ ' : ''}{organ.label}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* CSS Keyframes */}
      <style>{`
        @keyframes markerPulseOuter {
          0% { transform: scale(0.8); opacity: 1; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes markerPulseInner {
          0% { transform: scale(0.9); opacity: 1; }
          100% { transform: scale(1.8); opacity: 0; }
        }
      `}</style>

      {/* Legend bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: 28,
        marginTop: 16,
        fontSize: 11,
        fontWeight: 700,
        color: isDark ? '#94a3b8' : '#64748b',
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            width: 10, height: 10, borderRadius: '50%',
            backgroundColor: 'rgba(239, 68, 68, 0.85)',
            boxShadow: '0 0 8px rgba(239, 68, 68, 0.5)',
            display: 'inline-block',
          }} />
          Affected
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            width: 10, height: 10, borderRadius: '50%',
            border: '1.5px solid rgba(100, 200, 255, 0.4)',
            display: 'inline-block',
          }} />
          Normal
        </span>
      </div>
    </div>
  );
};

export default BodyMap;
