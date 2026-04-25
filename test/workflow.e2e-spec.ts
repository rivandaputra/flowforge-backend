import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { CreateWorkflowDto } from '../src/workflow/dtos/create-workflow.dto';
import { JwtAuthGuard } from '../src/auth/jwt/jwt.guard';
import { RolesGuard } from '../src/auth/roles/roles.guard';
import { StepTypes } from '../src/workflow/enums/steps.enum';

describe('Workflow (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    jest.setTimeout(30000); // Increase timeout for e2e tests

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  }, 30000);

  afterAll(async () => {
    // Close cache manager if available
    try {
      const cacheManager = app.get('CACHE_MANAGER');
      if (
        cacheManager &&
        typeof cacheManager.store?.client?.disconnect === 'function'
      ) {
        await cacheManager.store.client.disconnect();
      }
    } catch (error) {
      // Ignore errors during cleanup
      console.log(error);
    }
    await app.close();
  });

  it('/workflow (POST) - should create a new workflow', async () => {
    const name = 'Test Workflow: ' + crypto.randomUUID();
    const createWorkflowDto: CreateWorkflowDto = {
      name,
      steps: [
        {
          id: 'A',
          type: StepTypes.DELAY,
          config: { ms: 1000 },
          next: [],
        },
      ],
    };

    const response = await request(app.getHttpServer())
      .post('/workflow')
      .send(createWorkflowDto)
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe(name);
    expect(response.body.current_version).toBe('1.0');
  });

  it('/workflow (POST) - should update existing workflow and create new version', async () => {
    const name = 'Test Workflow Update: ' + crypto.randomUUID();
    const createWorkflowDto: CreateWorkflowDto = {
      name,
      steps: [
        {
          id: 'A',
          type: StepTypes.DELAY,
          config: { ms: 1000 },
          next: [],
        },
      ],
    };

    // Create first version
    const firstResponse = await request(app.getHttpServer())
      .post('/workflow')
      .send(createWorkflowDto)
      .expect(201);

    expect(firstResponse.body.current_version).toBe('1.0');

    // Update with new version
    const updateWorkflowDto: CreateWorkflowDto = {
      name,
      steps: [
        {
          id: 'A',
          type: StepTypes.DELAY,
          config: { ms: 2000 },
          next: [],
        },
        {
          id: 'B',
          type: StepTypes.SCRIPT,
          config: {},
          next: [],
        },
      ],
    };

    const updateResponse = await request(app.getHttpServer())
      .post('/workflow')
      .send(updateWorkflowDto)
      .expect(201);

    expect(updateResponse.body.current_version).toBe('1.1');
  });

  it('/workflow/run/:id (GET) - should run workflow by id', async () => {
    // First create a workflow
    const name = 'Run Test Workflow: ' + crypto.randomUUID();
    const createWorkflowDto: CreateWorkflowDto = {
      name,
      steps: [
        {
          id: 'A',
          type: StepTypes.DELAY,
          config: { ms: 500 },
          next: [],
        },
      ],
    };

    const createResponse = await request(app.getHttpServer())
      .post('/workflow')
      .send(createWorkflowDto)
      .expect(201);

    const workflowId = createResponse.body.id;

    // Now run it
    const runResponse = await request(app.getHttpServer())
      .get(`/workflow/run/${workflowId}`)
      .expect(200);

    expect(runResponse.body).toHaveProperty('id');
    expect(runResponse.body.status).toBe('RUNNING');
  });

  it('/workflow/run (POST) - should run workflow directly', async () => {
    const name = 'Direct Run Workflow: ' + crypto.randomUUID();
    const createWorkflowDto: CreateWorkflowDto = {
      name,
      steps: [
        {
          id: 'A',
          type: StepTypes.DELAY,
          config: { ms: 500 },
          next: [],
        },
      ],
    };

    const createResponse = await request(app.getHttpServer())
      .post('/workflow')
      .send(createWorkflowDto)
      .expect(201);

    const id = createResponse.body.id;

    const runWorkflowDto = {
      id,
      name,
      steps: [
        {
          id: 'A',
          type: StepTypes.DELAY,
          config: { ms: 500 },
          next: [],
        },
      ],
    };

    const response = await request(app.getHttpServer())
      .post('/workflow/run')
      .send(runWorkflowDto)
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.status).toBe('RUNNING');
  });

  it('/workflow/rollback (POST) - should rollback workflow version', async () => {
    // First create a workflow with multiple versions
    const name = 'Rollback Test Workflow: ' + crypto.randomUUID();
    const createWorkflowDto: CreateWorkflowDto = {
      name,
      steps: [
        {
          id: 'A',
          type: StepTypes.DELAY,
          config: { ms: 1000 },
          next: [],
        },
      ],
    };

    const firstResponse = await request(app.getHttpServer())
      .post('/workflow')
      .send(createWorkflowDto)
      .expect(201);

    const workflowId = firstResponse.body.id;

    // Update to create second version
    const updateWorkflowDto: CreateWorkflowDto = {
      name,
      steps: [
        {
          id: 'A',
          type: StepTypes.DELAY,
          config: { ms: 2000 },
          next: [],
        },
      ],
    };

    await request(app.getHttpServer())
      .post('/workflow')
      .send(updateWorkflowDto)
      .expect(201);

    // Now rollback to version 1.0
    const rollbackDto = {
      id: workflowId,
      version_number: '1.0',
    };

    const rollbackResponse = await request(app.getHttpServer())
      .post('/workflow/rollback')
      .send(rollbackDto)
      .expect(201);

    expect(rollbackResponse.body.version_number).toBe('1.0');
  });
});
