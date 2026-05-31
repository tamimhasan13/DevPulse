

   import { createRequire } from 'module';

   const require = createRequire(import.meta.url);

  

// src/app.ts
import express3 from "express";
import cors from "cors";

// src/modules/auth/auth.route.ts
import express from "express";

// src/modules/auth/auth.service.ts
import bcrypt from "bcrypt";

// src/db/index.ts
import { Pool } from "pg";

// src/config/index.ts
import dotenv from "dotenv";
import path from "path";
dotenv.config({
  path: path.join(process.cwd(), ".env")
});
var config = {
  connection_string: process.env.CONNECTIONSTRING,
  port: process.env.PORT,
  jwt_secret: process.env.JWT_SECRET
};
var config_default = config;

// src/db/index.ts
var pool = new Pool({
  connectionString: config_default.connection_string
});
var initDB = async () => {
  try {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password TEXT NOT NULL,

        role VARCHAR(20) DEFAULT 'contributor'
        CHECK (role IN ('contributor', 'maintainer')),

        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS issues (
        id SERIAL PRIMARY KEY,

        title VARCHAR(150) NOT NULL,

        description TEXT NOT NULL
        CHECK(LENGTH(description) >= 20),

        type VARCHAR(30) NOT NULL
        CHECK (type IN ('bug', 'feature_request')),

        status VARCHAR(30) DEFAULT 'open'
        CHECK (status IN ('open', 'in_progress', 'resolved')),

        reporter_id INT NOT NULL,

        created_at TIMESTAMP DEFAULT NOW(),

        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("data base connected");
  } catch (error) {
    console.error("Database connection failed:", error);
  }
};

// src/utils/jwt.ts
import jwt from "jsonwebtoken";
var createToken = (payload) => {
  return jwt.sign(payload, config_default.jwt_secret, {
    expiresIn: "7d"
  });
};

// src/modules/auth/auth.service.ts
var createUser = async (payload) => {
  const { name, email, password, role } = payload;
  const allowedRoles = ["contributor", "maintainer"];
  const userRole = role || "contributor";
  if (!allowedRoles.includes(userRole)) {
    throw new Error("Invalid role");
  }
  const existingUser = await pool.query(
    `SELECT * FROM users WHERE email = $1`,
    [email]
  );
  if (existingUser.rows.length > 0) {
    throw new Error("Email already exists");
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const result = await pool.query(
    `
    INSERT INTO users(name,email,password,role)
    VALUES($1,$2,$3,$4)
    RETURNING id,name,email,role,created_at,updated_at
    `,
    [name, email, hashedPassword, userRole]
  );
  return result.rows[0];
};
var loginUser = async (payload) => {
  const { email, password } = payload;
  const result = await pool.query(`SELECT * FROM users WHERE email = $1`, [
    email
  ]);
  const user = result.rows[0];
  if (!user) {
    throw new Error("User not found");
  }
  const isPasswordMatch = await bcrypt.compare(password, user.password);
  if (!isPasswordMatch) {
    throw new Error("Invalid password");
  }
  const token = createToken({
    id: user.id,
    name: user.name,
    role: user.role
  });
  const { password: _, ...safeUser } = user;
  return {
    token,
    user: safeUser
  };
};
var authService = {
  createUser,
  loginUser
};

// src/utils/sendResponse.ts
var sendResponse = (res, data) => {
  res.status(data.statusCode).json({
    success: data.success,
    message: data.message,
    data: data.data,
    errors: data.errors
  });
};
var sendResponse_default = sendResponse;

// src/modules/auth/auth.controller.ts
var signupUser = async (req, res) => {
  try {
    const result = await authService.createUser(req.body);
    sendResponse_default(
      res,
      {
        statusCode: 201,
        success: true,
        message: "User registered successfully",
        data: result
      }
    );
  } catch (error) {
    sendResponse_default(res, {
      statusCode: 400,
      success: false,
      message: error instanceof Error ? error.message : "Something went wrong"
    });
  }
};
var loginUser2 = async (req, res) => {
  try {
    const result = await authService.loginUser(req.body);
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Login successful",
      data: result
    });
  } catch (error) {
    sendResponse_default(res, {
      statusCode: 400,
      success: false,
      message: error instanceof Error ? error.message : "Something went wrong"
    });
  }
};
var authController = {
  signupUser,
  loginUser: loginUser2
};

