import assert from 'assert'

import {Aws, Stack, RemovalPolicy, CfnOutput, Duration, Fn} from 'aws-cdk-lib'
import {CfnAccount} from 'aws-cdk-lib/aws-apigateway'
import {HttpLambdaIntegration} from '@aws-cdk/aws-apigatewayv2-integrations-alpha'
import {HttpApi, HttpMethod, CorsHttpMethod} from '@aws-cdk/aws-apigatewayv2-alpha'
import {Bucket, HttpMethods, BucketEncryption} from 'aws-cdk-lib/aws-s3'
import {PolicyStatement} from 'aws-cdk-lib/aws-iam'
import {HttpOrigin} from 'aws-cdk-lib/aws-cloudfront-origins'

import {applyStandardTags} from '@tstibbs/cloud-core-utils'
import {CloudFrontResources} from '@tstibbs/cloud-core-utils/src/stacks/cloudfront.js'

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
	#bucket
	#httpApi

	constructor(scope, id, props) {
		super(scope, id, props)

		new CfnAccount(this, 'agiGatewayAccount', {
			//use a centrally created role so that it doesn't get deleted when this stack is torn down
			cloudWatchRoleArn: Fn.importValue('AllAccountsStack-apiGatewayCloudWatchRoleArn')
		})

		const webSocketStage = buildCommsLayer(this)

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

		const cloudfrontDefaultBehavior = {
			//let's keep our various APIs seperate under their own subpaths, thus let's make the default path completely invalid.
			origin: new HttpOrigin('default.not.in.use.invalid')
		}
		const cloudFrontResources = new CloudFrontResources(this, COUNTRIES_DENY_LIST, cloudfrontDefaultBehavior)
		cloudFrontResources.addHttpApi(`${requestsUrlPrefix}/*`, this.#httpApi)
		cloudFrontResources.addWebSocketApi(commsUrlPrefix, webSocketStage)

		this.#buildHandler(endpointGetJoinInfo, 'get-join-info')
		this.#buildHandler(endpointGetItemUrls, 'get-item-urls')

		new CfnOutput(this, 'endpointUrl', {value: `https://${cloudFrontResources.distribution.distributionDomainName}`})

		applyStandardTags(this)
	}

	#buildHandler(name, entry) {
		let handler = buildGenericHandler(this, `${name}-handler`, entry, {
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
			path: `/${requestsUrlPrefix}/${name}`,
			methods: [HttpMethod.GET],
			integration: integration
		})
	}
}

export {DeployStack}
