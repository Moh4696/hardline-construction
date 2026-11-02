# HARDLINE asset prompts

Every billed Higgsfield job is also logged in `gen/hf_log.jsonl`.
Style reference (Ref 1) is Fady Shohdy's faceted portrait, used only as a style reference.

## 01 crew restyle (xai/grok-imagine-image-2.0, 2k, 2:1)
Inputs: source/crew_crop.png (image 1), source/refs/ref1_style.jpg (image 2)

```
Restyle image 1 into the art style of image 2. Keep the composition of image 1 exactly: the same four construction workers, same order, same positions and spacing, same poses, waist-up and cut off by the bottom edge. Three wear orange hard hats and the third man from the left wears a white hard hat. They wear work coveralls with collars and chest pockets. The second man holds a tablet in both hands at his chest, the fourth man holds a dark tablet low in both hands. Art style of image 2: a stylized 3D character sculpture, faces carved into flat chiseled planes like carved wood with crisp facet edges on the brow, cheekbones, nose and jaw, beards and stubble sculpted as fine grooved strands, slightly exaggerated proportions with strong square jaws and broad shoulders, matte painted surfaces, a premium 3D poster render. Expressions: proud, calm and confident, steady eyes looking straight at the viewer, mouths closed, not grumpy. Hard hats sculpted with small chips and scuffs. Coveralls deep red-orange (#D23A1C) with sculpted fabric folds. Lighting from image 2: a warm orange key light from the left and a cool teal rim light along the right-hand edges of every figure. Background: a perfectly flat solid magenta #FF00FF, no wall, no floor, no shadow on the background, no text, no logos, no icons, no buttons.
```

## 02 crew restyle, pushed (input: gen/crew_restyle_b.png + ref1)
```
Turn image 1 into a stylized 3D caricature sculpture exactly in the style of image 2, not a photo and not realistic skin. Keep image 1 composition: the same four construction workers in the same order, positions, poses and spacing, waist-up and cut off by the bottom edge, three orange hard hats and the white hard hat on the third man from the left, the tablets in the hands of the second and fourth men. Push the stylization like image 2: heads built from large flat carved planes with crisp hard facet edges, like faceted carved wood, slightly elongated and squared heads, massive square jaws, strong angular noses, heavy blocky eyebrows sculpted as solid dark slabs, eyes with sculpted heavy lids. Beards and stubble sculpted as thick dark grooved strands exactly like the beard in image 2. Hard hats as clean faceted sculpted shells with small chips. Coveralls deep red-orange with big simplified sculpted folds. Expressions proud, calm and confident, steady gaze at the viewer, mouths closed, dignified, not grumpy and not smiling broadly. Dramatic lighting like image 2: a warm orange key light from the left, deep soft shadows, and a strong cool teal rim light along the right-hand edges of faces, hats and shoulders. Background: perfectly flat solid magenta #FF00FF everywhere, no gradient, no shadow on the background, no text, no logos, no icons.
```

## 03 head-turn keyframes (grok edit of gen/rig/crop_L.png / crop_R.png, 1:1 2k)
M-L:
```
Edit image 1. Both men turn their heads about 35 degrees toward the left edge of the image and look toward the left edge, eyes following the turn. The heads stay level. Keep everything else exactly the same: same bodies, coveralls, hands, tablet, hard hats, faces, carved faceted 3D sculpture style, lighting, framing and the flat crimson background. Only the heads and necks change.
```
M-R:
```
Edit image 1. Both men turn their heads about 35 degrees toward the right edge of the image and look toward the right edge, eyes following the turn. The heads stay level. Keep everything else exactly the same: same bodies, coveralls, hands, tablet, hard hats, faces, carved faceted 3D sculpture style, lighting, framing and the flat crimson background. Only the heads and necks change.
```

## 04 NEW crew v2 (user: longer necks, fun art, outfits: engineering overalls, white tee, white singlet; photo is only a concept)
Input: source/refs/ref1_style.jpg only. xai/grok-imagine-image-2.0, 2k, 16:9
```
A stylized 3D caricature poster render in exactly the art style of image 1: characters carved into large flat faceted planes like carved wood with crisp facet edges, elongated heads, hair, beards and moustaches sculpted as thick grooved strands, matte painted surfaces, a warm orange key light from the left and a cool teal rim light along the right-hand edges of every figure. A fun lineup of four construction workers standing side by side in a row, facing the viewer, shown from the waist up and cut off by the bottom edge. Playful caricature proportions: every one of them has a comically long, stretched neck, even longer than in image 1, so the four heads sit high above their shoulders at clearly different heights, well apart from each other and never overlapping. From left to right: (1) a broad barrel-chested man in a white ribbed singlet with big carved arms folded, an orange hard hat, a huge grooved handlebar moustache, the longest neck of the four, one eyebrow cheekily raised. (2) a lanky South Asian engineer in navy denim engineering bib overalls over a white T-shirt, a white hard hat, round wire glasses, a carpenter pencil behind his ear, a rolled blueprint tucked under one arm, a calm knowing half-smile. (3) a stocky Black man in a plain white T-shirt with rolled sleeves, a yellow hard hat, a thick grooved curly beard, holding a yellow tape measure, a proud closed-mouth grin. (4) a wiry older man with orange coveralls unzipped and the sleeves tied around his waist over a white singlet, red ear defenders hanging around his long neck, an orange hard hat, neat grey stubble, a sly squint. All four look straight at the viewer with mouths closed. Background: a perfectly flat solid magenta #FF00FF, no gradient, no floor, no shadow on the background, no text, no logos.
```

