// src/scripts/try-it-out.ts
import { computeFitAssessment, type QuizSelections, type Capability, type FitLevel } from "./fitAssessment";

const WEBHOOK_URL = "/api/webhook";

function getSelections(root: ParentNode): QuizSelections {
  const communication =
    (root.querySelector<HTMLInputElement>('input[name="communication"]:checked')?.value ?? "").trim();

  const getMulti = (name: string) =>
    Array.from(root.querySelectorAll<HTMLInputElement>(`input[name="${name}"]:checked`)).map((i) => i.value);

  return {
    communication,
    logs: getMulti("logs"),
    infrastructure: getMulti("infrastructure"),
    code: getMulti("code"),
    metrics: getMulti("metrics"),
  };
}

function setText(id: string, value: string) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function setHidden(id: string, hidden: boolean) {
  const el = document.getElementById(id);
  if (!el) return;

  // 100% sigur (nu depinde de Tailwind)
  el.toggleAttribute("hidden", hidden);

  // opțional: păstrează și clasa, dacă vrei
  el.classList.toggle("hidden", hidden);
}

function syncAwsEcsVisibility(root: ParentNode = document) {
  const awsInput = root.querySelector<HTMLInputElement>('input[name="infrastructure"][value="aws"]');
  const ecsInput = root.querySelector<HTMLInputElement>('input[name="infrastructure"][value="ecs"]');
  const ecsWrap = document.getElementById("infra-ecs-wrap");
  if (!ecsWrap) return;

  const showEcs = !!awsInput?.checked;
  ecsWrap.toggleAttribute("hidden", !showEcs);
  ecsWrap.classList.toggle("hidden", !showEcs);

  if (!showEcs && ecsInput?.checked) {
    ecsInput.checked = false;
  }
}

function updateFitBarSticky() {
  const container = document.getElementById("tryItOutScroll");
  const fitBar = document.getElementById("fitBar");
  if (!container || !fitBar) return;
  const threshold = 2;
  const atBottom =
    container.scrollTop + container.clientHeight >= container.scrollHeight - threshold;
  fitBar.classList.toggle("sticky", !atBottom);
  fitBar.classList.toggle("bottom-0", !atBottom);
}

function formatList(items: string[]) {
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

function collectNeeds(root: ParentNode = document) {
  const needs = [
    { id: "noisy-alerts", label: "Too many alerts / noisy alerts" },
    { id: "slow-rca", label: "Slow RCA process" },
    { id: "cross-team", label: "Cross-team incidents" },
    { id: "sre-agent", label: "We use coding agents and want to explore an SRE agent" },
    { id: "other", label: "Other" },
  ];

  return needs
    .filter((n) => root.querySelector<HTMLInputElement>(`#${n.id}`)?.checked)
    .map((n) => ({ id: n.id, label: n.label }));
}

function syncBookCallState(root: ParentNode = document) {
  const nameInput = root.querySelector<HTMLInputElement>("#name");
  const emailInput = root.querySelector<HTMLInputElement>("#email");
  const termsInput = root.querySelector<HTMLInputElement>("#terms");
  const bookCallBtn = document.getElementById("bookCallBtn") as HTMLButtonElement | null;
  const hint = document.getElementById("bookCallHint");

  if (!bookCallBtn) return;

  const needsChecked = Array.from(
    root.querySelectorAll<HTMLInputElement>(
      "#noisy-alerts, #slow-rca, #cross-team, #sre-agent, #other"
    )
  ).some((el) => el.checked);

  const emailValue = emailInput?.value.trim() ?? "";
  const emailValid = emailValue.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue);

  const missing: string[] = [];
  if (!nameInput?.value.trim()) missing.push("enter your name");
  if (!emailValue) {
    missing.push("enter your work email");
  } else if (!emailValid) {
    missing.push("enter a valid work email");
  }
  if (!needsChecked) missing.push("select at least one option above");
  if (!termsInput?.checked) missing.push("accept the Terms & Conditions");

  const canSubmit = missing.length === 0;
  bookCallBtn.disabled = !canSubmit;

  if (hint) {
    if (canSubmit) {
      hint.textContent = "All set. You can book a call.";
      hint.classList.add("hidden");
    } else {
      hint.textContent = `To book a call, please ${formatList(missing)}.`;
      hint.classList.remove("hidden");
    }
  }
}


