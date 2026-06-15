const state = {
  user: null,
  summary: null,
  selectedTask: "房间改造",
  selectedDuration: 8,
  selectedRatio: "16:9",
  pollTimer: null,
};

const el = {
  authScreen: document.querySelector("#auth-screen"),
  loginForm: document.querySelector("#login-form"),
  loginAccount: document.querySelector("#login-account"),
  loginPassword: document.querySelector("#login-password"),
  loginError: document.querySelector("#login-error"),
  taskName: document.querySelector("#task-name"),
  costValue: document.querySelector("#cost"),
  toast: document.querySelector("#toast"),
  clientView: document.querySelector("#client-view"),
  adminView: document.querySelector("#admin-view"),
  profileName: document.querySelector("#profile-name"),
  profileMeta: document.querySelector("#profile-meta"),
  metricCredits: document.querySelector("#metric-credits"),
  metricTasks: document.querySelector("#metric-tasks"),
  metricSuccess: document.querySelector("#metric-success"),
  planName: document.querySelector("#plan-name"),
  planMeta: document.querySelector("#plan-meta"),
  accountBalance: document.querySelector("#account-balance"),
  accountMeta: document.querySelector("#account-meta"),
  seatCount: document.querySelector("#seat-count"),
  seatMeta: document.querySelector("#seat-meta"),
  works: document.querySelector("#works"),
  transactionsBody: document.querySelector("#transactions-body"),
  mainFile: document.querySelector("#main-file"),
  referenceFile: document.querySelector("#reference-file"),
  mainFileLabel: document.querySelector("#main-file-label"),
  referenceFileLabel: document.querySelector("#reference-file-label"),
};

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    ...options,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "请求失败");
  return data;
}

function showToast(message) {
  el.toast.textContent = message;
  el.toast.classList.add("show");
  setTimeout(() => el.toast.classList.remove("show"), 2800);
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("zh-CN");
}

function formatTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function taskThumbClass(taskType) {
  if (taskType === "产品植入") return "sofa-dark";
  if (taskType === "房间改造") return "room";
  return "living";
}

function updateAccount(summary, transactions = []) {
  if (!summary) return;
  state.summary = summary;
  const { tenant, plan, account, seats, metrics } = summary;

  el.profileName.textContent = state.user?.name || "演示用户";
  el.profileMeta.textContent = `${plan.name} · ${tenant.name}`;
  el.metricCredits.textContent = formatNumber(account.balance);
  el.metricTasks.textContent = metrics.todayTasks;
  el.metricSuccess.textContent = `${metrics.successRate}%`;
  el.planName.textContent = plan.name;
  el.planMeta.textContent = `${seats.limit} 个席位 · ${tenant.membershipExpireAt} 到期`;
  el.accountBalance.textContent = formatNumber(account.balance);
  el.accountMeta.textContent = `冻结 ${formatNumber(account.frozen)} · 累计消耗 ${formatNumber(account.totalConsumed)}`;
  el.seatCount.textContent = `${seats.used} / ${seats.limit}`;
  el.seatMeta.textContent = `管理员 ${seats.admins} · 创作者 ${seats.creators} · 查看者 ${seats.viewers}`;

  el.transactionsBody.innerHTML = transactions.length
    ? transactions
        .slice(0, 5)
        .map(
          (item) => `
            <tr>
              <td>${formatTime(item.createdAt).slice(11)}</td>
              <td>${item.type}</td>
              <td>${state.user?.name || "-"}</td>
              <td>${item.amount}</td>
              <td><mark>${item.status}</mark></td>
            </tr>
          `
        )
        .join("")
    : `
      <tr>
        <td colspan="5">暂无积分流水，创建一次任务后会自动出现。</td>
      </tr>
    `;
}

function renderWorks(works) {
  el.works.innerHTML = works
    .map(
      (work) => `
        <article class="work-card">
          <div class="thumb ${taskThumbClass(work.taskType)}"><span>${work.taskType}</span><b>00:${String(work.duration).padStart(2, "0")}</b></div>
          <h3>${work.title}</h3>
          <p>${formatTime(work.createdAt)}</p>
        </article>
      `
    )
    .join("");
}

async function refreshDashboard() {
  const me = await api("/api/me");
  state.user = me.user;
  updateAccount(me.summary, me.transactions);
  const works = await api("/api/works");
  renderWorks(works.works);
}

