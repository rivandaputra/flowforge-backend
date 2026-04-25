import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Step } from './types/workflow.types';
import { InjectRepository } from '@nestjs/typeorm';
import type { Cache } from 'cache-manager';
import { DataSource, Repository } from 'typeorm';
import { Workflow } from './entities/workflow.entity';
import { Run } from './entities/run.entity';
import { StepRun } from './entities/steprun.entity';
import { WorkflowGateway } from './workflow.gateway';
import { AiService } from './ai.service';
import { WorkflowVersion } from './entities/workflow-versions.entity';
import { RunWorkflowDto } from './dtos/run-workflow.dto';
import { CreateWorkflowDto } from './dtos/create-workflow.dto';
import { RollbackWorkflowDto } from './dtos/rollback-workflow.dto';

@Injectable()
export class WorkflowService {
  constructor(
    private dataSource: DataSource,

    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,

    @InjectRepository(Workflow)
    private workflowRepo: Repository<Workflow>,

    @InjectRepository(Run)
    private runRepo: Repository<Run>,

    @InjectRepository(StepRun)
    private stepRunRepo: Repository<StepRun>,

    @InjectRepository(WorkflowVersion)
    private workflowVersionRepo: Repository<WorkflowVersion>,

    private gateway: WorkflowGateway,

    private aiService: AiService,
  ) {}

  private getWorkflowCacheKeyByName(name: string) {
    return `workflow:name:${name}`;
  }

  private getWorkflowCacheKeyById(id: string) {
    return `workflow:id:${id}`;
  }

  private getWorkflowVersionCacheKey(workflowId: string, version: string) {
    return `workflow:version:${workflowId}:${version}`;
  }

  private async getCachedWorkflowByName(name: string) {
    const cacheKey = this.getWorkflowCacheKeyByName(name);
    const cachedWorkflow = await this.cacheManager.get<Workflow>(cacheKey);
    if (cachedWorkflow) {
      return cachedWorkflow;
    }

    const workflow = await this.workflowRepo.findOne({ where: { name } });
    if (workflow) {
      await this.cacheManager.set(cacheKey, workflow, 300);
      await this.cacheManager.set(
        this.getWorkflowCacheKeyById(workflow.id),
        workflow,
        300,
      );
    }
    return workflow;
  }

  private async getCachedWorkflowById(id: string) {
    const cacheKey = this.getWorkflowCacheKeyById(id);
    const cachedWorkflow = await this.cacheManager.get<Workflow>(cacheKey);
    if (cachedWorkflow) {
      return cachedWorkflow;
    }

    const workflow = await this.workflowRepo.findOne({ where: { id } });
    if (workflow) {
      await this.cacheManager.set(cacheKey, workflow, 300);
      await this.cacheManager.set(
        this.getWorkflowCacheKeyByName(workflow.name),
        workflow,
        300,
      );
    }
    return workflow;
  }

  private async getCachedWorkflowVersion(workflowId: string, version: string) {
    const cacheKey = this.getWorkflowVersionCacheKey(workflowId, version);
    const cachedVersion =
      await this.cacheManager.get<WorkflowVersion>(cacheKey);
    if (cachedVersion) {
      return cachedVersion;
    }

    const workflowVersion = await this.workflowVersionRepo.findOne({
      where: { workflow_id: workflowId, version_number: version },
    });
    if (workflowVersion) {
      await this.cacheManager.set(cacheKey, workflowVersion, 300);
    }
    return workflowVersion;
  }

