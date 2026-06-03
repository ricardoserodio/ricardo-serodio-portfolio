const fs = require("fs");
const path = require("path");

const root = process.cwd();

const files = [
  {
    file: "src/pages/index.astro",
    lang: "en",
    title: "Ricardo Serôdio — Professional Portfolio",
    description:
      "Professional portfolio of Ricardo Serôdio — banking operations, wealth management, financial data quality, banking analytics and public finance portfolio projects.",
    canonical: "https://www.ricardoserodio.com/",
    homeHref: "/",
    languageHref: "/pt",
    languageLabel: "PT",
    ariaLabel: "Main navigation",
  },
  {
    file: "src/pages/pt.astro",
    lang: "pt",
    title: "Ricardo Serôdio — Portefólio Profissional",
    description:
      "Portefólio profissional de Ricardo Serôdio — operações bancárias, wealth management, qualidade de dados financeiros, banking analytics e projectos públicos de finanças.",
    canonical: "https://www.ricardoserodio.com/pt/",
    homeHref: "/pt",
    languageHref: "/",
    languageLabel: "EN",
    ariaLabel: "Navegação principal",
  },
];

function escapeAttr(value) {
  return value.replace(/"/g, "&quot;");
}

for (const config of files) {
  const fullPath = path.join(root, config.file);
  const backupPath = `${fullPath}.before-layout-v2.bak`;

  let source = fs.readFileSync(fullPath, "utf8");

  if (!fs.existsSync(backupPath)) {
    fs.writeFileSync(backupPath, source, "utf8");
  }

  source = source.replace(
    'import "../styles/global.css";',
    [
      'import BaseLayout from "../components/layout/BaseLayout.astro";',
      'import SiteHeader from "../components/layout/SiteHeader.astro";',
      'import SiteFooter from "../components/layout/SiteFooter.astro";',
    ].join("\n")
  );

  source = source.replace(/\nconst currentYear = new Date\(\)\.getFullYear\(\);\n/g, "\n");

  const layoutOpen = `<BaseLayout
  lang="${config.lang}"
  title="${escapeAttr(config.title)}"
  description="${escapeAttr(config.description)}"
  canonical="${config.canonical}"
>
  <SiteHeader
    navItems={navItems}
    homeHref="${config.homeHref}"
    languageHref="${config.languageHref}"
    languageLabel="${config.languageLabel}"
    ariaLabel="${config.ariaLabel}"
  />

  <main>`;

  source = source.replace(/<!doctype html>[\s\S]*?<main>/, layoutOpen);

  const footerRegex = /\n\s*<footer class="site-footer">[\s\S]*?<\/footer>\s*<\/body>\s*<\/html>\s*$/;

  const layoutClose = `

  <SiteFooter lang="${config.lang}" />
</BaseLayout>
`;

  source = source.replace(footerRegex, layoutClose);

  fs.writeFileSync(fullPath, source, "utf8");
  console.log(`Updated ${config.file}`);
}
