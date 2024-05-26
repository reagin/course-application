import { apiRouter, infoRouter, checkStatus } from "./router/router.js";
import { initDatabase } from "./library/database.js";
import { sessionConfig } from "../config.js";
import session from "express-session";
import express from "express";
import path from "path";

await initDatabase();

const app = express();
const port = 3000;

app.set("view engine", "pug");
app.set("views", path.resolve(import.meta.dirname, "./views"));
app.use(express.urlencoded({ extended: true }));
app.use(session(sessionConfig));
app.use(express.json());
app.use(checkStatus);

app.get(/^(\/|\/index)$/, (req, res) => {
	if (req.session.uid) {
		res.redirect("/info");
	} else {
		res.render("index");
	}
});

app.use("/public", express.static(path.resolve(import.meta.dirname, "../public")));
app.use("/info", infoRouter);
app.use("/api", apiRouter);
app.use("*", (req, res) => {
	res.status(404).render("error");
});

app.listen(port, () => {
	console.log(`Server is running at http://127.0.0.1:${port}`);
});
