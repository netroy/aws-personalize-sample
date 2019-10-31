import { Bucket, EventType as S3EventType } from '@aws-cdk/aws-s3';
import { Construct, Stack, StackProps, RemovalPolicy } from '@aws-cdk/core';
import { PolicyStatement, ServicePrincipal, Role, ManagedPolicy } from '@aws-cdk/aws-iam';
import { Function, Runtime, Code } from '@aws-cdk/aws-lambda';
import { S3EventSource } from '@aws-cdk/aws-lambda-event-sources';
// import { Key } from '@aws-cdk/aws-kms';
import { Dataset, DatasetGroup, InteractionsSchema, ItemsSchema, UsersSchema } from '@aws-cdk/aws-personalize';
import { resolve } from 'path';

export class AppStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // const encryptionKey = new Key(this, 'EncryptionKey', {
    //   removalPolicy: RemovalPolicy.DESTROY,
    // });

    const dataBucket = new Bucket(this, 'DataBucket', {
      // versioned: true,
      // encryptionKey,
      removalPolicy: RemovalPolicy.DESTROY,
    });
    dataBucket.addToResourcePolicy(new PolicyStatement({
      principals: [
        new ServicePrincipal('personalize.amazonaws.com')
      ],
      actions: [
        's3:GetObject',
        's3:ListBucket'
      ],
      resources: [
        dataBucket.bucketArn,
        `${dataBucket.bucketArn}/*`
      ]
    }));

    const datasetGroup = new DatasetGroup(this, 'DatasetGroup');

    const userDataset = new Dataset(this, 'Users', {
      datasetGroup,
      schema: new UsersSchema(this, 'UsersSchema', [
        { name: 'AGE', type: 'int' },
        { name: 'GENDER', type: 'string' },
      ]),
      datasetType: 'USERS'
    });

    const itemDataset = new Dataset(this, 'Items', {
      datasetGroup,
      schema: new ItemsSchema(this, 'ItemsSchema', [
        { name: 'REGULAR_PRICE', type: 'float' },
        { name: 'WINE_ALCOHOL_CONCENTRATION', type: 'int'},
        { name: 'WINE_QUALITY', type: 'int' },
        { name: 'WINE_YEAR', type: 'int' },
        { name: 'CUSTOMER_RATING', type: 'float'}
      ]),
      datasetType: 'ITEMS'
    });

    const interactionDataset = new Dataset(this, 'Interactions', {
      datasetGroup,
      schema: new InteractionsSchema(this, 'InteractionsSchema', [
        { name: 'EVENT_VALUE', type: 'float' }
      ]),
      datasetType: 'INTERACTIONS'
    });

    const personalizeAccessPolicy = ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonPersonalizeFullAccess');
    const DataImportJobRole = new Role(this, 'DatasetImportJobRole', {
      assumedBy: new ServicePrincipal('personalize.amazonaws.com'),
      managedPolicies: [
        personalizeAccessPolicy,
        ManagedPolicy.fromAwsManagedPolicyName('AmazonS3ReadOnlyAccess'),
      ]
    });

    // DataImportJobRole.addToPolicy(new PolicyStatement({
    //   actions: ['kms:Decrypt'],
    //   resources: [ encryptionKey.keyArn ]
    // }));

    // encryptionKey.grantEncrypt(DataImportJobRole);

    const autoImporter = new Function(this, 'DataImporter', {
      handler: 'index.handler',
      code: Code.fromAsset(resolve(__dirname, 'data-importer')),
      runtime: Runtime.NODEJS_10_X,
      events: [
        new S3EventSource(dataBucket, {
          events: [ S3EventType.OBJECT_CREATED ],
          filters: [ { suffix: '.csv' } ]
        })
      ],
      environment: {
        bucketName: dataBucket.bucketName,
        userDatasetArn: userDataset.arn,
        itemDatasetArn: itemDataset.arn,
        interactionDatasetArn: interactionDataset.arn,
        roleArn: DataImportJobRole.roleArn
      },
    });

    const autoImporterRole = autoImporter.role as Role;
    autoImporterRole.addManagedPolicy(personalizeAccessPolicy);
    autoImporterRole.addToPolicy(new PolicyStatement({
      actions: ['iam:PassRole'],
      resources: [ DataImportJobRole.roleArn ]
    }));
  }
}
