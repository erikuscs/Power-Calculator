import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="max-w-md mx-auto text-center py-16 space-y-4">
      <p className="text-[10px] font-bold text-accent-500 uppercase tracking-[0.15em]">404</p>
      <h1 className="text-2xl font-bold text-text tracking-tight">Page not found</h1>
      <p className="text-sm text-text-muted leading-relaxed">
        That page doesn&apos;t exist. Head back to the calculators to keep working.
      </p>
      <Link
        to="/"
        className="inline-block mt-2 px-5 py-2.5 rounded-lg bg-accent-500 text-sg-900 font-bold text-sm hover:bg-accent-400 transition-colors no-underline"
      >
        Back to Dashboard
      </Link>
    </div>
  )
}
