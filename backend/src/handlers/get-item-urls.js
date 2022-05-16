import {randomUUID} from 'crypto'

import {BUCKET, aws} from '../utils.js'
import {endpointFileNameParam, endpointPoolIdParam} from '../../../ui-additions/src/constants.js'
const s3 = new aws.S3()

export async function handler(event) {
	const fileName = event.queryStringParameters?.[endpointFileNameParam]
	const poolId = event.queryStringParameters?.[endpointPoolIdParam]
	let errors = []
	if (fileName == null || fileName.length == 0) {
		errors.push("parameter 'fileName' must be specified and non-empty string")
	}
	if (poolId == null || poolId.length == 0) {
		errors.push("parameter 'poolId' must be specified and non-empty string")
	}
	if (errors.length > 0) {
		return {
			"isBase64Encoded": false,
			"statusCode": 400,
			"body": errors.join('; ')
		}
	}
	const randomizer = randomUUID() //prevents object names in the bucket being predictable, and also prevents clashes by different pdfs that are named the same
	const key = `${poolId}/${fileName}-${randomizer}`
	const sign = async operation => await s3.getSignedUrlPromise(operation, {Bucket: BUCKET, Key: key})
	const getUrl = await sign('getObject')
	const putUrl = await sign('putObject')

	return {
		getUrl,
		putUrl
	}
}
