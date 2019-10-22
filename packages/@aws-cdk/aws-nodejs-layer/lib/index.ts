import { Construct, Stack, Resource } from '@aws-cdk/core';
import { Runtime, Code, ILayerVersion, LayerVersion, LayerVersionPermission } from '@aws-cdk/aws-lambda';

import { execSync } from 'child_process';
import { tmpdir } from 'os';
import { resolve } from 'path';
import { mkdirSync, writeFileSync } from 'fs';

const getTempDirPath = (dir: string) => resolve(tmpdir(), 'nodejslayer', dir);

interface INodejsLayerProps {
  readonly dependencies: { [name: string]: string };
  readonly compatibleRuntimes: Runtime[];
}

export class NodejsLayer extends Resource implements ILayerVersion {
  public readonly layerVersionArn: string;
  public readonly compatibleRuntimes?: Runtime[];
  private layerVersion: ILayerVersion;

  constructor(scope: Construct, id: string, props: INodejsLayerProps) {
    super(scope, id);
    this.layerVersion = this.ensureLayer(props);
    this.layerVersionArn = this.layerVersion.layerVersionArn;
    this.compatibleRuntimes = this.layerVersion.compatibleRuntimes;
  }

  public addPermission(id: string, permission: LayerVersionPermission): void {
    this.layerVersion.addPermission(id, permission);
  }

  private ensureLayer(props: INodejsLayerProps) {
    const key = Object.keys(props.dependencies).sort()
      .map((name) => `${name}@${props.dependencies[name]}`)
      .join('_');
    const cacheDir = getTempDirPath(key);

    mkdirSync(`${cacheDir}/nodejs/`, { recursive: true });

    const stack = Stack.of(this);
    const existing = stack.node.tryFindChild(key);
    if (existing) {
      return existing as LayerVersion;
    }

    // TODO: this should not be called on stack-destroy
    this.prepare = () => {
      writeFileSync(`${cacheDir}/nodejs/package.json`, JSON.stringify({
        name: 'base',
        version: '1.0.0',
        dependencies: props.dependencies
      }), { encoding: 'utf8' });
      execSync('npm i --production', { cwd: `${cacheDir}/nodejs/` });
    };

    return new LayerVersion(stack, key, {
      code: Code.fromAsset(cacheDir),
      compatibleRuntimes: props.compatibleRuntimes
    });
  }
}
