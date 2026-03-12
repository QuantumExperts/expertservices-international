# Expert Services International - Website Pages Build Report

## Project Summary
Successfully rebuilt 4 premium service pages for Expert Services International with a completely new premium design system.

## Pages Delivered

### 1. Expert Witness Services
**File:** `/tmp/esi-deploy/expert-witness.html`
**Size:** 22 KB | 336 lines
**Hero Image:** hero-expert.jpg

**Key Sections:**
- Hero section with "Quantum, Valuation & Technical Expertise"
- Introduction split section with content and image
- Expertise areas (Comprehensive Service Coverage, Practical Industry Knowledge)
- Building Projects, Infrastructure Projects, Resource Projects subsections
- Professional Standards & Protocols section
- Content split (reverse) with service areas
- Related Services grid (Quantum, Claims Analysis, Protocols)
- CTA banner

**Content Coverage:**
- Quantum, construction, technical and delay expert investigation
- Expert reports and expert witness services
- Academy of Experts and RICS trained
- Building, infrastructure and resource project experience
- Multiple protocol compliance (International, Australia, UK, US)

---

### 2. Expert Witness Protocols
**File:** `/tmp/esi-deploy/expert-witness-protocols.html`
**Size:** 23 KB | 373 lines
**Hero Image:** hero-protocols.jpg

**Key Sections:**
- Hero section with "Expert Witness Protocols"
- Introduction split with professional standards content
- International Arbitration protocols section (21 protocols)
  - CIArb, IBA, HKIAC, SIAC, ICCA, THAC, VIAC, NCAC, KLRCA, Laos, MAC, PCA, CAA, etc.
- Australia protocols section (14 protocols)
  - Federal Court, State Courts, NCAT, VCAT, QCAT, Family Law Rules
- United Kingdom protocols section (3 protocols)
  - England & Wales, Scotland, Northern Ireland
- United States protocols section (6 protocols)
  - Federal Rules, California, Florida, Illinois, Texas, New York
- Commitment section with professional excellence content
- Related Services grid (Expert Witness, Quantum, Dispute Resolution)
- CTA banner

**Protocol Grid Features:**
- 2-column layout with protocol-grid class
- Diamond bullet points (◆) using CSS pseudo-elements
- Organized by jurisdiction
- 44+ protocols listed

---

### 3. Quantum, Delay & Disruption Analysis
**File:** `/tmp/esi-deploy/quantum-delay-disruption.html`
**Size:** 22 KB | 345 lines
**Hero Image:** hero-quantum.jpg

**Key Sections:**
- Hero section with "Quantum, Delay & Disruption Analysis"
- Quantum Analysis section
  - Complex financial assessment content
  - Quantum analysis services (mediation, arbitration, adjudication, litigation)
  - Services list (cost engineering, quantity surveying, cost auditing, forensic accounting)
- Delay & Disruption Analysis section (reverse split)
  - Cause and effect analysis
  - Delay methodologies
  - Expertise areas (productivity, extensions of time, schedule analysis, forecast cost)
- Expertise section with grid (Comprehensive Coverage, Project Type Experience)
  - Building & Commercial, Infrastructure, Energy & Resources subsections
- Related Services grid (Expert Witness, Claims Analysis, Dispute Resolution)
- CTA banner

**Content Coverage:**
- Methods of identifying and analysing quantum and delay
- Cost engineering and quantity surveying expertise
- Construction cost auditing and forensic assessment
- Delay analysis methodologies and critical path review
- Schedule analysis and productivity assessment
- Project experience: building, industrial, infrastructure, oil & gas, utilities

---

### 4. Claims & Damages Analysis
**File:** `/tmp/esi-deploy/claims-analysis.html`
**Size:** 23 KB | 363 lines
**Hero Image:** hero-claims.jpg

**Key Sections:**
- Hero section with "Claims & Damages Analysis"
- Construction Claims Analysis introduction split
  - Strategic support content
  - Forensic assessment expertise
- Strategic Support Areas section (2-column grid)
  - Scope Changes, Time-Related Claims, Quality Issues, Contractual Breaches features
  - Claims Quantification Services: Cost Analysis, Prolongation Costs, Productivity Loss, Initial Estimates
- Methodology section (reverse split)
  - Thorough & Methodical Analysis content
  - Contract review and systematic analysis approach
- Early Intervention section (2-column grid)
  - Early Claim Detection Benefits
  - Claim Resolution Support (payment claims, substantiation, valuations, strategies)
- Related Services grid (Expert Witness, Quantum, Dispute Resolution)
- CTA banner

**Content Coverage:**
- Strategic support for claim quantification and resolution
- Forensic assessment and tracking
- Claims analysis across scope changes, delays, quality, breaches
- Cost quantification and prolongation assessment
- Early detection and intervention strategies
- Payment claims and schedules assistance

---

## Design System Compliance

### Typography
- **Headings:** DM Serif Display (via Google Fonts CDN)
- **Body:** Inter 400/500/600/700 weights (via Google Fonts CDN)
- **Font Loading:** `https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Inter:wght@400;500;600;700&display=swap`

