# Summary - Newspaper Generator
This is the spec for a small web application for generating a digital image of a custom newspaper page with custom content.

The app will have a stable background and design, but allow in-place editing of the content and flexibility in the final layout.

If you find any information contained here to be ambiguous or unclear, ASK ABOUT IT INSTEAD OF INFERRING OR MAKING YOUR OWN DECISIONS.

# Features
This section lists and explains all individual features of the web app.

## The Editable Newspaper Page
The main feature is the editable newspaper page. It should be sized as an A4 page by default.

The page will have a few sections: a Header, a Footer, and a Body, each editable individually.

The background image should look like newspaper paper with fold lines in the middle. It shouldn't look too busy to preserve contrast with text.

### Header
Header is naturally at the top. It should be a bar containing, from left to right: date and time (editable text, date only prefilled as default as a hint, medium size regular font), Newspaper Name (editable text, large bold text), and location of print (editable text, same as date-time). It should be enclosed in a top and bottom bar for styling.

It should be possible to resize the header by dragging its bottom border. This should automatically change the size of the text in the header. The Newspaper Name in particular should fill all the space provided, while still leaving space for the other two text boxes.

### Body - Grid Layout
The main body of the newspaper should start as a 3x3 grid. Each cell of a grid will contain one editable element, listed below as subheadings of this section.

