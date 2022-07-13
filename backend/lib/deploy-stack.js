import {Aws, Stack, RemovalPolicy, CfnOutput, Duration, Fn} from 'aws-cdk-lib'
import {CfnAccount} from 'aws-cdk-lib/aws-apigateway'
import {HttpLambdaIntegration} from '@aws-cdk/aws-apigatewayv2-integrations-alpha'
import {HttpApi, HttpMethod, CorsHttpMethod} from '@aws-cdk/aws-apigatewayv2-alpha'
import {Bucket, HttpMethods, BucketEncryption} from 'aws-cdk-lib/aws-s3'
import {PolicyStatement} from 'aws-cdk-lib/aws-iam'

import {applyStandardTags} from '@tstibbs/cloud-core-utils'
import {addUsageTrackingToHttpApi} from '@tstibbs/cloud-core-utils/src/stacks/usage-tracking.js'

import {buildCommsLayer} from './commsLayer.js'
import {buildGenericHandler} from './deploy-utils.js'
import {endpointGetJoinInfo, endpointGetItemUrls} from '../../ui-additions/src/constants.js'

const allowedOrigins = [
	'https://tstibbs.github.io', //where the UI actually gets deployed
	'http://localhost:8080' //for dev testing
]

class DeployStack extends Stack {
	#webSocketUrl
	#bucket
	#httpApi

	constructor(scope, id, props) {
		super(scope, id, props)

		new CfnAccount(this, 'agiGatewayAccount', {
			//use a centrally created role so that it doesn't get deleted when this stack is torn down
			cloudWatchRoleArn: Fn.importValue('AllAccountsStack-apiGatewayCloudWatchRoleArn')
		})

		this.#webSocketUrl = buildCommsLayer(this)

		this.#bucket = new Bucket(this, 'filesBucket', {
			removalPolicy: RemovalPolicy.DESTROY,
			cors: [
				{
					allowedMethods: [HttpMethods.GET, HttpMethods.PUT],
					allowedOrigins: allowedOrigins,
					allowedHeaders: ['Content-Type']
				}
			],
			encryption: BucketEncryption.S3_MANAGED,
			autoDeleteObjects: true,
			lifecycleRules: [
				{
					id: 'expire',
					expiration: Duration.days(1)
				},
				{
					id: 'cleanup',
					abortIncompleteMultipartUploadAfter: Duration.days(1)
				}
			]
		})

		this.#httpApi = new HttpApi(this, 'httpApi', {
			apiName: `${Aws.STACK_NAME}-httpApi`,
			corsPreflight: {
				allowMethods: [CorsHttpMethod.GET],
				allowOrigins: allowedOrigins
			}
		})
		addUsageTrackingToHttpApi(this.#httpApi, 'httpApiAccessLogs')

		this.buildHandler(endpointGetJoinInfo, 'get-join-info')
		this.buildHandler(endpointGetItemUrls, 'get-item-urls')
		new CfnOutput(this, 'apiUrl', {value: this.#httpApi.url})

		applyStandardTags(this)
	}

	buildHandler(name, entry) {
		let handler = buildGenericHandler(this, `${name}-handler`, entry, {
			WEB_SOCKET_URL: this.#webSocketUrl,
			BUCKET: this.#bucket.bucketName
		})
		handler.addToRolePolicy(
			new PolicyStatement({
				resources: [
					this.#bucket.arnForObjects('*') //"arn:aws:s3:::bucketname/*"
				],
				actions: ['s3:GetObject', 's3:PutObject']
			})
		)
		let integration = new HttpLambdaIntegration(`${name}-integration`, handler)
		this.#httpApi.addRoutes({
			path: `/${name}`,
			methods: [HttpMethod.GET],
			integration: integration
		})
	}
}

export {DeployStack}
