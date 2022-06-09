import {App, Duration} from 'aws-cdk-lib'
import {NodejsFunction} from 'aws-cdk-lib/aws-lambda-nodejs'
import {Runtime} from 'aws-cdk-lib/aws-lambda'

import {DeployStack} from '../lib/deploy-stack.js'

export function buildStack(stackName) {
	const app = new App()
	return new DeployStack(app, stackName)
}

export function buildGenericHandler(stack, name, entry, envs) {
	const handler = new NodejsFunction(stack, name, {
		entry: `src/handlers/${entry}.js`,
		memorySize: 128,
		timeout: Duration.seconds(20),
		runtime: Runtime.NODEJS_14_X,
		environment: envs
	})
	return handler
}