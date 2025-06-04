import readline from "readline";

function playVisualizer() {
  const terminalWidth = process.stdout.columns;
  let yPosition = process.stdout.rows - 3;
  let xPosition = 0;

  hideCursor();

  const interval = setInterval(() => {
    const barHeight = Math.floor(Math.random() * 14) + 1;

    for (let i = 0; i <= barHeight; i++) {
      readline.cursorTo(process.stdout, xPosition, yPosition - i);
      process.stdout.write("┃");
    }

    xPosition++;

    if (terminalWidth < xPosition) {
      showCursor();
      clearInterval(interval);
    }
  }, 35);
}

function hideCursor() {
  process.stdout.write("\u001B[?25l");
}

function showCursor() {
  process.stdout.write("\u001B[?25h");
}

playVisualizer();
