# The Antizionism Detector — GitHub Pages working build v181

Standalone static GitHub Pages repository.

This WORKING COPY starts from the preserved v176 GitHub detector and incorporates the August 10–12, 2026 Antizionist Language Coding Guide where it updates the detector criteria. The controlling attribution rule is author endorsement: mapped wording counts toward the result only when the author states, adopts, accepts, supports, condones, affirms, or otherwise presents it as their own position. Quoted, reported, rejected, descriptive, academic, historical, question-only, or attribution-unclear uses remain visible for review but do not count as the author's antizionist language.

The preserved MASTER ZIP in Google Drive is not modified by this working build.

## Upload
Extract this ZIP and upload the contents to the root of a GitHub repository. Enable GitHub Pages from the root of the main branch.

## Important static-hosting limitation
GitHub Pages cannot securely verify Stripe payments or hide browser-delivered detector logic. Trial counts and local access state can be bypassed by a technically capable user. The Stripe success page can unlock local access only after Stripe redirects back with a `session_id`; this is not server-side verification.

## v178–v179 clarification

September 1, 2026 stance clarification: mapped wording counts when the author affirmatively adopts, endorses, accepts, approves, condones, affirms, or presents the claim as correct. Quoted, reported, rejected, descriptive, academic, historical, or attribution-unclear uses do not count. Genocide accusations about Israel/Zionism follow the same rule.


## v179 GitHub/PWA web scanning
The obsolete Netlify scan endpoints have been removed. The GitHub Pages/PWA app now retrieves public URLs through a configurable web-reader endpoint (`webReaderBase` in `config.js`, currently Jina Reader) and performs same-site bounded crawling in the browser. Local PDF, DOCX, TXT, JPG, PNG, and WebP analysis remains local. Public URL/site scanning requires internet access and depends on the external reader service and the target site being retrievable. No detector thresholds, categories, or classification rules were changed in v179.


## v181 consumer-facing cleanup
Removed explanatory implementation copy from the main interface, aligned the seven result boxes and correction controls, removed public Methodology and Support pages/links, condensed the Privacy Policy, and normalized the History button. Detector rules and classification thresholds are unchanged.
