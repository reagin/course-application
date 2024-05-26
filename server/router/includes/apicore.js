import { getGrades, getClasses } from "../../library/database.js";
import { insertUser, deleteUser } from "../../library/database.js";
import { execSql, resetTables, createAdmin } from "../../library/database.js";
import { queryUid, queryEmail, querySecret } from "../../library/database.js";
import { updatePwd, updateInfo, queryUserName } from "../../library/database.js";
import { insertGrade, updateGrade, deleteGrade } from "../../library/database.js";
import { insertClass, updateClass, deleteClass } from "../../library/database.js";

export async function reset(req, res) {
	const response = { status: 0, message: "Initialize Success" };

	try {
		const sessionUid = req.session.uid;
		const adminUid = await queryUid(process.env.ADMIN_USER_EMAIL);

		if (sessionUid !== adminUid)
			throw new Error("Reset Error", { cause: "Access Denied" });

		await resetTables();
		await createAdmin();

		req.session.destroy(error => {
			if (error) {
				response.status = 51;
				response.message = "Session Destory Failure";
				return res.json(response);
			}

			res.clearCookie(process.env.SESSION_SECRET);
			return res.json(response);
		});
	} catch (error) {
		response.status = error.cause === "Access Denied" ? 11 : 12;
		response.message = `${error.message}: ${error.cause}`;
		return res.json(response);
	}
}

export async function deleteuser(req, res) {
	const response = { status: 0, message: "Delete User Success" };
	const { email } = req.body;

	try {
		const sessionUid = req.session.uid;
		const adminUid = await queryUid(process.env.ADMIN_USER_EMAIL);

		if (email === process.env.ADMIN_USER_EMAIL)
			throw new Error("Admin Can't Be Deleted", { cause: "Access Denied" });

		if (sessionUid !== adminUid)
			throw new Error("Delete User Error", { cause: "Access Denied" });

		await deleteUser(email);

		return res.json(response);
	} catch (error) {
		response.status = error.cause === "Access Denied" ? 11 : 12;
		response.message = `${error.message}: ${error.cause}`;
		return res.json(response);
	}
}

export async function login(req, res) {
	const response = { status: 0, message: "Login Success" };
	const { email, secret, rememberme } = req.body;

	try {
		const uidItem = await queryUid(email);
		const secretItem = await querySecret(uidItem);

		if (!uidItem) {
			response.status = 16;
			response.message = "Invalid Email";
			return res.json(response);
		} else if (secret !== secretItem) {
			response.status = 17;
			response.message = "Invalid Password";
			return res.json(response);
		}

		req.session.regenerate(error => {
			if (error) {
				response.status = 50;
				response.message = "Session Generate Failure";
				return res.json(response);
			}

			// 由用户勾选是否记住身份，期效为一天
			if (rememberme) {
				req.session.cookie.maxAge = 24 * 60 * 60 * 1000;
			} else {
				req.session.cookie.expires = false;
			}

			req.session.uid = uidItem;
			return res.json(response);
		});
	} catch (error) {
		response.status = 12;
		response.message = `${error.message}: ${error.cause}`;
		return res.json(response);
	}
}

export async function logout(req, res) {
	const response = { status: 0, message: "Logout Success" };

	try {
		req.session.destroy(error => {
			if (error) {
				response.status = 51;
				response.message = "Session Destory Failure";
				return res.json(response);
			}

			res.clearCookie(process.env.SESSION_SECRET);
			return res.json(response);
		});
	} catch (error) {
		response.status = 10;
		response.message = "Unknow Error";
		return res.json(response);
	}
}

export async function change(req, res) {
	const response = { status: 0, message: "Reset Password Success" };
	const { secret } = req.body;

	try {
		const sessionUid = req.session.uid;
		const emailItem = await queryEmail(sessionUid);

		if (!emailItem)
			throw new Error("Reset Password Error", { cause: "Access Denied" });

		await updatePwd(emailItem, secret);

		req.session.destroy(error => {
			if (error) {
				response.status = 51;
				response.message = "Session Destory Failure";
				return res.json(response);
			}

			res.clearCookie(process.env.SESSION_SECRET);
			return res.json(response);
		});
	} catch (error) {
		response.status = error.cause === "Access Denied" ? 11 : 12;
		response.message = `${error.message}: ${error.cause}`;
		return res.json(response);
	}
}

