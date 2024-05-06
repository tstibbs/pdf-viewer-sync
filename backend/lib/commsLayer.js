import {Aws, RemovalPolicy} from 'aws-cdk-lib'
import {Table, AttributeType} from 'aws-cdk-lib/aws-dynamodb'
import {WebSocketApi, WebSocketStage} from 'aws-cdk-lib/aws-apigatewayv2'
import {WebSocketLambdaIntegration} from 'aws-cdk-lib/aws-apigatewayv2-integrations'

import {buildGenericHandler} from './deploy-utils.js'
import {TABLE_SCHEMA} from '../src/constants.js'
import {commsUrlPrefix, actionSendMessage, actionPing} from '../../ui-additions/src/constants.js'

export function buildCommsLayer(stack) {
	const sessionStore = new Table(stack, 'sessionStore', {
		partitionKey: {name: TABLE_SCHEMA.pk, type: AttributeType.STRING},
		timeToLiveAttribute: TABLE_SCHEMA.ttl,
		removalPolicy: RemovalPolicy.DESTROY
	})
	sessionStore.addGlobalSecondaryIndex({
		indexName: TABLE_SCHEMA.indexes.poolId,
		partitionKey: {
			name: TABLE_SCHEMA.attributes.poolId,
			type: AttributeType.STRING
		}
	})

	const buildWsHandler = (name, entry) => {
		const handler = buildGenericHandler(stack, name, entry, {
			TABLE_NAME: sessionStore.tableName
		})
		sessionStore.grantReadWriteData(handler)
		return handler
	}

	const connectHandler = buildWsHandler('connectHandler', 'connect')
	const disconnectHandler = buildWsHandler('disconnectHandler', 'disconnect')
	const messageHandler = buildWsHandler('messageHandler', 'message')
	const pingHandler = buildWsHandler('pingHandler', 'ping')

	const webSocketApi = new WebSocketApi(stack, 'webSocketApi', {
		apiName: `${Aws.STACK_NAME}-webSocketApi`,
		connectRouteOptions: {integration: new WebSocketLambdaIntegration('ConnectIntegration', connectHandler)},
		disconnectRouteOptions: {integration: new WebSocketLambdaIntegration('DisconnectIntegration', disconnectHandler)}
	})
	webSocketApi.addRoute(actionSendMessage, {
		integration: new WebSocketLambdaIntegration('SendMessageIntegration', messageHandler)
	})
	webSocketApi.addRoute(actionPing, {
		//do nothing, just here so clients can keep the connection alive
		integration: new WebSocketLambdaIntegration('pingIntegration', pingHandler)
	})
	webSocketApi.grantManageConnections(messageHandler)
	webSocketApi.grantManageConnections(connectHandler)
	webSocketApi.grantManageConnections(disconnectHandler)

	const webSocketStage = new WebSocketStage(stack, 'webSocketStage', {
		webSocketApi,
		stageName: commsUrlPrefix,
		autoDeploy: true
	})

	return webSocketStage
}
