const animatedElements = document.querySelectorAll(
  "section:not(.hero-cinematic), .project-card, .experience-card, .skill-card, .stat-card, .certification-card, .learning-card, .contact-card"
);

if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  animatedElements.forEach((element) => {
    element.classList.add("reveal-on-scroll");
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.12,
      rootMargin: "0px 0px -8% 0px",
    }
  );

  animatedElements.forEach((element) => observer.observe(element));
}
