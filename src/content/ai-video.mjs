// AI video content: masterclass chapters, per-lesson "AI angle" notes, and AI additions
// to the playbook, effects cookbook, toolkit and glossary. Tool names change fast; the
// course teaches durable principles and names products only as current examples.

export const aiChapters = [
  {
    id: 'how-it-works', title: '1. How AI video generators work',
    body: `<p>Modern text-to-video and image-to-video models are <strong>diffusion models</strong>, usually built on a <strong>transformer</strong> backbone. Training teaches them to remove noise from millions of video clips paired with descriptions. To generate, they start from random noise in a compressed <strong>latent space</strong> (not pixels) and denoise it step by step, steered by your prompt and any reference images. A decoder then turns the latents into frames.</p>
<ul>
<li><strong>Spacetime patches:</strong> the video is cut into small chunks across both space and time, so the model reasons about motion as well as appearance. This is how it keeps a walking person's legs consistent from frame to frame.</li>
<li><strong>Temporal consistency</strong> is the hardest problem. Flicker, morphing hands, melting text and objects that appear or vanish are all failures of consistency over time.</li>
<li><strong>Seeds</strong> fix the starting noise. The same prompt and seed produce similar results, so you can iterate on wording while keeping the composition.</li>
<li><strong>Resolution, length and frame rate</strong> are limited by compute. Clips are typically a few seconds long, at 720p–4K and 24–30 fps. Longer shots are built by extending or chaining clips.</li>
</ul>
<p>Why this matters to an editor: the model predicts plausible pixels; it does not understand physics or continuity. You, the editor, supply the continuity.</p>`,
  },
  {
    id: 'landscape', title: '2. The tool landscape (and how to choose)',
    body: `<p>The field moves monthly, so judge tools by capability rather than brand. As of late 2026 the main types are:</p>
<table><thead><tr><th>Type</th><th>Examples</th><th>Use it for</th></tr></thead><tbody>
<tr><td>Text/image-to-video generators</td><td>Google Veo, OpenAI Sora, Runway, Kling, Luma, Adobe Firefly Video, Pika</td><td>B-roll, establishing shots, impossible shots, concept and pitch films, storyboards that move</td></tr>
<tr><td>Generative tools inside editors</td><td>Premiere Generative Extend, generative fill and object removal in Premiere, After Effects, Resolve and CapCut</td><td>Adding frames to a clip that ends too early, removing objects, extending backgrounds</td></tr>
<tr><td>Avatars and presenters</td><td>HeyGen, Synthesia, Captions</td><td>Training videos, multilingual explainers, internal communications</td></tr>
<tr><td>Voice, dubbing and lip-sync</td><td>ElevenLabs and built-in AI dubbing tools</td><td>Voiceovers, translation and dubbing, ADR fixes (with consent)</td></tr>
<tr><td>Enhancement</td><td>Topaz Video, Resolve Super Scale and Speed Warp</td><td>Upscaling, frame interpolation, denoising, restoring archive footage</td></tr>
</tbody></table>
<p><strong>Checklist before you choose a tool:</strong> maximum resolution and frame rate, clip length, whether it accepts reference images (image-to-video), camera controls, consistency features, commercial-use licence terms, whether it adds visible or invisible watermarks or content credentials, how it treats your data, and the cost per usable second (you will generate many takes).</p>`,
  },
  {
    id: 'prompting', title: '3. Prompting with cinematography language',
    body: `<p>The best AI video prompts read like a shot description from a cinematographer. Everything you learned in Weeks 3 and 6 becomes a prompt vocabulary. A reliable structure:</p>
<pre>[Shot size + angle] of [subject] [action], [setting + time of day].
[Lens / focal length, depth of field]. [Camera movement].
[Lighting: key direction, quality, motivation]. [Color palette / grade].
[Film stock / texture]. [Mood]. [Duration], [aspect ratio].</pre>
<p><strong>Example:</strong> <em>"Low-angle medium close-up of a tired boxer wrapping her hands in an empty gym at dawn. 85mm, shallow depth of field. Slow push-in. Hard window light from camera left, deep shadows, 4:1 contrast. Muted teal and warm skin tones. 35mm film grain, soft halation. Quiet determination. 6 seconds, 2.39:1."</em></p>
<ul>
<li>Describe <strong>one shot</strong> per prompt. Cuts belong in your edit, not in the prompt.</li>
<li>Name the <strong>camera move</strong> explicitly (static, slow dolly in, handheld, orbit, crane up). Unspecified motion is where models drift.</li>
<li>Use <strong>negative prompts</strong> or "avoid" lists where supported: text, logos, extra fingers, warping faces.</li>
<li>Generate <strong>4–10 takes</strong> and treat them like coverage: pick the best moments, then trim and speed-ramp them in the edit.</li>
</ul>
<p>Practise with the <a href="/labs/ai-prompt-builder/">AI Shot Prompt Builder</a>.</p>`,
  },
  {
    id: 'consistency', title: '4. Consistency: characters, style and continuity',
    body: `<ul>
<li><strong>Image-to-video first:</strong> design or photograph a keyframe, approve it, then animate it. You control composition, wardrobe and color before spending money on motion.</li>
<li><strong>Reference sheets:</strong> keep a "continuity bible" for each character, location and prop, with reference images, exact wording, colors and lens. Reuse the same wording in every prompt.</li>
<li><strong>Lock the look in the grade, not the prompt:</strong> generate fairly neutral images, then apply one show LUT or look in Resolve so every AI shot and real shot shares the same grade.</li>
<li><strong>Match the cut, not the clip:</strong> cut on motion, use cutaways, and avoid holding on AI shots where faces and hands are close to camera, because that is where artifacts show.</li>
<li><strong>Frame-by-frame QC:</strong> step through every AI clip one frame at a time and look for morphing, flicker, extra limbs, warped text and objects popping in or out.</li>
</ul>`,
  },
  {
    id: 'integration', title: '5. Integrating AI shots with real footage',
    body: `<ol>
<li><strong>Conform:</strong> convert generated clips to your timeline's frame rate and resolution in an intra-frame codec (ProRes or DNxHR). Check them in MediaInfo, because many generators output variable frame rate.</li>
<li><strong>Upscale and interpolate</strong> carefully (Topaz, Super Scale), and only as much as the delivery needs.</li>
<li><strong>Match the grade:</strong> blacks, whites, skin tones and saturation on the scopes, exactly as you would match two cameras (Week 7).</li>
<li><strong>Match the texture:</strong> AI clips are often too clean and too sharp. Add the same grain, a slight softness, lens effects (vignette, chromatic aberration) and motion blur as your real footage.</li>
<li><strong>Sound sells it:</strong> AI clips usually come without usable audio. Build ambience, foley and room tone so they sit inside the world of the film.</li>
<li><strong>Keep a source log:</strong> record which shots are AI, the tool, the prompt, the seed, the date and the licence. Clients, broadcasters and festivals increasingly require one.</li>
</ol>`,
  },
  {
    id: 'workflows', title: '6. High-value AI workflows for editors',
    body: `<ul>
<li><strong>Missing B-roll:</strong> generate cutaways that match the voiceover, such as an aerial city at night or a coffee pour in macro.</li>
<li><strong>Generative extend:</strong> add a second or two to a shot that ends too early, so your cut can breathe or land on the beat.</li>
<li><strong>Pre-viz and animatics:</strong> turn a storyboard into moving shots for pitches. Clients approve faster when they can see motion.</li>
<li><strong>Clean-up:</strong> remove boom mics, logos and passers-by with generative fill instead of frame-by-frame paint.</li>
<li><strong>Localisation:</strong> AI dubbing and lip-sync for multilingual versions, with the speaker's written consent.</li>
<li><strong>Restoration:</strong> upscale, denoise and interpolate archive footage for documentaries, labelled as enhanced where accuracy matters.</li>
<li><strong>Speed:</strong> transcript-based editing, auto captions, auto reframe and AI search ("find every shot with a red car").</li>
</ul>
<p>The rule: use AI where it removes tedium or makes an impossible shot possible, and keep humans in charge of story, performance and taste.</p>`,
  },
  {
    id: 'ethics', title: '7. Law, ethics and disclosure',
    body: `<ul>
<li><strong>Consent:</strong> never generate or clone a real person's face or voice without written permission. Many jurisdictions now have specific laws on deepfakes and digital replicas.</li>
<li><strong>Disclosure:</strong> YouTube, TikTok, Meta and broadcasters require labels for realistic synthetic content. Disclose it in news, documentary and advertising contexts.</li>
<li><strong>Content Credentials (C2PA):</strong> tamper-evident metadata recording how a file was made. Keep it intact where your tools support it.</li>
<li><strong>Licensing:</strong> read each tool's terms on commercial use, ownership of outputs and indemnity. Some clients ban generated assets entirely. Ask before using them.</li>
<li><strong>Copyright and style:</strong> don't prompt for living artists' or studios' protected characters, logos or distinctive works.</li>
<li><strong>Documentary truth:</strong> never present a generated shot as real footage of a real event. Label reconstructions on screen.</li>
</ul>`,
  },
];

