import type { Request, Response } from "express";
import { issuesService } from "./issues.service";

 const createIssueController = async (req: Request, res: Response) => {
  try {
    const result = await issuesService.createIssue(req.body, req.user.id);

    res.status(201).json({
      success: true,
      message: "Issue created successfully",
      data: result,
    });
  } catch (error: unknown) {
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Error",
    });
  }
};
 const getAllIssuesController = async (req: Request, res: Response) => {
  try {
    const result = await issuesService.getAllIssues(req.query);

    res.status(200).json({
      success: true,
      message: "Issues fetched successfully",
      data: result,
    });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Error",
    });
  }
};
const getSingleIssueController = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    const result = await issuesService.getSingleIssue(id);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: unknown) {
    res.status(404).json({
      success: false,
      message: error instanceof Error ? error.message : "Something went wrong",
    });
  }
};
const updateIssueController = async (req: Request, res: Response) => {
  try {
    const issueId = Number(req.params.id);

    const result = await issuesService.updateIssue(
      issueId,
      req.body,
      req.user!,
    );

    res.status(200).json({
      success: true,
      message: "Issue updated successfully",
      data: result,
    });
  } catch (error: unknown) {
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Something went wrong",
    });
  }
};
const deleteIssueController = async (req: Request, res: Response) => {
  try {
    const issueId = Number(req.params.id);

    await issuesService.deleteIssue(issueId, req.user!);

    res.status(200).json({
      success: true,
      message: "Issue deleted successfully",
    });
  } catch (error: unknown) {
    res.status(403).json({
      success: false,
      message: error instanceof Error ? error.message : "Something went wrong",
    });
  }
};
export const issuesController = {
  createIssueController,
  getAllIssuesController,
  getSingleIssueController,
  updateIssueController,
  deleteIssueController,
};
