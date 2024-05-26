import apiFunction from "./includes/apicore.js";
import express from "express";

const apiRouter = express.Router();

// Not require session.uid can access
// {email: string, secret: sha256(string), rememberme: boolean}
apiRouter.post("/login", apiFunction.login);

// {email: string, secret: sha256(string)， code: string}
apiRouter.post("/forgot", apiFunction.forgot);

// {username: string, email: string, secret: sha256(string)}
apiRouter.post("/register", apiFunction.register);


// Require session.uid to access
// void
apiRouter.post("/reset", apiFunction.reset);

// void
apiRouter.post("/logout", apiFunction.logout);

// void
apiRouter.post("/unregister", apiFunction.unregister);

// {email: string}
apiRouter.post("/deleteuser", apiFunction.deleteuser);

// {secret: sha256(string)}
apiRouter.post("/change", apiFunction.change);

// {item: string, value: string | number}
apiRouter.post("/update", apiFunction.update);

// {gradename: string}
apiRouter.post("/addgrade", apiFunction.addgrade);

// {oldgradename: string, newgradename: string}
apiRouter.post("/updategrade", apiFunction.updategrade);

// {gradename: string}
apiRouter.post("/removegrade", apiFunction.removegrade);

// {gradename: string}
apiRouter.post("/getclasses", apiFunction.getclasses);

// {gradename: string, classname: string, starttoend: string,
//  address: string, teachername: string}
apiRouter.post("/addclass", apiFunction.addclass);

// {gradename: string, oldclassname: string, classname: string, 
// starttoend: string, address: string, teachername: string}
apiRouter.post("/updateclass", apiFunction.updateclass);

// {gradename: string, classname: string}
apiRouter.post("/removeclass", apiFunction.removeclass);

export default apiRouter;