// "AI angle" notes appended to existing lessons (keyed by lesson slug).
export const aiLessonNotes = {
  'codecs-containers-compression': 'AI generators often export long-GOP H.264 at variable frame rates. Transcode them to ProRes or DNxHR at your timeline\'s frame rate before editing, and check them in MediaInfo first.',
  'inside-the-nle-engine': 'AI features run as neural networks on the GPU or a dedicated NPU (Apple Neural Engine, NVIDIA Tensor cores). That is why Magic Mask, Speed Warp and generative tools need VRAM and are much faster on recent hardware.',
  'shot-sizes-and-angles': 'Shot sizes and angles are also the vocabulary of AI video prompts. "Low-angle medium close-up" gets far better results than "a person looking strong". Try the AI Shot Prompt Builder lab.',
  'lenses-and-depth-of-field': 'AI generators respond to lens language: "85mm, shallow depth of field" or "24mm wide, deep focus". Matching the focal length to your real footage makes AI B-roll cut in invisibly.',
  'camera-movement': 'Always state the camera move in an AI prompt (static, slow dolly in, handheld, orbit). Unspecified motion is where generated shots drift and warp.',
  'lighting-and-exposure': 'Describe light the way a DP would: direction, hardness, motivation and ratio. "Hard window key from camera left, 4:1" produces far more cinematic AI shots than "dramatic lighting".',
  'story-structure-in-the-edit': 'AI can draft a paper edit from a transcript, but it cannot judge emotion or truth. Use it to find soundbites faster, then make the story choices yourself.',
  'sound-design-layers': 'AI clips rarely include usable audio. Building ambience, foley and room tone under them is what makes them feel real. AI sound-effect generators are useful, but check their commercial licences.',
  'music-editing': 'AI music generators can make cheap temp tracks, but their licensing terms vary widely. For client work, confirm commercial rights in writing or use a traditional licensed library.',
  'shot-matching-skin': 'Match AI-generated shots to real footage with the same scope-based method you use for two cameras: blacks, whites, then skin on the vectorscope skin-tone line. AI skin is often oversaturated.',
  'looks-and-film-emulation': 'Add the same grain, halation and softness to AI shots as to your real footage. Their too-clean look is the most common giveaway.',
  'cleanup-and-integration': 'Generative fill and object removal can replace hours of clone-painting. Still check every frame for flicker, and re-grain the filled area so it matches.',
  'rotoscoping': 'AI masking (Magic Mask, Roto Brush, object masks) is now the default first pass for roto. Budget time to fix edges and fast motion by hand.',
  'stylised-effects': 'AI style transfer and generative transitions are trending. Use them as accents on beats, not for the whole edit, and keep flashing under 3 per second.',
  'captions-hooks-retention': 'AI can suggest hooks and cut silences automatically, but test two human-written hooks against each other. The hook is the most important creative decision in short-form.',
  'documentary-and-interview': 'Label any AI-generated or AI-enhanced imagery on screen. Never present a generated shot as real footage of a real event.',
  'trailers-and-commercials': 'Many agencies now use AI pre-viz to sell ideas before shooting. Check the client\'s AI policy before using generated shots in a final ad.',
  'ai-in-editing': 'Go deeper with the full AI Video Masterclass: how the models work, prompting, consistency, integrating with real footage, and the law.',
  'export-delivery': 'When a deliverable contains AI-generated shots, keep a source log (tool, prompt, seed, date, licence) and preserve Content Credentials where the platform supports them.',
  'business-of-editing': 'Price AI work by results, not by tool cost: generation takes many takes. Add a line to your contract about AI use, consent for likeness and voice, and the client\'s disclosure duties.',
};

