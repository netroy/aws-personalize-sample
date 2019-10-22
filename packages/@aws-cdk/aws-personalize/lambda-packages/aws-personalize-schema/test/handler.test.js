jest.mock('aws-sdk');
const AWS = require('aws-sdk');
const nock = require('nock');

const createSchema = jest.fn();
const deleteSchema = jest.fn();
AWS.Personalize.mockImplementation(() => ({ createSchema, deleteSchema }));

const provider = require('..');

const region = 're-gion-1'
const accountId = '12345678'
const schemaName = 'SchemaName'
const schemaArn = `arn:aws:personalize:${region}:${accountId}:schema/${schemaName}`
const LambdaARN =`arn:aws:lambda:${region}:${accountId}:function:LAMBDA_NAME`
const ResponseURL = 'https://example.com/fake_url'
const props = {
  Name: schemaName,
  Schema: '{}'
};

const eventFactory = (type, props) => ({
  RequestType: type,
  ServiceToken: LambdaARN,
  ResponseURL,
  StackId: "arn:aws:cloudformation:re-gion-1:12345:stack/STACK/ID",
  RequestId: "4d84aae3-9fbf-4f87-907b-1299af6fea55",
  LogicalResourceId: "SchemaD6A66392",
  ResourceType: "AWS::CloudFormation::CustomResource",
  ResourceProperties: props
})

beforeEach(() => {
  nock.cleanAll();
});

test('Create', done => {
  expect(createSchema).not.toHaveBeenCalled();

  const event = eventFactory('Create', props);
  const createMock = (params, callback) => {
    expect(params.name).toBe(schemaName);
    expect(params.schema).toBe(props.Schema);
    callback(null, { schemaArn });
  };

  createSchema.mockImplementationOnce(createMock);
  const scope = nock('https://example.com').put('/fake_url').reply(200);

  provider.handler(event, {
    invokedFunctionArn: LambdaARN,
    done: () => {
      expect(createSchema).toHaveBeenCalledTimes(1);
      scope.isDone();
      done();
    }
  });
});

test('Delete', done => {
  expect(deleteSchema).not.toHaveBeenCalled();

  const event = eventFactory('Delete', props);
  event.PhysicalResourceId = schemaArn;

  const deleteMock = (params, callback) => {
    expect(params.schemaArn).toBe(schemaArn);
    callback(null);
  };

  deleteSchema.mockImplementationOnce(deleteMock);
  const scope = nock('https://example.com').put('/fake_url').reply(200);

  provider.handler(event, {
    invokedFunctionArn: LambdaARN,
    done: () => {
      expect(deleteSchema).toHaveBeenCalledTimes(1);
      scope.isDone();
      done();
    }
  });
})
