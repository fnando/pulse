import { Application, Controller } from "../src/index";

class Counter extends Controller {
  private count: number;

  connect() {
    this.count = 0;
    console.log("Counter connected", this.element);
    this.on("@element->click", this.increment);
  }

  increment() {
    this.count += 1;
    this.update();
  }

  update() {
    this.element.textContent = `Click: ${this.count}`;
  }
}

const app = new Application();
app.register("counter", Counter);
app.start();
