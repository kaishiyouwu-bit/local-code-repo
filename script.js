const taskName = document.querySelector("#task-name");
const costValue = document.querySelector("#cost");
const toast = document.querySelector("#toast");
const clientView = document.querySelector("#client-view");
const adminView = document.querySelector("#admin-view");

const baseCosts = {
  "房间改造": 40,
  "产品植入": 36,
  "样板房视频": 60,
};

let selectedTask = "房间改造";
let selectedDuration = 8;
let selectedRatio = "16:9";

function updateCost() {
  const durationExtra = selectedDuration === 10 ? 12 : selectedDuration === 8 ? 6 : 0;
  const ratioExtra = selectedRatio === "9:16" ? 4 : 0;
  costValue.textContent = baseCosts[selectedTask] + durationExtra + ratioExtra;
}

document.querySelectorAll("[data-task]").forEach((button) => {
  button.addEventListener("click", () => {
    selectedTask = button.dataset.task;
    taskName.textContent = selectedTask;
    updateCost();
    document.querySelector("#builder").scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

document.querySelectorAll(".chip[data-duration]").forEach((chip) => {
  chip.addEventListener("click", () => {
    document.querySelectorAll(".chip[data-duration]").forEach((item) => item.classList.remove("active"));
    chip.classList.add("active");
    selectedDuration = Number(chip.dataset.duration);
    updateCost();
  });
});

document.querySelectorAll(".chip[data-ratio]").forEach((chip) => {
  chip.addEventListener("click", () => {
    document.querySelectorAll(".chip[data-ratio]").forEach((item) => item.classList.remove("active"));
    chip.classList.add("active");
    selectedRatio = chip.dataset.ratio;
    updateCost();
  });
});

document.querySelector("#generate-btn").addEventListener("click", () => {
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2600);
});

document.querySelectorAll("[data-target]").forEach((button) => {
  button.addEventListener("click", () => {
    if (button.dataset.target === "admin") {
      clientView.classList.remove("active-view");
      adminView.classList.add("active-view");
      document.querySelector(".mobile-nav").style.display = "none";
      return;
    }

    adminView.classList.remove("active-view");
    clientView.classList.add("active-view");
    document.querySelector(".mobile-nav").style.display = "";
  });
});

document.querySelectorAll(".nav-item").forEach((item) => {
  item.addEventListener("click", () => {
    document.querySelectorAll(".nav-item").forEach((nav) => nav.classList.remove("active"));
    item.classList.add("active");
  });
});

updateCost();