export async function forgot(req, res) {
	const response = { status: 0, message: "Reset Password Success" };
	const { email, secret, code } = req.body;

	try {
		const uidItem = await queryUid(email);
		const emailItem = await queryEmail(uidItem); // 没错，这一步可有可无
		const secretItem = await querySecret(uidItem);
		const secretCodeItem = await execSql(`
			SELECT secretcode FROM info WHERE email='${emailItem}'
		`);

		// 这里获取用户的 secretcode 用以验证用户的身份
		// 因为...我们没有邮箱验证码服务
		const secretcode = secretCodeItem?.[0]?.secretcode;

		if (!uidItem) {
			response.status = 16;
			response.message = "Invalid Email";
			return res.json(response);
		} else if (code !== secretcode) {
			response.status = 18;
			response.message = "Invalid Secret Code";
			return res.json(response);
		} else if (secret === secretItem) {
			response.status = 17;
			response.message = "Invalid Password";
			return res.json(response);
		}

		await updatePwd(email, secret);
		return res.json(response);
	} catch (error) {
		response.status = 12;
		response.message = `${error.message}: ${error.cause}`;
		return res.json(response);
	}
}

export async function register(req, res) {
	const response = { status: 0, message: "Register Success" };
	const { username, email, secret } = req.body;

	try {
		const uidItem = await queryUid(email);

		if (uidItem) {
			response.status = 20;
			response.message = "User Already Exists";
			return res.json(response);
		}

		// 虽然，不应该相信前端传回的数据
		await insertUser(username, email, secret);
		return res.json(response);
	} catch (error) {
		response.status = 12;
		response.message = `${error.message}: ${error.cause}`;
		return res.json(response);
	}
}

export async function unregister(req, res) {
	const response = { status: 0, message: "Unregister Success" };

	try {
		const sessionUid = req.session.uid;
		const emailItem = await queryEmail(sessionUid);
		const adminUid = await queryUid(process.env.ADMIN_USER_EMAIL);

		// 管理员只能重置数据库...
		if (sessionUid === adminUid)
			throw new Error("Unregister Error", { cause: "Access Denied" });

		await deleteUser(emailItem);

		req.session.destroy(error => {
			if (error) {
				response.status = 51;
				response.message = "Session Destory Failure";
				return res.json(response);
			}

			res.clearCookie(process.env.SESSION_SECRET);
			return res.json(response);
		});
	} catch (error) {
		response.status = error.cause === "Access Denied" ? 11 : 12;
		response.message = `${error.message}: ${error.cause}`;
		return res.json(response);
	}
}

export async function update(req, res) {
	const response = { status: 0, message: "Update Info Success" };
	const { item, value } = req.body;

	try {
		const sessionUid = req.session.uid;
		const emailItem = await queryEmail(sessionUid);

		if (!emailItem) throw new Error("Update Error", { cause: "Access Denied" });

		await updateInfo(emailItem, item, value);
		return res.json(response);
	} catch (error) {
		response.status = error.cause === "Access Denied" ? 11 : 12;
		response.message = `${error.message}: ${error.cause}`;
		return res.json(response);
	}
}

export async function addgrade(req, res) {
	const response = { status: 0, message: "Create Grade Success" };
	const { gradename } = req.body;

	try {
		const sessionUid = req.session.uid;
		const emailItem = await queryEmail(sessionUid);
		const nameItem = await queryUserName(sessionUid);

		if (!nameItem)
			throw new Error("Create Grade Error", { cause: "Access Denied" });

		if (!gradename)
			throw new Error("Create Grade Error", { cause: "Error Value" });

		await insertGrade(nameItem, gradename);
		await updateInfo(emailItem, "gradename", gradename);
		return res.json(response);
	} catch (error) {
		response.status = error.cause === "Access Denied" ? 11 : 12;
		response.message = `${error.message}: ${error.cause}`;
		return res.json(response);
	}
}

export async function updategrade(req, res) {
	const response = { status: 0, message: "Update Grade Success" };
	const { oldgradename, newgradename } = req.body;

	try {
		const sessionUid = req.session.uid;
		const emailItem = await queryEmail(sessionUid);
		const nameItem = await queryUserName(sessionUid);

		if (!nameItem)
			throw new Error("Update Grade Error", { cause: "Access Denied" });

		if (!gradename)
			throw new Error("Update Grade Error", { cause: "Error Value" });

		await updateGrade(nameItem, oldgradename, newgradename);
		await updateInfo(emailItem, "gradename", newgradename);
		return res.json(response);
	} catch (error) {
		response.status = error.cause === "Access Denied" ? 11 : 12;
		response.message = `${error.message}: ${error.cause}`;
		return res.json(response);
	}
}

