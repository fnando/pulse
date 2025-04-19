type ControllerConstructor<T extends HTMLElement = HTMLElement> = new (
  identifier: string,
  element: T,
) => Controller<T>;

function inspect(element: HTMLElement) {
  const attrs = Array.from(element.attributes)
    .map((attr) => `${attr.name}=${JSON.stringify(attr.value)}`)
    .join(" ");

  return `<${element.tagName.toLowerCase()} ${attrs}>`;
}

/**
 * Define a target element type.
 */
type TargetElement = Document | HTMLElement | Window;

/**
 * Map special targets to their corresponding elements.
 * If you'd like to have a custom target, you can add it here.
 *
 * @example
 * import { targetMapping } from "@fnando/pulse";
 * targetMapping["@custom"] = document.querySelector("#custom");
 *
 * @type {Record<string, TargetElement>}
 */
export const targetMapping: Record<string, TargetElement> = {
  "@window": window,
  "@doc": document,
  "@document": document,
  "@body": document.body,
  "@html": document.documentElement,
};

/**
 * Map keys to their corresponding key names.
 * If you'd like to have a custom key, you can add it here.
 *
 * @example
 * import { keyMapping } from "@fnando/pulse";
 * keyMapping["at"] = "@";
 * this.on("input->keydown.shift+at", (event) => {});
 *
 * @type {Record<string, string>}
 */
export const keyMapping: Record<string, string> = {
  enter: "Enter",
  tab: "Tab",
  esc: "Escape",
  space: " ",
  up: "ArrowUp",
  down: "ArrowDown",
  left: "ArrowLeft",
  right: "ArrowRight",
  home: "Home",
  end: "End",
  page_up: "PageUp",
  page_down: "PageDown",
  ..."abcdefghijklmnopqrstuvwxyz0123456789"
    .split("")
    .reduce((buffer, char) => Object.assign(buffer, { [char]: char }), {}),
};

const keyboardModifiers = ["meta", "ctrl", "alt", "shift"];

type EventExpression = {
  event: string;
  target: string;
  keys: string[];
  key: string;
  modifiers: string[];
};

function parseEventExpression(expression: string): EventExpression {
  const [target, rest] = expression.split("->");
  const [eventExpr, ...modifiers] = rest.split(":");
  const [event, comboExpr] = eventExpr.split(".");
  const keys = (comboExpr ?? "").split("+").filter((key) => key.trim());
  const key = keys.find((k) => !keyboardModifiers.includes(k)) ?? "";

  return { target, event, keys, key, modifiers };
}

/**
 * The main application class that will handle the controllers in the DOM.
 *
 * @example
 * const app = new Application();
 * app.register("counter", Counter);
 * app.register("counter-manager", CounterManager);
 * app.start();
 */
export class Application<E extends HTMLElement = HTMLElement> {
  private element: E;
  private observer: MutationObserver;
  // biome-ignore lint/suspicious/noExplicitAny: we don't care about type
  private registrations: Record<string, ControllerConstructor<any>> = {};
  private controllerId = 0;
  private associations = new Map<string, Controller[]>();

  constructor(element?: E) {
    this.element = (element || document.documentElement) as E;
    this.observer = new MutationObserver(this.handleMutations.bind(this));
  }

  /**
   * Register a controller to the application. This method must be called before
   * the `start` method.
   *
   * @param {string}   name     The name of the controller. This name will be
   *                            used in the `data-controller` attribute.
   * @param {typeof Controller} controllerClass The controller class that will
   *                            be registered.
   */
  register<T extends HTMLElement>(
    name: string,
    controllerClass: ControllerConstructor<T>,
  ): void {
    this.registrations[name] = controllerClass;
  }

  /**
   * Start the application. This method will connect all controllers in the DOM
   * and start observing mutations.
   */
  start() {
    this.connectAll(this.element);
    this.observer.observe(this.element, { subtree: true, childList: true });
  }

  /**
   * Handle the mutations in the DOM. This method will be called by the mutation
   * observer and will handle controllers that must be connected/disconnected.
   *
   * @param {MutationRecord[]} records The mutation records that will be
   *                                   handled.
   */
  private handleMutations(records: MutationRecord[]) {
    records.forEach((record) => {
      record.addedNodes.forEach((node) => {
        if (node.nodeType !== Node.ELEMENT_NODE) {
          return;
        }

        this.connectAll(node as HTMLElement);
      });

      record.removedNodes.forEach((node) => {
        if (node.nodeType !== Node.ELEMENT_NODE) {
          return;
        }

        this.disconnect(node as HTMLElement);
      });
    });
  }