async function updateCost() {
  if (!state.user) {
    const baseCosts = { 房间改造: 40, 产品植入: 36, 样板房视频: 60 };
    const durationExtra = state.selectedDuration === 10 ? 12 : state.selectedDuration === 8 ? 6 : 0;
    const ratioExtra = state.selectedRatio === "9:16" ? 4 : 0;
    el.costValue.textContent = baseCosts[state.selectedTask] + durationExtra + ratioExtra;
    return;
  }

  const estimate = await api("/api/tasks/estimate", {
    method: "POST",
    body: JSON.stringify(currentTaskPayload()),
  });
  el.costValue.textContent = estimate.creditCost;
}

function currentTaskPayload() {
  return {
    taskType: state.selectedTask,
    inputType: el.mainFile.files[0]?.type?.startsWith("video/") ? "video" : "image",
    space: document.querySelector("#space").value,
    style: document.querySelector("#style").value,
    camera: document.querySelector("#camera").value,
    aspectRatio: state.selectedRatio,
    duration: state.selectedDuration,
    remark: document.querySelector(".remark textarea").value.trim(),
  };
}

async function pollUntilTaskCompletes() {
  clearInterval(state.pollTimer);
  state.pollTimer = setInterval(async () => {
    const tasks = await api("/api/tasks");
    const active = tasks.tasks.some((item) => item.status === "generating" || item.status === "queued");
    await refreshDashboard();
    if (!active) {
      clearInterval(state.pollTimer);
      showToast("本地模拟生成完成，作品已保存");
    }
  }, 1800);
}

el.loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  el.loginError.textContent = "";
  try {
    const result = await api("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        account: el.loginAccount.value.trim(),
        password: el.loginPassword.value,
      }),
    });
    state.user = result.user;
    el.authScreen.classList.add("hidden");
    updateAccount(result.summary);
    await refreshDashboard();
    await updateCost();
    showToast("登录成功，已进入本地 MVP");
  } catch (error) {
    el.loginError.textContent = error.message;
  }
});

document.querySelectorAll("[data-task]").forEach((button) => {
  button.addEventListener("click", async () => {
    state.selectedTask = button.dataset.task;
    el.taskName.textContent = state.selectedTask;
    await updateCost();
    document.querySelector("#builder").scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

document.querySelectorAll(".chip[data-duration]").forEach((chip) => {
  chip.addEventListener("click", async () => {
    document.querySelectorAll(".chip[data-duration]").forEach((item) => item.classList.remove("active"));
    chip.classList.add("active");
    state.selectedDuration = Number(chip.dataset.duration);
    await updateCost();
  });
});

document.querySelectorAll(".chip[data-ratio]").forEach((chip) => {
  chip.addEventListener("click", async () => {
    document.querySelectorAll(".chip[data-ratio]").forEach((item) => item.classList.remove("active"));
    chip.classList.add("active");
    state.selectedRatio = chip.dataset.ratio;
    await updateCost();
  });
});

document.querySelector("#generate-btn").addEventListener("click", async () => {
  if (!state.user) {
    showToast("请先登录");
    return;
  }

  try {
    const result = await api("/api/tasks", {
      method: "POST",
      body: JSON.stringify(currentTaskPayload()),
    });
    updateAccount(result.summary);
    showToast(`任务已创建：预扣 ${result.task.creditCost} 积分，正在模拟生成`);
    await pollUntilTaskCompletes();
  } catch (error) {
    showToast(error.message);
  }
});

document.querySelectorAll("[data-target]").forEach((button) => {
  button.addEventListener("click", () => {
    if (button.dataset.target === "admin") {
      el.clientView.classList.remove("active-view");
      el.adminView.classList.add("active-view");
      document.querySelector(".mobile-nav").style.display = "none";
      return;
    }

    el.adminView.classList.remove("active-view");
    el.clientView.classList.add("active-view");
    document.querySelector(".mobile-nav").style.display = "";
  });
});

document.querySelectorAll(".nav-item").forEach((item) => {
  item.addEventListener("click", () => {
    document.querySelectorAll(".nav-item").forEach((nav) => nav.classList.remove("active"));
    item.classList.add("active");
  });
});

el.mainFile.addEventListener("change", () => {
  el.mainFileLabel.textContent = el.mainFile.files[0]?.name || "主素材";
});

el.referenceFile.addEventListener("change", () => {
  const count = el.referenceFile.files.length;
  el.referenceFileLabel.textContent = count ? `参考图 ${count} 个` : "参考图";
});

updateCost();
