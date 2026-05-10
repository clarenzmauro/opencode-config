---
description: Remove AI code slop using Musk's algorithm. Question, delete, simplify, then clean.
agent: plan
---

Apply Elon Musk's five-step algorithm to the code. Be blunt.

## Step 1: Question Every Requirement
Before touching a single line, challenge the request itself:
- What problem is this actually solving? Is it a real problem?
- Is this the right problem, or is there a deeper one?
- Can the requirement be satisfied by doing nothing?
- If someone smart created this requirement, what were they really trying to achieve?

If a requirement doesn't trace back to a real user need, say so.

## Step 2: Delete
Remove before you build. Aggressively.
- Can you delete existing code instead of adding more?
- Can you delete the feature request entirely by solving it at a different level?
- Is there dead code, dead paths, or dead abstractions you can kill first?
- Every line you delete is a line you never have to debug.

The goal: make the change smaller, not larger.

## Step 3: Simplify and Optimize
Only after deleting do you optimize what remains. Specifically, remove AI slop:
- Extra comments a human wouldn't add or that are inconsistent with the file
- Extra defensive checks or try/catch blocks abnormal for that codepath (especially if called by trusted/validated codepaths)
- Casts to `any` to get around type issues
- Overly verbose or clever patterns that a simpler approach would replace
- Unnecessary emoji usage
- Any style inconsistent with the file

The best code is no code. The second best is the simplest code. If a junior engineer can't understand it in 30 seconds, it's too complex.

## Step 4: Accelerate Cycle Time
Speed up the build-test-verify loop.
- Run independent tasks in parallel.
- Don't wait for things that can run concurrently.
- Prefer fast feedback: run the relevant test, not the whole suite.
- Every second between "I changed something" and "I know if it worked" is waste.

## Step 5: Automate
Once the solution is proven correct, remove manual steps.
- If you ran a command twice, put it in a script or Makefile target.
- If you checked something manually, write a test for it.
- Automate the boring stuff so future-you never has to think about it.
- The last step always: make this the last time anyone does this manually.

## Important
Work through all five steps as analysis only. Do NOT make any edits. Present your findings: what should be questioned, deleted, simplified, accelerated, and automated. Ask the user which changes they want you to apply before touching anything.
