import { Bucket, BucketEncryption } from '@aws-cdk/aws-s3'
import { Construct, Stack, StackProps } from '@aws-cdk/core'

export class AppStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)

    const dataBucket = new Bucket(this, 'DataBucket', {
      versioned: true,
      encryption: BucketEncryption.KMS_MANAGED,
    })
  }
}
