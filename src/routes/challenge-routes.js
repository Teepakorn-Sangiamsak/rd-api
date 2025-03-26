const express = require("express");
const challengeRouter = express.Router();
const challengeController = require("../controllers/challenge-controller");
const verifyToken = require("../middlewares/auth-middleware");


challengeRouter.post("/challenges", verifyToken, challengeController.createChallenge);
challengeRouter.get("/challenges", challengeController.getChallenges);
challengeRouter.post("/challenges/:challengeId/join", verifyToken, challengeController.joinChallenge);
challengeRouter.patch("/challenges/verify", verifyToken, challengeController.verifyProof);
challengeRouter.delete("/challenges/:challengeId/cancel", verifyToken, challengeController.deleteChallenge);

module.exports = challengeRouter;
