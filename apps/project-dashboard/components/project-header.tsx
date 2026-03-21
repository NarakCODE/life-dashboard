"use client"

import { Button } from "@/components/ui/button"
import { Link as LinkIcon, Plus } from "@phosphor-icons/react/dist/ssr"
import { FilterPopover } from "@/components/filter-popover"
import { ChipOverflow } from "@/components/chip-overflow"
import { ViewOptionsPopover } from "@/components/view-options-popover"
import { PageHeader, PageToolbar, AiButton } from "@/components/page-layout"
import type { FilterCounts } from "@/lib/data/projects"
import type { FilterChip, ViewOptions } from "@/lib/view-options"

interface ProjectHeaderProps {
  filters: FilterChip[]
  onRemoveFilter: (key: string, value: string) => void
  onFiltersChange: (chips: FilterChip[]) => void
  counts?: FilterCounts
  viewOptions: ViewOptions
  onViewOptionsChange: (options: ViewOptions) => void
  onAddProject?: () => void
}

export function ProjectHeader({
  filters,
  onRemoveFilter,
  onFiltersChange,
  counts,
  viewOptions,
  onViewOptionsChange,
  onAddProject,
}: ProjectHeaderProps) {
  return (
    <PageHeader
      title="Projects"
      actions={
        <>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
            <LinkIcon className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onAddProject}>
            <Plus className="h-4 w-4" weight="bold" />
            Add Project
          </Button>
        </>
      }
      toolbar={
        <PageToolbar
          left={
            <>
              <FilterPopover
                initialChips={filters}
                onApply={onFiltersChange}
                onClear={() => onFiltersChange([])}
                counts={counts}
              />
              <ChipOverflow chips={filters} onRemove={onRemoveFilter} maxVisible={6} />
            </>
          }
          right={
            <>
              <ViewOptionsPopover options={viewOptions} onChange={onViewOptionsChange} />
              <AiButton />
            </>
          }
        />
      }
    />
  )
}
