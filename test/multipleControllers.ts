import { Application, Controller } from "../src/index";

class CounterManager extends Controller {
  connect() {
    this.on("add->click", this.addCounter);
    this.on("remove->click", this.removeCounter);
  }

  addCounter() {
    const counter = document.createElement("div");
    counter.dataset.controller = "counter";
    counter.innerHTML = `
      <p>
        <strong data-counter-target="output">0</strong>
      </p>
      <button data-counter-target="increment">Increment</button>
      <button data-counter-target="decrement">Decrement</button>
      <button data-counter-manager-target="remove">-</button>
    `;

    this.element.appendChild(counter);
  }

  removeCounter({ target }) {
    target.parentElement.remove();
  }
}

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
app.register("counter-manager", CounterManager);
app.start();
