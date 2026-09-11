export type TrailerLoadBasis = 'published-service' | 'planning-estimate'

export interface JobsiteTrailerPreset {
  id: string
  manufacturer: string
  model: string
  dimensions: string
  planningKw: number
  voltage: string
  loadBasis: TrailerLoadBasis
  basis: string
  sourceLabel: string
  sourceUrl: string
}

export const JOBSITE_TRAILER_PRESETS: JobsiteTrailerPreset[] = [
  {
    id: 'mobile-modular-2161-8x20',
    manufacturer: 'Mobile Modular',
    model: 'WMS Office, Model 2161',
    dimensions: `8' x 20'`,
    planningKw: 0,
    voltage: '110 V, single-phase',
    loadBasis: 'published-service',
    basis: `Mobile Modular publishes typical electrical service information for this size. No operating load is inferred from the service rating.`,
    sourceLabel: 'Mobile Modular electrical FAQ',
    sourceUrl: 'https://www.mobilemodular.com/resources/frequently-asked-questions',
  },
  {
    id: 'mobile-modular-jobsite-12x60',
    manufacturer: 'Mobile Modular',
    model: 'Jobsite Building with Restroom',
    dimensions: `12' x 60'`,
    planningKw: 0,
    voltage: '220 V, single-phase',
    loadBasis: 'published-service',
    basis: `Mobile Modular publishes panel and service information for this model. No operating load is inferred from the panel rating.`,
    sourceLabel: 'Mobile Modular jobsite building guide',
    sourceUrl: 'https://www.mobilemodular.com/Content/Documents/ProductGuides/California/California_HCD_Jobsite_Buildings.pdf',
  },
  {
    id: 'mobile-modular-office-10x44',
    manufacturer: 'Mobile Modular',
    model: 'Wide Office Trailer',
    dimensions: `10' x 44'`,
    planningKw: 0,
    voltage: '220 V, single-phase',
    loadBasis: 'published-service',
    basis: `Mobile Modular publishes typical electrical service information for this size. No operating load is inferred from the service rating.`,
    sourceLabel: 'Mobile Modular electrical FAQ',
    sourceUrl: 'https://www.mobilemodular.com/resources/frequently-asked-questions',
  },
  {
    id: 'satellite-glo-8x20',
    manufacturer: 'Satellite Shelters',
    model: 'Ground-Level Office',
    dimensions: `8' x 20'`,
    planningKw: 0,
    voltage: '120/240 V, single-phase',
    loadBasis: 'planning-estimate',
    basis: 'Published model context only. Enter the operating load from the delivered-unit submittal, HVAC, heat, appliance, and plug-load information.',
    sourceLabel: 'Satellite Shelters product and electrical overview',
    sourceUrl: 'https://www.satelliteco.com/products/ground-level-offices/',
  },
  {
    id: 'satellite-glo-8x40',
    manufacturer: 'Satellite Shelters',
    model: 'Ground-Level Office',
    dimensions: `8' x 40'`,
    planningKw: 0,
    voltage: '120/240 V, single-phase',
    loadBasis: 'planning-estimate',
    basis: 'Published model context only. Enter the operating load from the delivered-unit submittal, HVAC, heat, appliance, and plug-load information.',
    sourceLabel: 'Satellite Shelters product and electrical overview',
    sourceUrl: 'https://www.satelliteco.com/products/ground-level-offices/',
  },
  {
    id: 'satellite-mobile-office-10x40',
    manufacturer: 'Satellite Shelters',
    model: 'Standard Mobile Office',
    dimensions: `10' x 40'`,
    planningKw: 0,
    voltage: '120/240 V, single-phase',
    loadBasis: 'planning-estimate',
    basis: 'Published model context only. Enter the operating load from the delivered-unit submittal and equipment nameplates.',
    sourceLabel: 'Satellite Shelters electrical specifications',
    sourceUrl: 'https://www.satelliteco.com/blog/questions-answered-by-satellite-shelters-sales-representatives/',
  },
  {
    id: 'willscot-mobile-office-8x20',
    manufacturer: 'WillScot',
    model: 'Mobile Office',
    dimensions: `8' x 20'`,
    planningKw: 0,
    voltage: 'Verify delivered unit',
    loadBasis: 'planning-estimate',
    basis: 'Published model context only. Enter the operating load from the delivered-unit submittal and equipment nameplates.',
    sourceLabel: 'WillScot mobile office range',
    sourceUrl: 'https://www.willscot.com/en/work-collaborate/mobile-offices',
  },
  {
    id: 'willscot-mobile-office-8x24',
    manufacturer: 'WillScot',
    model: 'Mobile Office',
    dimensions: `8' x 24'`,
    planningKw: 0,
    voltage: 'Verify delivered unit',
    loadBasis: 'planning-estimate',
    basis: 'Published model context only. Enter the operating load from the delivered-unit submittal and equipment nameplates.',
    sourceLabel: 'WillScot mobile office range',
    sourceUrl: 'https://www.willscot.com/en/work-collaborate/mobile-offices',
  },
  {
    id: 'willscot-mobile-office-10x48',
    manufacturer: 'WillScot',
    model: 'Mobile Office with Restroom',
    dimensions: `10' x 48'`,
    planningKw: 0,
    voltage: 'Verify delivered unit',
    loadBasis: 'planning-estimate',
    basis: 'Published model context only. Enter the operating load from the delivered-unit submittal and equipment nameplates.',
    sourceLabel: 'WillScot mobile office range',
    sourceUrl: 'https://www.willscot.com/en/work-collaborate/mobile-offices',
  },
]

export function trailerPresetLabel(preset: JobsiteTrailerPreset) {
  return `${preset.manufacturer} - ${preset.dimensions} ${preset.model}`
}
