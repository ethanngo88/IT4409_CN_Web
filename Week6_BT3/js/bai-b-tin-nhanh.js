/* BÀI B — VIẾT CODE: Lọc tin và đăng tin nhanh (news.html)
   Viết code theo đặc tả.
   Không sửa news.html, không sửa css; chỉ viết JavaScript trong file này. */

// ---------- ĐÃ CHO SẴN (không sửa) ----------
// Chặn việc gửi form tìm kiếm khi nhấn Enter, để trang không bị tải lại.
document.querySelector("#searchbar form").addEventListener("submit", (e) => e.preventDefault());

// ---------- PHẦN BẠN VIẾT ----------

const oTimKiem = document.getElementById("o-tim-kiem");
const dsList = document.getElementById("list");
const boDem = document.getElementById("bo-dem");
const khongThay = document.getElementById("khong-thay");
const tinTieuDe = document.getElementById("tin-tieu-de");
const tinNoiDung = document.getElementById("tin-noi-dung");
const nutDang = document.getElementById("nut-dang");
const baoLoi = document.getElementById("bao-loi");

// F1. Bộ đếm "Đang hiển thị x/y tin" trong #bo-dem.
// F2 + F3. Lọc tin theo từ khoá trong #o-tim-kiem và thông báo #khong-thay.
function capNhatBoDemVaLoc() {
	const tuKhoa = oTimKiem.value.toLowerCase();
	const cacMuc = Array.from(dsList.querySelectorAll("li"));
	let soHien = 0;

	for (const muc of cacMuc) {
		const h3 = muc.querySelector("h3");
		const p = muc.querySelector("p");
		const vanBan = (h3 ? h3.textContent : "") + " " + (p ? p.textContent : "");
		if (vanBan.toLowerCase().includes(tuKhoa)) {
			muc.classList.remove("an");
			soHien++;
		} else {
			muc.classList.add("an");
		}
	}

	boDem.textContent = `Đang hiển thị ${soHien}/${cacMuc.length} tin`;

	if (soHien === 0) {
		khongThay.classList.remove("an");
		// textContent: từ khoá chứa thẻ HTML được hiện nguyên văn.
		khongThay.textContent = `Không tìm thấy tin nào cho "${oTimKiem.value}"`;
	} else {
		khongThay.classList.add("an");
	}
}

oTimKiem.addEventListener("keyup", capNhatBoDemVaLoc);
capNhatBoDemVaLoc(); // bộ đếm đúng ngay khi tải trang

// F4. Nút "Read more >>" / "Thu gọn <<" — MỘT trình lắng nghe đặt trên #list.
dsList.addEventListener("click", (e) => {
	if (!e.target.classList.contains("more")) {
		return;
	}
	const doanVan = e.target.closest("li").querySelector("p");
	if (doanVan.classList.contains("day-du")) {
		doanVan.classList.remove("day-du");
		e.target.textContent = "Read more >>";
	} else {
		doanVan.classList.add("day-du");
		e.target.textContent = "Thu gọn <<";
	}
});

// F5. Nút #nut-dang: kiểm tra dữ liệu, tạo <li> mới, chèn vào đầu #list.
nutDang.addEventListener("click", () => {
	const tieuDe = tinTieuDe.value;
	const noiDung = tinNoiDung.value;

	if (!tieuDe.trim() || !noiDung.trim()) {
		baoLoi.textContent = "Vui lòng nhập đủ tiêu đề và nội dung.";
		return;
	}

	const liMoi = document.createElement("li");

	const spanTime = document.createElement("span");
	spanTime.className = "time";
	spanTime.textContent = homNay();

	const h3 = document.createElement("h3");
	h3.textContent = tieuDe;

	const p = document.createElement("p");
	p.textContent = noiDung;

	const nutMore = document.createElement("button");
	nutMore.type = "button";
	nutMore.className = "more";
	nutMore.textContent = "Read more >>";

	liMoi.append(spanTime, h3, p, nutMore);
	dsList.prepend(liMoi);

	tinTieuDe.value = "";
	tinNoiDung.value = "";
	baoLoi.textContent = "";

	// Tin mới phải tuân theo bộ lọc đang gõ.
	capNhatBoDemVaLoc();
});
