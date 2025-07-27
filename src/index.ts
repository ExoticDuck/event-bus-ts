//** API
//? 1. createEventBus() - создание нового EventBus
// Возвращает объект с функциями: { on, once, emit, clear }
// Использует замыкание для хранения состояния
// Каждый вызов создает изолированный экземпляр
//? 2. on(eventName, handler) - подписка на событие
// Возвращает функцию отписки () => void
//? 3. once(eventName, handler) - подписка на событие с автоматической отпиской
// после первого вызова
// Handler должен вызваться только один раз
// Возвращает функцию отписки () => void
//? 4. emit(eventName, payload) - генерация события
// Передает один payload в handlers
// Ничего не возвращает
//? 5. clear(eventName?) - удаление всех слушателей
// Если eventName не указан - удаляет все события
// Ничего не возвращает
// Специальные требования
//? 1. Wildcard события
// Поддержка события * которое срабатывает на любой emit
// Handler получает объект: { eventName: string, payload: unknown }

type Events = {
  data: { foo: number; arg: string };
  error: Error;
  connect: { host: string; port: number };
  close: void; // для событий без payload
};

type EventHandler<P> = (payload: P) => void;

type WildCardEventHandler<K> = (payload: {
  eventName: K;
  payload: unknown;
}) => void;

type EventBus<EventTypes> = {
  on<K extends keyof EventTypes>(
    eventName: K,
    handler: EventHandler<EventTypes[K]>
  ): () => void;
  on<K extends keyof EventTypes>(
    eventName: "*",
    handler: WildCardEventHandler<K>
  ): () => void;
  once<K extends keyof EventTypes>(
    eventName: K,
    handler: EventHandler<EventTypes[K]>
  ): () => void;
  once<K extends keyof EventTypes>(
    eventName: "*",
    handler: WildCardEventHandler<K>
  ): () => void;
  emit<K extends keyof EventTypes>(eventName: K, payload: EventTypes[K]): void;
  clear: (eventName?: keyof EventTypes) => void;
};

type Bus<EventTypes> = {
  [K in keyof EventTypes]?: EventHandler<EventTypes[K]>[];
} & {
  "*": ((payload: { eventName: keyof EventTypes; payload: unknown }) => void)[];
};

export function createEventBus<EventTypes>(): EventBus<EventTypes> {
  const bus: Bus<EventTypes> = { "*": [] } as Bus<EventTypes>;

  // сигнатура перегрузки для всех событий кроме "*"
  function on<K extends keyof EventTypes>(
    eventName: K,
    handler: EventHandler<EventTypes[K]>
  ): () => void;
  // сигнатура перегрузки для WildCard события
  function on<K extends keyof EventTypes>(
    eventName: "*",
    handler: WildCardEventHandler<K>
  ): () => void;
  function on<K extends keyof EventTypes>(
    eventName: K | "*",
    handler: any
  ): () => void {
    if (eventName === "*") {
      (bus["*"] as WildCardEventHandler<K>[]).push(
        handler as WildCardEventHandler<K>
      );
    } else {
      if (!bus[eventName]) {
        bus[eventName as keyof EventTypes] =
          [] as unknown as Bus<EventTypes>[K];
      }
      (bus[eventName] as EventHandler<EventTypes[K]>[]).push(
        handler as EventHandler<EventTypes[K]>
      );
    }
    // возврат функции отписки
    return () => clear(eventName);
  }

  function once<K extends keyof EventTypes>(
    eventName: K,
    handler: EventHandler<EventTypes[K]>
  ): () => void;
  function once<K extends keyof EventTypes>(
    eventName: "*",
    handler: WildCardEventHandler<K>
  ): () => void;
  function once<K extends keyof EventTypes>(
    eventName: K | "*",
    handler: any
  ): () => void {
    if (eventName === "*") {
      const helper: WildCardEventHandler<K> = (payload) => {
        handler(payload);
        clear(eventName);
      };
      on(eventName, helper);
    } else {
      const helper: EventHandler<EventTypes[K]> = (payload) => {
        handler(payload);
        clear(eventName);
      };
      on(eventName, helper);
    }
    // возврат функции отписки
    return () => clear(eventName);
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
      bus[eventName as keyof EventTypes] =
        [] as unknown as Bus<EventTypes>[keyof EventTypes];
      return;
    }
    for (eventName as string in bus) {
      if (eventName) {
        bus[eventName] = [] as unknown as Bus<EventTypes>[keyof EventTypes];
      }
    }
  }

  const eventBus = {
    on: on,
    once: once,
    emit: emit,
    clear: clear,
  };

  return eventBus;
}