function iconCheck(className: string) {
  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
    class="${className}">
    <circle cx="12" cy="12" r="10"></circle>
    <path d="m9 12 2 2 4-4"></path>
  </svg>`;
}

function iconX(className: string) {
  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
    class="${className}">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" x2="12" y1="8" y2="12"></line>
    <line x1="12" x2="12.01" y1="16" y2="16"></line>
  </svg>`;
}

function iconInfo(className: string) {
  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
    class="${className}">
    <circle cx="12" cy="12" r="10"></circle>
    <path d="M12 16v-4"></path>
    <path d="M12 8h.01"></path>
  </svg>`;
}

function capabilityRow(c: Capability) {
  const icon = c.enabled
    ? iconCheck("lucide lucide-circle-check text-emerald-700 flex-shrink-0 mt-0.5")
    : iconX("lucide lucide-circle-x text-gray-400 flex-shrink-0 mt-0.5");

  const titleClass = c.enabled ? "text-gray-900" : "text-gray-500";
  const descClass = c.enabled ? "text-gray-600" : "text-gray-400";

  return `
    <div class="flex items-start gap-2.5">
      ${icon}
      <div class="flex-1 min-w-0 space-y-1">
        <div class="text-sm font-medium leading-tight ${titleClass}">${c.label}</div>
        <p class="text-xs leading-relaxed ${descClass}">${c.description}</p>
      </div>
    </div>
  `;
}

function barTheme(level: FitLevel, enabledCount: number) {
  // verde pt 3+, amber pt 1-2, gri pt 0
  if (level === "good" || level === "excellent" || enabledCount >= 3) {
    return {
      wrap: "bg-emerald-50 border-emerald-200",
      label: "text-emerald-700",
      icon: iconCheck("lucide lucide-circle-check h-4 w-4 text-emerald-700"),
    };
  }
  if (enabledCount === 2) {
    return {
      wrap: "bg-amber-50 border-amber-200",
      label: "text-amber-700",
      icon: iconInfo("lucide lucide-info h-4 w-4 text-amber-700"),
    };
  }
  if (enabledCount === 1) {
    return {
      wrap: "bg-amber-50 border-amber-200",
      label: "text-amber-700",
      icon: iconX("lucide lucide-circle-alert h-4 w-4 text-amber-700"),
    };
  }
  return {
    wrap: "bg-gray-100 border-gray-200",
    label: "text-gray-700",
    icon: iconX("lucide lucide-circle-alert h-4 w-4 text-gray-500"),
  };
}

function barCopy(level: FitLevel) {
  if (level === "excellent") return { label: "Complete coverage", note: "Ready for comprehensive investigations" };
  if (level === "good") return { label: "Good fit", note: "Ready for comprehensive investigations" };
  if (level === "minimal") return { label: "Basic fit", note: "Some integrations missing" };
  if (level === "poor") return { label: "Poor fit", note: "Requires logs or metrics integration" };
  return { label: "Select your stack", note: "See what Cleric can do for you" };
}

function updateUI() {
  syncAwsEcsVisibility();
  const selections = getSelections(document);
  const a = computeFitAssessment(selections);
  
  setText("assessTitle", a.title);
  setText("assessDesc", a.description);

  const list = document.getElementById("capabilitiesList");
  if (list) list.innerHTML = a.capabilities.map(capabilityRow).join("");

  setHidden("capabilitiesSection", a.enabledCount === 0);

  const fitBar = document.getElementById("fitBar");
  if (fitBar) {

    const theme = barTheme(a.level, a.enabledCount);
    // curățăm doar temele, nu tot className (altfel pierzi spacing/structure)
    fitBar.classList.remove("bg-emerald-50", "border-emerald-200", "bg-amber-50", "border-amber-200", "bg-gray-100", "border-gray-200");
    theme.wrap.split(" ").forEach((c) => fitBar.classList.add(c));

    const copy = barCopy(a.level);

    const icon = document.getElementById("fitBarIcon");
    if (icon) icon.innerHTML = theme.icon;

    const label = document.getElementById("fitBarLabel");
    if (label) {
      label.textContent = copy.label;
      label.classList.remove("text-emerald-700", "text-amber-700", "text-gray-700");
      label.classList.add(theme.label);
    }

    const totalCount = a.totalCount > 0 ? a.totalCount : a.capabilities.length || 5;
    setText("fitBarCount", `${a.enabledCount}/${totalCount} enabled`);
    setText("fitBarNote", copy.note);
    setText("fitBarNoteMobile", copy.note);

    // buton
    setHidden("continueBtn", !a.canContinue);
  }

  updateFitBarSticky();
}

export default function initTryItOut() {
  updateUI();
  syncBookCallState();
  const continueBtn = document.getElementById("continueBtn");
  if (continueBtn) {
    continueBtn.addEventListener("click", (e) => {
      e.preventDefault();
      setHidden("form-sect-1", true);
      setHidden("form-sect-2", false);
      setHidden("fitBar", true);
      setHidden("assessmentCard", true);
      setHidden("assessmentText", false);
      const scrollContainer = document.getElementById("tryItOutScroll");
      if (scrollContainer) {
        requestAnimationFrame(() => {
          scrollContainer.scrollTo({ top: 0, behavior: "smooth" });
        });
      }
    });
  }

  const backBtn = document.getElementById("back");
  if (backBtn) {
    backBtn.addEventListener("click", (e) => {
      e.preventDefault();
      setHidden("form-sect-2", true);
      setHidden("form-sect-1", false);
      setHidden("fitBar", false);
      setHidden("assessmentCard", false);
      setHidden("assessmentText", true);
    });
  }

  const bookCallBtn = document.getElementById("bookCallBtn") as HTMLButtonElement | null;
  if (bookCallBtn) {
    bookCallBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      if (bookCallBtn.disabled) return;

      const nameInput = document.querySelector<HTMLInputElement>("#name");
      const emailInput = document.querySelector<HTMLInputElement>("#email");
      const commentsInput = document.querySelector<HTMLTextAreaElement>("#comments");
      const termsInput = document.querySelector<HTMLInputElement>("#terms");
      const hint = document.getElementById("bookCallHint");

      const selections = getSelections(document);
      const assessment = computeFitAssessment(selections);
      const needs = collectNeeds(document);

      const payload = {
        name: nameInput?.value.trim() ?? "",
        email: emailInput?.value.trim() ?? "",
        needs,
        comments: commentsInput?.value.trim() ?? "",
        termsAccepted: !!termsInput?.checked,
        selections,
        fit: {
          level: assessment.level,
          enabledCount: assessment.enabledCount,
          totalCount: assessment.totalCount,
        },
        meta: {
          submittedAt: new Date().toISOString(),
          page: "/try-it-out",
        },
      };

      const previousLabel = bookCallBtn.textContent ?? "Book a call";
      bookCallBtn.disabled = true;
      bookCallBtn.textContent = "Sending...";
      if (hint) {
        hint.textContent = "Submitting your details...";
        hint.classList.remove("hidden");
      }

      try {
        const response = await fetch(WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          let errorMessage = `Webhook error: ${response.status}`;
          try {
            const data = await response.json();
            if (data?.error) {
              errorMessage = data.error;
            }
          } catch (parseErr) {
            // Ignore parsing errors and fall back to status.
          }
          throw new Error(errorMessage);
        }
        bookCallBtn.textContent = "Sent!";
        bookCallBtn.disabled = false;
        setTimeout(() => {
          bookCallBtn.textContent = previousLabel;
          syncBookCallState();
        }, 2000);
        if (hint) {
          hint.textContent = "Thanks! Your request was submitted.";
          hint.classList.remove("hidden");
        }
      } catch (err) {
        bookCallBtn.disabled = false;
        bookCallBtn.textContent = previousLabel;
        if (hint) {
          const errorMessage =
            err instanceof Error ? err.message : "Something went wrong. Please try again.";
          hint.textContent = errorMessage;
          hint.classList.remove("hidden");
        }
      }
    });
  }

  const scrollContainer = document.getElementById("tryItOutScroll");
  if (scrollContainer) {
    scrollContainer.addEventListener("scroll", updateFitBarSticky);
  }
  window.addEventListener("resize", updateFitBarSticky);
  document.addEventListener("change", (e) => {
    const t = e.target as HTMLElement | null;
    if (!t) return;
    if (
      t.matches(
        'input[name="communication"], input[name="logs"], input[name="infrastructure"], input[name="code"], input[name="metrics"]'
      )
    ) {
      updateUI();
    }
    syncBookCallState();
  });

  document.addEventListener("input", (e) => {
    const t = e.target as HTMLElement | null;
    if (!t) return;
    if (t.matches("#name, #email")) {
      syncBookCallState();
    }
  });
}

if (typeof window !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initTryItOut);
  } else {
    initTryItOut();
  }
}
