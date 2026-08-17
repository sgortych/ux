# Veritas Design System

Design system for **Uniwersytet SWPS** — a private Polish university. The source is a Figma file titled "SWPS-Veritas-DS" (mounted read-only for this build; original at whatever Figma link the team shares — record it here once known). The file models **Veritas**, the university's internal web application design system: a student/staff platform combining a course/learning dashboard, a calendar & scheduling tool, document/file management, messaging-adjacent notification cards, and editorial content (articles, lectures, course pages). Everything here — components, tokens, type, icons — comes from that file. Product copy is in Polish; UI is bilingual (PL/EN — see the sidebar logo language variants).

No production codebase or slide deck was attached — only the .fig file and Geomanist webfonts.

## Content fundamentals
- Language: Polish, formal register ("Ty" not used casually; instructional/administrative tone typical of a university portal: "Ten design system jest ciągle rozwijany...").
- No emoji anywhere in the source file.
- Copy is direct and functional — labels, dates, times, statuses — not marketing voice. Editorial content (articles, lectures) reads more narratively but stays plain and informative.
- Alerts/warnings are phrased as plain statements of fact ("this is still being developed"), not apologetic or exclamatory.

## Visual foundations
- **Typeface**: Geomanist (Book/Regular/Medium/Bold) is the brand typeface for virtually everything — headings, body, labels, buttons. Inter appears heavily in denser dashboard/data screens (calendars, tables) as a secondary UI font — it is NOT in the token system's font-family variables, so treat Geomanist as canonical and Inter as a legacy/secondary face for data-dense views. Menlo/mono appears rarely (code-like values). No `@font-face` files were provided for Inter — pulled from Google Fonts CDN as an exact match (not a substitution, it's the same published font).
- **Type scale**: Editorial H1 40/44 (Bold), UI Header H1 24/32 (Medium), Body default 18/24 (Book), Label 14/16 (Book), assistive text 12px. Sizes are NOT on a 4/8px grid in all cases — respect exact figures from tokens (`--font-size-*`).
- **Color**: a full 9-step ramp per hue (blue, red, gold/yellow, green, teal, burgundy, purple, orange, emerald, pink) plus a neutral gray ramp and semantic aliases (`--surface-*`, `--text-*`, `--border-*`, `--icons-*`). Blue is the primary action color; gold/red/green map to warning/error/success. Category colors (emerald/burgundy/purple/teal/orange/gold/pink) are used for calendar event types (class, diploma, duty, exam, room, saved, training).
- **Spacing**: a numeric scale token (`--scale-25` … `--scale-1000`, values 1–48px) that padding/gap/radius tokens all derive from.
- **Corner radii**: small (4px), md (6px, most cards/inputs), lg (12px), xl (16px, focus outlines).
- **Shadows**: a single soft `rgba(0,0,0,0.1)` shadow token is used sparingly (dropdowns/popovers), not on every card.
- **Cards**: light gray or white surface, 6px radius, thin `neutral-gray-100` border, no heavy drop shadow — flat and administrative, not glossy.
- **Borders vs shadow**: this system leans on borders (`--border-default`, `--border-form-default`) more than shadows to separate surfaces.
- **Backgrounds**: flat white/gray panels; no gradients, no full-bleed photography as a default motif (a couple of hero/illustration images exist for specific cards, not a system-wide pattern), no textures or grain.
- **Imagery**: sparse, functional — a bookmark illustration, a couple of hero/course images. Not a photography-driven brand.
- **Hover/press states**: hover = a darker/deeper shade of the same hue (e.g. `--surface-action-hover` is a darker blue) rather than opacity changes; several components carry explicit `Hover` variants baked into Figma rather than relying on CSS pseudo-classes alone.
- **Focus**: a dedicated `Focus outline` component — a colored ring at 3 radius variants — used consistently instead of default browser focus rings.
- **Motion**: the Figma file defines no easing/animation tokens; treat this as a largely static, administrative UI (safe default: simple opacity/color transitions, nothing bouncy).
- **Transparency/blur**: minimal — a semi-transparent black overlay token (`--surface-overlay-backdrop`) exists for modal backdrops; no frosted-glass/blur usage found.

