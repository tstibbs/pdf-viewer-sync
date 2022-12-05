import {randomUUID} from 'crypto'

import {putConnection} from '../persistance.js'
import {updateClientsCounter} from './client-count.js'

export async function handler(event) {
	const {connectionId} = event.requestContext
	let joinToken = event.queryStringParameters?.joinToken
	console.log({joinToken})
	let poolId
	if (joinToken == null) {
		//new connection from first client
		poolId = randomUUID()
	} else {
		// else new connection from subsequent client trying to join
		poolId = joinToken
	}

	try {
		await putConnection(connectionId, poolId)
	} catch (err) {
		console.error(err)
		return {statusCode: 500, body: 'Failed to connect: ' + JSON.stringify(err)}
	}

	try {
		await updateClientsCounter(event, false)
	} catch (err) {
		console.error(err)
		return {statusCode: 500, body: 'Failed to update other clients: ' + JSON.stringify(err)}
	}

	return {statusCode: 200, body: 'Connected.'}
}
