import { sha256, randomStr } from "./cipher.js";
import { mysqlConfig } from "../../config.js";
import mysql from "mysql";

function queryMysql(queryString) {
	return new Promise((resolve, reject) => {
		if (typeof queryString !== "string") {
			reject(new Error("Type Error", { cause: "Query Params Type Error" }));
		}

		const connection = mysql.createConnection(mysqlConfig);

		connection.connect(error => {
			if (error) reject(new Error("Connect Error", { cause: error.code }));
		});

		connection.query(queryString.trim(), (error, result) => {
			if (error) reject(new Error("Syntax Error", { cause: error.code }));
			resolve(result);
		});

		connection.end(error => {
			if (error) reject(new Error("Disconnect Error", { cause: error.code }));
		});
	});
}

/**
 * 创建表 class, grade, users, info
 */
async function createTables() {
	try {
		await execSql(`
			CREATE TABLE IF NOT EXISTS users (
				email VARCHAR(255) NOT NULL PRIMARY KEY,
				secret CHAR(64) NOT NULL CHECK (LENGTH(secret) = 64 ),
				uid CHAR(64) NOT NULL CHECK (LENGTH(uid) = 64 ) 
			)`);
		await execSql(`
			CREATE TABLE IF NOT EXISTS info (
				username VARCHAR(255) NOT NULL PRIMARY KEY,
				email VARCHAR(255) NOT NULL UNIQUE KEY,
				secretcode VARCHAR(255) NOT NULL,
				gradename VARCHAR(255) DEFAULT NULL,
				sex VARCHAR(8) DEFAULT 'male' CHECK (sex IN ( 'male', 'female' )),
				anum TINYINT NOT NULL DEFAULT 5 CHECK (anum < 10 ),
				pnum TINYINT NOT NULL DEFAULT 4 CHECK (pnum < 10 ),
				nnum TINYINT NOT NULL DEFAULT 3 CHECK (nnum < 10 ),
				created DATE DEFAULT (CURRENT_DATE) 
			)`);
		await execSql(`
			CREATE TABLE IF NOT EXISTS grade ( 
				username VARCHAR(255) NOT NULL,
				gradename VARCHAR(255) NOT NULL,
				PRIMARY KEY (username, gradename)
			)`);
		await execSql(`
			CREATE TABLE IF NOT EXISTS class (
				username VARCHAR(255) NOT NULL,
				gradename VARCHAR(255) NOT NULL,
				classname VARCHAR(255) NOT NULL,
				starttoend VARCHAR(255) NOT NULL,
				address VARCHAR(255),
				teachername VARCHAR(255),
				PRIMARY KEY (username, gradename, classname),
				FOREIGN KEY(username, gradename)
				REFERENCES grade(username,gradename)
				ON UPDATE CASCADE
				ON DELETE CASCADE
			)`);
	} catch (error) {
		throw new Error("Create Tables Error", { cause: error.cause });
	}
}

/**
 * 创建触发器 insert_class_record, delete_user_record, update_info_record
 */
async function createTriggers() {
	try {
		// 如果存在触发器，先删除触发器
		await execSql(`DROP TRIGGER IF EXISTS insert_class_record`);
		await execSql(`DROP TRIGGER IF EXISTS delete_user_record`);
		await execSql(`DROP TRIGGER IF EXISTS update_info_record`);
		// 正常情况下，是不会运行第二遍触发器创建的
		// 一般来说仅有创建表和触发器之后，直接操作数据库才有可能二次创建
		await execSql(`
			CREATE TRIGGER insert_class_record
			BEFORE INSERT ON class FOR EACH ROW
			BEGIN
				DECLARE gradecount TINYINT;
				SELECT COUNT(*) INTO gradecount FROM grade 
				WHERE username = NEW.username AND gradename = NEW.gradename;
				IF (gradecount = 0) THEN 
					INSERT INTO grade(username, gradename)
					VALUE (NEW.username, NEW.gradename);
    			END IF;
			END`);
		await execSql(`
			CREATE TRIGGER delete_user_record
			BEFORE DELETE ON users FOR EACH ROW
			BEGIN
				DECLARE nameitem VARCHAR(255);
				SELECT username INTO nameitem FROM info WHERE email = OLD.email;
				IF nameitem IS NOT NULL THEN
					DELETE FROM info WHERE username = nameitem;
					DELETE FROM grade WHERE username = nameitem;
				END IF;
			END`);
		await execSql(`
			CREATE TRIGGER update_info_record
			BEFORE UPDATE ON info FOR EACH ROW
			BEGIN
				IF NEW.email != OLD.email THEN
					UPDATE users SET email = NEW.email
					WHERE email = OLD.email;
				END IF;
				IF NEW.username != OLD.username THEN
					UPDATE grade SET username = NEW.username
					WHERE username = OLD.username;
					UPDATE class SET username = NEW.username
					WHERE username = OLD.username;
				END IF;
			END`);
	} catch (error) {
		throw new Error("Create Triggers Error", { cause: error.cause });
	}
}

