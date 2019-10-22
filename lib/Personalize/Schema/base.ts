import { Construct, Duration } from '@aws-cdk/core'
import { CustomResource, CustomResourceProvider } from '@aws-cdk/aws-cloudformation'
import { SingletonFunction, Code, Runtime } from '@aws-cdk/aws-lambda'
import { PolicyStatement, Role } from '@aws-cdk/aws-iam'
import { resolve } from 'path'

import { IAvroFields, AvroSchema } from './avro'

export class Schema extends Construct {
  private static providerName = 'SchemaProvider'

  public readonly arn: string

  constructor(scope: Construct, id: string, baseSchema: AvroSchema, fields: IAvroFields[]) {
    super(scope, id)

    const provider = new SingletonFunction(this, Schema.providerName, {
      uuid: Schema.providerName,
      lambdaPurpose: 'S',
      code: Code.fromAsset(resolve(__dirname, './provider')),
      handler: 'index.handler',
      timeout: Duration.seconds(300),
      runtime: Runtime.NODEJS_10_X
    })

    const role = provider.role as Role
    role.addToPolicy(new PolicyStatement({
      actions: [
        'personalize:CreateSchema',
        'personalize:DescribeSchema',
        'personalize:DeleteSchema'
      ],
      resources: ['*']
    }))

    const name = this.node.uniqueId
    // TODO: validate that there are enough meta-fields
    const schema = baseSchema.extend(fields).toJSON()
    const resource = new CustomResource(this, 'Schema', {
      provider: CustomResourceProvider.lambda(provider),
      properties: { name, schema }
    })

    resource.node.addDependency(provider)
    this.arn = resource.getAtt('schemaArn').toString()
  }
}