## 05 head-turn keyframes for crew v2: see tools/gen_keys.sh (prompt template + M/U/D tilt phrases)

## 06 man 4 replaced (user: 2 and 4 looked too alike). Edit of gen/crew_master.png + ref1
```
Edit image 1. Replace only the man on the far right with a completely different character, standing in the same place at the same scale, in the same carved faceted 3D caricature sculpture style as image 2 and the other three men. The new man: a short, stocky, round young man with a round chubby face, rosy cheeks, freckles, short tufty ginger hair and a small ginger goatee, a big cheerful closed-mouth grin with dimples, a broad round torso and a little belly, still with a comically long stretched neck like the others. He wears an orange hard hat, a tan brown duck-canvas work jacket worn open over a white singlet, and red ear defenders hanging around his long neck. He looks straight at the viewer. Keep the other three men, their poses, the composition, the lighting with the warm key light and teal rim light, and the flat magenta background exactly the same. No text.
```

## 07 man 4 neck stretch (edit of gen/crew3_b.png)
```
Edit image 1. Only the chubby ginger man on the far right changes: give him a comically long, stretched neck like the other three men, so his head rises much higher and the top of his orange hard hat is level with the top of the white hard hat. The red ear defenders hang around the base of his long neck. Keep his face, grin, freckles, ginger hair and goatee, body, jacket, white singlet and pose exactly the same. Keep the other three men, the carved faceted 3D style, the lighting and the flat magenta background unchanged. No text.
```

Master = gen/crew_master.png (copy of crew4_a.png). Crops: crop_L = x 0..1584, crop_R = x 1232..2816.

## 08 sweep clips: tools/gen_clips.sh (minimax/h3/image-to-video, 5 s, start key_*L, end key_*R)

## API balance ran out (2026-11-01, after ~19 Grok image jobs). Remaining work moved to the
## Higgsfield app credits (MCP), 7.95 cr available. User: "we can do better with hero image, spend more if you have to".

## 09 hero v3, long necks (MCP nano_banana_pro 2k 16:9, count 2 = 4 cr)
Refs: ref1_style.jpg (media d4fb72a2...), crew_master.jpg as cast (media f5732bc5...).
Jobs aba36c6c-3deb-42f5-801a-8eb31bc0b92d, d4c519fc-1f4b-48b1-bb33-2133556b9480.
Prompt: "Image 1 is the art style reference. Image 2 shows the cast. Create a new hero image of the same four
construction workers ... FUN-ART TWIST: all four have absurdly long, giraffe-like stretched necks, each neck about
one and a half times as long as the head ... heads in the upper third ... Background: flat magenta #FF00FF."
(full text in the MCP job params)

## 10 outpaint of hero3_b (job d4c519fc) to 3584x1536 21:9, 2 cr (job dd2ef33e...). Chosen hero = hero3_b.

## 11 equipment stills (user topped up the API): tools/gen_props.sh (grok-imagine 2k, refs: work/outpaint_faces.jpg + ref1)

## 12 prop loops: tools/gen_prop_clips.sh (minimax/h3 i2v 5 s, start = end frame). Stills padded to 3:4 (gen/props/*_34.png)

## 12b level loop retake (first take turned the backdrop green mid-clip)
```
The spirit level rocks side to side like a metronome, a little less each swing, and settles back upright and still in exactly its starting pose. Locked-off static camera, no camera movement, no zoom. The background is a flat solid magenta (#FF00FF) for the whole clip and never changes colour. No people, no hands, no text.
```

## Final state (2026-11-02)
All five prop loops keyed (tools/key_loops.sh) and live: cone, shovel, beam, level (retake), manhole.
API jobs billed this project: 23 Grok Imagine stills, 6 MiniMax H3 5 s clips (one rejected: green backdrop). App credits: 6 of 7.95.
