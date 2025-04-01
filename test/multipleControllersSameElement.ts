import { Application, Controller } from "../src/index";

class Clipboard extends Controller {
  connect() {
    this.on("button->click", this.copy);
  }

  copy() {
    console.log("Copied", this.target<HTMLInputElement>("field").value);
  }
}

class Uppercase extends Controller {
  connect() {
    this.on("button->click", this.upcase);
  }

  upcase() {
    const input = this.target<HTMLInputElement>("field");
    input.value = input.value.toUpperCase();
  }
}

const app = new Application();
app.register("clipboard", Clipboard);
app.register("uppercase", Uppercase);
app.start();
