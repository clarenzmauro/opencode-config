---
name: manim-ohlc-charting
description: Framework for scripting high-end financial charts in Manim mapped to voiceovers. Enforces Agentic Pre-Vis Planning, base class inheritance, and Non-Vision code linting.
---

## 1. The Core Dependency Rule
Never write raw config or raw candle drawing logic. You **MUST** import and inherit from the master class located in `base_config.py`. 

```python
from manim import *
from base_config import SirPickleBaseChart, UP_BORDER, DOWN_BORDER # import tokens as needed

class MyNewVideo(SirPickleBaseChart):
    def construct(self):
        # Your scene logic here, utilizing inherited self.play_live_candle(), etc.
```

## 2. Agentic Pre-Vis Protocol (Plan Mode)
Before writing any Manim code, output a visual blueprint explicitly detailing these four phases:
* **Phase A: Script Mapping:** Break the provided voiceover into timestamp blocks and assign specific `self.method()` visual triggers to them.
* **Phase B: Spatial Layout:** Define `start_x` and `spacing`. (Remember: `start_x = -(len(data) - 1) * spacing / 2` to center).
* **Phase C: Data Continuity Check:** Draft the `(Open, High, Low, Close)` array. Verify manually that `Close[i] == Open[i+1]` unless an explicit gap is requested.
* **Phase D: Z-Index Plan:** Document structural layer depths.

## 3. Script-to-Screen Method Mapping
Use the inherited methods from `SirPickleBaseChart` to match the script's narrative:
* **"Clean/Impulse"** -> `self.play_live_candle(..., speed_multiplier=0.4)` & `self.draw_highlight_zone(..., is_clean=True)`
* **"Choppy/Messy"** -> `self.play_live_candle(..., speed_multiplier=1.3)` & `self.draw_highlight_zone(..., is_clean=False)`
* **"Liquidity/Pivot"** -> `self.play(FadeIn(self.create_glowing_node(...)))` at wick extremes.
* **"FVG/Imbalance"** -> `self.draw_fvg_zone(...)`
* **"Tap/Respect"** -> `self.show_tap_glow(...)`

## 4. Pre-Flight Code Verification (Non-Vision Heuristics)
Run this checklist in your thought process before finalizing code:
1. **Z-Index Hierarchy:** Check all `.set_z_index()`. Backgrounds=0, Wicks=1, Bodies=2, Glows=3, Text/Arrows=5.
2. **Anti-Ghosting:** Ensure no object subject to `Create()` or `GrowFromEdge()` has a `self.add()` call directly before it.
3. **Data Integrity:** Double check consecutive Close/Open values in your array. 
4. **Dynamic Extractions:** Are reference lines hardcoded? (e.g., `y = 2.25`). If yes, **FAIL**. Extract them via index (e.g., `y = data[target_idx][1]`).
5. **Sequence Breaks:** Did you put `self.wait()` pauses to drop indicators *during* candle generation, rather than dumping them all at the end of the script?
