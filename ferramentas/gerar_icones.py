"""Gera os ícones do Contigo (gradiente coral → rosa, coração branco).
Uso: python3 ferramentas/gerar_icones.py   (escreve em public/icones e public/capturas)
"""
from PIL import Image, ImageDraw, ImageFilter
import numpy as np, math, os

RAIZ = os.path.join(os.path.dirname(__file__), '..', 'public')
CORAL = (226, 86, 60); LARANJA = (245, 138, 60); ROSA = (239, 90, 140)

def gradiente(n):
    y, x = np.mgrid[0:n, 0:n].astype(float) / (n - 1)
    t = np.clip((x + y) / 2, 0, 1)[..., None]           # diagonal 135°
    a = np.array(LARANJA, float); b = np.array(CORAL, float); c = np.array(ROSA, float)
    cor = np.where(t < 0.5, a + (b - a) * (t / 0.5), b + (c - b) * ((t - 0.5) / 0.5))
    return Image.fromarray(cor.astype('uint8'), 'RGB')

def coracao(n, escala, dy=0.03):
    """Máscara de coração centrado, ocupando `escala` do lado."""
    ss = 4; N = n * ss
    m = Image.new('L', (N, N), 0); d = ImageDraw.Draw(m)
    pts = []
    for i in range(720):
        t = i / 720 * 2 * math.pi
        x = 16 * math.sin(t) ** 3
        y = 13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t)
        pts.append((x, -y))
    xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
    w = max(xs) - min(xs); h = max(ys) - min(ys); s = N * escala / max(w, h)
    cx = N / 2; cy = N / 2 + N * dy - (max(ys) + min(ys)) / 2 * s
    d.polygon([(cx + x * s, cy + y * s) for x, y in pts], fill=255)
    return m.resize((n, n), Image.LANCZOS)

def arredondar(im, raio):
    n = im.size[0]; m = Image.new('L', (n * 4, n * 4), 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, n * 4 - 1, n * 4 - 1], radius=raio * 4, fill=255)
    m = m.resize((n, n), Image.LANCZOS)
    out = Image.new('RGBA', (n, n), (0, 0, 0, 0)); out.paste(im, (0, 0), m); return out

def icone(n, escala, sombra=True):
    base = gradiente(n).convert('RGBA')
    # brilho suave no canto
    brilho = Image.new('RGBA', (n, n), (0, 0, 0, 0)); bd = ImageDraw.Draw(brilho)
    bd.ellipse([-n * 0.35, -n * 0.55, n * 0.55, n * 0.35], fill=(255, 255, 255, 46))
    brilho = brilho.filter(ImageFilter.GaussianBlur(n * 0.08))
    base.alpha_composite(brilho)
    m = coracao(n, escala)
    if sombra:
        sm = Image.new('RGBA', (n, n), (0, 0, 0, 0)); sm.paste((126, 36, 23, 90), (0, int(n * 0.03)), m)
        base.alpha_composite(sm.filter(ImageFilter.GaussianBlur(n * 0.035)))
    branco = Image.new('RGBA', (n, n), (255, 255, 255, 255))
    base.paste(branco, (0, 0), m)
    return base

os.makedirs(os.path.join(RAIZ, 'icones'), exist_ok=True)
arredondar(icone(512, 0.60), 112).save(os.path.join(RAIZ, 'icones', 'icone-512.png'))
arredondar(icone(192, 0.60), 42).save(os.path.join(RAIZ, 'icones', 'icone-192.png'))
icone(512, 0.44).save(os.path.join(RAIZ, 'icones', 'icone-512-maskable.png'))   # zona segura: 40% central
icone(180, 0.60).convert('RGB').save(os.path.join(RAIZ, 'icones', 'apple-touch-icon.png'))  # iOS aplica a própria máscara
arredondar(icone(64, 0.62, sombra=False), 14).save(os.path.join(RAIZ, 'icones', 'favicon.png'))
print('ícones gerados')
