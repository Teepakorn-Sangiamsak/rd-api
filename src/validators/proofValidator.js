const { z } = require("zod");

const proofSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]), 
});

const proofParamsSchema = z.object({
  challengeId: z.string().regex(/^\d+$/), 
  proofId: z.string().regex(/^\d+$/),
});

module.exports = { proofSchema, proofParamsSchema };
