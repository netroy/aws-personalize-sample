import { expect, haveResource } from '@aws-cdk/assert'
import { App } from '@aws-cdk/core'
import { AppStack } from '../lib/stack'

test('App Stack', () => {
  const app = new App()
  const stack = new AppStack(app, 'TestStack')

  expect(stack).to(haveResource('AWS::S3::Bucket', {
    BucketEncryption: {
      ServerSideEncryptionConfiguration: [
        {
          ServerSideEncryptionByDefault: {
            SSEAlgorithm: 'aws:kms'
          }
        }
      ]
    },
    VersioningConfiguration: {
      Status: 'Enabled'
    }
  }))
})
