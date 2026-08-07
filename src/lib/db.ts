import Dexie, { type Table } from "dexie";
import type { Delivery } from "./types";

// Banco de dados local do MeuCorre.
// Padrão Local-First: dados ficam 100% no dispositivo do entregador.
// Zero servidor, zero latência, funciona offline, privacidade total.

class MeuCorreDB extends Dexie {
  deliveries!: Table<Delivery, number>;

  constructor() {
    super("MeuCorreDB");
    // Schema version 1 — indexa por app, date e timestamp para consultas rápidas.
    this.version(1).stores({
      deliveries: "++id, app, value, km, date, timestamp",
    });
  }
}

// Singleton — evita reabrir conexões em HMR do Next.js.
declare global {
  var __meucorre_db: MeuCorreDB | undefined;
}

export const db: MeuCorreDB =
  globalThis.__meucorre_db ?? (globalThis.__meucorre_db = new MeuCorreDB());