  /**
   * Disconnect the controllers from the element. This method will effectively
   * call `#disconnect()` for each connected controller.
   *
   * If you're overriding `#disconnect()`, make sure you're calling `super()`,
   * so all event listeners are cleaned up.
   *
   * This method is not meant to be called directly, as it's called by the
   * mutation observer.
   *
   * @param {HTMLElement} element The element that will be disconnected from the
   *                              controllers.
   */
  disconnect(element: HTMLElement) {
    const elements = [
      element,
      ...Array.from(
        element.querySelectorAll<HTMLElement>("[data-controller-id]"),
      ),
    ];

    elements.forEach((node) => {
      const controllerId = node.dataset.controllerId;

      if (controllerId) {
        const controllers = this.associations.get(controllerId) || [];
        controllers.forEach((controller) => controller.disconnect());
        this.associations.delete(controllerId);
      }
    });
  }

  /**
   * Connect specified controllers defined on `[data-controller]` to the
   * element. Each connected controller will have an id assigned, so we can keep
   * track of them.
   *
   * This method is not meant to be called directly, as it's called by the app's
   * start function and the mutation observer (when DOM changes).
   *
   * @param {HTMLElement} element The element that will be connected to the
   *                              controllers.
   */
  connect(element: HTMLElement) {
    const controllers = element.dataset.controller?.split(/ +/).filter(Boolean);
    const controllerId = element.dataset.controllerId || this.newControllerId();
    const associatedControllers = this.associations.get(controllerId) || [];
    this.associations.set(controllerId, associatedControllers);
    element.dataset.controllerId = controllerId;

    controllers?.forEach((identifier) => {
      const controllerClass = this.registrations[identifier];

      if (!controllerClass) {
        console.error(
          `Controller not found: ${identifier} for ${inspect(element)}`,
        );
        return;
      }

      if (associatedControllers.some((c) => c instanceof controllerClass)) {
        return;
      }

      const controller = new controllerClass(identifier, element);
      associatedControllers.push(controller);

      controller.connect();
    });
  }

  /**
   * Connect all controllers in the element.
   * @param {HTMLElement} element The root element that will be searched for the
   *                              controllers.
   */
  connectAll(element: HTMLElement) {
    [
      element,
      ...Array.from(element.querySelectorAll<HTMLElement>("[data-controller]")),
    ].forEach((node) => {
      if (node.dataset.controller) {
        this.connect(node);
      }
    });
  }

  /**
   * Generate a new controller ID.
   * @returns {string} The new controller ID.
   */
  newControllerId(): string {
    this.controllerId += 1;
    return this.controllerId.toString();
  }
}

/**
 * The base controller class that provides a simple way to attach events to the
 * elements.
 *
 * @example
 * class Counter extends Controller {
 *   private count = 0;
 *
 *   connect() {
 *     this.count = 0;
 *     this.on("increment->click", this.increment);
 *     this.on("decrement->click", this.decrement);
 *   }
 *
 *   increment() {
 *     this.count += 1;
 *     this.update();
 *   }
 *
 *   decrement() {
 *     this.count -= 1;
 *     this.update();
 *   }
 *
 *   update() {
 *     this.target("output").textContent = this.count.toString();
 *   }
 * }
 */
export class Controller<E extends HTMLElement = HTMLElement> {
  public readonly element: E;
  public readonly listeners: (() => void)[] = [];
  public readonly identifier: string;

  constructor(identifier: string, element: E) {
    this.identifier = identifier;
    this.element = element;
  }

