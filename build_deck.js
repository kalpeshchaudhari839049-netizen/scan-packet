onst pptxgen = require("C:\\Users\\Admin\\.copilot\\session-state\\f4249806-6db2-4f07-aaec-9cb37d3cc9d0\\tools\\node_modules\\pptxgenjs");

const pptx = new pptxgen();
pptx.layout = "LAYOUT_WIDE";
pptx.author = "Code Alpha";
pptx.subject = "AI-Based Compliance Checker for Packaged Commodities";
pptx.title = "Code Alpha | Smart India Hackathon 2026";
pptx.company = "Code Alpha";
pptx.lang = "en-IN";
pptx.theme = {
  headFontFace: "Segoe UI",
  bodyFontFace: "Segoe UI",
  lang: "en-IN",
};
pptx.defineSlideMaster({
  title: "BASE",
  background: { color: "F5F8FC" },
  objects: [],
});

const W = 13.333;
const H = 7.5;
const C = {
  navy: "122743",
  navy2: "1B3659",
  blue: "3478F6",
  blueLight: "EAF1FF",
  green: "1C9A68",
  greenLight: "E6F5EF",
  orange: "E89436",
  orangeLight: "FFF2E3",
  red: "D95454",
  redLight: "FCEBEB",
  ink: "24364B",
  muted: "62748A",
  line: "DCE5EF",
  bg: "F5F8FC",
  white: "FFFFFF",
};
const FONT = "Segoe UI";

function svgIcon(name, color = C.blue) {
  const icons = {
    camera: '<path d="M4 8h3l1.6-2h5L15.2 8H20v10H4z"/><circle cx="12" cy="13" r="3.1"/>',
    scan: '<path d="M5 8V5h3M16 5h3v3M19 16v3h-3M8 19H5v-3"/><path d="M7 12h10M7 15h7M7 9h10"/>',
    ocr: '<rect x="4.5" y="5.5" width="15" height="13" rx="2"/><path d="M7.5 14V11a1.7 1.7 0 0 1 3.4 0v3m-3.4-1.2h3.4M13 9.3h3.5M13 12h3.5M13 14.7h2.4"/>',
    database: '<ellipse cx="12" cy="6.5" rx="7.2" ry="2.7"/><path d="M4.8 6.5v10.7c0 1.5 3.2 2.7 7.2 2.7s7.2-1.2 7.2-2.7V6.5M4.8 12c0 1.5 3.2 2.7 7.2 2.7s7.2-1.2 7.2-2.7"/>',
    scales: '<path d="M12 4v15M7 20h10M8 7h8M12 4l-1.5 3M12 4l1.5 3"/><path d="M6 7 3 14h6zM18 7l-3 7h6z"/>',
    report: '<path d="M7 3.8h7l4 4V20H7z"/><path d="M14 4v4h4M10 12h5M10 15h5M10 18h3"/>',
    shield: '<path d="M12 3.5 19 6v5.4c0 4.3-2.8 7.3-7 9.1-4.2-1.8-7-4.8-7-9.1V6z"/><path d="m9 12 2 2 4-4"/>',
    clock: '<circle cx="12" cy="12" r="8.3"/><path d="M12 7v5l3.2 2"/>',
    target: '<circle cx="12" cy="12" r="8.2"/><circle cx="12" cy="12" r="4.4"/><circle cx="12" cy="12" r="1"/>',
    alert: '<path d="m12 4 9 16H3z"/><path d="M12 9v5m0 3h.01"/>',
    people: '<circle cx="9" cy="8" r="3"/><path d="M3 20v-1.5a6 6 0 0 1 12 0V20z"/><path d="M16 5.5a3 3 0 0 1 0 5.8M18 14a5 5 0 0 1 3 4.5V20"/>',
  };
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#${color}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${icons[name]}</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

function addIcon(slide, name, x, y, w, color) {
  slide.addImage({ data: svgIcon(name, color), x, y, w, h: w });
}

function addBadge(slide, inverse = false) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.58, y: 0.34, w: 1.52, h: 0.38, rectRadius: 0.13,
    fill: { color: inverse ? C.white : C.navy },
    line: { color: inverse ? C.white : C.navy, transparency: 100 },
  });
  slide.addText("CODE ALPHA", {
    x: 0.69, y: 0.405, w: 1.3, h: 0.21,
    fontFace: FONT, fontSize: 10, bold: true, charSpacing: 1.1,
    color: inverse ? C.navy : C.white, margin: 0, align: "center",
  });
}

