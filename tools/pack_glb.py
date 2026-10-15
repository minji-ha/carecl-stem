# -*- coding: utf-8 -*-
"""Meshy GLB를 웹용으로 다시 묶는다 — 높이를 사이트 기준(0.24)에 맞추고 텍스처를 줄인다.

    python tools/pack_glb.py <원본.glb> <출력.glb>

device3d.js는 디바이스 높이를 DEVICE_H(0.24)로 보고 카메라 거리를 잡는다.
Meshy에서 받은 모델은 높이가 2.0처럼 단위가 제각각이라 꼭짓점 좌표를 같은 비율로 줄인다.
텍스처는 색 2048, 금속·거칠기/노멀 1024로 줄인다 (화면에선 600px 안팎으로 보여 그 이상은 무게만 늘린다).
"""
import io
import json
import struct
import sys

import numpy as np
from PIL import Image

SRC, DST = sys.argv[1], sys.argv[2]
TARGET_H = 0.24

raw = open(SRC, "rb").read()
jlen = struct.unpack("<I", raw[12:16])[0]
gltf = json.loads(raw[20:20 + jlen])
bo = 20 + jlen
blen = struct.unpack("<I", raw[bo:bo + 4])[0]
BIN = bytearray(raw[bo + 8:bo + 8 + blen])

# 1) 높이 맞추기 — POSITION 접근자 좌표에 같은 배율을 곱한다
pos_acc = {p["attributes"]["POSITION"] for m in gltf["meshes"] for p in m["primitives"]}
lo = np.min([gltf["accessors"][i]["min"] for i in pos_acc], axis=0)
hi = np.max([gltf["accessors"][i]["max"] for i in pos_acc], axis=0)
k = TARGET_H / (hi[1] - lo[1])
for i in pos_acc:
    a = gltf["accessors"][i]
    bv = gltf["bufferViews"][a["bufferView"]]
    o = bv.get("byteOffset", 0) + a.get("byteOffset", 0)
    stride = bv.get("byteStride", 12)
    for v in range(a["count"]):
        s = o + v * stride
        x, y, z = struct.unpack_from("<3f", BIN, s)
        struct.pack_into("<3f", BIN, s, x * k, y * k, z * k)
    a["min"] = [c * k for c in a["min"]]
    a["max"] = [c * k for c in a["max"]]

# 2) 텍스처 줄이기
mat = gltf["materials"][0]
src_of = lambda t: gltf["textures"][t["index"]]["source"]
size = {src_of(mat["pbrMetallicRoughness"]["baseColorTexture"]): (2048, 88)}
if "metallicRoughnessTexture" in mat["pbrMetallicRoughness"]:
    size[src_of(mat["pbrMetallicRoughness"]["metallicRoughnessTexture"])] = (1024, 90)
if "normalTexture" in mat:
    size[src_of(mat["normalTexture"])] = (1024, 92)

img_view = {img["bufferView"]: i for i, img in enumerate(gltf["images"])}
out = bytearray(); views = []
for vi, bv in enumerate(gltf["bufferViews"]):
    o = bv.get("byteOffset", 0)
    data = bytes(BIN[o:o + bv["byteLength"]])
    if vi in img_view and img_view[vi] in size:
        px, q = size[img_view[vi]]
        im = Image.open(io.BytesIO(data)).convert("RGB")
        if im.width > px:
            im = im.resize((px, px), Image.LANCZOS)
        buf = io.BytesIO(); im.save(buf, "JPEG", quality=q, optimize=True)
        data = buf.getvalue()
        gltf["images"][img_view[vi]]["mimeType"] = "image/jpeg"
    while len(out) % 4: out.append(0)
    nb = dict(bv); nb["byteOffset"] = len(out); nb["byteLength"] = len(data)
    views.append(nb); out += data
while len(out) % 4: out.append(0)
gltf["bufferViews"] = views
gltf["buffers"][0]["byteLength"] = len(out)
js = json.dumps(gltf, separators=(",", ":")).encode()
while len(js) % 4: js += b" "
total = 12 + 8 + len(js) + 8 + len(out)
glb = (struct.pack("<4sII", b"glTF", 2, total) + struct.pack("<I4s", len(js), b"JSON") + js
       + struct.pack("<I4s", len(out), b"BIN\x00") + bytes(out))
open(DST, "wb").write(glb)
print("저장:", DST, len(glb) // 1024, "KB | 배율 %.4f" % k)