// src/modules/auth/auth.route.ts
var router = express.Router();
router.post("/signup", authController.signupUser);
router.post("/login", authController.loginUser);
var authRoute = router;

// src/modules/issues/issues.route.ts
import express2 from "express";

// src/middlewares/auth.middleware.ts
import jwt2 from "jsonwebtoken";
var authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "No token provided"
      });
    }
    const token = authHeader;
    const decoded = jwt2.verify(token, config_default.jwt_secret);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token"
    });
  }
};

// src/middlewares/role.middleware.ts
var roleMiddleware = (...allowedRoles) => {
  return (req, res, next) => {
    const userRole = req.user?.role;
    if (!userRole) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You don't have permission"
      });
    }
    next();
  };
};

// src/modules/issues/issues.service.ts
var createIssue = async (payload, reporter_id) => {
  const { title, description, type } = payload;
  const result = await pool.query(
    `
    INSERT INTO issues(title, description, type, reporter_id)
    VALUES($1, $2, $3, $4)
    RETURNING *
    `,
    [title, description, type, reporter_id]
  );
  return result.rows[0];
};
var getAllIssues = async (query) => {
  const { sort = "newest", status, type } = query;
  let sql = `SELECT * FROM issues`;
  const values = [];
  const conditions = [];
  if (status) {
    values.push(status);
    conditions.push(`status = $${values.length}`);
  }
  if (type) {
    values.push(type);
    conditions.push(`type = $${values.length}`);
  }
  if (conditions.length > 0) {
    sql += ` WHERE ` + conditions.join(" AND ");
  }
  if (sort === "oldest") {
    sql += ` ORDER BY created_at ASC`;
  } else {
    sql += ` ORDER BY created_at DESC`;
  }
  const result = await pool.query(sql, values);
  const issues = result.rows;
  if (issues.length === 0) {
    return [];
  }
  const reporterIds = [...new Set(issues.map((issue) => issue.reporter_id))];
  const placeholders = reporterIds.map((_, index) => `$${index + 1}`).join(",");
  const usersResult = await pool.query(
    `
    SELECT id, name, role
    FROM users
    WHERE id IN (${placeholders})
    `,
    reporterIds
  );
  const users = usersResult.rows;
  const finalData = issues.map((issue) => {
    const reporter = users.find((user) => user.id === issue.reporter_id);
    return {
      id: issue.id,
      title: issue.title,
      description: issue.description,
      type: issue.type,
      status: issue.status,
      reporter: reporter || null,
      created_at: issue.created_at,
      updated_at: issue.updated_at
    };
  });
  return finalData;
};
var getSingleIssue = async (id) => {
  const issueResult = await pool.query(
    `
    SELECT * FROM issues
    WHERE id = $1
    `,
    [id]
  );
  const issue = issueResult.rows[0];
  if (!issue) {
    throw new Error("Issue not found");
  }
  const userResult = await pool.query(
    `
    SELECT id, name, role
    FROM users
    WHERE id = $1
    `,
    [issue.reporter_id]
  );
  const reporter = userResult.rows[0];
  return {
    id: issue.id,
    title: issue.title,
    description: issue.description,
    type: issue.type,
    status: issue.status,
    reporter: reporter || null,
    created_at: issue.created_at,
    updated_at: issue.updated_at
  };
};
var updateIssue = async (issueId, payload, user) => {
  const issueResult = await pool.query(
    `
    SELECT * FROM issues
    WHERE id = $1
    `,
    [issueId]
  );
  const issue = issueResult.rows[0];
  if (!issue) {
    throw new Error("Issue not found");
  }
  if (user.role === "contributor") {
    if (issue.reporter_id !== user.id) {
      throw new Error("You can update only your own issue");
    }
    if (issue.status !== "open") {
      throw new Error("You can update only open issues");
    }
  }
  const title = payload.title || issue.title;
  const description = payload.description || issue.description;
  const type = payload.type || issue.type;
  const status = payload.status || issue.status;
  const result = await pool.query(
    `
    UPDATE issues
    SET
      title = $1,
      description = $2,
      type = $3,
      status = $4,
      updated_at = NOW()
    WHERE id = $5
    RETURNING *
    `,
    [title, description, type, status, issueId]
  );
  return result.rows[0];
};
var deleteIssue = async (issueId, user) => {
  const issueResult = await pool.query(
    `
    SELECT * FROM issues
    WHERE id = $1
    `,
    [issueId]
  );
  const issue = issueResult.rows[0];
  if (!issue) {
    throw new Error("Issue not found");
  }
  if (user.role !== "maintainer") {
    throw new Error("Only maintainer can delete issues");
  }
  await pool.query(
    `
    DELETE FROM issues
    WHERE id = $1
    `,
    [issueId]
  );
  return true;
};
var issuesService = {
  createIssue,
  getAllIssues,
  getSingleIssue,
  updateIssue,
  deleteIssue
};

