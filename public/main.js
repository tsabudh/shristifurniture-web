// Finish dots, the full-screen 3D viewer and WhatsApp enquiry links.
// Product names, sizes and current finish live in the #pieces list (one .piece per model);
// material names (Wood, Fabric) come from scripts/build-models.mjs.

// TODO(owner): real WhatsApp number, digits only with country code.
const WHATSAPP_NUMBER = "9779800000000";

const FINISHES = {
  Wood: [["Walnut", "#6b4430"], ["Teak", "#a8723f"], ["Natural oak", "#d6b98c"], ["White wash", "#efe9e0"]],
  Fabric: [["Oatmeal", "#cbbfae"], ["Stone grey", "#8e8b86"], ["Sage", "#8a9a7b"], ["Navy", "#2f3e5c"]],
};

const pieces = new Map([...document.querySelectorAll(".piece")].map((p) => [p.dataset.id, p]));

function enquiryUrl(piece) {
  const name = piece.querySelector("h3").textContent.toLowerCase();
  const text = `Hi, I'm interested in the ${name} in ${piece.dataset.finish}. Could you tell me the price?`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

function colourOf(piece) {
  return FINISHES[piece.dataset.material].find(([name]) => name === piece.dataset.finish)[1];
}

// Tint a model's swappable material; repaint on (re)load since src changes reset it.
function paint(viewer, material, hex) {
  const m = viewer.model?.getMaterialByName(material);
  if (m) m.pbrMetallicRoughness.setBaseColorFactor(hex);
}

function swatchButtons(container, piece, { labelled, onPick }) {
  container.dataset.material = piece.dataset.material; // CSS: wood swatches show grain
  container.replaceChildren(
    ...FINISHES[piece.dataset.material].map(([name, hex]) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = labelled ? "swatch" : "dot";
      b.style.setProperty("--c", hex);
      b.setAttribute("aria-label", name);
      b.setAttribute("aria-pressed", String(name === piece.dataset.finish));
      if (labelled) b.textContent = name;
      b.addEventListener("click", () => {
        for (const other of container.children) other.setAttribute("aria-pressed", String(other === b));
        onPick(name, hex);
      });
      return b;
    }),
  );
}

function syncEnquiryLinks(piece) {
  for (const a of document.querySelectorAll(`[data-enquire="${piece.dataset.id}"]`)) a.href = enquiryUrl(piece);
}

// Compare list: dots recolour the thumbnail and set the finish the viewer opens with.
for (const piece of pieces.values()) {
  const thumb = piece.querySelector("model-viewer");
  thumb.addEventListener("load", () => paint(thumb, piece.dataset.material, colourOf(piece)));
  swatchButtons(piece.querySelector(".dots"), piece, {
    labelled: false,
    onPick: (name, hex) => {
      piece.dataset.finish = name;
      paint(thumb, piece.dataset.material, hex);
      syncEnquiryLinks(piece);
    },
  });
  syncEnquiryLinks(piece);
}

// Full-screen viewer
const dialog = document.getElementById("viewer");
const viewer = dialog.querySelector("model-viewer");
let current = null;

function showFinish() {
  dialog.querySelector(".viewer-finish").textContent = current.dataset.finish;
  dialog.querySelector(".viewer-enquire").href = enquiryUrl(current);
}

function open(id) {
  const piece = pieces.get(id);
  if (!piece) return;
  current = piece;
  const name = piece.querySelector("h3").textContent;
  dialog.querySelector("#viewer-title").textContent = name;
  dialog.querySelector(".viewer-desc").textContent = piece.querySelector(".desc").textContent;
  dialog.querySelector(".viewer-dims").textContent = piece.querySelector(".dims").textContent;
  swatchButtons(dialog.querySelector(".swatches"), piece, {
    labelled: true,
    onPick: (finish, hex) => {
      piece.dataset.finish = finish;
      paint(viewer, piece.dataset.material, hex);
      paint(piece.querySelector("model-viewer"), piece.dataset.material, hex);
      for (const dot of piece.querySelectorAll(".dot")) dot.setAttribute("aria-pressed", String(dot.getAttribute("aria-label") === finish));
      syncEnquiryLinks(piece);
      showFinish();
    },
  });
  showFinish();
  viewer.alt = `3D model of the ${name.toLowerCase()}`;
  viewer.cameraOrbit = piece.querySelector("model-viewer").getAttribute("camera-orbit");
  if (viewer.getAttribute("src") === `/models/${id}.glb`) {
    paint(viewer, piece.dataset.material, colourOf(piece));
    viewer.jumpCameraToGoal();
  } else {
    viewer.src = `/models/${id}.glb`;
  }
  dialog.showModal();
}

viewer.addEventListener("load", () => {
  if (current) paint(viewer, current.dataset.material, colourOf(current));
  viewer.jumpCameraToGoal();
});
dialog.querySelector(".viewer-close").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (e) => {
  if (e.target === dialog) dialog.close(); // click on the backdrop
});
for (const b of document.querySelectorAll("[data-open]")) b.addEventListener("click", () => open(b.dataset.open));

// Gallery paddles
const gallery = document.querySelector(".gallery");
for (const b of document.querySelectorAll("[data-scroll]")) {
  b.addEventListener("click", () => {
    const card = gallery.querySelector(".gcard");
    const step = card ? card.getBoundingClientRect().width + 20 : gallery.clientWidth * 0.8;
    gallery.scrollBy({ left: Number(b.dataset.scroll) * step, behavior: "smooth" });
  });
}
