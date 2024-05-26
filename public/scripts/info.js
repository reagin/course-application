// 用户信息修改
$(".users span").click(async function () {
	const itemName = $(this).attr("class");
	const tagName = `${itemName[0].toUpperCase()}${itemName.substring(1)}`;

	Swal.fire({
		title: `Enter ${tagName} Here`,
		input: "text",
		showCancelButton: true,
		inputValidator: value => {
			if (!value) {
				return "You need to write something!";
			} else if (itemName === "sex") {
				return "Gender must be male or female";
			}
		},
	}).then(async result => {
		if (!result.isConfirmed) return;

		const { data } = await axios.post("/api/update", {
			item: itemName,
			value: result.value,
		});

		resolveData(data, () => {
			history.go(0);
		});
	});
});

// 用户年级修改
let previousValue;

$('select[name="gradename"]').on("mousedown", function (event) {
	previousValue = $(this).val();

	if (
		previousValue !== "create" &&
		previousValue !== "rename" &&
		previousValue !== "remove"
	)
		return;

	// 取消添加，删除时的默认事件
	event.preventDefault();
	// 此处处理初始时，学期为空的情况
	if (previousValue === "create") {
		Swal.fire({
			title: `Enter New Grade Name`,
			input: "text",
			showCancelButton: true,
			inputValidator: value => {
				if (!value) {
					return "You need to write something!";
				}
			},
		}).then(async result => {
			if (!result.isConfirmed) return;

			const { data } = await axios.post("/api/addgrade", {
				gradename: result.value,
			});

			resolveData(data, () => {
				history.go(0);
			});
		});
	}
});

$('select[name="gradename"]').on("change", async function () {
	const currentValue = $(this).val();

	if (currentValue === "create") {
		// 在点击创建时，不更换当前学期，
		$(this).val(previousValue);

		Swal.fire({
			title: `Enter New Grade Name`,
			input: "text",
			showCancelButton: true,
			inputValidator: value => {
				if (!value) {
					return "You need to write something!";
				}
			},
		}).then(async result => {
			if (!result.isConfirmed) return;

			const { data } = await axios.post("/api/addgrade", {
				gradename: result.value,
			});

			resolveData(data, () => {
				history.go(0);
			});
		});
	} else if (currentValue === "rename") {
		// 在点击创建时，不更换当前学期，
		$(this).val(previousValue);

		Swal.fire({
			title: `Enter New Grade Name`,
			input: "text",
			showCancelButton: true,
			inputValidator: value => {
				if (!value) {
					return "You need to write something!";
				}
			},
		}).then(async result => {
			if (!result.isConfirmed) return;

			const { data } = await axios.post("/api/updategrade", {
				oldgradename: previousValue,
				newgradename: result.value,
			});

			resolveData(data, () => {
				history.go(0);
			});
		});
	} else if (currentValue === "remove") {
		// 在点击创建时，不更换当前学期，
		$(this).val(previousValue);

		const { data } = await axios.post("/api/removegrade", {
			gradename: previousValue,
		});

		resolveData(data, () => {
			history.go(0);
		});
	} else {
		const { data } = await axios.post("/api/update", {
			item: "gradename",
			value: currentValue,
		});

		resolveData(data, () => {
			history.go(0);
		});
	}
});

// 按钮功能实现
$(".btncontainer > div").click(async function () {
	const btnClass = $(this).attr("class");
	const btnName = btnClass.match(/btn-(\S*)/)?.[1];

	if (btnName === "logout") {
		const { data } = await axios.post("/api/logout");

		resolveData(data, () => {
			window.location.href = "/";
		});
	} else if (btnName === "change") {
		Swal.fire({
			title: `Enter New Password`,
			input: "text",
			showCancelButton: true,
			inputValidator: value => {
				if (!value) {
					return "You need to write something!";
				}
			},
		}).then(async result => {
			if (!result.isConfirmed) return;

			const hashedSecret = sha256(result.value);
			const { data } = await axios.post("/api/change", {
				secret: hashedSecret,
			});

			resolveData(data, () => {
				window.location.href = "/";
			});
		});
	} else if (btnName === "unregister") {
		Swal.fire({
			title: "Are you sure?",
			text: "You won't be able to revert this!",
			icon: "warning",
			showCancelButton: true,
			confirmButtonColor: "#2b77c0",
			cancelButtonColor: "#c72e2e",
			cancelButtonText: "Cancel",
			confirmButtonText: "Confirm",
		}).then(async result => {
			if (!result.isConfirmed) return;

			const { data } = await axios.post("/api/unregister");

			resolveData(data, () => {
				window.location.href = "/";
			});
		});
	} else if (btnName === "reset") {
		Swal.fire({
			title: "Are you sure?",
			text: "You won't be able to revert this!",
			icon: "warning",
			showCancelButton: true,
			confirmButtonColor: "#2b77c0",
			cancelButtonColor: "#c72e2e",
			cancelButtonText: "Cancel",
			confirmButtonText: "Confirm",
		}).then(async result => {
			if (!result.isConfirmed) return;

			const { data } = await axios.post("/api/reset");

			resolveData(data, () => {
				window.location.href = "/";
			});
		});
	}
});

