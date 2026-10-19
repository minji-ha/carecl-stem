# 흰 배경 제품 사진 → 투명 PNG (테두리와 이어진 흰 영역만 지운다)
import sys
from PIL import Image, ImageDraw, ImageFilter, ImageChops
SRC = r"C:/work/carecl/자료/drive/2. 제품 누끼/01_누끼컷/"
DEV = r"C:/work/carecl/자료/3d용_기기사진/01_front_투명.png"
OUT = r"C:/work/carecl/publish_stem/assets/img/"

def cut(path, th=236):
    im = Image.open(path).convert("RGB"); im.thumbnail((1600, 1600), Image.LANCZOS)
    r, g, b = im.split()
    lo = ImageChops.darker(ImageChops.darker(r, g), b)
    m = lo.point(lambda v: 255 if v > th else 0)
    W, H = m.size
    for p in [(0, 0), (W - 1, 0), (0, H - 1), (W - 1, H - 1)]:
        if m.getpixel(p) == 255: ImageDraw.floodfill(m, p, 128)
    bgm = m.point(lambda v: 255 if v == 128 else 0).filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(1.2))
    a = ImageChops.invert(bgm)
    out = im.convert("RGBA"); out.putalpha(a)
    return out.crop(out.getbbox())

def fit(im, n=900):
    im = im.copy(); im.thumbnail((n, n), Image.LANCZOS); return im

gel = cut(SRC + "콜라겐젤.jpg", 251); serum = cut(SRC + "토닝세럼.jpg", 248); mask = cut(SRC + "마스크팩.jpg")
dev = Image.open(DEV).convert("RGBA"); dev = dev.crop(dev.getbbox())
for name, im in [("cut-gel", gel), ("cut-mask", mask), ("cut-device", dev), ("cut-serum", serum)]:
    fit(im).save(OUT + name + ".png", optimize=True)

# 05 라인업: 마스크팩 뒤, 기기·젤·세럼 앞
H = 900
def h(im, hh): im = im.copy(); w = round(im.width * hh / im.height); return im.resize((w, hh), Image.LANCZOS)
d, g_, s_, mk = h(dev, 820), h(gel, 600), h(serum, 560), h(mask, 470)
W = 1000; canvas = Image.new("RGBA", (W, H), (0, 0, 0, 0))
canvas.alpha_composite(mk, (40, H - mk.height - 170))
canvas.alpha_composite(g_, (330, H - g_.height - 20))
canvas.alpha_composite(d, (520, H - d.height - 20))
canvas.alpha_composite(s_, (700, H - s_.height - 20))
canvas = canvas.crop(canvas.getbbox()); fit(canvas).save(OUT + "cut-lineup.png", optimize=True)
print("ok")
