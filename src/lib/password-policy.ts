// ===== Política de senhas =====
//
// Validação de força de senha para registro e reset.
// Requisitos: 8+ caracteres, 1 maiúscula, 1 minúscula, 1 número.

export interface PasswordValidation {
  valid: boolean;
  errors: string[];
  score: number; // 0-4 (quanto mais alto, mais forte)
}

export function validatePassword(password: string): PasswordValidation {
  const errors: string[] = [];
  let score = 0;

  if (!password || password.length < 8) {
    errors.push("Senha deve ter no mínimo 8 caracteres");
  } else {
    score++;
  }

  if (password.length >= 12) {
    score++;
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Senha deve conter pelo menos 1 letra maiúscula");
  } else {
    score++;
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Senha deve conter pelo menos 1 letra minúscula");
  } else {
    score++;
  }

  if (!/[0-9]/.test(password)) {
    errors.push("Senha deve conter pelo menos 1 número");
  } else {
    score++;
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    // Não é erro, mas não adiciona score
    // Símbolos são opcionais mas recomendados
  } else {
    score++;
  }

  if (password.length > 100) {
    errors.push("Senha muito longa (máximo 100 caracteres)");
  }

  // Common passwords blacklist
  const common = [
    "password", "12345678", "123456789", "qwerty123",
    "abc12345", "password1", "iloveyou", "admin123",
    "welcome1", "monkey123", "sunshine1", "football1",
  ];
  if (common.includes(password.toLowerCase())) {
    errors.push("Senha muito comum — escolha uma mais segura");
    score = 0;
  }

  return {
    valid: errors.length === 0 && score >= 3,
    errors,
    score: Math.min(score, 4),
  };
}
