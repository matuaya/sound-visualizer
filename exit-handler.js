import { recorder } from "./recorder.js";

export let isInterrupted = { status: false };

process.on("SIGINT", () => {
  console.log();
  isInterrupted = true;
  recorder.release();
  showCursor();
  return;
});

function showCursor() {
  process.stdout.write("\u001B[?25h");
}