function addHeader(slide, title, section) {
  addBadge(slide);
  slide.addText(section.toUpperCase(), {
    x: 0.6, y: 0.96, w: 4.4, h: 0.2, fontFace: FONT, fontSize: 9,
    bold: true, charSpacing: 1.6, color: C.blue, margin: 0,
  });
  slide.addText(title, {
    x: 0.58, y: 1.18, w: 12.1, h: 0.48, fontFace: FONT, fontSize: 25,
    bold: true, color: C.navy, margin: 0, breakLine: false, fit: "shrink",
  });
  slide.addShape(pptx.ShapeType.line, {
    x: 0.6, y: 1.79, w: 12.15, h: 0,
    line: { color: C.line, width: 1 },
  });
}

function addFooter(slide, n) {
  slide.addText("SMART INDIA HACKATHON 2026", {
    x: 0.6, y: 7.12, w: 3.8, h: 0.17,
    fontFace: FONT, fontSize: 8, bold: true, charSpacing: 0.7,
    color: C.muted, margin: 0,
  });
  slide.addText(String(n).padStart(2, "0"), {
    x: 12.22, y: 7.12, w: 0.5, h: 0.17,
    fontFace: FONT, fontSize: 8, color: C.muted, align: "right", margin: 0,
  });
}

function addNotes(slide, lines) {
  slide.addNotes(lines.join("\n"));
}

// 1 — Opening
{
  const slide = pptx.addSlide();
  slide.background = { color: C.navy };
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: W, h: H, fill: { color: C.navy }, line: { color: C.navy } });
  slide.addShape(pptx.ShapeType.ellipse, { x: 9.45, y: 0.82, w: 4.45, h: 4.45, fill: { color: C.navy2, transparency: 10 }, line: { color: "315074", transparency: 45, width: 1 } });
  slide.addShape(pptx.ShapeType.ellipse, { x: 10.1, y: 1.47, w: 3.15, h: 3.15, fill: { color: C.navy, transparency: 100 }, line: { color: "4D6A8B", transparency: 30, width: 1 } });
  addBadge(slide, true);
  slide.addText("Code Alpha", {
    x: 0.78, y: 1.55, w: 7.8, h: 0.82, fontFace: FONT, fontSize: 43, bold: true,
    color: C.white, margin: 0, breakLine: false,
  });
  slide.addShape(pptx.ShapeType.rect, { x: 0.8, y: 2.62, w: 0.78, h: 0.055, fill: { color: C.blue }, line: { color: C.blue } });
  slide.addText("AI-Based Compliance Checker\nfor Packaged Commodities", {
    x: 0.8, y: 2.98, w: 7.2, h: 1.13, fontFace: FONT, fontSize: 24, bold: true,
    color: "E8EFF9", breakLine: false, margin: 0, lineSpacingMultiple: 1.1,
  });
  slide.addText("From label to verdict in seconds — OCR + AI/NLP + Regulatory Rule Engine", {
    x: 0.82, y: 4.52, w: 7.7, h: 0.62, fontFace: FONT, fontSize: 15,
    color: "B6C6DC", margin: 0, breakLine: false, fit: "shrink",
  });
  const icons = [
    { name: "camera", label: "CAPTURE", color: C.blue, x: 9.53 },
    { name: "ocr", label: "EXTRACT", color: C.green, x: 10.78 },
    { name: "shield", label: "VERIFY", color: C.orange, x: 12.03 },
  ];
  for (const item of icons) {
    slide.addShape(pptx.ShapeType.ellipse, { x: item.x, y: 2.43, w: 0.78, h: 0.78, fill: { color: C.white, transparency: 4 }, line: { color: item.color, width: 1.2 } });
    addIcon(slide, item.name, item.x + 0.19, 2.62, 0.4, item.color);
    slide.addText(item.label, { x: item.x - 0.18, y: 3.43, w: 1.15, h: 0.22, fontFace: FONT, fontSize: 8, bold: true, charSpacing: 1, color: "C3D1E2", align: "center", margin: 0 });
  }
  for (const x of [10.39, 11.64]) {
    slide.addShape(pptx.ShapeType.line, { x, y: 2.81, w: 0.32, h: 0, line: { color: "8094AE", width: 1.4, endArrowType: "triangle" } });
  }
  slide.addShape(pptx.ShapeType.line, { x: 0.8, y: 6.62, w: 11.9, h: 0, line: { color: "3C5471", transparency: 20, width: 1 } });
  slide.addText("SMART INDIA HACKATHON 2026", { x: 0.8, y: 6.88, w: 4.4, h: 0.2, fontFace: FONT, fontSize: 9, bold: true, charSpacing: 1.2, color: "C3D1E2", margin: 0 });
  slide.addText("LABEL  →  EVIDENCE  →  DECISION", { x: 8.5, y: 6.88, w: 4.2, h: 0.2, fontFace: FONT, fontSize: 9, bold: true, charSpacing: 0.8, color: "C3D1E2", align: "right", margin: 0 });
  addNotes(slide, [
    "We are Code Alpha, presenting an AI-based compliance checker for packaged commodities. Our goal is to make label review easier to start and easier to explain.",
    "A product image becomes extracted label information, then a check against encoded requirements. The proposed experience aims to surface a clear result and supporting evidence.",
    "This is a decision-support concept: rules remain configurable, and uncertain cases can be directed for human review. We will show the need, approach, governing frameworks and expected value.",
  ]);
}

