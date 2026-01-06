document.addEventListener("DOMContentLoaded", () => {
  // Smooth scroll for links with .js-scroll-link
  document.querySelectorAll(".js-scroll-link[href^='#']").forEach(link => {
    link.addEventListener("click", e => {
      const targetId = link.getAttribute("href");
      const target = document.querySelector(targetId);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  // Optional: focus main analysis CTA when coming from this page
  document.querySelectorAll(".js-start-analysis").forEach(btn => {
    btn.addEventListener("click", () => {
      // No-op now; hook for future tracking or UI tweaks
    });
  });
});
