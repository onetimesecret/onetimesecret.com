export function attachLanguageDisclosure(element: HTMLElement): () => void {
  const button = element.querySelector<HTMLButtonElement>(
    "[data-language-toggle]",
  );
  const secondary = element.querySelectorAll<HTMLElement>(
    "[data-language-secondary]",
  );
  if (!button || !secondary.length) return () => {};

  const setExpanded = (expanded: boolean) => {
    secondary.forEach((item) => {
      item.hidden = !expanded;
    });
    button.setAttribute("aria-expanded", String(expanded));
    button.textContent = expanded
      ? button.dataset.showLess!
      : button.dataset.showMore!;
  };
  const toggle = () =>
    setExpanded(button.getAttribute("aria-expanded") !== "true");
  button.addEventListener("click", toggle);
  setExpanded(false);
  button.hidden = false;
  return () => button.removeEventListener("click", toggle);
}
