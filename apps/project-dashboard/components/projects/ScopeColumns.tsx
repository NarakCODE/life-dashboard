import type { ProjectScope } from "@/lib/data/project-details"

type ScopeColumnsProps = {
  scope: ProjectScope
}

export function ScopeColumns({ scope }: ScopeColumnsProps) {
  return (
    <section>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="group rounded-xl border bg-card/50 p-5 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
          <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
            In Scope
          </h2>
          <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
            {scope.inScope.map((item, idx) => (
              <li key={idx} className="hover:text-foreground transition-colors">{item}</li>
            ))}
          </ul>
        </div>

        <div className="group rounded-xl border bg-card/50 p-5 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
          <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-destructive/60"></span>
            Out of Scope
          </h2>
          <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
            {scope.outOfScope.map((item, idx) => (
              <li key={idx} className="hover:text-foreground transition-colors">{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
