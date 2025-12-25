const filterItems = document.querySelectorAll(".filter-menu li");
const container = document.querySelector(".services-container");

// capture original column order so we can restore it when 'All' is selected
const originalCols = container ? Array.from(container.children) : [];

// helper: get map of element -> rect
function getRects(elems) {
  const m = new Map();
  elems.forEach((el) => m.set(el, el.getBoundingClientRect()));
  return m;
}

// FLIP animation: animate elements from their first rects to last rects
function playFLIP(firstRects) {
  const duration = 450;
  const easing = "cubic-bezier(.2,.8,.2,1)";

  // For each element we measured earlier, compute its new rect
  firstRects.forEach((firstRect, el) => {
    const lastRect = el.getBoundingClientRect();
    const dx = firstRect.left - lastRect.left;
    const dy = firstRect.top - lastRect.top;

    if (dx === 0 && dy === 0) return;

    // reset any running transition
    el.style.transition = "none";
    el.style.transform = `translate(${dx}px, ${dy}px)`;
    el.style.willChange = "transform";
  });

  // Force reflow so the browser acknowledges the starting transform
  // eslint-disable-next-line no-unused-expressions
  document.body.offsetHeight;

  // Then animate to natural position (transform -> none)
  firstRects.forEach((_, el) => {
    // apply smooth transition
    el.style.transition = `transform ${duration}ms ${easing}`;
    el.style.transform = "";

    const cleanup = () => {
      el.style.transition = "";
      el.style.willChange = "";
      el.removeEventListener("transitionend", cleanup);
    };

    el.addEventListener("transitionend", cleanup);
  });
}

filterItems.forEach((item) => {
  item.addEventListener("click", () => {
    // active class
    filterItems.forEach((li) => li.classList.remove("active"));
    item.classList.add("active");

    const filter = item.dataset.filter;

    // get the set of columns we will animate
    const colsBefore = Array.from(container.children);
    const firstRects = getRects(colsBefore);

    // MUTATION: apply filtered classes and reorder DOM to desired final state
    const boxes = Array.from(container.querySelectorAll(".box"));

    if (filter === "all") {
      // remove filtered state
      boxes.forEach((card) => {
        card.classList.remove("filtered-out");
        card.setAttribute("aria-hidden", "false");
      });

      // restore original column order
      const frag = document.createDocumentFragment();
      originalCols.forEach((col) => frag.appendChild(col));
      container.appendChild(frag);
    } else {
      // mark boxes to show/hide
      boxes.forEach((card) => {
        const category = card.dataset.category;
        if (category === filter) {
          card.classList.remove("filtered-out");
          card.setAttribute("aria-hidden", "false");
        } else {
          card.classList.add("filtered-out");
          card.setAttribute("aria-hidden", "true");
        }
      });

      // Move matching columns to the front (preserve their relative order)
      const cols = Array.from(container.children);
      const frag = document.createDocumentFragment();
      cols.forEach((col) => {
        const box = col.querySelector(".box");
        if (box && box.dataset.category === filter) frag.appendChild(col);
      });
      if (frag.children.length)
        container.insertBefore(frag, container.firstChild);
    }

    // PLAY FLIP: animate from firstRects -> new positions
    playFLIP(firstRects);
  });
});
