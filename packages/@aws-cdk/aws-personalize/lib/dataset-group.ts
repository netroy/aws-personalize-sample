import { Code } from '@aws-cdk/aws-lambda';
import { Construct } from '@aws-cdk/core';
import { resolve } from 'path';

import { CustomLambdaResource } from './custom-lambda-resource';

export interface IDatasetGroupProps {
  name?: string;
}

export class DatasetGroup extends Construct {
  public readonly arn: string;

  constructor(scope: Construct, id: string, props: IDatasetGroupProps = {}) {
    super(scope, id);

    const name = props.name || this.node.uniqueId;
    const code = Code.fromAsset(resolve(__dirname, '..', 'lambda-packages', 'aws-personalize-dataset-group'));
    const resource = new CustomLambdaResource(this, 'Provider', {
      name: 'DatasetGroup',
      code,
      permissions: [
        'personalize:CreateDatasetGroup',
        'personalize:DescribeDatasetGroup',
        'personalize:DeleteDatasetGroup',
      ],
      properties: { name }
    });

    this.arn = resource.getAtt('datasetGroupArn').toString();
  }
}
