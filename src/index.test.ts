import { test } from "node:test";
import assert from "node:assert";
import createEventBus from "./index";

type Events = {
  data: { foo: number };
  error: Error;
  close: void;
};

test("1. Создание экземпляра EventBus", () => {
  const bus = createEventBus<Events>();
  assert.ok(bus);
});

test("2. Подписка и вызов обработчика через on", (t, done) => {
  const bus = createEventBus<Events>();
  bus.on("data", (payload) => {
    assert.deepStrictEqual(payload, { foo: 42 });
    done();
  });
  bus.emit("data", { foo: 42 });
});

test("3. Корректная передача payload", (t, done) => {
  const bus = createEventBus<Events>();
  bus.on("data", (payload) => {
    assert.strictEqual(payload.foo, 100);
    done();
  });
  bus.emit("data", { foo: 100 });
});

test("4. Множественные подписчики", (t, done) => {
  const bus = createEventBus<Events>();
  let count = 0;
  const handler = () => {
    count++;
    if (count === 2) done();
  };
  bus.on("data", handler);
  bus.on("data", handler);
  bus.emit("data", { foo: 1 });
});

test("5. once срабатывает один раз", (t) => {
  const bus = createEventBus<Events>();
  let count = 0;
  bus.once("data", () => {
    count++;
  });
  bus.emit("data", { foo: 1 });
  bus.emit("data", { foo: 1 });
  assert.strictEqual(count, 1);
});

test("6. Отписка через возвращаемую функцию", () => {
  const bus = createEventBus<Events>();
  let called = false;
  const unsubscribe = bus.on("data", () => {
    called = true;
  });
  unsubscribe();
  bus.emit("data", { foo: 123 });
  assert.strictEqual(called, false);
});

test("7. Отписка once до вызова", () => {
  const bus = createEventBus<Events>();
  let called = false;
  const unsubscribe = bus.once("data", () => {
    called = true;
  });
  unsubscribe();
  bus.emit("data", { foo: 1 });
  assert.strictEqual(called, false);
});

test("8. Wildcard обработчик", (t) => {
  const bus = createEventBus<Events>();
  let seen: unknown[] = [];
  bus.on("*", (payload) => seen.push(payload));
  bus.emit("data", { foo: 1 });
  bus.emit("close", undefined);
});

test("9. clear для конкретного события", () => {
  const bus = createEventBus<Events>();
  let called = false;
  bus.on("data", () => (called = true));
  bus.clear("data");
  bus.emit("data", { foo: 42 });
  assert.strictEqual(called, false);
});

test("10. clear без параметров", () => {
  const bus = createEventBus<Events>();
  let called = false;
  bus.on("data", () => (called = true));
  bus.clear();
  bus.emit("data", { foo: 42 });
  assert.strictEqual(called, false);
});

test("11. Изоляция экземпляров", () => {
  const bus1 = createEventBus<Events>();
  const bus2 = createEventBus<Events>();
  let called = false;
  bus1.on("data", () => (called = true));
  bus2.emit("data", { foo: 123 });
  assert.strictEqual(called, false);
});
