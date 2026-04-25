import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1776923661605 implements MigrationInterface {
  name = 'Init1776923661605';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`step_run\` (\`id\` varchar(36) NOT NULL, \`runId\` varchar(255) NOT NULL, \`stepId\` varchar(255) NOT NULL, \`status\` varchar(255) NOT NULL, \`log\` varchar(255) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`run\` (\`id\` varchar(36) NOT NULL, \`workflowId\` varchar(255) NOT NULL, \`status\` varchar(255) NOT NULL, \`startedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, \`finishedAt\` timestamp NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`workflow\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(255) NOT NULL, \`definition\` json NOT NULL, \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`step_run\` ADD CONSTRAINT \`FK_a039a8e184a409793cadc170029\` FOREIGN KEY (\`runId\`) REFERENCES \`run\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`run\` ADD CONSTRAINT \`FK_7fbc1e9d4fe6722073dab4d3f3d\` FOREIGN KEY (\`workflowId\`) REFERENCES \`workflow\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`run\` DROP FOREIGN KEY \`FK_7fbc1e9d4fe6722073dab4d3f3d\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`step_run\` DROP FOREIGN KEY \`FK_a039a8e184a409793cadc170029\``,
    );
    await queryRunner.query(`DROP TABLE \`workflow\``);
    await queryRunner.query(`DROP TABLE \`run\``);
    await queryRunner.query(`DROP TABLE \`step_run\``);
  }
}