// src/modules/issues/issues.controller.ts
var createIssueController = async (req, res) => {
  try {
    const result = await issuesService.createIssue(req.body, req.user.id);
    sendResponse_default(res, {
      statusCode: 201,
      success: true,
      message: "Issue created successfully",
      data: result
    });
  } catch (error) {
    sendResponse_default(res, {
      statusCode: 400,
      success: false,
      message: error instanceof Error ? error.message : "Error"
    });
  }
};
var getAllIssuesController = async (req, res) => {
  try {
    const result = await issuesService.getAllIssues(req.query);
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Issues retrieved successfully",
      data: result
    });
  } catch (error) {
    sendResponse_default(res, {
      statusCode: 500,
      success: false,
      message: error instanceof Error ? error.message : "Internal Server Error"
    });
  }
};
var getSingleIssueController = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const result = await issuesService.getSingleIssue(id);
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Issues retrieved successfully",
      data: result
    });
  } catch (error) {
    sendResponse_default(res, {
      statusCode: 404,
      success: false,
      message: error instanceof Error ? error.message : "Something went wrong"
    });
  }
};
var updateIssueController = async (req, res) => {
  try {
    const issueId = Number(req.params.id);
    const result = await issuesService.updateIssue(
      issueId,
      req.body,
      req.user
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Issue updated successfully",
      data: result
    });
  } catch (error) {
    sendResponse_default(res, {
      statusCode: 400,
      success: false,
      message: error instanceof Error ? error.message : "Something went wrong"
    });
  }
};
var deleteIssueController = async (req, res) => {
  try {
    const issueId = Number(req.params.id);
    await issuesService.deleteIssue(issueId, req.user);
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Issue deleted successfully"
    });
  } catch (error) {
    sendResponse_default(res, {
      statusCode: 403,
      success: false,
      message: error instanceof Error ? error.message : "Internal Server Error"
    });
  }
};
var issuesController = {
  createIssueController,
  getAllIssuesController,
  getSingleIssueController,
  updateIssueController,
  deleteIssueController
};

// src/modules/issues/issues.route.ts
var router2 = express2.Router();
router2.post(
  "/",
  authMiddleware,
  roleMiddleware("contributor", "maintainer"),
  issuesController.createIssueController
);
router2.get("/", issuesController.getAllIssuesController);
router2.get("/:id", issuesController.getSingleIssueController);
router2.patch("/:id", authMiddleware, issuesController.updateIssueController);
router2.delete("/:id", authMiddleware, issuesController.deleteIssueController);
var issuesRoute = router2;

// src/middlewares/globalErrorHandler.ts
var globalErrorHandler = (err, req, res, next) => {
  const error = err;
  const statusCode = error.statusCode || 500;
  const message = error.message || "Internal Server Error";
  res.status(statusCode).json({
    success: false,
    message
  });
};
var globalErrorHandler_default = globalErrorHandler;

// src/app.ts
var app = express3();
app.use(
  cors({
    origin: "http://localhost:5000"
  })
);
app.use(express3.json());
app.get("/", (req, res) => {
  res.status(200).json({ message: "DevPulse Server Running!" });
});
app.use("/api/auth", authRoute);
app.use("/api/issues", issuesRoute);
app.use(globalErrorHandler_default);
var app_default = app;

// src/server.ts
var main = async () => {
  try {
    await initDB();
    app_default.listen(config_default.port, () => {
      console.log(`Example app listening on port ${config_default.port}`);
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error("Failed to start server:", error.message);
    } else {
      console.error("Unknown startup error");
    }
  }
};
main();
//# sourceMappingURL=server.js.map