import { Construct, Duration } from '@aws-cdk/core'
import { CustomResource, CustomResourceProvider } from '@aws-cdk/aws-cloudformation'
import { SingletonFunction, Code, Runtime } from '@aws-cdk/aws-lambda'
import { PolicyStatement, Role } from '@aws-cdk/aws-iam'
import { resolve } from 'path'
import { DatasetGroup } from '../DatasetGroup'
import { Schema } from '../Schema/base'

type DatasetType = 'INTERACTIONS' | 'ITEMS' | 'USERS'
export interface IDatasetProps {
  datasetGroup: DatasetGroup
  datasetType: DatasetType
  name?: string
  schema: Schema
}

export class Dataset extends Construct {
  private static providerName = 'DatasetProvider'

  public readonly arn: string

  constructor(scope: Construct, id: string, props: IDatasetProps) {
    super(scope, id)

    const provider = new SingletonFunction(this, Dataset.providerName, {
      uuid: Dataset.providerName,
      lambdaPurpose: 'DS',
      code: Code.fromAsset(resolve(__dirname, './provider')),
      handler: 'index.handler',
      timeout: Duration.seconds(300),
      runtime: Runtime.NODEJS_10_X
    })

    const role = provider.role as Role
    role.addToPolicy(new PolicyStatement({
      actions: [
        'personalize:CreateDataset',
        'personalize:DescribeDataset',
        'personalize:DeleteDataset',
        'lambda:InvokeFunction'
      ],
      resources: ['*']
    }))

    const name = props.name || this.node.uniqueId
    const resource = new CustomResource(this, 'Dataset', {
      provider: CustomResourceProvider.lambda(provider),
      properties: {
        datasetGroupArn: props.datasetGroup.arn,
        datasetType: props.datasetType,
        name,
        schemaArn: props.schema.arn
      }
    })

    resource.node.addDependency(props.schema)
    resource.node.addDependency(props.datasetGroup)
    resource.node.addDependency(provider)
    this.arn = resource.getAtt('datasetArn').toString()
  }
}
