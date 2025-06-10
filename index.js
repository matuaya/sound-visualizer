#!/usr/bin/env node

import { PvRecorder } from "@picovoice/pvrecorder-node";
import { selectPrompt } from "./prompt.js";
import { playVisualizer } from "./visualizer.js";
import { runCalibration } from "./calibration.js";

const DEFAULT_SAMPLE = [200, 3000];

async function main() {
  const availableMicrophones = PvRecorder.getAvailableDevices();
  if (availableMicrophones[0] === "NULL Capture Device") {
    console.log("Sorry, microphone was not detected.");

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

  let volumeSamples = await runCalibration();

  const lowest = volumeSamples[0];
  const highest = volumeSamples[1];
  if (lowest > highest || highest - lowest < 800) {
    volumeSamples = DEFAULT_SAMPLE;
  }

  await playVisualizer(volumeSamples);
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
