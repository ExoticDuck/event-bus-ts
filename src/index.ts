type EventHandler<P> = (payload: P) => void;

type WildCardEventHandler<K, P> = (payload: {
  eventName: K;
  payload: P;
}) => void;

type EventBus<EventTypes> = {
  on<K extends keyof EventTypes & string>(
    eventName: K,
    handler: EventHandler<EventTypes[K]>
  ): () => void;
  on<K extends keyof EventTypes & string>(
    eventName: "*",
    handler: WildCardEventHandler<K & string, EventTypes[K]>
  ): () => void;
  once<K extends keyof EventTypes & string>(
    eventName: K,
    handler: EventHandler<EventTypes[K]>
  ): () => void;
  once<K extends keyof EventTypes & string>(
    eventName: "*",
    handler: WildCardEventHandler<K & string, EventTypes[K]>
  ): () => void;
  emit<K extends keyof EventTypes & string>(
    eventName: K,
    payload: EventTypes[K]
  ): void;
  clear: (eventName?: keyof EventTypes) => void;
};

type EventMap<EventTypes extends Record<string, unknown>> = {
  [K in keyof EventTypes]: EventHandler<EventTypes[K]>[];
};

type WildCardHandlerMap<EventTypes extends Record<string, unknown>> = {
  "*": WildCardEventHandler<keyof EventTypes, EventTypes[keyof EventTypes]>[];
};

type Bus<EventTypes extends Record<string, unknown>> = EventMap<EventTypes> &
  WildCardHandlerMap<EventTypes>;

export default function createEventBus<
  EventTypes extends Record<string, unknown>
>(): EventBus<EventTypes> {
  const bus = {
    "*": [],
  } as Bus<EventTypes>;

  // сигнатура перегрузки для всех событий кроме "*"
  function on<K extends keyof EventTypes>(
    eventName: K,
    handler: EventHandler<EventTypes[K]>
  ): () => void;
  // сигнатура перегрузки для WildCard события
  function on<K extends keyof EventTypes>(
    eventName: "*",
    handler: WildCardEventHandler<K & string, EventTypes[K]>
  ): () => void;
  function on(eventName: keyof EventTypes | "*", handler: any): () => void {
    let handlers = bus[eventName];
    if (eventName === "*") {
      handlers.push(handler);
    } else {
      if (!handlers) {
        bus[eventName] = [handler] as Bus<EventTypes>[keyof EventTypes];
      } else {
        handlers.push(handler);
      }
    }
    return () => {
      if (eventName === "*") {
        bus["*"] = bus["*"].filter((savedHandler) => savedHandler !== handler);
      } else {
        const handlers = bus[eventName];
        if (handlers) {
          bus[eventName] = handlers.filter(
            (savedHandler) => savedHandler !== handler
          ) as Bus<EventTypes>[keyof EventTypes];
        }
      }
    };
  }

  function once<K extends keyof EventTypes>(
    eventName: K,
    handler: EventHandler<EventTypes[K]>
  ): () => void;
  function once<K extends keyof EventTypes>(
    eventName: "*",
    handler: WildCardEventHandler<K & string, EventTypes[K]>
  ): () => void;
  function once(eventName: keyof EventTypes | "*", handler: any): () => void {
    let unsubscribe: () => void;
    if (eventName === "*") {
      const helper: WildCardEventHandler<
        keyof EventTypes,
        EventTypes[keyof EventTypes]
      > = (payload) => {
        handler(payload);
        bus["*"] = bus["*"].filter((savedHandler) => savedHandler !== helper);
      };
      unsubscribe = on(eventName, helper);
    } else {
      const helper: EventHandler<EventTypes[keyof EventTypes]> = (payload) => {
        handler(payload);
        const handlers = bus[eventName];
        if (handlers) {
          bus[eventName] = handlers.filter(
            (savedHandler) => savedHandler !== helper
          ) as Bus<EventTypes>[keyof EventTypes];
          console.log(handlers);
        }
      };
      unsubscribe = on(eventName, helper);
    }
    // возврат функции отписки
    return unsubscribe;
  }

  function emit(eventName: keyof EventTypes, payload: any) {
    if (bus["*"]) {
      bus["*"].forEach((handler) => {
        handler({ eventName, payload });
      });
    }
    if (!bus[eventName]) return;
    bus[eventName].forEach((handler) => {
      handler(payload);
    });
  }

  function clear(eventName?: keyof EventTypes | "*") {
    if (eventName) {
      if (eventName === "*") {
        bus["*"] = [];
      } else {
        bus[eventName] = [] as unknown as Bus<EventTypes>[keyof EventTypes];
      }
      return;
    }

    Object.keys(bus).forEach((key) => {
      const eventKey = key as keyof EventTypes | "*";
      if (eventKey === "*") {
        bus["*"] = [];
      } else {
        bus[eventKey] = [] as unknown as Bus<EventTypes>[keyof EventTypes];
      }
    });
  }

  const eventBus = {
    on: on,
    once: once,
    emit: emit,
    clear: clear,
  };

  return eventBus;
}
