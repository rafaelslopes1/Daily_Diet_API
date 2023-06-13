import { FastifyInstance } from "fastify";

import { checkSessionIdExists } from "../middlewares/checkSessionIdExists";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import console from "node:console";
import { knex } from "../../infra/knex/db";

export async function mealsRoutes(app: FastifyInstance) {
  app.post('/',
    async (request, reply) => {
      const createMealBodySchema = z.object({
        name: z.string(),
        description: z.string(),
        createdAt: z.coerce.date(),
        isOnTheDiet: z.boolean(),
      });

      const {
        name,
        description,
        createdAt,
        isOnTheDiet
      } = createMealBodySchema.parse(request.body);

      let { sessionId } = request.cookies;

      if (!sessionId) {
        sessionId = randomUUID();

        reply.cookie('sessionId', sessionId, {
          path: '/',
          maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
        });
      }

      const obj = {
        id: randomUUID(),
        session_id: sessionId,
        name,
        description,
        created_at: new Date(createdAt),
        is_on_the_diet: isOnTheDiet,
      }

      console.log(obj)

      await knex('meals').insert(obj);

      reply.status(201).send();
    })

  app.put('/:id',
    {
      preHandler: [checkSessionIdExists]
    },
    async (request) => {
      const updateMealBodySchema = z.object({
        name: z.string(),
        description: z.string(),
        createdAt: z.coerce.date(),
        isOnTheDiet: z.boolean(),
      });

      const updateMealParamsSchema = z.object({
        id: z.string().uuid(),
      });

      const {
        name,
        description,
        createdAt,
        isOnTheDiet
      } = updateMealBodySchema.parse(request.body);

      const { id } = updateMealParamsSchema.parse(request.params);

      const { sessionId } = request.cookies;

      await knex('meals').where({ id, session_id: sessionId }).update({
        name,
        description,
        created_at: createdAt,
        is_on_the_diet: isOnTheDiet,
      });
    })

  app.delete('/:id',
    {
      preHandler: [checkSessionIdExists]
    },
    async (request) => {
      const deleteMealParamsSchema = z.object({
        id: z.string().uuid(),
      });

      const { id } = deleteMealParamsSchema.parse(request.params);

      const { sessionId } = request.cookies;

      await knex('meals').delete().where({ id, session_id: sessionId });
    })

  app.get('/',
    {
      preHandler: [checkSessionIdExists]
    },
    async (request) => {
      const { sessionId } = request.cookies

      const meals = await knex('meals')
        .where('session_id', sessionId)
        .select()

      return { meals }
    });

  app.get('/:id',
    {
      preHandler: [checkSessionIdExists]
    },
    async (request) => {
      const getMealParamsSchema = z.object({
        id: z.string().uuid()
      })

      const { id } = getMealParamsSchema.parse(request.params)

      const { sessionId } = request.cookies;

      const meal = await knex('meals')
        .where({ id, session_id: sessionId })
        .first()

      return { meal }
    }
  )

  app.get('/summary',
    {
      preHandler: [checkSessionIdExists]
    },
    async (request) => {
      const { sessionId } = request.cookies;

      const totalMeals = (await knex('meals')
        .where({ session_id: sessionId })
        .count('id as total'))[0].total;

      const totalOnTheDietMeals = (await knex('meals')
        .where({
          session_id: sessionId,
          is_on_the_diet: true
        })
        .count('id as total'))[0].total;

      const totalOffDietMeals = (Number(totalMeals) - Number(totalOnTheDietMeals)) || 0;

      const sortedMeals = await knex('meals')
        .where({ session_id: sessionId })
        .orderBy('created_at', 'asc').select()

      let bestSequenceOfOnDietMeals = 0;

      let count = 0;
      for (const meal of sortedMeals) {
        if (!meal.is_on_the_diet || sortedMeals.indexOf(meal) === sortedMeals.length - 1) {
          if (count > bestSequenceOfOnDietMeals) bestSequenceOfOnDietMeals = count;
          count = 0;
          continue
        }
        count += 1;
      }

      return { totalMeals, totalOnTheDietMeals, totalOffDietMeals, bestSequenceOfOnDietMeals }
    })
}