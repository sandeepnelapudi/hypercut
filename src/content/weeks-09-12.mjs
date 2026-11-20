// PHASE 3 — ADVANCED & PRO (Weeks 9–12)

export const weeks9to12 = [
  {
    n: 9,
    slug: 'vfx-compositing',
    title: 'VFX & Compositing',
    theme: 'Make the impossible look real',
    goal: 'Key, roto, track, stabilise and composite shots so cleanly that nobody knows they were touched.',
    outcomes: [
      'Pull clean chroma keys with spill suppression and edge control',
      'Rotoscope efficiently with AI-assisted tools',
      'Use point, planar and 3D camera tracking',
      'Understand alpha, premultiplication and the "over" operation',
    ],
    labs: ['chroma-key', 'blend-modes'],
    project: {
      title: 'The Invisible Shot',
      brief: 'Create three invisible VFX shots: (1) a green-screen composite onto a new background with matched light; (2) a screen replacement on a phone using planar tracking; (3) object removal (a sign or a person) with a clean plate.',
      deliverables: ['Three finished shots', 'Breakdown video showing layers (before/after)', 'Notes on what was hardest'],
    },
    lessons: [
      {
        slug: 'alpha-and-compositing-math',
        title: 'Alpha Channels, Blend Modes & Compositing Math',
        minutes: 22,
        summary: 'What transparency really is, premultiplied vs straight alpha, and the math of blend modes.',
        body: `
<h3>Alpha</h3>
<p>The fourth channel (RGBA) storing opacity: 0 = transparent, 1 = opaque. Codecs that carry alpha: ProRes 4444, PNG, EXR, QuickTime Animation, WebM VP9 (web).</p>
<h3>The "over" operation</h3>
<p>Every layered composite uses the Porter–Duff over formula:</p>
<pre>result = foreground × α + background × (1 − α)</pre>
<h3>Straight vs premultiplied</h3>
<p><strong>Premultiplied</strong> alpha stores color already multiplied by alpha. If software misinterprets it, you'll see dark or light fringes around edges. Fix by setting the correct alpha interpretation on import.</p>
<h3>Blend modes — the math</h3>
<table><thead><tr><th>Mode</th><th>Formula (0–1)</th><th>Use</th></tr></thead><tbody>
<tr><td>Multiply</td><td>a × b</td><td>Darken, shadows, removes white</td></tr>
<tr><td>Screen</td><td>1 − (1−a)(1−b)</td><td>Lighten, light leaks, fire, removes black</td></tr>
<tr><td>Add (linear dodge)</td><td>a + b</td><td>Glows, sparks, energy</td></tr>
<tr><td>Overlay</td><td>Multiply darks, screen lights</td><td>Contrast, textures</td></tr>
<tr><td>Soft light</td><td>Gentle overlay</td><td>Subtle textures, grain</td></tr>
<tr><td>Difference</td><td>|a − b|</td><td>Alignment checking, psychedelic</td></tr>
<tr><td>Color / Luminosity</td><td>Hue+sat or luma only</td><td>Tinting, grading layers</td></tr>
</tbody></table>
<p>Experiment in the Blend Modes lab.</p>
<h3>Linear light</h3>
<p>Compositing in <strong>linear</strong> (not gamma-encoded) space makes glows, blurs and motion blur physically correct. Nuke and Fusion composite in linear by default.</p>`,
        keyPoints: ['over = fg×α + bg×(1−α)', 'Wrong alpha interpretation = fringes', 'Screen removes black, multiply removes white', 'Composite in linear for realism'],
        exercise: 'Composite a fire stock clip shot on black using Screen vs Add. Note the difference.',
      },
      {
        slug: 'keying-mastery',
        title: 'Chroma Keying Mastery',
        minutes: 24,
        summary: 'From green screen to seamless composite: keying, spill, edges and light wrap.',
        body: `
<h3>On set (so your key is easy)</h3>
<ul><li>Light the screen evenly (within half a stop), separately from the subject.</li><li>Keep the subject 2–3 m from the screen to reduce spill.</li><li>Use a fast shutter for motion and 10-bit 4:2:2+.</li><li>Match lighting direction to the planned background.</li></ul>
<h3>The keying workflow</h3>
<ol>
<li><strong>Garbage matte</strong> — roughly mask out everything that's not near the subject.</li>
<li><strong>Core matte</strong> — a hard key for a solid interior.</li>
<li><strong>Edge matte</strong> — a soft key for hair and detail.</li>
<li><strong>Combine</strong> core + edge.</li>
<li><strong>Spill suppression</strong> — remove green contamination from edges/skin (limit green to the average of red and blue).</li>
<li><strong>Edge treatment</strong> — choke/shrink 1–2 px, slight blur.</li>
<li><strong>Light wrap</strong> — bleed background light onto subject edges.</li>
<li><strong>Integration</strong> — match black levels, color, grain, depth of field and lens blur to the background.</li>
</ol>
<p>Tools: Keylight (AE), Ultra Key (Premiere), 3D Keyer and Delta Keyer (Resolve/Fusion), IBK (Nuke). AI matting (no green screen) is now viable for many shots — see Week 12.</p>
<p>Practise each step in the Chroma Key lab.</p>`,
        keyPoints: ['Even screen light, subject far from screen', 'Core + edge matte', 'Suppress spill', 'Match grain and blacks to background'],
        exercise: 'In the Chroma Key lab, pull the cleanest key possible on the hard preset and remove all spill.',
      },
      {
        slug: 'rotoscoping',
        title: 'Rotoscoping & AI Masking',
        minutes: 18,
        summary: 'Isolating objects without a green screen — manually and with AI.',
        body: `
<p>Rotoscoping = drawing masks frame by frame around an object.</p>
<h3>Manual roto best practices</h3>
<ul>
<li>Use multiple simple shapes (one per limb) rather than one complex shape.</li>
<li>Keyframe on extremes of motion first, then halves, then quarters.</li>
<li>Use motion blur on masks when the subject moves fast.</li>
<li>Feather edges, use per-point feather for hair.</li>
</ul>
<h3>AI-assisted roto</h3>
<p>After Effects <strong>Roto Brush</strong>, Resolve <strong>Magic Mask</strong>, Premiere <strong>object masks</strong>, Runway and other tools segment people/objects automatically using neural networks trained for video segmentation. Workflow: let AI do 90%, fix bad frames manually, refine edges, and add a hair-detail edge key.</p>
<h3>When to roto</h3>
<p>Selective color/grade on a subject, sky replacement, putting text <em>behind</em> a person (very popular trend), object removal, stylised effects (cutout pop-outs).</p>`,
        keyPoints: ['Many simple shapes > one complex', 'Keyframe extremes first', 'AI first, manual fixes after'],
        exercise: 'Put a title behind a walking person using AI roto.',
      },
      {
        slug: 'tracking-and-stabilization',
        title: 'Tracking, Stabilisation & Camera Solving',
        minutes: 22,
        summary: 'Point, planar and 3D camera tracking — and how to stabilise without the "jello" look.',
        body: `
<h3>Tracking types</h3>
<ul>
<li><strong>Point tracking</strong> — follows one or two high-contrast pixels (position, scale, rotation). Good for attaching text or effects to an object.</li>
<li><strong>Planar tracking</strong> (Mocha, Resolve planar, Fusion) — follows a flat surface with perspective. Ideal for screen replacements, signs, walls.</li>
<li><strong>3D camera tracking</strong> (AE Camera Tracker, Fusion Camera Tracker, SynthEyes, Blender) — solves the real camera's movement so you can place 3D objects and text into the scene.</li>
</ul>
<h3>Stabilisation</h3>
<ul>
<li><strong>Warp Stabilizer</strong> (Premiere/AE) and Resolve Stabilizer analyse motion and counter it.</li>
<li>Use <strong>"Position, Scale, Rotation"</strong> or "Perspective" modes; "Subspace warp" can create jello/wobble — reduce smoothness or switch modes.</li>
<li>Stabilisation crops the image — shoot wider (4K for 1080 delivery).</li>
<li>Gyro-based stabilisation (Gyroflow with camera gyro data) is far more accurate than optical analysis.</li>
<li>Remove motion blur artifacts: stabilised footage with heavy motion blur looks wrong because the blur no longer matches the motion. Use faster shutters if you'll stabilise.</li>
</ul>`,
        keyPoints: ['Point for objects, planar for surfaces, 3D for scene', 'Gyroflow beats optical stabilisation', 'Shoot wide for stabilisation crop'],
        exercise: 'Replace a phone screen in a handheld shot using planar tracking.',
      },
      {
        slug: 'cleanup-and-integration',
        title: 'Clean-up, Object Removal & Integration',
        minutes: 20,
        summary: 'Paint out problems, add realistic elements and integrate everything with grain, light and lens.',
        body: `
<h3>Object removal</h3>
<ol>
<li><strong>Clean plate</strong> — a frame without the object (from another moment, or painted in Photoshop), tracked over the area.</li>
<li><strong>Content-aware fill / AI object removal</strong> — After Effects Content-Aware Fill, Resolve Object Removal, generative fill tools.</li>
<li><strong>Clone/paint</strong> — frame-by-frame for small fixes (boom mic, logos, blemishes).</li>
</ol>
<h3>Integration checklist</h3>
<ul>
<li>Black and white levels match the plate.</li>
<li>Color temperature and direction of light match.</li>
<li>Edge softness and lens blur/defocus match.</li>
<li>Motion blur matches the shutter.</li>
<li>Grain/noise matches (re-grain after removing grain).</li>
<li>Lens effects: chromatic aberration, vignette, distortion.</li>
<li>Shadows and contact shadows ground objects.</li>
</ul>
<p>The most common amateur VFX giveaway is a too-clean element in a grainy plate.</p>`,
        keyPoints: ['Clean plates first', 'Match blacks, light, blur, grain', 'Ground objects with shadows'],
        exercise: 'Remove a moving car from a street shot.',
      },
    ],
    quiz: [
      { q: 'The "over" composite formula is…', options: ['fg + bg', 'fg × α + bg × (1 − α)', 'fg × bg', '|fg − bg|'], answer: 1, why: 'Porter–Duff over.' },
      { q: 'Which blend mode removes black from a fire element?', options: ['Multiply', 'Screen', 'Difference', 'Color'], answer: 1, why: 'Screen with black leaves the background unchanged.' },
      { q: 'Spill suppression is used to…', options: ['Add grain', 'Remove green contamination from the subject', 'Stabilise footage', 'Increase saturation'], answer: 1, why: 'It neutralises the screen color bouncing onto the subject.' },
      { q: 'For replacing a phone screen with perspective changes, use…', options: ['Point tracking', 'Planar tracking', 'No tracking', 'Audio sync'], answer: 1, why: 'Planar tracks flat surfaces with perspective.' },
      { q: 'Why might a VFX element look fake in a grainy shot?', options: ['It is too clean — no matching grain', 'It has alpha', 'It is in 4K', 'It uses screen mode'], answer: 0, why: 'Grain mismatch is an instant giveaway.' },
    ],
  },

  {
    n: 10,
    slug: 'trending-effects',
    title: 'Trending Effects & Short-Form Domination',
    theme: 'The edits that go viral in 2026 — and why they work',
    goal: 'Master every trending transition and effect, and the retention science behind viral short-form edits.',
    outcomes: [
      'Execute speed ramps, velocity edits, whip and mask transitions',
      'Create glitch, datamosh, RGB split, film-burn and light-leak looks',
      'Design captions and hooks that maximise retention',
      'Reframe and repurpose horizontal content to vertical',
    ],
    labs: ['easing', 'beat-sync', 'aspect-safe-zones'],
    project: {
      title: 'The Viral Triple',
      brief: 'Make three 15–30s vertical edits: (1) a velocity/speed-ramp edit to music, (2) a talking-head short with dynamic captions, zooms and B-roll, (3) a seamless-transition travel or product edit. Check every frame against platform safe zones.',
      deliverables: ['Three 9:16 exports', 'Hook breakdown: first 3 seconds of each', 'Retention notes'],
    },
    lessons: [
      {
        slug: 'speed-ramps-velocity',
        title: 'Speed Ramps & Velocity Edits',
        minutes: 20,
        summary: 'The signature move of car, sports, dance and travel edits.',
        body: `
<h3>Speed ramping</h3>
<p>Gradually changing playback speed within a clip: fast → slow-motion on the key moment → fast. Shoot at 60–120 fps (and 1/2× shutter rule for crisp slow motion).</p>
<h3>Method</h3>
<ol>
<li>Interpret/conform high-fps footage to timeline fps (or use speed at 40–50%).</li>
<li>Add speed keyframes (Premiere: Time Remapping; Resolve: Retime Controls + Retime Curve; FCP: Retime; CapCut: Speed → Curve).</li>
<li>Smooth the speed curve with bezier ease — a sharp change looks like a glitch.</li>
<li>Set frame interpolation: <strong>Optical Flow</strong> (Premiere) / <strong>Speed Warp</strong> (Resolve AI) for speeds below source frame rate.</li>
<li>Place the slowest point on the musical hit (downbeat or drop).</li>
</ol>
<h3>Velocity edit</h3>
<p>Speed ramps cut to the beat on every clip, often with motion blur, shake on hits and flash frames. Add directional blur and a 2–3 frame white/exposure flash on impacts.</p>
<div class="callout tip"><strong>Trick:</strong> Ramp <em>up</em> into a cut and <em>down</em> out of it — the cut hides inside the fast section.</div>`,
        keyPoints: ['Shoot high fps', 'Ease the speed curve', 'Optical flow/Speed Warp for slow-mo', 'Slowest point on the hit'],
        exercise: 'Create a 10-second velocity edit with three ramps synced to beats from the Beat Sync lab.',
      },
      {
        slug: 'seamless-transitions',
        title: 'Seamless Transitions: Whip, Zoom, Mask, Match',
        minutes: 24,
        summary: 'The transitions that make people ask "how did they do that?"',
        body: `
<h3>Whip pan transition</h3>
<p>Shoot shot A ending with a fast pan right, shot B starting with a fast pan right. Cut in the middle of the blur, add a directional blur and a whoosh. Same direction, same speed.</p>
<h3>Zoom transition</h3>
<p>Scale up shot A quickly (100→300%) over 4–6 frames with motion blur, cut, and scale shot B from 30→100%. Use mirrored edges to avoid black borders. Ease: in on A, out on B.</p>
<h3>Mask / object wipe</h3>
<p>An object (person, pole, door) passes in front of the camera. Mask the edge of that object frame by frame and reveal shot B behind it.</p>
<h3>Match cut / shape transition</h3>
<p>Match shape, color or movement: a ball → the moon; a door closing → another opening. Align position and scale precisely with onion-skinning or a 50% opacity overlay.</p>
<h3>Spin, warp and glitch transitions</h3>
<p>Rotate 90–180° with motion blur, or displacement-map warps. Use sparingly: one signature transition beats ten random ones.</p>
<h3>Light leak / flash transitions</h3>
<p>Screen-blended light leaks or a short exposure flash over the cut.</p>
<p>See the full step-by-step recipes in the <a href="/effects/">Effects Cookbook</a>.</p>`,
        keyPoints: ['Match direction and speed', 'Motion blur sells it', 'Plan transitions on set', 'One signature transition > many'],
        exercise: 'Shoot and edit a whip pan, a zoom and a mask transition.',
      },
      {
        slug: 'stylised-effects',
        title: 'Stylised Effects: Glitch, Datamosh, Film, Cutouts',
        minutes: 22,
        summary: 'The aesthetic effects defining 2026 edits, with how-to recipes.',
        body: `
<ul>
<li><strong>RGB split / chromatic aberration</strong> — offset R and B channels a few pixels on hits.</li>
<li><strong>Glitch</strong> — displacement on random blocks, scan lines, RGB split, digital noise, synced to audio glitches.</li>
<li><strong>Datamosh</strong> — remove I-frames from a long-GOP file so motion vectors drag one shot's pixels across another (plugins or FFmpeg/Avidemux tricks).</li>
<li><strong>Film look stack</strong> — grain, halation, gate weave, light leaks, burns, dust & scratches, 4:3 or 2.39:1 crop.</li>
<li><strong>VHS / camcorder</strong> — 4:3, low res, chroma bleed, timestamp, tracking lines.</li>
<li><strong>Cutout / pop-out</strong> — subject roto'd with a white stroke and drop shadow, "freeze frame + paper cutout" style.</li>
<li><strong>Text behind subject</strong> — title layer placed between background and a roto'd subject.</li>
<li><strong>Clone trail / echo</strong> — time echo or multiple delayed copies of a moving subject.</li>
<li><strong>3D camera projection / parallax photos</strong> — depth maps (AI) turn stills into moving 3D shots.</li>
<li><strong>Shake & impact</strong> — camera shake keyframed on hits with motion blur.</li>
<li><strong>Freeze-frame intro cards</strong> — character name intros with stylised text.</li>
<li><strong>Anime/flash frames and color strobes</strong> — single inverted or high-contrast frames on beats (beware photosensitivity: avoid more than 3 flashes per second).</li>
</ul>
<div class="callout warn"><strong>Accessibility:</strong> Strobing and flashing can trigger photosensitive seizures. Keep flashes under 3 per second and avoid saturated red flashes (WCAG 2.3.1).</div>`,
        keyPoints: ['Effects must be motivated by music or story', 'Text-behind-subject = roto + layering', 'Max 3 flashes per second'],
        exercise: 'Recreate three effects from the Effects Cookbook.',
      },
      {
        slug: 'captions-hooks-retention',
        title: 'Captions, Hooks & Retention Editing',
        minutes: 22,
        summary: 'The science of keeping people watching: the 3-second hook, pattern interrupts and captions.',
        body: `
<h3>The hook (0–3 s)</h3>
<p>The first frame must stop the scroll. Patterns that work: start mid-action, open with the result ("I made $X…"), a bold visual, a question, or a contrarian statement. Put text on screen in frame 1 (many watch muted).</p>
<h3>Retention editing techniques</h3>
<ul>
<li><strong>Pattern interrupts</strong> every 2–4 seconds: zoom punch-in, B-roll, sound effect, graphic, angle change.</li>
<li><strong>Jump cut</strong> out every pause and filler word (text-based editing tools speed this up).</li>
<li><strong>Punch-ins</strong> (110–130%) on emphasis words.</li>
<li><strong>Open loops</strong> — tease a payoff later ("the third one surprised me").</li>
<li><strong>Payoff + loop</strong> — make the end flow into the beginning for replays.</li>
</ul>
<h3>Captions</h3>
<ul>
<li>1–3 words per caption, centred in the safe zone (upper-middle third on vertical).</li>
<li>Bold sans (Montserrat, Inter, The Bold Font), white with black stroke/shadow.</li>
<li>Highlight key words in a brand color, emoji sparingly.</li>
<li>Animate pop-in (scale 80→100% over 3–4 frames).</li>
<li>Auto-generate (Premiere, Resolve, CapCut), then <strong>proofread</strong> — wrong captions destroy credibility.</li>
</ul>
<h3>Analytics</h3>
<p>Study retention graphs: dips show where you lost people. Fix those patterns in the next edit.</p>`,
        keyPoints: ['Hook in 3 seconds', 'Interrupt every 2–4 s', '1–3 words per caption', 'Read retention graphs'],
        exercise: 'Edit a 45-second talking head with jump cuts, punch-ins and animated captions.',
      },
      {
        slug: 'vertical-and-repurposing',
        title: 'Vertical Framing & Content Repurposing',
        minutes: 16,
        summary: 'One shoot, ten deliverables: reframing 16:9 to 9:16, 4:5 and 1:1 intelligently.',
        body: `
<h3>Reframing</h3>
<p>Auto-reframe tools (Premiere Auto Reframe, Resolve Smart Reframe, CapCut) track the subject. Always review: they miss gestures, and text, and fail on two-person shots.</p>
<h3>Layouts for vertical from horizontal</h3>
<ul><li>Centre crop (single subject).</li><li>Split screen (two speakers stacked — podcasts).</li><li>Blurred background fill (product/landscape).</li><li>Top caption + 16:9 video + bottom caption.</li></ul>
<h3>Safe zones</h3>
<p>TikTok, Reels and Shorts overlay UI at the bottom (captions, buttons) and right side (like/comment). Keep faces and text in the centre. Overlay the guides in the Aspect Ratio & Safe Zones lab.</p>
<h3>Shoot for both</h3>
<p>Shoot 4K/6K open-gate or wider than needed and keep the subject centred with headroom — so vertical and horizontal crops both work.</p>`,
        keyPoints: ['Review auto-reframe', 'Respect platform UI zones', 'Shoot open-gate for multiple crops'],
        exercise: 'Repurpose one 16:9 clip into 9:16, 4:5 and 1:1 versions.',
      },
    ],
    quiz: [
      { q: 'For smooth slow motion below source frame rate, use…', options: ['Frame sampling', 'Optical Flow / Speed Warp', 'Nearest neighbour', 'Hold frames'], answer: 1, why: 'Optical flow synthesises in-between frames.' },
      { q: 'For a whip pan transition the two shots should…', options: ['Pan in opposite directions', 'Pan in the same direction at similar speed', 'Be static', 'Have different frame rates'], answer: 1, why: 'Matching direction and speed creates continuity.' },
      { q: 'The maximum safe flash rate for photosensitive viewers is about…', options: ['10 per second', '3 per second', '30 per second', 'No limit'], answer: 1, why: 'WCAG recommends no more than 3 flashes per second.' },
      { q: 'How many words per caption is typical for short-form?', options: ['1–3', '10–15', 'Full sentences', 'None'], answer: 0, why: 'Short chunks are easier to read at speed.' },
      { q: 'Datamoshing exploits…', options: ['Alpha channels', 'Removed I-frames so motion vectors apply to the wrong image', 'LUTs', 'Audio sample rates'], answer: 1, why: 'Without I-frames, P-frames smear motion over the previous image.' },
    ],
  },

  {
    n: 11,
    slug: 'genre-mastery',
    title: 'Genre Mastery & Storytelling',
    theme: 'Every format has its own rules — learn them all',
    goal: 'Edit any genre at a professional level: documentary, narrative, music video, commercial, trailer, wedding, YouTube, podcast.',
    outcomes: [
      'Structure documentaries and interviews from hours of footage',
      'Cut dialogue scenes with performance and subtext',
      'Edit trailers, ads and music videos to rhythm',
      'Edit long-form YouTube and podcasts for retention',
    ],
    labs: ['beat-sync'],
    project: {
      title: 'The Genre Gauntlet',
      brief: 'Choose 3 genres. Make one piece per genre: a 60-second trailer for a film that doesn\'t exist, a 30-second commercial, and a 2-minute mini-documentary.',
      deliverables: ['Three finished pieces', 'One page of structural notes per piece'],
    },
    lessons: [
      {
        slug: 'documentary-and-interview',
        title: 'Documentary & Interview Editing',
        minutes: 22,
        summary: 'Finding the story in 50 hours of footage.',
        body: `
<ol>
<li><strong>Transcribe everything</strong> (AI transcription), add timecode.</li>
<li><strong>String-out</strong>: select every good soundbite into themed sequences.</li>
<li><strong>Paper edit</strong>: build the story spine in text.</li>
<li><strong>Radio cut</strong>: assemble audio only — it should work with eyes closed.</li>
<li><strong>Cover with B-roll</strong>, archive and graphics.</li>
<li><strong>Breathe</strong>: give moments room with music and observational scenes.</li>
</ol>
<h3>Interview techniques</h3>
<ul>
<li>Hide jump cuts with B-roll, a cut to a second angle, or a deliberate punch-in.</li>
<li>Frankenbites (combining parts of sentences) must never change meaning — that's an ethical line.</li>
<li>Keep the human moments: laughs, pauses, tears.</li>
</ul>
<h3>Ethics</h3>
<p>Documentary editing shapes reality. Don't misrepresent people, context or chronology. Label reconstructions and AI-generated imagery clearly.</p>`,
        keyPoints: ['Radio cut first', 'Paper edit from transcripts', 'Frankenbites must not alter meaning', 'Label AI and reconstructions'],
        exercise: 'Make a 2-minute radio cut from a 20-minute interview.',
      },
      {
        slug: 'narrative-dialogue',
        title: 'Narrative Film & Dialogue Scenes',
        minutes: 22,
        summary: 'Performance, subtext and the reaction shot.',
        body: `
<h3>Dialogue scene workflow</h3>
<ol>
<li>Watch every take; note the best line readings (a "line-by-line" or "ScriptSync").</li>
<li>Start with a wide/master for geography, then coverage.</li>
<li>Cut for <strong>performance</strong>, not continuity.</li>
<li>Use reactions — the listener often carries the emotion.</li>
<li>Overlap dialogue with J/L cuts so the scene flows.</li>
<li>Remove "air" between lines unless the silence means something.</li>
</ol>
<h3>Subtext</h3>
<p>What characters don't say. Hold on a look after a line to reveal the subtext. Cut away to an object they glance at.</p>
<h3>Scene transitions</h3>
<p>Use sound bridges (pre-lap), match cuts, and contrast to move between scenes. Enter scenes late, leave early.</p>`,
        keyPoints: ['Performance over continuity', 'Reactions carry emotion', 'Enter late, leave early'],
        exercise: 'Cut the same two-person scene twice: once favouring speaker A, once speaker B.',
      },
      {
        slug: 'trailers-and-commercials',
        title: 'Trailers, Promos & Commercials',
        minutes: 20,
        summary: 'Sell in 30 seconds: structure, sound design and the button.',
        body: `
<h3>Trailer structure (3 acts in 2 minutes)</h3>
<ol>
<li><strong>Act 1 — Setup</strong>: world, character, normal life. Calm music.</li>
<li><strong>Act 2 — Conflict</strong>: inciting incident, rising stakes, music builds, cuts accelerate.</li>
<li><strong>Act 3 — Climax montage</strong>: fastest cuts, biggest moments, music peak.</li>
<li><strong>Title card</strong> → <strong>button</strong> (a final joke or shock) → release date.</li>
</ol>
<p>Trailer sound: braams, risers, hits, silence before the drop, a "stinger".</p>
<h3>Commercials</h3>
<ul>
<li>15s / 30s / 6s bumpers — every frame counts.</li>
<li>Brand visible early (first 5 seconds).</li>
<li>Problem → solution → proof → call to action.</li>
<li>Deliver versions: lengths, aspect ratios, with/without supers, clean versions, captions.</li>
<li>Legal: product claims, supers duration, music licensing.</li>
</ul>`,
        keyPoints: ['Trailers: setup, conflict, climax, button', 'Ads: brand early, CTA last', 'Deliver every version'],
        exercise: 'Cut a 60-second trailer from public-domain film footage.',
      },
      {
        slug: 'music-videos-and-events',
        title: 'Music Videos, Weddings & Events',
        minutes: 18,
        summary: 'Rhythm-first editing and emotional event films.',
        body: `
<h3>Music videos</h3>
<ul>
<li>Lip-sync: performance takes are shot to playback; sync each take to the master track and cut between them freely (multicam).</li>
<li>Cut structure follows song structure: verse (narrative), chorus (performance, energy), bridge (change).</li>
<li>Effects on accents: flashes, glitches, speed ramps on hits.</li>
</ul>
<h3>Weddings & events</h3>
<ul>
<li>Structure: highlight film (3–5 min), teaser (60 s), full ceremony and speeches (multicam).</li>
<li>Use vows and speeches as voiceover for the highlight film narrative.</li>
<li>Pick music with emotional arc; licensed music only.</li>
<li>Deliver fast: teaser within 48 hours keeps clients ecstatic.</li>
</ul>`,
        keyPoints: ['Cut structure follows song structure', 'Vows/speeches as VO', 'Fast teaser delivery'],
        exercise: 'Make a 60-second event highlight from any family event footage.',
      },
      {
        slug: 'youtube-podcast-longform',
        title: 'YouTube Long-Form & Podcasts',
        minutes: 20,
        summary: 'Editing 10–60 minute content that people actually finish.',
        body: `
<h3>Long-form YouTube</h3>
<ul>
<li><strong>Cold open</strong> with the most interesting moment, then title/intro under 5 seconds.</li>
<li>Chapters with clear segment changes (graphic + music change).</li>
<li>B-roll, memes, zooms, sound effects for pacing — matched to the creator's style.</li>
<li>Re-hook every 60–90 seconds ("but here's the problem…").</li>
<li>End screen with 20 seconds of space for elements.</li>
<li>Thumbnail and title are part of the edit — design them early.</li>
</ul>
<h3>Video podcasts</h3>
<ul>
<li>3+ camera multicam (wide, host, guest) with auto-switching tools as a first pass, then manual refinement.</li>
<li>Audio: individual mics, noise reduction, leveling to −16 LUFS (−14 for YouTube).</li>
<li>Clip the best 30–60 s moments to vertical shorts with captions.</li>
</ul>`,
        keyPoints: ['Cold open', 'Re-hook every 60–90 s', 'Podcast = multicam + shorts machine'],
        exercise: 'Edit 10 minutes of a podcast and cut 3 vertical clips.',
      },
    ],
    quiz: [
      { q: 'A "radio cut" in documentary means…', options: ['Cut for radio broadcast', 'Assembling the audio story first, without picture concerns', 'Removing all music', 'Cutting for vertical'], answer: 1, why: 'Story works by ear first.' },
      { q: 'In dialogue scenes you should primarily cut for…', options: ['Continuity', 'Performance', 'Shot size', 'Speed'], answer: 1, why: 'Emotion and performance are what audiences feel.' },
      { q: 'The final joke or shock after a trailer\'s title card is called…', options: ['The tag/button', 'The slate', 'The stinger LUT', 'The bumper'], answer: 0, why: 'It\'s called the button or tag.' },
      { q: 'Frankenbites are acceptable when…', options: ['They change the meaning for drama', 'They don\'t alter the speaker\'s meaning', 'Never', 'Always'], answer: 1, why: 'Ethics: combining is fine only if meaning is preserved.' },
    ],
  },

  {
    n: 12,
    slug: 'pro-workflow',
    title: 'AI, Finishing, Delivery & the Pro Career',
    theme: 'Finish like a facility, work like a studio, earn like a pro',
    goal: 'Master AI-assisted workflows, finishing, conform, delivery specs and the business of editing — then ship your capstone.',
    outcomes: [
      'Integrate AI tools ethically and efficiently',
      'Conform and round-trip via XML/EDL/AAF',
      'Export to any platform or broadcast spec',
      'Price, pitch and manage clients; build a portfolio and reel',
    ],
    labs: ['bitrate-calculator', 'timecode'],
    project: {
      title: 'CAPSTONE: The Showreel & The Client Job',
      brief: 'Produce a 60–90 second showreel of your best work from this course, plus one complete client-style project from brief to delivery (brief, quote, edit, review rounds, grade, mix, deliverables in 3 formats).',
      deliverables: ['Showreel', 'Client project with all deliverables', 'Quote and invoice template', 'Portfolio website or page'],
    },
    lessons: [
      {
        slug: 'ai-in-editing',
        title: 'AI in Video Editing (2026)',
        minutes: 24,
        summary: 'What AI can do now, how the models work, and how to use it without losing your craft or your ethics.',
        body: `
<h3>Categories of AI tools</h3>
<table><thead><tr><th>Task</th><th>Examples</th></tr></thead><tbody>
<tr><td>Transcription & text-based editing</td><td>Premiere, Resolve, Descript, CapCut</td></tr>
<tr><td>Audio cleanup</td><td>Resolve Voice Isolation, Adobe Enhance Speech, iZotope RX</td></tr>
<tr><td>Masking & roto</td><td>Magic Mask, Roto Brush, object masks</td></tr>
<tr><td>Reframing</td><td>Auto Reframe, Smart Reframe</td></tr>
<tr><td>Retiming & upscaling</td><td>Speed Warp, optical flow, Super Scale, Topaz Video</td></tr>
<tr><td>Generative extend / fill</td><td>Extending clips, filling frames, removing objects</td></tr>
<tr><td>Generative video</td><td>Text/image-to-video models (Veo, Sora, Runway, Kling, Firefly, etc.)</td></tr>
<tr><td>Voice</td><td>Text-to-speech, voice cloning (consent required), dubbing and lip-sync</td></tr>
<tr><td>Search & organisation</td><td>Semantic clip search ("find all shots with a red car")</td></tr>
</tbody></table>
<h3>How these engines work (simplified)</h3>
<ul>
<li><strong>Segmentation</strong> (masks) — neural nets classify each pixel; video models propagate masks through time using motion.</li>
<li><strong>Optical flow / frame interpolation</strong> — estimate per-pixel motion vectors between frames and synthesise in-betweens.</li>
<li><strong>Super-resolution</strong> — networks trained on low→high res pairs predict plausible detail.</li>
<li><strong>Diffusion models</strong> (generative video) — start from noise and iteratively denoise toward an output that matches the prompt, guided by learned patterns across space and time.</li>
<li><strong>Speech-to-text</strong> — transformer models map audio features to words with timestamps.</li>
</ul>
<h3>Rules for pros</h3>
<ol>
<li>AI does the tedious work; you make the decisions.</li>
<li>Check every AI result frame by frame — artifacts hide in fast motion and hands.</li>
<li>Never clone a voice or likeness without explicit consent.</li>
<li>Disclose synthetic content where platforms or clients require it (content credentials / C2PA).</li>
<li>Check licensing terms of generated assets for commercial use.</li>
</ol>`,
        keyPoints: ['AI for tedium, humans for taste', 'Verify every AI frame', 'Consent and disclosure', 'Know how the models work'],
        exercise: 'Use one AI tool for each of: transcription, audio cleanup, masking. Record time saved.',
      },
      {
        slug: 'conform-roundtrip',
        title: 'Conform, Round-Trips & Collaboration',
        minutes: 20,
        summary: 'Moving projects between apps and people: XML, EDL, AAF, OTIO and shared projects.',
        body: `
<h3>Interchange formats</h3>
<ul>
<li><strong>EDL</strong> (CMX 3600) — simplest; one video track, cuts and dissolves. Universal.</li>
<li><strong>FCP XML / FCPXML</strong> — multi-track with basic effects.</li>
<li><strong>AAF</strong> — Avid and Pro Tools exchange; audio turnovers to sound mixers.</li>
<li><strong>OTIO (OpenTimelineIO)</strong> — modern open standard supported by Resolve, Premiere and more.</li>
</ul>
<h3>The round trip</h3>
<ol>
<li>Editor locks picture (offline, using proxies).</li>
<li>Export XML/AAF + reference video.</li>
<li>Colorist conforms in Resolve to camera originals, checks against reference.</li>
<li>Sound: AAF with handles (e.g. 2–5 sec) to Pro Tools/Fairlight.</li>
<li>VFX: pulls (EXR/DPX/ProRes 4444) with handles; returns comps.</li>
<li>Online: finishing, titles, deliverables.</li>
</ol>
<h3>Collaboration</h3>
<p>Resolve Blackmagic Cloud / project server, Premiere Productions and Team Projects, Avid bin locking, Frame.io for review/approval with timecoded comments.</p>`,
        keyPoints: ['EDL simple, XML/AAF rich, OTIO open', 'Always include handles', 'Use review platforms with timecoded notes'],
        exercise: 'Export an XML from your NLE and import it into another NLE. Note what broke.',
      },
      {
        slug: 'export-delivery',
        title: 'Export & Delivery Specs for Every Platform',
        minutes: 22,
        summary: 'The exact settings to export for YouTube, Instagram, TikTok, broadcast, cinema and clients.',
        body: `
<table><thead><tr><th>Destination</th><th>Recommended export</th></tr></thead><tbody>
<tr><td>YouTube</td><td>H.264 High/HEVC, source fps, 4K if possible (better VP9/AV1 bitrate allocation), 35–45 Mbps 1080p / 50–68 Mbps 4K, AAC 320 kbps 48 kHz, Rec.709 tagged</td></tr>
<tr><td>Instagram Reels / TikTok / Shorts</td><td>1080×1920, H.264, 30 fps (or source), 15–25 Mbps, AAC 48 kHz</td></tr>
<tr><td>Client review</td><td>H.264 1080p 10–15 Mbps with burned-in timecode and watermark</td></tr>
<tr><td>Master / archive</td><td>ProRes 422 HQ or 4444 / DNxHR HQX, full res, + stems</td></tr>
<tr><td>Broadcast</td><td>Per network spec: often XDCAM HD422 50 Mbps MXF or ProRes, −23/−24 LUFS, legal levels, timecode start 10:00:00:00, bars & tone, slate</td></tr>
<tr><td>Cinema (DCP)</td><td>JPEG 2000 in MXF, XYZ color, 24/25 fps, made with DaVinci Resolve Studio, DCP-o-matic or Easy DCP</td></tr>
<tr><td>Streaming platforms (Netflix etc.)</td><td>IMF packages per the platform's delivery spec; HDR Dolby Vision often required</td></tr>
</tbody></table>
<h3>QC checklist before sending</h3>
<ul>
<li>Watch the whole export at full screen. Every time.</li>
<li>Flash frames / black frames / gaps on the timeline.</li>
<li>Audio: loudness, sync, no clipping, both channels.</li>
<li>Spelling in titles and captions.</li>
<li>Correct color tags and levels (full vs video range).</li>
<li>File name: <code>Client_Project_v03_1920x1080_2026-11-20.mp4</code>.</li>
</ul>`,
        keyPoints: ['Upload 4K to YouTube for better quality', 'Always keep a mezzanine master', 'QC every export', 'Version file names'],
        exercise: 'Export one timeline to 4 specs and verify each in MediaInfo.',
      },
      {
        slug: 'business-of-editing',
        title: 'The Business: Pricing, Clients, Contracts',
        minutes: 20,
        summary: 'How editors get hired, price their work and keep clients coming back.',
        body: `
<h3>Pricing models</h3>
<ul>
<li><strong>Day rate</strong> — common in agencies and post houses.</li>
<li><strong>Per project</strong> — clients like certainty; define scope and revisions clearly.</li>
<li><strong>Per finished minute / per video retainer</strong> — YouTube and social clients.</li>
<li><strong>Value-based</strong> — price according to the value to the client (a launch ad vs a family video).</li>
</ul>
<h3>Scope protection</h3>
<p>Write: deliverables, length, formats, revision rounds (usually 2), timeline, what the client provides, music licensing, and price per extra round. Take a deposit (30–50%).</p>
<h3>Client communication</h3>
<ul><li>Ask for references: "Send 3 videos you love and 1 you hate."</li><li>Share drafts with timecoded review tools.</li><li>Translate vague notes ("make it pop") into specifics — see the Scenario Playbook.</li><li>Deliver early, over-communicate, under-promise.</li></ul>
<h3>Rights & files</h3>
<p>Clarify who owns project files and raw footage. Archive projects and media for an agreed time.</p>`,
        keyPoints: ['Define scope and revisions', 'Take deposits', 'Translate vague notes into specifics'],
        exercise: 'Write a quote for a 60-second product video with 2 revision rounds.',
      },
      {
        slug: 'portfolio-and-mastery',
        title: 'Portfolio, Showreel & The Path to Mastery',
        minutes: 18,
        summary: 'Build the reel that gets you hired and the habits that keep you growing for life.',
        body: `
<h3>The showreel</h3>
<ul>
<li>60–90 seconds. Best work first — most viewers watch 20 seconds.</li>
<li>Specialise: edit reel, color reel, motion reel are different reels.</li>
<li>Cut to music, show range, include before/after for color and VFX.</li>
<li>Name, specialty and contact at the start and end.</li>
</ul>
<h3>Portfolio</h3>
<p>A simple site with the reel, 5–8 case studies (problem, approach, result), client list, and contact. Post breakdowns on social — "how I edited this" content attracts clients.</p>
<h3>Habits of the best editors</h3>
<ol>
<li>Study films with the sound off (picture) and eyes closed (sound).</li>
<li>Recreate one edit you admire every week.</li>
<li>Keep a "swipe file" of shots, transitions and grades.</li>
<li>Seek brutal feedback; ship often.</li>
<li>Learn the adjacent crafts: writing, directing, sound, color.</li>
</ol>
<p>Finish the capstone, then download your HYPERCUT certificate from the dashboard. Then keep going — mastery is a practice, not a finish line.</p>`,
        keyPoints: ['Best work first', 'Specialised reels', 'Recreate an edit every week'],
        exercise: 'Publish your showreel and portfolio.',
      },
    ],
    quiz: [
      { q: 'Which interchange format is commonly used to send audio to Pro Tools?', options: ['EDL', 'AAF', 'SRT', 'LUT'], answer: 1, why: 'AAF carries audio clips with handles.' },
      { q: 'Why upload 1080p content as 4K to YouTube?', options: ['It is required', 'YouTube allocates higher-quality codecs/bitrates to 4K uploads', 'It changes the frame rate', 'It improves audio'], answer: 1, why: '4K uploads get better encodes even when viewed lower.' },
      { q: 'Diffusion models generate video by…', options: ['Copying stock footage', 'Iteratively denoising from noise toward the prompt', 'Recording the screen', 'Using LUTs'], answer: 1, why: 'Diffusion = learned iterative denoising.' },
      { q: 'A typical deposit before starting a project is…', options: ['0%', '30–50%', '100%', '5%'], answer: 1, why: 'Protects the editor\'s time.' },
      { q: 'Before cloning a voice you need…', options: ['A faster GPU', 'Explicit consent from the person', 'Nothing', 'A LUT'], answer: 1, why: 'Ethics and law require consent.' },
    ],
  },
];
