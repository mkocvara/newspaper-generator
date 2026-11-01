"""Generate the aged paper's stain layer: a transparent PNG laid over the whole
A4 sheet. Organic shapes come from fractal value noise, so nothing looks drawn
with a compass. Usage: python3 scripts/make-stains.py src/assets/aged-stains.png (needs numpy and Pillow)."""
import sys

import numpy as np
from PIL import Image, ImageFilter

W, H = 840, 1188  # A4 proportions; stretched over the page, soft by nature
rng = np.random.default_rng(1907)
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)


def value_noise(scale, seed):
    """Smooth noise in [0, 1] with features about `scale` px apart."""
    r = np.random.default_rng(seed)
    gh, gw = int(H / scale) + 3, int(W / scale) + 3
    grid = r.random((gh, gw)).astype(np.float32)
    gy, gx = yy / scale, xx / scale
    y0, x0 = gy.astype(int), gx.astype(int)
    fy, fx = gy - y0, gx - x0
    fy, fx = fy * fy * (3 - 2 * fy), fx * fx * (3 - 2 * fx)
    a = grid[y0, x0] * (1 - fx) + grid[y0, x0 + 1] * fx
    b = grid[y0 + 1, x0] * (1 - fx) + grid[y0 + 1, x0 + 1] * fx
    return a * (1 - fy) + b * fy


def fractal(scale, seed, octaves=4):
    total, amp, norm = 0, 1.0, 0
    for i in range(octaves):
        total = total + value_noise(scale / 2**i, seed + i) * amp
        norm += amp
        amp *= 0.5
    return total / norm


def angular_noise(theta, seed, bumps=7, amount=1.0):
    """Smooth periodic wobble around a circle."""
    r = np.random.default_rng(seed)
    out = np.zeros_like(theta)
    for k in range(1, bumps + 1):
        out += r.normal(0, amount / k) * np.cos(k * theta + r.uniform(0, 2 * np.pi))
    return out


alpha = np.zeros((H, W), np.float32)
detail = fractal(40, 11)  # shared fine variation


def coffee_ring(cx, cy, radius, seed, strength):
    dx, dy = xx - cx, yy - cy
    dist = np.hypot(dx, dy)
    theta = np.arctan2(dy, dx)
    edge = radius * (1 + 0.035 * angular_noise(theta, seed, 9))
    width = radius * (0.035 + 0.02 * (angular_noise(theta, seed + 1, 5) + 1))
    # Outside of the rim: a sharp edge where the coffee dried; inside: softer.
    d = dist - edge
    rim = np.where(d > 0, np.exp(-((d / (width * 0.45)) ** 2)), np.exp(-((d / width) ** 2)))
    # The rim fades out in places, as rings rarely close perfectly.
    fade = np.clip(0.35 + 0.9 * angular_noise(theta, seed + 2, 4, 0.8), 0.15, 1)
    fill = np.clip(1 - dist / edge, 0, 1) ** 0.4 * 0.12 * (0.6 + 0.8 * detail)
    return strength * (rim * fade * (0.75 + 0.5 * detail) + fill * (dist < edge))


def water_stain(cx, cy, rx, ry, seed, strength):
    # A noisy blob: an ellipse whose outline is pushed around by broad lumps
    # plus a little fine raggedness.
    warp = (fractal(rx * 1.4, seed, 3) - 0.5) * 0.75 + (fractal(rx * 0.22, seed + 1, 3) - 0.5) * 0.22
    shape = np.hypot((xx - cx) / rx, (yy - cy) / ry) + warp
    inside = np.clip((1 - shape) * 5, 0, 1)
    # Tide line: a darker band just inside the outline, thicker and fainter
    # in places.
    band = 0.035 + 0.035 * fractal(rx * 0.5, seed + 2, 3)
    tide = np.exp(-(((shape - 0.95) / band) ** 2)) * (shape < 1.03)
    tide_strength = np.clip(0.15 + 1.3 * fractal(rx * 0.7, seed + 3, 3), 0, 1)
    # Mottled inside: darker where water pooled, almost clear elsewhere.
    mottle = np.clip(fractal(rx * 0.4, seed + 7, 4) * 1.6 - 0.45, 0, 1)
    return strength * (inside * (0.12 + 0.45 * mottle) + tide * tide_strength * (0.7 + 0.5 * detail))


def foxing(cx, cy, size, seed, strength):
    n = fractal(size * 1.5, seed, 3)
    shape = np.hypot(xx - cx, yy - cy) / size + (n - 0.5) * 1.1
    return strength * np.clip(1 - shape, 0, 1) ** 0.7


layers = [
    coffee_ring(0.79 * W, 0.15 * H, 0.105 * W, 21, 0.55),
    coffee_ring(0.735 * W, 0.19 * H, 0.1 * W, 37, 0.22),  # set down twice
    water_stain(0.2 * W, 0.86 * H, 0.2 * W, 0.075 * H, 51, 0.42),
    water_stain(0.34 * W, 0.77 * H, 0.1 * W, 0.05 * H, 63, 0.32),
    water_stain(0.9 * W, 0.57 * H, 0.12 * W, 0.06 * H, 75, 0.22),
    water_stain(0.47 * W, 0.9 * H, 0.03 * W, 0.022 * H, 81, 0.3),
    water_stain(0.09 * W, 0.71 * H, 0.025 * W, 0.02 * H, 87, 0.28),
]
# Foxing: loose clusters of small irregular spots.
for i, (fx, fy) in enumerate([(0.12, 0.22), (0.62, 0.44), (0.41, 0.09), (0.7, 0.91), (0.93, 0.33), (0.06, 0.6)]):
    for j in range(rng.integers(2, 5)):
        ox, oy = rng.normal(0, 0.012), rng.normal(0, 0.009)
        size = rng.uniform(2.2, 5.5) * (1 if j == 0 else 0.6)
        layers.append(foxing((fx + ox) * W, (fy + oy) * H, size, 100 + i * 10 + j, rng.uniform(0.45, 0.8)))

for layer in layers:
    alpha = 1 - (1 - alpha) * (1 - np.clip(layer, 0, 1))  # combine like overlapping stains

# Stain colour: brown, a touch darker where the stain is denser.
a = np.clip(alpha, 0, 1)
r = (128 - 30 * a).astype(np.uint8)
g = (84 - 26 * a).astype(np.uint8)
b = (32 - 12 * a).astype(np.uint8)
img = Image.fromarray(np.dstack([r, g, b, (a * 255).astype(np.uint8)]), 'RGBA')
img = img.filter(ImageFilter.GaussianBlur(0.6))
img.save(sys.argv[1], optimize=True)
print(img.size)