// 2 — Problem and gaps
{
  const slide = pptx.addSlide("BASE");
  addHeader(slide, "Problem Statement & Existing Gaps", "The challenge");
  const cards = [
    { icon: "clock", color: C.blue, tint: C.blueLight, title: "Manual &\nTime-Consuming", desc: "Label checks rely on repeated, hands-on review." },
    { icon: "target", color: C.orange, tint: C.orangeLight, title: "Error-Prone &\nInconsistent", desc: "Interpretation can vary across reviewers and checks." },
    { icon: "alert", color: C.red, tint: C.redLight, title: "Delays &\nPenalties", desc: "High rejections and costs can follow missed declarations." },
    { icon: "shield", color: C.green, tint: C.greenLight, title: "Low Trust &\nConfidence", desc: "Without clear evidence, outcomes are harder to trust." },
  ];
  cards.forEach((card, i) => {
    const x = 0.58 + i * 3.08;
    slide.addShape(pptx.ShapeType.roundRect, { x, y: 2.11, w: 2.83, h: 2.85, rectRadius: 0.12, fill: { color: C.white }, line: { color: C.line, width: 1 } });
    slide.addShape(pptx.ShapeType.ellipse, { x: x + 0.23, y: 2.38, w: 0.66, h: 0.66, fill: { color: card.tint }, line: { color: card.tint } });
    addIcon(slide, card.icon, x + 0.37, 2.52, 0.38, card.color);
    slide.addText(card.title, { x: x + 0.23, y: 3.25, w: 2.35, h: 0.76, fontFace: FONT, fontSize: 16, bold: true, color: C.navy, margin: 0, breakLine: false, fit: "shrink" });
    slide.addText(card.desc, { x: x + 0.23, y: 4.17, w: 2.35, h: 0.52, fontFace: FONT, fontSize: 11.5, color: C.muted, margin: 0, breakLine: false, valign: "top", fit: "shrink" });
  });
  slide.addShape(pptx.ShapeType.roundRect, { x: 0.58, y: 5.42, w: 12.07, h: 0.94, rectRadius: 0.12, fill: { color: C.navy }, line: { color: C.navy } });
  slide.addShape(pptx.ShapeType.rect, { x: 0.83, y: 5.7, w: 0.06, h: 0.36, fill: { color: C.orange }, line: { color: C.orange } });
  slide.addText("No scalable, standardized, evidence-backed way to verify labels at volume.", { x: 1.08, y: 5.66, w: 11.1, h: 0.38, fontFace: FONT, fontSize: 17, bold: true, color: C.white, margin: 0, fit: "shrink" });
  addFooter(slide, 2);
  addNotes(slide, [
    "Packaged-commodity labels bring multiple declarations together, and each check has to be both careful and repeatable. When reviews are manual, the process can be slow and difficult to standardize.",
    "Different interpretations can lead to inconsistent outcomes; missed requirements can contribute to rejections, delays or costs. Just as important, a result without traceable evidence is harder to explain.",
    "The gap is not simply the absence of OCR. It is the lack of a scalable and evidence-backed way to connect what a label says with the applicable rule and a reviewable outcome.",
  ]);
}