// 增添课表信息
$(".usertable").on("click", ".btn-addclass", async function () {
	const [anum, pnum, nnum] = $(".set-info span").text().split("").map(Number);
	const gradename = $('select[name="gradename"]').val();

	const currentIndex = JSON.parse($(this).closest("td").attr("value"));
	const currentNum = currentIndex[1];
	const restNums =
		currentNum <= anum
			? anum - currentNum + 1
			: currentNum <= anum + pnum
			? anum + pnum - currentNum + 1
			: anum + pnum + nnum - currentNum + 1;

	if (gradename === "create") return message.error("Please select a grade first!");

	Swal.fire({
		title: "Input Class Information",
		html: `
		<div class="swal-input">
			<div class="swal-inputbox">
				<label for="swal-classname">Class Name:</label>
				<input type="text" id="swal-classname" name="swal-classname" placeholder="课程名称" />
			</div>
			<div class="swal-inputbox">
				<label for="swal-teachername">Teacher Name:</label>
				<input type="text" id="swal-teachername" name="swal-teachername" placeholder="教师名称(可选)" />
			</div>
			<div class="swal-inputbox">
				<label for="swal-address">Address:</label>
				<input type="text" id="swal-address" name="swal-address" placeholder="课程地点(可选)"/>
			</div>
			<div class="swal-inputbox">
				<label for="swal-starttoend">Class Number:</label>
				<input type="text" id="swal-starttoend" name="swal-starttoend" placeholder="课程需要的节数(1~${restNums})" />
			</div>
		</div>`,
		focusConfirm: false,
		showCancelButton: true,
		confirmButtonColor: "#2b77c0",
		cancelButtonColor: "#c72e2e",
		cancelButtonText: "Cancel",
		confirmButtonText: "Confirm",
		preConfirm: () => {
			const classname = document.getElementById("swal-classname").value;
			const teachername = document.getElementById("swal-teachername").value;
			const address = document.getElementById("swal-address").value;
			const classNum = document.getElementById("swal-starttoend").value;
			const classArr = [
				currentIndex,
				[currentIndex[0], currentIndex[1] + Number(classNum) - 1],
			];
			const starttoend = JSON.stringify(classArr);

			if (!classname || !starttoend) return null;
			if (classNum < 1 || classNum > restNums) return null;
			return { gradename, classname, starttoend, address, teachername };
		},
	}).then(async result => {
		if (!result.isConfirmed) return;
		if (!result.value) return;

		const { data } = await axios.post("/api/addclass", result.value);

		resolveData(data, () => {
			history.go(0);
		});
	});
});

