import crypto from "crypto";

/**
 * 返回 plainText 对应的 sha256 摘要
 * @param {string} plainText 
 * @returns string
 */
export function sha256(plainText) {
	const hash = crypto.createHash("sha256");
	const plain = String(plainText).trim().toLowerCase();

	return hash.update(plain, "utf8").digest("hex");
}

/**
 * 返回指定 length 的字符串
 * @param {Integer} length 
 * @returns string
 */
export function randomStr(length) {
	length ??= 0;
	let result = [];
	let unit = Math.floor(length % 10);
	let decade = Math.floor(length / 10);

	for (let i = 0; i < decade; i++) {
		result.push(Math.random().toString(36).slice(2, 12));
	}

	result.push(
		Math.random()
			.toString(36)
			.slice(2, 2 + unit)
	);

	return result.join("");
}

export default { sha256, randomStr };
