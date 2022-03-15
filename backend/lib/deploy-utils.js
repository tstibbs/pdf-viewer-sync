import cdk from '@aws-cdk/core'
import {DeployStack} from '../lib/deploy-stack.js'

export function buildStack(stackName) {
	const app = new cdk.App()
	return new DeployStack(app, stackName)
}
