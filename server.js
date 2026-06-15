const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = Number(process.env.PORT || 4173);
const ROOT = __dirname;
const DB_PATH = path.join(ROOT, "data", "db.json");
const sessions = new Map();

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

function readDb() {
  return JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
}

function writeDb(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf8");
}

function sendJson(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(data));
}

function sendError(res, status, message) {
  sendJson(res, status, { error: message });
}

function parseCookies(req) {
  const header = req.headers.cookie || "";
  return Object.fromEntries(
    header
      .split(";")
      .map((part) => part.trim().split("="))
      .filter(([key]) => key)
  );
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 1_000_000) {
        reject(new Error("请求体过大"));
        req.destroy();
      }
    });
    req.on("end", () => {
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(new Error("JSON 格式错误"));
      }
    });
  });
}

function getSession(req) {
  const token = parseCookies(req).muqu_session;
  if (!token) return null;
  return sessions.get(token) || null;
}

function requireUser(req, res, db) {
  const session = getSession(req);
  if (!session) {
    sendError(res, 401, "请先登录");
    return null;
  }
  const user = db.users.find((item) => item.id === session.userId && item.status === "active");
  if (!user) {
    sendError(res, 401, "登录已失效");
    return null;
  }
  const tenant = db.tenants.find((item) => item.id === user.tenantId);
  return { user, tenant };
}

function publicUser(user) {
  return {
    id: user.id,
    tenantId: user.tenantId,
    name: user.name,
    phone: user.phone,
    email: user.email,
    role: user.role,
  };
}

function calcCost(db, payload) {
  const rule = db.pricingRules.find((item) => item.taskType === payload.taskType);
  const baseCost = rule ? rule.baseCost : 40;
  const duration = Number(payload.duration || 8);
  const durationExtra = duration === 10 ? 12 : duration === 8 ? 6 : 0;
  const ratioExtra = payload.aspectRatio === "9:16" ? 4 : 0;
  return baseCost + durationExtra + ratioExtra;
}

