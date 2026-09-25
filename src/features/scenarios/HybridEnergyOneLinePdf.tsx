import { Circle, G, Line, Path, Rect, Svg, Text as SvgTextPrimitive, View } from '@react-pdf/renderer'
import type { ReactNode } from 'react'
import type { OneLineDiagram, OneLineNode } from './oneLineDiagram'

interface HybridEnergyOneLinePdfProps {
  diagram: OneLineDiagram
}

const ink = '#F9FAFB'
const muted = '#C5C6C7'
const copper = '#C27A2C'
const blue = '#ABE1FA'
const panel = '#141D26'
const panelAlt = '#1E2A38'

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
  return <SvgTextPrimitive x={x} y={y} textAnchor={textAnchor} style={{ fontSize, fontFamily, fill }}>{children}</SvgTextPrimitive>
}

function node(diagram: OneLineDiagram, id: string) {
  return diagram.stages.flatMap((stage) => stage.nodes).find((item) => item.id === id)
}

function short(value: string | undefined, max = 32) {
  if (!value) return ''
  return value.length > max ? `${value.slice(0, max - 1)}…` : value
}

function EquipmentBox({
  item,
  x,
  y,
  width,
  height,
  stroke = copper,
}: {
  item?: OneLineNode
  x: number
  y: number
  width: number
  height: number
  stroke?: string
}) {
  if (!item) return null
  const labelLimit = Math.max(12, Math.floor(width / 4))
  const detailLimit = Math.max(15, Math.floor(width / 3.1))
  const metaLimit = Math.max(18, Math.floor(width / 2.5))
  return (
    <G>
      <Rect x={x} y={y} width={width} height={height} rx={4} fill={panel} stroke={stroke} strokeWidth={1.2} />
      <SvgText x={x + width / 2} y={y + 14} textAnchor="middle" fontFamily="Helvetica-Bold" fontSize={5.4} fill={ink}>{short(item.label, labelLimit)}</SvgText>
      <SvgText x={x + width / 2} y={y + 27} textAnchor="middle" fontSize={4.4} fill={muted}>{short(item.detail, detailLimit)}</SvgText>
      {item.meta && <SvgText x={x + width / 2} y={y + 38} textAnchor="middle" fontSize={3.8} fill={muted}>{short(item.meta, metaLimit)}</SvgText>}
    </G>
  )
}

function Breaker({ item, x, y }: { item?: OneLineNode; x: number; y: number }) {
  if (!item) return null
  return (
    <G>
      <Rect x={x} y={y} width={36} height={32} rx={3} fill={panelAlt} stroke={muted} strokeWidth={1} />
      <Line x1={x + 9} y1={y + 21} x2={x + 25} y2={y + 11} stroke={ink} strokeWidth={1.4} />
      <Circle cx={x + 9} cy={y + 21} r={2} fill={ink} />
      <Circle cx={x + 25} cy={y + 11} r={2} fill={ink} />
      <SvgText x={x + 18} y={y + 29} textAnchor="middle" fontFamily="Helvetica-Bold" fontSize={4.4} fill={muted}>{item.id === 'GEN_CB' ? '52G' : '52B'}</SvgText>
    </G>
  )
}

function Transformer({ item, x, y }: { item?: OneLineNode; x: number; y: number }) {
  if (!item) return null
  return (
    <G>
      <Rect x={x} y={y} width={62} height={56} rx={4} fill={panelAlt} stroke={copper} strokeWidth={1.1} />
      <Path d={`M ${x + 19} ${y + 16} c 8 0 8 8 0 8 c 8 0 8 8 0 8 c 8 0 8 8 0 8`} stroke={ink} strokeWidth={1.1} fill="none" />
      <Path d={`M ${x + 43} ${y + 16} c -8 0 -8 8 0 8 c -8 0 -8 8 0 8 c -8 0 -8 8 0 8`} stroke={ink} strokeWidth={1.1} fill="none" />
      <SvgText x={x + 31} y={y + 49} textAnchor="middle" fontFamily="Helvetica-Bold" fontSize={5.2} fill={ink}>XFMR</SvgText>
    </G>
  )
}

