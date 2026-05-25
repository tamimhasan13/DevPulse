import express, {
  type Application,
  type Request,
  type Response,
} from "express";
import cors from "cors";
import { authRoute } from "./modules/auth/auth.route";
import { issuesRoute } from "./modules/issues/issues.route";


const app: Application = express();

app.use(cors());
app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res
    .status(200)
    .json({ message: "DevPulse Server Running!"});
});
app.use("/api/auth", authRoute);
app.use("/api/issues", issuesRoute);

export default app;
