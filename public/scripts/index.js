// 切换忘记密码界面
$(".login-forgot").on("click", event => {
	$(".wrapper").addClass("active-forgot");
});
$(".forgot-login").on("click", event => {
	$(".wrapper").removeClass("active-forgot");
});
// 切换注册界面
$(".login-register").on("click", event => {
	$(".wrapper").addClass("active-register");
});
$(".register-login").on("click", event => {
	$(".wrapper").removeClass("active-register");
});

// 登陆界面显示密码
$("span.icon-lock").on("click", function (event) {
	let icon = $(this).children("ion-icon");
	let input = $(this).siblings("input.input-secret");

	if (icon.attr("name") === "lock-closed") {
		icon.attr("name", "lock-open");
		input.attr("type", "text");
	} else {
		icon.attr("name", "lock-closed");
		input.attr("type", "password");
	}
});

// 实现忘记密码重置功能
$("#form-forgot").submit(async function (event) {
	event.preventDefault();
	Swal.showLoading();

	let emailItem = $(this).find(".input-email").val();
	let secretItem = $(this).find(".input-secret").val();
	let codeItem = $(this).find(".input-code").val();

	// 本地加密密码，用于与库中的数值进行比较
	secretItem = sha256(secretItem);

	const { data } = await axios.post(this.action, {
		email: emailItem,
		secret: secretItem,
		code: codeItem,
	});

	if (data.status === 0) {
		message.success(data.message);
		setTimeout(() => {
			history.go(0);
		}, 2000);
	} else {
		message.error(data.message);
	}
});

// 实现登录功能
$("#form-login").submit(async function (event) {
	event.preventDefault();
	Swal.showLoading();

	let emailItem = $(this).find(".input-email").val();
	let secretItem = $(this).find(".input-secret").val();
	let remembermeItem = $(this).find(".input-rememberme").prop("checked");

	secretItem = sha256(secretItem);

	const { data } = await axios.post(this.action, {
		email: emailItem,
		secret: secretItem,
		rememberme: remembermeItem,
	});

	if (data.status === 0) {
		message.success(data.message);
		setTimeout(() => {
			history.go(0);
		}, 2000);
	} else {
		message.error(data.message);
	}
});

// 实现注册功能
$("#form-register").submit(async function (event) {
	event.preventDefault();
	Swal.showLoading();

	let usernameItem = $(this).find(".input-username").val();
	let emailItem = $(this).find(".input-email").val();
	let secretItem = $(this).find(".input-secret").val();
	let agreeItem = $(this).find(".input-agree").prop("checked");

	if (!agreeItem) return;
	secretItem = sha256(secretItem);

	const { data } = await axios.post(this.action, {
		username: usernameItem,
		email: emailItem,
		secret: secretItem,
	});

	if (data.status === 0) {
		message.success(data.message);
		setTimeout(() => {
			history.go(0);
		}, 2000);
	} else {
		message.error(data.message);
	}
});
