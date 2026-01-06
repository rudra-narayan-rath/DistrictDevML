// Smooth scrolling for same-page links and subtle interaction on "Start Analysis"
document.addEventListener("DOMContentLoaded", function () {
  const internalLinks = document.querySelectorAll('a[href^="#"]');

  internalLinks.forEach((link) => {
    link.addEventListener("click", function (event) {
      const targetId = this.getAttribute("href").substring(1);
      const targetElement = document.getElementById(targetId);

      if (targetElement) {
        event.preventDefault();
        targetElement.scrollIntoView({ behavior: "smooth" });
      }
    });
  });

  const startButtons = document.querySelectorAll(".js-start-analysis");
  startButtons.forEach((btn) => {
    btn.addEventListener("click", function (event) {
      // Replace this with navigation to your real analysis page / route
      // For now, only prevent default if href is "#analyze"
      const href = btn.getAttribute("href");
      if (href === "#analyze") {
        event.preventDefault();
        // Placeholder behavior
        alert("This would open the district analysis workflow UI.");
      }
    });
  });
});
