'use client';

import { useState, type ReactNode } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronDown } from 'lucide-react';
import type { SheetSettings, ContentSettings, LayoutSettings } from '@/lib/label-sheet-config';
import { PAPER_SIZES } from '@/lib/label-sheet-config';

interface LabelSheetSettingsProps {
  sheet: SheetSettings;
  content: ContentSettings;
  layout: LayoutSettings;
  updateSheet: (partial: Partial<SheetSettings>) => void;
  updateContent: (partial: Partial<ContentSettings>) => void;
  updateLayout: (partial: Partial<LayoutSettings>) => void;
}

function CollapsibleSection({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium bg-muted/50 hover:bg-muted transition-colors"
      >
        {title}
        <ChevronDown
          className="h-4 w-4 transition-transform"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>
      {open && (
        <div className="px-3 py-3 space-y-3">
          {children}
        </div>
      )}
    </div>
  );
}

function NumberInput({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <div className="flex items-center gap-1">
        <Input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            if (!isNaN(v)) onChange(Math.max(min, Math.min(max, v)));
          }}
          className="h-8 text-xs"
        />
        {suffix && <span className="text-xs text-muted-foreground whitespace-nowrap">{suffix}</span>}
      </div>
    </div>
  );
}

export function LabelSheetSettings({
  sheet,
  content,
  layout,
  updateSheet,
  updateContent,
  updateLayout,
}: LabelSheetSettingsProps) {
  return (
    <div className="space-y-2">
      {/* Print Settings */}
      <CollapsibleSection title="Print Settings" defaultOpen>
        <div className="grid grid-cols-2 gap-3">
          {/* Paper Size */}
          <div className="space-y-1">
            <Label className="text-xs">Paper Size</Label>
            <Select
              value={sheet.paperSize}
              onValueChange={(v) => updateSheet({ paperSize: v })}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PAPER_SIZES).map(([key, ps]) => (
                  <SelectItem key={key} value={key}>{ps.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Border */}
          <div className="space-y-1">
            <Label className="text-xs">Borders</Label>
            <Tabs value={sheet.borderMode} onValueChange={(v) => updateSheet({ borderMode: v as SheetSettings['borderMode'] })}>
              <TabsList className="h-8 w-full">
                <TabsTrigger value="none" className="text-xs px-2">None</TabsTrigger>
                <TabsTrigger value="border" className="text-xs px-2">Border</TabsTrigger>
                <TabsTrigger value="grid" className="text-xs px-2">Grid</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Custom size inputs */}
        {sheet.paperSize === 'custom' && (
          <div className="grid grid-cols-2 gap-3">
            <NumberInput label="Width" value={sheet.customWidthMm} onChange={(v) => updateSheet({ customWidthMm: v })} min={10} max={500} step={0.1} suffix="mm" />
            <NumberInput label="Height" value={sheet.customHeightMm} onChange={(v) => updateSheet({ customHeightMm: v })} min={10} max={500} step={0.1} suffix="mm" />
          </div>
        )}

        <div className="grid grid-cols-4 gap-3">
          <NumberInput label="Columns" value={sheet.columns} onChange={(v) => updateSheet({ columns: v })} min={1} max={10} />
          <NumberInput label="Rows" value={sheet.rows} onChange={(v) => updateSheet({ rows: v })} min={1} max={15} />
          <NumberInput label="Skip" value={sheet.skipItems} onChange={(v) => updateSheet({ skipItems: v })} min={0} max={99} />
          <NumberInput label="Copies" value={sheet.itemCopies} onChange={(v) => updateSheet({ itemCopies: v })} min={1} max={10} />
        </div>
      </CollapsibleSection>

      {/* Content Settings */}
      <CollapsibleSection title="Content Settings">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">QR Code</Label>
            <Tabs value={content.qrMode} onValueChange={(v) => updateContent({ qrMode: v as ContentSettings['qrMode'] })}>
              <TabsList className="h-8 w-full">
                <TabsTrigger value="none" className="text-xs px-2">No</TabsTrigger>
                <TabsTrigger value="simple" className="text-xs px-2">Simple</TabsTrigger>
                <TabsTrigger value="icon" className="text-xs px-2">Icon</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <NumberInput
            label="Text Size"
            value={content.labelTextSizeMm}
            onChange={(v) => updateContent({ labelTextSizeMm: v })}
            min={1}
            max={10}
            step={0.5}
            suffix="mm"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="showLabel"
              checked={content.showLabel}
              onCheckedChange={(c) => updateContent({ showLabel: !!c })}
            />
            <label htmlFor="showLabel" className="text-xs">Print Label Text</label>
          </div>

          {content.showLabel && (
            <div className="grid grid-cols-3 gap-2 ml-6">
              <div className="flex items-center space-x-2">
                <Checkbox id="lsVendor" checked={content.showVendor} onCheckedChange={(c) => updateContent({ showVendor: !!c })} />
                <label htmlFor="lsVendor" className="text-xs">Vendor</label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="lsName" checked={content.showName} onCheckedChange={(c) => updateContent({ showName: !!c })} />
                <label htmlFor="lsName" className="text-xs">Name</label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="lsMaterial" checked={content.showMaterial} onCheckedChange={(c) => updateContent({ showMaterial: !!c })} />
                <label htmlFor="lsMaterial" className="text-xs">Material</label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="lsColor" checked={content.showColor} onCheckedChange={(c) => updateContent({ showColor: !!c })} />
                <label htmlFor="lsColor" className="text-xs">Color Dot</label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="lsId" checked={content.showSpoolId} onCheckedChange={(c) => updateContent({ showSpoolId: !!c })} />
                <label htmlFor="lsId" className="text-xs">Spool ID</label>
              </div>
            </div>
          )}
        </div>
      </CollapsibleSection>

      {/* Layout Settings */}
      <CollapsibleSection title="Layout Settings">
        <div className="space-y-2">
          <Label className="text-xs font-medium">Margins (mm)</Label>
          <div className="grid grid-cols-4 gap-2">
            <NumberInput label="Left" value={layout.marginLeftMm} onChange={(v) => updateLayout({ marginLeftMm: v })} min={0} max={50} step={0.5} />
            <NumberInput label="Top" value={layout.marginTopMm} onChange={(v) => updateLayout({ marginTopMm: v })} min={0} max={50} step={0.5} />
            <NumberInput label="Right" value={layout.marginRightMm} onChange={(v) => updateLayout({ marginRightMm: v })} min={0} max={50} step={0.5} />
            <NumberInput label="Bottom" value={layout.marginBottomMm} onChange={(v) => updateLayout({ marginBottomMm: v })} min={0} max={50} step={0.5} />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-medium">Safe Zones (mm)</Label>
          <div className="grid grid-cols-4 gap-2">
            <NumberInput label="Left" value={layout.safeZoneLeftMm} onChange={(v) => updateLayout({ safeZoneLeftMm: v })} min={0} max={20} step={0.5} />
            <NumberInput label="Top" value={layout.safeZoneTopMm} onChange={(v) => updateLayout({ safeZoneTopMm: v })} min={0} max={20} step={0.5} />
            <NumberInput label="Right" value={layout.safeZoneRightMm} onChange={(v) => updateLayout({ safeZoneRightMm: v })} min={0} max={20} step={0.5} />
            <NumberInput label="Bottom" value={layout.safeZoneBottomMm} onChange={(v) => updateLayout({ safeZoneBottomMm: v })} min={0} max={20} step={0.5} />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-medium">Spacing (mm)</Label>
          <div className="grid grid-cols-2 gap-2">
            <NumberInput label="Horizontal" value={layout.spacingHorizontalMm} onChange={(v) => updateLayout({ spacingHorizontalMm: v })} min={0} max={20} step={0.5} />
            <NumberInput label="Vertical" value={layout.spacingVerticalMm} onChange={(v) => updateLayout({ spacingVerticalMm: v })} min={0} max={20} step={0.5} />
          </div>
        </div>
      </CollapsibleSection>
    </div>
  );
}
