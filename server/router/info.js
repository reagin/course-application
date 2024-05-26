import { queryUid, queryEmail, queryUserName } from "../library/database.js";
import { execSql, getGrades } from "../library/database.js";
import { sha256 } from "../library/cipher.js";
import express from "express";

function getGravatarURL(email) {
	return `https://www.gravatar.com/avatar/${sha256(email)}`;
}

async function getUsers() {
	const items = await execSql(
		`SELECT * FROM info WHERE email<>'${process.env.ADMIN_USER_EMAIL}'`
	);
	return items;
}

async function getUserInfo(email) {
	const items = await execSql(`SELECT * FROM info WHERE email='${email}'`);
	return items?.[0];
}

async function getUserGrades(username) {
	const gradeItems = await getGrades(username);
	return gradeItems;
}

// 获取最终的数据结果
async function getInformation(sessionUid) {
	let result = {};
	const adminUid = await queryUid(process.env.ADMIN_USER_EMAIL);
	const userIsAdmin = sessionUid === adminUid;

	const emailItem = await queryEmail(sessionUid);
	const nameItem = await queryUserName(sessionUid);
	const userInfo = await getUserInfo(emailItem);
	const userAvatarUrl = getGravatarURL(emailItem);

	result.isAdmin = userIsAdmin;
	result.avatarurl = userAvatarUrl;
	result.sex = userInfo.sex;
	result.email = userInfo.email;
	result.username = userInfo.username;
	result.secretcode = userInfo.secretcode;

	if (userIsAdmin) {
		const userItems = await getUsers();
        
		result.userItems = userItems;
	} else {
		const userGrades = await getUserGrades(nameItem);

		result.gradeItems = userGrades;
		result.currentGrade = userInfo.gradename;
		result.classnum = {
			anum: userInfo.anum,
			pnum: userInfo.pnum,
			nnum: userInfo.nnum,
		};
	}

	return result;
}

// #NOTE 分割线 #NOTE

const infoRouter = express.Router();

infoRouter.get("/", async (req, res) => {
	const userdata = await getInformation(req.session.uid);
	res.render("info", userdata);
});

export default infoRouter;
