# UI Issues Analyzer

A plugin/tool that scans UI elements and reports issues related to padding, spacing, color tokens, font tokens, and styling inconsistencies. Built for consistent, accessible, and clean interface diagnostics.

## Features

- Detects padding and spacing mismatches
- Flags token inconsistencies (colors, fonts)
- Highlights styling issues
- Hover-based frame highlighting
- Consistent UI layout for issue display

## Getting Started

### Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/) (v14 or newer)
- `typescript` (`npx` will handle it if not globally installed)
- `sass` for SCSS compilation

You can install Sass globally (optional):

```bash
npm install -g sass


npx tsc --watch

sass src/styles.scss public/styles.css
