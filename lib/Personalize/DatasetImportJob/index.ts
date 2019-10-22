import { Construct, Duration } from '@aws-cdk/core'
import { Bucket } from '@aws-cdk/aws-s3'
import { CustomResource, CustomResourceProvider } from '@aws-cdk/aws-cloudformation'
import { SingletonFunction, Code, Runtime } from '@aws-cdk/aws-lambda'
import { PolicyStatement, Role } from '@aws-cdk/aws-iam'
import { resolve } from 'path'
import { Dataset } from '../Dataset'

export interface IDatasetImportProps {
  name?: string
  dataset: Dataset
  bucket: Bucket
  role: Role
}

export class DatasetImportJob extends Construct {
  private static providerName = 'DatasetImportJobProvider'

  public readonly arn: string

  constructor(scope: Construct, id: string, props: IDatasetImportProps) {
    super(scope, id)

    const provider = new SingletonFunction(this, DatasetImportJob.providerName, {
      uuid: DatasetImportJob.providerName,
      lambdaPurpose: 'DIJ',
      code: Code.fromAsset(resolve(__dirname, './provider')),
      handler: 'index.handler',
      timeout: Duration.seconds(300),
      runtime: Runtime.NODEJS_10_X
    })

    const role = provider.role as Role
    role.addToPolicy(new PolicyStatement({
      actions: [
        'personalize:CreateDatasetImportJob',
        'personalize:DescribeDatasetImportJob'
      ],
      resources: ['*']
    }))

    const name = props.name || this.node.uniqueId
    const resource = new CustomResource(this, 'Dataset', {
      provider: CustomResourceProvider.lambda(provider),
      properties: {
        jobName: name,
        dataSource: {
          dataLocation: props.bucket.bucketArn
        },
        datasetArn: props.dataset.arn,
        roleArn: props.role.roleArn
      }
    })

    resource.node.addDependency(props.bucket)
    resource.node.addDependency(props.dataset)
    resource.node.addDependency(provider)
    this.arn = resource.getAtt('datasetImportJobArn').toString()
  }
}