export const aiScenarios = [
  {
    id: 'ai-shot-mismatch', category: 'ai', severity: 'common',
    title: 'AI-generated B-roll looks fake next to real footage',
    symptoms: 'The AI shot is too clean, too sharp, too saturated, or has a different contrast and frame rate.',
    diagnosis: 'No conform, grade match or texture match between the generated clip and the camera footage.',
    fix: [
      'Transcode the clip to your timeline frame rate and an intra-frame codec. Check for variable frame rate in MediaInfo.',
      'Match blacks, whites and skin on the scopes, exactly like matching two cameras.',
      'Add the same grain, a slight blur or softness, vignette and lens character as the real footage.',
      'Add motion blur if the generated motion is too crisp for your shutter angle.',
      'Build ambience and foley under it, then hold it shorter than the real shots around it.',
    ],
    tools: { premiere: 'Lumetri Color Match, Noise (grain), Gaussian Blur', resolve: 'Color page shot match, Film Grain, Halation', fcp: 'Color Board match, grain plugins', capcut: 'Adjust + Filters + Grain effect' },
    prevention: 'Prompt with the same lens, lighting and palette as your shoot, and generate image-to-video from a frame of your own footage.',
  },
  {
    id: 'ai-artifacts', category: 'ai', severity: 'common',
    title: 'AI clip has morphing hands, warping faces or melting text',
    symptoms: 'Fingers merge, faces change between frames, signs show gibberish, objects pop in and out.',
    diagnosis: 'Temporal-consistency failures of the generator, worst in close-ups, hands, text and fast motion.',
    fix: [
      'Step through frame by frame and mark where artifacts begin and end.',
      'Trim to the clean section. Most generated clips have 1–3 usable seconds.',
      'Hide short glitches with a speed ramp, a cutaway or a motion-blur transition.',
      'Mask and replace bad areas with a clean frame, or paint them out.',
      'Regenerate with a simpler prompt: wider shot, slower motion, no text, fewer subjects.',
    ],
    tools: { premiere: 'Razor + Time Remapping; masks', resolve: 'Retime curve; Fusion paint and masks', fcp: 'Blade + Retime', capcut: 'Split + Speed curve' },
    prevention: 'Avoid AI close-ups of hands and readable text. Prompt for slower camera moves and generate several takes.',
  },
  {
    id: 'ai-likeness-request', category: 'ai', severity: 'critical',
    title: 'Client asks you to make someone say or do something with AI',
    symptoms: 'A request to clone a CEO\'s voice, put a celebrity in an ad, or "fix" what an interviewee said.',
    diagnosis: 'A consent, legal and ethics issue, not a technical one.',
    fix: [
      'Ask for written consent from the person whose face or voice will be generated, covering the specific use.',
      'Check the platform and broadcaster rules on synthetic media, and the tool\'s licence terms.',
      'Refuse to alter what a real person said in documentary or news content.',
      'Label synthetic content where required, and keep Content Credentials intact.',
      'Add an AI clause to your contract covering consent, disclosure and liability.',
    ],
    tools: { premiere: 'Keep a source log in project notes', resolve: 'Clip metadata: add AI source notes', fcp: 'Notes/keywords: tag synthetic clips', capcut: 'Keep an external log' },
    prevention: 'Have a written AI policy and raise it at the kickoff meeting.',
  },
  {
    id: 'ai-shot-too-short', category: 'ai', severity: 'common',
    title: 'A shot ends a second too early for the cut or the beat',
    symptoms: 'You need a few more frames of a clip that was never recorded.',
    diagnosis: 'Not enough handles. A classic edit problem that generative extend now solves.',
    fix: [
      'Try generative extend in your editor (Premiere Generative Extend or an equivalent) for the missing frames.',
      'Or slow the last part with optical flow or Speed Warp.',
      'Or freeze the last frame and add a slow push-in.',
      'QC the extended frames at 100% and re-grain to match.',
    ],
    tools: { premiere: 'Generative Extend; Time Remapping + Optical Flow', resolve: 'Speed Warp retime; freeze frame + Dynamic Zoom', fcp: 'Optical Flow retime; Hold frame', capcut: 'Speed curve; Freeze' },
    prevention: 'Roll at least 2–3 seconds before and after every action on set.',
  },
];

