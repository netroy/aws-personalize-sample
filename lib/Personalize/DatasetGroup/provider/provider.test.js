jest.mock('aws-sdk');
const AWS = require('aws-sdk');
const nock = require('nock');

const createDatasetGroup = jest.fn();
const deleteDatasetGroup = jest.fn();
AWS.Personalize.mockImplementation(() => ({ createDatasetGroup, deleteDatasetGroup }))
const invoke = (params, callback) => callback(null, { statusCode: 202 })
AWS.Lambda.mockImplementation(() => ({ invoke }))

const provider = require('.');

const region = 're-gion-1'
const accountId = '12345678'
const datasetGroupName = 'DSGName'
const datasetGroupArn = `arn:aws:personalize:${region}:${accountId}:dataset-group/${datasetGroupName}`
const LambdaARN =`arn:aws:lambda:${region}:${accountId}:function:LAMBDA_NAME`
const ResponseURL = 'https://example.com/fake_url'
const props = { Name: datasetGroupName };

const eventFactory = (type, props) => ({
  RequestType: type,
  ServiceToken: LambdaARN,
  ResponseURL,
  StackId: "arn:aws:cloudformation:re-gion-1:12345:stack/STACK/ID",
  RequestId: "4d84aae3-9fbf-4f87-907b-1299af6fea55",
  LogicalResourceId: "DatasetGroupD6A66392",
  ResourceType: "AWS::CloudFormation::CustomResource",
  ResourceProperties: props
})

beforeEach(() => {
  nock.cleanAll();
});

test('Create', done => {
  expect(createDatasetGroup).not.toHaveBeenCalled();

  const event = eventFactory('Create', props);
  const createMock = (params, callback) => {
    expect(params.name).toBe(datasetGroupName);
    callback(null, { datasetGroupArn });
  };

  createDatasetGroup.mockImplementationOnce(createMock);
  const scope = nock('https://example.com').put('/fake_url').reply(200);

  provider.handler(event, {
    invokedFunctionArn: LambdaARN,
    done: () => {
      expect(createDatasetGroup).toHaveBeenCalledTimes(1);
      scope.isDone();
      done();
    }
  });
});

test('Delete', done => {
  expect(deleteDatasetGroup).not.toHaveBeenCalled();

  const event = eventFactory('Delete', props);
  event.PhysicalResourceId = datasetGroupArn;

  const deleteMock = (params, callback) => {
    expect(params.datasetGroupArn).toBe(datasetGroupArn);
    callback(null);
  };

  deleteDatasetGroup.mockImplementationOnce(deleteMock);
  const scope = nock('https://example.com').put('/fake_url').reply(200);

  provider.handler(event, {
    invokedFunctionArn: LambdaARN,
    done: () => {
      expect(deleteDatasetGroup).toHaveBeenCalledTimes(1);
      scope.isDone();
      done();
    }
  });
})
