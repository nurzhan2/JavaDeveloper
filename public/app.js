(() => {
  "use strict";
  const P = window.PLAN;
  const WEEKS = P.weeks.map(w => ({ ...w, days: window.buildDays(w) }));
  const TOTAL_DAYS = WEEKS.length * 7;
  const LS_STATE = "jd-state-v1", LS_KEY = "jd-key";
  const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = s => document.querySelector(s);
  const app = $("#app");
  const DOW = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
  const MONTHS = ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];
  const KIND_COLOR = { theory: "#5BC0EB", keys: "#B388FF", project: "#F1453D", review: "#F2A541", lc: "#3DD6A3" };

  // ---------- storage ----------
  const empty = () => ({ tasks: {}, notes: {}, settings: {} });
  const ls = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch {} }
  };
  let state = (() => { try { return { ...empty(), ...JSON.parse(ls.get(LS_STATE) || "{}") }; } catch { return empty(); } })();

  function mergeMap(a = {}, b = {}) {
    const out = { ...a };
    for (const [k, v] of Object.entries(b || {})) {
      if (!v || typeof v.t !== "number") continue;
      if (!out[k] || out[k].t < v.t) out[k] = v;
    }
    return out;
  }
  const merge = (a, b) => ({ tasks: mergeMap(a.tasks, b.tasks), notes: mergeMap(a.notes, b.notes), settings: mergeMap(a.settings, b.settings) });

  function commit(rerender = true) {
    ls.set(LS_STATE, JSON.stringify(state));
    scheduleSync();
    if (rerender) render();
  }

  // ---------- dates ----------
  const pad = n => String(n).padStart(2, "0");
  const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parse = s => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
  const dayNum = d => Math.round(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5);
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const fmt = d => `${d.getDate()} ${MONTHS[d.getMonth()]}`;
  const startDate = () => {
    const v = state.settings.startDate && state.settings.startDate.v;
    return /^\d{4}-\d{2}-\d{2}$/.test(v || "") ? parse(v) : parse(P.defaultStart);
  };
  const todayIdx = () => dayNum(new Date()) - dayNum(startDate()); // может быть <0 или >= TOTAL_DAYS
  const dateOf = idx => addDays(startDate(), idx);
  const dayAt = idx => (idx >= 0 && idx < TOTAL_DAYS) ? WEEKS[Math.floor(idx / 7)].days[idx % 7] : null;
  const weekOf = idx => WEEKS[Math.floor(idx / 7)];
  const phaseOf = n => P.phases.find(p => n >= p.weeks[0] && n <= p.weeks[1]);

  // ---------- progress ----------
  const isDone = id => Boolean(state.tasks[id] && state.tasks[id].done);
  const uniq = tasks => [...new Map(tasks.map(t => [t.id, t])).values()];
  const ratio = tasks => { const u = uniq(tasks); return u.length ? u.filter(t => isDone(t.id)).length / u.length : 0; };
  const dayRatio = idx => { const d = dayAt(idx); return d ? ratio(d.tasks) : 0; };
  const weekTasks = w => w.days.flatMap(d => d.tasks);
  const allTasks = () => uniq(WEEKS.flatMap(weekTasks));
  const overall = () => ratio(allTasks());

  function streak() {
    const days = new Set(Object.values(state.tasks).filter(v => v.done && v.d).map(v => v.d));
    let d = new Date(), n = 0;
    if (!days.has(ymd(d))) d = addDays(d, -1);
    while (days.has(ymd(d))) { n++; d = addDays(d, -1); }
    return n;
  }
  function debts() {
    const out = [];
    const end = Math.min(todayIdx(), TOTAL_DAYS);
    for (let i = 0; i < end; i++) {
      const day = dayAt(i);
      const left = day.tasks.filter(t => !isDone(t.id)).length;
      if (left) out.push({ idx: i, left });
    }
    return out;
  }

  function toggle(id) {
    const done = !isDone(id);
    state.tasks[id] = { done, t: Date.now(), d: done ? ymd(new Date()) : undefined };
    commit(false);
    return done;
  }

  // ---------- ui helpers ----------
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const ring = (r, pct) => { const c = 2 * Math.PI * r; return pct > 0 ? `stroke-dasharray="${(c * pct).toFixed(1)} ${c.toFixed(1)}"` : `stroke-dasharray="0 ${c.toFixed(1)}" stroke-opacity="0"`; };
  const pctText = p => { const v = p * 100; return (v > 0 && v < 10 ? v.toFixed(1).replace(".", ",") : Math.round(v)) + "%"; };
  const miniRing = (pct, label) => `<div class="mini-ring"><svg viewBox="0 0 64 64"><circle class="t" cx="32" cy="32" r="27"/><circle class="f" cx="32" cy="32" r="27" ${ring(27, pct)}/></svg><b>${label ?? pctText(pct)}</b></div>`;
  const CHECK = `<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>`;
  const LINK = `<svg viewBox="0 0 24 24" width="16" height="16"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const ARROW = d => `<svg viewBox="0 0 24 24" width="20" height="20"><path d="${d ? "M9 5l7 7-7 7" : "M15 5l-7 7 7 7"}" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  function taskRow(t) {
    const lc = t.kind === "lc";
    return `<li class="task ${isDone(t.id) ? "done" : ""}" data-id="${t.id}">
      <button class="check" type="button" data-toggle="${t.id}" aria-pressed="${isDone(t.id)}" aria-label="Отметить: ${esc(t.text)}">${CHECK}</button>
      <div class="task-text"><i class="kind" style="background:${KIND_COLOR[t.kind]}"></i><span>${esc(t.text)}</span></div>
      ${lc ? `<span class="diff ${t.diff}">${{ E: "Easy", M: "Med", H: "Hard" }[t.diff]}</span>` : ""}
      <span class="task-meta">${t.mins} мин</span>
      ${lc ? `<a class="lc-link" href="https://leetcode.com/problems/${t.slug}/" target="_blank" rel="noopener" aria-label="Открыть на LeetCode">${LINK}</a>` : ""}
    </li>`;
  }

  // ---------- dial ----------
  function arc(i, n, r) {
    const seg = 360 / n, gap = 8;
    const a0 = (-90 + i * seg + gap / 2) * Math.PI / 180, a1 = (-90 + (i + 1) * seg - gap / 2) * Math.PI / 180;
    const p = a => `${(200 + r * Math.cos(a)).toFixed(2)} ${(200 + r * Math.sin(a)).toFixed(2)}`;
    return `M ${p(a0)} A ${r} ${r} 0 0 1 ${p(a1)}`;
  }
  let dialIntroDone = false;
  function dial(curWeek, selIdx) {
    const segs = WEEKS.map((w, i) => {
      const pct = ratio(weekTasks(w)), ph = phaseOf(w.n);
      const d = arc(i, WEEKS.length, 170);
      return `<g class="seg ${i === curWeek ? "current" : ""}" style="animation-delay:${i * 28}ms">
        <path class="seg-track" d="${d}"/>
        ${pct > 0 ? `<path class="seg-fill" d="${d}" pathLength="100" stroke="${ph.color}" stroke-dasharray="${(pct * 100).toFixed(1)} 100"/>` : ""}
        <path class="seg-hit" d="${d}" data-week="${w.n}"><title>Неделя ${w.n}: ${esc(w.title)} (${Math.round(pct * 100)}%)</title></path>
      </g>`;
    }).join("");
    let dots = "";
    if (curWeek >= 0 && curWeek < WEEKS.length) {
      for (let d = 0; d < 7; d++) {
        const idx = curWeek * 7 + d;
        const a = (-90 + d * (360 / 7)) * Math.PI / 180;
        const cls = idx === todayIdx() ? "today" : dayRatio(idx) === 1 ? "done" : "";
        dots += `<circle class="dial-day ${cls}" cx="${(200 + 128 * Math.cos(a)).toFixed(1)}" cy="${(200 + 128 * Math.sin(a)).toFixed(1)}" r="${idx === selIdx ? 9 : 6}"/>`;
      }
    }
    const intro = !dialIntroDone && !REDUCED;
    dialIntroDone = true;
    const shown = Math.min(Math.max(curWeek, 0), WEEKS.length - 1);
    return `<div class="dial-wrap">
      <svg class="dial ${intro ? "intro" : ""}" viewBox="0 0 400 400" role="img" aria-label="Прогресс по 24 неделям">${segs}${dots}</svg>
      <div class="dial-center">
        <div class="dial-week">${shown + 1}</div>
        <div class="dial-sub">неделя из ${WEEKS.length}</div>
        <div class="dial-pct">${pctText(overall())} пути</div>
      </div>
    </div>`;
  }

  function strip(weekIdx, selIdx) {
    let html = "";
    for (let d = 0; d < 7; d++) {
      const idx = weekIdx * 7 + d, pct = dayRatio(idx), date = dateOf(idx);
      const cls = [idx === todayIdx() ? "today" : "", idx === selIdx ? "selected" : "", pct === 1 ? "full" : ""].join(" ");
      html += `<a class="bubble ${cls}" href="#/day/${idx}" title="${DOW[date.getDay() === 0 ? 6 : date.getDay() - 1]}, ${fmt(date)}">
        <svg viewBox="0 0 58 58"><circle class="b-track" cx="29" cy="29" r="26"/><circle class="b-fill" cx="29" cy="29" r="26" ${ring(26, pct)}/></svg>
        ${date.getDate()}</a>`;
    }
    return `<div class="strip">${html}</div>`;
  }

  // ---------- views ----------
  function viewToday(selIdx) {
    const ti = todayIdx();
    if (selIdx === undefined) {
      if (ti < 0) return viewBefore(ti);
      if (ti >= TOTAL_DAYS) return viewAfter();
      selIdx = ti;
    }
    selIdx = Math.max(0, Math.min(TOTAL_DAYS - 1, selIdx));
    const wIdx = Math.floor(selIdx / 7), week = WEEKS[wIdx], day = dayAt(selIdx), ph = phaseOf(week.n);
    const date = dateOf(selIdx), pct = ratio(day.tasks);
    const mins = day.tasks.filter(t => !isDone(t.id)).reduce((s, t) => s + t.mins, 0);
    const label = selIdx === ti ? "Сегодня" : selIdx < ti ? "Прошедший день" : "Будущий день";
    const db = debts().filter(x => x.idx !== selIdx);
    const st = streak();
    const noteKey = `n-${selIdx}`;
    return `<div class="grid-today">
      <section>
        ${dial(wIdx, selIdx)}
        ${strip(wIdx, selIdx)}
        <div class="row" style="justify-content:center;margin-top:20px">
          <span class="date-chip">Серия: ${st} ${plural(st, "день", "дня", "дней")}</span>
          <a class="date-chip" href="#/week/${week.n}">Вся неделя ${week.n}</a>
        </div>
      </section>
      <section class="stack">
        <div class="panel stack">
          <div class="day-head">
            <div>
              <div class="row">
                <span class="date-chip">${label}, ${fmt(date)}</span>
                <span class="phase-chip"><i style="background:${ph.color}"></i>${esc(ph.name)}</span>
              </div>
              <h1 class="day-goal">${esc(day.goal)}</h1>
            </div>
            ${miniRing(pct)}
          </div>
          <p class="week-goal">Цель недели: ${esc(week.goal)}</p>
          ${day.tasks.length ? `<ul class="tasks">${day.tasks.map(taskRow).join("")}</ul>` : `<div class="notice info"><span class="dot">✓</span><div>На этот день задач нет. Отдыхай.</div></div>`}
          <div class="row">
            <span class="muted">${pct === 1 ? "День закрыт" : `Осталось примерно ${mins} мин`}</span>
            <span class="spacer"></span>
            ${selIdx !== ti && ti >= 0 && ti < TOTAL_DAYS ? `<a class="btn small" href="#/today">К сегодняшнему дню</a>` : ""}
          </div>
        </div>
        ${db.length ? `<div class="notice"><span class="dot">${db.reduce((s, x) => s + x.left, 0)}</span>
          <div style="flex:1">Незакрытые задачи за ${db.length} ${plural(db.length, "день", "дня", "дней")}. Закрой их или сдвинь план.</div>
          <a class="btn small" href="#/day/${db[0].idx}">Открыть</a>
          <button class="btn small" data-shift="1">+1 день</button></div>` : ""}
        <div class="panel">
          <label for="note"><h2 style="font-size:16px;margin-bottom:12px">Ключевые слова дня</h2></label>
          <textarea class="field" id="note" data-note="${noteKey}" placeholder="Например: HashMap — бакеты, коллизия, resize при 0.75">${esc((state.notes[noteKey] || {}).v || "")}</textarea>
        </div>
      </section>
    </div>`;
  }

  function viewBefore(ti) {
    const n = -ti;
    return `<div class="hero-state">
      <div class="big-count">${n}</div>
      <h1 style="margin-top:16px">${plural(n, "день", "дня", "дней")} до старта</h1>
      <p class="muted" style="max-width:46ch;margin:16px auto 28px">План стартует ${fmt(startDate())}. Можно начать прямо сейчас: даты всех недель сдвинутся на сегодня.</p>
      <div class="row" style="justify-content:center">
        <button class="btn primary" data-start-today>Начать сегодня</button>
        <a class="btn" href="#/day/0">Посмотреть первый день</a>
      </div>
    </div>`;
  }
  function viewAfter() {
    return `<div class="hero-state">
      <div class="big-count" style="color:var(--mint)">${Math.round(overall() * 100)}%</div>
      <h1 style="margin-top:16px">План закрыт</h1>
      <p class="muted" style="max-width:46ch;margin:16px auto 28px">24 недели позади. Все недели и заметки остаются доступны.</p>
      <div class="row" style="justify-content:center"><a class="btn primary" href="#/plan">Открыть план</a><a class="btn" href="#/lc">Задачи LeetCode</a></div>
    </div>`;
  }

  function viewWeek(n) {
    const ti = todayIdx();
    if (!n) n = Math.min(Math.max(Math.floor(ti / 7), 0), WEEKS.length - 1) + 1;
    n = Math.max(1, Math.min(WEEKS.length, n));
    const w = WEEKS[n - 1], ph = phaseOf(n), first = dateOf((n - 1) * 7);
    const cards = w.days.map((d, i) => {
      const idx = (n - 1) * 7 + i, date = dateOf(idx);
      return `<article class="day-card ${idx === ti ? "is-today" : ""}">
        <div class="row"><a class="date-chip" href="#/day/${idx}">${DOW[(date.getDay() + 6) % 7]}, ${fmt(date)}</a><span class="spacer"></span>${miniRingSmall(ratio(d.tasks))}</div>
        <h3>${esc(d.goal)}</h3>
        ${d.tasks.length ? `<ul class="tasks">${d.tasks.map(taskRow).join("")}</ul>` : `<p class="muted">Выходной</p>`}
      </article>`;
    }).join("");
    return `<div class="week-top">
        <a class="icon-btn magnet" href="#/week/${n - 1}" ${n === 1 ? 'aria-disabled="true" style="opacity:.3;pointer-events:none"' : ""} aria-label="Предыдущая неделя">${ARROW(false)}</a>
        <div style="flex:1;min-width:220px">
          <div class="row"><span class="phase-chip"><i style="background:${ph.color}"></i>${esc(ph.name)}</span><span class="date-chip">${fmt(first)} – ${fmt(addDays(first, 6))}</span></div>
          <h1 class="week-title" style="margin-top:12px">Неделя ${n}. ${esc(w.title)}</h1>
          <p class="week-goal" style="margin:10px 0 0">Цель: ${esc(w.goal)}</p>
        </div>
        ${miniRing(ratio(weekTasks(w)))}
        <a class="icon-btn magnet" href="#/week/${n + 1}" ${n === WEEKS.length ? 'aria-disabled="true" style="opacity:.3;pointer-events:none"' : ""} aria-label="Следующая неделя">${ARROW(true)}</a>
      </div>
      <div class="days">${cards}</div>`;
  }
  const miniRingSmall = pct => `<div class="mini-ring" style="width:34px;height:34px;margin:0"><svg viewBox="0 0 64 64"><circle class="t" cx="32" cy="32" r="27" style="stroke-width:9"/><circle class="f" cx="32" cy="32" r="27" style="stroke-width:9" ${ring(27, pct)}/></svg></div>`;

  function viewPlan() {
    const cw = Math.floor(todayIdx() / 7) + 1;
    const rows = P.phases.map(ph => {
      const weeks = WEEKS.filter(w => w.n >= ph.weeks[0] && w.n <= ph.weeks[1]);
      const pct = ratio(weeks.flatMap(weekTasks));
      const from = dateOf((ph.weeks[0] - 1) * 7), to = dateOf(ph.weeks[1] * 7 - 1);
      const bubbles = weeks.map(w => {
        const p = ratio(weekTasks(w));
        return `<a class="bubble ${w.n === cw ? "today" : ""} ${p === 1 ? "full" : ""}" href="#/week/${w.n}" title="${esc(w.title)}">
          <svg viewBox="0 0 58 58"><circle class="b-track" cx="29" cy="29" r="26"/><circle class="b-fill" cx="29" cy="29" r="26" style="stroke:${ph.color}" ${ring(26, p)}/></svg>${w.n}</a>`;
      }).join("");
      return `<div class="phase"><div><h3><i style="background:${ph.color}"></i>${esc(ph.name)}</h3><small>${fmt(from)} – ${fmt(to)}, ${Math.round(pct * 100)}%</small></div><div class="week-bubbles">${bubbles}</div></div>`;
    }).join("");
    return `<div class="week-top"><div style="flex:1"><h1 class="week-title">24 недели до оффера</h1>
      <p class="week-goal" style="margin-top:10px">Java Core → многопоточность → SQL → Spring Boot → Docker → Kafka и Redis → собеседования. Два проекта в портфолио: платёжный сервис и маркетплейс.</p></div>${miniRing(overall())}</div>
      <div class="phases">${rows}</div>`;
  }

  let lcFilter = "all";
  function viewLC() {
    const list = [];
    WEEKS.forEach(w => w.days.forEach(d => d.tasks.forEach(t => { if (t.kind === "lc" && !list.find(x => x.id === t.id)) list.push({ ...t, week: w.n }); })));
    const SQL = [1757, 584, 595, 1148, 1683, 1378, 1068, 1581, 197, 1661, 577, 1280, 570, 1934, 620, 1251, 1193, 1174, 550, 180, 176, 184, 1321, 185, 626], isSql = t => SQL.includes(t.num);
    const isConc = t => [1114, 1115, 1116, 1117, 1195, 1226].includes(t.num);
    const shown = list.filter(t => lcFilter === "all" || (lcFilter === "sql" ? isSql(t) : lcFilter === "conc" ? isConc(t) : lcFilter === "todo" ? !isDone(t.id) : t.diff === lcFilter));
    const stat = (k, name) => { const s = list.filter(t => t.diff === k); const d = s.filter(t => isDone(t.id)).length; return `<div class="lc-stat">${miniRing(s.length ? d / s.length : 0, d)}<div><b>${name}</b><div class="muted" style="font-size:13px">${d} из ${s.length}</div></div></div>`; };
    const solved = list.filter(t => isDone(t.id)).length;
    const f = (k, n) => `<button class="pill ${lcFilter === k ? "active" : ""}" data-filter="${k}">${n}</button>`;
    return `<div class="week-top"><div style="flex:1"><h1 class="week-title">LeetCode: ${solved} из ${list.length}</h1>
      <p class="week-goal" style="margin-top:10px">Задачи по темам в порядке плана. Отметка тут же засчитывается в дне, где задача стоит. Нажми номер, чтобы отметить, иконку — чтобы открыть задачу.</p></div></div>
      <div class="lc-stats">${stat("E", "Easy")}${stat("M", "Medium")}${stat("H", "Hard")}</div>
      <div class="filters" style="margin-bottom:20px">${f("all", "Все")}${f("todo", "Не решены")}${f("E", "Easy")}${f("M", "Medium")}${f("H", "Hard")}${f("sql", "SQL")}${f("conc", "Многопоточность")}</div>
      <div class="chips">${shown.map(t => `<span class="chip ${t.diff} ${isDone(t.id) ? "done" : ""}" data-id="${t.id}">
        <button class="n" type="button" data-toggle="${t.id}" title="${esc(t.text)}" aria-pressed="${isDone(t.id)}" style="border:0;cursor:pointer">${t.num}</button>
        <span>${esc(t.text.replace(/^\d+\.\s/, ""))}</span><span class="w">нед. ${t.week}</span>
        <a class="lc-link" style="width:30px;height:30px" href="https://leetcode.com/problems/${t.slug}/" target="_blank" rel="noopener" aria-label="Открыть">${LINK}</a></span>`).join("") || `<p class="muted">Здесь пусто — все задачи этого фильтра решены.</p>`}</div>`;
  }

  let health = null;
  function viewSettings() {
    const s = ymd(startDate());
    const storage = health === null ? `<div class="notice info"><span class="dot">i</span><div>Сервер не отвечает. Прогресс хранится только в этом браузере.</div></div>`
      : health.persistent ? `<div class="notice info" style="background:rgba(61,214,163,.1);box-shadow:inset 0 0 0 1px rgba(61,214,163,.3)"><span class="dot" style="background:var(--mint)">✓</span><div>Volume подключён: прогресс переживёт редеплой.</div></div>`
      : `<div class="notice"><span class="dot">!</span><div>Volume не подключён: после редеплоя сервер забудет прогресс (в браузере он останется). Подключи Volume в Railway и делай экспорт.</div></div>`;
    return `<h1 class="week-title" style="margin-bottom:28px">Настройки</h1>
      <div class="settings">
        <div class="panel"><h2>Дата старта</h2><p>От неё считаются все недели. Пропустил дни — сдвинь план, и долги уедут вперёд.</p>
          <input class="field" type="date" id="startInput" value="${s}">
          <div class="row" style="margin-top:14px"><button class="btn small" data-shift="-1">−1 день</button><button class="btn small" data-shift="1">+1 день</button><button class="btn small" data-shift="7">+1 неделя</button><button class="btn small ghost" data-start-today>С сегодня</button></div></div>
        <div class="panel"><h2>Хранилище</h2><p>Прогресс сохраняется в браузере сразу, а на сервер — в фоне.</p>${storage}
          <div class="row" style="margin-top:14px"><button class="btn small" data-sync-now>Синхронизировать</button>${health && health.protected ? `<button class="btn small ghost" data-password>Сменить пароль</button>` : ""}</div></div>
        <div class="panel"><h2>Резервная копия</h2><p>Скачай JSON раз в пару недель. Импорт сливает файл с текущим прогрессом и ничего не стирает.</p>
          <div class="row"><button class="btn small" data-export>Скачать JSON</button><label class="btn small ghost" style="cursor:pointer">Загрузить JSON<input type="file" accept="application/json,.json" id="importInput" hidden></label></div></div>
        <div class="panel"><h2>Сброс прогресса</h2><p>Снимает все отметки и очищает заметки на всех устройствах. Перед этим сделай экспорт.</p>
          <button class="btn small danger" data-reset>Сбросить прогресс</button></div>
      </div>`;
  }

  const plural = (n, a, b, c) => { const m10 = n % 10, m100 = n % 100; return m10 === 1 && m100 !== 11 ? a : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? b : c; };

  // ---------- router ----------
  let lastRoute = "";
  function render() {
    flushNote();
    const hash = location.hash.replace(/^#\/?/, "") || "today";
    const [route, arg] = hash.split("/");
    const y = scrollY, same = hash === lastRoute;
    let html;
    if (route === "day") html = viewToday(Number(arg) || 0);
    else if (route === "week") html = viewWeek(Number(arg) || 0);
    else if (route === "plan") html = viewPlan();
    else if (route === "lc") html = viewLC();
    else if (route === "settings") html = viewSettings();
    else html = viewToday();
    const active = document.activeElement && document.activeElement.id;
    app.innerHTML = html;
    if (!same) { app.classList.remove("view-in"); void app.offsetWidth; app.classList.add("view-in"); scrollTo(0, 0); }
    else { scrollTo(0, y); if (active) { const el = document.getElementById(active); el && el.focus(); } }
    lastRoute = hash;
    document.querySelectorAll("#nav .pill").forEach(a => a.classList.toggle("active", a.dataset.route === (route === "day" ? "today" : route)));
  }
  addEventListener("hashchange", render);

  // ---------- events ----------
  document.addEventListener("click", e => {
    const t = e.target.closest("[data-toggle]");
    if (t) {
      const id = t.dataset.toggle;
      const before = currentDayFull();
      const done = toggle(id);
      document.querySelectorAll(`[data-id="${CSS.escape(id)}"]`).forEach(row => {
        row.classList.toggle("done", done);
        const b = row.querySelector("[data-toggle]"); b && b.setAttribute("aria-pressed", done);
      });
      t.classList.remove("bump"); void t.offsetWidth; t.classList.add("bump");
      setTimeout(render, 380); // даём анимации отыграть, потом обновляем кольца
      if (done && !before && currentDayFull()) { burst(t, 140); toast("День закрыт. Так держать!"); }
      else if (done) burst(t, 18);
      return;
    }
    const seg = e.target.closest("[data-week]");
    if (seg) { location.hash = `#/week/${seg.dataset.week}`; return; }
    const f = e.target.closest("[data-filter]");
    if (f) { lcFilter = f.dataset.filter; render(); return; }
    const sh = e.target.closest("[data-shift]");
    if (sh) { setStart(addDays(startDate(), Number(sh.dataset.shift))); toast(`План сдвинут, старт: ${fmt(startDate())}`); return; }
    if (e.target.closest("[data-start-today]")) { setStart(new Date()); toast("Стартуем сегодня!"); location.hash = "#/today"; return; }
    if (e.target.closest("[data-export]")) return exportJSON();
    if (e.target.closest("[data-reset]")) return resetAll();
    if (e.target.closest("[data-sync-now]")) { syncNow(true); return; }
    if (e.target.closest("[data-password]")) { askPassword(); return; }
    if (e.target.closest("#sync")) { syncState === "auth" ? askPassword() : syncNow(true); }
  });

  function currentDayFull() {
    const m = location.hash.match(/day\/(\d+)/);
    const idx = m ? Number(m[1]) : todayIdx();
    const d = dayAt(idx);
    return d && d.tasks.length > 0 && d.tasks.every(t => isDone(t.id));
  }

  function setStart(d) { state.settings.startDate = { v: ymd(d), t: Date.now() }; commit(); }

  let noteTimer, pendingNote = null;
  function flushNote() {
    if (!pendingNote) return;
    clearTimeout(noteTimer);
    state.notes[pendingNote.k] = { v: pendingNote.v, t: Date.now() };
    pendingNote = null;
    ls.set(LS_STATE, JSON.stringify(state)); scheduleSync();
  }
  document.addEventListener("input", e => {
    if (e.target.matches("[data-note]")) {
      pendingNote = { k: e.target.dataset.note, v: e.target.value };
      clearTimeout(noteTimer);
      noteTimer = setTimeout(flushNote, 500);
    }
  });
  document.addEventListener("change", e => {
    if (e.target.id === "startInput" && e.target.value) { setStart(parse(e.target.value)); toast(`Старт: ${fmt(startDate())}`); }
    if (e.target.id === "importInput" && e.target.files[0]) importJSON(e.target.files[0]);
  });

  // ripple на всех круглых кнопках
  document.addEventListener("pointerdown", e => {
    const el = e.target.closest(".btn, .pill, .icon-btn, .chip");
    if (!el || REDUCED) return;
    const r = el.getBoundingClientRect(), size = Math.max(r.width, r.height);
    const s = document.createElement("span");
    s.className = "ripple";
    s.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - r.left - size / 2}px;top:${e.clientY - r.top - size / 2}px`;
    el.appendChild(s);
    setTimeout(() => s.remove(), 650);
  });
  // магнитные круглые кнопки
  if (matchMedia("(pointer: fine)").matches && !REDUCED) {
    document.addEventListener("pointermove", e => {
      document.querySelectorAll(".magnet").forEach(el => {
        const r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        const dx = e.clientX - cx, dy = e.clientY - cy, dist = Math.hypot(dx, dy);
        el.style.transform = dist < 90 ? `translate(${dx * .25}px, ${dy * .25}px)` : "";
      });
    });
  }

  // ---------- export / import / reset ----------
  function exportJSON() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = `java-plan-${ymd(new Date())}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast("Копия скачана");
  }
  function importJSON(file) {
    const r = new FileReader();
    r.onload = () => {
      try {
        const data = JSON.parse(r.result);
        if (!data || typeof data !== "object" || !data.tasks) throw 0;
        state = merge(state, data); commit(); toast("Импорт выполнен");
      } catch { toast("Это не файл резервной копии плана"); }
    };
    r.readAsText(file);
  }
  function resetAll() {
    if (!confirm("Сбросить все отметки и заметки на всех устройствах?")) return;
    const now = Date.now();
    Object.keys(state.tasks).forEach(k => state.tasks[k] = { done: false, t: now });
    Object.keys(state.notes).forEach(k => state.notes[k] = { v: "", t: now });
    commit(); toast("Прогресс сброшен");
  }

  // ---------- sync ----------
  let syncState = "local", syncing = false, again = false, timer, retry = 0, retryTimer;
  const syncBtn = $("#sync");
  const LABELS = { ok: "Сохранено", pending: "Сохраняю", offline: "Нет связи", auth: "Нужен пароль", local: "Только браузер" };
  function setSync(s) { syncState = s; syncBtn.dataset.s = s; syncBtn.querySelector(".sync-label").textContent = LABELS[s]; syncBtn.title = LABELS[s]; }
  const headers = () => ({ "Content-Type": "application/json", "x-app-key": ls.get(LS_KEY) || "" });
  function scheduleSync() { if (!health) return; setSync("pending"); clearTimeout(timer); timer = setTimeout(syncNow, 800); }

  async function syncNow(manual) {
    if (!health) { await checkHealth(); if (!health) { manual && toast("Сервер недоступен, работаю локально"); return; } }
    if (syncing) { again = true; return; }
    syncing = true; setSync("pending");
    try {
      const r = await fetch("/api/state", { method: "PUT", headers: headers(), body: JSON.stringify(state) });
      if (r.status === 401) { setSync("auth"); askPassword(); return; }
      if (!r.ok) throw new Error(r.status);
      const srv = await r.json();
      const before = JSON.stringify(state);
      state = merge(state, srv);
      ls.set(LS_STATE, JSON.stringify(state));
      setSync("ok"); retry = 0;
      if (JSON.stringify(state) !== before && !document.activeElement?.matches("textarea")) render();
      manual && toast("Синхронизировано");
    } catch {
      setSync("offline");
      clearTimeout(retryTimer);
      retryTimer = setTimeout(syncNow, Math.min(60000, 2000 * 2 ** retry++));
    } finally {
      syncing = false;
      if (again) { again = false; syncNow(); }
    }
  }
  async function checkHealth() {
    try {
      const r = await fetch("/api/health", { cache: "no-store" });
      health = r.ok ? await r.json() : null;
    } catch { health = null; }
    if (!health) setSync("local");
    return health;
  }

  const modal = $("#modal");
  function askPassword() { modal.hidden = false; setTimeout(() => $("#pwInput").focus(), 50); }
  $("#pwForm").addEventListener("submit", e => {
    e.preventDefault();
    ls.set(LS_KEY, $("#pwInput").value);
    $("#pwInput").value = ""; modal.hidden = true; syncNow(true);
  });
  $("#pwLater").addEventListener("click", () => { modal.hidden = true; });
  modal.addEventListener("click", e => { if (e.target === modal) modal.hidden = true; });
  addEventListener("keydown", e => { if (e.key === "Escape") modal.hidden = true; });

  addEventListener("online", () => syncNow());
  document.addEventListener("visibilitychange", () => { if (!document.hidden) { syncNow(); render(); } });
  setInterval(() => { if (!document.hidden && syncState !== "auth") syncNow(); }, 60000);
  // смена дня в полночь
  let lastDay = ymd(new Date());
  setInterval(() => { const d = ymd(new Date()); if (d !== lastDay) { lastDay = d; render(); } }, 30000);

  // ---------- toast ----------
  let toastTimer;
  function toast(msg) {
    const t = $("#toast"); t.textContent = msg; t.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove("show"), 2400);
  }

  // ---------- confetti (круглое) ----------
  const cv = $("#confetti"), cx = cv.getContext("2d");
  let parts = [], raf = 0;
  function burst(el, count) {
    if (REDUCED) return;
    const r = el.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
    const colors = ["#F1453D", "#F2A541", "#3DD6A3", "#5BC0EB", "#B388FF", "#EEF0FF"];
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2, v = (count > 50 ? 6 : 3) + Math.random() * (count > 50 ? 9 : 4);
      parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - (count > 50 ? 6 : 2), r: 2 + Math.random() * 5, c: colors[i % colors.length], life: 1 });
    }
    if (!raf) loop();
  }
  function loop() {
    cv.width = innerWidth * devicePixelRatio; cv.height = innerHeight * devicePixelRatio;
    cx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    cx.clearRect(0, 0, innerWidth, innerHeight);
    parts = parts.filter(p => p.life > 0);
    for (const p of parts) {
      p.vy += .32; p.vx *= .985; p.x += p.vx; p.y += p.vy; p.life -= .014;
      cx.globalAlpha = Math.max(p.life, 0); cx.fillStyle = p.c;
      cx.beginPath(); cx.arc(p.x, p.y, p.r, 0, Math.PI * 2); cx.fill();
    }
    raf = parts.length ? requestAnimationFrame(loop) : (cx.clearRect(0, 0, innerWidth, innerHeight), 0);
  }

  // ---------- start ----------
  setSync("local");
  render();
  checkHealth().then(h => { if (h) syncNow(); });
})();
