import { FastifyReply, FastifyRequest } from "fastify";

export async function checkSessionIdExists(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { sessionId } = await request.cookies

  if (!sessionId) {
    return reply.status(401).send({ error: 'Unauthorized' })
  }
}