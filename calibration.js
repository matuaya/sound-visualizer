import { selectPrompt } from "./prompt.js";
import { isInterrupted } from "./exit-handler.js";
import { recorder } from "./recorder.js";
import { calculateRMS } from "./visualizer.js";

const SAMPLE_FRAMES = 90;

export async function runCalibration() {
  let volumeSamples = [];
  const lowSample = await getSample(
    "To collect low-volume samples, press 'Start Sampling' and stay quiet for a few seconds.",
    "low",
  );
  volumeSamples.push(lowSample);

  console.clear();

  const highSample = await getSample(
    "To collect high-volume samples, press 'Start Sampling' and speak louder than normal for a few seconds.",
    "high",
  );
  volumeSamples.push(highSample);

  return volumeSamples;
}

async function getSample(instructionMessage, sampleType) {
  const response = await selectPrompt(instructionMessage, [
    { name: "Start Sampling", value: sampleType },
  ]).run();
  if (response) {
    return getAverageVolume(sampleType);
  }
}

async function getAverageVolume(volumeLevel) {
  const frames = await collectFrames();
  const sortedFrames = frames.sort((a, b) => b - a);

  let filteredFrames;
  if (volumeLevel === "high") {
    filteredFrames = sortedFrames.slice(0, 30);
  } else if (volumeLevel === "low") {
    filteredFrames = sortedFrames.slice(-30);
  }

  const average =
    filteredFrames.reduce((sum, i) => sum + i, 0) / filteredFrames.length;
  return Math.round(average);
}

async function collectFrames() {
  recorder.start();
  console.log("Collecting samples...");

  const frames = [];
  for (let i = 0; i <= SAMPLE_FRAMES; i++) {
    if (isInterrupted.status) {
      recorder.stop();
    }

    const frame = await recorder.read();
    const rms = calculateRMS(frame);
    frames.push(rms);
  }

  recorder.stop();

  return frames;
}
