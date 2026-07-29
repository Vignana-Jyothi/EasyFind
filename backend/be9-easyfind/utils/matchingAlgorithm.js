const stringSimilarity = require("string-similarity");

// Stop words to filter out during tokenization
const STOP_WORDS = new Set([
  "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "arent", "as", "at",
  "be", "because", "been", "before", "being", "below", "between", "both", "but", "by", "cant", "cannot", "could",
  "couldnt", "did", "didnt", "do", "does", "doesnt", "doing", "dont", "down", "during", "each", "few", "for", "from",
  "further", "had", "hadnt", "has", "hasnt", "have", "havent", "having", "he", "hed", "hell", "hes", "her", "here",
  "heres", "hers", "herself", "him", "himself", "his", "how", "hows", "i", "id", "ill", "im", "ive", "if", "in", "into",
  "is", "isnt", "it", "its", "itself", "lets", "me", "more", "most", "mustnt", "my", "myself", "no", "nor", "not", "of",
  "off", "on", "once", "only", "or", "other", "ought", "our", "ours", "ourselves", "out", "over", "own", "same", "shant",
  "she", "shed", "shell", "shes", "should", "shouldnt", "so", "some", "such", "than", "that", "thats", "the", "their",
  "theirs", "them", "themselves", "then", "there", "theres", "these", "they", "theyd", "theyll", "theyre", "theyve",
  "this", "those", "through", "to", "too", "under", "until", "up", "very", "was", "wasnt", "we", "wed", "well", "were",
  "weve", "werent", "what", "whats", "when", "whens", "where", "wheres", "which", "while", "who", "whos", "whom", "why",
  "whys", "with", "wont", "would", "wouldnt", "you", "youd", "youll", "youre", "youve", "your", "yours", "yourself", "yourselves"
]);

// Bidirectional synonym mapping
const SYNONYM_MAP = {
  "wallet": "purse",
  "purse": "wallet",
  "mobile": "phone",
  "phone": "mobile",
  "cellphone": "smartphone",
  "smartphone": "cellphone",
  "bag": "backpack",
  "backpack": "bag",
  "keys": "keychain",
  "keychain": "keys",
  "airpods": "earbuds",
  "earbuds": "airpods"
};

// Common colors and brands to extract from text fields
const COLORS = ["black", "white", "blue", "red", "green", "yellow", "orange", "pink", "purple", "brown", "grey", "gray", "silver", "gold"];
const BRANDS = ["apple", "samsung", "hp", "dell", "lenovo", "sony", "lg", "mi", "realme", "oneplus", "boat", "noise", "jbl", "nike", "adidas", "puma", "fastrack", "casio", "titan"];

/**
 * Normalizes a string: lowercase, trim, remove punctuation, remove duplicate spaces.
 */
function normalizeString(str) {
  if (!str) return "";
  return str
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Extracts keywords, filters stop words, and applies synonym mapping.
 */
function extractAndMapKeywords(text) {
  const normalized = normalizeString(text);
  if (!normalized) return "";
  
  const tokens = normalized.split(" ");
  const keywords = [];
  
  for (const token of tokens) {
    if (!token || STOP_WORDS.has(token)) continue;
    
    // Add original token
    keywords.push(token);
    
    // If a synonym exists, add it to enhance string-similarity matching
    if (SYNONYM_MAP[token]) {
      keywords.push(SYNONYM_MAP[token]);
    }
  }
  
  return keywords.join(" ");
}

/**
 * Extracts a color from text (item name or description)
 */
function extractColor(text) {
  if (!text) return "";
  const normalized = normalizeString(text);
  const words = normalized.split(" ");
  return words.find(w => COLORS.includes(w)) || "";
}

/**
 * Extracts a brand from text (item name or description)
 */
function extractBrand(text) {
  if (!text) return "";
  const normalized = normalizeString(text);
  const words = normalized.split(" ");
  return words.find(w => BRANDS.includes(w)) || "";
}

/**
 * Computes a weighted similarity confidence score (0 to 100) between a lost item and a found item.
 * 
 * Weights:
 * - Category: 30%
 * - Item Name: 25%
 * - Description: 20%
 * - Color: 10%
 * - Location: 10%
 * - Brand: 5%
 * 
 * Incorporates Date Proximity and Synonym-enhanced keyword matching.
 */
function calculateMatchScore(lostItem, foundItem) {
  // 1. Category Similarity (30%)
  const lostCat = extractAndMapKeywords(lostItem.category);
  const foundCat = extractAndMapKeywords(foundItem.category);
  const categorySim = lostCat && foundCat ? stringSimilarity.compareTwoStrings(lostCat, foundCat) : 0;

  // 2. Item Name Similarity (25%)
  const lostName = extractAndMapKeywords(lostItem.itemName);
  const foundName = extractAndMapKeywords(foundItem.itemName);
  const nameSim = lostName && foundName ? stringSimilarity.compareTwoStrings(lostName, foundName) : 0;

  // 3. Description Similarity (20%)
  const lostDesc = extractAndMapKeywords(lostItem.description);
  const foundDesc = extractAndMapKeywords(foundItem.description);
  const descSim = lostDesc && foundDesc ? stringSimilarity.compareTwoStrings(lostDesc, foundDesc) : 0;

  // 4. Color Similarity (10%)
  const lostColor = extractColor(lostItem.itemName + " " + lostItem.description);
  const foundColor = extractColor(foundItem.itemName + " " + foundItem.description);
  let colorSim = 1.0;
  if (lostColor && foundColor) {
    colorSim = lostColor === foundColor ? 1.0 : 0.0;
  } else if (lostColor || foundColor) {
    colorSim = 0.5; // Neutral penalty since only one specified color
  }

  // 5. Location Similarity (10%)
  const lostLoc = extractAndMapKeywords(lostItem.location);
  const foundLoc = extractAndMapKeywords(foundItem.foundLocation);
  const locationSim = lostLoc && foundLoc ? stringSimilarity.compareTwoStrings(lostLoc, foundLoc) : 0;

  // 6. Brand Similarity (5%)
  const lostBrand = extractBrand(lostItem.itemName + " " + lostItem.description);
  const foundBrand = extractBrand(foundItem.itemName + " " + foundItem.description);
  let brandSim = 1.0;
  if (lostBrand && foundBrand) {
    brandSim = lostBrand === foundBrand ? 1.0 : 0.0;
  } else if (lostBrand || foundBrand) {
    brandSim = 0.5; // Neutral penalty
  }

  // Calculate Base Weighted Score
  const baseScore =
    categorySim * 0.30 +
    nameSim * 0.25 +
    descSim * 0.20 +
    colorSim * 0.10 +
    locationSim * 0.10 +
    brandSim * 0.05;

  // 7. Date Proximity Factor
  const lostDate = new Date(lostItem.dateLost || lostItem.createdAt || new Date());
  const foundDate = new Date(foundItem.reportedDate || foundItem.createdAt || new Date());
  const diffTime = Math.abs(lostDate - foundDate);
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  
  // Date factor decays linearly up to 30 days
  const dateProximity = Math.max(0, 1 - (diffDays / 30));
  
  // Apply date proximity decay (max 20% penalty for long time gaps)
  const dateProximityMultiplier = 0.80 + (0.20 * dateProximity);
  const finalScore = baseScore * dateProximityMultiplier;

  // Return confidence score in range 0 - 100
  return Math.min(100, Math.max(0, Math.round(finalScore * 100)));
}

module.exports = {
  normalizeString,
  extractAndMapKeywords,
  extractColor,
  extractBrand,
  calculateMatchScore
};
