import { PvRecorder } from "@picovoice/pvrecorder-node";
import { selectPrompt } from "./prompt.js";
import { playVisualizer } from "./visualizer.js";
import { runCalibration } from "./calibration.js";

const DEFAULT_SAMPLE = [3, 4000];

async function main() {
  const availableMicrophones = PvRecorder.getAvailableDevices();
  if (availableMicrophones[0] === "NULL Capture Device") {
    return;
  }

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

main().catch((error) => {
  if (
    error &&
    error.message === "PvRecorder failed to read audio data frame."
  ) {
    console.error("Exiting...");
  } else if (error === "") {
    console.error("Prompt cancelled");
  } else {
    throw error;
  }
});