/**
 * 执行 SQL 语句，返回运行结果
 * @param {string} queryString
 * @returns Array
 */
export async function execSql(queryString) {
	try {
		const result = await queryMysql(queryString);
		return result;
	} catch (error) {
		throw new Error(error.message, { cause: error.cause });
	}
}

/**
 * 清除 application 下所有表的数据
 */
export async function resetTables() {
	try {
		let tables = await execSql("SHOW TABLES");

		await execSql(`SET FOREIGN_KEY_CHECKS = 0`);
		tables.forEach(async element => {
			const tableName = Object.values(element)[0];
			await execSql(`DELETE FROM ${tableName}`);
		});
		await execSql(`SET FOREIGN_KEY_CHECKS = 1`);
	} catch (error) {
		throw new Error("Reset Tables Error", { cause: error.cause });
	}
}

/**
 * 创建管理员账户，并添加至 user 表中
 */
export async function createAdmin() {
	try {
		const email = process.env.ADMIN_USER_EMAIL;
		const secret = process.env.ADMIN_USER_SECRET;

		await insertUser("root", email, sha256(secret));
	} catch (error) {
		throw new Error("Create Admin Error", { cause: error.cause });
	}
}

/**
 * 初始化数据库，确保表中存在管理员账户
 */
export async function initDatabase() {
	try {
		const tables = await execSql(`SHOW TABLES`);

		if (tables.length === 0) {
			await createTables();
			await createTriggers();
			await createAdmin();
		} else {
			const uidItem = await queryUid(process.env.ADMIN_USER_EMAIL);
			if (uidItem) return;
			await resetTables();
			await createAdmin();
		}
	} catch (error) {
		if (error.cause === "ECONNREFUSED") {
			throw new Error("Service Not Start", { cause: error.cause });
		} else {
			throw new Error(error.message, { cause: error.cause });
		}
	}
}

// #NOTE 内部分界线 #NOTE //

/**
 * 通过 email 返回 uid，如果 email 不存在则返回 undefined
 * @param {string} email
 * @returns string | undefined
 */
export async function queryUid(email) {
	try {
		const userItem = await execSql(`
			SELECT uid FROM users WHERE email = '${email}'
		`);
		return userItem?.[0]?.uid; //使用空值运算符，避免空值取值
	} catch (error) {
		throw new Error(error.message, { cause: error.cause });
	}
}

/**
 * 通过 uid 返回 email，如果 uid 不存在则返回 undefined
 * @param {string} uid
 * @returns string | undefined
 */
export async function queryEmail(uid) {
	try {
		const userItem = await execSql(`
			SELECT email FROM users WHERE uid = '${uid}'
		`);
		return userItem?.[0]?.email;
	} catch (error) {
		throw new Error(error.message, { cause: error.cause });
	}
}

/**
 * 通过 uid 返回 secret，如果 uid 不存在则返回 undefined
 * @param {string} uid
 * @returns string | undefined
 */
export async function querySecret(uid) {
	try {
		const userItem = await execSql(`
			SELECT secret FROM users WHERE uid = '${uid}'
		`);
		return userItem?.[0]?.secret;
	} catch (error) {
		throw new Error(error.message, { cause: error.cause });
	}
}

/**
 * 通过 uid 返回 username，如果 uid 不存在则返回 undefined
 * @param {string} uid
 * @returns string | undefined
 */
export async function queryUserName(uid) {
	try {
		const emailItem = await queryEmail(uid);
		const nameItem = await execSql(`
			SELECT username FROM info WHERE email = '${emailItem}'
		`);

		return nameItem?.[0]?.username;
	} catch (error) {
		throw new Error(error.message, { cause: error.cause });
	}
}

/**
 * 新增一条用户数据
 * @param {string} username
 * @param {string} email
 * @param {string} hashedSecret encrypted by sha256
 */
export async function insertUser(username, email, hashedSecret) {
	try {
		const mixStr = [email, hashedSecret, randomStr(6)].join(":");

		await execSql(`
			INSERT INTO users ( email, secret, uid )
			VALUE ('${email}', '${hashedSecret}','${sha256(mixStr)}')
		`);
		// 默认的 secretcode 为账户的邮箱，登陆后可以更改
		await execSql(`
			INSERT INTO info ( username, email, secretcode ) 
			VALUE ('${username}', '${email}', '${email}')
		`);
	} catch (error) {
		throw new Error(error.message, { cause: error.cause });
	}
}

/**
 * 通过用户的 email，删除用户以及用户相关的信息
 * @param {string} email
 */
export async function deleteUser(email) {
	try {
		await execSql(`
			DELETE FROM users WHERE email='${email}'
		`);
	} catch (error) {
		throw new Error(error.message, { cause: error.cause });
	}
}

/**
 * 通过 username 返回用户所有的 gradename
 * @param {string} username
 * @returns [...items]
 */