export async function removegrade(req, res) {
	const response = { status: 0, message: "Remove Grade Success" };
	const { gradename } = req.body;

	try {
		const sessionUid = req.session.uid;
		const emailItem = await queryEmail(sessionUid);
		const nameItem = await queryUserName(sessionUid);

		if (!nameItem)
			throw new Error("Remove Grade Error", { cause: "Access Denied" });

		if (!gradename)
			throw new Error("Remove Grade Error", { cause: "Error Value" });

		await deleteGrade(nameItem, gradename);
		const gradeItems = await getGrades(nameItem);
		await updateInfo(emailItem, "gradename", gradeItems[0] ?? null);
		return res.json(response);
	} catch (error) {
		response.status = error.cause === "Access Denied" ? 11 : 12;
		response.message = `${error.message}: ${error.cause}`;
		return res.json(response);
	}
}

// response.data 获取数据
export async function getclasses(req, res) {
	const response = { status: 0, message: "Query Classes Success" };
	const { gradename } = req.body;

	try {
		const sessionUid = req.session.uid;
		const nameItem = await queryUserName(sessionUid);
		const data = await getClasses(nameItem, gradename);

		response.data = data;
		return res.json(response);
	} catch (error) {
		response.status = 12;
		response.message = `${error.message}: ${error.cause}`;
		return res.json(response);
	}
}

export async function addclass(req, res) {
	const response = { status: 0, message: "Add Class Success" };
	const { gradename, classname, starttoend, address, teachername } = req.body;

	try {
		const sessionUid = req.session.uid;
		const nameItem = await queryUserName(sessionUid);

		if (!nameItem)
			throw new Error("Add Class Error", { cause: "Access Denied" });

		if (!(gradename && classname && starttoend))
			throw new Error("Add Class Error", { cause: "Error Value" });

		await insertClass(
			nameItem,
			gradename,
			classname,
			starttoend,
			address,
			teachername
		);

		return res.json(response);
	} catch (error) {
		response.status = error.cause === "Access Denied" ? 11 : 12;
		response.message = `${error.message}: ${error.cause}`;
		return res.json(response);
	}
}

export async function updateclass(req, res) {
	const response = { status: 0, message: "Update Class Success" };
	const { gradename, oldclassname, classname, starttoend, address, teachername } =
		req.body;

	try {
		const sessionUid = req.session.uid;
		const nameItem = await queryUserName(sessionUid);

		if (!nameItem)
			throw new Error("Update Class Error", { cause: "Access Denied" });

		if (!(gradename && classname && starttoend))
			throw new Error("Update Class Error", { cause: "Error Value" });

		await updateClass(
			nameItem,
			gradename,
			oldclassname,
			classname,
			starttoend,
			address,
			teachername
		);

		return res.json(response);
	} catch (error) {
		response.status = error.cause === "Access Denied" ? 11 : 12;
		response.message = `${error.message}: ${error.cause}`;
		return res.json(response);
	}
}

export async function removeclass(req, res) {
	const response = { status: 0, message: "Remove Class Success" };
	const { gradename, classname } = req.body;

	try {
		const sessionUid = req.session.uid;
		const nameItem = await queryUserName(sessionUid);

		if (!nameItem)
			throw new Error("Remove Class Error", { cause: "Access Denied" });

		if (!(gradename && classname))
			throw new Error("Remove Class Error", { cause: "Error Value" });

		await deleteClass(nameItem, gradename, classname);

		return res.json(response);
	} catch (error) {
		response.status = error.cause === "Access Denied" ? 11 : 12;
		response.message = `${error.message}: ${error.cause}`;
		return res.json(response);
	}
}

// req.session.uid
// regenerate: login
// destroy: reset, logout, change, unregister
// none: deleteuser, forgot, register, update, addgrade, updategrade, removegrade
// 		addclass, updateclass, removeclass, getclasses
export default {
	addclass,
	addgrade,
	change,
	deleteuser,
	forgot,
	getclasses,
	login,
	logout,
	register,
	removeclass,
	removegrade,
	reset,
	unregister,
	update,
	updateclass,
	updategrade,
};
