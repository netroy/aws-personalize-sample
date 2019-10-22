jest.mock('aws-sdk');
const AWS = require('aws-sdk');
const nock = require('nock');

const createDataset = jest.fn();
const deleteDataset = jest.fn();
AWS.Personalize.mockImplementation(() => ({ createDataset, deleteDataset }))
const invoke = (params, callback) => callback(null, { statusCode: 202 })
AWS.Lambda.mockImplementation(() => ({ invoke }))

const provider = require('..');

const region = 're-gion-1'
const accountId = '12345678'
const datasetName = 'DGName'
const datasetArn = `arn:aws:personalize:${region}:${accountId}:dataset/${datasetName}`
const LambdaARN =`arn:aws:lambda:${region}:${accountId}:function:LAMBDA_NAME`
const ResponseURL = 'https://example.com/fake_url'
const props =  {
  DatasetGroupArn: `arn:aws:personalize:${region}:${accountId}:dataset-group/DSG`,
  DatasetType: `USERS`,
  SchemaArn: `arn:aws:personalize:${region}:${accountId}:schema/SCHEMA`,
  Name: datasetName
};

const eventFactory = (type, props) => ({
  RequestType: type,
  ServiceToken: LambdaARN,
  ResponseURL,
  StackId: "arn:aws:cloudformation:re-gion-1:12345:stack/STACK/ID",
  RequestId: "4d84aae3-9fbf-4f87-907b-1299af6fea55",
  LogicalResourceId: "DatasetD6A66392",
  ResourceType: "AWS::CloudFormation::CustomResource",
  ResourceProperties: props
})

beforeEach(() => {
  nock.cleanAll();
});

test('Create', done => {
  expect(createDataset).not.toHaveBeenCalled();

  const event = eventFactory('Create', props);
  const createMock = (params, callback) => {
    expect(params.datasetGroupArn).toBe(props.DatasetGroupArn);
    expect(params.schemaArn).toBe(props.SchemaArn);
    callback(null, { datasetArn });
  };

  createDataset.mockImplementationOnce(createMock);
  const scope = nock('https://example.com').put('/fake_url').reply(200);

  provider.handler(event, {
    invokedFunctionArn: LambdaARN,
    done: () => {
      expect(createDataset).toHaveBeenCalledTimes(1);
      scope.isDone();
      done();
    }
  });
});

test('Delete', done => {
  expect(deleteDataset).not.toHaveBeenCalled();

  const event = eventFactory('Delete', props);
  event.PhysicalResourceId = datasetArn;

  const deleteMock = (params, callback) => {
    expect(params.datasetArn).toBe(datasetArn);
    callback(null);
  };

  deleteDataset.mockImplementationOnce(deleteMock);
  const scope = nock('https://example.com').put('/fake_url').reply(200, {});

  provider.handler(event, {
    invokedFunctionArn: LambdaARN,
    done: () => {
      expect(deleteDataset).toHaveBeenCalledTimes(1);
      scope.isDone();
      done();
    }
  });
})
