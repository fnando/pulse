# pulse

[![Tests](https://github.com/fnando/pulse/workflows/js-tests/badge.svg)](https://github.com/fnando/pulse)
[![NPM](https://img.shields.io/npm/v/pulse.svg)](https://npmjs.org/package/pulse)
[![NPM](https://img.shields.io/npm/dt/pulse.svg)](https://npmjs.org/package/pulse)
[![MIT License](https://img.shields.io/:License-MIT-blue.svg)](https://tldrlegal.com/license/mit-license)

.

## Installation

This package is available as a NPM package. To install it, use the following
command:

```bash
npm install @fnando/pulse --save
```

If you're using Yarn (and you should):

```bash
yarn add @fnando/pulse
```

## Usage

### Creating a controller

A controller encapsulates the logic for a piece of UI. That can be orchestrating
multiple components, or a smaller component unit. All controllers must inherit
from `Controller`.

```js
import { Controller } from "@fnando/pulse";

export class Counter extends Controller {
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
```

A few things about this controller:

- `connect()` is a method you can define that will always be called once a new
  element is connected (added to DOM). Similarly, there's a `disconnect()`
  method that's called when the controller's root element is removed; in this
  case, make sure you call `super()`.
- `this.on(expression, callback)` will register an event handler on the target.
  The expression is a shortcut for a target and the event. The above example is
  defining a `click` event on `[data-counter-target="increment"]` and
  `[data-counter-target="decrement"]`.
- the `update()` method is reflecting the new count on the ui. It uses
  `target(name)` to retrieve the element. The full selector would be
  `[data-counter-target="output"]`.

### Registering controllers

To register a controller, you'll need an application instance.

```js
import { Application } from "@fnando/pulse";
import { Counter } from "./controllers/Counter";

const app = new Application();
app.register("counter", Counter);
app.start();
```

The `Application#start()` method will watch for DOM modifications and ensure all
controllers are connected to their own elements.

## FAQ

### This looks like Stimuls... a lot!

Yes, it does! And that's the purpose. It doesn't implement everything, but it's
lot smaller (2kb min+gzip).

### What's not supported?

- There's no notifications if targets are added/removed (in Stimulus, you can
  use `${name}TargetConnected` and `${name}TargetDisconnected`).
- There's no outlet support to communicate between different controllers.
- Event's are set using `controller.on(expression, callback)`, not
  `[data-action]`.
- No CSS classes or values.

## Maintainer

- [Nando Vieira](https://github.com/fnando)

## Contributors

- https://github.com/fnando/pulse/contributors

## Contributing

For more details about how to contribute, please read
https://github.com/fnando/pulse/blob/main/CONTRIBUTING.md.

## License

The gem is available as open source under the terms of the
[MIT License](https://opensource.org/licenses/MIT). A copy of the license can be
found at https://github.com/fnando/pulse/blob/main/LICENSE.md.

## Code of Conduct

Everyone interacting in the pulse project's codebases, issue trackers, chat
rooms and mailing lists is expected to follow the
[code of conduct](https://github.com/fnando/pulse/blob/main/CODE_OF_CONDUCT.md).
