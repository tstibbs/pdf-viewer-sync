/* If storing PDFs in an S3 bucket (with a cloud distribution) as created by https://github.com/tstibbs/cloud-core/blob/main/aws/utils/src/stacks/website.js then this script will sync files from a directory on local disk, generate an index page which will open pdf-sync for you, and then upload the index page to that S3 bucket */

import {strict as assert} from 'assert'

import {IndexGenerator} from '@tstibbs/cloud-core-utils/src/tools/generate-s3-index.js'
import {defaultAwsClientConfig} from '@tstibbs/cloud-core-utils/src/tools/aws-client-config.js'

import yargs from 'yargs'
import {hideBin} from 'yargs/helpers'
import {CloudFormation} from '@aws-sdk/client-cloudformation'
import {fromIni} from '@aws-sdk/credential-providers'

const yargConfig = yargs(hideBin(process.argv))
	.command(
		'$0 <pdfSyncCredentialsProfile> <localPath> <basePath> <websiteStackName> <pdfSyncStackName>',
		'the default command',
		yargs => {
			IndexGenerator.buildYargs(yargs)
			yargs
				.positional('pdfSyncCredentialsProfile', {})
				.positional('localPath', {})
				.positional('basePath', {})
				.positional('websiteStackName', {})
				.positional('pdfSyncStackName', {})
				.option('localTestOutputFile', {
					describe: 'If specified, write the generated index to this file, instead of uploading it',
					type: 'file'
				})
		}
	)
	.help('help')
const yargv = await yargConfig.parse()

const {pdfSyncCredentialsProfile, localPath, basePath, websiteStackName, pdfSyncStackName, localTestOutputFile} = yargv

function buildApi(credentialsProfileName) {
	let options = {
		...defaultAwsClientConfig
	}
	if (credentialsProfileName != null) {
		options.credentials = fromIni({
			profile: credentialsProfileName
		})
	}
	let api = new CloudFormation(options)
	return api
}

async function getOutputs(stackName, credentialsProfileName) {
	const cloudformation = buildApi(credentialsProfileName)
	let response = await cloudformation.describeStacks({
		StackName: stackName
	})

	assert.equal(response.Stacks.length, 1)
	let outputs = Object.fromEntries(response.Stacks[0].Outputs.map(output => [output.OutputKey, output.OutputValue]))
	return outputs
}

const {distributionDomainName, bucketName} = await getOutputs(websiteStackName, null)
const {endpointUrl} = await getOutputs(pdfSyncStackName, pdfSyncCredentialsProfile)

const generateFileHtml = (filePath, name) => {
	if (!filePath.endsWith('.pdf')) {
		return undefined //don't want to create a link to pdfjs so just fall back to default download code instead
	} else {
		//generate url
		let parsedTemplateUrl = new URL(templateUrl)
		const baseUrl = new URL(parsedTemplateUrl.pathname, parsedTemplateUrl.href).href
		const urlParams = new URLSearchParams(parsedTemplateUrl.hash.substring(1))
		urlParams.set(urlParamForObject, `${objectPrefix}/${filePath}`)

		//generate html snippet
		return `<a target="pdfsync" href="${baseUrl}#${urlParams}">${name}</a>`
	}
}

const indexGenerator = new IndexGenerator(
	localPath,
	bucketName,
	basePath,
	{
		fileIcon: 'fa-long-arrow-down',
		openFileGenerator: generateFileHtml
	},
	yargv
)

const templateUrl = `https://tstibbs.github.io/pdf-viewer-sync/web/#endpoint=${encodeURIComponent(endpointUrl)}`
const urlParamForObject = 'file'
const objectPrefix = `https://${distributionDomainName}`

await indexGenerator.updateIndexPage(localTestOutputFile)
