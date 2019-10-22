import { Code } from '@aws-cdk/aws-lambda';
import { Construct } from '@aws-cdk/core';
import { resolve } from 'path';

import { CustomLambdaResource } from './custom-lambda-resource';
import { DatasetGroup } from './dataset-group';
import { Schema } from './schema';

type DatasetType = 'INTERACTIONS' | 'ITEMS' | 'USERS';
export interface IDatasetProps {
  datasetGroup: DatasetGroup;
  datasetType: DatasetType;
  name?: string;
  schema: Schema;
}

export class Dataset extends Construct {
  public readonly arn: string;

  constructor(scope: Construct, id: string, props: IDatasetProps) {
    super(scope, id);

    const name = props.name || this.node.uniqueId;
    const code = Code.fromAsset(resolve(__dirname, '..', 'lambda-packages', 'aws-personalize-dataset'));
    const resource = new CustomLambdaResource(this, 'Provider', {
      name: 'Dataset',
      code,
      permissions: [
        'personalize:CreateDataset',
        'personalize:DescribeDataset',
        'personalize:DeleteDataset',
      ],
      properties: {
        datasetGroupArn: props.datasetGroup.arn,
        datasetType: props.datasetType,
        schemaArn: props.schema.arn,
        name,
      },
      dependsOn: [
        props.schema,
        props.datasetGroup,
      ]
    });

    this.arn = resource.getAtt('datasetArn').toString();
  }
}
