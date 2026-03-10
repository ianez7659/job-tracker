import {
  getCategoryLabel,
  getParentIdForCategory,
  getCategoriesGroupedByParent,
  USER_CATEGORY_VALUES,
} from "./categories";

describe("getCategoryLabel", () => {
  it("returns 'Not set' for null or undefined", () => {
    expect(getCategoryLabel(null)).toBe("Not set");
    expect(getCategoryLabel(undefined)).toBe("Not set");
  });

  it("returns the label for a known category value", () => {
    expect(getCategoryLabel("frontend_developer")).toBe("Frontend Developer");
    expect(getCategoryLabel("ux_ui_designer")).toBe("UX/UI Designer");
    expect(getCategoryLabel("other")).toBe("Other");
  });

  it("returns the raw value for an unknown category", () => {
    expect(getCategoryLabel("unknown_value")).toBe("unknown_value");
  });
});

describe("getParentIdForCategory", () => {
  it("returns null for null or undefined", () => {
    expect(getParentIdForCategory(null)).toBeNull();
    expect(getParentIdForCategory(undefined)).toBeNull();
  });

  it("returns parentId for a known category", () => {
    expect(getParentIdForCategory("frontend_developer")).toBe("engineering_it");
    expect(getParentIdForCategory("ux_ui_designer")).toBe("design_creative");
    expect(getParentIdForCategory("other")).toBe("other");
  });

  it("returns null for an unknown category value", () => {
    expect(getParentIdForCategory("unknown")).toBeNull();
  });
});

describe("getCategoriesGroupedByParent", () => {
  it("returns one group per parent category", () => {
    const result = getCategoriesGroupedByParent();
    expect(result).toHaveLength(4);
    expect(result.map((g) => g.parentId)).toEqual([
      "engineering_it",
      "design_creative",
      "media_content",
      "other",
    ]);
  });

  it("each group has label and options array", () => {
    const result = getCategoriesGroupedByParent();
    result.forEach((group) => {
      expect(group).toHaveProperty("parentId");
      expect(group).toHaveProperty("label");
      expect(Array.isArray(group.options)).toBe(true);
      group.options.forEach((opt) => {
        expect(opt).toHaveProperty("value");
        expect(opt).toHaveProperty("label");
      });
    });
  });

  it("engineering_it group contains frontend_developer", () => {
    const result = getCategoriesGroupedByParent();
    const engineering = result.find((g) => g.parentId === "engineering_it");
    expect(engineering).toBeDefined();
    const frontend = engineering!.options.find((o) => o.value === "frontend_developer");
    expect(frontend?.label).toBe("Frontend Developer");
  });
});

describe("USER_CATEGORY_VALUES", () => {
  it("includes expected category values", () => {
    expect(USER_CATEGORY_VALUES).toContain("frontend_developer");
    expect(USER_CATEGORY_VALUES).toContain("other");
    expect(USER_CATEGORY_VALUES.length).toBeGreaterThan(0);
  });
});
