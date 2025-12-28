/**
 * Convert a club name to a URL-friendly slug
 * Example: "Country Club Tennis" -> "country-club-tennis"
 */
function createSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}

module.exports = { createSlug }

