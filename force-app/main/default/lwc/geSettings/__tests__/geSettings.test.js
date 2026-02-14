import Settings from "c/geSettings";

describe("geSettings", () => {
    it("should initialize settings", async () => {
        await Settings.init();
        expect(Settings).toBeDefined();
    });
});
