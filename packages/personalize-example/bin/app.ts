#!/usr/bin/env node
import { App } from '@aws-cdk/core';
import { AppStack } from '../lib/stack';

const app = new App();
const stack = new AppStack(app, 'AppStack');
export default stack;
