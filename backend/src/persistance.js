import {TABLE_NAME, aws} from './utils.js'
import {TABLE_SCHEMA} from './constants.js'

export const dydbClient = new aws.DynamoDB.DocumentClient()

export async function deleteConnection(connectionId) {
	const params = {
		TableName: TABLE_NAME,
		Key: {
			[TABLE_SCHEMA.pk]: connectionId
		}
	}
	await dydbClient.delete(params).promise()
}

export async function putConnection(connectionId, poolId) {
	const params = {
		TableName: TABLE_NAME,
		Item: {
			[TABLE_SCHEMA.pk]: connectionId,
			[TABLE_SCHEMA.attributes.poolId]: poolId
		}
	}
	await dydbClient.put(params).promise()
}

export async function getPoolId(connectionId) {
	const params = {
		TableName: TABLE_NAME,
		Key: {
			[TABLE_SCHEMA.pk]: connectionId
		},
		ProjectionExpression: TABLE_SCHEMA.attributes.poolId
	}
	let connectionData = await dydbClient.get(params).promise()
	return connectionData.Item[TABLE_SCHEMA.attributes.poolId]
}

export async function getConnectionIdsInPool(poolId) {
	const lookUpPoolParams = {
		TableName: TABLE_NAME,
		IndexName: TABLE_SCHEMA.indexes.poolId,
		KeyConditionExpression: `${TABLE_SCHEMA.attributes.poolId} = :poolId`,
		ExpressionAttributeValues: {
			':poolId': poolId
		},
		ProjectionExpression: TABLE_SCHEMA.pk
	}
	let connectionData = await dydbClient.query(lookUpPoolParams).promise()
	return connectionData.Items.map(attrs => attrs[TABLE_SCHEMA.pk])
}
