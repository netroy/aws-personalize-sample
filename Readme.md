### Amazon Personalize Cloudformation support

This monorepo contains two packages
* `@aws-cdk/aws-personlize`: This implements Persolnalize constructs as Custom resources.
* `personalize-example`: A sample architecture for a wine-recommendation engine.

To deploy this stack into your AWS account, run these commands:
* `npm i -g lerna aws-cdk`
* `lerna bootstrap`
* Go to `packages/personalize-example`, & run `cdk deploy`

This will launch a Cloudformation stack that includes an entire personalize setup, with correct IAM roles.
This also deploys a data auto-importer lambda, to use which, you need to upload a user, item, or interaction csv file to the S3 bucket created in this stack.
Once the upload is finished, a DataImport job is automatically created on Personalize.
