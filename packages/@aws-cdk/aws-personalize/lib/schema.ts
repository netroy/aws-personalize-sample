// tslint:disable:max-classes-per-file
import { Code } from '@aws-cdk/aws-lambda';
import { Construct } from '@aws-cdk/core';
import { resolve } from 'path';
import { CustomLambdaResource } from './custom-lambda-resource';

export interface IAvroFields {
  name: string;
  type: 'boolean' | 'int' | 'long' | 'float' | 'double' | 'string';
  categorical?: boolean;
}

type SchemaName = 'Users' | 'Items' | 'Interactions';

export class AvroSchema {
  private name: SchemaName;
  private fields: IAvroFields[];
  private type = 'record';
  private version = '1.0';

  constructor(name: SchemaName, fields: IAvroFields[]) {
    this.name = name;
    this.fields = fields;
  }

  public extend(fields: IAvroFields[]) {
    fields.forEach((f) => {
      // All custom string fields have to be categorial
      if (f.type === 'string') {
        f.categorical = true;
      }
    });
    return new AvroSchema(this.name, this.fields.slice(0).concat(fields));
  }

  public toJSON() {
    return JSON.stringify({
      type: this.type,
      name: this.name,
      namespace: 'com.amazonaws.personalize.schema',
      fields: this.fields,
      version: this.version
    });
  }
}

export class Schema extends Construct {
  public readonly arn: string;

  constructor(scope: Construct, id: string, baseSchema: AvroSchema, fields: IAvroFields[]) {
    super(scope, id);

    // TODO: validate that there are enough meta-fields
    const schema = baseSchema.extend(fields).toJSON();
    const name = this.node.uniqueId;
    const code = Code.fromAsset(resolve(__dirname, '..', 'lambda-packages', 'aws-personalize-schema'));
    const resource = new CustomLambdaResource(this, 'Provider', {
      name: 'Schema',
      code,
      permissions: [
        'personalize:CreateSchema',
        'personalize:DescribeSchema',
        'personalize:DeleteSchema'
      ],
      properties: { name, schema }
    });

    this.arn = resource.getAtt('schemaArn').toString();
  }
}

const BaseUsersSchema = new AvroSchema('Users', [{
  name: 'USER_ID',
  type: 'string'
}]);

export class UsersSchema extends Schema {
  constructor(scope: Construct, id: string, fields: IAvroFields[]) {
    super(scope, id, BaseUsersSchema, fields);
  }
}

const BaseItemsSchema = new AvroSchema('Items', [{
  name: 'ITEM_ID',
  type: 'string'
}]);

export class ItemsSchema extends Schema {
  constructor(scope: Construct, id: string, fields: IAvroFields[]) {
    super(scope, id, BaseItemsSchema, fields);
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
}, {
  name: 'EVENT_TYPE',
  type: 'string'
}]);

export class InteractionsSchema extends Schema {
  constructor(scope: Construct, id: string, fields?: IAvroFields[]) {
    super(scope, id, BaseInteractionsSchema, fields || []);
  }
}
