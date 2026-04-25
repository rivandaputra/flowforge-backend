import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateWorkflowVersionsTable1777036925580 implements MigrationInterface {
  private tableName = 'workflow_versions';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: this.tableName,
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'workflow_id',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          {
            name: 'version_number',
            type: 'varchar',
            length: '15',
            isNullable: false,
          },
          {
            name: 'definition',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'modifiedAt',
            type: 'timestamp',
            default: 'now()',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.query(
      `ALTER TABLE ${this.tableName} ADD CONSTRAINT FK_workflow_versions FOREIGN KEY (workflow_id) REFERENCES workflow (id) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE ${this.tableName} DROP FOREIGN KEY FK_workflow_versions`,
    );
    await queryRunner.dropTable(this.tableName);
  }
}
