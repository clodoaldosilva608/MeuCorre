"""
Gera os ícones do app MeuCorre:
- icon-192.png  (192x192, app icon padrão)
- icon-512.png  (512x512, app icon padrão)
- icon-maskable-512.png (512x512, maskable com padding seguro)
- apple-touch-icon.png (180x180, iOS)

Conceito: squircle (quadrado arredondado) com gradiente esmeralda -> zinc-950,
com um raio ⚡ estilizado no centro em esmeralda claro.
"""

from PIL import Image, ImageDraw, ImageFont, ImageFilter
import math
import os

OUT_DIR = "/home/z/my-project/public"
os.makedirs(OUT_DIR, exist_ok=True)

# Cores
EMERALD_LIGHT = (52, 211, 153)   # emerald-400
EMERALD       = (16, 185, 129)   # emerald-500
EMERALD_DARK  = (5, 150, 105)    # emerald-600
ZINC_950      = (9, 9, 11)       # zinc-950
ZINC_900      = (24, 24, 27)     # zinc-900
WHITE         = (250, 250, 250)


def make_squircle(size: int, radius_ratio: float = 0.28) -> Image.Image:
    """Cria uma máscara de squircle (quadrado com cantos super-arredondados)."""
    img = Image.new("L", (size, size), 0)
    d = ImageDraw.Draw(img)
    r = int(size * radius_ratio)
    d.rounded_rectangle([0, 0, size - 1, size - 1], radius=r, fill=255)
    return img


def draw_gradient_bg(size: int) -> Image.Image:
    """Fundo gradiente diagonal: zinc-950 (top-left) -> emerald-600 (bottom-right)."""
    img = Image.new("RGB", (size, size), ZINC_950)
    px = img.load()
    for y in range(size):
        for x in range(size):
            # progressão diagonal 0..1
            t = (x + y) / (2 * size)
            # interpolação linear
            r = int(ZINC_950[0] * (1 - t) + EMERALD_DARK[0] * t)
            g = int(ZINC_950[1] * (1 - t) + EMERALD_DARK[1] * t)
            b = int(ZINC_950[2] * (1 - t) + EMERALD_DARK[2] * t)
            px[x, y] = (r, g, b)
    # Adiciona um sutil highlight no topo (esquerda)
    overlay = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    od.ellipse(
        [-size * 0.3, -size * 0.3, size * 0.7, size * 0.5],
        fill=(255, 255, 255, 28),
    )
    overlay = overlay.filter(ImageFilter.GaussianBlur(size * 0.08))
    img = Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")
    return img


def draw_lightning_bolt(d: ImageDraw.Draw, cx: float, cy: float, h: float,
                        fill: tuple, outline: tuple = None, outline_w: int = 0):
    """Desenha um raio ⚡ estilizado centralizado em (cx, cy) com altura h.
    Polígono baseado em proporções clássicas de raio SVG."""
    # Coordenadas relativas (altura h, largura ~0.6h)
    w = h * 0.62
    # Pontos do raio (em sistema com origem no centro, y para baixo)
    pts = [
        (cx + w * 0.18, cy - h * 0.50),   # topo direito
        (cx - w * 0.32, cy + h * 0.02),   # meio esquerda (cotovelo)
        (cx - w * 0.05, cy + h * 0.02),   # meio centro
        (cx - w * 0.18, cy + h * 0.50),   # ponta inferior
        (cx + w * 0.32, cy - h * 0.02),   # meio direita
        (cx + w * 0.05, cy - h * 0.02),   # meio centro superior
    ]
    d.polygon(pts, fill=fill, outline=outline, width=outline_w)


