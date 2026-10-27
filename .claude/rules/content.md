---
paths: ["js/content.js"]
---
# Lesson content rules
- Each lesson object has: `id` ("module.lesson"), `title`, `body` (HTML string), optional `lab`, optional `quiz`.
- Quiz option `o[0]` is always the correct answer; the app shuffles. Every quiz needs an explanation `x`.
- Explain from first principles. Assume the reader knows data modelling but not software engineering.
- Every lesson tied to an exam domain should end by linking the idea to how the exam tests it.
- Bodies are template literals: escape `${` as `\${` when showing code that contains it.
