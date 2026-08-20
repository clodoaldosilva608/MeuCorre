"use client";

import { motion, type Variants } from "framer-motion";
import { type ReactNode } from "react";

// ===== Componentes visuais compartilhados do redesign pixel-perfect =====

// Variantes de animação (stagger para entrada escalonada)
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

// GlassCard — card com glass effect (padrão do redesign)
export function GlassCard({
  children,
  className = "",
  hover = true,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`glass-card p-4 ${hover ? "hover:-translate-y-1" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

// NeonButton — botão verde com glow
export function NeonButton({
  children,
  onClick,
  href,
  className = "",
  size = "md",
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  type?: "button" | "submit";
}) {
  const sizeClasses = {
    sm: "px-4 py-2 text-xs",
    md: "px-6 py-3 text-sm",
    lg: "px-8 py-4 text-base",
  };

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`btn-neon inline-flex items-center justify-center gap-2 rounded-xl ${sizeClasses[size]} ${className}`}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      className={`btn-neon inline-flex items-center justify-center gap-2 rounded-xl ${sizeClasses[size]} ${className}`}
    >
      {children}
    </button>
  );
}

// KpiCard — card de métrica com valor grande + label
export function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  color = "#4ade80",
  trend,
}: {
  label: string;
  value: string;
  sub?: string;
  icon?: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color?: string;
  trend?: "up" | "down" | "neutral";
}) {
  return (
    <div className="glass-card p-4">
      <div className="flex items-center gap-2 text-zinc-500">
        {Icon && <Icon className="h-4 w-4" style={{ color }} />}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-bold text-white" style={{ fontVariantNumeric: "tabular-nums" }}>
        {value}
      </p>
      {sub && (
        <p className="mt-1 text-[10px]" style={{ color: trend === "up" ? "#4ade80" : trend === "down" ? "#ef4444" : "#71717a" }}>
          {sub}
        </p>
      )}
    </div>
  );
}

// SectionTitle — título de seção com badge opcional
export function SectionTitle({
  title,
  subtitle,
  badge,
  badgeIcon: BadgeIcon,
}: {
  title: string;
  subtitle?: string;
  badge?: string;
  badgeIcon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="text-center">
      {badge && (
        <p className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
          {BadgeIcon && <BadgeIcon className="h-3 w-3" />}
          {badge}
        </p>
      )}
      <h2 className="text-2xl font-extrabold tracking-tight text-white md:text-3xl">
        {title}
      </h2>
      {subtitle && (
        <p className="mx-auto mt-3 max-w-xl text-sm text-zinc-400 md:text-base">
          {subtitle}
        </p>
      )}
    </div>
  );
}

// StaggerContainer — wrapper para animação escalonada de filhos
export function StaggerContainer({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// StaggerItem — item filho do StaggerContainer
export function StaggerItem({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div variants={fadeUp} className={className}>
      {children}
    </motion.div>
  );
}
