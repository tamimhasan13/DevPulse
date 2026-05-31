
import type { Request, Response } from "express";
import { authService } from "./auth.service";
import sendResponse from "../../utils/sendResponse";

const signupUser = async (req: Request, res: Response) => {
  try {
    const result = await authService.createUser(req.body);

    sendResponse(
      res,
      {
        statusCode:201,
        success: true,
        message: "User registered successfully",
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
const loginUser = async (req: Request, res: Response) => {
  try {
    const result = await authService.loginUser(req.body);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Login successful",
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

export const authController = {
  signupUser,
  loginUser,
};
