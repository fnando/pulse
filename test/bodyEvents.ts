import { Application, Controller } from "../src/index";

class CharsLeft extends Controller {
  connect() {
    this.limit = parseInt(this.element.dataset.charsLeftLimit, 10);
    this.on("@body->keyup @body->input @body->keydown", this.update);

    this.update();
  }

  update() {
    this.target("output").textContent = (
      this.limit - this.target("input").value.length
    ).toString();
  }
}

const app = new Application();
app.register("chars-left", CharsLeft);
app.start();
