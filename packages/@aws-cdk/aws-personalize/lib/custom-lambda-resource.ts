import { Resource, Construct, Duration, IDependable } from '@aws-cdk/core';
import { Code, Runtime, SingletonFunction } from '@aws-cdk/aws-lambda';
import { PolicyStatement } from '@aws-cdk/aws-iam';
import { CustomResource, CustomResourceProvider, Properties } from '@aws-cdk/aws-cloudformation';
import { NodejsLayer } from '@aws-cdk/aws-nodejs-layer';

interface ICustomLambdaResourceProps {
  name: string;
  code: Code;
  handler?: string;
  permissions: string [];
  properties?: Properties;
  dependsOn?: IDependable[];
}

export class CustomLambdaResource extends Resource {
  private resource: CustomResource;

  constructor(scope: Construct, id: string, props: ICustomLambdaResourceProps) {
    super(scope, id);

    const nodejsLayer = new NodejsLayer(this, 'Layer', {
      compatibleRuntimes: [ Runtime.NODEJS_10_X ],
      dependencies: { 'cfn-lambda': '4.0.0' }
    });

    const provider = new SingletonFunction(this, `${props.name}ProviderLambda`, {
      uuid: 'Provider',
      lambdaPurpose: props.name,
      code: props.code,
      handler: props.handler || 'lib/index.handler',
      timeout: Duration.seconds(300),
      runtime: Runtime.NODEJS_10_X,
      layers: [ nodejsLayer ]
    });

    provider.addToRolePolicy(new PolicyStatement({
      actions: props.permissions.concat(['lambda:InvokeFunction']),
      resources: ['*']
    }));

    this.resource = new CustomResource(this, props.name, {
      provider: CustomResourceProvider.lambda(provider),
      properties: props.properties
    });

    this.resource.node.addDependency(provider);

    const dependencies = props.dependsOn || [];
    dependencies.forEach((dependency) => {
      this.resource.node.addDependency(dependency);
    });
  }

  public getAtt(key: string) {
    return this.resource.getAtt(key);
  }
}