export const aiEffects = [
  { id: 'ai-broll', name: 'Invisible AI B-roll Insert', difficulty: 3, trend: 'YouTube explainers, ads, documentaries', week: 12,
    steps: ['Grab a frame from your real footage as the image-to-video reference', 'Prompt with the same lens, lighting and palette (use the Prompt Builder)', 'Generate 4–8 takes and keep the cleanest 1–3 seconds', 'Conform to timeline fps and ProRes', 'Match the grade on scopes, add grain and softness', 'Add ambience and foley, and cut on motion'] },
  { id: 'ai-impossible', name: 'Impossible Camera Move (AI-generated)', difficulty: 3, trend: 'Music videos, brand films', week: 12,
    steps: ['Design the keyframe still first (photo or generated image)', 'Prompt the camera path explicitly: "continuous FPV fly-through from the window into the eye"', 'Generate several takes and choose the one with the cleanest motion', 'Speed-ramp through any wobbly section', 'Sound-design whooshes on the move'] },
  { id: 'ai-extend', name: 'Generative Extend to Land the Beat', difficulty: 1, trend: 'Every edit', week: 12,
    steps: ['Find a shot ending a few frames before the beat', 'Apply generative extend or optical-flow slow-down to the last 10–20 frames', 'Check the new frames at 100%', 'Re-grain to match'] },
];

