import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('meals', (table) => {
    table.renameColumn('isOnTheDiet', 'is_on_the_diet');
  })
}


export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('meals', (table) => {
    table.renameColumn('is_on_the_diet', 'isOnTheDiet')
  })
}

