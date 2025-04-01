import { Application, Controller } from "../src/index";

class KeyboardEvents extends Controller {
  connect() {
    this.on("@window->keydown.ctrl+c", (event: KeyboardEvent) => {
      const target = this.target("output");
      const data = JSON.stringify({ ctrl: event.ctrlKey, key: event.key });
      target.textContent = `${target.textContent}\n${data}\n`;
    });
  }
}

const app = new Application();
app.register("keyboard-events", KeyboardEvents);
app.start();
