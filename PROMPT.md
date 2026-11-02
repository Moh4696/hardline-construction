# PROMPT

## How this was built

- Model: Claude Opus 5.5 in Claude Code (desktop app), 2026-11-01 to 2026-11-02.
- Inputs: a concept photo of four construction workers (orange coveralls, hard hats, two tablets) and
  three Pinterest references: Fady Shohdy's faceted 3D portrait, Philybric's "ATTENTION" traffic-cone
  poster, and a "HOLD -> THAT THOUGHT" traffic-light poster.
- Image and video generation: Higgsfield (REST API: Grok Imagine 2.0, MiniMax H3; app credits: Nano
  Banana Pro, outpaint). Everything else is code: three.js r169, GSAP 3.13 + ScrollTrigger, Lenis.

## The original prompts (the user's words)

> hey, I want us to create an interactive 3d landing page for construction company using this image 1 as
> the hero (i want the heroes to respond to the cursor movement). the idea i have in mind is that you turn
> image 1 into this stlye [faceted portrait] of graphic and make it look great. pick the font, style, text
> colour including overall of this [cone poster]. [traffic light poster] also we scroll down on the page.
> i want to see engaing motiion graphic.

Then, during the build:

> i'd like for their neck to be longer, kidda like a fun-art. ... I gave it to you for as comcept. some of
> them can enginerring overall and white tee. and white singlet. just come up with something fun and interesting

> two of the character image the generated image looked too alike, 2 and 4

> i think we can do betther with hero image spend more if you hvae to

> I have top up higgsfield API, can you generate a image for trafic light, shovel and other equipment.
> add extra layer of graphics motion using higgfield

## A prompt that recreates this project

Build a static, no-build-step landing page for a fictional construction company called HARDLINE Build Co.
in a safety-orange poster style: bone paper (#E5D5B6) framing safety-orange panels (#F8873F), giant
condensed Anton type in bone (#F2E2C6), Inter Tight for text, outlined pill callouts with deadpan
one-liners (one cropped off the panel edge), tiny uppercase corner labels ("HARDLINE BUILD CO. / ® EST.
1998", "VOL. 01 / PROJECT NO. 214"), wide-tracked caps footers with a warning triangle, and a multiply
paper-grain overlay. Ink #1D1A16, amber #F2BE4C, night slate #17222D, teal #62B4BC.

Hero: four caricature construction workers in a carved-wood faceted 3D style (warm orange key light,
teal rim light): Sal (moustache, white ribbed singlet, arms folded, orange hat), Dev (lanky engineer,
round glasses, white hat, navy bib overalls over a white tee, blueprint), Marcus (Black, thick beard,
yellow hat, white tee, tape measure), Rusty (chubby ginger, freckles, goatee, orange hat, tan canvas
jacket over a white singlet, red ear defenders). Full-body, short legs, boots, on a flat magenta
backdrop; key it to alpha. In WebGL, cut each head and neck off the body plate and drive it as a grid
mesh: the neck stretches to giraffe length on a bouncy spring at load (staggered), bends toward the
cursor along a parabola, and the head turns on a shallow dome (yaw 24 degrees, pitch 13) and rolls with
the neck tangent. Hovering a man stretches him higher, inverts his callout and shows a name tag. The
word HARDLINE fills the panel width behind the crew, centred on the neck band; on phones it stacks as
HARD / LINE above the heads. Scrolling away, the necks crane further to watch you leave.

Sections below: (02) a pinned STOP / HOLD / GO split field (orange and bone) with a generated worn
roadworks traffic light whose lamps are lit by CSS overlays per stage, an arrow that draws itself and a
vertical "PLAN. POUR. FRAME. FINISH." ticker; (03) THE BUILD, a dark-slate three.js scene scrubbed by
scroll in which a 12-storey steel-frame tower assembles (footings, columns, crane-delivered beams,
slabs, glass panels flipping in on hinges, lights on floor by floor) with LEVEL and DAY counters and
captions; (04) a horizontal poster series GROUNDWORKS / STRUCTURE / FIT-OUT / CIVIL with generated
shovel, I-beam, spirit level and manhole-cover props whose stills swap to looping MiniMax H3 clips keyed
to a stacked colour/matte H.264 (recombined in a shader); (05) odometer stats and hazard-tape marquees
that speed up with scroll velocity; (06) an ATTENTION poster with the generated cone in front of the word
and callouts that lean toward the cursor; (07) RECENT WORK cards rendered from the same building
generator, drawn as ink halftone on orange with a lens that develops the colour render under the
cursor; (08) LET'S BUILD with a second crew whose heads all turn to the "Start a project" button on
hover. Use Lenis + GSAP ScrollTrigger, one offscreen three.js renderer for all small canvases, reduced
motion support, and say in the footer that the company and figures are fictional.
