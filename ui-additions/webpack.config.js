const CopyWebpackPlugin = require('copy-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const path = require('path')

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

module.exports = {
	mode: 'development',
	output: {
		path: path.resolve(__dirname, 'dist/web'),
	},
	plugins: [
		new CopyWebpackPlugin({
			patterns: [
				{
					context: path.resolve(__dirname, "public"),
					from: "**/*",
					to: "..",
					globOptions: {
						ignore: ["**/viewer.html"],
					},
					transform: {
						transformer: hostedOriginReplacer,
					},
				},
			],
		}),
		new HtmlWebpackPlugin({
			template: 'public/web/viewer.html',
		}),
		new MiniCssExtractPlugin()
	],
	module: {
		rules: [
			{
				test: /\.css$/i,
				use: [MiniCssExtractPlugin.loader, "css-loader"],
			},
		],
	},
};
