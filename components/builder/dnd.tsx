"use client";

import type { ReactNode } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { GripVertical } from "lucide-react";

/**
 * Vertical sortable list built on @dnd-kit. Reports a drop as (activeId, overId)
 * so callers keep their own pure reorder functions — the same ones the visible
 * up/down buttons use, which stay as the accessible fallback.
 */
export function SortableList({ ids, onReorder, children }: {
  ids: string[];
  onReorder: (activeId: string, overId: string) => void;
  children: ReactNode;
}) {
  const sensors = useSensors(
    // Small activation distance so plain clicks (open/select) never start a drag.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const handleDragEnd = (event: DragEndEvent) => {
    const overId = event.over?.id;
    if (overId != null && event.active.id !== overId) onReorder(String(event.active.id), String(overId));
  };
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>{children}</SortableContext>
    </DndContext>
  );
}

/** Sortable wrapper: children is a render prop that receives the drag handle to place anywhere. */
export function SortableItem({ id, disabled, className, children }: {
  id: string;
  disabled?: boolean;
  className?: string;
  children: (handle: ReactNode) => ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled });
  const handle = disabled ? null : (
    <span
      {...attributes}
      {...listeners}
      aria-label="Arrastrar para reordenar"
      className="flex h-11 w-7 shrink-0 cursor-grab touch-none items-center justify-center rounded text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-[#8b5cf6] active:cursor-grabbing"
    >
      <GripVertical className="h-4 w-4" aria-hidden="true" />
    </span>
  );
  return (
    <div
      ref={setNodeRef}
      className={className}
      style={{
        transform: transform ? `translate3d(${Math.round(transform.x)}px, ${Math.round(transform.y)}px, 0)` : undefined,
        transition,
        opacity: isDragging ? 0.55 : undefined,
        position: isDragging ? "relative" : undefined,
        zIndex: isDragging ? 10 : undefined,
      }}
    >
      {children(handle)}
    </div>
  );
}
