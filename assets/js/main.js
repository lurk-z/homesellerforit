const pageMap = {
  home: "index.html",
  products: "products.html",
  services: "services.html",
  about: "about.html",
  contact: "contact.html",
};

const body = document.body;
const currentPage = body.dataset.page || "home";
const siteNav = document.getElementById("site-nav");
const menuToggle = document.querySelector(".menu-toggle");

if (menuToggle && siteNav) {
  menuToggle.addEventListener("click", () => {
    const isExpanded = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!isExpanded));
    siteNav.classList.toggle("open");
  });

  siteNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      siteNav.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
    });
  });
}

document.querySelectorAll(".nav-link").forEach((link) => {
  if (link.getAttribute("href") === pageMap[currentPage]) {
    link.classList.add("active");
  }
});

window.dataLayer = window.dataLayer || [];

function pushAnalytics(eventName, payload = {}) {
  const eventData = {
    event: eventName,
    page: currentPage,
    page_title: document.title,
    timestamp: new Date().toISOString(),
    ...payload,
  };

  window.dataLayer.push(eventData);
  document.dispatchEvent(new CustomEvent("analytics:event", { detail: eventData }));
  console.info("[analytics]", eventData);
}

function collectSelections(form) {
  const summary = {};

  form.querySelectorAll("[data-analytics-key]").forEach((field) => {
    const key = field.dataset.analyticsKey;

    if (!key) {
      return;
    }

    if ((field.type === "checkbox" || field.type === "radio") && !field.checked) {
      return;
    }

    const value = String(field.value || "").trim();

    if (!value) {
      return;
    }

    if (summary[key]) {
      summary[key] = Array.isArray(summary[key]) ? [...summary[key], value] : [summary[key], value];
      return;
    }

    summary[key] = value;
  });

  return summary;
}

document.querySelectorAll("[data-track-click]").forEach((element) => {
  element.addEventListener("click", () => {
    pushAnalytics("cta_click", {
      label: element.dataset.trackClick || element.textContent.trim(),
      area: element.dataset.trackArea || "content",
    });
  });
});

document.querySelectorAll(".data-form").forEach((form) => {
  const status = form.querySelector(".form-status");

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const filledFields = Array.from(formData.entries()).filter(([, value]) => String(value).trim() !== "");
    const consentField = form.querySelector('input[name="consent"]');

    // Push only non-PII summary fields that are explicitly marked for analytics.
    pushAnalytics("form_submit", {
      form_name: form.dataset.formName || "unknown_form",
      filled_fields: filledFields.length,
      consent: consentField ? consentField.checked : false,
      selections: collectSelections(form),
    });

    if (status) {
      status.textContent = "ส่งข้อมูลเรียบร้อยแล้ว ทีมงานจะติดต่อกลับโดยเร็ว";
    }

    form.reset();

    window.setTimeout(() => {
      if (status) {
        status.textContent = "";
      }
    }, 5000);
  });
});

pushAnalytics("page_view");
