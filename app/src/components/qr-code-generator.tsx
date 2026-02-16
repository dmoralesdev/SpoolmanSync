'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { SpoolFilterBar } from '@/components/dashboard/spool-filter-bar';
import { LabelSheetSettings } from '@/components/label-sheet-settings';
import { LabelSheetPreview } from '@/components/label-sheet-preview';
import { Printer, QrCode } from 'lucide-react';
import type { Spool } from '@/lib/api/spoolman';
import { buildSpoolSearchValue, parseExtraValue } from '@/lib/api/spoolman';
import {
  DEFAULT_CONFIG,
  buildLabelItems,
  paginateItems,
  type LabelSheetConfig,
  type SheetSettings,
  type ContentSettings,
  type LayoutSettings,
} from '@/lib/label-sheet-config';

interface QRCodeGeneratorProps {
  spools: Spool[];
  directAccessPort?: number;
}

interface FilterField {
  key: string;
  name: string;
  values: string[];
  builtIn: boolean;
}

function getSpoolFieldValue(spool: Spool, fieldKey: string): string | null {
  switch (fieldKey) {
    case 'material':
      return spool.filament.material || null;
    case 'vendor':
      return spool.filament.vendor?.name || null;
    case 'location':
      return spool.location || null;
    case 'lot_nr':
      return spool.lot_nr || null;
    default:
      if (fieldKey.startsWith('extra_')) {
        const extraKey = fieldKey.replace('extra_', '');
        return parseExtraValue(spool.extra?.[extraKey]) || null;
      }
      return null;
  }
}

export function QRCodeGenerator({ spools, directAccessPort }: QRCodeGeneratorProps) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [searchValue, setSearchValue] = useState('');
  const [filters, setFilters] = useState<Record<string, string | null>>({});
  const [enabledFields, setEnabledFields] = useState<FilterField[]>([]);
  const [config, setConfig] = useState<LabelSheetConfig>(DEFAULT_CONFIG);

  // Fetch filter fields on mount
  useEffect(() => {
    fetch('/api/spools/extra-fields')
      .then((res) => res.json())
      .then((data) => {
        if (data.fields && data.filterConfig) {
          const enabled = data.fields.filter(
            (f: FilterField) => data.filterConfig.includes(f.key)
          );
          setEnabledFields(enabled);
        }
      })
      .catch((err) => console.error('Failed to fetch filter fields:', err));
  }, []);

  // Filter spools based on active filters
  const filteredSpools = useMemo(() => {
    return spools.filter((spool) => {
      for (const [key, value] of Object.entries(filters)) {
        if (value) {
          const spoolValue = getSpoolFieldValue(spool, key);
          if (spoolValue !== value) return false;
        }
      }
      return true;
    });
  }, [spools, filters]);

  // Config updaters
  const updateSheet = useCallback((partial: Partial<SheetSettings>) => {
    setConfig((prev) => ({ ...prev, sheet: { ...prev.sheet, ...partial } }));
  }, []);

  const updateContent = useCallback((partial: Partial<ContentSettings>) => {
    setConfig((prev) => ({ ...prev, content: { ...prev.content, ...partial } }));
  }, []);

  const updateLayout = useCallback((partial: Partial<LayoutSettings>) => {
    setConfig((prev) => ({ ...prev, layout: { ...prev.layout, ...partial } }));
  }, []);

  // Build label items and pages
  const selectedSpools = useMemo(() => {
    return spools.filter((s) => selectedIds.has(s.id));
  }, [spools, selectedIds]);

  const labelItems = useMemo(() => {
    return buildLabelItems(selectedSpools, config, directAccessPort);
  }, [selectedSpools, config, directAccessPort]);

  const pages = useMemo(() => {
    return paginateItems(labelItems, config);
  }, [labelItems, config]);

  const totalLabels = labelItems.length;
  const totalPages = pages.length;

  // Toggle a spool's selection
  const toggleSpool = useCallback((spoolId: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(spoolId)) {
        next.delete(spoolId);
      } else {
        next.add(spoolId);
      }
      return next;
    });
  }, []);

  // Select/deselect all visible spools
  const selectAllVisible = useCallback(() => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const spool of filteredSpools) {
        next.add(spool.id);
      }
      return next;
    });
  }, [filteredSpools]);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      {enabledFields.length > 0 && (
        <SpoolFilterBar
          filters={filters}
          onFilterChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))}
          onClearAll={() => setFilters({})}
          fields={enabledFields}
        />
      )}

      {/* Spool Selector */}
      <div className="space-y-2">
        {/* Selection toolbar */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {selectedIds.size} selected
          </span>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={selectAllVisible}>
              Select All
            </Button>
            {selectedIds.size > 0 && (
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={deselectAll}>
                Deselect All
              </Button>
            )}
          </div>
        </div>

        <Command className="rounded-lg border">
          <CommandInput
            placeholder="Search spools by name, vendor, material, or ID..."
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList className="max-h-[200px]">
            <CommandEmpty>No spools found.</CommandEmpty>
            <CommandGroup heading={`${filteredSpools.length} spools`}>
              {filteredSpools.map((spool) => {
                const isSelected = selectedIds.has(spool.id);
                return (
                  <CommandItem
                    key={spool.id}
                    value={buildSpoolSearchValue(spool)}
                    onSelect={() => toggleSpool(spool.id)}
                    className="flex items-center gap-3 py-2 cursor-pointer"
                  >
                    <Checkbox
                      checked={isSelected}
                      className="flex-shrink-0"
                      tabIndex={-1}
                    />
                    <div
                      className="h-5 w-5 rounded-full border flex-shrink-0"
                      style={{ backgroundColor: `#${spool.filament.color_hex}` }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {spool.filament.name || spool.filament.material}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {spool.filament.vendor.name} • #{spool.id}
                      </p>
                    </div>
                    <Badge variant="secondary" className="flex-shrink-0">
                      {spool.filament.material}
                    </Badge>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </div>

      {/* Settings */}
      <div className="no-print">
        <LabelSheetSettings
          sheet={config.sheet}
          content={config.content}
          layout={config.layout}
          updateSheet={updateSheet}
          updateContent={updateContent}
          updateLayout={updateLayout}
        />
      </div>

      {/* Preview */}
      {selectedIds.size > 0 ? (
        <>
          <LabelSheetPreview pages={pages} config={config} />

          {/* Footer */}
          <div className="space-y-2 no-print">
            <div className="flex items-center gap-3">
              <Button onClick={handlePrint} className="flex-1">
                <Printer className="h-4 w-4 mr-2" />
                Print Labels
              </Button>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <div className="flex items-center justify-between">
                <span>{totalLabels} label{totalLabels !== 1 ? 's' : ''} on {totalPages} page{totalPages !== 1 ? 's' : ''}</span>
              </div>
              <p>Tip: In the browser print dialog, set margins to &quot;None&quot; and disable headers/footers for best results.</p>
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
          <QrCode className="h-12 w-12 mb-3 opacity-50" />
          <p className="text-sm">Select spools above to preview labels</p>
        </div>
      )}
    </div>
  );
}