export async function getGrades(username) {
	try {
		let result = [];
		const gradeItems = await execSql(`
			SELECT gradename FROM grade WHERE username = '${username}'
		`);

		gradeItems.forEach(element => {
			result.push(Object.values(element)?.[0]);
		});

		return result.sort((a, b) => {
			return a.localeCompare(b, "zh");
		});
	} catch (error) {
		throw new Error(error.message, { cause: error.cause });
	}
}

/**
 * 向用户新增一条学期数据
 * @param {string} username
 * @param {string} gradename
 */
export async function insertGrade(username, gradename) {
	try {
		await execSql(`
			INSERT INTO grade ( username, gradename )
			VALUE ('${username}', '${gradename}')
		`);
	} catch (error) {
		throw new Error(error.message, { cause: error.cause });
	}
}

/**
 * 将由 username, gradename 确定的 gradename 更新
 * @param {string} username
 * @param {string} gradename
 * @param {string} newgradename
 */
export async function updateGrade(username, gradename, newgradename) {
	try {
		await execSql(`
			UPDATE grade SET gradename='${newgradename}'
			WHERE username='${username}' AND gradename='${gradename}'
		`);
	} catch (error) {
		throw new Error(error.message, { cause: error.cause });
	}
}

/**
 * 删除用户的一条学期数据
 * @param {string} username
 * @param {string} gradename
 */
export async function deleteGrade(username, gradename) {
	try {
		await execSql(`
			DELETE FROM grade
			WHERE username='${username}' AND gradename='${gradename}'
		`);
	} catch (error) {
		throw new Error(error.message, { cause: error.cause });
	}
}

/**
 * 通过 username, gradename 返回用户的课表信息
 * @param {string} username
 * @param {string} gradename
 * @returns [...items]
 */
export async function getClasses(username, gradename) {
	try {
		const classItems = await execSql(`
			SELECT * FROM class
			WHERE username='${username}' AND gradename='${gradename}'
		`);
		return classItems;
	} catch (error) {
		throw new Error(error.message, { cause: error.cause });
	}
}

/**
 * 新增一条课程信息
 * @param {string} username
 * @param {string} gradename
 * @param {string} classname
 * @param {string} starttoend
 * @param {string} address
 * @param {string} teachername
 */
export async function insertClass(
	username,
	gradename,
	classname,
	starttoend,
	address,
	teachername
) {
	try {
		(address ??= null), (teachername ??= null);

		await execSql(`
			INSERT INTO class VALUE ('${username}', '${gradename}', 
			'${classname}', '${starttoend}', '${address}', '${teachername}')
		`);
	} catch (error) {
		throw new Error(error.message, { cause: error.cause });
	}
}

/**
 * 更新一条课程信息
 * @param {string} username
 * @param {string} gradename
 * @param {string} oldclassname
 * @param {string} classname
 * @param {string} starttoend
 * @param {string} address
 * @param {string} teachername
 */
export async function updateClass(
	username,
	gradename,
	oldclassname,
	classname,
	starttoend,
	address,
	teachername
) {
	try {
		(address ??= null), (teachername ??= null);

		await execSql(`
			UPDATE class SET classname='${classname}', starttoend='${starttoend}', 
				address='${address}', teachername='${teachername}'
			WHERE username='${username}' AND gradename='${gradename}' AND classname='${oldclassname}'
		`);
	} catch (error) {
		throw new Error(error.message, { cause: error.cause });
	}
}

/**
 * 删除一条课程信息
 * @param {string} username
 * @param {string} gradename
 * @param {string} classname
 */
export async function deleteClass(username, gradename, classname) {
	try {
		await execSql(`
			DELETE FROM class
			WHERE username='${username}' AND gradename='${gradename}' AND 
				classname='${classname}'
		`);
	} catch (error) {
		throw new Error(error.message, { cause: error.cause });
	}
}

/**
 * 更新用户的 secret，并重新计算保存 uid
 * @param {string} email
 * @param {string} hashedSecret encrypted by sha256
 */
export async function updatePwd(email, hashedSecret) {
	try {
		const mixStr = [email, hashedSecret, randomStr(6)].join(":");

		await execSql(`
			UPDATE users SET secret='${hashedSecret}', uid='${sha256(mixStr)}' 
			WHERE email = '${email}'
		`);
	} catch (error) {
		throw new Error(error.message, { cause: error.cause });
	}
}

/**
 * 通过用户的 email 更新对应用户的 item 数值为新的 value
 * @param {string} email
 * @param {string} item
 * @param {string | number} value
 */
export async function updateInfo(email, item, value) {
	try {
		if (value === null || typeof value === "number") {
			await execSql(`
				UPDATE info SET ${item}=${value}
				WHERE email = '${email}'
			`);
		} else {
			await execSql(`
				UPDATE info SET ${item}='${value}'
				WHERE email = '${email}'
			`);
		}
	} catch (error) {
		throw new Error(error.message, { cause: error.cause });
	}
}
