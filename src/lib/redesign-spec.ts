// Especificações visuais extraídas das imagens de referência do redesign
// Usar como guia para implementação pixel-perfect

export const REDesign_SPEC = {
  // CORES
  colors: {
    bg: "#0A0A0A",           // Fundo principal (preto puro)
    bgCard: "#161616",       // Cards (cinza escuro elevado)
    bgCardElevated: "#1C1C1C", // Cards elevados
    border: "#2A2A2A",       // Bordas sutis
    borderActive: "#4ADE80", // Bordas ativas (verde)
    neon: "#4ADE80",         // Verde neon principal
    neonHover: "#22C55E",   // Verde hover (mais escuro)
    neonSoft: "#86EFAC",    // Verde claro
    text: "#FFFFFF",         // Texto primário
    textSecondary: "#9CA3AF", // Texto secundário
    textTertiary: "#666666", // Texto terciário
    loss: "#EF4444",         // Vermelho (despesas)
    gold: "#FFD700",         // Dourado (preços)
  },
  
  // GLASS EFFECT
  glass: {
    background: "rgba(255, 255, 255, 0.03)",
    backdropBlur: "10px",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "16px",
    hoverBorder: "rgba(74, 222, 128, 0.2)",
    hoverTransform: "translateY(-2px)",
  },
  
  // TIPOGRAFIA
  typography: {
    family: "'Inter', system-ui, sans-serif",
    weights: { light: 300, regular: 400, medium: 500, semibold: 600, bold: 700, extrabold: 800 },
    sizes: {
      h1: { mobile: "32px", desktop: "48px" },
      h2: { mobile: "24px", desktop: "36px" },
      h3: { mobile: "18px", desktop: "20px" },
      body: { mobile: "14px", desktop: "16px" },
      small: "12px",
      tiny: "10px",
    },
  },
  
  // ESPAÇAMENTO
  spacing: {
    section: { mobile: "64px", desktop: "96px" },
    card: { padding: "20px", gap: "12px" },
    container: { maxWidth: "1200px", padding: "24px" },
  },
  
  // BOTÕES
  buttons: {
    primary: {
      bg: "#4ADE80",
      color: "#000000",
      fontWeight: 700,
      fontSize: "16px",
      padding: "16px 32px",
      borderRadius: "8px",
      shadow: "0 4px 20px rgba(74, 222, 128, 0.3)",
      hoverBg: "#22C55E",
    },
    secondary: {
      bg: "transparent",
      border: "2px solid #374151",
      color: "#FFFFFF",
      fontWeight: 600,
      padding: "16px 32px",
      borderRadius: "8px",
      hoverBorder: "#4ADE80",
      hoverBg: "rgba(74, 222, 128, 0.05)",
    },
  },
  
  // BOTTOM NAV (dashboard)
  bottomNav: {
    height: "84px",
    bg: "rgba(10, 10, 10, 0.95)",
    backdropBlur: "20px",
    borderTop: "1px solid #222222",
    activeColor: "#4ADE80",
    inactiveColor: "#666666",
    activeScale: "1.1",
  },
  
  // HEADER
  header: {
    height: "72px",
    bg: "rgba(10, 10, 10, 0.95)",
    backdropBlur: "12px",
    borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
  },
};

// REGRA PRINCIPAL: A landing page inteira deve ser DARK
// Sem seções brancas — tudo sobre fundo #0A0A0A
// As únicas exceções são: seções com fundo branco intencional (blog, FAQ)
// que devem ser convertidas para dark ou removidas
