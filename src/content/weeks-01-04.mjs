// PHASE 1 — FOUNDATIONS (Weeks 1–4)
// Lesson bodies are trusted, author-written HTML rendered at build time.

export const weeks1to4 = [
  {
    n: 1,
    slug: 'how-video-works',
    title: 'How Video Actually Works',
    theme: 'Pixels, frames, codecs and the engine under every editor',
    goal: 'Understand the physical and digital nature of video so no technical setting ever confuses you again.',
    outcomes: [
      'Explain frame rate, resolution, bit depth and chroma subsampling in plain words',
      'Choose between intra-frame and long-GOP codecs for editing',
      'Build a proxy workflow for heavy camera files',
      'Describe how an NLE decodes, caches and plays back a timeline',
    ],
    labs: ['shutter-fps', 'bitrate-calculator', 'timecode', 'compression'],
    project: {
      title: 'Technical Spec Sheet',
      brief: 'Shoot 10 short clips on any camera or phone at different frame rates and resolutions. Inspect each with MediaInfo and fill a spec sheet: codec, container, bitrate, bit depth, chroma subsampling, GOP type, color space.',
      deliverables: ['Spec sheet (table) for 10 clips', 'One paragraph on which clip is best for grading and why', 'A proxy set generated for the heaviest clip'],
    },
    lessons: [
      {
        slug: 'frames-fps-and-motion',
        title: 'Frames, Frame Rates & the Illusion of Motion',
        minutes: 18,
        summary: 'Video is a sequence of still images. How many you show per second, and how long each was exposed, define how motion feels.',
        body: `
<p>Every video is a stack of still photographs called <strong>frames</strong>. Played fast enough, your brain fuses them into motion (the <em>phi phenomenon</em> and <em>beta movement</em>). The number of frames per second (<strong>fps</strong>) sets the texture of motion.</p>
<table>
<thead><tr><th>Frame rate</th><th>Where it's used</th><th>Feel</th></tr></thead>
<tbody>
<tr><td>23.976 / 24</td><td>Cinema, narrative, most premium content</td><td>"Filmic" — a little motion blur, dreamlike</td></tr>
<tr><td>25</td><td>PAL broadcast (Europe, India, Australia)</td><td>Similar to 24, matches 50 Hz power grids</td></tr>
<tr><td>29.97 / 30</td><td>NTSC broadcast, YouTube, social</td><td>Neutral, "video" look</td></tr>
<tr><td>50 / 59.94 / 60</td><td>Sports, gaming, live events</td><td>Hyper-real, smooth</td></tr>
<tr><td>120 / 240</td><td>Slow motion source</td><td>Conformed to 24 = 5× / 10× slow-mo</td></tr>
</tbody></table>
<h3>Shutter speed and the 180° rule</h3>
<p>Frame rate tells you how many frames; <strong>shutter speed</strong> tells you how long each frame was exposed. The <strong>180° shutter rule</strong> says shutter = 1 / (2 × fps). At 24 fps use 1/48 (or 1/50). This produces the motion blur audiences associate with "cinema". A faster shutter (1/500) gives crisp, stuttery "Saving Private Ryan" motion; a slower one (360°) gives smeary, dreamy motion.</p>
<h3>Why 23.976 and not 24?</h3>
<p>When color was added to NTSC TV in 1953, the frame rate was slowed by 1000/1001 to avoid interference between the color subcarrier and the sound carrier. That's why 30 became 29.97 and 24 became 23.976. You'll meet this again in <em>drop-frame timecode</em>.</p>
<h3>Conforming vs. speed changes</h3>
<p>If you shoot 120 fps and <strong>conform</strong> (interpret) it to 24 fps, every recorded frame is shown once — smooth 5× slow motion with no invented frames. If you just slow a 24 fps clip to 20%, the editor must repeat frames or invent them (frame blending / optical flow), which looks worse.</p>
<div class="callout tip"><strong>Pro move:</strong> Set your sequence frame rate to the <em>delivery</em> frame rate before you cut a single clip. Changing it later breaks every edit point.</div>`,
        keyPoints: ['Frame rate defines motion texture', '180° rule: shutter = 1/(2×fps)', 'Conform high-fps footage for clean slow-mo', 'Match sequence fps to delivery fps first'],
        exercise: 'Open the Shutter & FPS lab. Compare 24 fps at 180° vs 24 fps at 45°. Write two sentences describing the emotional difference.',
      },
      {
        slug: 'resolution-aspect-bit-depth',
        title: 'Resolution, Aspect Ratio, Bit Depth & Chroma Subsampling',
        minutes: 22,
        summary: 'How much detail and how much color information each frame really holds — and why it decides how far you can push a grade.',
        body: `
<h3>Resolution</h3>
<p>HD = 1920×1080, UHD 4K = 3840×2160, DCI 4K = 4096×2160, 8K = 7680×4320. Shooting larger than delivery gives you room to <strong>reframe</strong>, stabilize and punch in without losing sharpness — a 4K source in a 1080p timeline gives you a clean 2× zoom.</p>
<h3>Aspect ratio</h3>
<p>The width-to-height ratio. 16:9 (1.78) for TV/YouTube, 9:16 for Shorts/Reels/TikTok, 4:5 for feed posts, 1:1 square, 2.39:1 anamorphic "scope" cinema, 1.85:1 flat cinema, 4:3 for nostalgic or documentary looks. Aspect ratio is a storytelling choice: wide ratios emphasize landscape and isolation; tall ratios emphasize the single human.</p>
<h3>Bit depth</h3>
<p>Bit depth is how many tonal steps each color channel can store.</p>
<ul>
<li><strong>8-bit</strong>: 256 levels per channel = 16.7 million colors. Fine for delivery, fragile for grading — banding appears in skies.</li>
<li><strong>10-bit</strong>: 1,024 levels = 1.07 billion colors. The minimum for log footage and HDR.</li>
<li><strong>12-bit / RAW</strong>: 4,096+ levels. Maximum latitude.</li>
</ul>
<h3>Chroma subsampling (4:4:4, 4:2:2, 4:2:0)</h3>
<p>Our eyes are more sensitive to brightness (<em>luma</em>) than color (<em>chroma</em>), so cameras store less color. In a 4×2 block of pixels:</p>
<ul>
<li><strong>4:4:4</strong> — full color for every pixel. Best for keying and VFX.</li>
<li><strong>4:2:2</strong> — half horizontal color resolution. Broadcast and pro standard.</li>
<li><strong>4:2:0</strong> — quarter color resolution. Most phones, consumer cameras, and all streaming delivery.</li>
</ul>
<div class="callout warn"><strong>Why it matters:</strong> Green-screen keys on 8-bit 4:2:0 footage get blocky, crunchy edges. If you know you'll key, shoot 10-bit 4:2:2 or better.</div>`,
        keyPoints: ['Shoot bigger than delivery for reframing room', '10-bit is the floor for serious grading', '4:2:2 or 4:4:4 for keying', 'Aspect ratio is a storytelling tool'],
        exercise: 'Open the Aspect Ratio lab and compose one imaginary shot in 2.39:1 and the same shot in 9:16. What has to change?',
      },
      {
        slug: 'codecs-containers-compression',
        title: 'Codecs, Containers & How Compression Works',
        minutes: 25,
        summary: 'MP4 is not a codec. Learn the difference, how DCT and motion prediction squeeze video, and which codecs to edit with.',
        body: `
<p>A <strong>container</strong> (.mp4, .mov, .mxf, .mkv) is a box holding streams: video, audio, timecode, metadata. A <strong>codec</strong> (H.264, HEVC, ProRes, DNxHR, AV1, BRAW) is the algorithm that compresses and decompresses (<em>co</em>der-<em>dec</em>oder) the video inside.</p>
<h3>How compression works — the 4 stages</h3>
<ol>
<li><strong>Color transform</strong> — RGB is converted to Y′CbCr (luma + two color differences) and chroma is subsampled.</li>
<li><strong>Transform (DCT)</strong> — each block of pixels (8×8 up to 64×64 in modern codecs) becomes frequency coefficients. Smooth areas collapse into a few numbers.</li>
<li><strong>Quantization</strong> — high-frequency detail is rounded off. This is where quality is actually lost, and it's what bitrate controls.</li>
<li><strong>Entropy coding</strong> — lossless packing of the results (CABAC in H.264/HEVC).</li>
</ol>
<h3>Intra-frame vs. long-GOP</h3>
<p><strong>Intra-frame</strong> codecs (ProRes, DNxHR, Cineform, All-I) compress each frame independently. Large files, but smooth scrubbing and editing.</p>
<p><strong>Long-GOP</strong> (Group of Pictures) codecs (H.264, HEVC, AV1) store a full <strong>I-frame</strong> then only differences: <strong>P-frames</strong> (predicted from previous) and <strong>B-frames</strong> (predicted from both directions) using <em>motion vectors</em>. Tiny files, but to show frame 37 the computer may need to decode frames 30–36 first. That's why H.264 scrubbing stutters.</p>
<table>
<thead><tr><th>Use</th><th>Best choice</th></tr></thead>
<tbody>
<tr><td>Acquisition (pro)</td><td>RAW (BRAW, R3D, ProRes RAW, ARRIRAW) or ProRes 422 HQ</td></tr>
<tr><td>Editing / intermediates</td><td>ProRes 422, DNxHR HQ, Cineform</td></tr>
<tr><td>Proxies</td><td>ProRes Proxy, DNxHR LB, H.264 low-res</td></tr>
<tr><td>Mastering</td><td>ProRes 4444 XQ, DNxHR 444, uncompressed/EXR for VFX</td></tr>
<tr><td>Web delivery</td><td>H.264 (universal), HEVC (HDR, efficiency), AV1 (best efficiency, growing support)</td></tr>
</tbody></table>
<h3>Bitrate</h3>
<p>Bits per second of data. Constant (CBR) vs variable (VBR). Higher bitrate = less quantization = more detail. Use the Bitrate Calculator lab to predict file sizes and drive capacity.</p>`,
        keyPoints: ['Container ≠ codec', 'Quantization is where quality is lost', 'Edit in intra-frame, deliver in long-GOP', 'Bitrate controls quality within a codec'],
        exercise: 'Calculate in the Bitrate lab how many hours of ProRes 422 HQ 4K at 25 fps fit on a 2 TB drive.',
      },
      {
        slug: 'inside-the-nle-engine',
        title: 'Inside the Engine: How Editing Software Works',
        minutes: 24,
        summary: 'What actually happens between pressing spacebar and seeing a frame — decode, cache, GPU processing, and why your timeline turns red.',
        body: `
<p>A Non-Linear Editor (NLE) never changes your original files. It stores a <strong>timeline</strong>: a data structure of references — "play file A from frame 120 to 480, apply effect X, then file B…". This is <em>non-destructive editing</em>.</p>
<h3>The playback pipeline (per frame)</h3>
<ol>
<li><strong>Timeline resolve</strong> — the engine figures out which clips, on which tracks, are visible at this time.</li>
<li><strong>Decode</strong> — compressed frames are decoded, ideally by hardware decoders (NVDEC, Intel Quick Sync, Apple Media Engine). If hardware can't decode your codec (e.g. 10-bit 4:2:2 H.264 on some GPUs), the CPU does it — slowly.</li>
<li><strong>Input transform</strong> — source color space is interpreted (Log → working space, input LUTs).</li>
<li><strong>Effects & compositing</strong> — on the GPU via CUDA, Metal or OpenCL, in 16- or 32-bit float precision.</li>
<li><strong>Output transform</strong> — converted to the display/timeline color space.</li>
<li><strong>Display</strong> — pushed to the viewer or a video I/O card for a calibrated monitor.</li>
</ol>
<p>If steps 1–5 can't finish within one frame interval (41.7 ms at 24 fps), frames drop. The engine then relies on the <strong>render cache</strong>: pre-computed frames stored on disk (the red/yellow/green bar above your timeline in Premiere; "Smart Cache" in Resolve; background rendering in Final Cut).</p>
<h3>Why proxies work</h3>
<p>Proxies replace heavy media with lightweight copies during editing. The timeline still references originals; at export, the engine swaps back. You change decode cost, not the edit.</p>
<h3>Memory, VRAM & bottlenecks</h3>
<ul>
<li><strong>CPU</strong> — decoding long-GOP, some effects, audio.</li>
<li><strong>GPU / VRAM</strong> — color, effects, AI tools, scaling. Resolve with heavy noise reduction needs 12 GB+ VRAM at 4K.</li>
<li><strong>RAM</strong> — frame caches, RAM preview (After Effects).</li>
<li><strong>Storage</strong> — read speed for high-bitrate media. Keep cache on a fast NVMe.</li>
</ul>
<p>Read the full sequential deep dive on the <a href="/engine/">Inside the Engine</a> page.</p>`,
        keyPoints: ['NLEs edit references, not files', 'Hardware decode support is decisive', 'Render cache trades disk for real-time', 'Proxies cut decode cost'],
        exercise: 'Identify which hardware decoders your computer has, and which codecs it can decode in hardware.',
      },
      {
        slug: 'timecode-ingest-proxies',
        title: 'Timecode, Ingest & Media Management',
        minutes: 20,
        summary: 'The boring habits that separate pros from amateurs — and save projects when drives die.',
        body: `
<h3>Timecode</h3>
<p>HH:MM:SS:FF — hours, minutes, seconds, frames. Every frame has a unique address. <strong>Drop-frame</strong> timecode (written with semicolons, 01:00:00;00) skips frame <em>numbers</em> 00 and 01 every minute except each tenth minute so 29.97 fps timecode stays aligned with real clock time. No frames are dropped — only labels. Try the Timecode lab.</p>
<h3>Ingest checklist</h3>
<ol>
<li>Copy cards with <strong>checksum verification</strong> (Hedge, ShotPut Pro, Resolve Clone Tool, or rsync with checksums). Never drag-and-drop camera cards.</li>
<li>Follow the <strong>3-2-1 rule</strong>: 3 copies, 2 media types, 1 off-site.</li>
<li>Keep the full card structure (folders contain metadata needed by RAW formats).</li>
<li>Name consistently: <code>PROJECT_DATE_CAM-A_CARD01</code>.</li>
</ol>
<h3>Project folder template</h3>
<pre>01_FOOTAGE/  02_AUDIO/  03_MUSIC/  04_GRAPHICS/
05_PROJECT_FILES/  06_EXPORTS/  07_DOCS/  08_CACHE/</pre>
<h3>Bins inside the NLE</h3>
<p>Mirror the folder structure. Use labels/colors for clip types, keywords and favorites (Final Cut), smart bins (Resolve). Organization is speed: a pro finds any clip in under five seconds.</p>
<h3>Proxy workflow</h3>
<p>Generate proxies at ingest (½ or ¼ resolution, ProRes Proxy or DNxHR LB). Toggle proxies on for editing, off for color and export. Keep the <em>same file name</em> and timecode so relinking works.</p>`,
        keyPoints: ['Checksum every card copy', '3-2-1 backup rule', 'Folder + bin structure = speed', 'Drop-frame only changes labels'],
        exercise: 'Build the folder template as a reusable zip on your drive. Convert 00:10:00;02 at 29.97 DF into a frame count using the Timecode lab.',
      },
    ],
    quiz: [
      { q: 'Following the 180° rule, what shutter speed should you use at 25 fps?', options: ['1/25', '1/50', '1/100', '1/200'], answer: 1, why: 'Shutter = 1/(2×fps) = 1/50.' },
      { q: 'Which is a container, not a codec?', options: ['ProRes', 'H.264', 'MOV', 'DNxHR'], answer: 2, why: 'MOV is a QuickTime container that can hold many codecs.' },
      { q: 'Why does H.264 scrub poorly compared to ProRes?', options: ['It has lower resolution', 'It is long-GOP so frames depend on other frames', 'It has no audio', 'It is always 8-bit'], answer: 1, why: 'Long-GOP frames are predicted from neighbours, so random access requires decoding multiple frames.' },
      { q: 'What is the best chroma subsampling for green-screen keying?', options: ['4:2:0', '4:1:1', '4:2:2 or 4:4:4', 'It does not matter'], answer: 2, why: 'More color resolution = cleaner key edges.' },
      { q: 'Where is quality actually lost in DCT compression?', options: ['Entropy coding', 'Quantization', 'Color transform', 'Container wrapping'], answer: 1, why: 'Quantization rounds coefficients; it is the lossy step.' },
      { q: 'Drop-frame timecode drops…', options: ['Actual frames of video', 'Frame numbers (labels) only', 'Audio samples', 'Every 10th frame'], answer: 1, why: 'Only the numbering skips; all frames are kept.' },
    ],
  },

  {
    n: 2,
    slug: 'nle-mastery',
    title: 'NLE Mastery & The Software Landscape',
    theme: 'Speed, precision and choosing your weapon',
    goal: 'Edit at the speed of thought with keyboard-driven trimming, and know which software fits which job.',
    outcomes: [
      'Perform ripple, roll, slip and slide trims without the mouse',
      'Use three-point and four-point editing',
      'Compare the major NLEs and choose the right one for a project',
      'Set up a professional workspace and custom shortcuts',
    ],
    labs: ['shortcut-trainer', 'trim-tools'],
    project: {
      title: 'The 60-Second Speed Cut',
      brief: 'Download any free stock footage pack (10–20 clips) and a music track. Cut a 60-second montage using only the keyboard. Screen-record yourself. Repeat it on day 7 and compare the time taken.',
      deliverables: ['60-second montage export', 'Screen recording of your edit session', 'Personal shortcut cheat-sheet'],
    },
    lessons: [
      {
        slug: 'the-editing-toolkit',
        title: 'The Core Editing Toolkit: Cuts, Trims & Edits',
        minutes: 22,
        summary: 'The six operations behind every edit ever made, and how pros perform them without touching the mouse.',
        body: `
<h3>The six trim types</h3>
<table>
<thead><tr><th>Tool</th><th>What it does</th><th>Duration of sequence</th></tr></thead>
<tbody>
<tr><td><strong>Ripple</strong></td><td>Extends/shortens one clip and moves everything after it</td><td>Changes</td></tr>
<tr><td><strong>Roll</strong></td><td>Moves an edit point between two clips (one gets longer, one shorter)</td><td>Same</td></tr>
<tr><td><strong>Slip</strong></td><td>Changes which part of a clip's content is used, keeping its position and length</td><td>Same</td></tr>
<tr><td><strong>Slide</strong></td><td>Moves a clip left/right, trimming its neighbours to compensate</td><td>Same</td></tr>
<tr><td><strong>Razor / Blade</strong></td><td>Splits a clip at the playhead</td><td>Same</td></tr>
<tr><td><strong>Ripple delete / Lift / Extract</strong></td><td>Removes material and closes or leaves a gap</td><td>Changes / Same</td></tr>
</tbody></table>
<h3>Three-point editing</h3>
<p>Set any three of: source In, source Out, timeline In, timeline Out. The fourth is calculated. Then <strong>Insert</strong> (pushes material downstream) or <strong>Overwrite</strong> (replaces). This is the oldest and fastest editing method — and it's how every Avid editor on a feature film works.</p>
<h3>J-cuts and L-cuts</h3>
<p>A <strong>J-cut</strong>: audio of the next shot starts <em>before</em> its picture (the timeline looks like a J). An <strong>L-cut</strong>: audio of the current shot continues <em>under</em> the next picture. Split edits are the single fastest way to make dialogue scenes feel professional and natural.</p>
<h3>JKL shuttle</h3>
<p>J = play backwards, K = stop, L = play forward. Tap L twice for 2× speed. Hold K + tap J/L for frame-by-frame. Every major NLE supports it.</p>`,
        keyPoints: ['Ripple, roll, slip, slide: master all four', 'Three-point editing = speed', 'Split edits (J/L) make dialogue flow', 'JKL navigation always'],
        exercise: 'In the Shortcut Trainer, score 15/15 on the Premiere or Resolve set.',
      },
      {
        slug: 'software-landscape',
        title: 'The Software Landscape: Choosing Your Weapon',
        minutes: 20,
        summary: 'Premiere, Resolve, Final Cut, Avid, CapCut, After Effects, Nuke and more — what each is really good at.',
        body: `
<p>There is no "best" editor — there is the best editor <em>for a job</em>. Full pros/cons, pricing and use-cases are on the <a href="/software/">Software Compared</a> page. The summary:</p>
<ul>
<li><strong>DaVinci Resolve</strong> — one app for edit, color (industry standard), Fusion VFX, Fairlight audio. Free version is extraordinary. Best grading tools in the world.</li>
<li><strong>Adobe Premiere Pro</strong> — the most common NLE in agencies and YouTube; deep integration with After Effects, Audition, Photoshop. Strong AI features (Generative Extend, text-based editing).</li>
<li><strong>Final Cut Pro</strong> — the fastest on Apple Silicon, magnetic timeline, one-time purchase.</li>
<li><strong>Avid Media Composer</strong> — Hollywood features and TV; bin-based collaboration and rock-solid media management.</li>
<li><strong>After Effects</strong> — motion graphics and compositing standard.</li>
<li><strong>CapCut</strong> — fastest path to trending short-form edits, auto captions, templates.</li>
<li><strong>Nuke</strong> — the high-end VFX compositing standard.</li>
</ul>
<h3>How to choose</h3>
<ol>
<li>Where will you work? Agencies → Premiere. Hollywood → Avid. Color houses → Resolve. Short-form creators → CapCut/Premiere.</li>
<li>What computer do you have? Mac → Final Cut is an option. Linux → Resolve, Kdenlive.</li>
<li>Budget? Resolve free and CapCut free are complete starting points.</li>
</ol>
<div class="callout tip"><strong>Course recommendation:</strong> Learn concepts once, apply anywhere. This course gives steps in Resolve and Premiere, with Final Cut and CapCut notes where they differ.</div>`,
        keyPoints: ['Concepts transfer between NLEs', 'Resolve = color king and free', 'Premiere = agency standard', 'Avid = feature film / TV standard'],
        exercise: 'Read the Software Compared page and write down which two tools you will commit to for this course and why.',
      },
      {
        slug: 'workspace-and-shortcuts',
        title: 'Workspace, Shortcuts & Ergonomics',
        minutes: 15,
        summary: 'A pro editor spends 10 hours a day in the chair. Set up a workspace and keyboard that make you twice as fast.',
        body: `
<h3>Workspace layout</h3>
<p>Source monitor left, program monitor right, timeline full-width below, bins on a second screen. Save it as a custom workspace. Use separate layouts for Edit, Color, Audio and Effects.</p>
<h3>The 20 shortcuts that matter most</h3>
<p>Play/stop, JKL, mark In/Out, insert, overwrite, ripple delete, add edit (razor), select clip at playhead, nudge clip ±1 frame, go to next/previous edit, trim edit start/end to playhead (Q/W in Premiere), toggle snapping, zoom timeline, full-screen viewer, undo, render in-to-out, link/unlink, enable/disable clip, match frame, add marker.</p>
<h3>Custom keyboard philosophy</h3>
<p>Put the 10 most used commands under your left hand. Map <em>ripple trim to playhead</em> (Q/W) — it alone saves hours per week. Consider a dedicated keyboard (Resolve Speed Editor, Loupedeck) or a programmable macro pad.</p>
<h3>Ergonomics</h3>
<p>Monitor top at eye level, 20-20-20 eye rule (every 20 min, look 20 feet away for 20 seconds), mouse at elbow height. Editing is a marathon.</p>`,
        keyPoints: ['Separate workspaces per task', 'Q/W trim-to-playhead is a superpower', 'Left hand on the keys, right on the mouse'],
        exercise: 'Export your custom shortcut set and print it.',
      },
      {
        slug: 'multicam-and-sync',
        title: 'Syncing, Multicam & Nesting',
        minutes: 18,
        summary: 'Podcasts, interviews and events: sync multiple cameras and audio in seconds and cut them live.',
        body: `
<h3>Sync methods</h3>
<ol>
<li><strong>Timecode</strong> — jam-synced cameras (Tentacle Sync, Deity TC-1). Instant and perfect.</li>
<li><strong>Audio waveform</strong> — software matches scratch audio to the main recorder. Works 95% of the time.</li>
<li><strong>Clap / slate</strong> — manual fallback: align the visible clap to the audio spike.</li>
</ol>
<h3>Multicam</h3>
<p>Create a multicam clip (Premiere: Create Multi-Camera Source Sequence; Resolve: Create New Multicam Clip Using Selected Clips; Final Cut: New Multicam Clip). Play it back and switch angles live with number keys. Then refine cuts with roll trims.</p>
<h3>Variable frame rate (VFR) warning</h3>
<p>Phones and screen recorders record VFR, which drifts out of sync over long clips. Convert to constant frame rate (Handbrake, Shutter Encoder) before editing.</p>
<h3>Nesting / compound clips</h3>
<p>Group clips into one container to apply an effect to all, or to manage complexity. Don't over-nest: it complicates round-tripping and conform.</p>`,
        keyPoints: ['Timecode > waveform > clap', 'Cut multicam live, then refine', 'Convert VFR to CFR first'],
        exercise: 'Record a 3-minute conversation with two phones and a separate audio recorder. Sync by waveform and cut multicam.',
      },
      {
        slug: 'rough-cut-to-fine-cut',
        title: 'From Assembly to Picture Lock',
        minutes: 16,
        summary: 'The professional stages of an edit and what you should — and should not — do at each stage.',
        body: `
<ol>
<li><strong>Logging & selects</strong> — watch everything, mark best takes, build a selects reel.</li>
<li><strong>Assembly</strong> — everything in script order, long and loose.</li>
<li><strong>Rough cut</strong> — structure works; scenes may be long. Don't polish yet.</li>
<li><strong>Fine cut</strong> — rhythm, performance choices, temp music and sound.</li>
<li><strong>Picture lock</strong> — no more picture changes. Now hand off to color, sound, VFX.</li>
<li><strong>Online / finishing</strong> — conform to full-res media, grade, mix, titles, deliverables.</li>
</ol>
<p>The biggest beginner mistake: color grading and adding effects during the rough cut. Story first, polish last.</p>
<div class="callout tip"><strong>Version control:</strong> Duplicate your sequence before every major change: <code>Edit_v01</code>, <code>v02</code>… Never edit your only copy.</div>`,
        keyPoints: ['Story before polish', 'Version every sequence', 'Picture lock gates finishing'],
        exercise: 'Take your Week 2 montage through assembly → rough → fine, saving each version.',
      },
    ],
    quiz: [
      { q: 'Which trim changes the content of a clip but not its position or length?', options: ['Roll', 'Ripple', 'Slip', 'Slide'], answer: 2, why: 'Slip changes the in/out inside the clip while its position and duration stay fixed.' },
      { q: 'In a J-cut…', options: ['Video of next shot starts first', 'Audio of the next shot starts before its video', 'Audio continues after the cut', 'There is no audio'], answer: 1, why: 'The next shot\'s audio leads in under the current picture.' },
      { q: 'What is the most reliable way to sync multiple cameras?', options: ['Clapping', 'Matching timecode', 'Eyeballing lips', 'Audio waveform'], answer: 1, why: 'Jam-synced timecode is frame-accurate and instant.' },
      { q: 'At what stage do you hand the edit to the colorist?', options: ['Assembly', 'Rough cut', 'Picture lock', 'Logging'], answer: 2, why: 'Picture lock means the edit no longer changes.' },
      { q: 'What should you do with variable-frame-rate phone footage?', options: ['Nothing', 'Convert to constant frame rate', 'Speed it up', 'Export it as GIF'], answer: 1, why: 'VFR drifts out of sync in NLEs.' },
    ],
  },

  {
    n: 3,
    slug: 'cinematography',
    title: 'Cinematography for Editors',
    theme: 'Shots, lenses, light and the language of the camera',
    goal: 'Read every shot like a cinematographer so you know exactly what each one means and how they cut together.',
    outcomes: [
      'Name every shot size, angle and camera move and their emotional effect',
      'Understand focal length, depth of field and sensor size',
      'Apply the 180° and 30° rules and screen direction',
      'Read lighting: key, fill, back, contrast ratio, motivated light',
    ],
    labs: ['dof-lens', 'composition', 'aspect-safe-zones', 'exposure-triangle', 'white-balance', 'lighting', 'shot-list'],
    project: {
      title: 'The Shot Library',
      brief: 'Shoot a 15-shot coverage of a simple action (making coffee): wide, medium, close-up, extreme close-up, insert, OTS, low angle, high angle, dolly-in, pan, tilt, handheld, locked-off, silhouette, rack focus. Label each and cut a 45-second sequence.',
      deliverables: ['15 labelled shots', '45-second sequence', 'Coverage diagram (top-down sketch)'],
    },
    lessons: [
      {
        slug: 'shot-sizes-and-angles',
        title: 'Shot Sizes, Angles & What They Mean',
        minutes: 20,
        summary: 'Every shot size and angle carries meaning. Editors who know the language can make audiences feel on cue.',
        body: `
<table>
<thead><tr><th>Shot</th><th>Framing</th><th>Use</th></tr></thead>
<tbody>
<tr><td>Extreme Wide (EWS)</td><td>Landscape, tiny subject</td><td>Establish place, isolation, scale</td></tr>
<tr><td>Wide (WS)</td><td>Full body with environment</td><td>Geography, action</td></tr>
<tr><td>Medium Wide / Cowboy</td><td>Mid-thigh up</td><td>Body language + context</td></tr>
<tr><td>Medium (MS)</td><td>Waist up</td><td>Conversation default</td></tr>
<tr><td>Medium Close-Up (MCU)</td><td>Chest up</td><td>Interviews, intimacy</td></tr>
<tr><td>Close-Up (CU)</td><td>Face</td><td>Emotion, reaction</td></tr>
<tr><td>Extreme Close-Up (ECU)</td><td>Eyes, mouth, detail</td><td>Tension, revelation</td></tr>
<tr><td>Insert</td><td>Object detail</td><td>Information, rhythm</td></tr>
<tr><td>Over-the-Shoulder (OTS)</td><td>Past one character to another</td><td>Dialogue relationships</td></tr>
<tr><td>POV</td><td>What the character sees</td><td>Identification</td></tr>
</tbody></table>
<h3>Angles</h3>
<ul>
<li><strong>Eye level</strong> — neutral, equal.</li>
<li><strong>Low angle</strong> — power, threat, heroism.</li>
<li><strong>High angle</strong> — vulnerability, smallness.</li>
<li><strong>Dutch / canted</strong> — unease, madness.</li>
<li><strong>Overhead / bird's eye</strong> — god's view, pattern, fate.</li>
</ul>
<h3>Editing rule of thumb</h3>
<p>The closer the shot, the more emotional weight — and the more precious it becomes. Save your tightest close-ups for the scene's emotional peak. Cutting wide → medium → close builds intensity; jumping straight to an ECU is a shock tactic.</p>`,
        keyPoints: ['Shot size = emotional distance', 'Save the tightest shots for the peak', 'Angles encode power'],
        exercise: 'Watch a scene from a film you love with sound off. Log every shot size. Graph the pattern.',
      },
      {
        slug: 'lenses-and-depth-of-field',
        title: 'Lenses, Focal Length & Depth of Field',
        minutes: 22,
        summary: 'Why a 24mm and an 85mm shot of the same face feel completely different, and what controls background blur.',
        body: `
<h3>Focal length</h3>
<ul>
<li><strong>Wide (14–35mm)</strong> — expansive, exaggerated depth, distorts faces up close. Energy and space.</li>
<li><strong>Normal (40–58mm on full frame)</strong> — close to human perception.</li>
<li><strong>Telephoto (85mm+)</strong> — compresses distance, flattens faces flatteringly, isolates subjects.</li>
</ul>
<p><strong>Compression</strong> is actually caused by camera <em>distance</em>, not the lens itself — but long lenses force you to stand far away, so backgrounds appear larger and closer.</p>
<h3>Depth of field (DoF)</h3>
<p>The range of distance that appears sharp. It gets <strong>shallower</strong> with:</p>
<ul><li>Wider aperture (lower f-number: f/1.4)</li><li>Longer focal length</li><li>Closer focus distance</li><li>Larger sensor (for the same framing)</li></ul>
<p>Use the DoF & Lens lab to see the near/far focus limits and hyperfocal distance change live.</p>
<h3>Sensor size & crop factor</h3>
<p>Super 35 / APS-C ≈ 1.5× crop, Micro Four Thirds 2×, phones 4–7×. A 50mm on Super 35 frames like a 75mm on full frame.</p>
<h3>Editor's eye</h3>
<p>Matching lens choices across a scene makes cuts invisible; switching from 24mm to 135mm on the same subject is a bold, noticeable cut. Rack focus is a built-in "cut" inside a shot — respect it, don't cut in the middle of one.</p>`,
        keyPoints: ['Wide = energy, tele = isolation', 'Aperture, focal length, distance and sensor control DoF', 'Do not cut during a rack focus'],
        exercise: 'In the DoF lab, find settings that give a 10 cm focus band at 2 m on full frame.',
      },
      {
        slug: 'camera-movement',
        title: 'Camera Movement & Motivation',
        minutes: 16,
        summary: 'Pans, tilts, dollies, cranes, gimbals and handheld — what each says and how to cut moving shots.',
        body: `
<ul>
<li><strong>Pan / Tilt</strong> — rotating on a fixed point. Reveal or follow.</li>
<li><strong>Dolly / Truck</strong> — the camera physically moves in/out or sideways. Dolly-in = growing importance or realisation.</li>
<li><strong>Zoom</strong> — changes focal length; flatter, more "observed" feel. A <strong>dolly zoom</strong> (Vertigo effect) combines dolly-out + zoom-in for vertigo.</li>
<li><strong>Crane / Jib / Drone</strong> — elevation changes; grandeur and transitions between scales.</li>
<li><strong>Handheld</strong> — urgency, realism, subjectivity.</li>
<li><strong>Gimbal / Steadicam</strong> — floating, immersive following shots.</li>
<li><strong>Static / locked-off</strong> — observation, composure, comedy timing.</li>
</ul>
<h3>Cutting movement</h3>
<ol>
<li><strong>Moving to moving</strong>: cut when both are in motion in the same direction and similar speed — the flow continues.</li>
<li><strong>Static to static</strong>: classic, clean.</li>
<li><strong>Moving to static</strong>: let the move settle first (end on the "rest"), or the cut will jolt.</li>
<li>Match speed and direction for invisible <em>whip-pan transitions</em> (Week 10).</li>
</ol>`,
        keyPoints: ['Every move should be motivated', 'Cut moving→moving in matching direction', 'Let moves settle before cutting to static'],
        exercise: 'Find a dolly zoom in a famous film and describe what it reveals about the character.',
      },
      {
        slug: 'composition-and-continuity-rules',
        title: 'Composition, the 180° & 30° Rules, Screen Direction',
        minutes: 20,
        summary: 'The geometry of the frame and the invisible rules that keep the audience oriented.',
        body: `
<h3>Composition</h3>
<ul>
<li><strong>Rule of thirds</strong> — eyes on the top third line; subjects on intersections.</li>
<li><strong>Lead room / look room</strong> — space in front of where a subject looks or moves.</li>
<li><strong>Headroom</strong> — less than you think in close-ups; crop the top of the head before the chin.</li>
<li><strong>Leading lines, symmetry, frames-within-frames, negative space, depth layers</strong> (foreground, midground, background).</li>
<li><strong>Golden ratio</strong> (1:1.618) — a softer alternative grid to thirds.</li>
</ul>
<h3>The 180° rule</h3>
<p>Draw an imaginary line between two characters. Keep all cameras on one side of it, so character A always looks right and B looks left. Crossing the line flips screen direction and confuses viewers — unless you cross <em>on screen</em> (the camera moves across) or use a neutral shot (on the line) in between.</p>
<h3>The 30° rule</h3>
<p>Two consecutive shots of the same subject should differ by at least 30° in angle (or a clear change in shot size). Otherwise you get a <strong>jump cut</strong> — sometimes a deliberate style (vlogs, Godard's <em>Breathless</em>), usually an error.</p>
<h3>Screen direction</h3>
<p>If a character exits frame right, they should enter the next shot frame left to preserve continuous travel. Reverse it and they appear to turn back.</p>`,
        keyPoints: ['Thirds, lead room, headroom', '180° rule keeps geography', '30° rule prevents accidental jump cuts', 'Exit right → enter left'],
        exercise: 'Use the Composition lab: upload 5 of your frames and evaluate them against thirds and golden grids.',
      },
      {
        slug: 'lighting-and-exposure',
        title: 'Lighting, Exposure & Dynamic Range',
        minutes: 22,
        summary: 'Read light like a DP: the exposure triangle, three-point lighting, contrast ratios and dynamic range.',
        body: `
<h3>Exposure triangle</h3>
<p><strong>Aperture</strong> (f-stop; DoF), <strong>shutter</strong> (motion blur — locked by the 180° rule in video), <strong>ISO</strong> (gain; noise). Each "stop" doubles or halves light. Use <strong>ND filters</strong> to cut light so you can keep a wide aperture outdoors.</p>
<h3>Three-point lighting</h3>
<ul><li><strong>Key</strong> — main light, sets mood and direction.</li><li><strong>Fill</strong> — softens shadows; its strength sets the <em>contrast ratio</em>.</li><li><strong>Back / rim</strong> — separates subject from background.</li></ul>
<p>Key:fill ratios — 2:1 bright/commercial, 4:1 drama, 8:1+ noir. <strong>High-key</strong> lighting = bright, low contrast (comedy, ads). <strong>Low-key</strong> = deep shadows (thriller, noir).</p>
<h3>Motivated light</h3>
<p>Light should seem to come from a believable source (window, lamp, screen). As an editor and colorist, you'll enhance this motivation with power windows and vignettes.</p>
<h3>Color temperature</h3>
<p>Measured in Kelvin: candle ~1,900K, tungsten 3,200K, daylight 5,600K, overcast 6,500K+, blue hour 9,000K+. Mixed temperature sources are a classic grading challenge (see Scenarios).</p>
<h3>Dynamic range</h3>
<p>The range from darkest to brightest detail a camera can capture, measured in stops. Phones 10–12, cinema cameras 14–17. <strong>Log</strong> profiles flatten the image to fit this range into the file — which is why log looks grey until it's graded (Week 6).</p>`,
        keyPoints: ['Each stop = 2× light', 'Key:fill ratio = mood', 'Light should be motivated', 'Log stores more dynamic range'],
        exercise: 'Light a face with a single window at 3 positions (front, 45°, side). Compare the mood.',
      },
    ],
    quiz: [
      { q: 'A low-angle shot typically conveys…', options: ['Weakness', 'Power or threat', 'Confusion', 'Neutrality'], answer: 1, why: 'Looking up at a subject makes it appear dominant.' },
      { q: 'Which change makes depth of field SHALLOWER?', options: ['f/8 instead of f/2', 'Moving further from the subject', 'Using a longer focal length', 'Using a smaller sensor at the same framing'], answer: 2, why: 'Longer focal length (at the same distance) reduces DoF.' },
      { q: 'What does the 30° rule prevent?', options: ['Crossing the line', 'Accidental jump cuts', 'Overexposure', 'Audio drift'], answer: 1, why: 'Too-similar consecutive angles create a jarring jump.' },
      { q: 'If a character exits frame right, they should enter the next shot…', options: ['Frame right', 'Frame left', 'From the top', 'It does not matter'], answer: 1, why: 'Preserves continuous screen direction.' },
      { q: 'An 8:1 key-to-fill ratio is typical of…', options: ['Sitcoms', 'Film noir / dramatic low-key', 'Product ads', 'News'], answer: 1, why: 'High ratios produce deep, dramatic shadows.' },
      { q: 'Daylight is approximately…', options: ['3200K', '5600K', '1900K', '10000K'], answer: 1, why: 'Standard daylight balance is ~5600K.' },
    ],
  },

  {
    n: 4,
    slug: 'editing-theory',
    title: 'Editing Theory: The Invisible Art',
    theme: 'Murch, Kuleshov, Eisenstein and the psychology of the cut',
    goal: 'Know why a cut works — so you can make every cut work on purpose.',
    outcomes: [
      'Apply Walter Murch\'s Rule of Six to judge any cut',
      'Use the Kuleshov effect to create meaning through juxtaposition',
      'Apply Eisenstein\'s five methods of montage',
      'Control rhythm, pacing and tension',
    ],
    labs: ['beat-sync', 'kuleshov', 'trim-tools'],
    project: {
      title: 'Same Footage, Three Films',
      brief: 'Using the same 3 minutes of footage, cut three 30-second edits: one comedy, one thriller, one romance. Only editing, music and sound may change.',
      deliverables: ['Three 30-second edits', 'A one-page breakdown explaining your cut decisions using the Rule of Six'],
    },
    lessons: [
      {
        slug: 'murch-rule-of-six',
        title: 'Walter Murch\'s Rule of Six',
        minutes: 18,
        summary: 'The most famous framework for evaluating a cut, from the editor of Apocalypse Now and The English Patient.',
        body: `
<p>In <em>In the Blink of an Eye</em>, Walter Murch ranks what an ideal cut must respect, with weightings:</p>
<ol>
<li><strong>Emotion — 51%</strong>: Is the cut true to the emotion of the moment?</li>
<li><strong>Story — 23%</strong>: Does it advance the story?</li>
<li><strong>Rhythm — 10%</strong>: Does it occur at a rhythmically interesting and "right" moment?</li>
<li><strong>Eye-trace — 7%</strong>: Does it respect where the audience is looking in the frame?</li>
<li><strong>Two-dimensional plane of screen — 5%</strong>: Does it respect screen direction / the 180° line?</li>
<li><strong>Three-dimensional space — 4%</strong>: Does it respect physical continuity?</li>
</ol>
<p>Emotion alone outweighs the other five combined. If you must sacrifice something, sacrifice from the bottom up. A continuity error the audience feels nothing about is invisible; an emotionally false cut is never invisible.</p>
<h3>Eye-trace in practice</h3>
<p>Before a cut, note where the viewer's eye is (usually a face or moving object). Place the point of interest in the next shot near the same spot so the eye doesn't search — this makes fast cutting readable. Breaking it deliberately creates disorientation.</p>
<h3>Blink theory</h3>
<p>Murch observed that people blink at moments of thought completion. A good cut happens where the audience would blink — the end of an idea.</p>`,
        keyPoints: ['Emotion 51% > everything else', 'Sacrifice from the bottom up', 'Track eye-trace across cuts', 'Cut where the audience would blink'],
        exercise: 'Score 10 cuts from a film trailer against the Rule of Six.',
      },
      {
        slug: 'kuleshov-and-montage',
        title: 'The Kuleshov Effect & Soviet Montage',
        minutes: 20,
        summary: 'Meaning is created between shots, not within them. Eisenstein\'s five methods of montage.',
        body: `
<h3>The Kuleshov effect</h3>
<p>In the 1920s Lev Kuleshov cut the same neutral face of actor Ivan Mosjoukine with a bowl of soup, a child in a coffin, and a woman on a divan. Audiences praised the actor's subtle hunger, grief and desire. The face never changed — <strong>the juxtaposition created the meaning</strong>. You use this every time you cut a reaction shot.</p>
<h3>Eisenstein's five methods of montage</h3>
<ol>
<li><strong>Metric</strong> — cuts by exact length (e.g. every 12 frames) regardless of content. Drives tempo.</li>
<li><strong>Rhythmic</strong> — cuts follow the movement and continuity inside shots.</li>
<li><strong>Tonal</strong> — cuts based on the emotional tone/lighting/feel of shots.</li>
<li><strong>Overtonal</strong> — combines metric, rhythmic and tonal for a cumulative effect.</li>
<li><strong>Intellectual</strong> — juxtaposes images to create an abstract idea (workers ↔ slaughtered bull in <em>Strike</em>).</li>
</ol>
<h3>Modern montage</h3>
<p>The "training montage", the music video, the TikTok "day in my life" — all are metric/rhythmic montage. <strong>Match cuts</strong> (2001's bone-to-satellite) are intellectual montage. Every time you juxtapose two ideas to create a third, you are Eisenstein.</p>`,
        keyPoints: ['A + B = C: meaning from juxtaposition', 'Five montage methods', 'Reaction shots are Kuleshov'],
        exercise: 'Cut the same neutral face of a friend against 3 different shots. Show people and ask what the person felt.',
      },
      {
        slug: 'continuity-and-cut-types',
        title: 'Continuity Editing & the Cut Types Catalogue',
        minutes: 22,
        summary: 'Match cuts, cutaways, cross-cutting, smash cuts, jump cuts and invisible continuity — the complete toolbox.',
        body: `
<table>
<thead><tr><th>Cut</th><th>Description</th><th>Effect</th></tr></thead>
<tbody>
<tr><td>Standard / hard cut</td><td>Instant change</td><td>Invisible if motivated</td></tr>
<tr><td>Cutting on action</td><td>Cut mid-movement (door opening)</td><td>Movement hides the cut</td></tr>
<tr><td>Match cut</td><td>Matching shape, motion, or sound between two shots</td><td>Elegant connection, ideas</td></tr>
<tr><td>Jump cut</td><td>Same subject, small change</td><td>Time compression, energy, unease</td></tr>
<tr><td>Cutaway / insert</td><td>Cut to something else, then back</td><td>Hide edits, add info</td></tr>
<tr><td>Cross-cutting / parallel</td><td>Alternate between simultaneous actions</td><td>Suspense, comparison</td></tr>
<tr><td>Smash cut</td><td>Abrupt cut from intense to opposite</td><td>Shock, comedy</td></tr>
<tr><td>Invisible cut</td><td>Hidden in darkness, whip or object wipe</td><td>"One-take" illusion</td></tr>
<tr><td>Contrast cut</td><td>Opposite images back-to-back</td><td>Commentary</td></tr>
<tr><td>Dissolve</td><td>Gradual blend</td><td>Time passing, memory</td></tr>
<tr><td>Fade to/from black</td><td>Gradual to black</td><td>Chapter ending</td></tr>
<tr><td>Wipe / iris</td><td>Graphic transition</td><td>Retro, playful</td></tr>
</tbody></table>
<h3>Cutting on action — the golden technique</h3>
<p>Start the action in the outgoing shot, finish it in the incoming shot. Overlap 2–4 frames of the action for natural flow (the eye "loses" a few frames at a cut). The audience follows motion and never notices the cut.</p>
<h3>Continuity checklist</h3>
<p>Props, hand positions, eyelines, wardrobe, liquid levels, lighting direction, sound ambience. Use cutaways to cover inevitable errors.</p>`,
        keyPoints: ['Cut on action and overlap 2–4 frames', 'Each cut type has meaning', 'Cutaways cover continuity errors'],
        exercise: 'Shoot someone opening a door in a wide and a close-up. Practice finding the perfect cut-on-action frame.',
      },
      {
        slug: 'pacing-rhythm-tension',
        title: 'Pacing, Rhythm & Tension',
        minutes: 20,
        summary: 'Shot length is the editor\'s tempo. Learn to accelerate, breathe, and hold.',
        body: `
<h3>Average shot length (ASL)</h3>
<p>Classic Hollywood in the 1940s averaged ~10 seconds per shot; modern action films average ~2–3 seconds; TikTok edits often 0.5–1.5 s. Shorter shots = higher energy but less information absorbed.</p>
<h3>Cutting to music</h3>
<p>At 120 BPM each beat is 0.5 s = 12 frames at 24 fps. Cutting on every beat is metric; cutting on bars (4 beats) feels grander. Don't cut on <em>every</em> beat — vary it: hits on downbeats, holds through phrases, a quick burst before the drop. Use the Beat Sync lab to calculate frames-per-beat for any BPM.</p>
<h3>Tension and release</h3>
<ul>
<li><strong>Acceleration</strong>: progressively shorter shots build pressure.</li>
<li><strong>The hold</strong>: staying on a shot longer than comfortable creates unease or intimacy.</li>
<li><strong>The pause</strong>: silence and stillness after chaos let emotion land.</li>
<li><strong>Information control</strong> (Hitchcock's bomb): suspense = the audience knows something the character doesn't.</li>
</ul>
<h3>The "breath"</h3>
<p>After a big line or reveal, leave 1–2 seconds before cutting. Beginners cut away too early; let the moment land on the face.</p>`,
        keyPoints: ['ASL is tempo', 'frames per beat = fps × 60 / BPM', 'Accelerate to build; hold to unsettle', 'Let big moments breathe'],
        exercise: 'Tap the BPM of 3 songs in the Beat Sync lab and note the frames-per-beat at 24 and 30 fps.',
      },
      {
        slug: 'story-structure-in-the-edit',
        title: 'Story Structure in the Edit',
        minutes: 18,
        summary: 'The edit is the final rewrite. Structures, hooks and how editors rescue stories.',
        body: `
<h3>Structures</h3>
<ul>
<li><strong>Three-act</strong>: Setup (25%) → Confrontation (50%) → Resolution (25%).</li>
<li><strong>Hero's Journey</strong>: ordinary world, call, threshold, trials, ordeal, reward, return.</li>
<li><strong>Problem–Agitate–Solve</strong>: ads and explainer videos.</li>
<li><strong>Hook–Value–Payoff–CTA</strong>: short-form social.</li>
<li><strong>In medias res</strong>: start in the middle of the action, then flash back.</li>
</ul>
<h3>The editor as writer</h3>
<p>Scenes can be reordered, lines removed, reactions borrowed from other takes, and voiceover added. Many famous films were "found" in the edit (<em>Star Wars</em>, <em>Annie Hall</em>). Ask of every scene: what does it do that no other scene does? If nothing — cut it.</p>
<h3>Paper edit</h3>
<p>For documentaries and interviews, transcribe everything (AI transcription in Premiere/Resolve/Descript), highlight the best soundbites, arrange them in a document, then build the timeline. Hours saved.</p>
<h3>Kill your darlings</h3>
<p>Your favourite shot may not serve the story. The audience never sees what you cut.</p>`,
        keyPoints: ['Edit = final rewrite', 'Every scene must earn its place', 'Paper edits for doc/interview', 'Kill your darlings'],
        exercise: 'Write a paper edit for a 2-minute interview from a 15-minute transcript.',
      },
    ],
    quiz: [
      { q: 'In Murch\'s Rule of Six, which criterion carries the most weight?', options: ['Story', 'Rhythm', 'Emotion', 'Eye-trace'], answer: 2, why: 'Emotion is weighted at 51%.' },
      { q: 'The Kuleshov effect demonstrates that…', options: ['Long takes are better', 'Meaning arises from juxtaposition of shots', 'Color affects mood', 'Sound is more important than image'], answer: 1, why: 'The same face read differently depending on the adjacent shot.' },
      { q: 'At 24 fps and 120 BPM, how many frames is one beat?', options: ['10', '12', '24', '6'], answer: 1, why: '24 × 60 / 120 = 12 frames.' },
      { q: 'Which montage method cuts by fixed length regardless of content?', options: ['Tonal', 'Metric', 'Intellectual', 'Rhythmic'], answer: 1, why: 'Metric montage uses absolute shot length.' },
      { q: 'Cutting on action works because…', options: ['It is faster to edit', 'The eye follows movement and does not notice the cut', 'It hides audio errors', 'It changes color'], answer: 1, why: 'Motion carries attention across the edit.' },
    ],
  },
];
