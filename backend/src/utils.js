import dotenv from 'dotenv'
import aws from 'aws-sdk'

dotenv.config()

aws.config.apiVersions = {
	dynamodb: '2012-08-10',
	apigatewaymanagementapi: '2018-11-29'
}

export {aws}

export const {TABLE_NAME} = process.env
