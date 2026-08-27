# Compiled MindAR marker targets

This folder holds the compiled `.mind` tracking files MindAR actually uses
to recognize each printed marker via the camera. These are NOT the same as
the `.jpg` files one level up in `public/markers/` — those are just the
plain images used for printing and on-screen preview.

## How to generate a .mind file

1. Open MindAR's official compiler: https://hiukim.github.io/mind-ar-js-doc/tools/compile
2. Upload **one** marker image at a time (e.g. `public/markers/Q1W1.jpg`).
3. Click compile, wait for it to finish, and download the resulting
   `targets.mind` file.
4. Rename it to match the source image and drop it here — e.g.
   `Q1W1.jpg` → `Q1W1.mind`.
5. Repeat for every marker in `public/markers/`.

This is a one-time manual step per marker (the compiler needs a real
browser Canvas to run, which can't be scripted headlessly without
installing native build tools locally). Once a `Q{quarter}W{week}.mind`
file exists here, that lesson's AR camera view will work automatically —
`getMindTargetPath()` in `src/lib/markerUtils.ts` derives this path from
the marker image path with no code changes needed per lesson.

**Tip:** for best tracking quality, prefer marker images with lots of
visual detail/contrast (the printed sheets already in this project — atoms,
diagrams, etc. — are well-suited for this). A plain solid-color or
low-detail image tracks poorly regardless of which library compiles it.