  /**
   * Attach an event handler to the element.
   *
   * ## The expression format
   *
   * The expression comes in a form of `target->event.key:modifiers`, where
   *
   * - `target` is the actual `[data-controller-name-target=name]` attribute.
   *   You can specify some special targets like `@window`, `@body` and `@doc`.
   * - `event` is any JavaScript event name.
   * - `key` is the key name. This is only used for keyboard events. Can be a
   *   single key or a combination of keys. For example, `ctrl+enter`.
   * - `modifiers` can be either `:prevent` for `preventDefault()`, or `:stop`
   *   for `stopPropagation()`.
   *
   * @param  {string}        expression The event expression. Must come in a
   *                                    form of `target->event`, where `target`
   *                                    is the data-target attribute value.
   * @param  {EventListener} callback   The function that will be called. This
   *                                    function will be bound to `this`
   *                                    automatically.
   * @param  {AddEventListenerOptions|boolean|undefined} options Set the event
   *                                                             handler options
   *                                                             like
   *                                                             {once: true}.
   * @return {Function}                 The function that will remove the event
   *                                    listener.
   *
   * @example
   * <button data-counter-target="increment">
   * this.on("increment->click", this.increment);
   *
   * @example
   * // Setting event handler options
   * this.on("remove->click", this.remove, {once: true});
   *
   * @example
   * // Defining multiple events at once
   * this.on("field->focus field->input", this.search);
   *
   * @example
   * // Using modifiers
   * this.on("button->click:prevent", this.search);
   *
   * @example
   * // Using keyboard events
   * this.on("input->keydown.ctrl+enter:prevent", this.search);
   */
  on(
    expression: string,
    callback: EventListener,
    options?: AddEventListenerOptions | boolean,
  ) {
    expression.split(/ +/).forEach((expr) => {
      const descriptor = parseEventExpression(expr);
      const bound = callback.bind(this);
      const selector = `[data-${this.identifier}-target="${descriptor.target}"]`;
      const target = targetMapping[descriptor.target] || this.element;
      const conditions = [
        // Validate whenever the target matches.
        targetMapping[descriptor.target]
          ? () => true
          : (event: Event) =>
              event.target &&
              "matches" in event.target &&
              (event.target as HTMLElement).matches(selector),

        // Validate keyboard events.
        (event: Event): boolean => {
          if (!(event instanceof KeyboardEvent)) {
            return true;
          }

          if (!descriptor.keys.length) {
            return true;
          }

          const satisfied =
            keyMapping[descriptor.key] &&
            keyMapping[descriptor.key].toLowerCase() ===
              event.key.toLowerCase() &&
            keyboardModifiers.every(
              (modifier) =>
                event[`${modifier}Key` as keyof KeyboardEvent] ===
                descriptor.keys.includes(modifier),
            );

          return Boolean(satisfied);
        },
      ];

      const trigger = (event: Event) => {
        if (!conditions.every((v) => v(event))) {
          return;
        }

        if (descriptor.modifiers.includes("prevent")) {
          event.preventDefault();
        }

        if (descriptor.modifiers.includes("stop")) {
          event.stopPropagation();
        }

        bound(event);
      };

      const off = () => target.removeEventListener(descriptor.event, trigger);
      target.addEventListener(descriptor.event, trigger, options);
      this.listeners.push(off);
    });
  }

  /**
   * Find a single target element by the data-target attribute value.
   * This method will raise an error if target doesn't exist.
   *
   * This is a shortcut for
   * `this.element.querySelector("[data-target=selector]")`.
   *
   * @param  {string} selector The data-target attribute value.
   * @return {HTMLElement}     The target element.
   * @throws {Error}           If the target is not found.
   *
   * @example
   * <div data-hello-target="output">
   * this.target("output").textContent = "Hello!";
   */
  target<T extends HTMLElement = HTMLElement>(selector: string): T {
    const target = this.element.querySelector<T>(
      `[data-${this.identifier}-target="${selector}"]`,
    );

    if (!target) {
      const error = new Error(
        `Target not found: "[data-${this.identifier}-target=${JSON.stringify(selector)}]" for ${inspect(this.element)}`,
      );

      throw error;
    }

    return target;
  }

  /**
   * Checks whether the root element has a matching target.
   *
   * This is a shortcut for
   * `Boolean(this.element.querySelector("[data-target=selector]"))`.
   *
   * @param  {string}  selector The target name.
   * @return {boolean}          [description]
   *
   * @example
   * <div data-hello-target="output">
   * this.hasTarget("output");
   */
  hasTarget(selector: string): boolean {
    return Boolean(
      this.element.querySelector(
        `[data-${this.identifier}-target="${selector}"]`,
      ),
    );
  }

  /**
   * Find multiple target elements by the data-target attribute value.
   * This method won't raise an error if target doesn't exist.
   *
   * This is a shortcut for
   * `this.element.querySelectorAll("[data-target=selector]")`.
   *
   * @param  {string} selector The data-target attribute value.
   * @return {HTMLElement[]}     The target element.
   *
   * @example
   * <div data-colorize-target="item">
   * <div data-colorize-target="item">
   * this.targets("item").forEach((item) => this.colorize(item));
   */
  targets<T extends HTMLElement = HTMLElement>(selector: string): T[] {
    return Array.from(
      this.element.querySelectorAll<T>(
        `[data-${this.identifier}-target="${selector}"]`,
      ),
    );
  }

  /**
   * The function that must be called when the controller is added to the DOM.
   */
  connect() {
    // noop
  }

  /**
   * The function that will be called when the controller is removed from the
   * DOM. Classes inheriting from `Controller` must always call `super()` to
   * clean up the event listeners.
   */
  disconnect() {
    while (this.listeners.length) {
      this.listeners.pop()?.();
    }
  }
}
