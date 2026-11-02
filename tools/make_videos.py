"""Render the homepage videos for Reverb Merch.

Usage: python make_videos.py <repo_dir> <mockup_png_dir>
Writes videos/*.mp4 and videos/*-poster.jpg into the repo.
"""
import sys, os, json, math, subprocess
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import imageio_ffmpeg

REPO, MK = sys.argv[1], sys.argv[2]
OUT = os.path.join(REPO, 'videos'); os.makedirs(OUT, exist_ok=True)
FF = imageio_ffmpeg.get_ffmpeg_exe()
FPS = 24
P, M, DARK = (107, 45, 139), (212, 0, 106), (22, 9, 31)
FD = 'C:/Windows/Fonts/'
def font(name, size): return ImageFont.truetype(FD + name, size)
BLACK, BOLD, SEMI, REG = 'seguibl.ttf', 'segoeuib.ttf', 'seguisb.ttf', 'segoeui.ttf'

def clamp(x, a=0., b=1.): return max(a, min(b, x))
def ease_out(t): t = clamp(t); return 1 - (1 - t) ** 3
def ease_io(t): t = clamp(t); return 4*t*t*t if t < .5 else 1 - (-2*t + 2) ** 3 / 2
def back_out(t, s=1.7):
    t = clamp(t) - 1; return t*t*((s + 1)*t + s) + 1
def mix(a, b, t): return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))

