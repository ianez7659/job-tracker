// Parent (top-level) categories. Child categories belong to one of these.
export const PARENT_CATEGORIES = [
  { id: "engineering_it", label: "Engineering / IT" },
  { id: "design_creative", label: "Design / Creative" },
  { id: "media_content", label: "Media / Content" },
  { id: "other", label: "Other" },
] as const;

export type ParentCategoryId = (typeof PARENT_CATEGORIES)[number]["id"];

// Child categories with parent reference. User stores only `value`.
export const USER_CATEGORIES = [
  // Engineering / IT
  { value: "frontend_developer", label: "Frontend Developer", parentId: "engineering_it" as const },
  { value: "backend_developer", label: "Backend Developer", parentId: "engineering_it" as const },
  { value: "full_stack_developer", label: "Full Stack Developer", parentId: "engineering_it" as const },
  { value: "mobile_developer", label: "Mobile Developer", parentId: "engineering_it" as const },
  { value: "game_developer", label: "Game Developer", parentId: "engineering_it" as const },
  { value: "data_engineer", label: "Data Engineer", parentId: "engineering_it" as const },
  { value: "devops_sre", label: "DevOps / SRE", parentId: "engineering_it" as const },
  // Design / Creative
  { value: "ux_ui_designer", label: "UX/UI Designer", parentId: "design_creative" as const },
  { value: "graphic_designer", label: "Graphic Designer", parentId: "design_creative" as const },
  // Media / Content
  { value: "content_writer", label: "Content Writer", parentId: "media_content" as const },
  { value: "social_media_manager", label: "Social Media Manager", parentId: "media_content" as const },
  // Other
  { value: "other", label: "Other", parentId: "other" as const },
] as const;

export const USER_CATEGORY_VALUES = USER_CATEGORIES.map((c) => c.value);
export type UserCategoryValue = (typeof USER_CATEGORY_VALUES)[number];

/** Get label for a stored category value */
export function getCategoryLabel(value: string | null | undefined): string {
  if (!value) return "Not set";
  const found = USER_CATEGORIES.find((c) => c.value === value);
  return found ? found.label : value;
}

/** Get parent id for a category value (for "show only my parent" filtering later) */
export function getParentIdForCategory(value: string | null | undefined): ParentCategoryId | null {
  if (!value) return null;
  const found = USER_CATEGORIES.find((c) => c.value === value);
  return found ? found.parentId : null;
}

/** Group child categories by parent for optgroup UI */
export function getCategoriesGroupedByParent(): { parentId: ParentCategoryId; label: string; options: { value: string; label: string }[] }[] {
  return PARENT_CATEGORIES.map((parent) => ({
    parentId: parent.id,
    label: parent.label,
    options: USER_CATEGORIES.filter((c) => c.parentId === parent.id).map((c) => ({ value: c.value, label: c.label })),
  }));
}
