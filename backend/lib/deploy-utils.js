import {App, Duration} from 'aws-cdk-lib'
import {NodejsFunction} from 'aws-cdk-lib/aws-lambda-nodejs'
import {Runtime} from 'aws-cdk-lib/aws-lambda'
import {loadKeys} from '@tstibbs/cloud-core-utils/src/stacks/s3-temp-web-storage/lib/stack.js'

import {DeployStack} from '../lib/deploy-stack.js'

export async function buildStack(stackName) {
	const keys = await loadKeys()
	const app = new App()
	return new DeployStack(app, stackName, {keys})
}

export function buildGenericHandler(stack, name, entry, envs) {
	const handler = new NodejsFunction(stack, name, {
		entry: `src/handlers/${entry}.js`,
		memorySize: 128,
		timeout: Duration.seconds(20),
		runtime: Runtime.NODEJS_22_X,
		environment: envs
	})
	return handler
}
