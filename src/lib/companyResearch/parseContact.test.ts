import {
  extractEmailsFromText,
  extractHttpUrlsFromText,
  domainFromEmail,
  isCorporateDomain,
} from "./parseContact";

describe("parseContact", () => {
  it("extracts emails from text", () => {
    expect(extractEmailsFromText("Contact: a@acme.com and b@gmail.com")).toEqual([
      "a@acme.com",
      "b@gmail.com",
    ]);
  });

  it("extracts http urls", () => {
    expect(
      extractHttpUrlsFromText("See https://acme.com/jobs and http://x.co/a."),
    ).toEqual(["https://acme.com/jobs", "http://x.co/a"]);
  });

  it("domainFromEmail", () => {
    expect(domainFromEmail("Jane@Sub.ACME.COM")).toBe("sub.acme.com");
  });

  it("isCorporateDomain", () => {
    expect(isCorporateDomain("acme.com")).toBe(true);
    expect(isCorporateDomain("gmail.com")).toBe(false);
  });
});
