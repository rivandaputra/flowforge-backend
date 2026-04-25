import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AlterStepRunAddCreatedAtField1777082041758 implements MigrationInterface {
  private tableName = 'step_run';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      this.tableName,
      new TableColumn({
        name: 'createdAt',
        type: 'timestamp',
        default: 'now()',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE ${this.tableName} DROP COLUMN createdAt`,
    );
  }
}
