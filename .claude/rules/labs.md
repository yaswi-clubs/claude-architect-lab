---
paths: ["js/labs.js"]
---
# Lab rules
- Every lab must show the raw request and raw response (use the `json()` helper) so the learner sees real API JSON.
- Every lab must handle errors with `errBox()`; never let an exception leave the UI stuck.
- Wrap run buttons in `busy()` so they can't be double-clicked into duplicate (paid) calls.
- Register new labs in the `LABS` export at the bottom of the file.
- Mock tools run locally in the browser. Never call third-party APIs from labs.
