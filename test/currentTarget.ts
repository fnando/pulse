import { Application, Controller } from "../src/index";

class Counter extends Controller {
  private count: number;

  connect() {
    this.count = 0;
    this.on("increment->click", this.increment);
    this.on("decrement->click", this.decrement);
  }

  increment() {
    this.count += 1;
    this.update();
  }

  decrement() {
    this.count -= 1;
    this.update();
  }

  update() {
    this.target("output").textContent = this.count.toString();
  }
}

const app = new Application();
app.debug = true;
app.register("counter", Counter);
app.start();