function buildPrompt(payload) {
  return [
    `${payload.taskType}底层提示词`,
    `用户上传素材说明：${payload.inputType || "图片/视频素材"}`,
    `空间类型：${payload.space}`,
    `装修风格：${payload.style}`,
    `运镜风格：${payload.camera}`,
    `输出规格：${payload.aspectRatio}，${payload.duration}秒`,
    "全局质量规则：真实室内摄影质感，光线自然，空间结构合理，适合家装营销展示",
    "负面提示词：不要扭曲墙体，不要改变门窗位置，不要人物，不要文字水印，不要模糊",
    payload.remark ? `用户备注：${payload.remark}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function completeTaskLater(taskId) {
  setTimeout(() => {
    const db = readDb();
    const task = db.tasks.find((item) => item.id === taskId);
    if (!task || task.status !== "generating") return;

    const account = db.creditAccounts.find((item) => item.tenantId === task.tenantId);
    if (account) {
      account.frozen = Math.max(0, account.frozen - task.creditCost);
      account.totalConsumed += task.creditCost;
    }

    const transaction = db.creditTransactions.find((item) => item.taskId === task.id);
    if (transaction) transaction.status = "confirmed";

    const work = {
      id: `work_${Date.now()}`,
      tenantId: task.tenantId,
      userId: task.userId,
      taskId: task.id,
      title: `${task.style}${task.space}${task.taskType}`,
      taskType: task.taskType,
      style: task.style,
      space: task.space,
      camera: task.camera,
      aspectRatio: task.aspectRatio,
      duration: task.duration,
      creditCost: task.creditCost,
      status: "completed",
      videoUrl: "#local-simulated-video",
      createdAt: new Date().toISOString(),
    };

    db.works.unshift(work);
    task.status = "completed";
    task.creditStatus = "confirmed";
    task.outputWorkId = work.id;
    task.updatedAt = new Date().toISOString();
    writeDb(db);
  }, 3500);
}

function tenantSummary(db, tenantId) {
  const tenant = db.tenants.find((item) => item.id === tenantId);
  const plan = db.plans.find((item) => item.id === tenant.planId);
  const account = db.creditAccounts.find((item) => item.tenantId === tenantId);
  const users = db.users.filter((item) => item.tenantId === tenantId);
  const tasks = db.tasks.filter((item) => item.tenantId === tenantId);
  const today = new Date().toISOString().slice(0, 10);
  const todayTasks = tasks.filter((item) => item.createdAt.startsWith(today));

  return {
    tenant,
    plan,
    account,
    seats: {
      used: users.length,
      limit: tenant.seatLimit,
      admins: users.filter((item) => item.role === "admin").length,
      creators: users.filter((item) => item.role === "creator").length,
      viewers: users.filter((item) => item.role === "viewer").length,
    },
    metrics: {
      todayTasks: todayTasks.length,
      successRate: tasks.length ? Math.round((tasks.filter((item) => item.status === "completed").length / tasks.length) * 100) : 100,
    },
  };
}

async function handleApi(req, res) {
  const db = readDb();
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === "POST" && url.pathname === "/api/auth/login") {
    const body = await readBody(req);
    const account = String(body.account || "").trim();
    const password = String(body.password || "");
    const user = db.users.find(
      (item) =>
        item.status === "active" &&
        item.password === password &&
        (item.email === account || item.phone === account)
    );

    if (!user) {
      sendError(res, 401, "账号或密码错误");
      return;
    }

    const token = crypto.randomBytes(24).toString("hex");
    sessions.set(token, { userId: user.id, createdAt: Date.now() });
    res.setHeader("Set-Cookie", `muqu_session=${token}; HttpOnly; Path=/; SameSite=Lax`);
    sendJson(res, 200, { user: publicUser(user), summary: tenantSummary(db, user.tenantId) });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/auth/logout") {
    const token = parseCookies(req).muqu_session;
    if (token) sessions.delete(token);
    res.setHeader("Set-Cookie", "muqu_session=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax");
    sendJson(res, 200, { ok: true });
    return;
  }

  const auth = requireUser(req, res, db);
  if (!auth) return;

  if (req.method === "GET" && url.pathname === "/api/me") {
    sendJson(res, 200, {
      user: publicUser(auth.user),
      summary: tenantSummary(db, auth.user.tenantId),
      transactions: db.creditTransactions.filter((item) => item.tenantId === auth.user.tenantId).slice(0, 10),
    });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/options") {
    sendJson(res, 200, {
      prompts: db.promptTemplates,
      plans: db.plans,
      providers: db.providers,
      upscalePlugins: db.upscalePlugins,
    });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/works") {
    sendJson(res, 200, {
      works: db.works.filter((item) => item.tenantId === auth.user.tenantId),
    });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/tasks") {
    sendJson(res, 200, {
      tasks: db.tasks.filter((item) => item.tenantId === auth.user.tenantId),
    });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/tasks/estimate") {
    const body = await readBody(req);
    sendJson(res, 200, { creditCost: calcCost(db, body) });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/tasks") {
    const body = await readBody(req);
    const creditCost = calcCost(db, body);
    const account = db.creditAccounts.find((item) => item.tenantId === auth.user.tenantId);
    if (!account || account.balance < creditCost) {
      sendError(res, 402, "积分不足，请充值或升级会员");
      return;
    }

    const now = new Date().toISOString();
    const balanceBefore = account.balance;
    account.balance -= creditCost;
    account.frozen += creditCost;

    const task = {
      id: `task_${Date.now()}`,
      tenantId: auth.user.tenantId,
      userId: auth.user.id,
      taskType: body.taskType,
      inputType: body.inputType || "image",
      inputMaterialIds: [],
      referenceMaterialIds: [],
      space: body.space,
      style: body.style,
      camera: body.camera,
      aspectRatio: body.aspectRatio,
      duration: Number(body.duration || 8),
      promptFull: buildPrompt(body),
      promptModulesSnapshot: body,
      modelProvider: "MockVideoProvider",
      modelName: "local-simulated-video",
      creditCost,
      creditStatus: "pending",
      status: "generating",
      outputWorkId: null,
      errorMessage: "",
      retryCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    db.tasks.unshift(task);
    db.creditTransactions.unshift({
      id: `tx_${Date.now()}`,
      tenantId: auth.user.tenantId,
      userId: auth.user.id,
      taskId: task.id,
      type: "video_generate",
      amount: -creditCost,
      balanceBefore,
      balanceAfter: account.balance,
      status: "pending",
      remark: "本地模拟生成任务预扣积分",
      createdAt: now,
    });

    writeDb(db);
    completeTaskLater(task.id);
    sendJson(res, 201, { task, summary: tenantSummary(db, auth.user.tenantId) });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/admin/overview") {
    if (auth.user.role !== "admin") {
      sendError(res, 403, "需要管理员权限");
      return;
    }
    sendJson(res, 200, {
      tenants: db.tenants,
      users: db.users.map(publicUser),
      plans: db.plans,
      pricingRules: db.pricingRules,
      providers: db.providers,
      upscalePlugins: db.upscalePlugins,
      tasks: db.tasks,
      works: db.works,
    });
    return;
  }

  sendError(res, 404, "接口不存在");
}

function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  let filePath = url.pathname === "/" ? "/index.html" : url.pathname;
  filePath = path.normalize(filePath).replace(/^(\.\.[/\\])+/, "");
  const absolute = path.join(ROOT, filePath);

  if (!absolute.startsWith(ROOT)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(absolute, (error, content) => {
    if (error) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    const type = MIME[path.extname(absolute)] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": type });
    res.end(content);
  });
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.url.startsWith("/api/")) {
      await handleApi(req, res);
      return;
    }
    serveStatic(req, res);
  } catch (error) {
    sendError(res, 500, error.message || "服务器错误");
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`木趣智能家装 beta版运行中：http://127.0.0.1:${PORT}/`);
  console.log("演示账号：demo@muqu.local / 123456");
});
