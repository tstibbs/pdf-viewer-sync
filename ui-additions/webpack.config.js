const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path')

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
				},
			],
		}),
		new HtmlWebpackPlugin({
			template: 'public/web/viewer.html',
		}),
	],
};
