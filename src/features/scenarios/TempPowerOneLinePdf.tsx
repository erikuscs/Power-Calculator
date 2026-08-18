import { Circle, G, Line, Path, Rect, Svg, Text as SvgTextPrimitive, View } from '@react-pdf/renderer'
import type { ReactNode } from 'react'
import type { TempPowerInputs, TempPowerResults } from './scenario.formulas'

interface TempPowerOneLinePdfProps {
  inputs: TempPowerInputs
  results: TempPowerResults
}

const ink = '#111827'
const muted = '#4b5563'
const panel = '#f8fafc'

function SvgText({
  x,
  y,
  textAnchor,
  fontSize,
  fontFamily,
  fill,
  children,
}: {
  x: number
  y: number
  textAnchor?: 'start' | 'middle' | 'end'
  fontSize: number
  fontFamily?: string
  fill: string
  children: ReactNode
}) {
  return (
    <SvgTextPrimitive
      x={x}
      y={y}
      textAnchor={textAnchor}
      style={{ fontSize, fontFamily, fill }}
    >
      {children}
    </SvgTextPrimitive>
  )
}

function DeviceTag({ x, y, label }: { x: number; y: number; label: string }) {
  return (
    <G>
      <Rect x={x - 18} y={y - 7} width={36} height={12} rx={2} fill="#ffffff" stroke="#9ca3af" strokeWidth={0.8} />
      <SvgText x={x} y={y + 1.5} textAnchor="middle" fontSize={5.2} fontFamily="Helvetica-Bold" fill={ink}>{label}</SvgText>
    </G>
  )
}

function Ground({ x, y }: { x: number; y: number }) {
  return (
    <G>
      <Line x1={x} y1={y} x2={x} y2={y + 5} stroke={ink} strokeWidth={1} />
      <Line x1={x - 7} y1={y + 5} x2={x + 7} y2={y + 5} stroke={ink} strokeWidth={1} />
      <Line x1={x - 4.5} y1={y + 8} x2={x + 4.5} y2={y + 8} stroke={ink} strokeWidth={1} />
      <Line x1={x - 2} y1={y + 11} x2={x + 2} y2={y + 11} stroke={ink} strokeWidth={1} />
    </G>
  )
}

function Breaker({ x, y, tag }: { x: number; y: number; tag: string }) {
  return (
    <G>
      <Rect x={x - 8} y={y - 8} width={16} height={16} fill="#ffffff" stroke={ink} strokeWidth={1.2} />
      <Line x1={x - 5} y1={y - 5} x2={x + 5} y2={y + 5} stroke={ink} strokeWidth={1.1} />
      <Line x1={x + 5} y1={y - 5} x2={x - 5} y2={y + 5} stroke={ink} strokeWidth={1.1} />
      <SvgText x={x} y={y + 15} textAnchor="middle" fontSize={5} fontFamily="Helvetica-Bold" fill={ink}>{tag}</SvgText>
    </G>
  )
}

