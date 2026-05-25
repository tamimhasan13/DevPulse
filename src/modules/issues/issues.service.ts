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

  // filter status
  if (status) {
    values.push(status);
    conditions.push(`status = $${values.length}`);
  }

  // filter
  if (type) {
    values.push(type);
    conditions.push(`type = $${values.length}`);
  }

  // where
  if (conditions.length > 0) {
    sql += ` WHERE ` + conditions.join(" AND ");
  }

  // sort
  if (sort === "oldest") {
    sql += ` ORDER BY created_at ASC`;
  } else {
    sql += ` ORDER BY created_at DESC`;
  }

  // get issues
  const result = await pool.query(sql, values);

  const issues = result.rows;

  //no issues
  if (issues.length === 0) {
    return [];
  }

  // get unique reporter id 
  const reporterIds = [...new Set(issues.map((issue) => issue.reporter_id))];

  // dynamic placeholders
  const placeholders = reporterIds.map((_, index) => `$${index + 1}`).join(",");

  // get reporters
  const usersResult = await pool.query(
    `
    SELECT id, name, role
    FROM users
    WHERE id IN (${placeholders})
    `,
    reporterIds,
  );

  const users = usersResult.rows;

  // marge reporter with issue
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
  // get issue
  const issueResult = await pool.query(
    `
    SELECT * FROM issues
    WHERE id = $1
    `,
    [id],
  );

  const issue = issueResult.rows[0];

  // not found
  if (!issue) {
    throw new Error("Issue not found");
  }

  // get reporter
  const userResult = await pool.query(
    `
    SELECT id, name, role
    FROM users
    WHERE id = $1
    `,
    [issue.reporter_id],
  );

  const reporter = userResult.rows[0];

  // final response
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
  // find issue
  const issueResult = await pool.query(
    `
    SELECT * FROM issues
    WHERE id = $1
    `,
    [issueId],
  );

  const issue = issueResult.rows[0];

  // not found
  if (!issue) {
    throw new Error("Issue not found");
  }

  // contributor rules
  if (user.role === "contributor") {
    
    if (issue.reporter_id !== user.id) {
      throw new Error("You can update only your own issue");
    }

    
    if (issue.status !== "open") {
      throw new Error("You can update only open issues");
    }
  }

  // update values
  const title = payload.title || issue.title;

  const description = payload.description || issue.description;

  const type = payload.type || issue.type;

  const status = payload.status || issue.status;

  // update query
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
  // find issue
  const issueResult = await pool.query(
    `
    SELECT * FROM issues
    WHERE id = $1
    `,
    [issueId],
  );

  const issue = issueResult.rows[0];

  // not found
  if (!issue) {
    throw new Error("Issue not found");
  }

  // role check maintainer
  if (user.role !== "maintainer") {
    throw new Error("Only maintainer can delete issues");
  }

  // delete
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
