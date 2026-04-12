// Parent (top-level) categories. Child categories belong to one of these.
export const PARENT_CATEGORIES = [
  { id: "tech", label: "Tech" },
  { id: "management", label: "Management" },
  { id: "marketing", label: "Marketing" },
  { id: "language_programmes", label: "Language Programmes" },
] as const;

export type ParentCategoryId = (typeof PARENT_CATEGORIES)[number]["id"];

// Child categories with parent reference. User stores only `value`.
export const USER_CATEGORIES = [
  // Tech
  { value: "cybersecurity", label: "Cybersecurity", parentId: "tech" as const },
  { value: "data_science", label: "Data Science", parentId: "tech" as const },
  {
    value: "network_systems_solutions",
    label: "Network Systems Solutions",
    parentId: "tech" as const,
  },
  { value: "ui_ux_design", label: "UI/UX Design", parentId: "tech" as const },
  { value: "web_development", label: "Web Development", parentId: "tech" as const },
  // Management
  { value: "customer_service", label: "Customer Service", parentId: "management" as const },
  {
    value: "international_business_management",
    label: "International Business Management",
    parentId: "management" as const,
  },
  {
    value: "hospitality_management",
    label: "Hospitality Management",
    parentId: "management" as const,
  },
  { value: "event_management", label: "Event Management", parentId: "management" as const },
  // Marketing
  { value: "digital_marketing", label: "Digital Marketing", parentId: "marketing" as const },
  {
    value: "strategic_digital_marketing",
    label: "Strategic Digital Marketing",
    parentId: "marketing" as const,
  },
  { value: "social_media", label: "Social Media", parentId: "marketing" as const },
  // Language Programmes
  { value: "esl", label: "ESL", parentId: "language_programmes" as const },
  { value: "celpip", label: "CELPIP", parentId: "language_programmes" as const },
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
