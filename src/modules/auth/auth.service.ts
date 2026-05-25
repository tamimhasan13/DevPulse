import bcrypt from "bcrypt";
import { pool } from "../../db";
import { createToken } from "../../utils/jwt";
import type { IUser } from "./auth.interface";




 const createUser = async (payload: IUser) => {
  const { name, email, password, role } = payload;


 const allowedRoles = ["contributor", "maintainer"] as const;

 type Role = (typeof allowedRoles)[number];

 const userRole: Role = role || "contributor";

 if (!allowedRoles.includes(userRole)) {
   throw new Error("Invalid role");
 }
  // check existing email
  const existingUser = await pool.query(
    `SELECT * FROM users WHERE email = $1`,
    [email],
  );

  if (existingUser.rows.length > 0) {
    throw new Error("Email already exists");
  }

  // hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // insert user
  const result = await pool.query(
    `
    INSERT INTO users(name,email,password,role)
    VALUES($1,$2,$3,$4)
    RETURNING id,name,email,role,created_at,updated_at
    `,
    [name, email, hashedPassword, userRole],
  );

  return result.rows[0];
};
const loginUser = async (payload: { email: string; password: string }) => {
  const { email, password } = payload;
  // find user
  const result = await pool.query(`SELECT * FROM users WHERE email = $1`, [
    email,
  ]);

  const user = result.rows[0];

  if (!user) {
    throw new Error("User not found");
  }

  //check password
  const isPasswordMatch = await bcrypt.compare(password, user.password);

  if (!isPasswordMatch) {
    throw new Error("Invalid password");
  }

  //create token
  const token = createToken({
    id: user.id,
    name: user.name,
    role: user.role,
  });

  // delete user and password;
  const { password: _, ...safeUser } = user;

  return {
    token,
    user:safeUser,
  };
};

export const authService = {
  createUser,
  loginUser,
};
