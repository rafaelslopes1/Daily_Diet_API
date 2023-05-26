import { FastifyInstance } from "fastify";

export async function mealsRoutes(app: FastifyInstance) {
  app.get('/', async (request) => {
    const { sessionId } = request.cookies

    const meals = await 
  }
}