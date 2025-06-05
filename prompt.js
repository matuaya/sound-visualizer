import enquirer from "enquirer";

export function selectPrompt(message, choices) {
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
