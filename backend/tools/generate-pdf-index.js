/* If storing PDFs in an S3 bucket (with a cloud distribution) as created by https://github.com/tstibbs/cloud-core/blob/main/aws/utils/src/stacks/website.js then this script will sync files from a directory on local disk, generate an index page which will open pdf-sync for you, and then upload the index page to that S3 bucket */

import {strict as assert} from 'assert'

import {IndexGenerator} from '@tstibbs/cloud-core-utils/src/tools/generate-s3-index.js'

import aws from 'aws-sdk'
aws.config.region = 'eu-west-2'
aws.config.apiVersions = {
	s3: '2006-03-01',
	cloudformation: '2010-05-15'
}

const args = process.argv.slice(2)
if (args.length != 5 && args.length != 6) {
	console.error(
		'Usage: AWS_PROFILE=websiteCredentialsProfile node tools/gen-index-page.js pdfSyncCredentialsProfile localPath basePath websiteStackName pdfSyncStackName [localTestOutputFile]'
	)
	process.exit(1)
}
const [pdfSyncCredentialsProfile, localPath, basePath, websiteStackName, pdfSyncStackName] = args.slice(0, 5)
const localTestOutputFile = args.length >= 6 ? args[5] : null

function buildApi(apiKey, credentialsProfileName) {
	let options = {}
	if (credentialsProfileName != null) {
		let creds = new aws.CredentialProviderChain([new aws.SharedIniFileCredentials({profile: credentialsProfileName})])
		options = {
			credentialProvider: creds
		}
	}
	let api = new aws[apiKey](options)
	return api
}

async function getOutputs(stackName, credentialsProfileName) {
	const cloudformation = buildApi('CloudFormation', credentialsProfileName)
	let response = await cloudformation
		.describeStacks({
			StackName: stackName
		})
		.promise()
	assert.equal(response.Stacks.length, 1)
	let outputs = Object.fromEntries(response.Stacks[0].Outputs.map(output => [output.OutputKey, output.OutputValue]))
	return outputs
}

const {distributionDomainName, bucketName} = await getOutputs(websiteStackName, null)
const {endpointUrl} = await getOutputs(pdfSyncStackName, pdfSyncCredentialsProfile)

const generateFileHtml = (filePath, name) => {
	//generate url
	let parsedTemplateUrl = new URL(templateUrl)
	const baseUrl = new URL(parsedTemplateUrl.pathname, parsedTemplateUrl.href).href
	const urlParams = new URLSearchParams(parsedTemplateUrl.hash.substring(1))
	urlParams.set(urlParamForObject, `${objectPrefix}/${filePath}`)

	//generate html snippet
	return `<a target="pdfsync" href="${baseUrl}#${urlParams}">${name}</a>`
}

const indexGenerator = new IndexGenerator(localPath, bucketName, basePath, {
	fileIcon: 'fa-long-arrow-down',
	openFileGenerator: generateFileHtml
})

const templateUrl = `https://tstibbs.github.io/pdf-viewer-sync/web/#endpoint=${encodeURIComponent(endpointUrl)}`
const urlParamForObject = 'file'
const objectPrefix = `https://${distributionDomainName}`

await indexGenerator.updateIndexPage(localTestOutputFile)