// 3 — Solution and technical approach
{
  const slide = pptx.addSlide("BASE");
  addHeader(slide, "Proposed Solution & Technical Approach", "The workflow");
  const steps = [
    { icon: "camera", color: C.blue, label: "Image\nUpload", sub: "Product label" },
    { icon: "scan", color: C.blue, label: "Image\nProcessing", sub: "OpenCV" },
    { icon: "ocr", color: C.green, label: "OCR & Field\nExtraction", sub: "Tesseract" },
    { icon: "database", color: C.green, label: "Structured\nData", sub: "JSON" },
    { icon: "scales", color: C.orange, label: "Rule Engine\nValidation", sub: "Configured rules" },
    { icon: "report", color: C.navy2, label: "Compliance\nReport", sub: "Pass · Fail · Review" },
  ];
  const x0 = 0.58;
  const stepW = 1.36;
  const gap = 0.19;
  steps.forEach((step, i) => {
    const x = x0 + i * (stepW + gap);
    slide.addShape(pptx.ShapeType.roundRect, { x, y: 2.49, w: stepW, h: 2.56, rectRadius: 0.11, fill: { color: C.white }, line: { color: C.line, width: 1 } });
    slide.addShape(pptx.ShapeType.ellipse, { x: x + 0.45, y: 2.76, w: 0.46, h: 0.46, fill: { color: step.color, transparency: 90 }, line: { color: step.color, transparency: 100 } });
    addIcon(slide, step.icon, x + 0.54, 2.85, 0.28, step.color);
    slide.addText(String(i + 1).padStart(2, "0"), { x: x + 0.17, y: 3.47, w: 0.42, h: 0.22, fontFace: FONT, fontSize: 9, bold: true, color: step.color, margin: 0 });
    slide.addText(step.label, { x: x + 0.16, y: 3.78, w: stepW - 0.32, h: 0.61, fontFace: FONT, fontSize: 12.2, bold: true, color: C.navy, align: "center", margin: 0, fit: "shrink" });
    slide.addText(step.sub, { x: x + 0.12, y: 4.54, w: stepW - 0.24, h: 0.28, fontFace: FONT, fontSize: 9.3, color: C.muted, align: "center", margin: 0, fit: "shrink" });
    if (i < steps.length - 1) {
      slide.addShape(pptx.ShapeType.line, { x: x + stepW + 0.02, y: 3.78, w: gap - 0.03, h: 0, line: { color: "8BA3BE", width: 1.2, endArrowType: "triangle" } });
    }
  });
  slide.addShape(pptx.ShapeType.roundRect, { x: 9.78, y: 2.16, w: 2.97, h: 3.55, rectRadius: 0.13, fill: { color: C.navy }, line: { color: C.navy } });
  slide.addText("TECH STACK", { x: 10.08, y: 2.48, w: 2.33, h: 0.24, fontFace: FONT, fontSize: 10, bold: true, charSpacing: 1.2, color: "B6C8DF", margin: 0 });
  const stack = ["Python", "OpenCV", "Tesseract OCR", "AI / NLP", "Database"];
  stack.forEach((name, i) => {
    const y = 2.95 + i * 0.48;
    slide.addShape(pptx.ShapeType.ellipse, { x: 10.08, y: y + 0.075, w: 0.12, h: 0.12, fill: { color: i === 3 ? C.orange : C.green }, line: { color: i === 3 ? C.orange : C.green } });
    slide.addText(name, { x: 10.34, y, w: 2.03, h: 0.28, fontFace: FONT, fontSize: 13, color: C.white, margin: 0 });
  });
  slide.addText("OUTCOME", { x: 0.68, y: 5.68, w: 0.7, h: 0.18, fontFace: FONT, fontSize: 8.5, bold: true, charSpacing: 0.7, color: C.muted, margin: 0 });
  [
    { text: "PASS", x: 1.48, w: 0.87, color: C.green, fill: C.greenLight },
    { text: "FAIL", x: 2.49, w: 0.87, color: C.red, fill: C.redLight },
    { text: "NEEDS REVIEW", x: 3.5, w: 1.4, color: C.orange, fill: C.orangeLight },
  ].forEach((status) => {
    slide.addShape(pptx.ShapeType.roundRect, { x: status.x, y: 5.53, w: status.w, h: 0.46, rectRadius: 0.1, fill: { color: status.fill }, line: { color: status.fill } });
    slide.addText(status.text, { x: status.x + 0.08, y: 5.67, w: status.w - 0.16, h: 0.16, fontFace: FONT, fontSize: 8.5, bold: true, charSpacing: 0.25, color: status.color, align: "center", margin: 0, fit: "shrink" });
  });
  slide.addText("Human review for uncertain cases", { x: 5.12, y: 5.66, w: 3.94, h: 0.2, fontFace: FONT, fontSize: 10.5, italic: true, color: C.muted, margin: 0, fit: "shrink" });
  slide.addShape(pptx.ShapeType.roundRect, { x: 9.78, y: 5.88, w: 2.97, h: 0.58, rectRadius: 0.1, fill: { color: C.blueLight }, line: { color: C.blueLight } });
  slide.addText("Evidence-backed results", { x: 10.03, y: 6.06, w: 2.47, h: 0.2, fontFace: FONT, fontSize: 11, bold: true, color: C.blue, align: "center", margin: 0 });
  addFooter(slide, 3);
  addNotes(slide, [
    "The workflow starts with an image and prepares it for extraction. OpenCV supports image processing, while Tesseract OCR reads visible text and helps turn key declarations into structured fields.",
    "Those fields are represented as JSON and checked by a configurable rule engine. The output is a report with pass, fail or needs-review states, using color to make triage easier.",
    "The architecture combines Python, computer vision, OCR, AI/NLP and a database. A practical safeguard is to make uncertain extraction or interpretation visible for human review rather than hide ambiguity.",
  ]);
}

