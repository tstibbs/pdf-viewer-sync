import assert from 'assert'

import {Stack, CfnOutput, Duration} from 'aws-cdk-lib'
import {HttpLambdaIntegration} from 'aws-cdk-lib/aws-apigatewayv2-integrations'
import {HttpMethod} from 'aws-cdk-lib/aws-apigatewayv2'

import {applyStandardTags} from '@tstibbs/cloud-core-utils'
import {CloudFrontResources, cloudfrontDefaultBehavior} from '@tstibbs/cloud-core-utils/src/stacks/cloudfront.js'
import {S3TempWebStorageResources} from '@tstibbs/cloud-core-utils/src/stacks/s3-temp-web-storage/lib/stack.js'

import {buildCommsLayer} from './commsLayer.js'
import {buildGenericHandler} from './deploy-utils.js'
import {
	endpointGetJoinInfo,
	endpointGetItemUrls,
	requestsUrlPrefix,
	commsUrlPrefix
} from '../../ui-additions/src/constants.js'

import {COUNTRIES_DENY_LIST} from './deploy-envs.js'
assert(COUNTRIES_DENY_LIST != null && COUNTRIES_DENY_LIST.length > 0)

const allowedOrigins = [
	'https://tstibbs.github.io', //where the UI actually gets deployed
	'http://localhost:8080' //for dev testing
]

class DeployStack extends Stack {
	#httpApi

	constructor(scope, id, props) {
		super(scope, id, props)

		const webSocketStage = buildCommsLayer(this)

		const cloudFrontResources = new CloudFrontResources(
			this,
			COUNTRIES_DENY_LIST,
			cloudfrontDefaultBehavior,
			allowedOrigins
		)
		cloudFrontResources.addWebSocketApi(commsUrlPrefix, webSocketStage)

		let s3TempWebStorageResources = new S3TempWebStorageResources(
			this,
			cloudFrontResources,
			allowedOrigins,
			Duration.days(1),
			requestsUrlPrefix,
			'bucket',
			endpointGetItemUrls
		)
		this.#httpApi = s3TempWebStorageResources.httpApi

		this.#buildHandler(endpointGetJoinInfo, 'get-join-info')

		new CfnOutput(this, 'endpointUrl', {value: `https://${cloudFrontResources.distribution.distributionDomainName}`})

		applyStandardTags(this)
	}

	#buildHandler(name, entry) {
		let handler = buildGenericHandler(this, `${name}-handler`, entry, {})
		let integration = new HttpLambdaIntegration(`${name}-integration`, handler)
		this.#httpApi.addRoutes({
			path: `/${requestsUrlPrefix}/${name}`,
			methods: [HttpMethod.GET],
			integration: integration
		})
	}
}

export {DeployStack}