def gradient(w, h, c0, c1, shift=0.):
    """Diagonal gradient; shift slides it for a slow animated sheen."""
    g = Image.linear_gradient('L').rotate(-45, expand=True).resize((w*2, h*2))
    ox = int((math.sin(shift)*.5 + .5) * w * .6)
    g = g.crop((ox, ox//2, ox + w, ox//2 + h))
    return Image.composite(Image.new('RGB', (w, h), c1), Image.new('RGB', (w, h), c0), g)

class Writer:
    def __init__(self, name, w, h, crf=27):
        self.path = os.path.join(OUT, name); self.w, self.h = w, h; self.n = 0
        self.p = subprocess.Popen([FF, '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24',
            '-s', f'{w}x{h}', '-r', str(FPS), '-i', '-', '-c:v', 'libx264', '-preset', 'slow', '-crf', str(crf),
            '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', self.path], stdin=subprocess.PIPE)
    def add(self, im):
        if im.size != (self.w, self.h): im = im.resize((self.w, self.h), Image.LANCZOS)
        self.p.stdin.write(im.convert('RGB').tobytes()); self.n += 1
    def close(self):
        self.p.stdin.close(); self.p.wait()
        print(os.path.basename(self.path), f'{self.n/FPS:.1f}s', f'{os.path.getsize(self.path)/1e6:.2f}MB')

def poster(im, name): im.convert('RGB').save(os.path.join(OUT, name), quality=82)

def text_w(d, s, f): return d.textlength(s, font=f)

def white_logo(h):
    lg = Image.open(os.path.join(REPO, 'images/logo.png')).convert('RGBA')
    a = lg.split()[3]; w = Image.new('RGBA', lg.size, (255, 255, 255, 255)); w.putalpha(a)
    return w.resize((int(lg.width*h/lg.height), h), Image.LANCZOS)

def autocrop(img, thr=246):
    """Trim near-white padding rows/columns some portfolio photos carry."""
    g = img.convert('L'); w, h = g.size; px = g.load()
    # a row/column is padding when 90% of it is light (catches thin grey frame lines too)
    def row_white(y): xs = range(0, w, 4); return sum(px[x, y] > 212 for x in xs) >= .9*len(xs)
    def col_white(x): ys = range(0, h, 4); return sum(px[x, y] > 212 for y in ys) >= .9*len(ys)
    top = next((y for y in range(h) if not row_white(y)), 0)
    # Branded templates put a white footer with logos under the photo: stop at
    # the first run of 20 white rows after the photo starts.
    bot, run = h - 1, 0
    for y in range(top, h):
        run = run + 1 if row_white(y) else 0
        if run >= 20: bot = y - run; break
    lef = next((x for x in range(w) if not col_white(x)), 0); rig = next((x for x in range(w - 1, -1, -1) if not col_white(x)), w - 1)
    ix, iy = int((rig - lef)*.03), int((bot - top)*.03)  # drop thin frame lines at the edges
    return img.crop((lef + ix, top + iy, rig + 1 - ix, bot + 1 - iy))

def kenburns(img, w, h, t, seed):
    """Slow zoom + pan crop of `img` to w x h for progress t in [0,1]."""
    iw, ih = img.size
    base = max(w/iw, h/ih)
    z0, z1 = (1.0, 1.14) if seed % 2 == 0 else (1.14, 1.0)
    z = z0 + (z1 - z0) * ease_io(t)
    cw, ch = w/(base*z), h/(base*z)
    dirs = [(0, -1), (0, 1), (1, 0), (-1, 0)]
    dx, dy = dirs[seed % 4]
    cx = iw/2 + dx*(iw - cw)/2*(t*2 - 1)*.8
    cy = ih/2 + dy*(ih - ch)/2*(t*2 - 1)*.8
    box = (cx - cw/2, cy - ch/2, cx + cw/2, cy + ch/2)
    return img.resize((w, h), Image.BICUBIC, box=box)

PORT = json.load(open(os.path.join(REPO, 'data/portfolio.json'), encoding='utf-8'))['items']
CAT = {'gifts': 'Corporate Gifts', 'employee': 'Employee Kits', 'apparel': 'Apparel', 'events': 'Events',
       'packaging': 'Packaging', 'stationery': 'Stationery'}

# ---------------------------------------------------------------- showreel
def showreel():
    W, H = 1280, 720
    # Captions written from what each photo shows (several portfolio.json titles
    # are attached to the wrong image).
    picks = [
        {'image': PORT[1]['image'], 'cat': 'employee', 'title': 'Fiber Mountain Welcome Kit', 'desc': 'Notebook, flask, mug and mask in a custom-fit box'},
        {'image': PORT[0]['image'], 'cat': 'employee', 'title': 'ibex Onboarding Kit', 'desc': 'Full welcome kit for new hires, 500 units in 3 weeks'},
        {'image': PORT[2]['image'], 'cat': 'gifts', 'title': 'Vodworks Swag Box', 'desc': 'Curated swag box with branded merchandise'},
        {'image': PORT[6]['image'], 'cat': 'gifts', 'title': 'Unlayer Corporate Set', 'desc': 'All-black executive set with tonal branding'},
        {'image': PORT[7]['image'], 'cat': 'apparel', 'title': 'Noon Brand Merch', 'desc': 'Apparel, drinkware and stationery in one line'},
        {'image': PORT[4]['image'], 'cat': 'employee', 'title': 'Technomites Full Kit', 'desc': 'Flask, mug, pen, keychain and notebook'},
        {'image': PORT[10]['image'], 'cat': 'packaging', 'title': 'Mozack Welcome Box', 'desc': 'Printed lid message and fitted foam insert'},
        {'image': PORT[11]['image'], 'cat': 'events', 'title': 'Investkar Flasks', 'desc': 'Campaign-branded flasks for an event drop'},
        {'image': PORT[13]['image'], 'cat': 'gifts', 'title': 'Lincoln Corners Mugs', 'desc': 'Engraved matte mugs with full wrap branding'},
    ]
    imgs = [autocrop(Image.open(os.path.join(REPO, it['image'])).convert('RGB')) for it in picks]
    wr = Writer('showreel.mp4', W, H)
    big, mid, small = font(BLACK, 76), font(BOLD, 30), font(SEMI, 22)
    logo = white_logo(64)
    # intro 1.8s
    n = int(1.8*FPS)
    for f in range(n):
        t = f/n; fr = gradient(W, H, P, M, t*2)
        d = ImageDraw.Draw(fr)
        a = ease_out(t*2.2)
        lg = logo.copy(); lg.putalpha(lg.split()[3].point(lambda v: int(v*a)))
        fr.paste(lg, (int((W - lg.width)/2), int(210 + 30*(1 - a))), lg)
        s = 'Merch That Makes Your Brand'
        b = ease_out((t - .2)*2.2)
        txt = Image.new('RGBA', (W, H)); td = ImageDraw.Draw(txt)
        td.text((W/2, 360 + 30*(1 - b)), s, font=font(BOLD, 44), fill=(255, 255, 255, int(255*b)), anchor='mm')
        c = ease_out((t - .35)*2.2)
        td.text((W/2, 440 + 30*(1 - c)), 'UNFORGETTABLE', font=big, fill=(255, 255, 255, int(255*c)), anchor='mm')
        fr.paste(txt, (0, 0), txt); wr.add(fr)
    first = None
    # slides
    SL, XF = int(1.7*FPS), int(.35*FPS)
    frames_prev = None
    for i, (img, it) in enumerate(zip(imgs, picks)):
        for f in range(SL):
            t = f/SL
            fr = kenburns(img, W, H, t, i)
            # lower-third
            band = Image.new('RGBA', (W, H)); bd = ImageDraw.Draw(band)
            for y in range(H - 260, H):
                al = int(200*((y - (H - 260))/260)**1.4); bd.line([(0, y), (W, y)], fill=(30, 10, 45, al))
            a = ease_out((f - 3)/10); dx = int(-40*(1 - a))
            tag = CAT.get(it['cat'], 'Project').upper()
            tw = text_w(bd, tag, small)
            bd.rounded_rectangle((60 + dx, H - 175, 60 + dx + tw + 32, H - 141), radius=17, fill=(212, 0, 106, int(235*a)))
            bd.text((76 + dx, H - 158), tag, font=small, fill=(255, 255, 255, int(255*a)), anchor='lm')
            a2 = ease_out((f - 6)/10); dx2 = int(-40*(1 - a2))
            bd.text((60 + dx2, H - 92), it['title'], font=font(BLACK, 50), fill=(255, 255, 255, int(255*a2)), anchor='lm')
            a3 = ease_out((f - 9)/10)
            bd.text((62, H - 48), it['desc'][:70], font=font(REG, 24), fill=(255, 255, 255, int(215*a3)), anchor='lm')
            # progress bar
            prog = (i + t)/len(imgs)
            bd.rectangle((0, H - 6, int(W*prog), H), fill=(212, 0, 106, 255))
            fr = fr.convert('RGBA'); fr.alpha_composite(band); fr = fr.convert('RGB')
            if i == 0 and f == SL//2: first = fr.copy()
            if f < XF and frames_prev is not None:
                fr = Image.blend(frames_prev, fr, ease_io(f/XF))
            wr.add(fr)
        frames_prev = fr
    # outro 2.2s
    n = int(2.2*FPS)
    for f in range(n):
        t = f/n; fr = gradient(W, H, P, M, 2 + t*2)
        if f < XF: fr = Image.blend(frames_prev, fr, ease_io(f/XF))
        txt = Image.new('RGBA', (W, H)); td = ImageDraw.Draw(txt)
        stats = [('500+', 'Orders delivered'), ('600+', 'Brands served'), ('24h', 'Mockup turnaround')]
        for k, (num, lab) in enumerate(stats):
            a = ease_out((t - .08*k)*2.5); x = W/2 + (k - 1)*360
            td.text((x, 290 + 30*(1 - a)), num, font=font(BLACK, 92), fill=(255, 255, 255, int(255*a)), anchor='mm')
            td.text((x, 362 + 30*(1 - a)), lab, font=font(SEMI, 26), fill=(255, 255, 255, int(220*a)), anchor='mm')
        b = ease_out((t - .4)*2.5)
        bw = 420
        td.rounded_rectangle((W/2 - bw/2, 470, W/2 + bw/2, 540), radius=35, fill=(255, 255, 255, int(255*b)))
        td.text((W/2, 505), 'Get a free quote  →', font=font(BOLD, 30), fill=P + (int(255*b),), anchor='mm')
        fr = fr.convert('RGBA'); fr.alpha_composite(txt); wr.add(fr.convert('RGB'))
    wr.close(); poster(first, 'showreel-poster.jpg')

# ---------------------------------------------------------------- hero loop
def hero_loop():
    W, H = 1280, 720
    # Avoids the two photos already shown beside the video in the hero.
    files = ['images/vodworks-gift-set.jpg', 'images/ibex-onboarding-kit.jpg', 'images/vodworks-swag-box.jpg',
             'images/unlayer-corporate-set.jpg', 'images/noon-brand-merch.jpg', 'images/fiber-mountain-kit.jpg']
    imgs = [autocrop(Image.open(os.path.join(REPO, f)).convert('RGB')) for f in files]
    wr = Writer('hero-loop.mp4', W, H, crf=28)
    SL, XF = int(2.0*FPS), int(.5*FPS)
    seq = []
    for i, img in enumerate(imgs):
        seq.append([kenburns(img, W, H, f/(SL + XF), i) for f in range(SL + XF)])
    first = None
    for i in range(len(imgs)):
        cur, nxt = seq[i], seq[(i + 1) % len(imgs)]
        for f in range(XF, SL + XF):
            fr = cur[f]
            # last XF frames crossfade into the next clip's opening frames -> seamless loop
            if f >= SL: fr = Image.blend(fr, nxt[f - SL], ease_io((f - SL)/XF))
            if first is None: first = fr
            wr.add(fr)
    wr.close(); poster(first, 'hero-loop-poster.jpg')

# ---------------------------------------------------------------- logo on everything
def logo_everything():
    W, H = 960, 768
    order = ['Mug', 'T-Shirt', 'Hoodie', 'Tote', 'Cap', 'Gift_Box', 'Diary', 'Sports_Bottle', 'Paper_Bag', 'Keychain', 'Button_Badge', 'Notebook']
    shots = [(n.replace('_', ' '), Image.open(os.path.join(MK, n + '.png')).convert('RGB').resize((W, H), Image.LANCZOS)) for n in order if os.path.exists(os.path.join(MK, n + '.png'))]
    wr = Writer('logo-on-everything.mp4', W, H)
    # title card
    n = int(1.4*FPS); first = None
    for f in range(n):
        t = f/n; fr = gradient(W, H, DARK, P, t*2); txt = Image.new('RGBA', (W, H)); td = ImageDraw.Draw(txt)
        a = ease_out(t*2.4); b = ease_out((t - .2)*2.4)
        td.text((W/2, 330 + 30*(1 - a)), 'Your logo.', font=font(BLACK, 84), fill=(255, 255, 255, int(255*a)), anchor='mm')
        td.text((W/2, 430 + 30*(1 - b)), 'On everything.', font=font(BLACK, 84), fill=M + (int(255*b),), anchor='mm')
        fr = fr.convert('RGBA'); fr.alpha_composite(txt); wr.add(fr.convert('RGB'))
    prev = fr.convert('RGB')
    SL, TR = int(1.0*FPS), int(.3*FPS)
    lab = font(BOLD, 28)
    for i, (name, img) in enumerate(shots):
        for f in range(SL):
            t = f/SL; z = 1 + .05*t
            cur = img.resize((W, H), Image.BICUBIC, box=(W*(1 - 1/z)/2, H*(1 - 1/z)/2, W - W*(1 - 1/z)/2, H - H*(1 - 1/z)/2))
            if f < TR:  # push transition: new slide comes in from the right
                k = ease_io(f/TR); off = int(W*(1 - k))
                fr = Image.new('RGB', (W, H)); fr.paste(prev, (off - W, 0)); fr.paste(cur, (off, 0))
            else: fr = cur.copy()
            ov = Image.new('RGBA', (W, H)); od = ImageDraw.Draw(ov)
            a = ease_out((f - TR)/8)
            tw = text_w(od, name, lab)
            od.rounded_rectangle((36, 36, 36 + tw + 44, 92), radius=28, fill=(255, 255, 255, int(235*a)))
            od.text((58, 64), name, font=lab, fill=P + (int(255*a),), anchor='lm')
            od.text((W - 40, 64), f'{i + 1:02d} / {len(shots):02d}', font=font(SEMI, 22), fill=(107, 45, 139, int(200*a)), anchor='rm')
            fr = fr.convert('RGBA'); fr.alpha_composite(ov); fr = fr.convert('RGB')
            if i == 0 and f == SL - 1: first = fr
            wr.add(fr)
        prev = fr
    n = int(1.6*FPS)
    for f in range(n):
        t = f/n; fr = gradient(W, H, P, M, t*2)
        if f < TR: fr = Image.blend(prev, fr, ease_io(f/TR))
        txt = Image.new('RGBA', (W, H)); td = ImageDraw.Draw(txt)
        a = ease_out(t*2.4); b = ease_out((t - .25)*2.4)
        td.text((W/2, 330 + 30*(1 - a)), 'Try it with your logo', font=font(BLACK, 62), fill=(255, 255, 255, int(255*a)), anchor='mm')
        td.text((W/2, 420 + 30*(1 - b)), '19 products · free mockup tool', font=font(SEMI, 32), fill=(255, 255, 255, int(220*b)), anchor='mm')
        fr = fr.convert('RGBA'); fr.alpha_composite(txt); wr.add(fr.convert('RGB'))
    wr.close(); poster(first, 'logo-on-everything-poster.jpg')

# ---------------------------------------------------------------- process motion graphic
def process():
    W, H, SS = 1280, 720, 2  # supersampled for smooth shapes
    w, h = W*SS, H*SS
    wr = Writer('process.mp4', W, H)
    steps = [('Share Brief', 'Occasion, quantity, budget', 'chat'), ('We Design', 'Mockups within 24 hours', 'pen'),
             ('You Approve', 'Nothing prints without sign-off', 'check'), ('We Deliver', 'Packed, branded, on time', 'box')]
    xs = [w*(.14 + .24*i) for i in range(4)]; cy = h*.52; R = 86*SS
    TOT = int(9*FPS); first = None
    bg0 = Image.new('RGB', (w, h), DARK)
    orb = Image.new('RGB', (w, h), DARK); od = ImageDraw.Draw(orb)
    od.ellipse((w*.6, -h*.4, w*1.3, h*.6), fill=P); od.ellipse((-w*.2, h*.5, w*.35, h*1.3), fill=(120, 0, 62))
    orb = orb.filter(ImageFilter.GaussianBlur(160*SS/2))
    def icon(d, kind, x, y, s, col):
        lw = int(7*SS)
        if kind == 'chat':
            d.rounded_rectangle((x - s, y - s*.75, x + s, y + s*.55), radius=int(s*.35), outline=col, width=lw)
            d.polygon([(x - s*.45, y + s*.5), (x - s*.7, y + s*.95), (x - s*.05, y + s*.5)], fill=col)
            for k in (-1, 0, 1): d.ellipse((x + k*s*.45 - s*.11, y - s*.21, x + k*s*.45 + s*.11, y + s*.01), fill=col)
        elif kind == 'pen':
            d.line([(x - s*.7, y + s*.7), (x + s*.55, y - s*.55)], fill=col, width=int(lw*2.2))
            d.polygon([(x - s*.95, y + s*.95), (x - s*.82, y + s*.45), (x - s*.45, y + s*.82)], fill=col)
            d.line([(x + s*.3, y - s*.8), (x + s*.8, y - s*.3)], fill=col, width=lw)
        elif kind == 'check':
            d.ellipse((x - s, y - s, x + s, y + s), outline=col, width=lw)
            d.line([(x - s*.45, y + s*.02), (x - s*.1, y + s*.38), (x + s*.5, y - s*.35)], fill=col, width=int(lw*1.4), joint='curve')
        else:
            d.polygon([(x, y - s*.95), (x + s, y - s*.45), (x, y + .05*s), (x - s, y - s*.45)], outline=col, width=lw)
            d.line([(x - s, y - s*.45), (x - s, y + s*.6), (x, y + s*1.05), (x + s, y + s*.6), (x + s, y - s*.45)], fill=col, width=lw, joint='curve')
            d.line([(x, y + .05*s), (x, y + s*1.05)], fill=col, width=lw)
    tf, sf, nf = font(BLACK, 32*SS), font(REG, 19*SS), font(BLACK, 30*SS)
    hf = font(BLACK, 52*SS)
    for f in range(TOT):
        sec = f/FPS
        fr = Image.blend(bg0, orb, .55 + .1*math.sin(sec*1.3)).convert('RGBA')
        d = ImageDraw.Draw(fr)
        a = ease_out(sec/0.6)
        d.text((w/2, h*.15 + 30*SS*(1 - a)), 'From Brief to Delivery', font=hf, fill=(255, 255, 255, int(255*a)), anchor='mm')
        d.text((w/2, h*.235), 'in 4 simple steps', font=font(SEMI, 26*SS), fill=(255, 150, 200, int(255*ease_out((sec - .3)/.6))), anchor='mm')
        # connecting line draws across
        lp = ease_io((sec - .6)/5.0)
        if lp > 0:
            x0, x1 = xs[0], xs[0] + (xs[-1] - xs[0])*lp
            d.line([(x0, cy), (xs[-1], cy)], fill=(255, 255, 255, 40), width=4*SS)
            d.line([(x0, cy), (x1, cy)], fill=M + (255,), width=6*SS)
        for i, (title, sub, kind) in enumerate(steps):
            st = .8 + i*1.25
            p = back_out((sec - st)/.55); q = ease_out((sec - st - .25)/.6)
            if sec < st: continue
            r = R*max(0, p)
            done = sec > st + .5
            d.ellipse((xs[i] - r - 10*SS, cy - r - 10*SS, xs[i] + r + 10*SS, cy + r + 10*SS), fill=(255, 255, 255, int(28*q)))
            d.ellipse((xs[i] - r, cy - r, xs[i] + r, cy + r), fill=mix(P, M, i/3) + (255,))
            if r > R*.5: icon(d, kind, xs[i], cy - 4*SS, R*.42*min(1, p), (255, 255, 255, 255))
            # step number badge
            bx, by = xs[i] + R*.72, cy - R*.72; br = 24*SS*min(1, max(0, p))
            d.ellipse((bx - br, by - br, bx + br, by + br), fill=(255, 255, 255, 255))
            if br > 10: d.text((bx, by), str(i + 1), font=font(BLACK, 26*SS), fill=P + (255,), anchor='mm')
            d.text((xs[i], cy + R + 60*SS + 20*SS*(1 - q)), title, font=tf, fill=(255, 255, 255, int(255*q)), anchor='mm')
            d.text((xs[i], cy + R + 108*SS + 20*SS*(1 - q)), sub, font=sf, fill=(230, 210, 240, int(230*q)), anchor='mm')
        e = ease_out((sec - 6.6)/.8)
        if e > 0:
            d.text((w/2, h*.93), 'Rush orders in 7 days  ·  Nationwide delivery  ·  reverbmerch.com', font=font(SEMI, 24*SS), fill=(255, 255, 255, int(220*e)), anchor='mm')
        fin = ease_io((sec - 8.4)/.6)  # fade out to dark for a clean loop
        out = fr.convert('RGB')
        if fin > 0: out = Image.blend(out, bg0, fin)
        out = out.resize((W, H), Image.LANCZOS)
        if f == int(7.5*FPS): first = out
        wr.add(out)
    wr.close(); poster(first, 'process-poster.jpg')

if __name__ == '__main__':
    which = sys.argv[3:] or ['showreel', 'hero', 'logo', 'process']
    if 'showreel' in which: showreel()
    if 'hero' in which: hero_loop()
    if 'logo' in which: logo_everything()
    if 'process' in which: process()