// 4 — Legal frameworks
{
  const slide = pptx.addSlide("BASE");
  addHeader(slide, "Legal & Regulatory Frameworks", "The compliance foundation");
  const laws = [
    { icon: "scales", color: C.blue, tag: "FOUNDATIONAL ACT", title: "Legal Metrology\nAct, 2009", desc: "The overarching legal metrology framework for weights, measures and related declarations." },
    { icon: "report", color: C.orange, tag: "PACKAGED COMMODITIES", title: "Legal Metrology (Packaged\nCommodities) Rules, 2011", desc: "Packaged-commodity declarations and requirements, including applicable amendments." },
    { icon: "shield", color: C.green, tag: "FOOD PRODUCTS", title: "FSSAI Labelling and Display\nRegulations, 2020", desc: "Food-labelling provisions for food-packaged commodities, where applicable." },
  ];
  laws.forEach((law, i) => {
    const x = 0.6 + i * 4.12;
    slide.addShape(pptx.ShapeType.roundRect, { x, y: 2.1, w: 3.84, h: 3.06, rectRadius: 0.13, fill: { color: C.white }, line: { color: C.line, width: 1 } });
    slide.addShape(pptx.ShapeType.ellipse, { x: x + 0.27, y: 2.4, w: 0.67, h: 0.67, fill: { color: law.color, transparency: 90 }, line: { color: law.color, transparency: 100 } });
    addIcon(slide, law.icon, x + 0.42, 2.54, 0.38, law.color);
    slide.addText(law.tag, { x: x + 1.1, y: 2.61, w: 2.4, h: 0.19, fontFace: FONT, fontSize: 8.5, bold: true, charSpacing: 0.8, color: law.color, margin: 0, fit: "shrink" });
    slide.addText(law.title, { x: x + 0.27, y: 3.38, w: 3.3, h: 0.68, fontFace: FONT, fontSize: 16, bold: true, color: C.navy, margin: 0, fit: "shrink" });
    slide.addText(law.desc, { x: x + 0.27, y: 4.26, w: 3.3, h: 0.58, fontFace: FONT, fontSize: 10.8, color: C.muted, margin: 0, valign: "top", fit: "shrink" });
  });
  slide.addShape(pptx.ShapeType.roundRect, { x: 0.6, y: 5.54, w: 12.08, h: 0.95, rectRadius: 0.11, fill: { color: C.blueLight }, line: { color: C.blueLight } });
  addIcon(slide, "report", 0.87, 5.77, 0.42, C.blue);
  slide.addText("Rules are encoded in a configurable rule engine, so legal updates become rule updates, not code rewrites.", { x: 1.48, y: 5.81, w: 10.84, h: 0.36, fontFace: FONT, fontSize: 14, bold: true, color: C.navy, margin: 0, fit: "shrink" });
  addFooter(slide, 4);
  addNotes(slide, [
    "The proposed checks are grounded in three relevant frameworks: the Legal Metrology Act, the Packaged Commodities Rules and, for food products, FSSAI's Labelling and Display Regulations.",
    "The rules are not interchangeable: the FSSAI layer applies to food-packaged commodities, while packaged-commodity metrology requirements form a separate core layer. Applicability must be represented clearly.",
    "A configurable rule engine lets the implementation track legal changes through rule maintenance instead of embedding each requirement in application code. Actual rule content should be verified against current authoritative notifications.",
  ]);
}

