"""Make small JPEG thumbnails for the catalog PDF (not shipped to the website). Usage: python3 -I build/thumbs.py <repo-root>"""
import json, os, sys
from PIL import Image
root = sys.argv[1]
data = json.load(open(f"{root}/build/out/catalog-data.json"))
out = f"{root}/build/out/thumbs"; os.makedirs(out, exist_ok=True)
n = 0
for p in data["products"]:
    src = f"{root}/public{p['images'][0]}"
    im = Image.open(src).convert("RGB"); im.thumbnail((560, 700), Image.LANCZOS)
    im.save(f"{out}/{p['key']}.jpg", quality=72, optimize=True); n += 1
print("thumbs", n)
