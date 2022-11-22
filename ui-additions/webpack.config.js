import {resolve} from 'path'
import {readFile} from 'fs/promises'
import {fileURLToPath} from 'url'

import CopyWebpackPlugin from 'copy-webpack-plugin'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import ejs from 'ejs'

const __filename = fileURLToPath(import.meta.url)

const projectName = `pdf-viewer-sync`
const bugReportUrl = `https://github.com/tstibbs/${projectName}/issues/new`

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
		<%- include('node_modules/@tstibbs/cloud-core-ui/templates/error-display.css.ejs') %>
	</style>
	<script type="text/javascript">
		<%- include('node_modules/@tstibbs/cloud-core-ui/templates/feature-detect.js.ejs') %>
	</script>
	<script type="text/javascript">
		<%- include('node_modules/@tstibbs/cloud-core-ui/templates/error-handler.js.ejs') %>
	</script>`
	contents = contents.replace(/(<head[^>]*>)/, `$1\n${headAdditions}`)
	let bodyAdditions = `<%- include('node_modules/@tstibbs/cloud-core-ui/templates/error-display.html.ejs') %>`
	contents = contents.replace(/(<body[^>]*>)/, `$1\n${bodyAdditions}`)
	let template = ejs.render(
		contents,
		{
			projectName,
			bugReportUrl
		},
		{
			filename: __filename //assume everything is relative to the current script
		}
	)
	return template
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
		new MiniCssExtractPlugin()
	],
	module: {
		rules: [
			{
				test: /\.css$/i,
				use: [MiniCssExtractPlugin.loader, 'css-loader']
			}
		]
	}
}