// 5 — Feasibility and viability
{
  const slide = pptx.addSlide("BASE");
  addHeader(slide, "Feasibility & Viability", "The delivery case");
  slide.addShape(pptx.ShapeType.roundRect, { x: 0.6, y: 2.08, w: 5.78, h: 4.38, rectRadius: 0.13, fill: { color: C.white }, line: { color: C.line, width: 1 } });
  slide.addText("FEASIBILITY", { x: 0.93, y: 2.38, w: 2.4, h: 0.23, fontFace: FONT, fontSize: 10, bold: true, charSpacing: 1.3, color: C.blue, margin: 0 });
  const feasibility = [
    { title: "Technical", text: "Combines computer vision, OCR and configurable rule checks." },
    { title: "Operational", text: "Supports inspection workflows, with exceptions routed for review." },
    { title: "Economic", text: "Targets repeat manual effort; value depends on adoption and rollout." },
    { title: "Legal / Regulatory", text: "Keeps rules configurable and final determinations with authorities." },
  ];
  feasibility.forEach((item, i) => {
    const y = 2.91 + i * 0.82;
    slide.addShape(pptx.ShapeType.ellipse, { x: 0.95, y: y + 0.04, w: 0.27, h: 0.27, fill: { color: [C.blue, C.green, C.orange, C.navy2][i], transparency: 88 }, line: { color: [C.blue, C.green, C.orange, C.navy2][i], width: 1 } });
    slide.addText(item.title, { x: 1.4, y, w: 1.58, h: 0.24, fontFace: FONT, fontSize: 12.5, bold: true, color: C.navy, margin: 0 });
    slide.addText(item.text, { x: 3.0, y, w: 3.02, h: 0.43, fontFace: FONT, fontSize: 10.3, color: C.muted, margin: 0, fit: "shrink" });
    if (i < 3) slide.addShape(pptx.ShapeType.line, { x: 1.4, y: y + 0.58, w: 4.58, h: 0, line: { color: C.line, width: 0.8 } });
  });
  slide.addShape(pptx.ShapeType.roundRect, { x: 6.67, y: 2.08, w: 6.04, h: 4.38, rectRadius: 0.13, fill: { color: C.white }, line: { color: C.line, width: 1 } });
  slide.addText("VIABILITY BY STAKEHOLDER", { x: 6.99, y: 2.38, w: 3.8, h: 0.23, fontFace: FONT, fontSize: 10, bold: true, charSpacing: 1.2, color: C.blue, margin: 0 });
  const stakeholders = [
    { title: "Government", color: C.blue, bullets: ["More consistent checks", "Reviewable evidence", "Aggregated insights"] },
    { title: "Manufacturers", color: C.green, bullets: ["Earlier label checks", "Clearer requirements", "Fewer avoidable rework loops"] },
    { title: "Inspectors", color: C.orange, bullets: ["Faster triage", "Structured reports", "Human review stays central"] },
  ];
  stakeholders.forEach((item, i) => {
    const x = 6.98 + i * 1.85;
    slide.addShape(pptx.ShapeType.roundRect, { x, y: 2.88, w: 1.68, h: 3.15, rectRadius: 0.1, fill: { color: C.bg }, line: { color: C.line, width: 0.8 } });
    slide.addShape(pptx.ShapeType.rect, { x, y: 2.88, w: 1.68, h: 0.055, fill: { color: item.color }, line: { color: item.color } });
    slide.addText(item.title, { x: x + 0.14, y: 3.16, w: 1.4, h: 0.44, fontFace: FONT, fontSize: 13, bold: true, color: C.navy, margin: 0, fit: "shrink" });
    item.bullets.forEach((bullet, j) => {
      const by = 3.84 + j * 0.64;
      slide.addShape(pptx.ShapeType.ellipse, { x: x + 0.15, y: by + 0.055, w: 0.09, h: 0.09, fill: { color: item.color }, line: { color: item.color } });
      slide.addText(bullet, { x: x + 0.31, y: by, w: 1.22, h: 0.47, fontFace: FONT, fontSize: 9.4, color: C.muted, margin: 0, fit: "shrink" });
    });
  });
  addFooter(slide, 5);
  addNotes(slide, [
    "Technically, the concept joins image processing, OCR and configurable rules, with review paths for difficult cases. Operationally, it is designed to support—not replace—existing inspection workflows.",
    "Economic value depends on where the system is deployed, the quality of inputs and how staff use it; we therefore frame efficiency as a goal to validate, not a promised saving.",
    "Government teams gain structured, reviewable information; manufacturers can check labels earlier; inspectors can use consistent reports to prioritize work while retaining human judgment.",
  ]);
}