The grid should have much flexibility in how it is rearranged and laid out. The user should be able to:
a. Merge cells - make two neighbouring cells into one cell, acting as a single element.
b. Split cells - split a cell into two neighbouring cells, either vertically or horizontally.
c. Move / rearrange cells - drag and drop a cell to another place where it fits. E.g. in a column of three cells, one could move the top one of the three to the bottom position of the three, pushing the rest of them up. But one can't move the same cell to the neighbouring column, which is all merged into one single cell.
d. Resize columns - by dragging the border between columns of the grid, it should change the widths of the two columns on either side of that border. This wouldn't end up affecting any cells merged across the two columns
e. Resize rows - same as column resizing, but with rows.
f. Add a column - insert a new column, resizing all columns so that the new one can take 1 nth of the width (if it's a 4th column, then 1 fourth, and so on).
g. Add a row - insert a new row, same as add a column but with rows.
h. Insert element into cell - this lets the user select one of the content elements below to insert into a cell. That element decides what the cell contains and how the content is determined.
i. Remove a column - delete an entire column of cells. If a cell is merged across a row, it is internally first split into a cell matching the width of the column being deleted and the rest of the width of the larger cell, the latter retaining its content.
j. Remove a row - same as removing a column, but for rows.

Cells should automatically have borders drawn between them.

#### Eyecatcher
Big, blocky text usually meant for top of a page (but can be anywhere). Large bold capital text. Optional smaller, non-bold (but still capitals) secondary text placed right below the big eyecatcher text. If the smaller text box is empty, the big text should seamlessly fill the cell.

#### Text Editing
Much like the Eyecatcher, this element is made up of two text boxes - the heading (larger, bold text, not capitals) and a longer text field for the content. This content is the baseline text of the newspaper and should have consistent sizing. Heading is justified left, body text is justified into a block.

#### Image
This element is for displaying images linked from the local device. Underneath the image there should be a text box with smaller, italicised text, meant for describing the content of the image; justified to the centre.

There should be a toggle to make the inserted image greyscale.

Another toggle should be between how the image fits the cell. By default, scale and fill, but a toggle can be hit to crop instead.

### Footer
A footer is divided from the body of the page with a bar similar or same as the bottom one of the header (consistent styling is key). It should have three editable text boxes, one justified to the left, one to the right, and one centred. All same text styling, small text, regular font. Only the right one should have a default prefilled text saying "Page 1".

It should also be resizable by dragging the upper border (similar to the header). This should change the size of the text in the footer.

## Toolbar
At the top of the page, above the Newspaper Page, there should be a top bar with several tools, listed under their own subheadings below.

The toolbar should be sticky, but also hide itself when it isn't being hovered (and reveal when user hovers top of the page). While hidden, there should be a subtle arrow indicator hinting its presence and existence to the user There should be a pin button making it sticky and preventing it from hiding.

### Styling
The user should have an ability to change general styles of the newspaper page.
a. Fonts (individually, for body text, heading text, image descriptions, eyecatcher text, header/footer text, and newspaper name). Pick a few Google Fonts that make sense, but allow the ability to go and add more by link or name. By default, make them all the same: Caladea.
b. Body text size and heading size. Image description font size.
    *Note: no sizing for header, footer, or eyecatcher fonts, as they resize with their cells.*
c. Header and footer frame style.
d. Cell border thickness and colour.

### Import/Export
An Export button should give three options: export as image (jpg, png), as pdf, or as a work file (json file). 

The work json file can be saved locally and uploaded later with the Import button in order to restore work later. This file will need to keep all relevant info to restore the layout and the content that the newspaper page had at export time.

### Undo/Redo
Mapped also to Ctrl+Z and Ctrl+Y, the app should have undo and redo functionality for layout changes.

### Newspaper Name Decoration
Options to decorate the newspaper name in the header.
e.g.:
- simple vertical bars (or other cool symbols or patterns) before and after
- special shading
- 3d effect

# Example Newspaper
In the project folder, there is an image called "example-newspaper.png". This is not a source of truth and it is not a goal to emulate, but it is an example of the inspiration behind the app and shows the kind of styling we wan

# Claude's Notes
Below, you can add notes and additional clarifications regarding the content of this spec, which you feel are useful or important. Keep them below the line in this section and keep the hand-written spec intact. If we make a decision to change the spec, you can only SUGGEST changes to me.
---

## Clarifications agreed with the user (2026-11-01)
- **Tech stack:** Svelte 5 + Vite + TypeScript, static site, deployed to GitHub Pages.
- **Merging:** merged cells are always rectangles. Merging more than two at once (e.g. a whole column) is allowed if it can be done elegantly.
- **Splitting:** splitting a cell only affects that cell; it never alters the rest of the layout (no new page-wide grid lines).
- **Moving:** moving a cell pushes the others along (no swapping). Moves that would break other parts of the layout must not be possible.
- **Text overflow:** text that doesn't fit its cell shrinks to fit.
- **Fonts:** Caladea is used instead of Cambria (Cambria is not a Google Font; Caladea is metrically compatible).
- **Header/footer frame styles:** single line, double line, and two thick-and-thin variants: thick line outside or thin line outside. "Outside" is the side facing away from the header/footer text, so the header's top and bottom bars mirror each other.
- **Placeholders:** empty text boxes show a faint hint in angle brackets (e.g. `<Newspaper Name>`); hints are never exported.
- **Header text sizing:** date and location grow with the header height up to a cap, so extra height goes to the newspaper name. The name and location may wrap between words, but only when that allows a clearly larger font (≥30%); otherwise they stay on one line and shrink to fit.
- **Unsaved typing:** when the tab is hidden or closed, the text box being edited is committed and the page is saved immediately.
- **Images:** stored (embedded) in the JSON work file so work can be fully restored.
- **Background:** generated (CSS/SVG) for now; may be revisited.
- **Header date default:** today's date in the format `d. m. YYYY`, no zero-padding (e.g. `5. 3. 2026`).
- **Empty cells:** a cell with no element inserted shows nothing.
- **Eyecatcher:** text is centred.
- **Autosave:** the current work-in-progress page is cached in the browser and restored on reload.
- **Undo/Redo:** app history covers layout changes, style changes, and text edits. While a text box is focused, Ctrl+Z/Ctrl+Y are left to the browser's native text undo. When a text box loses focus, its edit is committed to the app history as a single step. The app must never rewrite a text box's content while it is focused (that would clear the native undo stack).
- **Newspaper name decoration** (built with the toolbar in stage 5): two independent settings that combine freely.
  - *Ornaments* before and after the name: none, vertical bars, double bars, stars, diamonds, fleurons (❧ … ☙), extending rules, or custom Unicode symbols entered by the user.
  - *Text effect*: none, drop shadow, 3D extrude, engraved, outline, hatched.
  - Ornaments and effects scale with the name and take part of its space. Everything uses the ink colour (no separate colour for now).
  - To confirm: custom symbols use two fields (before / after), with "after" defaulting to the same as "before".
- **Grid editing (stage 3):**
  - *Merging* content: the merged cell keeps the content of the cell the merge started from, or if that is empty, the first non-empty cell's (reading order). Merging a whole column/row is available from the cell menu. A merge always grows to the smallest rectangle that doesn't cut through other cells.
  - *Moving:* a cell moves along an unbroken run of cells in its column that all share its column span (or along its row, sharing its row span). Sizes along the direction of movement may differ; each cell keeps its own size.
  - *Adding/removing columns and rows:* via spreadsheet-style tabs on the grid edges (insert before / after, delete), so the target column/row is unambiguous with merged cells.
  - *Split cells:* the divider inside a split cell can be dragged to resize the two parts; splits can be undone with "Merge with other half" (an empty half gives its space to the other).
