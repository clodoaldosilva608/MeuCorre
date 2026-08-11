#!/usr/bin/env python3
"""
Remove fundo branco de imagens de capacetes e salva como PNG com canal alpha.
Usa thresholding adaptativo: pixels próximos do branco viram transparentes.
"""
from PIL import Image, ImageChops
import os

def remove_white_bg(input_path, output_path, threshold=240):
    """Remove fundo branco de uma imagem.
    
    Args:
        input_path: caminho da imagem original (RGB)
        output_path: caminho de saída (PNG com alpha)
        threshold: pixels com R,G,B > threshold são considerados brancos
    """
    img = Image.open(input_path).convert("RGB")
    
    # Cria máscara: pixels brancos = 0 (transparente), outros = 255 (opaco)
    mask = Image.new("L", img.size, 0)
    pixels = img.load()
    mask_pixels = mask.load()
    
    width, height = img.size
    for y in range(height):
        for x in range(width):
            r, g, b = pixels[x, y]
            # Se todos os canais estão acima do threshold, é fundo branco
            if r > threshold and g > threshold and b > threshold:
                mask_pixels[x, y] = 0  # transparente
            else:
                # Quanto mais escuro o pixel, mais opaco
                # Usa a média invertida como opacidade
                brightness = (r + g + b) / 3
                if brightness > threshold - 20:
                    # Pixel muito claro mas não branco puro — semi-transparente
                    # (borda do capacete com anti-aliasing)
                    alpha = int(255 * (1 - (brightness - (threshold - 20)) / 20))
                    mask_pixels[x, y] = max(0, min(255, alpha))
                else:
                    mask_pixels[x, y] = 255  # opaco
    
    # Aplica máscara como canal alpha
    img_rgba = img.convert("RGBA")
    img_rgba.putalpha(mask)
    
    # Salva como PNG (preserva canal alpha)
    img_rgba.save(output_path, "PNG")
    
    # Estatísticas
    total = width * height
    transparent = sum(1 for y in range(height) for x in range(width) if mask_pixels[x, y] == 0)
    print(f"  {os.path.basename(output_path)}: {transparent}/{total} pixels transparent ({100*transparent/total:.1f}%)")
    
    return output_path

def main():
    helmets = [
        ("public/social-helmet-youtube.png", "public/social-helmet-youtube.png"),
        ("public/social-helmet-instagram.png", "public/social-helmet-instagram.png"),
        ("public/social-helmet-tiktok.png", "public/social-helmet-tiktok.png"),
        ("public/social-helmet-facebook.png", "public/social-helmet-facebook.png"),
    ]
    
    print("Removendo fundo branco dos capacetes...")
    for src, dst in helmets:
        # Backup temporário
        backup = src + ".bak"
        os.rename(src, backup)
        remove_white_bg(backup, dst, threshold=235)
        os.remove(backup)
    
    print("\nVerificando resultados...")
    for _, dst in helmets:
        img = Image.open(dst)
        print(f"  {os.path.basename(dst)}: mode={img.mode}, has_alpha={'A' in img.mode}")

if __name__ == "__main__":
    main()
