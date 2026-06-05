import { Router } from "express";
import { accountRouter } from "./account.routes.js";
import { authRouter } from "./auth.routes.js";
import { healthRouter } from "./health.routes.js";
import { trackerRouter } from "./tracker.routes.js";

export const apiRouter = Router();

apiRouter.get("/", (request, response) => {
  response.json({
    name: "Tracker API",
    version: "1.0.0"
  });
});

apiRouter.use(healthRouter);
apiRouter.use(authRouter);
apiRouter.use(accountRouter);
apiRouter.use(trackerRouter);
