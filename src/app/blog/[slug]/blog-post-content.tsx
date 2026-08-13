"use client";

import ReactMarkdown from "react-markdown";
import { useState } from "react";
import { toast } from "sonner";
import { Copy, Check, Share2 } from "lucide-react";

// ===== Cliente: renderiza markdown do post + botão "copiar link" =====

interface Props {
  content: string;
}

export default function BlogPostContent({ content }: Props) {
  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    if (typeof window === "undefined") return;
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success("Link copiado!", {
      description: "Cole onde quiser compartilhar o artigo.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const nativeShare = async () => {
    if (typeof navigator === "undefined" || !navigator.share) {
      copyLink();
      return;
    }
    try {
      await navigator.share({
        title: document.title,
        url: window.location.href,
      });
    } catch {
      // user cancelled
    }
  };

  return (
    <div className="blog-post-content">
      <ReactMarkdown
        components={{
          h1: ({ children }) => (
            <h1 className="mb-4 mt-8 text-2xl font-black text-zinc-900 dark:text-zinc-100">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mb-3 mt-8 text-xl font-bold text-emerald-600 dark:text-emerald-400">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mb-2 mt-6 text-lg font-bold text-zinc-900 dark:text-zinc-100">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="mb-4 leading-relaxed text-zinc-700 dark:text-zinc-300">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="mb-4 ml-5 list-disc space-y-1 text-zinc-700 dark:text-zinc-300">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-4 ml-5 list-decimal space-y-1 text-zinc-700 dark:text-zinc-300">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-emerald-600 underline hover:text-emerald-500 dark:text-emerald-400"
            >
              {children}
            </a>
          ),
          strong: ({ children }) => (
            <strong className="font-bold text-zinc-900 dark:text-zinc-100">
              {children}
            </strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
          blockquote: ({ children }) => (
            <blockquote className="my-4 border-l-4 border-emerald-500 bg-emerald-50 py-2 pl-4 text-zinc-700 dark:bg-emerald-500/5 dark:text-zinc-300">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-6 border-zinc-200 dark:border-zinc-800" />,
          code: ({ children }) => (
            <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-sm text-emerald-700 dark:bg-zinc-800 dark:text-emerald-400">
              {children}
            </code>
          ),
        }}
      >
        {content}
      </ReactMarkdown>

      {/* Botões flutuantes de copiar / compartilhar */}
      <div className="mt-6 flex gap-2 border-t border-zinc-200 pt-4 dark:border-zinc-800">
        <button
          onClick={copyLink}
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-500" />
              Copiado!
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              Copiar link
            </>
          )}
        </button>
        <button
          onClick={nativeShare}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-2 text-xs font-bold text-zinc-950 transition hover:bg-emerald-400"
        >
          <Share2 className="h-3.5 w-3.5" />
          Compartilhar
        </button>
      </div>
    </div>
  );
}