## Iconography
- A large (124-glyph) custom icon set, single-color line icons that paint via `currentColor` (see `assets/icons/`). No icon font — every icon is an individual vector component in Figma, materialized here as `assets/icons/icon-data.js` + `Icon.jsx` wrapper (`<Icon name="IconHome" size={20} />` via the bundle's `Icon` export).
- A handful of illustrations (avatar, bookmark, calendar, search, success) sit alongside the icons — flat, single/duotone-color line illustrations, not photographic.
- No emoji, no unicode-glyph icons in the source.
- The only real bitmap brand asset is the SWPS wordmark logo (`assets/logo-swps-pl.svg`), extracted directly from the Figma sidebar-logo component. There is no separate icon/symbol mark in the file — just the wordmark.

## Components (218 built)
Grouped by directory under `components/`. Every entry below is a `<Name>.jsx`/`.d.ts` pair exported on `window.VeritasDesignSystem_ca019f.<Name>` (see `check_design_system` for the exact namespace at build time).

**buttons/** — Badge, Badge2, Breadcrumbs, Button, ButtonBordered, ButtonBorderless, CategoryPill, FocusOutline, IconAdd, IconAddGlyph, IconArrowDown, IconBook, IconChevronRight, IconClearOutline, IconExternalLink, IconStatusError, IconSuccess, IconSuccess2, Link, OrderedBadge, Pill, StatusLabel

**forms/** — ActiveIcon2, BinaryToggle, Checkbox, CheckboxOption, CheckboxOptionCompact, CheckboxOptionParagraph, CheckboxOptionSlot, FileItem2, FileUpload, FormInput, FormInput2, FormInputCard, FormSelect, IconClear2, IconClearOutline2, IconDelete2, IconDownload2, IconLanguage, IconLanguage2, IconUpload, InformationIcon, LabelValueMedium2, RadioOption, RadioOptionCompact, RadioOptionSlot, Radiobutton, Switch, Textarea, Textarea2, ToggleSwitch

**feedback/** — Alert (in data-display/), AlertCompact, AlertPanel, Callout, DarkArrow, Note, NotificationCard, ReadToggle, Tooltip

**data-display/** — Alert, CardBasic, CardGeneric, CardHeader, CardHeaderPanel, ContentCard, ContentCardSectioned, Icon24OrderAscending, IconCalendar, IconCalendarCheck, IconInfoOutline, IconSuccessOutline, IconUser, InlineList, ListItem, SeparatorDot, SeparatorHorizontal, StatusIcon, TableCell, TableHead

**navigation/** — Accordion, AccordionItem, AssetsSidebarLogo, AssetsSidebarLogo2, ChevronDown, CollapseControl, CollapsedGroup, DropdownItem, IconSearchLg, IconSidebarExpand, MenuDropdownContainer, MenuTab, MyShortcuts, NavBarButton, NavBarButtonDesktop, NavBarDesktop, NavBarInputButton, Settings01, SidebarHeader

**calendar/** — Badge3, Badge4, Button2, CalendarDay, CalendarDeadlineItem, CalendarEmptyDay, CalendarTopActionButtons, CalendarWidget, CalendarWidgetItem, CardHeader2, CursorPointer, DayCell, DayNavItem, EventBar, EventsContainer, FocusOutline2, IconAlert, IconArrowDown2, IconBook2, IconCalendar2, IconExternalLink2, IconInfoOutline2, InformationIcon2, InlineList2, Link2, SeparatorDot2, Switch2, TimelineStep, ToggleSwitch2

**overlays/** — DeadlineItem, DeadlinePopover, GroupContainer, IconClose, LectureCard, LecturePopover, LecturePopoverHeader, LinkedArticle, ModalBarIcon, ModalTitleBar, ModalWindow, PersonCard

**misc/** — ActiveContent, ActiveIcon, ArticleHeader, ArticleMeta, ArticleSubtitle, AttachedFile, AudioPlayer, Badge5, BadgedList, BinaryToggle2, BioCard, Blockquote, Button3, ClassCardHeader, ClassGradePanel, ConflictPlaceholder, ContactCard, Courses, DefaultPagination, DiscriminationTableRow, DocumentationHeader, DocumentsServicesCard, DropdownSectionHeader, EmptyState, EventCardBig, EventCardMedium, EventHeader, EventPopover, EventPopoverRegular, EventPopoverType2, FileAttachment, FileCard, FileItem, Figure, FooterButtons, FormControlButtonsPanel, FreeSlot, GalleryImageHover, HelperMessage, HeroBanner, HorizontalMenu, Icon24Info, IconAccept, IconArrowUp, IconBox, IconClear, IconClock, IconDownload, IconEllipsis, IconHome, IconLabel, IconLocationMarker, IconMobileApp, IconPlay, IconVolumeMax, IconVolumeX, IconZoomIn, IllustrationAvatar, IllustrationBookmark, IllustrationCalendar, IllustrationSearchLg, IllustrationSuccessOutline, InactiveContent, LabelValueLarge2, LabelValueSmall, MenuGroupItem, ModuleGroup, ModuleSingle, OrderedListItem, PageHeader, PauseCircle, QuestionBankAccount, SearchFiltersPanel, ServiceCard, SuccessState, TableCell2, UIPlaceholder

**assets/icons/** — `Icon` component (124 glyphs) + raw `icon-data.js`.

### Intentional additions
- `Icon` wrapper component — the Figma file has 124 individual icon components, not a single wrapper; we added one thin `<Icon name/>` React component so consumers don't need 124 separate imports.

### Coverage note
The Figma file's "Component families" inventory lists 234 named families (many are duplicate names across different pages, e.g. 3 separate "Badge" family definitions, 2 "Focus outline" definitions, etc. — de-duplicated by shape/props where identical). **218 are built.** The remaining long-tail is one-off content symbols nested deep in specific page mockups (`Interview Block`, `Label value - Row`, `Menu Header Desktop`, `Navigation bar`, `News`/`News card`/`News small`, `Newsletter box`, `Question - civil service`, `Question - study history`, and similar page-specific question/content variants) — skipped to prioritize breadth across every core primitive and pattern family first.

## Tokens
`tokens/fig-tokens.css` — 282 Figma Variables (color, spacing/radius scale, font-size, line-height) as CSS custom properties, covering both Tier 1 (core: blue/red/gold/green/teal/burgundy/purple/orange/emerald/pink ramps + neutrals) and Tier 2 (semantic aliases: surface/text/icons/border/padding/spacing) collections, plus an `old-design` theme scope. `tokens/typography.css` layers the type scale (editorial/header/body/label) on top.

## Fonts
Geomanist (Light/Book/Medium/Bold — uploaded `.ttf` files, in `assets/fonts/`) is the brand typeface. Inter is pulled from Google Fonts CDN (see Visual foundations note).

## Index
- `styles.css` — global CSS entry point (imports fonts, tokens, typography, generated asset CSS)
- `tokens/` — `fig-tokens.css`, `typography.css`
- `assets/` — `logo-swps-pl.svg` (wordmark), `fonts/`, `icons/` (124-glyph set + `Icon` component)
- `components/` — 8 groups, 197 components (see above)
- `guidelines/` — foundation specimen cards (type, colors, spacing, brand/logo/radii) shown in the Design System tab
- `thumbnail.html` — homepage tile
- `SKILL.md` — Claude Code-compatible skill wrapper for this design system
