export async function handler(event) {
	console.log(`ping recieved from ${event.requestContext.connectionId}`)
	return { statusCode: 200, body: 'Finished.' }
}
