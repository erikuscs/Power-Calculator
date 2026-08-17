/* eslint-disable react-refresh/only-export-components */
import { lazy, type ReactNode } from 'react'

const DashboardPage = lazy(() => import('./features/dashboard/DashboardPage'))
const BessRuntimePage = lazy(() => import('./features/bess/BessRuntimePage'))
const BessSizingPage = lazy(() => import('./features/bess/BessSizingPage'))
const BessRoiPage = lazy(() => import('./features/bess/BessRoiPage'))
const PowerDashboard = lazy(() => import('./features/power/PowerDashboard'))
const GeneralPowerPage = lazy(() => import('./features/power/GeneralPowerPage'))
const AmperesPage = lazy(() => import('./features/power/AmperesPage'))
const KwKvaPage = lazy(() => import('./features/power/KwKvaPage'))
const KwHpPage = lazy(() => import('./features/power/KwHpPage'))
const KwAmpPage = lazy(() => import('./features/power/KwAmpPage'))
const GeneratorPowerPage = lazy(() => import('./features/power/GeneratorPowerPage'))
const UpsPowerPage = lazy(() => import('./features/power/UpsPowerPage'))
const FuelConsumptionPage = lazy(() => import('./features/power/FuelConsumptionPage'))
const LumensWattsPage = lazy(() => import('./features/power/LumensWattsPage'))
const KvaAmpsPage = lazy(() => import('./features/power/KvaAmpsPage'))
const HvacDashboard = lazy(() => import('./features/hvac/HvacDashboard'))
const CoolingPage = lazy(() => import('./features/hvac/CoolingPage'))
const ChillerPage = lazy(() => import('./features/hvac/ChillerPage'))
const PsychrometricsPage = lazy(() => import('./features/hvac/PsychrometricsPage'))
const TempPowerWizard = lazy(() => import('./features/scenarios/TempPowerWizard'))
const HybridEnergyWizard = lazy(() => import('./features/scenarios/HybridEnergyWizard'))
const BessProjectWizard = lazy(() => import('./features/scenarios/BessProjectWizard'))
const HvacAssessmentWizard = lazy(() => import('./features/scenarios/HvacAssessmentWizard'))
const PrivacyPage = lazy(() => import('./features/legal/PrivacyPage'))

interface AppRoute {
  path: string
  element: ReactNode
  label?: string
  group?: string
}

export const routes: AppRoute[] = [
  { path: '/', element: <DashboardPage />, label: 'Dashboard' },
  { path: '/bess/runtime', element: <BessRuntimePage />, label: 'BESS Runtime', group: 'BESS' },
  { path: '/bess/sizing', element: <BessSizingPage />, label: 'Multi-Unit Sizing', group: 'BESS' },
  { path: '/bess/roi', element: <BessRoiPage />, label: 'Revenue / ROI', group: 'BESS' },
  { path: '/power', element: <PowerDashboard />, label: 'EMaaS Electrical Tools', group: 'Power' },
  { path: '/power/general', element: <GeneralPowerPage />, label: 'General Power', group: 'Power' },
  { path: '/power/amperes', element: <AmperesPage />, label: 'Amperes', group: 'Power' },
  { path: '/power/kw-kva', element: <KwKvaPage />, label: 'kW ↔ kVA', group: 'Power' },
  { path: '/power/kw-hp', element: <KwHpPage />, label: 'kW ↔ HP', group: 'Power' },
  { path: '/power/kw-amp', element: <KwAmpPage />, label: 'kW ↔ Amps', group: 'Power' },
  { path: '/power/generator', element: <GeneratorPowerPage />, label: 'Generator Power', group: 'Power' },
  { path: '/power/ups', element: <UpsPowerPage />, label: 'UPS Power', group: 'Power' },
  { path: '/power/fuel', element: <FuelConsumptionPage />, label: 'Fuel Consumption', group: 'Power' },
  { path: '/power/lumens', element: <LumensWattsPage />, label: 'Lumens & Watts', group: 'Power' },
  { path: '/power/kva-amps', element: <KvaAmpsPage />, label: 'kVA → Amps', group: 'Power' },
  { path: '/hvac', element: <HvacDashboard />, label: 'HVAC Calculators', group: 'HVAC' },
  { path: '/hvac/cooling', element: <CoolingPage />, label: 'Cooling Load', group: 'HVAC' },
  { path: '/hvac/chiller', element: <ChillerPage />, label: 'Chiller Sizing', group: 'HVAC' },
  { path: '/hvac/psychrometrics', element: <PsychrometricsPage />, label: 'Psychrometrics', group: 'HVAC' },
  { path: '/scenarios/temp-power', element: <TempPowerWizard />, label: 'Temp Power & Cooling', group: 'EMaaS Workflows' },
  { path: '/scenarios/hybrid-energy', element: <HybridEnergyWizard />, label: 'Hybrid EMaaS Strategy', group: 'EMaaS Workflows' },
  { path: '/scenarios/bess-project', element: <BessProjectWizard />, label: 'BESS Project Economics', group: 'EMaaS Workflows' },
  { path: '/scenarios/hvac-assessment', element: <HvacAssessmentWizard />, label: 'Cooling Load Strategy', group: 'EMaaS Workflows' },
  { path: '/privacy', element: <PrivacyPage /> },
]
