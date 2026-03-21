# Lessons Learned

## Date: 2026-03-21

### Lesson: Dependency Update Strategy

**Context**: Updated 40 packages in `apps/project-dashboard` using a phased approach.

**Mistake/Risk Avoided**: 
- Could have updated all packages at once including major versions
- Major version updates (zod v4, recharts v3, sonner v2, etc.) could introduce breaking changes

**Root Cause**: 
- Major version updates often include API changes requiring code modifications
- Not all major updates are necessary if current versions work fine

**Preventative Rule**:
1. Use a phased approach: Patch/Minor first, Major later
2. Test build after each phase
3. Research changelogs before major version updates
4. Consider keeping major versions if no compelling reason to upgrade
5. Commit between phases for easy rollback

**Applied In**: `apps/project-dashboard` dependency updates - completed Phase 1 & 2, deferred Phase 3 & 4 major updates.

### Lesson: Consistency Layout with SidebarInset

**Context**: Found duplicated layout wrapper code `<div className={"flex flex-1 flex-col bg-background mx-2 my-2 border border-border rounded-lg min-w-0"}>` implemented across every `page` and major content component (e.g., `projects-content.tsx`, `performance-content.tsx`, etc.).

**Mistake/Risk Avoided**: 
- Code duplication and harder maintenance if we decide to change the global padding/border of the main content area.
- Breaking the single source of truth for app architecture by having every page manage its own outer layout container wrappers.

**Root Cause**: 
- Not utilizing the existing shared layout component correctly. Shadcn `SidebarInset` is already responsible for providing the main content area context and wrappers.
- The `ProtectedAppShell` was already wrapping all routes with `SidebarInset` but the individual pages were still wrapped with manually duplicated CSS.

**Preventative Rule**:
1. Do not recreate layout wrappers like page borders, margins, or backgrounds within individual pages.
2. Standardize all global layout constraints in `ProtectedAppShell` directly on the `SidebarInset` component.
3. Page components should start at the semantic level of routing content (e.g., `flex flex-col flex-1` inside the inset) without asserting outer spacing or border bounds.

**Applied In**: `apps/project-dashboard` components like `projects-content.tsx`, `clients-content.tsx`, `performance-content.tsx` and the dashboard `page.tsx` now rely on `ProtectedAppShell`'s injected `SidebarInset` layout class.