export function HybridEnergyOneLinePdf({ diagram }: HybridEnergyOneLinePdfProps) {
  const gen = node(diagram, 'GEN')
  const bess = node(diagram, 'BESS')
  const genBreaker = node(diagram, 'GEN_CB')
  const bessBreaker = node(diagram, 'BESS_CB')
  const ems = node(diagram, 'EMS')
  const parallel = node(diagram, 'ATS')
  const switchgear = node(diagram, 'SWGR')
  const transformer = node(diagram, 'XFMR')
  const service = node(diagram, 'PANEL')
  const loads = diagram.stages.find((stage) => stage.label === 'Loads')?.nodes ?? []
  const hasTransformer = Boolean(transformer)
  const serviceX = hasTransformer ? 460 : 410
  const loadX = hasTransformer ? 545 : 510

  return (
    <View wrap={false} style={{ border: '1 solid #5B6673', borderRadius: 4, padding: 4, marginBottom: 6 }}>
      <Svg viewBox="0 0 640 260" style={{ width: '100%', height: 238 }}>
        <SvgText x={12} y={16} fontSize={9} fontFamily="Helvetica-Bold" fill={ink}>{diagram.title}</SvgText>
        <SvgText x={628} y={16} textAnchor="end" fontSize={5.1} fill={muted}>Calculated planning one-line · engineering verification required</SvgText>

        <SvgText x={50} y={35} textAnchor="middle" fontSize={5} fontFamily="Helvetica-Bold" fill={muted}>SOURCES</SvgText>
        <SvgText x={147} y={35} textAnchor="middle" fontSize={5} fontFamily="Helvetica-Bold" fill={muted}>PROTECTION</SvgText>
        <SvgText x={250} y={35} textAnchor="middle" fontSize={5} fontFamily="Helvetica-Bold" fill={muted}>CONTROL</SvgText>
        <SvgText x={350} y={35} textAnchor="middle" fontSize={5} fontFamily="Helvetica-Bold" fill={muted}>DISTRIBUTION</SvgText>
        {hasTransformer && <SvgText x={431} y={35} textAnchor="middle" fontSize={5} fontFamily="Helvetica-Bold" fill={muted}>TRANSFORM</SvgText>}
        <SvgText x={serviceX + 31} y={35} textAnchor="middle" fontSize={5} fontFamily="Helvetica-Bold" fill={muted}>SERVICE</SvgText>
        <SvgText x={loadX + 32} y={35} textAnchor="middle" fontSize={5} fontFamily="Helvetica-Bold" fill={muted}>LOADS</SvgText>

        <EquipmentBox item={gen} x={12} y={52} width={88} height={48} />
        <Circle cx={28} cy={76} r={10} fill="none" stroke={ink} strokeWidth={1.3} />
        <SvgText x={28} y={79} textAnchor="middle" fontFamily="Helvetica-Bold" fontSize={9} fill={ink}>G</SvgText>

        <EquipmentBox item={bess} x={12} y={154} width={88} height={48} stroke={blue} />
        <Rect x={20} y={169} width={20} height={14} rx={1} fill="none" stroke={ink} strokeWidth={1.1} />
        <Rect x={40} y={173} width={3} height={6} fill={ink} />
        <Line x1={25} y1={176} x2={29} y2={176} stroke={ink} strokeWidth={1} />
        <Line x1={27} y1={174} x2={27} y2={178} stroke={ink} strokeWidth={1} />

        <Line x1={100} y1={76} x2={122} y2={76} stroke={ink} strokeWidth={1.6} />
        <Line x1={100} y1={178} x2={122} y2={178} stroke={ink} strokeWidth={1.6} />
        <Breaker item={genBreaker} x={122} y={60} />
        <Breaker item={bessBreaker} x={122} y={162} />

        <Line x1={158} y1={76} x2={190} y2={76} stroke={ink} strokeWidth={1.6} />
        <Line x1={158} y1={178} x2={190} y2={178} stroke={ink} strokeWidth={1.6} />
        <Line x1={190} y1={76} x2={190} y2={178} stroke={ink} strokeWidth={1.6} />
        <Line x1={190} y1={127} x2={210} y2={127} stroke={ink} strokeWidth={1.6} />

        <EquipmentBox item={parallel} x={210} y={103} width={78} height={48} stroke={copper} />
        <EquipmentBox item={ems} x={210} y={48} width={78} height={40} stroke={blue} />
        <Line x1={249} y1={88} x2={249} y2={103} stroke={blue} strokeWidth={1} strokeDasharray="4 3" />
        <Line x1={210} y1={67} x2={100} y2={67} stroke={blue} strokeWidth={0.9} strokeDasharray="4 3" />
        <Line x1={210} y1={75} x2={100} y2={175} stroke={blue} strokeWidth={0.9} strokeDasharray="4 3" />

        <Line x1={288} y1={127} x2={310} y2={127} stroke={ink} strokeWidth={1.8} />
        <EquipmentBox item={switchgear} x={310} y={103} width={80} height={48} stroke={muted} />

        {hasTransformer ? (
          <>
            <Line x1={390} y1={127} x2={397} y2={127} stroke={ink} strokeWidth={1.8} />
            <Transformer item={transformer} x={397} y={99} />
            <Line x1={459} y1={127} x2={460} y2={127} stroke={ink} strokeWidth={1.8} />
          </>
        ) : <Line x1={390} y1={127} x2={410} y2={127} stroke={ink} strokeWidth={1.8} />}

        <EquipmentBox item={service} x={serviceX} y={103} width={80} height={48} stroke={muted} />
        <Line x1={serviceX + 80} y1={127} x2={loadX} y2={127} stroke={ink} strokeWidth={1.8} />
        <Rect x={loadX} y={82} width={115} height={90} rx={4} fill={panel} stroke={copper} strokeWidth={1.1} />
        <SvgText x={loadX + 57.5} y={96} textAnchor="middle" fontFamily="Helvetica-Bold" fontSize={5.4} fill={ink}>CUSTOMER LOADS</SvgText>
        {(loads.length ? loads.slice(0, 5) : [{ label: 'Protected Load Bus', detail: 'Branch schedule by customer' }]).map((load, index) => (
          <G key={`${load.label}-${index}`}>
            <Line x1={loadX + 9} y1={108 + index * 12} x2={loadX + 17} y2={108 + index * 12} stroke={ink} strokeWidth={1} />
            <SvgText x={loadX + 20} y={110 + index * 12} fontSize={4.5} fill={muted}>{short(load.label, 28)}</SvgText>
          </G>
        ))}

        <Line x1={12} y1={221} x2={628} y2={221} stroke="#5B6673" strokeWidth={0.6} />
        <SvgText x={12} y={234} fontSize={4.7} fill={muted}>Solid lines: power path · Dashed blue lines: DEIF/EMS control and telemetry · Device 52: circuit breaker · XFMR: transformer</SvgText>
        <SvgText x={12} y={246} fontSize={4.7} fill={muted}>Final conductor ampacity, OCPD, grounding, fault current, protection settings, selective coordination, and equipment availability require field and engineering verification.</SvgText>
      </Svg>
    </View>
  )
}
