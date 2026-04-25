import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AlterWorkflowAddCurrentVersionField1777038902681 implements MigrationInterface {
  private tableName = 'workflow';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      this.tableName,
      new TableColumn({
        name: 'current_version',
        type: 'varchar',
        length: '15',
        isNullable: false,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE ${this.tableName} DROP COLUMN current_version`,
    );
  }
}
