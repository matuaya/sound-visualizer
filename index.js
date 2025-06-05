import readline from "readline";
import { PvRecorder } from "@picovoice/pvrecorder-node";

const FRAME_SIZE = 512;
const DEFAULT_SAMPLE = [3, 4000];
const MAXIMUM_BAR_HEIGHT = 15;

const recorder = new PvRecorder(FRAME_SIZE);

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

playVisualizer();
