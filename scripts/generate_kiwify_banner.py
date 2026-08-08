"""
Gera banner da Kiwify pra capa do produto MeuCorre PRO.
Tamanho 1200x630 (formato Open Graph / social share).
"""

from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os

OUT = "/home/z/my-project/download/kiwify-produto-banner.png"
W, H = 1200, 630

# Cores
ZINC_950 = (9, 9, 11)
ZINC_900 = (24, 24, 27)
EMERALD = (16, 185, 129)
EMERALD_LIGHT = (52, 211, 153)
EMERALD_DARK = (5, 150, 105)
WHITE = (250, 250, 250)

def font(size, bold=False):
    paths = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ]
    for p in paths:
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()

def draw_lightning(d, cx, cy, h, fill, outline=None, ow=0):
    w = h * 0.62
    pts = [
        (cx + w * 0.18, cy - h * 0.50),
        (cx - w * 0.32, cy + h * 0.02),
        (cx - w * 0.05, cy + h * 0.02),
        (cx - w * 0.18, cy + h * 0.50),
        (cx + w * 0.32, cy - h * 0.02),
        (cx + w * 0.05, cy - h * 0.02),
    ]
    d.polygon(pts, fill=fill, outline=outline, width=ow)

def gradient_bg():
    img = Image.new("RGB", (W, H), ZINC_950)
    px = img.load()
    for y in range(H):
        for x in range(W):
            t = (x / W + y / H) / 2
            r = int(ZINC_950[0] * (1 - t) + EMERALD_DARK[0] * t * 0.5)
            g = int(ZINC_950[1] * (1 - t) + EMERALD_DARK[1] * t * 0.5)
            b = int(ZINC_950[2] * (1 - t) + EMERALD_DARK[2] * t * 0.5)
            px[x, y] = (r, g, b)
    # Glow esmeralda no topo esquerdo
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    od.ellipse([-300, -200, 700, 500], fill=(16, 185, 129, 70))
    overlay = overlay.filter(ImageFilter.GaussianBlur(120))
    img = Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")
    return img

def main():
    print("Gerando banner MeuCorre PRO...")
    img = gradient_bg()
    d = ImageDraw.Draw(img)

    # Badge "PRO" no topo
    badge_font = font(28, bold=True)
    badge_text = "⚡ MEUCORRE PRO"
    bbox = d.textbbox((0, 0), badge_text, font=badge_font)
    bw = bbox[2] - bbox[0] + 40
    bh = bbox[3] - bbox[1] + 24
    bx, by = 80, 70
    d.rounded_rectangle([bx, by, bx + bw, by + bh], radius=bh // 2,
                       fill=(16, 185, 129), outline=EMERALD_LIGHT, width=2)
    d.text((bx + 20, by + 12), badge_text, font=badge_font, fill=ZINC_950)

    # Título principal
    title_font = font(72, bold=True)
    d.text((80, 180), "Pare de perder dinheiro",
           font=title_font, fill=WHITE)
    d.text((80, 270), "sem saber",
           font=title_font, fill=EMERALD_LIGHT)

    # Subtítulo
    sub_font = font(32)
    d.text((80, 390), "Plano vitalício para entregadores de aplicativo",
           font=sub_font, fill=(200, 200, 210))
    d.text((80, 435), "Pague uma vez. Use para sempre.",
           font=sub_font, fill=(200, 200, 210))

    # Features em colunas
    feat_font = font(22, bold=True)
    features = [
        "✓ Sem anúncios",
        "✓ Relatórios PDF",
        "✓ Backup em nuvem",
        "✓ Metas diárias",
    ]
    for i, feat in enumerate(features[:2]):
        d.text((80 + i * 280, 510), feat, font=feat_font, fill=EMERALD_LIGHT)
    for i, feat in enumerate(features[2:]):
        d.text((80 + i * 280, 555), feat, font=feat_font, fill=EMERALD_LIGHT)

    # Raio grande no canto direito (decorativo)
    draw_lightning(d, 970, 320, 280, fill=WHITE, outline=EMERALD_LIGHT, ow=6)

    # Glow atrás do raio
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    draw_lightning(gd, 970, 320, 320, fill=EMERALD + (100,))
    glow = glow.filter(ImageFilter.GaussianBlur(30))
    img = Image.alpha_composite(img.convert("RGBA"), glow).convert("RGB")

    # Redraw do raio por cima do glow
    d = ImageDraw.Draw(img)
    draw_lightning(d, 970, 320, 280, fill=WHITE, outline=EMERALD_LIGHT, ow=6)

    # Preço no canto inferior direito
    price_font = font(56, bold=True)
    price_label_font = font(20)
    d.text((970 - 150, 530), "Pagamento único", font=price_label_font, fill=(200, 200, 210))
    d.text((970 - 100, 555), "R$ 97", font=price_font, fill=EMERALD_LIGHT)

    img.save(OUT, "PNG", optimize=True)
    print(f"Banner salvo em: {OUT}")
    print(f"Tamanho: {img.size}")

if __name__ == "__main__":
    main()
