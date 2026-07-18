ORGINTEL INTELLIGENCE HEADQUARTERS — V3

WHAT CHANGED
- Local GLB models for the founder, Tal, and the intelligence core
- Procedural models remain as fallbacks if an asset cannot load
- Cinematic bloom post-processing
- Clickable/raycasted rooms
- Cinematic station-focus camera
- Animated loaded models
- Existing guided Organizational Intelligence lesson retained
- Quality controls, mobile controls, accessibility fallback, and conversion links retained

RUN IT
This project must be served over HTTP because browsers block local GLB loading from file:// URLs.

In Replit:
1. Upload this entire folder, preserving the assets folder.
2. Run:
   python3 -m http.server 3000
3. Open the Replit web preview on port 3000.

Do not upload index.html without the assets folder.

FILES
index.html
assets/founder.glb
assets/tal.glb
assets/intelligence-core.glb