export function TempPowerOneLinePdf({ inputs, results }: TempPowerOneLinePdfProps) {
  const voltage = inputs.siteVoltage ?? 480
  const includeCooling = inputs.includeCooling !== false

  return (
    <View style={{ borderWidth: 1, borderColor: '#d1d5db', backgroundColor: '#ffffff', padding: 6 }}>
      <Svg viewBox="0 0 520 238" style={{ width: '100%', height: 238 }}>
        <Rect x={0} y={0} width={520} height={238} fill="#ffffff" />
        <SvgText x={12} y={16} fontSize={9} fontFamily="Helvetica-Bold" fill={ink}>Temporary Power Electrical One-Line</SvgText>
        <SvgText x={508} y={16} textAnchor="end" fontSize={5.5} fill={muted}>Planning drawing - engineering review required</SvgText>

        <SvgText x={42} y={32} textAnchor="middle" fontSize={5} fontFamily="Helvetica-Bold" fill={muted}>SOURCE</SvgText>
        <SvgText x={145} y={32} textAnchor="middle" fontSize={5} fontFamily="Helvetica-Bold" fill={muted}>CONTROL</SvgText>
        <SvgText x={292} y={32} textAnchor="middle" fontSize={5} fontFamily="Helvetica-Bold" fill={muted}>DISTRIBUTION</SvgText>
        <SvgText x={468} y={32} textAnchor="middle" fontSize={5} fontFamily="Helvetica-Bold" fill={muted}>LOADS</SvgText>

        <Line x1={62} y1={70} x2={129} y2={70} stroke={ink} strokeWidth={1.6} />
        <Line x1={161} y1={70} x2={228} y2={70} stroke={ink} strokeWidth={1.6} />
        <Line x1={272} y1={70} x2={316} y2={70} stroke={ink} strokeWidth={1.6} />
        <Line x1={348} y1={70} x2={388} y2={70} stroke={ink} strokeWidth={1.6} />
        <Line x1={424} y1={70} x2={448} y2={70} stroke={ink} strokeWidth={1.6} />
        {includeCooling && (
          <G>
            <Line x1={436} y1={70} x2={436} y2={148} stroke={ink} strokeWidth={1.6} />
            <Line x1={436} y1={148} x2={448} y2={148} stroke={ink} strokeWidth={1.6} />
          </G>
        )}

        <Circle cx={42} cy={70} r={20} fill="#ffffff" stroke={ink} strokeWidth={1.6} />
        <SvgText x={42} y={75} textAnchor="middle" fontSize={14} fontFamily="Helvetica-Bold" fill={ink}>G</SvgText>
        <Ground x={42} y={92} />
        <DeviceTag x={42} y={42} label="GEN" />
        <Breaker x={88} y={70} tag="52G" />
        <SvgText x={42} y={111} textAnchor="middle" fontSize={5.5} fontFamily="Helvetica-Bold" fill={ink}>Generator Plant</SvgText>
        <SvgText x={42} y={119} textAnchor="middle" fontSize={4.8} fill={muted}>{`${Math.round(results.generatorKva)} kVA / ${Math.round(results.generatorKw)} kW`}</SvgText>

        <Rect x={129} y={52} width={32} height={36} fill={panel} stroke={ink} strokeWidth={1.2} />
        <Line x1={136} y1={80} x2={154} y2={60} stroke={ink} strokeWidth={1.4} />
        <Circle cx={135} cy={81} r={1.8} fill={ink} />
        <Circle cx={155} cy={59} r={1.8} fill={ink} />
        <DeviceTag x={145} y={42} label="ATS/52" />
        <SvgText x={145} y={101} textAnchor="middle" fontSize={5.5} fontFamily="Helvetica-Bold" fill={ink}>ATS / Generator Controller</SvgText>
        <SvgText x={145} y={109} textAnchor="middle" fontSize={4.8} fill={muted}>generator start + transfer logic</SvgText>

        <Rect x={122} y={120} width={46} height={26} rx={2} fill="#ffffff" stroke={ink} strokeWidth={1} strokeDasharray="3 2" />
        <SvgText x={145} y={132} textAnchor="middle" fontSize={6} fontFamily="Helvetica-Bold" fill={ink}>EMaaS</SvgText>
        <SvgText x={145} y={140} textAnchor="middle" fontSize={4.3} fill={muted}>telemetry / alarms</SvgText>
        <Line x1={145} y1={120} x2={145} y2={90} stroke={muted} strokeWidth={0.9} strokeDasharray="3 2" />

        <Rect x={228} y={48} width={44} height={44} fill={panel} stroke={ink} strokeWidth={1.2} />
        <Line x1={252} y1={54} x2={252} y2={86} stroke={ink} strokeWidth={3.4} />
        <Breaker x={239} y={70} tag="52" />
        <DeviceTag x={250} y={42} label="SWGR" />
        <SvgText x={250} y={104} textAnchor="middle" fontSize={5.5} fontFamily="Helvetica-Bold" fill={ink}>{`${voltage} V Switchgear`}</SvgText>
        <SvgText x={250} y={112} textAnchor="middle" fontSize={4.8} fill={muted}>{`${Math.round(results.ampsPerPhase)} A/phase`}</SvgText>

        <Circle cx={326} cy={70} r={15} fill="none" stroke={ink} strokeWidth={1.4} />
        <Circle cx={338} cy={70} r={15} fill="none" stroke={ink} strokeWidth={1.4} />
        <Ground x={332} y={88} />
        <DeviceTag x={332} y={42} label="XFMR" />
        <SvgText x={332} y={111} textAnchor="middle" fontSize={5.5} fontFamily="Helvetica-Bold" fill={ink}>Step-Down Transformer</SvgText>
        <SvgText x={332} y={119} textAnchor="middle" fontSize={4.8} fill={muted}>{`${voltage} V to 120/208 V`}</SvgText>

        <Rect x={388} y={50} width={36} height={40} fill={panel} stroke={ink} strokeWidth={1.2} />
        <Line x1={398} y1={57} x2={398} y2={83} stroke={ink} strokeWidth={1.8} />
        <Line x1={407} y1={57} x2={407} y2={83} stroke={ink} strokeWidth={1.8} />
        <Line x1={416} y1={57} x2={416} y2={83} stroke={ink} strokeWidth={1.8} />
        <DeviceTag x={406} y={42} label="PNL" />
        <SvgText x={406} y={104} textAnchor="middle" fontSize={5.5} fontFamily="Helvetica-Bold" fill={ink}>Branch Panels</SvgText>
        <SvgText x={406} y={112} textAnchor="middle" fontSize={4.8} fill={muted}>protected final distribution</SvgText>

        <Rect x={448} y={51} width={54} height={38} rx={2} fill="#ffffff" stroke={ink} strokeWidth={1.2} />
        <Line x1={459} y1={70} x2={487} y2={70} stroke={ink} strokeWidth={1.2} />
        <Path d="M 480 63 L 488 70 L 480 77" fill="none" stroke={ink} strokeWidth={1.2} />
        <DeviceTag x={475} y={42} label="LOAD" />
        <SvgText x={475} y={101} textAnchor="middle" fontSize={5.5} fontFamily="Helvetica-Bold" fill={ink}>Equipment Load</SvgText>
        <SvgText x={475} y={109} textAnchor="middle" fontSize={4.8} fill={muted}>{`${Math.round(results.totalLoadKw)} kW real power`}</SvgText>

        {includeCooling && (
          <G>
            <Rect x={448} y={129} width={54} height={38} rx={2} fill="#ffffff" stroke={ink} strokeWidth={1.2} />
            <Circle cx={475} cy={148} r={11} fill="none" stroke={ink} strokeWidth={1} />
            <Line x1={475} y1={137} x2={475} y2={159} stroke={ink} strokeWidth={0.8} />
            <Line x1={464} y1={148} x2={486} y2={148} stroke={ink} strokeWidth={0.8} />
            <DeviceTag x={475} y={120} label="HVAC" />
            <SvgText x={475} y={179} textAnchor="middle" fontSize={5.5} fontFamily="Helvetica-Bold" fill={ink}>Temporary Cooling</SvgText>
            <SvgText x={475} y={187} textAnchor="middle" fontSize={4.8} fill={muted}>{`${results.coolingTons.toFixed(1)} tons / ${Math.round(results.coolingKw)} kW`}</SvgText>
          </G>
        )}

        <Line x1={250} y1={92} x2={250} y2={203} stroke={muted} strokeWidth={0.8} strokeDasharray="3 2" />
        <Line x1={250} y1={203} x2={448} y2={203} stroke={muted} strokeWidth={0.8} strokeDasharray="3 2" />
        <Rect x={448} y={193} width={54} height={20} rx={2} fill="#ffffff" stroke={ink} strokeWidth={1} strokeDasharray="3 2" />
        <SvgText x={475} y={205.5} textAnchor="middle" fontSize={5.5} fontFamily="Helvetica-Bold" fill={ink}>EMaaS SERVICE</SvgText>
        <SvgText x={250} y={218} textAnchor="middle" fontSize={4.6} fill={muted}>Dashed lines indicate control, telemetry, and service relationships.</SvgText>

        <SvgText x={12} y={231} fontSize={4.4} fill={muted}>
          Final conductor sizing, OCPD ratings, grounding, fault current, selective coordination, and equipment clearances require licensed engineering review.
        </SvgText>
      </Svg>
    </View>
  )
}
