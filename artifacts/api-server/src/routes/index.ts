import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import searchRouter from "./search";
import groupsRouter from "./groups";
import campaignsRouter from "./campaigns";
import jobsRouter from "./jobs";
import statsRouter from "./stats";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(searchRouter);
router.use(groupsRouter);
router.use(campaignsRouter);
router.use(jobsRouter);
router.use(statsRouter);

export default router;
