export interface ICreateIssue {
  title: string;
  description: string;
  type: "bug" | "feature_request";
}

export interface IGetIssueQuery {
  sort?: "newest" | "oldest";
  status?: "open" | "in_progress" | "resolved";
  type?: "bug" | "feature_request";
}
export interface IUpdateIssue {
  title?: string;
  description?: string;
  type?: "bug" | "feature_request";
  status?: "open" | "in_progress" | "resolved";
}