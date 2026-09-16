# Zella Site QA Plan

## Global Footer Standardization

| Property | Standard Value | Status |
|----------|---------------|--------|
| Background | `#10B981` (green) | [ ] Verify all pages |
| Padding | `var(--space-s) 0` | [ ] Verify all pages |
| Text color | `rgba(255, 255, 255, 0.8)` | [ ] Verify |
| Hover text | `#FFFFFF` (white) | [ ] Verify |
| Underline color | `#3D5A80` (muted navy) | [ ] Verify |
| Underline height | `4px` | [ ] Verify |
| Font size | `var(--text-xl)` desktop, `var(--text-l)` mobile | [ ] Verify |
| Alignment | Right-aligned | [ ] Verify |

---

## Issues to Verify

| # | Issue | Page | Success Criteria | Status |
|---|-------|------|------------------|--------|
| 1 | HOME link hidden on desktop | All pages | HOME hidden in desktop nav, visible in mobile hamburger | [ ] |
| 2 | Green section edge-to-edge | Case studies | Green background touches both viewport edges | [ ] |
| 3 | Password underline length | designer.html | Underline only spans input + arrow (not full width) | [ ] |
| 4 | Footer consistency | ALL pages | Matches homepage: compact green, white text, right-aligned | [ ] |
| 5 | Footer hover | ALL pages | Text turns white, navy underline appears from mouse direction | [ ] |

---

## Pages to Test

- [ ] **index.html** (homepage) - exemplar
- [ ] **artist.html**
- [ ] **designer.html**
- [ ] **case-study-xq.html**
- [ ] **case-study-czi.html**
- [ ] **case-study-along.html**
- [ ] **case-study-mru.html**
- [ ] **case-study-ipg.html**

---

## Test Checklist Per Page

### Footer
1. Background is green (`#10B981`)
2. Padding is compact (matches homepage)
3. Links are right-aligned
4. Text is white/off-white
5. Hover: text turns pure white
6. Hover: navy underline appears from mouse entry direction
7. No extra whitespace above or below footer

### Desktop (1200px+)
- [ ] Footer matches homepage exactly

### Mobile (375px)
- [ ] Footer is compact
- [ ] Text size is readable but not oversized

---

## How to Test
1. Hard refresh each page: **Cmd + Shift + R**
2. Compare footer to homepage (exemplar)
3. Test hover states on all 3 footer links
4. Test at desktop (1200px+), tablet (768px), mobile (375px)

---

## Quick URLs (localhost:8080)
- http://localhost:8080/index.html
- http://localhost:8080/artist.html
- http://localhost:8080/designer.html
- http://localhost:8080/case-study-xq.html
- http://localhost:8080/case-study-czi.html
