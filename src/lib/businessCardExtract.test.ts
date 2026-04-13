import {
  parseBusinessCardJson,
  formatBusinessCardNotes,
} from "./businessCardExtract";

describe("parseBusinessCardJson", () => {
  it("parses valid JSON", () => {
    const r = parseBusinessCardJson(
      '{"name":"Jane Doe","company":"Acme","email":"j@a.co","phone":"+1"}',
    );
    expect(r).toEqual({
      name: "Jane Doe",
      company: "Acme",
      email: "j@a.co",
      phone: "+1",
    });
  });

  it("returns null for invalid JSON", () => {
    expect(parseBusinessCardJson("not json")).toBeNull();
  });

  it("trims and treats empty as null", () => {
    const r = parseBusinessCardJson(
      '{"name":"  ","company":null,"email":"","phone":123}',
    );
    expect(r?.name).toBeNull();
    expect(r?.company).toBeNull();
    expect(r?.email).toBeNull();
    expect(r?.phone).toBeNull();
  });
});

describe("formatBusinessCardNotes", () => {
  it("builds note block", () => {
    const s = formatBusinessCardNotes({
      name: "A",
      company: "B",
      email: "a@b.co",
      phone: null,
    });
    expect(s).toContain("[Business card — AI extracted]");
    expect(s).toContain("Name: A");
    expect(s).toContain("Company: B");
    expect(s).toContain("Email: a@b.co");
  });
});
