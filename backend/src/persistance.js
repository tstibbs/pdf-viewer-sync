import {TABLE_NAME, aws} from './utils.js'
import {TABLE_SCHEMA} from './constants.js'

const expirationTime = 1.5 * 24 * 60 * 60 //one and a half days in seconds

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
	let nowInSeconds = Math.round( Date.now() / 1000 )
	let expirationSeconds = nowInSeconds + expirationTime
	const params = {
		TableName: TABLE_NAME,
		Item: {
			[TABLE_SCHEMA.pk]: connectionId,
			[TABLE_SCHEMA.attributes.poolId]: poolId,
			[TABLE_SCHEMA.ttl]: expirationSeconds //must be a number
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
