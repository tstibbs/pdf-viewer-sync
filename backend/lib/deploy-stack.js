import { Stack, Duration, CfnOutput, Aws, RemovalPolicy } from '@aws-cdk/core'
import { NodejsFunction } from '@aws-cdk/aws-lambda-nodejs'
import {Runtime} from '@aws-cdk/aws-lambda'
import { Table, AttributeType } from '@aws-cdk/aws-dynamodb'
import { WebSocketApi, WebSocketStage } from '@aws-cdk/aws-apigatewayv2'
import { WebSocketLambdaIntegration } from '@aws-cdk/aws-apigatewayv2-integrations'

import { TABLE_SCHEMA } from '../src/constants.js'
import { actionSendMessage, actionGetPoolId, actionPing } from '../../ui-additions/src/constants.js'

class DeployStack extends Stack {
	constructor(scope, id, props) {
		super(scope, id, props)

		const sessionStore = new Table(this, 'sessionStore', {
			partitionKey: { name: TABLE_SCHEMA.pk, type: AttributeType.STRING },
			removalPolicy: RemovalPolicy.DESTROY
		})
		sessionStore.addGlobalSecondaryIndex({
			indexName: TABLE_SCHEMA.indexes.poolId,
			partitionKey: {
				name: TABLE_SCHEMA.attributes.poolId,
				type: AttributeType.STRING
			}
		})

		const connectHandler = this._buildHandler('connectHandler', 'src/handlers/connect.js', sessionStore)
		const disconnectHandler = this._buildHandler('disconnectHandler', 'src/handlers/disconnect.js', sessionStore)
		const messageHandler = this._buildHandler('messageHandler', 'src/handlers/message.js', sessionStore)
		const getPoolIdHandler = this._buildHandler('getPoolIdHandler', 'src/handlers/get-pool-id.js', sessionStore)
		const pingHandler = this._buildHandler('pingHandler', 'src/handlers/ping.js', sessionStore)

		const webSocketApi = new WebSocketApi(this, 'webSocketApi', {
			apiName: `${Aws.STACK_NAME}-webSocketApi`,
			connectRouteOptions: { integration: new WebSocketLambdaIntegration('ConnectIntegration', connectHandler) },
			disconnectRouteOptions: { integration: new WebSocketLambdaIntegration('DisconnectIntegration', disconnectHandler) },
		})
		webSocketApi.addRoute(actionSendMessage, {
			integration: new WebSocketLambdaIntegration('SendMessageIntegration', messageHandler)
		})
		webSocketApi.addRoute(actionGetPoolId, {
			integration: new WebSocketLambdaIntegration('getPoolIdIntegration', getPoolIdHandler)
		})
		webSocketApi.addRoute(actionPing, {
			//do nothing, just here so clients can keep the connection alive
			integration: new WebSocketLambdaIntegration('pingIntegration', pingHandler)
		})

		const webSocketStage = new WebSocketStage(this, 'webSocketStage', {
			webSocketApi,
			stageName: 'prod',
			autoDeploy: true
		})

		webSocketApi.grantManageConnections(getPoolIdHandler)
		webSocketApi.grantManageConnections(messageHandler)

		new CfnOutput(this, 'webSocketURI', { value: `${webSocketApi.apiEndpoint}/${webSocketStage.stageName}` })
	}

	_buildHandler(name, entry, sessionStore) {
		const handler = new NodejsFunction(this, name, {
			entry: entry,
			memorySize: 128,
			timeout: Duration.seconds(20),
			runtime: Runtime.NODEJS_14_X,
			environment: {
				TABLE_NAME: sessionStore.tableName
			}
		})
		sessionStore.grantReadWriteData(handler)
		return handler
	}
}

export { DeployStack }
