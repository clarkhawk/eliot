import { describe, expect, it } from "vitest";
import { normalizeCode, parseInvite } from "./index";

describe("invite codes", () => {
  it("normalizes six-character alphanumeric codes", () => {
    expect(normalizeCode("ilot-a7k2q9")).toBe("ILOT-A7K2Q9");
    expect(normalizeCode("ILOT-1234")).toBeNull();
    expect(normalizeCode("ILOT-ABC1234")).toBeNull();
  });

  it("rejects expired invitations", () => {
    const expired = JSON.stringify({ v: 1, salon: "Test", code: "ILOT-A7K2Q9", exp: Date.now() - 1 });
    expect(parseInvite(expired)).toBeNull();
  });

  it("accepts a valid invitation", () => {
    const invite = JSON.stringify({ v: 1, salon: "Test", code: "ILOT-A7K2Q9", exp: Date.now() + 60_000 });
    expect(parseInvite(invite)).toMatchObject({ code: "ILOT-A7K2Q9", salon: "Test" });
  });
});
