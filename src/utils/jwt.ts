import jwt from "jsonwebtoken";
import config from "../config";

export const createToken = (payload: object) => {
  return jwt.sign(payload,config.jwt_secret, {
    expiresIn: "7d",
  });
};
