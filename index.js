import { selectPrompt } from "./prompt.js";
import { playVisualizer } from "./visualizer.js";
import { runCalibration } from "./calibration.js";

const DEFAULT_SAMPLE = [3, 4000];

async function main() {
  console.clear();

  const select = await selectPrompt(
    "Choose 'Sound Calibration' for better visualizer accuracy, or 'Skip' to use default settings.",
    [
      { name: "Sound Calibration", value: "calibrate" },
      { name: "Skip (Use Defaults)", value: "skip" },
    ]
  ).run();

  if (select === "skip") {
    return await playVisualizer(DEFAULT_SAMPLE);
  }

  console.clear();

  let calibrationSamples = await runCalibration();

  const lowest = calibrationSamples[0];
  const highest = calibrationSamples[1];
  if (lowest > highest || highest - lowest < 300) {
    calibrationSamples = DEFAULT_SAMPLE;
  }

  await playVisualizer(calibrationSamples);
}

main();
