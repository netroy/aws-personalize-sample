const { Personalize } = require('aws-sdk');
const CfnLambda = require('cfn-lambda');

const Schema = require('./schema.json');
const personalize = new Personalize({
  region: process.env.AWS_REGION
});

const Create = CfnLambda.SDKAlias({
  api: personalize,
  method: 'createSchema',
  returnPhysicalId: 'schemaArn',
  returnAttrs: ['schemaArn'],
  downcase: true
});

const Delete = CfnLambda.SDKAlias({
  api: personalize,
  ignoreErrorCodes: [400, 404],
  method: 'deleteSchema',
  physicalIdAs: 'schemaArn',
  keys: ['schemaArn']
})

exports.handler = CfnLambda({
  Create,
  Delete,
  Schema,
  // TODO: this doesn't work currently.
  // replacement needs to destroy all dependents, because personalize resources don't have any update APIs
  // TriggersReplacement: ['Schema']
});
