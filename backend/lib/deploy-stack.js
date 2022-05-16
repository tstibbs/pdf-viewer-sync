import {Aws, Stack, RemovalPolicy, CfnOutput} from '@aws-cdk/core'
import {HttpLambdaIntegration} from '@aws-cdk/aws-apigatewayv2-integrations'
import {HttpApi, HttpMethod} from '@aws-cdk/aws-apigatewayv2'
import {Bucket} from '@aws-cdk/aws-s3'

import {buildCommsLayer} from './commsLayer.js'
import {buildGenericHandler} from './deploy-utils.js'
import {endpointGetJoinInfo, endpointGetItemUrls} from '../../ui-additions/src/constants.js'

class DeployStack extends Stack {
	#webSocketUrl
	#bucket
	#httpApi

	constructor(scope, id, props) {
		super(scope, id, props)

		this.#webSocketUrl = buildCommsLayer(this)

		this.#bucket = new Bucket(this, 'filesBucket', {
			removalPolicy: RemovalPolicy.DESTROY,
			autoDeleteObjects: true
		})

		this.#httpApi = new HttpApi(this, 'httpApi', {
			apiName: `${Aws.STACK_NAME}-httpApi`
		})
		this.buildHandler(endpointGetJoinInfo, 'get-join-info')
		this.buildHandler(endpointGetItemUrls, 'get-item-urls')
		new CfnOutput(this, 'apiUrl', { value: this.#httpApi.url })
	}

	buildHandler(name, entry) {
		let handler = buildGenericHandler(this, `${name}-handler`, entry, {
			WEB_SOCKET_URL: this.#webSocketUrl,
			BUCKET: this.#bucket.bucketName
		})
		let integration = new HttpLambdaIntegration(`${name}-integration`, handler)
		this.#httpApi.addRoutes({
			path: `/${name}`,
			methods: [HttpMethod.GET],
			integration: integration
		})
	}
}

export { DeployStack }
