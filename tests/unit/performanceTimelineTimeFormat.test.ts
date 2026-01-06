import { getDisciplineMetricMeta, parseTimeToSeconds } from "../../src/utils/performance";

describe("performance time parsing/formatting (>60s)", () => {
    it("parses French minute format 1'02''33 as 62.33 seconds", () => {
        expect(parseTimeToSeconds("1'02''33")).toBe(62.33);
    });

    it("parses long chrono even with extra metadata text", () => {
        expect(parseTimeToSeconds("39'58''00 (PB)")).toBe(2398);
    });

    it("prefers the parenthesized time when it contains the real perf", () => {
        // Example seen in some feeds: the perf outside parentheses is not the real one.
        expect(parseTimeToSeconds("42'59'' (41'16'')")).toBe(41 * 60 + 16);
    });

    it("does not treat wind parentheses as the performance", () => {
        expect(parseTimeToSeconds("12''34 (+1.2)")).toBe(12.34);
    });

    it("parses typographic prime format 39′58″00 as 2398 seconds", () => {
        expect(parseTimeToSeconds("39′58″00")).toBe(2398);
    });

    it("formats 62.33 seconds as 1'02''33", () => {
        const meta = getDisciplineMetricMeta("400m");
        expect(meta.formatValue(62.33, "compact")).toBe("1'02''33");
    });

    it("carries centiseconds rounding into seconds (62.999 => 1'03''00)", () => {
        const meta = getDisciplineMetricMeta("400m");
        expect(meta.formatValue(62.999)).toBe("1'03''00");
    });

    it("carries seconds into minutes (119.999 => 2'00''00)", () => {
        const meta = getDisciplineMetricMeta("800m");
        expect(meta.formatValue(119.999)).toBe("2'00''00");
    });
});