// 修改课表信息
$(".usertable").on("click", ".btn-class", async function () {
	const [anum, pnum, nnum] = $(".set-info span").text().split("").map(Number);
	const gradename = $('select[name="gradename"]').val();

	const currentIndex = JSON.parse($(this).closest("td").attr("value"));
	const classNum = $(this).closest("td").attr("rowspan");
	const className = $(this).find(".classname").text();
	const teacherName = $(this).find(".teachername").text();
	const address = $(this).find(".address").text();
	const currentNum = currentIndex[1];
	const restNums =
		currentNum <= anum
			? anum - currentNum + 1
			: currentNum <= anum + pnum
			? anum + pnum - currentNum + 1
			: anum + pnum + nnum - currentNum + 1;

	if (gradename === "create") return message.error("Please select a grade first!");

	Swal.fire({
		title: "Input Class Information",
		html: `
		<div class="swal-input">
			<div class="swal-inputbox">
				<label for="swal-classname">Class Name:</label>
				<input type="text" id="swal-classname" name="swal-classname" value="${className}"/>
			</div>
			<div class="swal-inputbox">
				<label for="swal-teachername">Teacher Name:</label>
				<input type="text" id="swal-teachername" name="swal-teachername" value="${teacherName}"/>
			</div>
			<div class="swal-inputbox">
				<label for="swal-address">Address:</label>
				<input type="text" id="swal-address" name="swal-address" value="${address}"/>
			</div>
			<div class="swal-inputbox">
				<label for="swal-starttoend">Class Number:</label>
				<input type="text" id="swal-starttoend" name="swal-starttoend" value="${classNum}"/>
			</div>
		</div>`,
		focusConfirm: false,
		showCancelButton: true,
		showDenyButton: true,
		denyButtonColor: "#c6323b",
		cancelButtonColor: "#c72e2e",
		confirmButtonColor: "#2b77c0",
		denyButtonText: "Remove",
		cancelButtonText: "Cancel",
		confirmButtonText: "Update",
		preConfirm: () => {
			const classname = document.getElementById("swal-classname").value;
			const teachername = document.getElementById("swal-teachername").value;
			const address = document.getElementById("swal-address").value;
			const classNum = document.getElementById("swal-starttoend").value;
			const classArr = [
				currentIndex,
				[currentIndex[0], currentIndex[1] + Number(classNum) - 1],
			];
			const starttoend = JSON.stringify(classArr);

			if (!classname || !starttoend) return null;
			if (classNum < 1 || classNum > restNums) return null;
			return {
				gradename,
				oldclassname: className,
				classname,
				starttoend,
				address,
				teachername,
			};
		},
	}).then(async result => {
		if (result.isConfirmed) {
			const { data } = await axios.post("/api/updateclass", result.value);

			resolveData(data, () => {
				history.go(0);
			});
		} else if (result.isDenied) {
			const { data } = await axios.post("/api/removeclass", {
				gradename,
				classname: className,
			});

			resolveData(data, () => {
				history.go(0);
			});
		}
	});
});

// 管理员删除用户
$(".admin").on("click", ".btn-delete", async function () {
	const email = $(this).closest("tr").attr("value");

	Swal.fire({
		title: "Are you sure?",
		text: "You won't be able to revert this!",
		icon: "warning",
		showCancelButton: true,
		confirmButtonColor: "#2b77c0",
		cancelButtonColor: "#c72e2e",
		cancelButtonText: "Cancel",
		confirmButtonText: "Confirm",
	}).then(async result => {
		if (!result.isConfirmed) return;

		const { data } = await axios.post("/api/deleteuser", { email });

		resolveData(data, () => {
			history.go(0);
		});
	});
});

// 显示课表信息
$(document).ready(async function () {
	const tableClass = $("table").attr("class");
	const gradename = $('select[name="gradename"]').val();
	if (tableClass !== "usertable") return;
	if (gradename === "create") return;

	const { data } = await axios.post("/api/getclasses", { gradename });
	if (data.status !== 0) return message.error(data.message);

	setTimeout(() => {
		const classes = data.data;

		classes.forEach(item => {
			const { classname, starttoend, address, teachername } = item;
			const [start, end] = JSON.parse(starttoend);

			const tdNeedSpan = $("td").filter(function () {
				const item = JSON.parse($(this).attr("value"));

				return item[0] === start[0] && item[1] === start[1];
			});

			const tdNeedDeleted = $("td").filter(function () {
				const item = JSON.parse($(this).attr("value"));

				return (
					item[0] === start[0] && item[1] > start[1] && item[1] <= end[1]
				);
			});

			const rcolor = Math.floor(Math.random() * 10);
			const gcolor = Math.floor(Math.random() * 10);
			const bcolor = Math.floor(Math.random() * 10);

			const spanItem = tdNeedSpan.children("div");
			const spanContent = $(`
				<div class="class-info" 
					style="background-color: rgba(${rcolor}, ${gcolor}, ${bcolor}, 0.2)">
					<span class="classname">${classname}</span>
					<span class="address">${address}</span>
					<span class="teachername">${teachername}</span>
				</div>
			`);

			tdNeedSpan.attr("rowspan", end[1] - start[1] + 1);
			tdNeedDeleted.remove();
			// 添加课程信息
			spanItem.addClass("btn-class");
			spanItem.removeClass("btn-addclass");
			spanItem.append(spanContent);
		});
	}, 0);
});

// 尽快加载图片
$(document).ready(function () {
	const img = $(".avatar img");
	const errorTimeout = 1000;

	const timer = setTimeout(function () {
		if (!img[0].complete) {
			img.attr("src", "/public/images/avatar.jpg");
		}
	}, errorTimeout);

	img.on("load", () => {
		clearTimeout(timer);
	});

	img.on("error", () => {
		img.attr("src", "/public/images/avatar.jpg");
	});
});
