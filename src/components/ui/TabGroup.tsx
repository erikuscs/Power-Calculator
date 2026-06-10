interface TabGroupProps {
  tabs: { id: string; label: string }[]
  activeTab: string
  onChange: (id: string) => void
}

export function TabGroup({ tabs, activeTab, onChange }: TabGroupProps) {
  return (
    <div className="flex border-b border-sg-600/30 mb-5">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeTab === tab.id
              ? 'border-accent-500 text-accent-300'
              : 'border-transparent text-text-dim hover:text-text-muted hover:border-sg-500'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
