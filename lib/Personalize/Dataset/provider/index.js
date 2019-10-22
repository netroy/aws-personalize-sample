const { Personalize, Lambda } = require('aws-sdk');
const CfnLambda = require('cfn-lambda');

const Schema = require('./schema.json');
const lambda = new Lambda();
const personalize = new Personalize({
  region: process.env.AWS_REGION
});

const Create = CfnLambda.SDKAlias({
  api: personalize,
  method: 'createDataset',
  returnPhysicalId: 'datasetArn',
  returnAttrs: ['datasetArn'],
  downcase: true
});

const Delete = CfnLambda.SDKAlias({
  api: personalize,
  ignoreErrorCodes: [404],
  method: 'deleteDataset',
  physicalIdAs: 'datasetArn',
  keys: ['datasetArn']
});

const CheckCreate = (createReponse, params, reply, notDone) => {
  const datasetArn = createReponse.PhysicalResourceId;
  personalize.describeDataset({ datasetArn }, (err, data) => {
    if (err) {
      return reply(err.message)
    }
    switch (data.dataset.status) {
      case 'CREATE FAILED':
        return reply('CREATE FAILED');
      case 'ACTIVE':
        return reply(null, datasetArn, { datasetArn })
      default:
        notDone()
    }
  });
};

const CheckDelete = (deleteResponse, datasetArn, params, reply, notDone) => {
  personalize.describeDataset({ datasetArn }, (err, data) => {
    if (err && (err.statusCode === 404 || err.statusCode === 409)) {
      return reply(null, physicalId);
    }
    if (err) {
      return reply(err.message);
    }
    const status = data.dataset.status
    if (status === 'DELETE PENDING' || status === 'DELETE IN_PROGRESS') {
      return notDone();
    }
    reply(null, datasetArn);
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
