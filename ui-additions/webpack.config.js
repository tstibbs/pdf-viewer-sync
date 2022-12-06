import {fileURLToPath} from 'url'
import {resolve} from 'path'
import {readFile} from 'fs/promises'

import CopyWebpackPlugin from 'copy-webpack-plugin'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import {LicenseWebpackPlugin} from 'license-webpack-plugin'

import {renderTemplateContents} from '@tstibbs/cloud-core-ui/build/templates.js'
import {defaultLicenseWebpackPluginConfig} from '@tstibbs/cloud-core-ui/build/licence-generation.js'

const projectName = `pdf-viewer-sync`
const bugReportUrl = `https://github.com/tstibbs/${projectName}/issues/new`

const mitLicenceText = await readFile('./build/third-party-licences/MIT-License.txt')
const licenseTextOverrides = {
	'encode-utf8': mitLicenceText,
	toastr: mitLicenceText
}

const additionalModulesToLicence = [
	{
		//we install this module just for the licencing info - it doesn't contain all the files we need so we get them via build/download-deps.js
		name: 'pdfjs-dist',
		directory: './node_modules/pdfjs-dist'
	}
]

//the viewer doesn't by default allow cross-origin pdf loads - this change undoes that restriction
const hostedOriginReplacer = (content, absoluteFrom) => {
	const from = /if \(HOSTED_VIEWER_ORIGINS\.includes\(viewerOrigin\)\) \{/i
	const to = 'if (true /*HOSTED_VIEWER_ORIGINS.includes(viewerOrigin)*/ /* we want to allow pdfs from anywhere */) {'
	if (absoluteFrom.endsWith('web/viewer.js') || absoluteFrom.endsWith('web/viewer.js.map')) {
		return content.toString().replace(from, to)
	} else {
		return content
	}
}

async function renderTemplate() {
	let contents = (await readFile('public/web/viewer.html')).toString()
	let headAdditions = `
	<style>
		<%- include('./node_modules/@tstibbs/cloud-core-ui/templates/error-display.css.ejs') %>
	</style>
	<script type="text/javascript">
		<%- include('./node_modules/@tstibbs/cloud-core-ui/templates/feature-detect.js.ejs') %>
	</script>
	<script type="text/javascript">
		<%- include('./node_modules/@tstibbs/cloud-core-ui/templates/error-handler.js.ejs') %>
	</script>`
	contents = contents.replace(/(<head[^>]*>)/, `$1\n${headAdditions}`)
	let bodyAdditions = `<%- include('./node_modules/@tstibbs/cloud-core-ui/templates/error-display.html.ejs') %>`
	contents = contents.replace(/(<body[^>]*>)/, `$1\n${bodyAdditions}`)
	return renderTemplateContents(
		contents,
		{
			projectName,
			bugReportUrl,
			writeFeatureErrorsToDom: true,
			logsEntriesIndicateErrors: false // i.e. don't show the error handler by default because there are likely to be non-error logs
		},
		fileURLToPath(import.meta.url)
	)
}

export default {
	mode: 'development',
	output: {
		path: resolve('dist/web')
	},
	plugins: [
		new CopyWebpackPlugin({
			patterns: [
				{
					context: resolve('public'),
					from: '**/*',
					to: '..',
					globOptions: {
						ignore: ['**/viewer.html']
					},
					transform: {
						transformer: hostedOriginReplacer
					}
				}
			]
		}),
		new HtmlWebpackPlugin({
			templateContent: await renderTemplate()
		}),
		new MiniCssExtractPlugin(),
		new LicenseWebpackPlugin({
			...defaultLicenseWebpackPluginConfig,
			licenseTextOverrides: licenseTextOverrides, //not so much overrides - just using this to specify licences that are missing in the node module itself
			additionalModules: additionalModulesToLicence
		})
	],
	module: {
		rules: [
			{
				test: /\.css$/i,
				use: [MiniCssExtractPlugin.loader, 'css-loader']
			},
			{
				test: /\.svg/,
				type: 'asset/resource'
			}
		]
	}
}
