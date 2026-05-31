import type { Request, Response } from "express";
import { issuesService } from "./issues.service";
import sendResponse from "../../utils/sendResponse";

 const createIssueController = async (req: Request, res: Response) => {
  try {
    const result = await issuesService.createIssue(req.body, req.user!.id);

    
    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Issue created successfully",
      data: result,
    });
  } catch (error: unknown) {
    
    sendResponse(res, {
      statusCode: 400,
      success: false,
      message: error instanceof Error ? error.message : "Error",
    });
    
  }
};
 const getAllIssuesController = async (req: Request, res: Response) => {
  try {
    const result = await issuesService.getAllIssues(req.query);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Issues retrieved successfully",
      data: result,
    });
  } catch (error: unknown) {
    sendResponse(res, {
      statusCode: 500,
      success: false,
      message: error instanceof Error ? error.message : "Internal Server Error",
    });
    
  }
};
const getSingleIssueController = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    const result = await issuesService.getSingleIssue(id);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Issues retrieved successfully",
      data: result,
    });
  } catch (error: unknown) {
    sendResponse(res, {
      statusCode: 404,
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
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Issue updated successfully",
      data: result,
    });
  } catch (error: unknown) {
    sendResponse(res, {
      statusCode: 400,
      success: false,
      message: error instanceof Error ? error.message : "Something went wrong",
    });
  }
};
const deleteIssueController = async (req: Request, res: Response) => {
  try {
    const issueId = Number(req.params.id);

    await issuesService.deleteIssue(issueId, req.user!);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Issue deleted successfully",
    });
  } catch (error: unknown) {
    sendResponse(res, {
      statusCode: 403,
      success: false,
      message: error instanceof Error ? error.message : "Internal Server Error",
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
