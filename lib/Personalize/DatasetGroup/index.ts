import { Construct, Duration } from '@aws-cdk/core'
import { CustomResource, CustomResourceProvider } from '@aws-cdk/aws-cloudformation'
import { SingletonFunction, Code, Runtime } from '@aws-cdk/aws-lambda'
import { PolicyStatement, Role } from '@aws-cdk/aws-iam'
import { resolve } from 'path'

export interface IDatasetGroupProps {
  name?: string
}

export class DatasetGroup extends Construct {
  private static providerName = 'DatasetGroupProvider'

  public readonly arn: string

  constructor(scope: Construct, id: string, props: IDatasetGroupProps = {}) {
    super(scope, id)

    const provider = new SingletonFunction(this, DatasetGroup.providerName, {
      uuid: DatasetGroup.providerName,
      lambdaPurpose: 'DSG',
      code: Code.fromAsset(resolve(__dirname, './provider')),
      handler: 'index.handler',
      timeout: Duration.seconds(300),
      runtime: Runtime.NODEJS_10_X
    })

    const role = provider.role as Role
    role.addToPolicy(new PolicyStatement({
      actions: [
        'personalize:CreateDatasetGroup',
        'personalize:DescribeDatasetGroup',
        'personalize:DeleteDatasetGroup',
        'lambda:InvokeFunction'
      ],
      resources: ['*']
    }))

    const name = props.name || this.node.uniqueId
    const resource = new CustomResource(this, 'DatasetGroup', {
      provider: CustomResourceProvider.lambda(provider),
      properties: { name }
    })

    resource.node.addDependency(provider)
    this.arn = resource.getAtt('datasetGroupArn').toString()
  }
}
