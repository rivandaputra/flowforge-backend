import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AlterWorkflowAddModifiedAtField1777038111591 implements MigrationInterface {
  private tableName = 'workflow';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      this.tableName,
      new TableColumn({
        name: 'modifiedAt',
        type: 'timestamp',
        default: 'now()',
        onUpdate: 'CURRENT_TIMESTAMP',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE ${this.tableName} DROP COLUMN modifiedAt`,
    );
  }
}
