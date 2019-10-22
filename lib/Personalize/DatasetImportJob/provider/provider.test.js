const nock = require('nock')
const Personalize = jest.fn();
const createDatasetImportJob = jest.fn();
Personalize.prototype.createDatasetImportJob = createDatasetImportJob;
jest.mock('aws-sdk', () => ({ Personalize }));

const provider = require('.');

const region = 're-gion-1'
const accountId = '12345678'
const datasetImportJobName = 'DIJName'
const datasetImportJobArn = `arn:aws:personalize:${region}:${accountId}:dataset-import-job/${datasetImportJobName}`
const dataLocation = 's3://my-random-bucket'
const DatasetArn = `arn:aws:personalize:${region}:${accountId}:dataset:DATASET`
const RoleArn = `arn:aws:iam:${region}:${accountId}:role:ROLE`
const LambdaARN =`arn:aws:lambda:${region}:${accountId}:function:LAMBDA_NAME`
const ResponseURL = 'https://example.com/fake_url'

const props = {
  DataSource: {
    dataLocation
  },
  JobName: datasetImportJobName,
  DatasetArn,
  RoleArn
};

const eventFactory = (type, props) => ({
  RequestType: type,
  ServiceToken: LambdaARN,
  ResponseURL,
  StackId: "arn:aws:cloudformation:re-gion-1:12345:stack/STACK/ID",
  RequestId: "4d84aae3-9fbf-4f87-907b-1299af6fea55",
  LogicalResourceId: "DatasetImportJobD6A66392",
  ResourceType: "AWS::CloudFormation::CustomResource",
  ResourceProperties: props
})

beforeEach(() => {
  nock.cleanAll();
});

test('Create', done => {
  expect(createDatasetImportJob).not.toHaveBeenCalled();

  const event = eventFactory('Create', props);
  const createMock = (params, callback) => {
    expect(params.jobName).toBe(datasetImportJobName);
    expect(params.dataSource.dataLocation).toBe(dataLocation);
    expect(params.datasetArn).toBe(DatasetArn);
    expect(params.roleArn).toBe(RoleArn);
    callback(null, { datasetImportJobArn });
  };

  createDatasetImportJob.mockImplementationOnce(createMock);
  const scope = nock('https://example.com').put('/fake_url').reply(200);

  provider.handler(event, {
    invokedFunctionArn: LambdaARN,
    done: () => {
      expect(createDatasetImportJob).toHaveBeenCalledTimes(1);
      scope.isDone();
      done();
    }
  });
});
