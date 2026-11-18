"use client";

/**
 * Astryx adapter seam. Feature code imports Astryx components from here only,
 * so any one of them can be swapped (for example for Radix) by changing this
 * file. Colours come from src/app/astryx-theme.css.
 */
export { Avatar } from "@astryxdesign/core/Avatar";
export { Badge } from "@astryxdesign/core/Badge";
export { Button } from "@astryxdesign/core/Button";
export { Dialog, DialogHeader } from "@astryxdesign/core/Dialog";
export { DropdownMenu } from "@astryxdesign/core/DropdownMenu";
export { EmptyState } from "@astryxdesign/core/EmptyState";
export { Tab, TabList } from "@astryxdesign/core/TabList";
export { Table, pixel, proportional } from "@astryxdesign/core/Table";
export type { TableColumn } from "@astryxdesign/core/Table";
