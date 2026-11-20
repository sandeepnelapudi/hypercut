import { aiTools } from './ai-video.mjs';
// The editor's toolkit: real tools working editors rely on.
// tier: essential | recommended | pro   price: free | freemium | paid | subscription
// focus tags drive the kit builder: all | social | events | film | commercial | color | vfx | audio | doc
export const TOOL_CATEGORIES = [
  ['utility', 'Media utilities', 'Inspect, convert, back up and repair footage.'],
  ['audio', 'Audio tools', 'Clean, measure and finish sound.'],
  ['color', 'Color & monitoring', 'See color accurately and grade with confidence.'],
  ['vfx', 'VFX, motion & plugins', 'Tracking, cleanup, noise reduction and effects.'],
  ['workflow', 'Review & collaboration', 'Get feedback and work with clients and teams.'],
  ['assets', 'Assets & licensing', 'Music, SFX, footage and fonts you can legally use.'],
  ['ai', 'AI video tools', 'Generate, dub, enhance and verify synthetic media, responsibly.'],
  ['hardware', 'Hardware', 'The physical kit that makes editing fast and accurate.'],
];

export const tools = [
  // Utilities
  { id: 'mediainfo', name: 'MediaInfo', cat: 'utility', tier: 'essential', price: 'free', url: 'https://mediaarea.net/en/MediaInfo', focus: ['all'], what: 'Shows everything about a file: codec, bitrate, bit depth, chroma subsampling, color tags, variable or constant frame rate.', why: 'The first thing you open when a file misbehaves. It diagnoses audio drift (VFR), wrong color tags and codec problems in seconds.', week: 1 },
  { id: 'shutter-encoder', name: 'Shutter Encoder', cat: 'utility', tier: 'essential', price: 'free', url: 'https://www.shutterencoder.com', focus: ['all'], what: 'A free converter built on FFmpeg, made by an editor for editors: proxies, ProRes/DNxHR, VFR→CFR, rewrap, loudness normalisation.', why: 'Fixes phone footage, makes proxies and delivers files without paying for an encoder.', week: 1 },
  { id: 'handbrake', name: 'HandBrake', cat: 'utility', tier: 'recommended', price: 'free', url: 'https://handbrake.fr', focus: ['all'], what: 'Open-source transcoder for H.264, HEVC and AV1 delivery files.', why: 'Quick, high-quality compressed exports and constant-frame-rate conversion.', week: 12 },
  { id: 'ffmpeg', name: 'FFmpeg', cat: 'utility', tier: 'pro', price: 'free', url: 'https://ffmpeg.org', focus: ['all'], what: 'The command-line engine inside most video tools. Converts, trims, measures loudness, extracts audio and builds batch scripts.', why: 'Automates repetitive deliveries. The Export Settings lab writes the commands for you.', week: 12 },
  { id: 'offload', name: 'Checksum offload tool (Hedge, OffShoot, ShotPut Pro or Resolve Clone)', cat: 'utility', tier: 'essential', price: 'freemium', url: 'https://hedge.video', focus: ['all'], what: 'Copies camera cards to several drives and verifies every byte with checksums.', why: 'Drag-and-drop copies can silently corrupt. Losing a client\'s footage is the one mistake you cannot fix.', week: 1 },
  { id: 'gyroflow', name: 'Gyroflow', cat: 'utility', tier: 'recommended', price: 'free', url: 'https://gyroflow.xyz', focus: ['social', 'events', 'film'], what: 'Stabilises footage using the camera\'s gyro data instead of image analysis.', why: 'Far smoother than Warp Stabilizer for action cams, Sony and other gyro-recording cameras, with rolling-shutter correction.', week: 9 },
  { id: 'topaz', name: 'Topaz Video', cat: 'utility', tier: 'pro', price: 'paid', url: 'https://www.topazlabs.com', focus: ['doc', 'social', 'events'], what: 'AI upscaling, deinterlacing, denoising and frame interpolation.', why: 'Rescues archive, low-res and old footage for documentaries and remasters.', week: 12 },
  // Audio
  { id: 'youlean', name: 'Youlean Loudness Meter', cat: 'audio', tier: 'essential', price: 'freemium', url: 'https://youlean.co/youlean-loudness-meter/', focus: ['all'], what: 'Free LUFS and true-peak meter plugin and standalone app.', why: 'Every platform normalises loudness. Meter your mix before you export (or use the HYPERCUT Loudness Meter lab).', week: 5 },
  { id: 'rx', name: 'iZotope RX', cat: 'audio', tier: 'pro', price: 'paid', url: 'https://www.izotope.com', focus: ['doc', 'film', 'events', 'audio'], what: 'The industry standard audio repair suite: de-noise, de-reverb, de-wind, de-click, spectral repair.', why: 'Saves interviews and location sound that would otherwise need ADR or a reshoot.', week: 5 },
  { id: 'enhance', name: 'Built-in AI voice cleanup (Resolve Voice Isolation, Adobe Enhance Speech)', cat: 'audio', tier: 'recommended', price: 'freemium', url: 'https://podcast.adobe.com', focus: ['social', 'doc', 'events'], what: 'One-click AI dialogue isolation from noise and room echo.', why: 'Fast fixes for talking-head content. Use it sparingly to avoid robotic artifacts.', week: 5 },
  // Color
  { id: 'resolve', name: 'DaVinci Resolve (free) / Studio', cat: 'color', tier: 'essential', price: 'freemium', url: 'https://www.blackmagicdesign.com/products/davinciresolve', focus: ['all'], what: 'Edit, color, Fusion VFX and Fairlight audio in one app.', why: 'The best color tools in the world, free. Even if you edit elsewhere, you will grade here.', week: 7 },
  { id: 'probe', name: 'Monitor calibration probe + software (Calibrite + DisplayCAL or Calman)', cat: 'color', tier: 'recommended', price: 'paid', url: 'https://calibrite.com', focus: ['color', 'commercial', 'film'], what: 'A colorimeter that measures your screen and builds a correction profile or LUT.', why: 'An uncalibrated screen means you are grading blind. Clients will see a different image.', week: 6 },
  { id: 'chart', name: 'Color checker chart', cat: 'color', tier: 'recommended', price: 'paid', url: 'https://calibrite.com', focus: ['color', 'commercial', 'film', 'events'], what: 'A card of known color patches you film at the start of each setup.', why: 'One click matches cameras and fixes white balance in Resolve\'s Color Match.', week: 7 },
  { id: 'filmlook', name: 'Film emulation plugin (Dehancer or FilmConvert)', cat: 'color', tier: 'pro', price: 'paid', url: 'https://www.dehancer.com', focus: ['film', 'commercial', 'color'], what: 'Profiles of real film stocks: grain, halation, bloom and print emulation.', why: 'Convincing film looks in minutes, built on measured stocks.', week: 7 },
  // VFX & plugins
  { id: 'neat', name: 'Neat Video', cat: 'vfx', tier: 'recommended', price: 'paid', url: 'https://www.neatvideo.com', focus: ['events', 'doc', 'film'], what: 'Temporal noise reduction plugin for every major NLE.', why: 'The go-to fix for noisy low-light footage at weddings, events and night shoots.', week: 9 },
  { id: 'mocha', name: 'Mocha Pro / Sapphire (Boris FX)', cat: 'vfx', tier: 'pro', price: 'subscription', url: 'https://borisfx.com', focus: ['vfx', 'commercial'], what: 'Planar tracking, object removal, screen inserts (Mocha) and high-end effects (Sapphire).', why: 'Industry-standard tracking and roto when the built-in tools fail.', week: 9 },
  { id: 'aftereffects', name: 'Adobe After Effects', cat: 'vfx', tier: 'recommended', price: 'subscription', url: 'https://www.adobe.com/products/aftereffects.html', focus: ['social', 'commercial', 'vfx'], what: 'Motion graphics and compositing standard.', why: 'Titles, animations, MOGRT templates and most motion-design jobs.', week: 8 },
  { id: 'blender', name: 'Blender', cat: 'vfx', tier: 'recommended', price: 'free', url: 'https://www.blender.org', focus: ['vfx', 'commercial'], what: 'Free 3D suite with an excellent camera tracker and compositor.', why: '3D titles, product shots and camera-tracked VFX at zero cost.', week: 9 },
  // Workflow
  { id: 'frameio', name: 'Frame.io (or Blackmagic Cloud / Vimeo review)', cat: 'workflow', tier: 'essential', price: 'freemium', url: 'https://frame.io', focus: ['commercial', 'events', 'social', 'film', 'doc'], what: 'Upload a cut and clients leave comments on exact frames. Integrates with Premiere and Resolve.', why: 'Ends vague emailed feedback. Notes arrive timecoded and land directly on your timeline.', week: 12 },
  { id: 'pm', name: 'Project tracker (Notion, Trello or a spreadsheet)', cat: 'workflow', tier: 'recommended', price: 'freemium', url: 'https://www.notion.so', focus: ['all'], what: 'Track briefs, versions, revisions, invoices and deadlines.', why: 'Professionalism is half the job. Clients rehire editors who never miss a deadline.', week: 12 },
  // Assets
  { id: 'music', name: 'Licensed music library (Artlist, Musicbed or Epidemic Sound)', cat: 'assets', tier: 'essential', price: 'subscription', url: 'https://artlist.io', focus: ['all'], what: 'Subscription music and SFX libraries with clear licences for client and social use.', why: 'Unlicensed music gets videos muted, demonetised or taken down. Keep the licence PDFs.', week: 5 },
  { id: 'freesound', name: 'Freesound', cat: 'assets', tier: 'recommended', price: 'free', url: 'https://freesound.org', focus: ['all'], what: 'Community sound-effects library. Check each sound\'s Creative Commons licence.', why: 'Free whooshes, ambiences and foley while you build your own SFX library.', week: 5 },
  { id: 'fonts', name: 'Google Fonts', cat: 'assets', tier: 'recommended', price: 'free', url: 'https://fonts.google.com', focus: ['all'], what: 'Open-licence fonts that are safe for commercial video.', why: 'Avoids font licensing trouble. Inter, Montserrat and Bebas Neue cover most needs.', week: 8 },
  // Hardware
  { id: 'nvme', name: 'Fast NVMe SSD (1–4 TB) for media and cache', cat: 'hardware', tier: 'essential', price: 'paid', url: '', focus: ['all'], what: 'Internal or Thunderbolt/USB 3.2 NVMe drive with 1,000+ MB/s.', why: 'The biggest single speed boost for playback and caching. Use the Bitrate lab to size it.', week: 1 },
  { id: 'backup', name: 'Backup drives (3-2-1) + cloud backup', cat: 'hardware', tier: 'essential', price: 'paid', url: '', focus: ['all'], what: 'At least two extra copies on different media, one off-site.', why: 'Drives fail. Clients do not care why the footage is gone.', week: 1 },
  { id: 'headphones', name: 'Closed-back studio headphones', cat: 'hardware', tier: 'essential', price: 'paid', url: '', focus: ['all'], what: 'Accurate, neutral headphones (for example Sony MDR-7506 or Audio-Technica ATH-M50x).', why: 'Consumer headphones exaggerate bass. You cannot fix what you cannot hear.', week: 5 },
  { id: 'monitors', name: 'Near-field studio speakers', cat: 'hardware', tier: 'recommended', price: 'paid', url: '', focus: ['film', 'commercial', 'audio'], what: 'A pair of small, flat-response monitor speakers.', why: 'Final mixes need speakers as well as headphones to judge space and balance.', week: 5 },
  { id: 'gpu', name: 'GPU with 8–12 GB+ VRAM, 32 GB+ RAM', cat: 'hardware', tier: 'recommended', price: 'paid', url: '', focus: ['all'], what: 'A modern GPU (or Apple Silicon Pro/Max) and enough RAM.', why: 'Color, noise reduction and AI tools run on the GPU. VRAM limits what plays in real time.', week: 1 },
  { id: 'refmonitor', name: 'Reference monitor + video I/O (UltraStudio / DeckLink)', cat: 'hardware', tier: 'pro', price: 'paid', url: '', focus: ['color', 'film', 'commercial'], what: 'A calibrated display fed by a dedicated video output, bypassing OS color management.', why: 'What you grade is exactly what the client gets. Required for HDR.', week: 6 },
  { id: 'controller', name: 'Editing keyboard or controller (Speed Editor, Loupedeck or macro pad)', cat: 'hardware', tier: 'pro', price: 'paid', url: '', focus: ['events', 'doc', 'social', 'film'], what: 'Physical jog wheel and dedicated edit keys.', why: 'Cuts hours from long-form and multicam edits.', week: 2 },
  { id: 'timecode', name: 'Timecode sync boxes (Tentacle Sync or Deity TC-1)', cat: 'hardware', tier: 'pro', price: 'paid', url: 'https://tentaclesync.com', focus: ['events', 'film', 'doc'], what: 'Small boxes that jam the same timecode into every camera and recorder.', why: 'Multicam syncs instantly and perfectly, with no waveform hunting.', week: 2 },
  { id: 'ups', name: 'UPS (uninterruptible power supply)', cat: 'hardware', tier: 'recommended', price: 'paid', url: '', focus: ['all'], what: 'A battery backup for your workstation and drives.', why: 'A power cut mid-render or mid-save can corrupt projects and drives.', week: 12 },
];

// Kit builder: budget filters tiers; focus filters by focus tags.
export const BUDGETS = [
  ['zero', 'Zero budget (free tools only)'],
  ['starter', 'Starter (free + essentials)'],
  ['pro', 'Professional (everything that pays for itself)'],
];
export const FOCUSES = [
  ['all', 'All-round editor'], ['social', 'YouTube & short-form'], ['events', 'Weddings & events'], ['film', 'Narrative film'],
  ['commercial', 'Commercials & agency'], ['color', 'Colorist'], ['vfx', 'VFX & motion'], ['audio', 'Audio-heavy (podcasts, doc)'], ['doc', 'Documentary'],
];
tools.push(...aiTools);
import { inKit } from '../assets/js/core/kit.js';
export function buildKit(budget, focus, list = tools) {
  return list.filter((t) => inKit(t, budget, focus));
}