### Color Palette
- **Accent/Copper:** #b07c4b (buttons, highlights, accents)
- **Charcoal:** #111827 (text, headers)
- **Slate Greys:** #0f172a, #1e293b, #334155, #475569, #64748b, #94a3b8, #cbd5e1, #e2e8f0, #f1f5f9
- **NO TEAL:** Explicitly avoided per specifications

### CSS Classes Used
✓ `.hero` `.hero--sub` - Hero sections (50vh)
✓ `.hero__overlay` - Dark gradient overlay
✓ `.section` `.section--light` - Content sections
✓ `.container` `.container--narrow` `.container--wide` - Layout widths
✓ `.content-split` `.content-split--reverse` - 2-column layouts
✓ `.grid-2` `.grid-3` - Responsive grids
✓ `.service-card` - Service cards with images
✓ `.protocol-grid` - Protocol listings (2-column)
✓ `.feature` - Feature items with titles/descriptions
✓ `.fade-up` - Scroll animations
✓ `.cta-banner` - Call-to-action sections
✓ `.btn` `.btn--primary` `.btn--outline-dark` `.btn--pill` - Button styles
✓ `.text-center` - Text alignment utility

### Navigation Structure
```
Home
About
  ├── The Consultancy
  ├── Neil Kirkpatrick
  └── Consultants
Services
  ├── Expert Witness Services
  ├── Expert Witness Protocols
  ├── Quantum, Delay & Disruption
  ├── Claims & Damages Analysis
  ├── Construction Defects
  └── Commercial Analysis
Disputes
  ├── Dispute Resolution
  ├── Expert Determination
  ├── Commercial Arbitration
  ├── Commercial Mediation
  └── Security of Payment
Contact Us (button)
```

### Header Features
- Transparent background (scroll changes to white)
- SVG logo (38x38px, copper background #b07c4b)
- Logo text: "Expert Services" (serif) / "International" (small caps)
- Mobile hamburger menu
- Dropdown navigation with styling
- Contact button with pill style

### Footer Features
- 4-column grid layout
- Brand column with logo and location tags
- Services column
- Company column
- Contact column (email, phone, address with SVG icons)
- Copyright notice
- LinkedIn social link
- Footer spacing and styling matches index.html

### JavaScript Functionality
- **Menu Toggle:** Mobile hamburger menu activation
- **Header Scroll:** Background changes on scroll (header--scrolled class)
- **Dropdown Menus:** Mobile-friendly toggle for nested navigation
- **Scroll Animations:** IntersectionObserver for fade-up animations
- **Passive Listeners:** Optimized scroll performance

---

## Content Sources

All content extracted from original website data:
- **Source:** /sessions/vigilant-compassionate-maxwell/subpages-data.json
- **Original Site:** expertservices.com.au
- **Rebranding:** "Construction Expert Services" → "Expert Services International"

### Content Sections by Page:
- **Expert Witness:** Lines 135-172 (expert-witness-services)
- **Protocols:** Lines 173-249 (expert-witness-protocols)
- **Quantum:** Lines 250-296 (quantum-delay-disruption)
- **Claims:** Lines 297-347 (claims-analysis)

---

## File Structure

```
/tmp/esi-deploy/
├── css/
│   └── style.css (complete design system)
├── images/new/
│   ├── hero-expert.jpg
│   ├── hero-protocols.jpg
│   ├── hero-quantum.jpg
│   ├── hero-claims.jpg
│   ├── section-bridge.jpg
│   └── [other images]
├── expert-witness.html (336 lines, 22 KB)
├── expert-witness-protocols.html (373 lines, 23 KB)
├── quantum-delay-disruption.html (345 lines, 22 KB)
└── claims-analysis.html (363 lines, 23 KB)
```

**Total Content:** 1,417 lines | ~90 KB

---

## Quality Assurance

### Validation Checklist
✓ HTML5 semantic structure
✓ Valid meta tags (charset, viewport, description)
✓ Google Fonts CDN properly linked
✓ CSS stylesheet linked (css/style.css)
✓ SVG logo renders correctly
✓ Navigation fully functional
✓ Hero sections 50vh height
✓ Content properly sectioned
✓ Images lazy-loaded
✓ Responsive classes applied
✓ Scroll animations configured
✓ Footer matches index.html
✓ CTA banners on all pages
✓ No broken links
✓ No teal colors present
✓ Copper accent (#b07c4b) used consistently

### Browser Compatibility
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile responsive (tablets, phones)
- CSS Grid and Flexbox support
- IntersectionObserver API support

### Performance Considerations
- Lazy loading images (loading="lazy")
- Minified JavaScript at bottom
- CSS loaded in header
- Passive scroll listeners (passive: true)
- Font loading optimized with display=swap

---

## Ready for Deployment

All pages are production-ready and can be:
1. Integrated into the existing website
2. Tested across devices and browsers
3. Optimized for SEO
4. Monitored for performance

The pages follow all specifications and design guidelines provided.

**Build Date:** March 12, 2026
**Status:** COMPLETE ✓
