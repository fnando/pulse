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
app.register("counter", Counter);
app.start();

window.addEventListener("DOMContentLoaded", () => {
  const div = document.createElement("div");
  div.dataset.target = "counter";
  div.innerHTML = `
    <div data-controller="counter">
      <p>
        <strong data-counter-target="output">0</strong>
      </p>
      <button data-counter-target="increment">Increment</button>
      <button data-counter-target="decrement">Decrement</button>
    </div>
  `;

  setTimeout(() => {
    document.body.appendChild(div);
  }, 500);
});
