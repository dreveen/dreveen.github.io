const toggle = document.querySelector(".menu-toggle");
const links = document.querySelector(".links");

if (toggle && links) {
  toggle.addEventListener("click", () => {
    const open = links.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
  });
}

const year = document.getElementById("year");
if (year) year.textContent = new Date().getFullYear();
