import readline from "readline";
import { PvRecorder } from "@picovoice/pvrecorder-node";
import enquirer from "enquirer";

const FRAME_SIZE = 512;
const SAMPLE_FRAMES = 90;
const DEFAULT_SAMPLE = [3, 4000];
const MAXIMUM_BAR_HEIGHT = 15;

const recorder = new PvRecorder(FRAME_SIZE);

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

  let calibrationSamples = await runCalibration();

  const lowest = calibrationSamples[0];
  const highest = calibrationSamples[1];
  if (lowest > highest || highest - lowest < 300) {
    calibrationSamples = DEFAULT_SAMPLE;
  }

  await playVisualizer(calibrationSamples);
}

function selectPrompt(message, choices) {
  return new enquirer.Select({
    name: "value",
    message,
    choices,
    format() {
      return null;
    },
    result(choice) {
      return this.map(choice)[choice];
    },
  });
}

async function runCalibration() {
  let calibrationSamples = [];
  const lowSample = await getSample(
    "To collect low-volume samples, press 'Start Sampling' and stay quiet for a few seconds.",
    "low"
  );
  calibrationSamples.push(lowSample);

  console.clear();

  const highSample = await getSample(
    "To collect high-volume samples, press 'Start Sampling' and speak louder than normal for a few seconds.",
    "high"
  );
  calibrationSamples.push(highSample);

  return calibrationSamples;
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
  const frames = await colletFrames();
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

async function colletFrames() {
  recorder.start();
  console.log("Collecting samples...");

  const frames = [];
  for (let i = 0; i <= SAMPLE_FRAMES; i++) {
    const frame = await recorder.read();
    const rms = calculateRMS(frame);
    frames.push(rms);
  }
  recorder.stop();

  return frames;
}

async function playVisualizer() {
  const terminalWidth = process.stdout.columns;
  const terminalHeight = process.stdout.rows;
  let yPosition = process.stdout.rows - 3;
  let xPosition = 0;
  let isInterrupted = { status: false };

  setupVisualizer(isInterrupted);
  recorder.start();

  while (!isInterrupted.status) {
    const frame = await recorder.read();
    const amplitude = calculateRMS(frame);
    const barHeight = createBarHeight(DEFAULT_SAMPLE, amplitude);

    drawBar(xPosition, yPosition, barHeight);
    xPosition++;

    readline.cursorTo(process.stdout, 0, terminalHeight);

    if (xPosition > terminalWidth) {
      xPosition = 0;
      clearScreen();
    }
  }
}

function setupVisualizer(isInterrupted) {
  clearScreen();
  hideCursor();

  process.on("SIGINT", () => {
    isInterrupted.status = true;
    console.log("Visualizer stopped. Exiting...");
    showCursor();
  });
}

function drawBar(xPosition, yPosition, barHeight) {
  for (let i = 0; i < barHeight; i++) {
    readline.cursorTo(process.stdout, xPosition, yPosition - i);
    process.stdout.write("┃");
  }
}

function createBarHeight(samples, amplitude) {
  const lowest = samples[0];
  const highest = samples[1];
  const intervalValue = (highest - lowest) / (MAXIMUM_BAR_HEIGHT - 2);

  if (amplitude <= lowest) {
    return 1;
  } else if (amplitude > highest) {
    return MAXIMUM_BAR_HEIGHT;
  } else {
    return Math.round((amplitude - lowest) / intervalValue) + 1;
  }
}

function calculateRMS(frame) {
  const meanSquare =
    frame.reduce((sum, value) => value * value + sum, 0) / frame.length;
  const rms = Math.sqrt(meanSquare);

  return rms;
}

function clearScreen() {
  console.clear();
}

function hideCursor() {
  process.stdout.write("\u001B[?25l");
}

function showCursor() {
  process.stdout.write("\u001B[?25h");
}

main();
