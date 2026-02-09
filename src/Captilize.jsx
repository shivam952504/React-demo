export const toTitleCase = (str = "") =>
  str
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
<h2>{toTitleCase(clientName)}</h2>
