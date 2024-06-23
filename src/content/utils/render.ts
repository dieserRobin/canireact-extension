export function createTextElement(tag: string, className: string, text: string, id?: string): HTMLElement {
    const element = document.createElement(tag);
    element.className = className;
    element.textContent = text;
    id && (element.id = id);
    return element;
}

export function createImageElement(src: string, alt: string, className: string): HTMLElement {
    const element = document.createElement("img");
    element.src = src;
    element.alt = alt;
    element.className = className;
    return element;
}