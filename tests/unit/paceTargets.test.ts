import { computeSegmentPacePreview } from "../../src/utils/paceTargets";
import type { TrainingSeries, TrainingSeriesSegment } from "../../src/types/training";

describe("computeSegmentPacePreview (distance reference)", () => {
    const baseSerie: TrainingSeries = {
        id: "serie-1",
        repeatCount: 1,
        segments: [],
        enablePace: true,
        paceReferenceDistance: "100m",
        pacePercent: 100,
    };

    const baseSegment: TrainingSeriesSegment = {
        id: "seg-1",
        distance: 100,
        distanceUnit: "m",
        restInterval: 0,
        restUnit: "s",
    };

    it("parses French record format 10''23 as 10.23 seconds", () => {
        const preview = computeSegmentPacePreview(baseSerie, baseSegment, {
            records: {
                "100m": "10''23",
            },
        });

        expect(preview?.mode).toBe("time");
        expect(preview?.value).toBe("10.23 s");
    });

    it("parses French record format 1'52''34 as 1:52.34", () => {
        const serie: TrainingSeries = {
            ...baseSerie,
            paceReferenceDistance: "400m",
        };

        const segment: TrainingSeriesSegment = {
            ...baseSegment,
            distance: 400,
        };

        const preview = computeSegmentPacePreview(serie, segment, {
            records: {
                "400m": "1'52''34",
            },
        });

        expect(preview?.mode).toBe("time");
        expect(preview?.value).toBe("1:52.34 s");
    });

    it("applies percent as a speed percentage (90% => slower => longer time)", () => {
        const serie: TrainingSeries = {
            ...baseSerie,
            pacePercent: 90,
        };

        const preview = computeSegmentPacePreview(serie, baseSegment, {
            records: {
                "100m": "10.00",
            },
        });

        // 100m in 10.00s => 10 m/s. At 90% speed => 9 m/s => 11.11s
        expect(preview?.mode).toBe("time");
        expect(preview?.value).toBe("11.11 s");
    });
});
