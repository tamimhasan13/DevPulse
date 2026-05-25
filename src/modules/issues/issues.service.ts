import { pool } from "../../db";
import type { JwtPayload } from "../../type/jwt.type";
import type { ICreateIssue, IGetIssueQuery, IUpdateIssue } from "./issues.interface";

 const createIssue = async (payload: ICreateIssue, reporter_id: number) => {
  const { title, description, type } = payload;

  const result = await pool.query(
    `
    INSERT INTO issues(title, description, type, reporter_id)
    VALUES($1, $2, $3, $4)
    RETURNING *
    `,
    [title, description, type, reporter_id],
  );

  return result.rows[0];
};
const getAllIssues = async (query: IGetIssueQuery) => {
  const { sort = "newest", status, type } = query;

  let sql = `SELECT * FROM issues`;

  const values: string[] = [];
  const conditions: string[] = [];

  // FILTER: status
  if (status) {
    values.push(status);
    conditions.push(`status = $${values.length}`);
  }

  // FILTER: type
  if (type) {
    values.push(type);
    conditions.push(`type = $${values.length}`);
  }

  // WHERE
  if (conditions.length > 0) {
    sql += ` WHERE ` + conditions.join(" AND ");
  }

  // SORT
  if (sort === "oldest") {
    sql += ` ORDER BY created_at ASC`;
  } else {
    sql += ` ORDER BY created_at DESC`;
  }

  // GET ISSUES
  const result = await pool.query(sql, values);

  const issues = result.rows;

  // NO ISSUES
  if (issues.length === 0) {
    return [];
  }

  // GET UNIQUE REPORTER IDS
  const reporterIds = [...new Set(issues.map((issue) => issue.reporter_id))];

  // DYNAMIC PLACEHOLDERS
  const placeholders = reporterIds.map((_, index) => `$${index + 1}`).join(",");

  // GET REPORTERS
  const usersResult = await pool.query(
    `
    SELECT id, name, role
    FROM users
    WHERE id IN (${placeholders})
    `,
    reporterIds,
  );

  const users = usersResult.rows;

  // MERGE REPORTER WITH ISSUE
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
      updated_at: issue.updated_at,
    };
  });

  return finalData;
};
const getSingleIssue = async (id: number) => {
  // GET ISSUE
  const issueResult = await pool.query(
    `
    SELECT * FROM issues
    WHERE id = $1
    `,
    [id],
  );

  const issue = issueResult.rows[0];

  // NOT FOUND
  if (!issue) {
    throw new Error("Issue not found");
  }

  // GET REPORTER
  const userResult = await pool.query(
    `
    SELECT id, name, role
    FROM users
    WHERE id = $1
    `,
    [issue.reporter_id],
  );

  const reporter = userResult.rows[0];

  // FINAL RESPONSE
  return {
    id: issue.id,
    title: issue.title,
    description: issue.description,
    type: issue.type,
    status: issue.status,

    reporter: reporter || null,

    created_at: issue.created_at,
    updated_at: issue.updated_at,
  };
};
const updateIssue = async (
  issueId: number,
  payload: IUpdateIssue,
  user: JwtPayload,
) => {
  // FIND ISSUE
  const issueResult = await pool.query(
    `
    SELECT * FROM issues
    WHERE id = $1
    `,
    [issueId],
  );

  const issue = issueResult.rows[0];

  // NOT FOUND
  if (!issue) {
    throw new Error("Issue not found");
  }

  // CONTRIBUTOR RULES
  if (user.role === "contributor") {
    // own issue only
    if (issue.reporter_id !== user.id) {
      throw new Error("You can update only your own issue");
    }

    // only open issue
    if (issue.status !== "open") {
      throw new Error("You can update only open issues");
    }
  }

  // UPDATE VALUES
  const title = payload.title || issue.title;

  const description = payload.description || issue.description;

  const type = payload.type || issue.type;

  const status = payload.status || issue.status;

  // UPDATE QUERY
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
    [title, description, type, status, issueId],
  );

  return result.rows[0];
};
const deleteIssue = async (issueId: number, user: JwtPayload) => {
  // FIND ISSUE
  const issueResult = await pool.query(
    `
    SELECT * FROM issues
    WHERE id = $1
    `,
    [issueId],
  );

  const issue = issueResult.rows[0];

  // NOT FOUND
  if (!issue) {
    throw new Error("Issue not found");
  }

  // ROLE CHECK (ONLY MAINTAINER)
  if (user.role !== "maintainer") {
    throw new Error("Only maintainer can delete issues");
  }

  // DELETE
  await pool.query(
    `
    DELETE FROM issues
    WHERE id = $1
    `,
    [issueId],
  );

  return true;
};
export const issuesService = {
  createIssue,
  getAllIssues,
  getSingleIssue,
  updateIssue,
  deleteIssue,
};
