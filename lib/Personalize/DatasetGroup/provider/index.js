const { Personalize, Lambda } = require('aws-sdk');
const CfnLambda = require('cfn-lambda');

const Schema = require('./schema.json');
const lambda = new Lambda();
const personalize = new Personalize({
  region: process.env.AWS_REGION
});

const Create = CfnLambda.SDKAlias({
  api: personalize,
  method: 'createDatasetGroup',
  returnPhysicalId: 'datasetGroupArn',
  returnAttrs: ['datasetGroupArn'],
  downcase: true
});

const Delete = CfnLambda.SDKAlias({
  api: personalize,
  ignoreErrorCodes: [404],
  method: 'deleteDatasetGroup',
  physicalIdAs: 'datasetGroupArn',
  keys: ['datasetGroupArn']
});

const CheckCreate = (createReponse, params, reply, notDone) => {
  const datasetGroupArn = createReponse.PhysicalResourceId;
  personalize.describeDatasetGroup({ datasetGroupArn }, (err, data) => {
    if (err) {
      return reply(err.message)
    }
    switch (data.datasetGroup.status) {
      case 'CREATE FAILED':
        return reply('CREATE FAILED');
      case 'ACTIVE':
        return reply(null, datasetGroupArn, { datasetGroupArn })
      default:
        notDone()
    }
  });
};

const CheckDelete = (deleteResponse, datasetGroupArn, params, reply, notDone) => {
  personalize.describeDatasetGroup({ datasetGroupArn }, (err, data) => {
    if (err && (err.statusCode === 404 || err.statusCode === 409)) {
      return reply(null, physicalId);
    }
    if (err) {
      return reply(err.message);
    }
    if (data.datasetGroup.status === 'DELETE PENDING') {
      return notDone();
    }
    reply(null, datasetGroupArn);
  });
};

exports.handler = CfnLambda({
  Create,
  Delete,
  LongRunning: {
    PingInSeconds: 5,
    MaxPings: 30,
    LambdaApi: lambda,
    Methods: {
      Create: CheckCreate,
      Delete: CheckDelete
    }
  },
  Schema
});
