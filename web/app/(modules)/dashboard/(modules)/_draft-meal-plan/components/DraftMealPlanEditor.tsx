'use client';

import { Button, buttonVariants } from '@/app/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card';
import { ChevronDown, ChevronUp, Download, Trash2 } from 'lucide-react';
import {
  IDraftOptions,
  IDraftSources,
  IResolvedDraft,
} from '@/app/(modules)/dashboard/(modules)/_draft-meal-plan/interfaces';
import {
  TDraftLine,
  TStoredDraft,
} from '@/app/(modules)/dashboard/(modules)/_draft-meal-plan/validations';
import {
  draftNutrition,
  isDraftSettled,
} from '@/app/(modules)/dashboard/(modules)/_draft-meal-plan/helpers';
import { useEffect, useState } from 'react';

import { DRAFT_STORAGE_VERSION } from '@/app/(modules)/dashboard/(modules)/_draft-meal-plan/constants';
import DeleteDialog from '@/app/components/DeleteDialog';
import DraftCalorieTarget from '@/app/(modules)/dashboard/(modules)/_draft-meal-plan/components/DraftCalorieTarget';
import DraftLinesEditor from '@/app/(modules)/dashboard/(modules)/_draft-meal-plan/components/DraftLinesEditor';
import { interpolate } from '@/app/utils/helpers';
import { useDictionary } from '@/app/providers/dictionary-provider';
import { useSettledValue } from '@/app/hooks/use-settled-value';

interface IProps {
  /** Read once, when the editor mounts; from then on the editor owns the draft. */
  initial: IResolvedDraft;
  options: IDraftOptions;
  sources: IDraftSources;
  profileHref: string;
  onSave: (draft: TStoredDraft) => void;
  onClear: () => void;
  onOpenLoad: () => void;
}

const DraftMealPlanEditor = ({
  initial,
  options,
  sources,
  profileHref,
  onSave,
  onClear,
  onOpenLoad,
}: IProps) => {
  const { draftMealPlan: labels, resourceTable } = useDictionary();

  const [removed] = useState(initial.removed);
  const [collapsed, setCollapsed] = useState(initial.draft.collapsed);
  // Kept here too, so collapsing (which unmounts the lines) loses nothing.
  const [lines, setLines] = useState<TDraftLine[]>(initial.draft.lines);

  // While a new pick loads, the target compares the total from before it.
  const kcal = useSettledValue(
    draftNutrition(lines, sources).calories,
    isDraftSettled(lines, sources),
  );

  // Every change is saved as is. The first run also writes back a draft
  // whose missing items were just dropped.
  useEffect(() => {
    onSave({ version: DRAFT_STORAGE_VERSION, collapsed, lines });
  }, [collapsed, lines, onSave]);

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div className="space-y-1.5">
          <CardTitle>{labels.title}</CardTitle>
          <CardDescription>{labels.description}</CardDescription>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button type="button" variant="outline" onClick={onOpenLoad}>
            <Download aria-hidden />
            <span className="sr-only sm:not-sr-only">{labels.load.button}</span>
          </Button>
          <DeleteDialog
            title={labels.clear}
            subtitle={labels.clearConfirm}
            triggerLabel={
              <>
                <Trash2 />
                <span className="sr-only sm:not-sr-only">{labels.clear}</span>
              </>
            }
            triggerClassName={buttonVariants({ variant: 'outline' })}
            cancelLabel={resourceTable.cancel}
            confirmLabel={labels.clear}
            onConfirm={onClear}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-expanded={!collapsed}
            aria-label={collapsed ? labels.expand : labels.collapse}
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronDown /> : <ChevronUp />}
          </Button>
        </div>
      </CardHeader>

      {!collapsed && (
        <CardContent className="space-y-6">
          {removed > 0 && (
            <p className="text-sm text-muted-foreground">
              {interpolate(labels.removed, { count: removed })}
            </p>
          )}

          <DraftLinesEditor
            initial={lines}
            options={options}
            sources={sources}
            label={labels.title}
            onChange={setLines}
          />

          <DraftCalorieTarget kcal={kcal ?? 0} profileHref={profileHref} />
        </CardContent>
      )}
    </Card>
  );
};

export default DraftMealPlanEditor;
