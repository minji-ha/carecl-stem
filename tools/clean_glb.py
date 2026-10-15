# -*- coding: utf-8 -*-
"""Meshy GLB 텍스처 정리 — '조각'처럼 보이는 얼룩을 걷어내고 재질을 영역별로 다시 준다.

    python tools/clean_glb.py <원본.glb> <출력.glb>

Meshy 텍스처는 여러 방향 이미지를 투사해 만들면서 조명·그림자를 조각 단위로 구워 넣는다.
그래서 가까이 보면 네모난 조각마다 명암이 다르고 긁힌 줄이 생긴다.

이 스크립트는
  1) 원본 2K 색 텍스처에서 가는 줄·잡티를 지우고 (중간값 필터)
  2) 밝기로 흰 본체 / 은색·회색 / 검은 화면 세 영역을 나눈 뒤 (경계는 부드럽게)
  3) 영역마다 균일한 색과 광택(금속성·거칠기)을 새로 칠하고
  4) 조각 무늬를 만들던 노멀맵은 평평하게 바꾼다.
명암은 텍스처가 아니라 실시간 조명·환경맵이 만들기 때문에 표면이 매끈하게 보인다.
"""
import io
import json
import struct
import sys

import numpy as np
from PIL import Image, ImageFilter

SRC, DST = sys.argv[1], sys.argv[2]
OUT = 1024                                   # 최종 텍스처 크기

# 영역별 색(sRGB)과 광택 — glTF metallicRoughness: G=거칠기, B=금속성
WHITE = dict(rgb=(240, 240, 238), rough=0.30, metal=0.0)    # 무광에 가까운 흰 플라스틱
SILVER = dict(rgb=(198, 200, 203), rough=0.24, metal=1.0)   # 은색 헤드 · 세로 띠
BLACK = dict(rgb=(16, 16, 18), rough=0.12, metal=0.0)       # 검은 화면 창


def smoothstep(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


raw = open(SRC, "rb").read()
jlen = struct.unpack("<I", raw[12:16])[0]
gltf = json.loads(raw[20:20 + jlen])
bo = 20 + jlen
blen = struct.unpack("<I", raw[bo:bo + 4])[0]
BIN = raw[bo + 8:bo + 8 + blen]

mat = gltf["materials"][0]
src_of = lambda tex: gltf["textures"][tex["index"]]["source"]
i_base = src_of(mat["pbrMetallicRoughness"]["baseColorTexture"])
i_mr = src_of(mat["pbrMetallicRoughness"]["metallicRoughnessTexture"])
i_nrm = src_of(mat["normalTexture"])


def image_bytes(i):
    bv = gltf["bufferViews"][gltf["images"][i]["bufferView"]]
    o = bv.get("byteOffset", 0)
    return BIN[o:o + bv["byteLength"]]


# 1) 줄·잡티 제거 — 가는 긁힘(1~3px)은 사라지고 아이콘·글자(수십 px)는 남는다
base = Image.open(io.BytesIO(image_bytes(i_base))).convert("RGB")
base = base.filter(ImageFilter.MedianFilter(5))
a = np.asarray(base).astype(np.float32)
L = 0.299 * a[..., 0] + 0.587 * a[..., 1] + 0.114 * a[..., 2]
L = np.asarray(Image.fromarray(L.astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2))).astype(np.float32)

# 2) 세 영역 — 경계는 밝기 구간에 걸쳐 섞어 계단이 생기지 않게
w_black = 1 - smoothstep(45, 95, L)
w_white = smoothstep(205, 228, L)
w_silver = np.clip(1 - w_black - w_white, 0, 1)

# 3) 색 · 광택 다시 칠하기
def paint(key):
    return (w_white[..., None] * np.array(WHITE[key], np.float32)
            + w_silver[..., None] * np.array(SILVER[key], np.float32)
            + w_black[..., None] * np.array(BLACK[key], np.float32))

rgb = np.clip(paint("rgb"), 0, 255).astype(np.uint8)
rough = w_white * WHITE["rough"] + w_silver * SILVER["rough"] + w_black * BLACK["rough"]
metal = w_white * WHITE["metal"] + w_silver * SILVER["metal"] + w_black * BLACK["metal"]
mr = np.zeros_like(rgb)
mr[..., 1] = np.clip(rough * 255, 0, 255).astype(np.uint8)
mr[..., 2] = np.clip(metal * 255, 0, 255).astype(np.uint8)

def jpg(arr, q):
    im = Image.fromarray(arr).resize((OUT, OUT), Image.LANCZOS)
    buf = io.BytesIO(); im.save(buf, "JPEG", quality=q, optimize=True); return buf.getvalue()

def png_flat_normal():
    im = Image.new("RGB", (4, 4), (128, 128, 255))
    buf = io.BytesIO(); im.save(buf, "PNG"); return buf.getvalue()

new_img = {i_base: (jpg(rgb, 90), "image/jpeg"),
           i_mr: (jpg(mr, 92), "image/jpeg"),
           i_nrm: (png_flat_normal(), "image/png")}

# 4) GLB 다시 묶기
img_view = {img["bufferView"]: i for i, img in enumerate(gltf["images"])}
out = bytearray(); views = []
for vi, bv in enumerate(gltf["bufferViews"]):
    o = bv.get("byteOffset", 0)
    data = BIN[o:o + bv["byteLength"]]
    if vi in img_view:
        data, mime = new_img[img_view[vi]]
        gltf["images"][img_view[vi]]["mimeType"] = mime
    while len(out) % 4: out.append(0)
    nb = dict(bv); nb["byteOffset"] = len(out); nb["byteLength"] = len(data)
    views.append(nb); out += data
while len(out) % 4: out.append(0)
gltf["bufferViews"] = views
gltf["buffers"][0]["byteLength"] = len(out)
gltf["asset"]["generator"] = "careCL clean_glb (flat regions + PBR)"
js = json.dumps(gltf, separators=(",", ":")).encode()
while len(js) % 4: js += b" "
total = 12 + 8 + len(js) + 8 + len(out)
glb = (struct.pack("<4sII", b"glTF", 2, total) + struct.pack("<I4s", len(js), b"JSON") + js
       + struct.pack("<I4s", len(out), b"BIN\x00") + bytes(out))
open(DST, "wb").write(glb)
print("저장:", DST, len(glb) // 1024, "KB",
      "| 영역 비율 흰색 %.2f 은색 %.2f 검정 %.2f" % (w_white.mean(), w_silver.mean(), w_black.mean()))
