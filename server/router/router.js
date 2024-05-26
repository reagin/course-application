import apiRouter from "./api.js";
import infoRouter from "./info.js";

function checkStatus(req, res, next) {
	const uid = req.session?.uid;
	const pathname = req.url.split("?").slice(0, 1).shift();
	const allowArr = ["/", "/index", "/error"];
	const allowPost = ["/api/login", "/api/forgot", "/api/register"];

	if (uid || allowArr.includes(pathname)) {
		return next();
	} else if (/^\/public.*\..+$/.test(pathname)) {
		return next();
	} else if (req.method === "POST" && allowPost.includes(pathname)) {
		return next();
	} else {
		res.redirect("/error");
	}
}

export { apiRouter, infoRouter, checkStatus };
