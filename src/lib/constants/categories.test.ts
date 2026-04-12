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
    expect(getCategoryLabel("web_development")).toBe("Web Development");
    expect(getCategoryLabel("digital_marketing")).toBe("Digital Marketing");
    expect(getCategoryLabel("esl")).toBe("ESL");
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
    expect(getParentIdForCategory("web_development")).toBe("tech");
    expect(getParentIdForCategory("digital_marketing")).toBe("marketing");
    expect(getParentIdForCategory("customer_service")).toBe("management");
    expect(getParentIdForCategory("celpip")).toBe("language_programmes");
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
      "tech",
      "management",
      "marketing",
      "language_programmes",
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

  it("tech group contains web_development", () => {
    const result = getCategoriesGroupedByParent();
    const tech = result.find((g) => g.parentId === "tech");
    expect(tech).toBeDefined();
    const web = tech!.options.find((o) => o.value === "web_development");
    expect(web?.label).toBe("Web Development");
  });

  it("language_programmes group contains esl and celpip", () => {
    const result = getCategoriesGroupedByParent();
    const lp = result.find((g) => g.parentId === "language_programmes");
    expect(lp?.options.map((o) => o.value)).toEqual(["esl", "celpip"]);
  });
});

describe("USER_CATEGORY_VALUES", () => {
  it("includes expected category values", () => {
    expect(USER_CATEGORY_VALUES).toContain("web_development");
    expect(USER_CATEGORY_VALUES).toContain("esl");
    expect(USER_CATEGORY_VALUES.length).toBe(14);
  });
});
