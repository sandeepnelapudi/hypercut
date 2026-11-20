// "Inside the Engine" — sequential deep dive from photon to pixel on a viewer's screen.
export const engineChapters = [
  {
    id: 'capture', title: '1. Capture: Light → Sensor',
    body: `<p>Photons pass through the lens and hit millions of photosites on a CMOS sensor. Each photosite converts light into an electrical charge proportional to intensity. A <strong>Bayer color filter array</strong> makes each photosite sensitive to only red, green or blue. An analog-to-digital converter (ADC) quantises the charge into numbers (12–16 bits in cinema cameras).</p>
<p><strong>Rolling shutter</strong> sensors read lines top-to-bottom over several milliseconds — fast motion skews. <strong>Global shutter</strong> sensors read all photosites at once.</p>`,
  },
  {
    id: 'processing', title: '2. In-Camera Processing',
    body: `<p>The camera's image processor <strong>debayers</strong> (demosaics) the data into full RGB pixels, applies white balance, a color matrix into the camera's gamut, a gamma or log curve, noise reduction and sharpening. RAW formats skip most of this, storing sensor data plus metadata so these decisions are made in post.</p>`,
  },
  {
    id: 'encoding', title: '3. Encoding & Compression',
    body: `<ol><li>RGB → Y′CbCr conversion and chroma subsampling (4:2:2 / 4:2:0).</li><li>Frame partitioned into blocks (macroblocks in H.264, Coding Tree Units up to 64×64 in HEVC, superblocks up to 128×128 in AV1).</li><li><strong>Prediction</strong>: intra prediction from neighbouring blocks, or inter prediction with motion vectors pointing to reference frames.</li><li>The residual (difference) is transformed with a DCT-like integer transform.</li><li><strong>Quantization</strong> discards precision (the lossy step) based on the target bitrate/quality.</li><li><strong>Entropy coding</strong> (CABAC) packs the data losslessly.</li><li>Frames are grouped into GOPs: I, P and B frames.</li></ol>`,
  },
  {
    id: 'container', title: '4. Containers & Metadata',
    body: `<p>The encoded streams are wrapped in a container (MOV, MP4, MXF) with a header/index describing tracks, timecode, frame rate, color tags (primaries, transfer, matrix — e.g. "1-1-1" for Rec.709) and camera metadata. A corrupted index (card pulled mid-recording) makes a file unreadable even though the frames are intact — which is why recovery tools rebuild the index from a reference file.</p>`,
  },
  {
    id: 'ingest', title: '5. Ingest, Indexing & Media Cache',
    body: `<p>When you import, the NLE reads container metadata, builds an index of frame positions, generates <strong>audio peak files</strong> (waveforms) and thumbnails, and may conform audio to the project sample rate. These live in the media cache. Corrupt cache = weird glitches — clearing it is a classic fix.</p>`,
  },
  {
    id: 'timeline', title: '6. The Timeline Data Model',
    body: `<p>The timeline is a tree of tracks containing clip items. Each item references a media file, a source in/out range, a timeline position, speed, and a stack of effects with keyframed parameters. Nothing touches the media files. Interchange formats (EDL, XML, AAF, OTIO) serialise this model so another program can rebuild it.</p>`,
  },
  {
    id: 'decode', title: '7. Decoding & Playback Engine',
    body: `<p>For each output frame the playback engine determines visible items, then requests source frames from decoders. Long-GOP sources require decoding from the previous I-frame. Hardware decoders (NVDEC, Quick Sync, Apple Media Engine, AMD VCN) handle supported profiles; unsupported ones fall back to CPU. Engines decode ahead into a <strong>frame cache</strong> and use multiple threads to keep up with real time — 41.7 ms per frame at 24 fps, 16.7 ms at 60 fps.</p>`,
  },
  {
    id: 'gpu', title: '8. The GPU Effects & Color Pipeline',
    body: `<p>Decoded frames are uploaded to GPU memory as floating-point textures (16- or 32-bit float to avoid banding and clipping). The order typically is:</p>
<pre>Source decode → input color transform (Log/RAW → working space)
→ clip effects (in stack/node order) → transforms (scale, position)
→ compositing (blend modes, alpha) → timeline/group grade
→ output transform (working → Rec.709 / PQ) → viewer / video I/O</pre>
<p>Effects are GPU shader programs running on thousands of cores in parallel — one thread per pixel. Order matters: scaling before sharpening looks different from sharpening before scaling.</p>`,
  },
  {
    id: 'color-management', title: '9. Color Management',
    body: `<p><strong>Display-referred</strong>: the image is graded in its display space. <strong>Scene-referred</strong>: input transforms convert each camera into a common wide-gamut linear or log working space (ACEScct, DaVinci Wide Gamut Intermediate). Grading happens there; a final <strong>output transform</strong> (with tone mapping) maps to each display target — SDR Rec.709, HDR PQ, P3 cinema. That's how one grade feeds many deliverables.</p>`,
  },
  {
    id: 'audio-engine', title: '10. The Audio Engine',
    body: `<p>Audio is processed in buffers (e.g. 256–1024 samples). Each track runs its clip gain, plugins (EQ, compressor) and panning, then feeds buses (dialogue, music, effects), then the master bus with a limiter. Plugins introduce latency, which the engine compensates (delay compensation) to keep sync. Audio clock is usually the master clock for playback — video frames are presented to match it.</p>`,
  },
  {
    id: 'render', title: '11. Rendering & Export',
    body: `<p>At export the engine processes every frame at full quality (no playback shortcuts), then hands frames to an encoder: hardware (NVENC, Quick Sync, Apple VideoToolbox — fast) or software (x264/x265 — slower, often more efficient at low bitrates). <strong>Smart rendering</strong> copies unchanged compressed frames directly when source and output codecs match, avoiding re-encoding. Then the muxer writes streams into the container with color tags.</p>`,
  },
  {
    id: 'ai', title: '12. AI Engines Inside Modern Editors',
    body: `<p>AI features run neural networks — often on dedicated NPUs or the GPU (Tensor cores, Apple Neural Engine):</p>
<ul><li><strong>Segmentation networks</strong> output a per-pixel mask (Magic Mask, Roto Brush).</li><li><strong>Optical flow networks</strong> estimate motion for retiming (Speed Warp) and stabilisation.</li><li><strong>Super-resolution</strong> networks reconstruct detail when upscaling.</li><li><strong>Speech recognition</strong> transformers create time-aligned transcripts for text-based editing.</li><li><strong>Source separation</strong> models split voice from noise and music (Voice Isolation).</li><li><strong>Diffusion models</strong> generate or extend frames by iteratively denoising latent representations conditioned on text, images or neighbouring frames.</li></ul>`,
  },
  {
    id: 'delivery', title: '13. Delivery & the Viewer\'s Screen',
    body: `<p>Platforms re-encode your upload into an <strong>adaptive bitrate ladder</strong> (multiple resolutions/bitrates in H.264, VP9, AV1) and stream segments via HLS or DASH; the player switches quality based on bandwidth. The viewer's device decodes, applies its own color management/tone mapping, and displays — which is why you must test on real phones.</p>`,
  },
];