  async createWorkflow(data: CreateWorkflowDto) {
    const name = data.name || 'Untitled';
    const definition = data.steps;

    const existingWorkflow = await this.getCachedWorkflowByName(name);
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      if (!existingWorkflow) {
        // Create new workflow
        const versionNumber = data.version_number || '1.0';
        const workflow = qr.manager.create(Workflow, {
          name,
          current_version: versionNumber,
          modifiedAt: new Date(),
        });
        const savedWorkflow = await qr.manager.save(workflow);

        // Create version
        const version = qr.manager.create(WorkflowVersion, {
          workflow_id: savedWorkflow.id,
          version_number: versionNumber,
          definition,
          modifiedAt: new Date(),
        });
        await qr.manager.save(version);

        await qr.commitTransaction();
        await this.cacheManager.set(
          this.getWorkflowCacheKeyById(savedWorkflow.id),
          savedWorkflow,
          300,
        );
        await this.cacheManager.set(
          this.getWorkflowCacheKeyByName(name),
          savedWorkflow,
          300,
        );
        await this.cacheManager.set(
          this.getWorkflowVersionCacheKey(savedWorkflow.id, versionNumber),
          version,
          300,
        );

        return savedWorkflow;
      } else {
        // Update existing workflow
        // Get latest version number
        const latestVersion = existingWorkflow.current_version;

        let newVersionNumber;
        if (data.version_number) {
          newVersionNumber = data.version_number;
        } else {
          const currentNum = parseFloat(latestVersion);
          newVersionNumber = (currentNum + 0.1).toFixed(1);
        }

        // Create new version
        const version = qr.manager.create(WorkflowVersion, {
          workflow_id: existingWorkflow.id,
          version_number: newVersionNumber,
          definition,
          modifiedAt: new Date(),
        });
        await qr.manager.save(version);

        // Update workflow
        await qr.manager.update(Workflow, existingWorkflow.id, {
          current_version: newVersionNumber,
          modifiedAt: new Date(),
        });

        await qr.commitTransaction();
        existingWorkflow.current_version = newVersionNumber;
        await this.cacheManager.set(
          this.getWorkflowCacheKeyById(existingWorkflow.id),
          existingWorkflow,
          300,
        );
        await this.cacheManager.set(
          this.getWorkflowCacheKeyByName(name),
          existingWorkflow,
          300,
        );
        await this.cacheManager.set(
          this.getWorkflowVersionCacheKey(
            existingWorkflow.id,
            newVersionNumber,
          ),
          version,
          300,
        );

        return existingWorkflow;
      }
    } catch (err: any) {
      await qr.rollbackTransaction();
      throw new HttpException(
        err.message || 'Failed to create/update workflow',
        HttpStatus.BAD_REQUEST,
      );
    } finally {
      await qr.release();
    }
  }

  async rollbackWorkflowVersionById(data: RollbackWorkflowDto) {
    const wfCurrentVersion = await this.getCachedWorkflowVersion(
      data.id,
      data.version_number,
    );
    if (!wfCurrentVersion) {
      throw new HttpException(
        `Workflow version not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    const newVersionNumber = wfCurrentVersion.version_number;
    await this.workflowRepo.update(wfCurrentVersion.workflow_id, {
      current_version: newVersionNumber,
      modifiedAt: new Date(),
    });

    const existingWorkflow = await this.getCachedWorkflowById(
      wfCurrentVersion.workflow_id,
    );

    // update cache with new current version
    if (existingWorkflow) {
      existingWorkflow.current_version = newVersionNumber;
      await this.cacheManager.set(
        this.getWorkflowCacheKeyById(wfCurrentVersion.workflow_id),
        existingWorkflow,
        300,
      );
      await this.cacheManager.set(
        this.getWorkflowCacheKeyByName(existingWorkflow.name),
        existingWorkflow,
        300,
      );
    }

    return wfCurrentVersion;
  }

  private validateDAG(steps: Step[]) {
    const graph: Record<string, string[]> = {};
    const visited = new Set<string>();
    const visiting = new Set<string>();

    steps.forEach((step) => {
      graph[step.id] = step.next || [];
    });

    const dfs = (node: string) => {
      if (visiting.has(node)) {
        throw new HttpException(
          `Cycle detected at ${node}`,
          HttpStatus.BAD_REQUEST,
        );
      }
      if (visited.has(node)) return;

      visiting.add(node);
      for (const neighbor of graph[node]) {
        dfs(neighbor);
      }
      visiting.delete(node);
      visited.add(node);
    };

    steps.forEach((step) => dfs(step.id));
  }

  private async executeStep(step: Step) {
    console.log(`➡️ Start ${step.id}`);

    switch (step.type) {
      case 'http':
        // For demo, we just simulate an HTTP call with failure based on config
        if (step.config?.forceFail) {
          throw new HttpException(
            `Forced failure from config`,
            HttpStatus.BAD_REQUEST,
          );
        }

        await new Promise((res) => setTimeout(res, 500));
        break;

      case 'delay':
        await new Promise((res) => setTimeout(res, step.config?.ms || 1000));
        break;

      case 'script':
        console.log(`Running script ${step.id}`);
        break;
    }

    // Random error simulation
    if (Math.random() < 0.2) {
      throw new Error(`Step ${step.id} failed`);
    }

    console.log(`✅ Success ${step.id}`);
  }

  private async executeWithRetry(
    step: Step,
    runId: string,
    maxRetries: number,
  ) {
    // RETRY LOGIC WITH EXPONENTIAL BACKOFF + AI ANALYSIS ON FINAL FAILURE
    let attempt = 0;

    while (attempt <= maxRetries) {
      try {
        // ⬇️ create STEP RUN (START)
        const stepRun = await this.stepRunRepo.save({
          runId,
          stepId: step.id,
          status: 'RUNNING',
        });

        await this.cacheManager.set(
          `step:${runId}:${step.id}`,
          {
            status: 'RUNNING',
          },
          300,
        );

        this.gateway.emitStepUpdate({
          runId,
          stepId: step.id,
          status: 'RUNNING',
        });

        await this.executeStep(step);

        // ⬇️ update SUCCESS
        await this.stepRunRepo.update(stepRun.id, {
          status: 'SUCCESS',
        });

        await this.cacheManager.set(
          `step:${runId}:${step.id}`,
          {
            status: 'SUCCESS',
          },
          300,
        );

        this.gateway.emitStepUpdate({
          runId,
          stepId: step.id,
          status: 'SUCCESS',
        });

        return;
      } catch (err: any) {
        if (attempt === maxRetries) {
          const errorMessage = err.message;

          // 🔥 AI ANALYSIS
          let aiResult: string | null;
          try {
            aiResult = await this.aiService.analyzeError(errorMessage, {
              stepId: step.id,
              type: step.type,
            });
          } catch {
            aiResult = 'AI unavailable';
          }

          // ⬇️ update FAILED
          await this.stepRunRepo.save({
            runId,
            stepId: step.id,
            status: 'FAILED',
            log: JSON.stringify({
              error: errorMessage,
              ai: aiResult,
            }),
          });

          await this.cacheManager.set(
            `step:${runId}:${step.id}`,
            {
              status: 'FAILED',
              error: errorMessage,
            },
            300,
          );

          this.gateway.emitStepUpdate({
            runId,
            stepId: step.id,
            status: 'FAILED',
            error: errorMessage,
            ai: aiResult,
          });

          throw err;
        }

        const delay = 500 * Math.pow(2, attempt);
        await new Promise((res) => setTimeout(res, delay));
        attempt++;
      }
    }
  }

  async runWorkflow(workflow: RunWorkflowDto) {
    const maxRetries = workflow.max_error_retries ?? 3;
    const existingWorkflow = await this.workflowRepo.findOne({
      where: { id: workflow.id },
    });
    if (!existingWorkflow) {
      throw new HttpException(`Workflow not found`, HttpStatus.NOT_FOUND);
    }

    const run = await this.runRepo.save({
      workflowId: workflow.id,
      status: 'RUNNING',
    });

    await this.cacheManager.set(
      `run:${run.id}`,
      {
        status: 'RUNNING',
      },
      300,
    );

    this.gateway.emitRunUpdate({
      runId: run.id,
      status: 'RUNNING',
    });

    try {
      this.validateDAG(workflow.steps);

      const steps = workflow.steps;

      // ⬇️ TOPOLOGICAL SORT + BATCH EXECUTION
      const stepMap: Record<string, Step> = {};
      const inDegree: Record<string, number> = {};
      const graph: Record<string, string[]> = {};

      // init
      steps.forEach((step) => {
        stepMap[step.id] = step;
        inDegree[step.id] = 0;
        graph[step.id] = step.next || [];
      });

      // calculate in-degrees
      steps.forEach((step) => {
        for (const next of step.next || []) {
          inDegree[next]++;
        }
      });

      const ready: string[] = [];

      // find initial ready steps (in-degree 0)
      for (const id in inDegree) {
        if (inDegree[id] === 0) ready.push(id);
      }

      while (ready.length > 0) {
        const batch = [...ready];
        ready.length = 0;

        // ⬇️ PARALLEL EXECUTION + TRACKING
        await Promise.all(
          batch.map((id) =>
            this.executeWithRetry(stepMap[id], run.id, maxRetries),
          ),
        );

        for (const id of batch) {
          for (const next of graph[id]) {
            inDegree[next]--;
            if (inDegree[next] === 0) {
              ready.push(next);
            }
          }
        }
      }

      await this.runRepo.update(run.id, {
        status: 'SUCCESS',
        finishedAt: new Date(),
      });

      await this.cacheManager.set(
        `run:${run.id}`,
        {
          status: 'SUCCESS',
        },
        300,
      );

      this.gateway.emitRunUpdate({
        runId: run.id,
        status: 'SUCCESS',
      });
    } catch (err: any) {
      await this.runRepo.update(run.id, {
        status: 'FAILED',
        finishedAt: new Date(),
      });

      await this.cacheManager.set(
        `run:${run.id}`,
        {
          status: 'FAILED',
          error: err.message,
        },
        300,
      );

      this.gateway.emitRunUpdate({
        runId: run.id,
        status: 'FAILED',
        error: err.message,
      });

      throw err;
    }

    return run;
  }

  async runWorkflowById(id: string) {
    const wf = await this.getCachedWorkflowById(id);
    if (!wf) {
      throw new HttpException(`Workflow not found`, HttpStatus.NOT_FOUND);
    }

    const wfCurrentVersion = await this.getCachedWorkflowVersion(
      id,
      wf.current_version,
    );

    if (!wfCurrentVersion) {
      throw new HttpException(`Workflow not found`, HttpStatus.NOT_FOUND);
    }

    const workflowWithDefinition = {
      ...wf,
      steps: wfCurrentVersion.definition,
    };

    return this.runWorkflow(workflowWithDefinition);
  }
}
