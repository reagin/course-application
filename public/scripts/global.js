const sha256 = plaintext => {
	let hash = CryptoJS.SHA256(plaintext);
	return hash.toString(CryptoJS.enc.Hex);
};

const toast = Swal.mixin({
	toast: true,
	timer: 2000,
	width: "auto",
	position: "center",
	timerProgressBar: false,
	showConfirmButton: false,
	didOpen: toast => {
		toast.addEventListener("mouseenter", Swal.stopTimer);
		toast.addEventListener("mouseleave", Swal.resumeTimer);
	},
});

/**
 * 显示提示信息 (success 或者 error)
 */
const message = {
	error: information => {
		toast.fire({ icon: "error", text: information });
	},
	success: information => {
		toast.fire({ icon: "success", text: information });
	},
};

/**
 * 处理 api 接口的响应，并执行对应的回调函数
 * @param {response} data 
 * @param {function} callback 
 */
const resolveData = function (data, callback) {
	if (data.status === 0) {
		message.success(data.message);
		setTimeout(() => {
			callback();
		}, 2000);
	} else {
		message.error(data.message);
	}
};