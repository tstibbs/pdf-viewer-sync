import CopyWebpackPlugin from 'copy-webpack-plugin'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import path from 'path'

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

export default {
	mode: 'development',
	output: {
		path: path.resolve('dist/web')
	},
	plugins: [
		new CopyWebpackPlugin({
			patterns: [
				{
					context: path.resolve('public'),
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
			template: 'public/web/viewer.html'
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
