export const TABLE_SCHEMA = {
	pk: 'connectionId',
	ttl: 'expirationDate',
	attributes: {
		poolId: 'poolId'
	},
	indexes: {
		poolId: 'poolId'
	}
}
