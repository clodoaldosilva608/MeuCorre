// ===== Circuit Breaker =====
//
// Previne thundering herd quando o banco de dados cai.
// Se N operações falharem consecutivamente, o circuito "abre" e falha rápido
// (retorna 503) em vez de esperar timeout. Após COOLDOWN_MS, entra em estado
// "half-open" e testa se o banco voltou.
//
// Estados:
// - CLOSED: operações normais (falhas incrementam counter)
// - OPEN: falha rápido (503) sem bater no banco (após FAILURE_THRESHOLD falhas)
// - HALF_OPEN: testa 1 operação (se sucesso → CLOSED, se falha → OPEN)
//
// Em serverless, o estado é in-memory por instância. Não é perfeito, mas
// reduz carga significativamente quando múltiplas instâncias detectam falha.

type CircuitState = "closed" | "open" | "half-open";

interface CircuitBreakerEntry {
  state: CircuitState;
  failureCount: number;
  openedAt: number;
  lastSuccessAt: number;
}

const circuits = new Map<string, CircuitBreakerEntry>();

const FAILURE_THRESHOLD = 5; // 5 falhas = abre circuito
const COOLDOWN_MS = 30 * 1000; // 30s em OPEN antes de HALF_OPEN
const SUCCESS_RESET_THRESHOLD = 2; // 2 sucessos em HALF_OPEN = CLOSE

/**
 * Verifica se o circuito está aberto (deve falhar rápido).
 * Retorna true se o circuito permitir a operação, false se deve falhar rápido.
 */
export function canExecute(circuitName: string): boolean {
  const entry = circuits.get(circuitName);
  if (!entry) return true; // sem estado = CLOSED (permite)

  const now = Date.now();

  if (entry.state === "open") {
    // Verifica se cooldown passou → transita para HALF_OPEN
    if (now - entry.openedAt > COOLDOWN_MS) {
      entry.state = "half-open";
      return true; // permite 1 tentativa de teste
    }
    return false; // ainda em cooldown, falha rápido
  }

  // CLOSED ou HALF_OPEN: permite execução
  return true;
}

/**
 * Registra sucesso no circuito. Reseta failure count e fecha circuito.
 */
export function recordSuccess(circuitName: string): void {
  const entry = circuits.get(circuitName);
  if (!entry) {
    circuits.set(circuitName, {
      state: "closed",
      failureCount: 0,
      openedAt: 0,
      lastSuccessAt: Date.now(),
    });
    return;
  }

  entry.lastSuccessAt = Date.now();

  if (entry.state === "half-open") {
    // Sucesso em HALF_OPEN → fecha circuito
    entry.state = "closed";
    entry.failureCount = 0;
  } else if (entry.state === "closed") {
    // Sucesso em CLOSED → reseta contador
    entry.failureCount = 0;
  }
}

/**
 * Registra falha no circuito. Incrementa counter e abre circuito se threshold atingido.
 */
export function recordFailure(circuitName: string): void {
  let entry = circuits.get(circuitName);
  if (!entry) {
    entry = {
      state: "closed",
      failureCount: 0,
      openedAt: 0,
      lastSuccessAt: 0,
    };
    circuits.set(circuitName, entry);
  }

  entry.failureCount++;

  if (entry.state === "half-open") {
    // Falha em HALF_OPEN → reabre circuito
    entry.state = "open";
    entry.openedAt = Date.now();
    return;
  }

  if (entry.failureCount >= FAILURE_THRESHOLD) {
    entry.state = "open";
    entry.openedAt = Date.now();
  }
}

/**
 * Retorna estado atual do circuito (para monitoring/debug).
 */
export function getCircuitState(circuitName: string): CircuitState {
  return circuits.get(circuitName)?.state ?? "closed";
}

/**
 * Reseta circuito manualmente (para testes ou admin intervention).
 */
export function resetCircuit(circuitName: string): void {
  circuits.delete(circuitName);
}
