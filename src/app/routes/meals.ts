import { FastifyInstance } from "fastify";
import knex from "knex";
import { checkSessionIdExists } from "../middlewares/checkSessionIdExists";
import { z } from "zod";
import { randomUUID } from "node:crypto";

export async function mealsRoutes(app: FastifyInstance) {
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

  app.post('/',
    async (request, reply) => {
      const createMealBodySchema = z.object({
        name: z.string(),
        description: z.string(),
        createdAt: z.date(),
        isOnTheDiet: z.boolean(),
      });

      const {
        name,
        description,
        createdAt,
        isOnTheDiet
      } = createMealBodySchema.parse(request.body);

      let { sessionId } = request.cookies;

      if (sessionId) {
        sessionId = randomUUID();

        reply.cookie('sessionId', sessionId, {
          path: '/',
          maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
        });
      }

      await knex('meals').insert({
        id: randomUUID(),
        session_id: sessionId,
        name,
        description,
        created_at: createdAt,
        is_on_the_diet: isOnTheDiet,
      });

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
        createdAt: z.date(),
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

  app.get('/summary',
    {
      preHandler: [checkSessionIdExists]
    },
    async (request) => {
      const { sessionId } = request.cookies;

      const totalMeals = (await knex('meals')
        .where({ session_id: sessionId })
        .count('id')) || 0;

      const totalOnTheDietMeals = (await knex('meals')
        .where({
          session_id: sessionId,
          is_on_the_diet: true
        })
        .count('id')) || 0;

      const totalOffDietMeals = (totalMeals - totalOnTheDietMeals) || 0;

      // const bestSequenceOfOnDietMeals = //toDo


      return { totalMeals, totalOnTheDietMeals, totalOffDietMeals }
    })
}