import express from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { roleMiddleware } from "../../middlewares/role.middleware";
import { issuesController } from "./issues.controller";

const router = express.Router();

// CREATE ISSUE
router.post(
  "/",
  authMiddleware,
  roleMiddleware("contributor", "maintainer"),
  issuesController.createIssueController,
);
router.get("/",issuesController.getAllIssuesController);
router.get("/:id", issuesController.getSingleIssueController);
router.patch("/:id", authMiddleware, issuesController.updateIssueController);
router.delete("/:id", authMiddleware, issuesController.deleteIssueController);

export const issuesRoute= router;
