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
* **"PDA", "Order Block", "Zone"** -> `self.draw_pda_zone(...)` for a neutral grey background block.
* **"Previous context", "Older candles"** -> `self.draw_static_candle(..., is_muted=True)` to instantly draw non-distracting background candles.
* **"Liquidity/Pivot"** -> `self.create_glowing_node(...)` at wick extremes.
* **"FVG/Imbalance"** -> `self.draw_fvg_zone(...)`
* **"Area", "Range", "Fair Value Area"** -> `self.draw_dashed_region(...)`
* **"Tap/Respect"** -> `self.show_tap_glow(...)`
* **"Look at this wick", "Right here"** -> `self.draw_ellipse_highlight(...)` to circle micro details.
* **"Large Wick", "Measure"** -> `self.draw_measurement_line(...)` to act as a ruler alongside a candle.
* **"Risk/Reward", "Target", "2R"** -> `self.draw_rr_box(...)`
* **"Overall Context", "This whole move"** -> `self.draw_context_bracket(...)`
* **"HTF Trend", "Macro path"** -> `self.draw_htf_path(...)` or `self.draw_line_overlay(...)`.
* **"Two options", "Reverse or Continue"** -> `self.draw_split_paths(...)`
* **"Manipulation", "Note how"** -> `self.create_callout(..., is_dashed=True)`
* **"Valid", "Correct"** -> `self.draw_validation_mark(..., is_valid=True)`
* **"Invalid", "Wrong", "Fails"** -> `self.draw_validation_mark(..., is_valid=False)`
* **"Do not", "Never", "Waste time"** -> `self.flash_no_symbol(...)`
* **"Smart money tarmac", "Liquidity pool"** -> `self.draw_liquidity_ray(...)` projecting to the right edge.
* **"Real world example", "Like an airplane"** -> `self.insert_media(...)`

## 4. Pre-Flight Code Verification (Non-Vision Heuristics)
Run this checklist in your thought process before finalizing code:
1. **Z-Index Hierarchy:** Check all `.set_z_index()`. Backgrounds=0, Wicks=1, Bodies=2, Glows=3, Paths=4, Text/Arrows=5, Overlays=6.
2. **Anti-Ghosting:** Ensure no object subject to `Create()` or `GrowFromEdge()` has a `self.add()` call directly before it.
3. **Data Integrity:** Double check consecutive Close/Open values in your array. 
4. **Dynamic Extractions:** Are reference lines hardcoded? (e.g., `y = 2.25`). If yes, **FAIL**. Extract them via index (e.g., `y = data[target_idx][1]`).
5. **Sequence Breaks:** Did you put `self.wait()` pauses to drop indicators *during* candle generation, rather than dumping them all at the end of the script?
