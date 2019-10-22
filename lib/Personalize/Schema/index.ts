import { Construct } from '@aws-cdk/core'
import { Schema } from './base'
import { AvroSchema, IAvroFields } from './avro'

const BaseUsersSchema = new AvroSchema('Users', [{
  name: 'USER_ID',
  type: 'string'
}])

export class UsersSchema extends Schema {
  constructor(scope: Construct, id: string, fields: IAvroFields[]) {
    super(scope, id, BaseUsersSchema, fields)
  }
}

const BaseItemsSchema = new AvroSchema('Items', [{
  name: 'ITEM_ID',
  type: 'string'
}])

export class ItemsSchema extends Schema {
  constructor(scope: Construct, id: string, fields: IAvroFields[]) {
    super(scope, id, BaseItemsSchema, fields)
  }
}

const BaseInteractionsSchema = new AvroSchema('Interactions', [{
  name: 'USER_ID',
  type: 'string'
}, {
  name: 'ITEM_ID',
  type: 'string'
}, {
  name: 'TIMESTAMP',
  type: 'long'
}])

export class InteractionsSchema extends Schema {
  constructor(scope: Construct, id: string, fields?: IAvroFields[]) {
    super(scope, id, BaseInteractionsSchema, fields || [])
  }
}
