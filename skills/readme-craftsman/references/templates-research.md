# README Templates: Data & Research Projects

Use this file for dataset repositories and academic research repos. These READMEs should optimize for provenance, reproducibility, and citation rather than marketing language.

## Dataset

Use when the repo primarily distributes structured data, benchmark assets, or data dictionaries.

Recommended order:
- Title, one-line description, and optional license/DOI badges
- Description of what the data contains and where it came from
- File inventory with formats, sizes, and split descriptions
- Schema or column overview
- Quick-start loading examples for the main consumer languages
- Data collection or processing notes
- Known limitations, citation, related work, and license/data-license links
- Dataset version notes only when readers need inline release context

Must not miss:
- Provenance and collection period
- At least one practical loading example
- Explicit limitations or bias notes when known

Micro skeleton:

```markdown
# Dataset Name
## Description
## Data Files
## Schema
## Quick Start
## Data Collection
## Known Limitations
## Citation
## License
```

## Academic Research

Use when the repo accompanies a paper, reproducibility package, or experiment release.

Recommended order:
- Title, paper link, and optional paper/license badges
- Abstract or short research summary
- Key results or headline findings
- Reproducing the results: prerequisites, setup, train/eval commands
- Notebook or artifact map if notebooks are part of the workflow
- Repository structure when orientation matters
- Citation, acknowledgments, and license link

Must not miss:
- Exact paper reference near the top
- Hardware/runtime requirements when they materially affect reproduction
- Commands that match the current repository layout

Micro skeleton:

```markdown
# Paper Short Title
## Abstract
## Key Results
## Reproducing the Results
## Notebooks
## Repository Structure
## Citation
## License
```
