import {
  quizCategoryToUserCategory,
  userCategoryToQuizCategory,
  isQuizSupportedCategory,
  getQuizSourceCategories,
  QUIZ_UNSUPPORTED_CATEGORIES,
  USER_CATEGORY_TO_QUIZ_MAP,
} from "./categoryMap";

// ---------------------------------------------------------------------------
// quizCategoryToUserCategory
// ---------------------------------------------------------------------------

describe("quizCategoryToUserCategory", () => {
  it("converts hyphen to underscore for known categories", () => {
    expect(quizCategoryToUserCategory("web-development")).toBe("web_development");
    expect(quizCategoryToUserCategory("ui-ux-design")).toBe("ui_ux_design");
    expect(quizCategoryToUserCategory("data-science")).toBe("data_science");
    expect(quizCategoryToUserCategory("network-systems-solutions")).toBe(
      "network_systems_solutions",
    );
    expect(quizCategoryToUserCategory("customer-service")).toBe(
      "customer_service",
    );
    expect(quizCategoryToUserCategory("strategic-digital-marketing")).toBe(
      "strategic_digital_marketing",
    );
  });

  it("returns same value for single-word categories with no hyphens", () => {
    expect(quizCategoryToUserCategory("cybersecurity")).toBe("cybersecurity");
  });

  it("returns null for group-level categories not in USER_CATEGORIES", () => {
    expect(quizCategoryToUserCategory("common")).toBeNull();
    expect(quizCategoryToUserCategory("tech-common")).toBeNull();
    expect(quizCategoryToUserCategory("management-common")).toBeNull();
    expect(quizCategoryToUserCategory("marketing-common")).toBeNull();
  });

  it("returns null for unknown categories", () => {
    expect(quizCategoryToUserCategory("unknown-category")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// userCategoryToQuizCategory
// ---------------------------------------------------------------------------

describe("userCategoryToQuizCategory", () => {
  it("converts underscore to hyphen", () => {
    expect(userCategoryToQuizCategory("web_development")).toBe("web-development");
    expect(userCategoryToQuizCategory("ui_ux_design")).toBe("ui-ux-design");
    expect(userCategoryToQuizCategory("network_systems_solutions")).toBe(
      "network-systems-solutions",
    );
  });

  it("leaves single-word values unchanged", () => {
    expect(userCategoryToQuizCategory("cybersecurity")).toBe("cybersecurity");
  });

  it("round-trips with quizCategoryToUserCategory for known categories", () => {
    const quizCategories = [
      "web-development",
      "ui-ux-design",
      "cybersecurity",
      "data-science",
      "customer-service",
      "social-media",
    ];
    for (const qc of quizCategories) {
      const userCat = quizCategoryToUserCategory(qc);
      if (userCat) {
        expect(userCategoryToQuizCategory(userCat)).toBe(qc);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// isQuizSupportedCategory
// ---------------------------------------------------------------------------

describe("isQuizSupportedCategory", () => {
  it("returns false for unsupported categories", () => {
    for (const cat of QUIZ_UNSUPPORTED_CATEGORIES) {
      expect(isQuizSupportedCategory(cat)).toBe(false);
    }
  });

  it("returns true for supported quiz categories", () => {
    expect(isQuizSupportedCategory("web_development")).toBe(true);
    expect(isQuizSupportedCategory("cybersecurity")).toBe(true);
    expect(isQuizSupportedCategory("digital_marketing")).toBe(true);
    expect(isQuizSupportedCategory("hospitality_management")).toBe(true);
  });

  it("esl and celpip are both unsupported", () => {
    expect(isQuizSupportedCategory("esl")).toBe(false);
    expect(isQuizSupportedCategory("celpip")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getQuizSourceCategories
// ---------------------------------------------------------------------------

describe("getQuizSourceCategories", () => {
  it("returns empty array for unsupported category", () => {
    expect(getQuizSourceCategories("esl")).toEqual([]);
    expect(getQuizSourceCategories("celpip")).toEqual([]);
  });

  it("returns [common, tech-common, web-development] for web_development", () => {
    expect(getQuizSourceCategories("web_development")).toEqual([
      "common",
      "tech-common",
      "web-development",
    ]);
  });

  it("returns [common, management-common, customer-service] for customer_service", () => {
    expect(getQuizSourceCategories("customer_service")).toEqual([
      "common",
      "management-common",
      "customer-service",
    ]);
  });

  it("returns [common, marketing-common, social-media] for social_media", () => {
    expect(getQuizSourceCategories("social_media")).toEqual([
      "common",
      "marketing-common",
      "social-media",
    ]);
  });

  it("always includes common as the first element for supported categories", () => {
    const supported: Parameters<typeof getQuizSourceCategories>[0][] = [
      "web_development",
      "data_science",
      "event_management",
      "digital_marketing",
    ];
    for (const cat of supported) {
      const sources = getQuizSourceCategories(cat);
      expect(sources[0]).toBe("common");
    }
  });

  it("always has the category-specific pool as the last element", () => {
    const cases: [Parameters<typeof getQuizSourceCategories>[0], string][] = [
      ["ui_ux_design", "ui-ux-design"],
      ["network_systems_solutions", "network-systems-solutions"],
      ["hospitality_management", "hospitality-management"],
    ];
    for (const [userCat, expected] of cases) {
      const sources = getQuizSourceCategories(userCat);
      expect(sources[sources.length - 1]).toBe(expected);
    }
  });
});

// ---------------------------------------------------------------------------
// USER_CATEGORY_TO_QUIZ_MAP completeness
// ---------------------------------------------------------------------------

describe("USER_CATEGORY_TO_QUIZ_MAP", () => {
  it("contains no unsupported categories", () => {
    const values = USER_CATEGORY_TO_QUIZ_MAP.map((e) => e.userCategoryValue);
    for (const unsupported of QUIZ_UNSUPPORTED_CATEGORIES) {
      expect(values).not.toContain(unsupported);
    }
  });

  it("every entry has a non-empty quizCategory and categoryGroup", () => {
    for (const entry of USER_CATEGORY_TO_QUIZ_MAP) {
      expect(entry.quizCategory.length).toBeGreaterThan(0);
      expect(entry.categoryGroup.length).toBeGreaterThan(0);
    }
  });
});
