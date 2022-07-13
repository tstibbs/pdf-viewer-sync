import {randomUUID} from 'crypto'

import {putConnection} from '../persistance.js'

export async function handler(event) {
	const {connectionId} = event.requestContext
	let joinToken = event.queryStringParameters?.joinToken
	console.log({joinToken})
	if (joinToken == null) {
		//new connection from first client
		joinToken = randomUUID()
	}
	// else new connection from subsequent client trying to join

	try {
		await putConnection(connectionId, joinToken)
	} catch (err) {
		console.error(err)
		return {statusCode: 500, body: 'Failed to connect: ' + JSON.stringify(err)}
	}
	return {statusCode: 200, body: 'Connected.'}
}
