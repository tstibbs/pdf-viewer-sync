In order to keep the main 'viewer' UI as close as possible to the upstream source code (to simplify merging future changes) the majority of the extra code lives in this directory, with minimal integration into the main viewer UI.

The 'public' folder should be populated with the unpacked contents of https://github.com/mozilla/pdf.js/releases/download/v2.13.216/pdfjs-2.13.216-dist.zip or equivelent (which itself should be the result of the 'build' folder when running `gulp generic` on the pdf.js codebase).
