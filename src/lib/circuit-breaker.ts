// ===== Circuit Breaker para Supabase =====
//
// Monitora falhas de conexão com o banco e abre o circuito quando
// o número de falhas excede o limite. Quando aberto, retorna erro
// 503 em vez de tentar conectar (evita cascade failure).
//
// Estados:
// - CLOSED: funcionando normalmente (falhas < threshold)
// - OPEN: circuito aberto, recusando conexões (falhas >= threshold)
// - HALF_OPEN: testando se o banco recuperou (após timeout)
//
// Uso automático: o Prisma client já usa este breaker via wrapper.

type CircuitState = "closed" | "open" | "half_open";

interface CircuitBreakerOptions {
  failureThreshold: number; // falhas antes de abrir (default: 5)
  resetTimeout: number; // ms antes de tentar half-open (default: 30000)
  halfOpenMaxAttempts: number; // tentativas no estado half-open (default: 3)
}

class CircuitBreaker {
  private state: CircuitState = "closed";
  private failureCount = 0;
  private lastFailureAt: number | null = null;
  private halfOpenAttempts = 0;
  private readonly options: CircuitBreakerOptions;

  constructor(options: Partial<CircuitBreakerOptions> = {}) {
    this.options = {
      failureThreshold: options.failureThreshold ?? 5,
      resetTimeout: options.resetTimeout ?? 30000,
      halfOpenMaxAttempts: options.halfOpenMaxAttempts ?? 3,
    };
  }

  /**
   * Verifica se uma requisição pode prosseguir.
   * Retorna true se pode, false se o circuito está aberto.
   */
  canRequest(): boolean {
    switch (this.state) {
      case "closed":
        return true;

      case "open":
        // Verifica se já passou o tempo de reset
        if (
          this.lastFailureAt &&
          Date.now() - this.lastFailureAt > this.options.resetTimeout
        ) {
          this.state = "half_open";
          this.halfOpenAttempts = 0;
          return true;
        }
        return false;

      case "half_open":
        if (this.halfOpenAttempts < this.options.halfOpenMaxAttempts) {
          this.halfOpenAttempts++;
          return true;
        }
        return false;
    }
  }

  /**
   * Registra um sucesso.
   * Se estava em half_open, volta para closed.
   */
  recordSuccess(): void {
    if (this.state === "half_open") {
      this.state = "closed";
      this.failureCount = 0;
      this.halfOpenAttempts = 0;
    } else if (this.state === "closed") {
      // Reset gradual de falhas em caso de sucesso
      if (this.failureCount > 0) {
        this.failureCount = Math.max(0, this.failureCount - 1);
      }
    }
  }

  /**
   * Registra uma falha.
   * Se atingir o threshold, abre o circuito.
   */
  recordFailure(): void {
    this.failureCount++;
    this.lastFailureAt = Date.now();

    if (this.state === "half_open") {
      // Falhou no half-open → volta para open
      this.state = "open";
    } else if (this.failureCount >= this.options.failureThreshold) {
      this.state = "open";
      console.error(
        `[CircuitBreaker] Circuito ABERTO após ${this.failureCount} falhas. ` +
          `Reset em ${this.options.resetTimeout / 1000}s.`,
      );
    }
  }

  /**
   * Retorna o estado atual para monitoramento.
   */
  getState(): {
    state: CircuitState;
    failureCount: number;
    lastFailureAt: number | null;
  } {
    return {
      state: this.state,
      failureCount: this.failureCount,
      lastFailureAt: this.lastFailureAt,
    };
  }
}

// Singleton — um breaker para todo o app
export const dbCircuitBreaker = new CircuitBreaker({
  failureThreshold: 5,
  resetTimeout: 30000, // 30s antes de tentar novamente
  halfOpenMaxAttempts: 3,
});

/**
 * Wrapper para executar queries com circuito breaker.
 * Se o circuito estiver aberto, lança erro 503 imediatamente.
 *
 * Uso:
 *   const users = await withCircuitBreaker(() => prisma.user.findMany());
 */
export async function withCircuitBreaker<T>(
  fn: () => Promise<T>,
): Promise<T> {
  if (!dbCircuitBreaker.canRequest()) {
    throw new Error("CIRCUIT_OPEN: Banco de dados temporariamente indisponível");
  }

  try {
    const result = await fn();
    dbCircuitBreaker.recordSuccess();
    return result;
  } catch (err) {
    // Só conta como falha se for erro de conexão (não erro de negócio)
    const isConnectionError =
      err instanceof Error &&
      (err.message.includes("connect") ||
        err.message.includes("timeout") ||
        err.message.includes("ECONNREFUSED") ||
        err.message.includes("ENOTFOUND") ||
        err.message.includes("Can't reach database") ||
        err.message.includes("Connection terminated") ||
        err.message.includes("PrismaClientInitializationError"));

    if (isConnectionError) {
      dbCircuitBreaker.recordFailure();
    }

    throw err;
  }
}

// ===== API compatível com webhook kiwify (nomeada por circuito) =====
// Mantém múltiplos circuit breakers nomeados para diferentes serviços.

const namedBreakers = new Map<string, CircuitBreaker>();

function getNamedBreaker(name: string): CircuitBreaker {
  let breaker = namedBreakers.get(name);
  if (!breaker) {
    breaker = new CircuitBreaker({
      failureThreshold: 5,
      resetTimeout: 30000,
      halfOpenMaxAttempts: 3,
    });
    namedBreakers.set(name, breaker);
  }
  return breaker;
}

export function canExecute(name: string): boolean {
  return getNamedBreaker(name).canRequest();
}

export function recordSuccess(name: string): void {
  getNamedBreaker(name).recordSuccess();
}

export function recordFailure(name: string): void {
  getNamedBreaker(name).recordFailure();
}

export function getCircuitState(name: string) {
  return getNamedBreaker(name).getState();
}
