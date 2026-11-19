import { describe, expect, it } from "vitest";
import { API_URL } from "./api";
describe("API configuration", () => {
  it("expose une URL", () => expect(API_URL).toMatch(/^https?:\/\//));
});