// 6 — Impact and close
{
  const slide = pptx.addSlide("BASE");
  addHeader(slide, "Impact & Key Benefits", "The intended impact");
  const benefits = [
    { text: "Faster Inspection", x: 2.42, y: 1.99, color: C.blue },
    { text: "Improved Accuracy", x: 7.5, y: 1.99, color: C.green },
    { text: "Transparency", x: 0.58, y: 3.12, color: C.orange },
    { text: "Data-Driven Decisions", x: 4.96, y: 3.12, color: C.blue },
    { text: "Digital Records & Traceability", x: 9.34, y: 3.12, color: C.green },
    { text: "Cost Efficiency", x: 2.42, y: 4.25, color: C.orange },
    { text: "Scalability", x: 7.5, y: 4.25, color: C.blue },
  ];
  benefits.forEach((benefit, i) => {
    slide.addShape(pptx.ShapeType.hexagon, { x: benefit.x, y: benefit.y, w: 3.35, h: 0.91, fill: { color: C.white }, line: { color: benefit.color, width: 1.25 } });
    slide.addShape(pptx.ShapeType.ellipse, { x: benefit.x + 0.43, y: benefit.y + 0.28, w: 0.34, h: 0.34, fill: { color: benefit.color, transparency: 88 }, line: { color: benefit.color, transparency: 100 } });
    slide.addText(String(i + 1).padStart(2, "0"), { x: benefit.x + 0.47, y: benefit.y + 0.36, w: 0.26, h: 0.12, fontFace: FONT, fontSize: 7.5, bold: true, color: benefit.color, align: "center", margin: 0 });
    slide.addText(benefit.text, { x: benefit.x + 0.9, y: benefit.y + 0.29, w: 2.05, h: 0.34, fontFace: FONT, fontSize: 12, bold: true, color: C.navy, margin: 0, fit: "shrink" });
  });
  const audiences = [
    { label: "AUTHORITIES", color: C.blue },
    { label: "BUSINESSES", color: C.green },
    { label: "CITIZENS", color: C.orange },
    { label: "SOCIETY", color: C.navy2 },
  ];
  audiences.forEach((item, i) => {
    const x = 0.94 + i * 3.03;
    slide.addShape(pptx.ShapeType.roundRect, { x, y: 5.51, w: 2.58, h: 0.5, rectRadius: 0.16, fill: { color: C.white }, line: { color: C.line, width: 0.8 } });
    slide.addShape(pptx.ShapeType.ellipse, { x: x + 0.24, y: 5.68, w: 0.14, h: 0.14, fill: { color: item.color }, line: { color: item.color } });
    slide.addText(item.label, { x: x + 0.5, y: 5.65, w: 1.85, h: 0.19, fontFace: FONT, fontSize: 9, bold: true, charSpacing: 0.6, color: C.ink, margin: 0 });
  });
  slide.addText("Making compliance faster, fairer and smarter.", { x: 1.0, y: 6.31, w: 11.3, h: 0.38, fontFace: FONT, fontSize: 21, bold: true, color: C.navy, align: "center", margin: 0 });
  addFooter(slide, 6);
  addNotes(slide, [
    "The expected benefits are operational and institutional: faster inspection, more consistent checks, transparent outcomes and better-structured information for decisions.",
    "Digital records can support traceability, while automation may improve cost efficiency and make consistent checks easier to scale. These are intended benefits to assess through pilots and feedback.",
    "Authorities, businesses, citizens and society all benefit when packaged-commodity information is easier to verify and explain. Code Alpha aims to make compliance faster, fairer and smarter.",
  ]);
}

pptx.writeFile({ fileName: "Code_Alpha_Compliance_Checker.pptx" });
