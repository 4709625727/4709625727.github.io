# Logo provenance

Employer wordmarks used in the `record` section. Both were sourced from Wikimedia
Commons, where they are held to fall below the threshold of originality and are
therefore **not subject to copyright** (`PD-textlogo`). They remain registered
trademarks of their respective owners and are used here nominatively — to identify
where the site's owner actually worked — which is what trademark law permits.

| File | Source | Licence | Trademark of |
|---|---|---|---|
| `cgi.svg` | [File:CGI logo.svg](https://commons.wikimedia.org/wiki/File:CGI_logo.svg) | Public domain (PD-textlogo) | CGI Inc. |
| `lumen.svg` | [File:Lumen Technologies logo.svg](https://commons.wikimedia.org/wiki/File:Lumen_Technologies_logo.svg) | Public domain (PD-textlogo) | Lumen Technologies, Inc. |

Both files were processed: editor metadata stripped, and every fill rewritten to
`currentColor` so the marks inherit the page's text colour. They are therefore
**reproduced in a single colour**, which standard brand guidelines permit and
which keeps them inside this page's palette — colour here denotes a pipeline
layer, so a brand red would carry a false meaning.

## Kennesaw State University

No freely licensed *academic* mark exists. The university seal on Wikipedia is
tagged fair-use, which should not be redistributed from this repository, and the
only public-domain file on Commons is the **athletics** logo — the wrong register
for a master's degree. That entry therefore renders a typographic monogram
instead. To change this, obtain an official academic wordmark, save it here, and
set `logo` on the education entry in `data/experience.json`.

## Replacing or removing a mark

Set `logo` to `""` on any entry in `data/experience.json` and it falls back to the
monogram from `initials`. No trademark is ever generated or imitated.
