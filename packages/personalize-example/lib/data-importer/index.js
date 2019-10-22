const { Personalize } = require('aws-sdk');
const personalize = new Personalize();

const env = process.env;
const randomName = prefix => `${prefix}-import-${Math.random().toString(36).slice(5)}`

exports.handler = async event => {
  const records = event.Records || []
  while (records.length > 0) {
    let record = records.pop();
    try {
      const filepath = record.s3.object.key;
      const datatype = filepath.toLowerCase().replace(/s?\.csv$/, '');
      await personalize.createDatasetImportJob({
        jobName: randomName(datatype),
        dataSource: {
          dataLocation: `s3://${env.bucketName}/${filepath}`
        },
        datasetArn: env[datatype + 'DatasetArn'],
        roleArn: env.roleArn
      }).promise();
    } catch (e) {
      console.log(e)
      console.log(record)
      throw e
    }
  }
};