def make_icon(size: int, maskable: bool = False) -> Image.Image:
    """Cria um ícone do MeuCorre no tamanho especificado."""
    # Para maskable, usamos uma área central segura (~80%) — o restante pode ser recortado
    # pelo ícone do SO. Por isso, pintamos o fundo inteiro com a cor base.
    if maskable:
        # Fundo sólido + squircle centralizado em 80% (área segura)
        img = Image.new("RGBA", (size, size), ZINC_950 + (255,))
        bg = draw_gradient_bg(size)
        # Aplica squircle menor (área segura ~80%)
        inner_size = int(size * 0.80)
        inner_bg = bg.resize((inner_size, inner_size), Image.LANCZOS)
        inner_mask = make_squircle(inner_size, radius_ratio=0.30)
        offset = (size - inner_size) // 2
        img.paste(inner_bg, (offset, offset), inner_mask)
        # Raio proporcional à área segura
        bolt_h = int(size * 0.42)
        cx = cy = size // 2
    else:
        # Squircle full-bleed
        bg = draw_gradient_bg(size)
        mask = make_squircle(size, radius_ratio=0.28)
        img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        img.paste(bg, (0, 0), mask)
        # Borda sutil
        d_b = ImageDraw.Draw(img)
        d_b.rounded_rectangle(
            [0, 0, size - 1, size - 1],
            radius=int(size * 0.28),
            outline=(255, 255, 255, 30),
            width=max(1, size // 128),
        )
        bolt_h = int(size * 0.55)
        cx = cy = size // 2

    # Raio ⚡ — preenchimento em esmeralda claro + leve glow
    d = ImageDraw.Draw(img)

    # Glow atrás do raio
    glow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    draw_lightning_bolt(gd, cx, cy, bolt_h * 1.12, fill=EMERALD_LIGHT + (90,))
    glow = glow.filter(ImageFilter.GaussianBlur(size * 0.025))
    img = Image.alpha_composite(img, glow)

    # Raio principal
    d = ImageDraw.Draw(img)
    draw_lightning_bolt(
        d, cx, cy, bolt_h,
        fill=WHITE,
        outline=EMERALD_LIGHT,
        outline_w=max(1, size // 96),
    )

    # Highlight no topo do raio (brilho)
    highlight = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    hd = ImageDraw.Draw(highlight)
    # Pequena elipse branca semi-transparente no topo
    hd.ellipse(
        [cx - bolt_h * 0.06, cy - bolt_h * 0.46,
         cx + bolt_h * 0.18, cy - bolt_h * 0.30],
        fill=(255, 255, 255, 110),
    )
    highlight = highlight.filter(ImageFilter.GaussianBlur(size * 0.015))
    img = Image.alpha_composite(img, highlight)

    return img


def main():
    print("Gerando ícones do MeuCorre...")

    # 192x192 (padrão PWA)
    icon_192 = make_icon(192, maskable=False)
    icon_192.save(os.path.join(OUT_DIR, "icon-192.png"), "PNG", optimize=True)
    print("  ✓ icon-192.png")

    # 512x512 (padrão PWA + maskable)
    icon_512 = make_icon(512, maskable=False)
    icon_512.save(os.path.join(OUT_DIR, "icon-512.png"), "PNG", optimize=True)
    print("  ✓ icon-512.png")

    icon_maskable = make_icon(512, maskable=True)
    icon_maskable.save(os.path.join(OUT_DIR, "icon-maskable-512.png"), "PNG", optimize=True)
    print("  ✓ icon-maskable-512.png")

    # apple-touch-icon 180x180 (iOS usa fundo quadrado, sem transparência)
    icon_apple = make_icon(180, maskable=False)
    # iOS não gosta de transparência — coloca fundo sólido
    bg_apple = Image.new("RGB", (180, 180), ZINC_950)
    bg_apple.paste(icon_apple, (0, 0), icon_apple)
    bg_apple.save(os.path.join(OUT_DIR, "apple-touch-icon.png"), "PNG", optimize=True)
    print("  ✓ apple-touch-icon.png")

    # favicon 32x32
    icon_32 = make_icon(32, maskable=False)
    icon_32.save(os.path.join(OUT_DIR, "favicon-32.png"), "PNG", optimize=True)
    print("  ✓ favicon-32.png")

    print("\nTodos os ícones gerados em:", OUT_DIR)


if __name__ == "__main__":
    main()
