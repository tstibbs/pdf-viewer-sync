import {exec} from '@tstibbs/cloud-core-utils'

import assert from 'assert/strict'

/* Download the pdfjs release - because there isn't a module published to npm which contains all the files we need. The github release package appears to be the only option. */

let response = await exec(`pnpm ls pdfjs-dist --json`)
if (response.stderr) {
	console.error(stderr)
}
console.log(response.stdout)
let output = JSON.parse(response.stdout)
const deps = output[0].dependencies
assert.equal(Object.entries(deps).length, 1)
assert.ok('pdfjs-dist' in deps)
let version = deps['pdfjs-dist'].version
console.log(`Downloading pdfjs@${version}`)
await exec(`curl -L https://github.com/mozilla/pdf.js/releases/download/v${version}/pdfjs-${version}-dist.zip -o dist.zip && \
rm -rf public/* && \
unzip -d public dist.zip && \
rm dist.zip`)
if (response.stderr) {
	console.error(stderr)
}
