import { InputField } from './InputField'

export interface ReportContextFieldsProps {
  clientName: string
  projectName: string
  onClientNameChange: (value: string) => void
  onProjectNameChange: (value: string) => void
}

export function ReportContextFields({
  clientName,
  projectName,
  onClientNameChange,
  onProjectNameChange,
}: ReportContextFieldsProps) {
  return (
    <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
      <InputField
        label="Client / Account"
        type="text"
        value={clientName}
        onChange={onClientNameChange}
        placeholder="Data center campus"
        tooltip="Appears in exported EMaaS reports"
      />
      <InputField
        label="Project / Phase"
        type="text"
        value={projectName}
        onChange={onProjectNameChange}
        placeholder="Commissioning Block A"
        tooltip="Appears in exported EMaaS reports"
      />
    </div>
  )
}
