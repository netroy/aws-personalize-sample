const { Personalize } = require('aws-sdk');
const CfnLambda = require('cfn-lambda');

const Schema = require('./schema.json');
const personalize = new Personalize({
  region: process.env.AWS_REGION
});

const Create = CfnLambda.SDKAlias({
  api: personalize,
  method: 'createDatasetImportJob',
  returnPhysicalId: 'datasetImportJobArn',
  returnAttrs: ['datasetImportJobArn'],
  downcase: true
});

exports.handler = CfnLambda({
  Create,
  Schema
});
