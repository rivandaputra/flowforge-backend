import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AlterWorkflowDeleteDefinitionField1777037792563 implements MigrationInterface {
  private tableName = 'workflow';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE ${this.tableName} DROP COLUMN definition`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      this.tableName,
      new TableColumn({
        name: 'definition',
        type: 'json',
        isNullable: false,
      }),
    );
  }
}
