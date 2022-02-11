import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class User1644549742428 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'persons',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '250',
            isNullable: false,
          },
          {
            name: 'birtAt',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'phone',
            type: 'varchar',
            length: '16',
            isNullable: true,
          },
          {
            name: 'document',
            type: 'varchar',
            length: '14',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('persons');
  }
}
