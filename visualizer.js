import readline from "readline";
import { recorder } from "./recorder.js";

const MAXIMUM_BAR_HEIGHT = 15;

export async function playVisualizer(calibrationSamples) {
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
    const barHeight = createBarHeight(calibrationSamples, amplitude);

    drawBar(xPosition, yPosition, barHeight);
    xPosition++;

    readline.cursorTo(process.stdout, 0, terminalHeight);

    if (xPosition > terminalWidth) {
      xPosition = 0;
      console.clear();
    }
  }
}

export function calculateRMS(frame) {
  const meanSquare =
    frame.reduce((sum, value) => value * value + sum, 0) / frame.length;
  const rms = Math.sqrt(meanSquare);

  return rms;
}

function createBarHeight(calibrationSamples, amplitude) {
  const lowest = calibrationSamples[0];
  const highest = calibrationSamples[1];
  const intervalValue = (highest - lowest) / (MAXIMUM_BAR_HEIGHT - 2);

  if (amplitude <= lowest) {
    return 1;
  } else if (amplitude > highest) {
    return MAXIMUM_BAR_HEIGHT;
  } else {
    return Math.round((amplitude - lowest) / intervalValue) + 1;
  }
}

function drawBar(xPosition, yPosition, barHeight) {
  for (let i = 0; i < barHeight; i++) {
    readline.cursorTo(process.stdout, xPosition, yPosition - i);
    process.stdout.write("┃");
  }
}

function setupVisualizer(isInterrupted) {
  console.clear();
  hideCursor();

  process.on("SIGINT", () => {
    isInterrupted.status = true;
    console.log("Visualizer stopped. Exiting...");
    showCursor();
  });
}

function hideCursor() {
  process.stdout.write("\u001B[?25l");
}

function showCursor() {
  process.stdout.write("\u001B[?25h");
}
