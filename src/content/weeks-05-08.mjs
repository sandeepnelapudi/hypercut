// PHASE 2 — CRAFT (Weeks 5–8)

export const weeks5to8 = [
  {
    n: 5,
    slug: 'sound-design',
    title: 'Sound Design & Audio Post',
    theme: 'Half of what people "see" is what they hear',
    goal: 'Deliver clean, loud-enough, emotional audio mixes that meet broadcast and streaming standards.',
    outcomes: [
      'Understand decibels, LUFS and true peak and hit platform loudness targets',
      'Use EQ, compression, de-noise and de-ess correctly',
      'Build layered sound design with SFX, risers, impacts and ambience',
      'Edit music seamlessly to picture',
    ],
    labs: ['eq-trainer', 'beat-sync', 'loudness-meter'],
    project: {
      title: 'The Silent Film Rescue',
      brief: 'Take a 45-second action clip and delete its audio. Rebuild the whole soundtrack: room tone, foley, SFX, music, one line of ADR. Mix to −14 LUFS integrated, −1 dBTP.',
      deliverables: ['Final mix export', 'Stems: dialogue, music, effects', 'Screenshot of loudness meter reading'],
    },
    lessons: [
      {
        slug: 'audio-fundamentals',
        title: 'Audio Fundamentals: Waves, dB, Sample Rates',
        minutes: 18,
        summary: 'The physics of sound and the digital numbers you will see every day.',
        body: `
<p>Sound is pressure waves. <strong>Frequency</strong> (Hz) is pitch: humans hear ~20 Hz to 20 kHz. <strong>Amplitude</strong> is loudness, measured on the logarithmic <strong>decibel</strong> scale: +6 dB ≈ doubling the signal amplitude, +10 dB ≈ "twice as loud" perceptually.</p>
<h3>Digital audio</h3>
<ul>
<li><strong>Sample rate</strong> — samples per second. Video standard is <strong>48 kHz</strong> (music CD is 44.1 kHz). Mixing the two causes drift or pitch errors if not converted.</li>
<li><strong>Bit depth</strong> — 16-bit = 96 dB dynamic range, 24-bit = 144 dB, 32-bit float = practically unclippable (the reason 32-bit float recorders like the Zoom F3 are so popular).</li>
<li><strong>dBFS</strong> — decibels relative to full scale. 0 dBFS is the digital ceiling. Anything over clips — permanent distortion.</li>
</ul>
<h3>The frequency map</h3>
<table><thead><tr><th>Range</th><th>Character</th></tr></thead><tbody>
<tr><td>20–60 Hz</td><td>Sub-bass: rumble, felt not heard. Cut on dialogue.</td></tr>
<tr><td>60–250 Hz</td><td>Bass / warmth; "boominess" at excess</td></tr>
<tr><td>250–500 Hz</td><td>Muddiness, "boxy" rooms</td></tr>
<tr><td>500 Hz–2 kHz</td><td>Body of voice, "honky" at excess</td></tr>
<tr><td>2–5 kHz</td><td>Presence & intelligibility; harsh at excess</td></tr>
<tr><td>5–10 kHz</td><td>Sibilance ("s" sounds), clarity</td></tr>
<tr><td>10–20 kHz</td><td>Air, sparkle</td></tr>
</tbody></table>
<p>Train your ears with the EQ Ear Trainer lab — professionals can name a boosted frequency within an octave.</p>`,
        keyPoints: ['48 kHz for video', '0 dBFS is the ceiling', '2–5 kHz = intelligibility', '250–500 Hz = mud'],
        exercise: 'Reach level 3 of the EQ Ear Trainer.',
      },
      {
        slug: 'loudness-standards',
        title: 'Loudness: LUFS, True Peak & Delivery Standards',
        minutes: 16,
        summary: 'Why your video sounds quieter than everyone else\'s on YouTube — and the numbers that fix it.',
        body: `
<p>Peak meters measure the highest sample. <strong>LUFS</strong> (Loudness Units relative to Full Scale) measures <em>perceived</em> loudness over time. Platforms normalise to a LUFS target, so mixing to it keeps your dynamics intact.</p>
<table><thead><tr><th>Platform / standard</th><th>Integrated loudness</th><th>True peak</th></tr></thead><tbody>
<tr><td>Broadcast EU (EBU R128)</td><td>−23 LUFS</td><td>−1 dBTP</td></tr>
<tr><td>Broadcast US (ATSC A/85)</td><td>−24 LKFS</td><td>−2 dBTP</td></tr>
<tr><td>YouTube</td><td>−14 LUFS (normalises down)</td><td>−1 dBTP</td></tr>
<tr><td>Spotify / podcasts</td><td>−14 / −16 LUFS</td><td>−1 dBTP</td></tr>
<tr><td>Netflix</td><td>−27 LKFS dialogue-gated (±2)</td><td>−2 dBTP</td></tr>
<tr><td>Instagram / TikTok</td><td>~ −14 LUFS works well</td><td>−1 dBTP</td></tr>
</tbody></table>
<p><strong>True peak</strong> (dBTP) accounts for inter-sample peaks created when audio is converted back to analog or re-encoded to AAC/MP3. Keep a limiter at −1 dBTP on your master.</p>
<h3>Typical mix levels</h3>
<p>Dialogue around −12 to −6 dBFS peaks; music under dialogue −20 to −30 dBFS; SFX hits can peak higher briefly. Always mix by <em>ear</em> first, meter second.</p>`,
        keyPoints: ['LUFS = perceived loudness', 'YouTube/Spotify ≈ −14 LUFS', 'Broadcast −23/−24', 'Limiter at −1 dBTP'],
        exercise: 'Measure the integrated loudness of your last edit in Resolve Fairlight or Premiere Loudness Radar.',
      },
      {
        slug: 'dialogue-cleanup-eq-compression',
        title: 'Dialogue Cleanup: EQ, Compression, De-noise',
        minutes: 24,
        summary: 'The standard processing chain that turns bad location audio into clean, intelligible dialogue.',
        body: `
<h3>The dialogue chain (in order)</h3>
<ol>
<li><strong>Noise reduction / de-reverb</strong> — Resolve Voice Isolation, Adobe Enhance Speech, iZotope RX. Use the minimum that works; overdoing it causes "underwater" artifacts.</li>
<li><strong>High-pass filter</strong> at 80–100 Hz — removes rumble, handling noise.</li>
<li><strong>Subtractive EQ</strong> — cut mud (200–400 Hz), boxiness, harshness. Narrow cuts, wide boosts.</li>
<li><strong>Compression</strong> — ratio 2:1–4:1, threshold so you get 3–6 dB gain reduction, attack 5–20 ms, release 50–150 ms. Evens out levels.</li>
<li><strong>Additive EQ</strong> — gentle presence boost at 3–5 kHz, air at 10–12 kHz.</li>
<li><strong>De-esser</strong> — tames sibilance at 5–8 kHz.</li>
<li><strong>Limiter</strong> — on the bus, not the clip.</li>
</ol>
<h3>Room tone</h3>
<p>Always record 30 seconds of silence on location. Fill gaps with it — total digital silence between words sounds like a broken edit.</p>
<h3>Crossfades</h3>
<p>Add 2–4 frame audio crossfades at every dialogue edit to kill clicks and pops.</p>`,
        keyPoints: ['Clean → HPF → cut → compress → boost → de-ess', 'Narrow cuts, wide boosts', 'Fill gaps with room tone', 'Crossfade every dialogue edit'],
        exercise: 'Record yourself in a kitchen with the fan on, then clean it using the chain.',
      },
      {
        slug: 'sound-design-layers',
        title: 'Sound Design: Foley, SFX, Ambience & Transitions',
        minutes: 22,
        summary: 'Build worlds with layered sound — the secret sauce of every viral edit and every blockbuster trailer.',
        body: `
<h3>The four layers</h3>
<ol>
<li><strong>Ambience / atmos</strong> — the room or world: city hum, birds, air conditioner. Continuous beds across cuts glue a scene together.</li>
<li><strong>Foley</strong> — synced human sounds: footsteps, cloth, props.</li>
<li><strong>Hard effects</strong> — doors, cars, punches, UI clicks.</li>
<li><strong>Designed / stylised SFX</strong> — whooshes, risers, impacts, sub drops, glitches, reverse cymbals.</li>
</ol>
<h3>Transition sound recipe (trending edits)</h3>
<p><strong>Riser</strong> into the cut (2–4 s, building tension) → <strong>whoosh</strong> synced to the motion of a whip/zoom transition → <strong>impact + sub drop</strong> exactly on the cut frame → short <strong>reverse reverb tail</strong>. Put the impact transient 1–2 frames <em>before</em> the visual cut; audio perceived slightly early feels "tight".</p>
<h3>Layering a single hit</h3>
<p>Combine low (sub/boom), mid (body/punch) and high (crack/snap) components. EQ each so they don't fight. That's how a simple punch becomes cinematic.</p>
<h3>Silence is a sound effect</h3>
<p>Dropping all audio to near silence before a big moment is one of the most powerful tools you have.</p>`,
        keyPoints: ['Ambience glues cuts', 'Riser → whoosh → impact', 'Layer low/mid/high', 'Use silence deliberately'],
        exercise: 'Build a 10-second transition using riser, whoosh and impact. Sync it to a whip pan.',
      },
      {
        slug: 'music-editing',
        title: 'Music Editing & Mixing to Picture',
        minutes: 18,
        summary: 'Cut music invisibly, duck it under dialogue and make the edit dance.',
        body: `
<h3>Cutting music invisibly</h3>
<ul>
<li>Edit on <strong>downbeats</strong> (beat 1 of a bar) and match musical phrases (usually 4 or 8 bars).</li>
<li>Find the same chord/beat in both sections; crossfade 5–20 frames.</li>
<li>Hide edits under a transient (drum hit) or an SFX.</li>
<li>Resolve, Premiere (Remix tool) and Audition can retime songs automatically to a target duration.</li>
</ul>
<h3>Ducking</h3>
<p>Lower music 8–15 dB under dialogue. Do it with keyframes, or auto-ducking (Premiere Essential Sound, Resolve Fairlight sidechain). Keyframe the duck 10–15 frames before speech for a natural fade.</p>
<h3>Stems</h3>
<p>Deliver separate dialogue, music, effects (D/M/E) stems. Broadcasters and distributors need them for localisation.</p>
<h3>Licensing</h3>
<p>Never use commercial music without a license — it blocks monetisation and gets videos taken down. Use licensed libraries (Artlist, Musicbed, Epidemic Sound, YouTube Audio Library) and keep license PDFs in <code>07_DOCS</code>.</p>`,
        keyPoints: ['Cut on downbeats and phrases', 'Duck music 8–15 dB under dialogue', 'Deliver D/M/E stems', 'Always license music'],
        exercise: 'Shorten a 3-minute song to exactly 60 seconds with invisible edits.',
      },
    ],
    quiz: [
      { q: 'The standard audio sample rate for video is…', options: ['44.1 kHz', '48 kHz', '96 kHz', '22 kHz'], answer: 1, why: '48 kHz is the video/broadcast standard.' },
      { q: 'Which loudness target is closest to YouTube normalisation?', options: ['−23 LUFS', '−14 LUFS', '−6 LUFS', '0 LUFS'], answer: 1, why: 'YouTube normalises to about −14 LUFS integrated.' },
      { q: 'Muddy, boxy dialogue is usually around…', options: ['50 Hz', '250–400 Hz', '5 kHz', '15 kHz'], answer: 1, why: 'The low-mids accumulate room resonance.' },
      { q: 'Why fill dialogue gaps with room tone?', options: ['To make the file bigger', 'Digital silence makes edits obvious', 'Platforms require it', 'It reduces loudness'], answer: 1, why: 'Abrupt digital silence draws attention to cuts.' },
      { q: 'D/M/E stems stand for…', options: ['Drums, Melody, Echo', 'Dialogue, Music, Effects', 'Digital, Mono, Export', 'Dynamics, Mix, EQ'], answer: 1, why: 'Dialogue, Music and Effects stems.' },
    ],
  },

  {
    n: 6,
    slug: 'color-science',
    title: 'Color Theory & Color Science',
    theme: 'How light becomes color, and how color becomes feeling',
    goal: 'Master both the art (theory, psychology, harmony) and the science (color spaces, gamma, log, scopes) of color.',
    outcomes: [
      'Use color harmonies and color psychology deliberately',
      'Explain Rec.709, Rec.2020, P3, ACES and transfer functions',
      'Read waveform, parade, vectorscope and histogram fluently',
      'Correctly transform log footage with color management or LUTs',
    ],
    labs: ['color-harmony', 'color-grading', 'white-balance'],
    project: {
      title: 'Color Script',
      brief: 'Pick a film. Grab one frame every 2 minutes and build a "color script" strip. Identify the palette for each act and explain how color tracks the story. Then design a color script for your own 2-minute short.',
      deliverables: ['Film color-script strip', 'Analysis (300 words)', 'Your own color script with palettes'],
    },
    lessons: [
      {
        slug: 'color-theory-and-harmony',
        title: 'Color Theory, Harmony & Psychology',
        minutes: 22,
        summary: 'The color wheel, harmonies, temperature and the emotional meaning of color in film.',
        body: `
<h3>Hue, saturation, value</h3>
<p><strong>Hue</strong> is the color family (angle on the wheel), <strong>saturation</strong> its intensity, <strong>value/luminance</strong> its brightness. Grading is mostly about moving these three.</p>
<h3>Harmonies (explore in the Color Harmony lab)</h3>
<ul>
<li><strong>Complementary</strong> — opposite hues (orange/teal). Maximum contrast. Hollywood's skin vs. shadow look exploits that skin tones sit in orange.</li>
<li><strong>Analogous</strong> — neighbours (yellow, orange, red). Calm, unified.</li>
<li><strong>Triadic</strong> — three evenly spaced hues. Vibrant, playful (Wes Anderson).</li>
<li><strong>Split-complementary</strong> — a base plus the two neighbours of its complement. Contrast with less tension.</li>
<li><strong>Monochromatic</strong> — one hue, varying saturation/value. Strong mood (The Matrix green).</li>
</ul>
<h3>Color psychology (cultural, not universal)</h3>
<table><thead><tr><th>Color</th><th>Common associations</th></tr></thead><tbody>
<tr><td>Red</td><td>Passion, danger, power, violence</td></tr>
<tr><td>Orange</td><td>Warmth, energy, nostalgia, friendliness</td></tr>
<tr><td>Yellow</td><td>Happiness, caution, sickness (desaturated)</td></tr>
<tr><td>Green</td><td>Nature, growth, envy, toxicity, the digital</td></tr>
<tr><td>Blue / teal</td><td>Calm, cold, sadness, technology, night</td></tr>
<tr><td>Purple</td><td>Mystery, royalty, the surreal</td></tr>
<tr><td>Desaturation</td><td>Bleakness, war, memory</td></tr>
</tbody></table>
<h3>Color contrast types</h3>
<p>Beyond hue contrast: <strong>warm/cool contrast</strong>, <strong>saturation contrast</strong> (one saturated object in a muted frame — <em>Schindler's List</em> red coat), and <strong>light/dark contrast</strong>. Great grades use 2–3 at once.</p>`,
        keyPoints: ['HSV = hue, saturation, value', 'Complementary = maximum contrast', 'Saturation contrast directs the eye', 'Color meaning is cultural'],
        exercise: 'Use the Color Harmony lab to build palettes for a horror short, a rom-com and a sci-fi ad.',
      },
      {
        slug: 'how-we-see-color',
        title: 'How Cameras and Eyes See Color',
        minutes: 18,
        summary: 'Additive RGB, the Bayer sensor, debayering, and why white balance exists.',
        body: `
<h3>Additive color</h3>
<p>Screens emit Red, Green and Blue light. Full R+G+B = white. Printing is subtractive (CMYK). Everything in video is additive RGB.</p>
<h3>The sensor</h3>
<p>Camera sensors are color-blind photosites behind a <strong>Bayer filter</strong>: 50% green, 25% red, 25% blue (matching our green-heavy sensitivity). <strong>Debayering / demosaicing</strong> reconstructs full RGB per pixel. RAW formats store the pre-debayer data, so you choose white balance, ISO and debayer quality in post.</p>
<h3>White balance</h3>
<p>Our brains auto-correct the color of light; cameras need to be told. Setting white balance tells the camera which color temperature should render as neutral white. Wrong WB = everything shifted orange (too low K setting under daylight is blue, etc.). In post, use temperature/tint or click a neutral area with a white-balance picker.</p>
<h3>Metamerism & skin</h3>
<p>Different light sources (cheap LEDs) can render skin unpleasantly green/magenta even when they "look white". Look for high CRI/TLCI (95+) lights. In grading, skin tones should fall on the <strong>skin tone line</strong> of the vectorscope (~123°, between red and yellow) regardless of ethnicity.</p>`,
        keyPoints: ['Video is additive RGB', 'Bayer = 50% green', 'RAW lets you change WB in post', 'Skin sits on the skin-tone line'],
        exercise: 'Shoot a white sheet of paper under 3 light sources with auto WB disabled. Compare.',
      },
      {
        slug: 'color-spaces-gamma-log',
        title: 'Color Spaces, Gamma, Log & ACES',
        minutes: 26,
        summary: 'The technical core of modern color: gamut, transfer functions, log encoding and color-managed pipelines.',
        body: `
<p>A <strong>color space</strong> = <strong>gamut</strong> (which colors: the triangle of primaries) + <strong>transfer function</strong> (how brightness is encoded: gamma/EOTF) + <strong>white point</strong>.</p>
<table><thead><tr><th>Space</th><th>Gamut</th><th>Use</th></tr></thead><tbody>
<tr><td>Rec.709 / sRGB</td><td>Small</td><td>HD TV, web SDR delivery</td></tr>
<tr><td>DCI-P3 / Display P3</td><td>~25% larger</td><td>Cinema projection, Apple devices</td></tr>
<tr><td>Rec.2020</td><td>Very large</td><td>UHD/HDR delivery container</td></tr>
<tr><td>Camera native (S-Gamut3, ARRI Wide Gamut 4, REDWideGamutRGB, Blackmagic Wide Gamut)</td><td>Huge</td><td>Acquisition</td></tr>
<tr><td>ACES AP0 / AP1</td><td>Encompasses all visible</td><td>Archival / working space</td></tr>
</tbody></table>
<h3>Transfer functions</h3>
<p>Our eyes perceive brightness logarithmically. <strong>Gamma 2.4</strong> (BT.1886, Rec.709 broadcast), <strong>2.2</strong> (sRGB/web), <strong>PQ (ST 2084)</strong> and <strong>HLG</strong> for HDR. <strong>Log curves</strong> (S-Log3, LogC4, V-Log, Apple Log, BMD Film) spread scene stops evenly across code values to preserve highlights and shadows — hence the grey, flat image.</p>
<h3>Scene-referred vs display-referred</h3>
<p>Display-referred grading works directly in Rec.709 — simple but highlights clip easily. <strong>Scene-referred</strong> pipelines (DaVinci Wide Gamut/Intermediate, ACEScct) grade in a huge working space and convert to the display at the end with an <strong>output transform</strong>. One grade can then deliver SDR, HDR and cinema.</p>
<h3>Transforming log footage</h3>
<ol>
<li><strong>Color Space Transform (CST)</strong> node / Resolve Color Management — mathematically exact.</li>
<li><strong>Manufacturer LUT</strong> — a fixed lookup table (e.g. S-Log3 → Rec.709). Easy, but clips data outside its range — grade <em>before</em> the LUT.</li>
<li><strong>Manual</strong> — curves/contrast. Not recommended for log.</li>
</ol>
<h3>What a LUT actually is</h3>
<p>A 3D LUT is a cube (e.g. 33×33×33 points) mapping input RGB → output RGB, with interpolation between points. It cannot be adjusted, only applied; it's a destination, not a tool.</p>`,
        keyPoints: ['Color space = gamut + transfer + white point', 'Log preserves dynamic range', 'Scene-referred grading → multi-format delivery', 'Grade before the LUT'],
        exercise: 'Download a free S-Log3 or Apple Log sample. Transform it once with a LUT and once with a CST. Compare highlight roll-off.',
      },
      {
        slug: 'reading-scopes',
        title: 'Reading Scopes Like a Colorist',
        minutes: 22,
        summary: 'Your eyes lie — scopes don\'t. Waveform, RGB parade, vectorscope and histogram explained.',
        body: `
<h3>Waveform (luma)</h3>
<p>X axis = position across the image (left to right). Y axis = brightness (0–100 IRE or 0–1023). Use it to set black point (just above 0), white point (90–100 for SDR) and check exposure of faces (typically 50–70 IRE for Caucasian skin, lower for darker skin — <em>expose for the person, not a number</em>).</p>
<h3>RGB parade</h3>
<p>Three waveforms side by side for R, G, B. A neutral grey or white object has matching heights in all three. If blue's top is higher than red's in the highlights, the highlights are cool. Balance by aligning the bottoms (shadows), middles and tops.</p>
<h3>Vectorscope</h3>
<p>A circular plot of hue (angle) and saturation (distance from centre). The <strong>skin tone line</strong> sits between red and yellow. A tight blob in the middle = desaturated; a trace pulled toward one target = color cast. Broadcast-legal saturation stays inside the 75% targets.</p>
<h3>Histogram</h3>
<p>Distribution of pixel values. A pile against the right wall = clipped highlights; against the left = crushed blacks.</p>
<p>The Color Grading lab draws a live waveform, parade, vectorscope and histogram as you grade.</p>`,
        keyPoints: ['Waveform = brightness by position', 'Parade = balance', 'Vectorscope = hue & saturation', 'Skin on the skin-tone line'],
        exercise: 'In the Color Grading lab, neutralise the "warm cast" preset using only the RGB parade.',
      },
      {
        slug: 'hdr-and-displays',
        title: 'HDR, Displays & Monitoring',
        minutes: 16,
        summary: 'What HDR really is, why your laptop is lying to you, and how to monitor accurately.',
        body: `
<h3>HDR</h3>
<p>SDR is mastered to 100 nits peak. HDR masters to 1,000–4,000 nits with PQ or HLG transfer and a Rec.2020 container. Formats: <strong>HDR10</strong> (static metadata), <strong>HDR10+</strong> and <strong>Dolby Vision</strong> (dynamic, per-scene metadata), <strong>HLG</strong> (broadcast, backwards compatible).</p>
<p>HDR isn't "brighter everything" — it's more <em>headroom</em> for specular highlights (sun, chrome, fire) while mid-tones stay similar to SDR.</p>
<h3>Monitoring</h3>
<ul>
<li>Use a calibrated reference monitor via a video I/O device (Blackmagic UltraStudio/DeckLink, AJA) — the GUI viewer goes through the OS color management.</li>
<li>Calibrate with a probe (Calibrite, X-Rite) and software (Calman, DisplayCAL) at least monthly.</li>
<li>Grade in a dim room with neutral grey walls and a 6500K bias light behind the monitor.</li>
<li>Check your final export on phones — most viewers watch there.</li>
</ul>
<h3>The Mac "gamma shift" problem</h3>
<p>QuickTime on macOS has historically displayed Rec.709 (gamma 2.4) files with a 1.96 gamma, making them look washed out. Use "Rec.709-A" in Resolve or proper color tags (1-1-1) and check on target devices.</p>`,
        keyPoints: ['SDR 100 nits, HDR 1000+', 'Dolby Vision = dynamic metadata', 'Monitor via video I/O, calibrated', 'Check on phones'],
        exercise: 'Compare your export in QuickTime, VLC, a browser and a phone. Document the differences.',
      },
    ],
    quiz: [
      { q: 'Orange & teal grading relies on which harmony?', options: ['Analogous', 'Complementary', 'Monochromatic', 'Triadic'], answer: 1, why: 'Orange and teal sit opposite each other on the wheel.' },
      { q: 'Why does log footage look flat and grey?', options: ['It is broken', 'It stores dynamic range evenly across code values', 'It has no color', 'It is 8-bit'], answer: 1, why: 'Log curves compress highlights and lift shadows to preserve range.' },
      { q: 'On a vectorscope, skin tones fall…', options: ['Toward blue', 'On the skin-tone line between red and yellow', 'In the centre only', 'Toward green'], answer: 1, why: 'All skin tones share a hue near the skin-tone line; only saturation and luminance vary.' },
      { q: 'Which scope best shows a color cast in the highlights?', options: ['Histogram', 'RGB parade', 'Audio meter', 'Luma waveform'], answer: 1, why: 'The parade separates R, G and B levels.' },
      { q: 'SDR content is typically mastered to a peak of…', options: ['100 nits', '1000 nits', '4000 nits', '10 nits'], answer: 0, why: 'SDR reference white is 100 nits.' },
      { q: 'What is a 3D LUT?', options: ['A lens', 'A table mapping input RGB to output RGB', 'A codec', 'An audio filter'], answer: 1, why: 'A LUT is a fixed lookup cube.' },
    ],
  },

  {
    n: 7,
    slug: 'color-grading',
    title: 'Color Grading: Correction to Looks',
    theme: 'From "fix it" to "make them feel it"',
    goal: 'Grade any footage from flat log to a polished, consistent, stylised film look using a professional node workflow.',
    outcomes: [
      'Perform primary correction with lift/gamma/gain and offset',
      'Isolate with qualifiers, power windows and tracking',
      'Match shots across a scene',
      'Build film emulation looks and your own LUT/PowerGrade library',
    ],
    labs: ['color-grading', 'color-harmony'],
    project: {
      title: 'The Look Book',
      brief: 'Grade the same 5-shot scene in 4 looks: natural commercial, teal & orange blockbuster, bleach bypass war film, and a 70s Kodak film emulation. Match all shots within each look.',
      deliverables: ['4 graded versions', 'Before/after split stills', 'Your node trees exported as PowerGrades or presets'],
    },
    lessons: [
      {
        slug: 'primary-correction',
        title: 'Primary Correction: Lift, Gamma, Gain, Offset',
        minutes: 24,
        summary: 'The foundation of every grade: exposure, contrast, balance and saturation.',
        body: `
<h3>The controls</h3>
<ul>
<li><strong>Lift</strong> — shadows (affects whites least).</li>
<li><strong>Gamma</strong> — midtones.</li>
<li><strong>Gain</strong> — highlights (multiplies; blacks stay put).</li>
<li><strong>Offset</strong> — shifts everything equally. On log footage it's the best exposure and balance control (like a printer light).</li>
<li><strong>Contrast + Pivot</strong> — expands around a pivot point.</li>
<li><strong>Temperature / Tint</strong> — global white balance.</li>
<li><strong>Saturation</strong> vs <strong>Vibrance</strong> — vibrance protects already-saturated colors and skin.</li>
</ul>
<h3>The correction order</h3>
<ol>
<li>Normalise (CST / input transform).</li>
<li>Exposure — set black and white points on the waveform.</li>
<li>Contrast.</li>
<li>Balance — neutralise casts using the parade on something that should be neutral.</li>
<li>Saturation.</li>
</ol>
<p>Practise in the Color Grading lab: every control there maps to these exact operations, and the scopes update live.</p>
<div class="callout tip"><strong>Rule:</strong> Make big moves with few controls, then refine. Ten tiny adjustments fighting each other create "mush".</div>`,
        keyPoints: ['Lift/Gamma/Gain = shadows/mids/highs', 'Offset for log balance', 'Exposure → contrast → balance → saturation'],
        exercise: 'Load your own frame in the Color Grading lab, set blacks, whites and neutral balance using scopes only.',
      },
      {
        slug: 'node-workflow',
        title: 'Node-Based Grading Workflow',
        minutes: 20,
        summary: 'How pros structure a grade in DaVinci Resolve nodes (and the equivalent in Premiere Lumetri layers).',
        body: `
<h3>Why nodes</h3>
<p>Each node is an isolated operation; order matters because color math is not commutative. Nodes make grades readable, reusable and adjustable.</p>
<h3>A professional node tree</h3>
<pre>[01 CST in] → [02 Exposure] → [03 Balance] → [04 Contrast/Curve]
      → [05 Sat] → [06 Skin (qualifier)] → [07 Window/vignette]
      → [08 Look] → [09 Film grain/halation] → [10 CST out]</pre>
<ul>
<li><strong>Serial nodes</strong> — sequential processing.</li>
<li><strong>Parallel nodes</strong> — operations on the same input, mixed together.</li>
<li><strong>Layer mixer</strong> — lower node has priority; useful for keyed overrides.</li>
<li><strong>Outside node</strong> — affect everything except the key (great for "everything but skin").</li>
<li><strong>Splitter/combiner</strong> — work per channel.</li>
</ul>
<h3>Group and timeline grades</h3>
<p>Resolve's <strong>pre-clip group</strong> (camera normalisation), <strong>clip</strong> (shot fixes), <strong>post-clip group</strong> (scene look) and <strong>timeline</strong> grade (show LUT/grain) mean you set a look once and every shot inherits it.</p>
<p>In Premiere: stack adjustment layers with Lumetri, one per role (Look, Film grain) above clip-level corrections.</p>`,
        keyPoints: ['One job per node', 'Order matters', 'Groups apply looks to many shots', 'Label nodes'],
        exercise: 'Build and save the 10-node template above as a PowerGrade.',
      },
      {
        slug: 'secondaries-qualifiers-windows',
        title: 'Secondaries: Qualifiers, Windows & Tracking',
        minutes: 24,
        summary: 'Isolate skin, skies, eyes and products. Direct the viewer\'s eye with light.',
        body: `
<h3>Qualifiers (keys)</h3>
<p>Select pixels by hue, saturation and luminance (HSL). Classic uses: skin smoothing and correction, sky deepening, making a product color pop. Refine with <em>clean black/white</em>, blur radius and denoise of the matte. Check the matte (highlight mode) always.</p>
<h3>Power windows / masks</h3>
<p>Shapes (circle, linear, polygon, curve) with soft edges. Use them to:</p>
<ul><li>Relight faces (lift the eyes, darken the background)</li><li>Create vignettes that are <em>not</em> obvious</li><li>Fake motivated light from windows/lamps</li><li>Gradient-darken skies</li></ul>
<h3>Tracking</h3>
<p>Track windows to moving subjects (point/planar tracking in Resolve; mask tracking in Premiere). Then fix drifted keyframes manually.</p>
<h3>AI masks</h3>
<p>Resolve <strong>Magic Mask</strong> (person/feature), <strong>Depth Map</strong> (background vs foreground), <strong>Relight</strong>, and Premiere's AI object masking isolate subjects in seconds. Check edges and hair carefully.</p>
<h3>Hue vs curves</h3>
<p>Hue vs Hue, Hue vs Sat, Hue vs Lum, Lum vs Sat, Sat vs Sat — surgical tools. E.g. Hue vs Hue: push greenish foliage toward teal; Lum vs Sat: desaturate highlights to look filmic.</p>`,
        keyPoints: ['HSL qualifiers for color-based isolation', 'Windows to relight and direct the eye', 'Track then refine', 'Hue vs curves for surgical moves'],
        exercise: 'Grade a portrait: brighten eyes with a tracked window, darken background 1 stop, smooth skin with a qualifier.',
      },
      {
        slug: 'shot-matching-skin',
        title: 'Shot Matching & Perfect Skin Tones',
        minutes: 18,
        summary: 'Consistency across a scene is what separates professional grades.',
        body: `
<h3>Matching workflow</h3>
<ol>
<li>Pick a <strong>hero shot</strong> per scene and grade it first.</li>
<li>Display it beside the next shot (split-screen / reference wipe / gallery stills).</li>
<li>Match using scopes: black levels, white levels, then midtones on the waveform; then balance in the parade; then saturation on the vectorscope.</li>
<li>Match <em>skin</em> above all — viewers forgive a background shift, not a face shift.</li>
</ol>
<h3>Auto match tools</h3>
<p>Resolve "Shot Match", Premiere "Color Match" (with face detection) give a starting point — always refine by eye.</p>
<h3>Skin tone rules</h3>
<ul><li>Hue on the skin tone line.</li><li>Not too saturated (look toward ~30–40% of the distance to the red target).</li><li>Keep detail; avoid plastic smoothing.</li><li>Deeper skin tones need texture and a rich, not grey, value — don't lift them to match a lighter face's luminance.</li></ul>`,
        keyPoints: ['Grade the hero first', 'Match blacks → whites → mids → balance → sat', 'Faces matter most'],
        exercise: 'Match 3 clips shot at different times of day so they look like one moment.',
      },
      {
        slug: 'looks-and-film-emulation',
        title: 'Building Looks & Film Emulation',
        minutes: 24,
        summary: 'Teal-orange, bleach bypass, Kodak 2383, day-for-night — and the physics behind film.',
        body: `
<h3>Classic look recipes</h3>
<ul>
<li><strong>Teal & orange</strong> — push shadows toward teal (lift/offset) while protecting skin (key skin and keep it warm). Keep it subtle or it looks dated.</li>
<li><strong>Bleach bypass</strong> — high contrast, low saturation, silvery. Blend a desaturated, contrasty luminance layer over the image (overlay/soft light mix ~40%).</li>
<li><strong>Day-for-night</strong> — underexpose 2–3 stops, cool white balance, lower saturation, keep tiny specular highlights, add window/practical glows.</li>
<li><strong>Vintage 70s</strong> — lifted (faded) blacks, warm highlights, green-ish shadows, soft contrast, grain.</li>
<li><strong>Clean commercial</strong> — accurate skin, bright, saturated brand colors, clean whites.</li>
</ul>
<h3>Film emulation — what makes film look like film</h3>
<ol>
<li><strong>Characteristic curve</strong> — soft highlight roll-off (shoulder) and toe in shadows.</li>
<li><strong>Subtractive color</strong> — saturated colors get <em>darker</em> (density), unlike digital where they get brighter.</li>
<li><strong>Print stock</strong> look (Kodak 2383/2393) — warm-ish highlights, cyan-ish shadows.</li>
<li><strong>Halation</strong> — red/orange glow around bright highlights from light scattering in the film base.</li>
<li><strong>Grain</strong> — organic, luminance-dependent, varies per frame.</li>
<li><strong>Gate weave & bloom</strong> — very subtle.</li>
</ol>
<p>Resolve 19/20 has Film Look Creator, Halation and Film Grain effects; Dehancer and FilmConvert are popular plugins.</p>
<h3>Making your own LUT</h3>
<p>Once a look is approved, export it as a .cube LUT (Resolve: Generate LUT) — but only apply LUTs to footage in the same color space they were built in.</p>`,
        keyPoints: ['Protect skin in stylised looks', 'Film = roll-off, density, halation, grain', 'LUTs only work in their native color space'],
        exercise: 'Recreate the four looks in the Color Grading lab presets, then on your own footage.',
      },
    ],
    quiz: [
      { q: 'Which control is best for overall exposure/balance on log footage?', options: ['Gain', 'Offset', 'Saturation', 'Hue vs Hue'], answer: 1, why: 'Offset shifts all values equally, like printer lights.' },
      { q: 'In film, saturated colors tend to become…', options: ['Brighter', 'Darker (denser)', 'Greener', 'Grey'], answer: 1, why: 'Subtractive dye density darkens saturated colors.' },
      { q: 'What is halation?', options: ['Rolling shutter', 'A glow around highlights from light scattering in film', 'Sharpening', 'Aliasing'], answer: 1, why: 'Light bounces off the film base back through the emulsion.' },
      { q: 'When matching shots, what should you prioritise?', options: ['Sky color', 'Skin tones', 'Vignette', 'Grain'], answer: 1, why: 'Audiences notice face shifts first.' },
      { q: 'A qualifier selects pixels by…', options: ['Shape', 'Hue, saturation and luminance', 'Timecode', 'Audio'], answer: 1, why: 'HSL qualification.' },
    ],
  },

  {
    n: 8,
    slug: 'motion-graphics',
    title: 'Motion Graphics, Typography & Animation',
    theme: 'Make anything move beautifully',
    goal: 'Animate titles, graphics and elements with professional easing, typography and design principles.',
    outcomes: [
      'Use keyframe interpolation and the graph editor',
      'Apply the 12 principles of animation to motion design',
      'Design legible, beautiful typography for video',
      'Build templates (MOGRTs / Fusion macros / Motion templates)',
    ],
    labs: ['easing', 'aspect-safe-zones'],
    project: {
      title: 'Brand Motion Kit',
      brief: 'Design a motion package for a fictional brand: animated logo sting (5s), lower third, title card, end screen and a transition — all in one consistent style.',
      deliverables: ['5 animated elements', 'One reusable template with editable text', 'Style guide frame (fonts, colors, easing)'],
    },
    lessons: [
      {
        slug: 'keyframes-and-easing',
        title: 'Keyframes, Interpolation & Easing',
        minutes: 22,
        summary: 'Linear motion looks robotic. Learn bezier curves, the graph editor and the easing that makes things feel alive.',
        body: `
<h3>Keyframes</h3>
<p>A keyframe stores a value at a time. The software <strong>interpolates</strong> in-between. Interpolation types: <strong>linear</strong> (constant speed), <strong>bezier/ease</strong> (accelerating/decelerating), <strong>hold</strong> (instant jump), <strong>auto/continuous bezier</strong>.</p>
<h3>Easing</h3>
<ul>
<li><strong>Ease-out</strong> (decelerate at end) — things arriving. Most UI entrances.</li>
<li><strong>Ease-in</strong> (accelerate from start) — things leaving.</li>
<li><strong>Ease-in-out</strong> — moving from rest to rest.</li>
<li><strong>Overshoot / back</strong> — passes the target and settles. Playful.</li>
</ul>
<h3>Graph editor</h3>
<p>The <strong>speed graph</strong> shows velocity over time; the <strong>value graph</strong> shows the property value. A strong modern "snappy" ease: steep start, long gentle tail — e.g. cubic-bezier(0.16, 1, 0.3, 1) ("expo out"). In After Effects, set influence to 80–95% on the incoming handle.</p>
<p>Build and preview curves in the Easing Playground lab — it outputs the cubic-bezier values you can match in any app.</p>`,
        keyPoints: ['Never leave linear keyframes on motion', 'Ease-out for entrances, ease-in for exits', 'Learn the speed graph'],
        exercise: 'Recreate "expo out" and "back out" in the Easing lab, then in your NLE.',
      },
      {
        slug: 'principles-of-animation',
        title: 'The 12 Principles of Animation for Motion Design',
        minutes: 18,
        summary: 'Disney\'s principles, translated for titles, logos and UI animation.',
        body: `
<ol>
<li><strong>Squash & stretch</strong> — conveys weight and elasticity.</li>
<li><strong>Anticipation</strong> — a small move opposite before the main move.</li>
<li><strong>Staging</strong> — one clear idea at a time.</li>
<li><strong>Straight ahead vs pose to pose</strong> — keyframing strategy.</li>
<li><strong>Follow through & overlapping action</strong> — parts settle at different times. Stagger text letters by 1–2 frames.</li>
<li><strong>Slow in & slow out</strong> — easing.</li>
<li><strong>Arcs</strong> — natural motion follows curved paths.</li>
<li><strong>Secondary action</strong> — supporting motion (a shadow, a particle).</li>
<li><strong>Timing</strong> — frames per action define weight and mood.</li>
<li><strong>Exaggeration</strong> — push it further than real.</li>
<li><strong>Solid drawing</strong> — depth and volume (3D layers, parallax).</li>
<li><strong>Appeal</strong> — make it pleasing.</li>
</ol>
<p>Stagger, overshoot and arcs alone will lift your motion graphics above 90% of what's online.</p>`,
        keyPoints: ['Stagger elements', 'Anticipate big moves', 'Animate on arcs', 'One idea at a time'],
        exercise: 'Animate a logo using anticipation, overshoot and stagger.',
      },
      {
        slug: 'typography-for-video',
        title: 'Typography for Video',
        minutes: 20,
        summary: 'Fonts, hierarchy, legibility, kerning and the rules of on-screen text.',
        body: `
<h3>Type classifications</h3>
<p>Serif (tradition, elegance), sans-serif (modern, clean — most video text), display (personality), monospace (tech), script (sparingly).</p>
<h3>Legibility rules</h3>
<ul>
<li>Minimum size ~4–5% of frame height for body text on TV/phone.</li>
<li>Contrast: add a subtle shadow, stroke or background plate on busy footage.</li>
<li>Keep within <strong>title-safe</strong> (90%) and platform UI-safe zones — check in the Aspect Ratio & Safe Zones lab.</li>
<li>Reading time: ~3 words/second + 1 second.</li>
<li>Two typefaces maximum. Use weight and size for hierarchy.</li>
</ul>
<h3>Kerning, tracking, leading</h3>
<p><strong>Kerning</strong> = space between specific letter pairs (fix "AV", "To"). <strong>Tracking</strong> = uniform spacing (wide tracking on uppercase looks cinematic). <strong>Leading</strong> = line spacing (~120–150% for multiple lines).</p>
<h3>Kinetic typography</h3>
<p>Animate text to the rhythm of speech: word-by-word reveals, emphasis via scale/color, synced to audio transients. The 2026 caption trends are in Week 10.</p>`,
        keyPoints: ['Two typefaces max', 'Respect safe zones', '3 words/s + 1s reading time', 'Kern display text'],
        exercise: 'Design 3 lower thirds with different typographic hierarchies.',
      },
      {
        slug: 'shape-layers-and-design',
        title: 'Shape Layers, Masks & Design Principles',
        minutes: 18,
        summary: 'Composition, grids, color and shape — the design side of motion graphics.',
        body: `
<h3>Design principles</h3>
<p>Contrast, alignment, repetition, proximity (CARP), plus hierarchy, balance and white space. Use a grid (12-column or 8-px baseline) so elements align across all frames.</p>
<h3>Shape layers</h3>
<p>Vector shapes that scale infinitely. Animate <strong>Trim Paths</strong> for line-draw reveals, <strong>Repeater</strong> for patterns, <strong>Offset Paths</strong> for growing shapes. Resolve Fusion has equivalent spline tools; Premiere's Essential Graphics covers basics.</p>
<h3>Track mattes and masks</h3>
<p>Reveal text through a shape (alpha matte) or only where a shape is (luma matte). This is the basis of countless slick reveals.</p>
<h3>Parallax and 2.5D</h3>
<p>Separate a still image into layers (foreground, subject, background) and move a virtual camera — the "Ken Burns on steroids" effect used in documentaries.</p>`,
        keyPoints: ['CARP principles', 'Trim paths for line reveals', 'Mattes for reveals', 'Parallax for depth'],
        exercise: 'Make a 2.5D parallax animation from a single photo.',
      },
      {
        slug: 'expressions-templates-automation',
        title: 'Expressions, Templates & Automation',
        minutes: 18,
        summary: 'Work once, reuse forever. Expressions, MOGRTs, Fusion macros and data-driven graphics.',
        body: `
<h3>Expressions (After Effects)</h3>
<pre>wiggle(3, 20)                      // random shake: 3x/sec, 20px
loopOut("cycle")                   // loop keyframes forever
time * 90                          // constant rotation 90°/s
thisComp.layer("Ctrl").effect("Slider")("Slider")  // link to control</pre>
<p>Resolve Fusion uses expressions and Lua scripting similarly; Final Cut uses Motion's behaviors and published parameters.</p>
<h3>Templates</h3>
<ul>
<li><strong>MOGRT</strong> (Premiere) — After Effects comps with exposed controls.</li>
<li><strong>Fusion macros</strong> — Resolve titles/effects with custom controls.</li>
<li><strong>Motion templates</strong> — Final Cut.</li>
</ul>
<h3>Data-driven graphics</h3>
<p>Import CSV data into MOGRTs or use scripts to batch-create hundreds of lower thirds or versions (Templater, Dataclay). The pro move for agency jobs with 30 language versions.</p>`,
        keyPoints: ['wiggle, loopOut, time', 'Expose controls via templates', 'Automate repetitive versions'],
        exercise: 'Build a lower-third template with editable name, title and color.',
      },
    ],
    quiz: [
      { q: 'An element entering the screen should usually use…', options: ['Ease-in', 'Ease-out', 'Linear', 'Hold'], answer: 1, why: 'It decelerates as it arrives.' },
      { q: 'Kerning adjusts…', options: ['Line spacing', 'Space between specific letter pairs', 'Font weight', 'Text color'], answer: 1, why: 'Kerning = pair spacing; tracking = uniform.' },
      { q: 'Which expression creates a random shake in After Effects?', options: ['loopOut()', 'wiggle()', 'time*90', 'linear()'], answer: 1, why: 'wiggle(freq, amp).' },
      { q: 'Overlapping action in text animation means…', options: ['All letters move at once', 'Staggering elements so they settle at different times', 'Using two fonts', 'Using hold keyframes'], answer: 1, why: 'Staggered offsets feel natural.' },
      { q: 'A good rule for on-screen text duration is…', options: ['1 second always', '~3 words per second + 1 second', '10 seconds always', 'As short as possible'], answer: 1, why: 'Gives most viewers time to read.' },
    ],
  },
];