export const aiTools = [
  { id: 'genvideo', name: 'AI video generators (Veo, Sora, Runway, Kling, Luma, Firefly Video)', cat: 'ai', tier: 'recommended', price: 'subscription', url: 'https://runwayml.com', focus: ['social', 'commercial', 'vfx'], what: 'Text-to-video and image-to-video models that generate short clips from prompts and reference images.', why: 'Missing B-roll, impossible shots and pre-viz. Learn prompting with cinematography language and match the output to real footage.', week: 12 },
  { id: 'avatars', name: 'AI avatar / presenter tools (HeyGen, Synthesia)', cat: 'ai', tier: 'pro', price: 'subscription', url: 'https://www.synthesia.io', focus: ['commercial', 'social'], what: 'Generate presenter-style videos from a script, in many languages.', why: 'Training, internal communications and explainer videos at scale. Use only consented avatars and disclose them.', week: 12 },
  { id: 'aivoice', name: 'AI voice & dubbing (ElevenLabs or built-in tools)', cat: 'ai', tier: 'recommended', price: 'freemium', url: 'https://elevenlabs.io', focus: ['social', 'commercial', 'doc', 'audio'], what: 'Text-to-speech, voice cloning and multilingual dubbing.', why: 'Temp voiceovers, localisation and fixing a missing line. Clone a voice only with written consent.', week: 12 },
  { id: 'c2pa', name: 'Content Credentials (C2PA) verification', cat: 'ai', tier: 'recommended', price: 'free', url: 'https://contentcredentials.org', focus: ['all'], what: 'An open standard that records how media was created or edited, including AI use.', why: 'Proves provenance to clients and platforms, and lets you check whether incoming media is synthetic.', week: 12 },
];

export const aiGlossary = [
  ['Diffusion model', 'An AI model that generates images or video by starting from noise and removing it step by step, guided by a prompt.'],
  ['Latent space', 'A compressed internal representation that AI models work in instead of raw pixels, decoded back into frames at the end.'],
  ['Text-to-video', 'Generating a video clip from a written prompt.'],
  ['Image-to-video', 'Animating a still image into a video clip, giving far more control over composition and consistency.'],
  ['Seed', 'The starting random noise of a generation. Reusing it with the same prompt gives similar results.'],
  ['Temporal consistency', 'How stable objects, faces and textures stay from frame to frame in generated or processed video.'],
  ['Generative extend', 'AI that creates extra frames at the start or end of a clip to make it longer.'],
  ['Content Credentials', 'C2PA metadata recording how a file was created and edited, including any AI generation.'],
  ['Deepfake', 'Synthetic media that realistically depicts a real person saying or doing something they did not.'],
  ['Negative prompt', 'A list of things the AI should avoid generating, such as text, extra fingers or watermarks.'],
];

export const aiQuiz = [
  { q: 'Why is image-to-video often better than text-to-video for professional work?', options: ['It is always free', 'You approve composition, wardrobe and color in the keyframe before animating', 'It produces longer clips', 'It needs no prompt'], answer: 1, why: 'A locked keyframe gives control and consistency.' },
  { q: 'An AI B-roll shot looks fake next to your camera footage. What do you do first?', options: ['Add a glitch effect', 'Conform it, then match the grade and add matching grain and texture', 'Increase its saturation', 'Make it longer'], answer: 1, why: 'Treat it like a second camera: conform, match on the scopes, then match the texture.' },
  { q: 'Before cloning a client\'s voice for a voiceover you need…', options: ['A faster GPU', 'Written consent from the person', 'A LUT', 'Nothing if the client pays'], answer: 1, why: 'Consent is a legal and ethical requirement.' },
];
