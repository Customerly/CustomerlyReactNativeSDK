export const abstractify = (html?: string): string => {
  if (!html) {
    return "📎 Attachment";
  }

  const decodedHtml = removeHtmlEntities(html)
    .replace(/<\/[a-zA-Z0-9\s]+>/g, "$& ") // Add spaces after closing tags
    .replace(/<br[\s/]*>/g, "$& ") // Add spaces after <br/> tags
    .replace(/(<([^>]+)>)/gi, "") // Remove HTML tags
    .replace(/\s+/g, " "); // Replace multiple spaces with single space

  if (!decodedHtml) {
    return "🖼 Image";
  }

  return decodedHtml.length > 100 ? `${decodedHtml.slice(0, 100)}...` : decodedHtml;
};

const removeHtmlEntities = (html: string): string => {
  const entities: { [key: string]: string } = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#39;": "'",
    "&#x2F;": "/",
    "&#x60;": "`",
    "&#x3D;": "=",
    "&nbsp;": " ",
  };

  return html.replace(/&[^;]+;/g, (entity) => {
    return entities[entity] || entity;
  });
};
