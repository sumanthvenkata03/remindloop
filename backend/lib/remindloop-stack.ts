import 'dotenv/config';
import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as iam from 'aws-cdk-lib/aws-iam';

export class RemindLoopStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const reqEnv = (name: string): string => {
      const v = process.env[name];
      if (!v) throw new Error(`Missing ${name} — set it in backend/.env (see .env.example)`);
      return v;
    };
    const optEnv = (name: string, fallback: string): string => process.env[name] ?? fallback;

    // ---- Data store: one reminder per (owner, reminderId) ----
    const table = new dynamodb.Table(this, 'Reminders', {
      partitionKey: { name: 'owner', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'reminderId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      // personal/dev: drop the table on stack delete. Use RETAIN for anything real.
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Values every function needs.
    const commonEnv: Record<string, string> = {
      TABLE_NAME: table.tableName,
      WHATSAPP_TOKEN: reqEnv('WHATSAPP_TOKEN'),
      PHONE_NUMBER_ID: reqEnv('PHONE_NUMBER_ID'),
      GRAPH_VERSION: optEnv('GRAPH_VERSION', 'v21.0'),
      TZ_NAME: optEnv('TZ_NAME', 'America/New_York'),
    };

    const bundling = { minify: true, sourceMap: false, target: 'node20' };

    // ---- Sender: the EventBridge Scheduler target that delivers a reminder ----
    const sender = new NodejsFunction(this, 'Sender', {
      entry: path.join(__dirname, '../src/sender.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.seconds(15),
      memorySize: 256,
      environment: commonEnv,
      bundling,
    });
    table.grantReadWriteData(sender);

    // Role that EventBridge Scheduler assumes to invoke the sender Lambda.
    const schedulerRole = new iam.Role(this, 'SchedulerRole', {
      assumedBy: new iam.ServicePrincipal('scheduler.amazonaws.com'),
    });
    sender.grantInvoke(schedulerRole);

    // ---- Webhook: public endpoint Meta calls; parses + schedules reminders ----
    const webhook = new NodejsFunction(this, 'Webhook', {
      entry: path.join(__dirname, '../src/webhook.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.seconds(29),
      memorySize: 256,
      environment: {
        ...commonEnv,
        VERIFY_TOKEN: reqEnv('VERIFY_TOKEN'),
        APP_SECRET: reqEnv('APP_SECRET'),
        ANTHROPIC_API_KEY: reqEnv('ANTHROPIC_API_KEY'),
        CLAUDE_MODEL: optEnv('CLAUDE_MODEL', 'claude-haiku-4-5-20251001'),
        SENDER_FUNCTION_ARN: sender.functionArn,
        SCHEDULER_ROLE_ARN: schedulerRole.roleArn,
      },
      bundling,
    });
    table.grantReadWriteData(webhook);

    // Webhook may create/delete schedules and hand the scheduler role to them.
    webhook.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['scheduler:CreateSchedule', 'scheduler:DeleteSchedule', 'scheduler:GetSchedule'],
        resources: ['*'],
      }),
    );
    webhook.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['iam:PassRole'],
        resources: [schedulerRole.roleArn],
      }),
    );

    // Public URL (auth NONE) — security comes from Meta's signature verification.
    const fnUrl = webhook.addFunctionUrl({ authType: lambda.FunctionUrlAuthType.NONE });

    new cdk.CfnOutput(this, 'WebhookUrl', {
      value: fnUrl.url,
      description: 'Paste this as the Callback URL in Meta > WhatsApp > Configuration',
    });
    new cdk.CfnOutput(this, 'ReminderTable', { value: table.tableName });
  }
}
